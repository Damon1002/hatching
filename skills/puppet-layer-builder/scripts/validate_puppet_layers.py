#!/usr/bin/env python3
"""Validate a single puppet-layer package or a schema-v2 turnaround."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

try:
    from PIL import Image, ImageChops
except ImportError:
    print("ERROR: Pillow is required (install with: python -m pip install pillow)", file=sys.stderr)
    raise SystemExit(2)


NAME_RE = re.compile(r"^layer_[a-z0-9]+(?:_[a-z0-9]+)*\.png$")
LAYER_NAME_RE = re.compile(r"^[a-z0-9]+(?:_[a-z0-9]+)*$")
VIEW_YAWS = {
    "front": 0,
    "three_quarter": 45,
    "side": 90,
    "three_quarter_back": 135,
    "back": 180,
}
DEFAULT_VIEW_IDS = tuple(VIEW_YAWS)
VALID_FACING = {"left", "right"}
FREEZE_KEYS = ("palette", "markings", "proportions", "pose", "style")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("folder", type=Path, help="Single package folder, or turnaround root")
    return parser.parse_args()


def main() -> int:
    folder = parse_args().folder.resolve()
    if not folder.is_dir():
        print(f"ERROR: not a directory: {folder}", file=sys.stderr)
        return 2
    if (folder / "turnaround_manifest.json").is_file():
        errors, warnings, count = validate_turnaround(folder)
        label = "turnaround"
    else:
        errors, warnings, count, _ = validate_package(folder)
        label = "package"
    for warning in warnings:
        print(f"WARNING: {warning}")
    for error in errors:
        print(f"ERROR: {error}")
    print(f"Checked {label}, {count} layer PNG(s): {len(errors)} error(s), {len(warnings)} warning(s)")
    return 1 if errors else 0


def validate_turnaround(folder: Path) -> tuple[list[str], list[str], int]:
    errors: list[str] = []
    warnings: list[str] = []
    layer_count = 0
    manifest = load_json(folder / "turnaround_manifest.json", "turnaround_manifest.json", errors)
    if not isinstance(manifest, dict):
        return errors, warnings, 0

    if manifest.get("schemaVersion") != 2:
        errors.append("turnaround schemaVersion must be 2")
    if manifest.get("kind") != "turnaround":
        errors.append('turnaround kind must be "turnaround"')
    if manifest.get("sourceImage") != "source.png":
        errors.append("turnaround sourceImage must be source.png")
    if not (folder / "turnaround_sheet.png").is_file():
        errors.append("missing turnaround_sheet.png")
    if manifest.get("facing") not in VALID_FACING:
        errors.append('turnaround facing must be "left" or "right"')

    canvas = manifest.get("referenceCanvas")
    if not valid_canvas(canvas):
        errors.append("turnaround referenceCanvas must contain positive integer width and height")
        canvas = None
    ground_y = manifest.get("groundY")
    if not isinstance(ground_y, int) or (canvas and not 0 <= ground_y < canvas["height"]):
        errors.append("turnaround groundY must be an integer inside referenceCanvas")
        ground_y = None

    required_ids = manifest.get("requiredViewIds")
    if not valid_unique_string_list(required_ids, set(VIEW_YAWS)):
        errors.append("requiredViewIds must be a non-empty unique array of supported view ids")
        required_ids = list(DEFAULT_VIEW_IDS)
    required_layers = manifest.get("requiredLayerNames")
    if not valid_unique_string_list(required_layers, None) or not all(LAYER_NAME_RE.fullmatch(item) for item in required_layers):
        errors.append("requiredLayerNames must be a non-empty unique snake-case string array")
        required_layers = []

    source_view_id = manifest.get("sourceViewId")
    if source_view_id not in required_ids:
        errors.append("sourceViewId must appear in requiredViewIds")
    freeze = manifest.get("identityFreeze")
    if not isinstance(freeze, dict):
        errors.append("identityFreeze must be an object")
    else:
        for key in FREEZE_KEYS:
            value = freeze.get(key)
            if not isinstance(value, list) or not value or not all(isinstance(item, str) and item.strip() for item in value):
                errors.append(f"identityFreeze.{key} must be a non-empty string array")
    if not isinstance(manifest.get("asymmetryMap"), list):
        errors.append("asymmetryMap must be an array")
    for field in ("character", "pose", "perspectiveConvention", "generationMode"):
        if not isinstance(manifest.get(field), str) or not manifest[field].strip():
            errors.append(f"turnaround {field} must be a non-empty string")

    root_source = folder / "source.png"
    if not root_source.is_file():
        errors.append("missing source.png")
    elif canvas:
        inspect_master("root source", root_source, canvas, ground_y, errors, warnings, strict=True)

    views = manifest.get("views")
    if not isinstance(views, list):
        errors.append("turnaround views must be an array")
        return errors, warnings, 0
    listed_ids = [view.get("id") for view in views if isinstance(view, dict)]
    if listed_ids != required_ids:
        errors.append("views ids and order must exactly match requiredViewIds")

    heights: dict[str, int] = {}
    for index, view in enumerate(views):
        label = f"turnaround view {index}"
        if not isinstance(view, dict):
            errors.append(f"{label} must be an object")
            continue
        view_id = view.get("id")
        if view_id not in VIEW_YAWS:
            errors.append(f"{label} has unsupported id: {view_id}")
            continue
        expected_folder = f"views/{view_id}"
        if view.get("yawDegrees") != VIEW_YAWS[view_id]:
            errors.append(f"{view_id}: yawDegrees must be {VIEW_YAWS[view_id]}")
        if view.get("folder") != expected_folder:
            errors.append(f"{view_id}: folder must be {expected_folder}")
        if view.get("viewImage") != "source.png":
            errors.append(f"{view_id}: viewImage must be source.png")
        if view.get("qaStatus") != "accepted":
            errors.append(f"{view_id}: qaStatus must be accepted")
        if not isinstance(view.get("derivedFrom"), str) or not view["derivedFrom"].strip():
            errors.append(f"{view_id}: derivedFrom must be a non-empty string")
        reconstructed = view.get("reconstructed")
        if not isinstance(reconstructed, bool):
            errors.append(f"{view_id}: reconstructed must be a boolean")
        elif view_id == source_view_id and reconstructed:
            errors.append(f"{view_id}: source view must set reconstructed false")
        elif view_id != source_view_id and not reconstructed:
            errors.append(f"{view_id}: generated yaw must set reconstructed true")

        view_dir = folder / expected_folder
        if not view_dir.is_dir():
            errors.append(f"{view_id}: missing folder {expected_folder}")
            continue
        master_path = view_dir / "source.png"
        if not master_path.is_file():
            errors.append(f"{view_id}: missing source.png")
        elif canvas:
            bbox = inspect_master(view_id, master_path, canvas, ground_y, errors, warnings, strict=True)
            if bbox:
                heights[view_id] = bbox[3] - bbox[1]
            if view_id == source_view_id and root_source.is_file() and not images_equal(root_source, master_path):
                errors.append(f"{view_id}: source view is not pixel-identical to root source.png")

        pkg_errors, pkg_warnings, pkg_count, layer_names = validate_package(
            view_dir,
            require_source_name="source.png",
            require_schema2=True,
        )
        layer_count += pkg_count
        errors.extend(f"{view_id}: {item}" for item in pkg_errors)
        warnings.extend(f"{view_id}: {item}" for item in pkg_warnings)
        if required_layers and layer_names != required_layers:
            errors.append(f"{view_id}: layer name order must exactly match requiredLayerNames")
        if canvas:
            layer_manifest = load_json(view_dir / "layer_manifest.json", f"{view_id} layer_manifest.json", errors)
            if isinstance(layer_manifest, dict) and layer_manifest.get("referenceCanvas") != canvas:
                errors.append(f"{view_id}: layer referenceCanvas must match turnaround referenceCanvas")

    if canvas and heights and max(heights.values()) - min(heights.values()) > canvas["height"] * 0.08:
        errors.append("view silhouette heights drift by more than 8% of canvas height")
    return errors, warnings, layer_count


def validate_package(
    folder: Path,
    require_source_name: str | None = None,
    require_schema2: bool = False,
) -> tuple[list[str], list[str], int, list[str]]:
    errors: list[str] = []
    warnings: list[str] = []
    manifest = load_json(folder / "layer_manifest.json", "layer_manifest.json", errors)
    pngs = sorted(folder.glob("layer_*.png"))
    if not pngs:
        errors.append("no layer_*.png files found")
    actual_files = {path.name for path in pngs}
    layer_names: list[str] = []
    files_from_manifest: set[str] = set()
    canvas = None

    if isinstance(manifest, dict):
        schema = manifest.get("schemaVersion")
        if schema not in {1, 2} or (require_schema2 and schema != 2):
            errors.append("manifest schemaVersion must be 2" if require_schema2 else "manifest schemaVersion must be 1 or 2")
        if require_source_name and manifest.get("sourceImage") != require_source_name:
            errors.append(f"manifest sourceImage must be {require_source_name}")
        source_name = manifest.get("sourceImage")
        if not isinstance(source_name, str) or not (folder / source_name).is_file():
            errors.append("manifest sourceImage does not name an existing file")
        canvas = manifest.get("referenceCanvas")
        if not valid_canvas(canvas):
            errors.append("manifest referenceCanvas must contain positive integer width and height")
            canvas = None
        layers = manifest.get("layers")
        if not isinstance(layers, list) or not layers:
            errors.append("manifest layers must be a non-empty array")
        else:
            seen_names: set[str] = set()
            seen_z: set[int] = set()
            roots = 0
            for index, layer in enumerate(layers):
                label = f"manifest layer {index}"
                if not isinstance(layer, dict):
                    errors.append(f"{label} must be an object")
                    continue
                filename = layer.get("file")
                name = layer.get("name")
                if not isinstance(filename, str) or not NAME_RE.fullmatch(filename):
                    errors.append(f"{label} has invalid file")
                elif filename in files_from_manifest:
                    errors.append(f"duplicate manifest filename: {filename}")
                else:
                    files_from_manifest.add(filename)
                if not isinstance(name, str) or not LAYER_NAME_RE.fullmatch(name):
                    errors.append(f"{label} has invalid name")
                elif name in seen_names:
                    errors.append(f"duplicate manifest layer name: {name}")
                else:
                    seen_names.add(name)
                    layer_names.append(name)
                pivot = layer.get("pivotNormalized")
                if not isinstance(pivot, dict) or not all(isinstance(pivot.get(key), (int, float)) and 0 <= pivot[key] <= 1 for key in ("x", "y")):
                    errors.append(f"{label} has invalid pivotNormalized")
                origin = layer.get("originPx")
                if not isinstance(origin, dict) or not all(isinstance(origin.get(key), int) for key in ("x", "y")):
                    errors.append(f"{label} has invalid originPx")
                z_index = layer.get("zIndex")
                if not isinstance(z_index, int):
                    errors.append(f"{label} has invalid zIndex")
                elif z_index in seen_z:
                    errors.append(f"duplicate zIndex: {z_index}")
                else:
                    seen_z.add(z_index)
                parent = layer.get("parent")
                if parent is None:
                    roots += 1
                elif not isinstance(parent, str):
                    errors.append(f"{label} parent must be a layer name or null")
                reconstructed = layer.get("reconstructed")
                if not isinstance(reconstructed, bool):
                    errors.append(f"{label} reconstructed must be a boolean")
                elif reconstructed:
                    for field in ("reconstructedRegion", "sourceTreatment"):
                        if schema == 2 and (not isinstance(layer.get(field), str) or not layer[field].strip()):
                            errors.append(f"{label} reconstructed layer requires {field}")
            if roots != 1:
                errors.append("manifest must contain exactly one root layer with parent null")
            for index, layer in enumerate(layers):
                if isinstance(layer, dict) and layer.get("parent") is not None and layer.get("parent") not in seen_names:
                    errors.append(f"manifest layer {index} parent does not reference a layer name")

    for missing in sorted(files_from_manifest - actual_files):
        errors.append(f"manifest references missing file: {missing}")
    for unlisted in sorted(actual_files - files_from_manifest):
        errors.append(f"layer file is not listed in manifest: {unlisted}")
    for path in pngs:
        inspect_layer_png(path, canvas, manifest, errors, warnings)

    required_artifacts = ["assembled_preview.png", "contact_sheet.png"]
    if require_schema2:
        required_artifacts += ["recomposition_diff.png", "qa_metrics.json"]
    for filename in required_artifacts:
        if not (folder / filename).is_file():
            errors.append(f"missing {filename}")
    if canvas and (folder / "assembled_preview.png").is_file():
        inspect_canvas_image(folder / "assembled_preview.png", canvas, "assembled_preview.png", errors)
    if require_schema2 and (folder / "qa_metrics.json").is_file():
        metrics = load_json(folder / "qa_metrics.json", "qa_metrics.json", errors)
        if isinstance(metrics, dict):
            if metrics.get("sourceImage") != require_source_name:
                errors.append("qa_metrics sourceImage does not match package source")
            if metrics.get("layerCount") != len(layer_names):
                errors.append("qa_metrics layerCount does not match manifest")
    return errors, warnings, len(pngs), layer_names


def inspect_layer_png(path: Path, canvas: Any, manifest: Any, errors: list[str], warnings: list[str]) -> None:
    if not NAME_RE.fullmatch(path.name):
        errors.append(f"invalid layer filename: {path.name}")
    try:
        with Image.open(path) as image:
            if image.format != "PNG" or image.mode != "RGBA":
                errors.append(f"{path.name}: expected RGBA PNG, got {image.format} {image.mode}")
                return
            alpha = image.getchannel("A")
            minimum, maximum = alpha.getextrema()
            if maximum == 0:
                errors.append(f"{path.name}: fully transparent")
            if minimum == 255:
                errors.append(f"{path.name}: has no transparent pixels")
            bbox = alpha.getbbox()
            if bbox and (bbox[0] == 0 or bbox[1] == 0 or bbox[2] == image.width or bbox[3] == image.height):
                errors.append(f"{path.name}: visible pixels touch an image boundary")
            if bbox and canvas and isinstance(manifest, dict):
                entry = next((item for item in manifest.get("layers", []) if isinstance(item, dict) and item.get("file") == path.name), None)
                if entry and isinstance(entry.get("originPx"), dict):
                    x, y = entry["originPx"].get("x"), entry["originPx"].get("y")
                    if isinstance(x, int) and isinstance(y, int):
                        visible = (x + bbox[0], y + bbox[1], x + bbox[2], y + bbox[3])
                        if visible[0] < 0 or visible[1] < 0 or visible[2] > canvas["width"] or visible[3] > canvas["height"]:
                            errors.append(f"{path.name}: registered visible pixels fall outside referenceCanvas")
    except OSError as exc:
        errors.append(f"{path.name}: cannot decode: {exc}")


def inspect_master(
    label: str,
    path: Path,
    canvas: dict[str, int],
    ground_y: int | None,
    errors: list[str],
    warnings: list[str],
    strict: bool,
) -> tuple[int, int, int, int] | None:
    try:
        with Image.open(path) as image:
            if image.format != "PNG" or image.mode != "RGBA":
                errors.append(f"{label}: source master must be an RGBA PNG")
                return None
            if image.size != (canvas["width"], canvas["height"]):
                errors.append(f"{label}: source master is {image.width}x{image.height}, expected {canvas['width']}x{canvas['height']}")
            alpha = image.getchannel("A")
            minimum, maximum = alpha.getextrema()
            if maximum == 0:
                errors.append(f"{label}: source master is fully transparent")
                return None
            if minimum == 255:
                errors.append(f"{label}: source master has no transparent pixels")
            bbox = alpha.getbbox()
            if bbox and (bbox[0] == 0 or bbox[1] == 0 or bbox[2] == image.width or bbox[3] == image.height):
                (errors if strict else warnings).append(f"{label}: opaque pixels touch the canvas boundary")
            if bbox and ground_y is not None:
                drift = abs((bbox[3] - 1) - ground_y)
                if drift > canvas["height"] * 0.02:
                    (errors if strict else warnings).append(f"{label}: ground row drifts from groundY by {drift}px")
            return bbox
    except OSError as exc:
        errors.append(f"{label}: cannot decode source master: {exc}")
        return None


def inspect_canvas_image(path: Path, canvas: dict[str, int], label: str, errors: list[str]) -> None:
    try:
        with Image.open(path) as image:
            if image.size != (canvas["width"], canvas["height"]):
                errors.append(f"{label}: dimensions must match referenceCanvas")
    except OSError as exc:
        errors.append(f"{label}: cannot decode: {exc}")


def images_equal(first: Path, second: Path) -> bool:
    try:
        with Image.open(first) as a, Image.open(second) as b:
            aa, bb = a.convert("RGBA"), b.convert("RGBA")
            return aa.size == bb.size and ImageChops.difference(aa, bb).getbbox() is None
    except OSError:
        return False


def valid_canvas(canvas: Any) -> bool:
    return isinstance(canvas, dict) and all(isinstance(canvas.get(key), int) and canvas[key] > 0 for key in ("width", "height"))


def valid_unique_string_list(value: Any, allowed: set[str] | None) -> bool:
    return isinstance(value, list) and bool(value) and all(isinstance(item, str) and item and (allowed is None or item in allowed) for item in value) and len(value) == len(set(value))


def load_json(path: Path, label: str, errors: list[str]) -> Any:
    if not path.is_file():
        errors.append(f"missing {label}")
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"invalid {label}: {exc}")
        return None


if __name__ == "__main__":
    raise SystemExit(main())
