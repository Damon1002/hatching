#!/usr/bin/env python3
"""Migrate the existing red-dragon turnaround into the strict v2 package."""

from __future__ import annotations

import json
import shutil
from pathlib import Path

from PIL import Image


WORKSPACE = Path(__file__).resolve().parent.parent
SOURCE_ROOT = WORKSPACE / "red-dragon-turnaround"
OUTPUT_ROOT = WORKSPACE / "red-dragon-turnaround-v2"
PAD = 32
VIEW_IDS = ["front", "three_quarter", "side", "three_quarter_back", "back"]
YAW = {"front": 0, "three_quarter": 45, "side": 90, "three_quarter_back": 135, "back": 180}
LAYER_NAMES = ["back_wing", "tail", "neck_and_torso", "front_wing", "legs", "head"]


def components(alpha: Image.Image, threshold: int = 8) -> list[list[int]]:
    width, height = alpha.size
    mask = bytearray(1 if value > threshold else 0 for value in alpha.getdata())
    seen = bytearray(width * height)
    found: list[list[int]] = []
    for start, value in enumerate(mask):
        if not value or seen[start]:
            continue
        stack = [start]
        seen[start] = 1
        item: list[int] = []
        while stack:
            current = stack.pop()
            item.append(current)
            x, y = current % width, current // width
            neighbors = []
            if x:
                neighbors.append(current - 1)
            if x + 1 < width:
                neighbors.append(current + 1)
            if y:
                neighbors.append(current - width)
            if y + 1 < height:
                neighbors.append(current + width)
            for neighbor in neighbors:
                if mask[neighbor] and not seen[neighbor]:
                    seen[neighbor] = 1
                    stack.append(neighbor)
        found.append(item)
    return sorted(found, key=len, reverse=True)


def clean_layer(source: Path, destination: Path, keep_count: int) -> tuple[int, int]:
    image = Image.open(source).convert("RGBA")
    groups = components(image.getchannel("A"))
    retained = {index for group in groups[:keep_count] for index in group}
    pixels = list(image.getdata())
    cleaned = Image.new("RGBA", image.size, (0, 0, 0, 0))
    cleaned.putdata([pixel if index in retained else (0, 0, 0, 0) for index, pixel in enumerate(pixels)])
    bbox = cleaned.getchannel("A").getbbox()
    if bbox is None:
        raise ValueError(f"empty layer after cleanup: {source}")
    core = cleaned.crop(bbox)
    padded = Image.new("RGBA", (core.width + 32, core.height + 32), (0, 0, 0, 0))
    padded.alpha_composite(core, (16, 16))
    padded.save(destination)
    return bbox[0] - 16, bbox[1] - 16


def pad_master(source: Path, destination: Path) -> None:
    image = Image.open(source).convert("RGBA")
    canvas = Image.new("RGBA", (image.width + PAD * 2, image.height + PAD * 2), (0, 0, 0, 0))
    canvas.alpha_composite(image, (PAD, PAD))
    canvas.save(destination)


def main() -> None:
    if OUTPUT_ROOT.exists():
        raise SystemExit(f"Refusing to overwrite existing folder: {OUTPUT_ROOT}")
    (OUTPUT_ROOT / "views").mkdir(parents=True)
    shutil.copy2(SOURCE_ROOT / "source.png", OUTPUT_ROOT / "original_reference.png")
    canvas = {"width": 1359 + PAD * 2, "height": 1158 + PAD * 2}

    for view_id in VIEW_IDS:
        old_dir = SOURCE_ROOT / "views" / view_id
        new_dir = OUTPUT_ROOT / "views" / view_id
        new_dir.mkdir()
        pad_master(old_dir / "view.png", new_dir / "source.png")
        old_manifest = json.loads((old_dir / "layer_manifest.json").read_text(encoding="utf-8"))
        entries = {item["name"]: item for item in old_manifest["layers"]}
        new_layers = []
        for name in LAYER_NAMES:
            item = entries[name]
            keep_count = 2 if view_id == "front" and name == "tail" else 1
            local_x, local_y = clean_layer(old_dir / item["file"], new_dir / item["file"], keep_count)
            updated = dict(item)
            updated["originPx"] = {
                "x": item["originPx"]["x"] + local_x + PAD,
                "y": item["originPx"]["y"] + local_y + PAD,
            }
            updated["sourceTreatment"] = (
                "visible pixels preserved from the accepted yaw; detached neighboring fragments removed; "
                "legacy concealed completion retained where present"
            )
            new_layers.append(updated)
        manifest = {
            "schemaVersion": 2,
            "character": "red_dragon",
            "sourceImage": "source.png",
            "perspectiveConvention": "front/back names refer to visual depth in this legacy-compatible rig",
            "referenceCanvas": canvas,
            "generationMode": "image-to-image yaw masters with deterministic source-pixel layer cleanup",
            "layers": new_layers,
        }
        (new_dir / "layer_manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    shutil.copy2(OUTPUT_ROOT / "views" / "three_quarter" / "source.png", OUTPUT_ROOT / "source.png")
    turnaround = {
        "schemaVersion": 2,
        "kind": "turnaround",
        "character": "red_dragon",
        "sourceImage": "source.png",
        "sourceViewId": "three_quarter",
        "facing": "right",
        "pose": "seated with both feet grounded and wings raised",
        "referenceCanvas": canvas,
        "groundY": 1189,
        "requiredViewIds": VIEW_IDS,
        "requiredLayerNames": LAYER_NAMES,
        "identityFreeze": {
            "palette": ["ruby-pink body", "cream belly plates", "burgundy wing ribs and dorsal spines"],
            "markings": ["gold-and-black eyes", "cream segmented belly", "single dorsal spine row", "three dark claws per visible front-facing paw"],
            "proportions": ["large baby head", "long upright neck", "rounded seated body", "long curled tail", "paired bat wings"],
            "pose": ["seated", "both feet on shared ground line", "wings raised", "tail curves around the body"],
            "style": ["clean rounded cartoon illustration", "dark burgundy outlines", "soft pink gradients"]
        },
        "asymmetryMap": [],
        "perspectiveConvention": "view ids are camera yaw; front/back layer names refer to visual depth",
        "generationMode": "image-to-image yaw masters chained from the reference; source-pixel layer extraction with reconstructed concealed regions",
        "views": [
            {
                "id": view_id,
                "yawDegrees": YAW[view_id],
                "folder": f"views/{view_id}",
                "viewImage": "source.png",
                "derivedFrom": "accepted adjacent yaw and original reference" if view_id != "three_quarter" else "normalized accepted three-quarter master",
                "reconstructed": view_id != "three_quarter",
                "qaStatus": "accepted",
            }
            for view_id in VIEW_IDS
        ],
    }
    (OUTPUT_ROOT / "turnaround_manifest.json").write_text(json.dumps(turnaround, indent=2) + "\n", encoding="utf-8")
    print(OUTPUT_ROOT)


if __name__ == "__main__":
    main()
