#!/usr/bin/env python3
"""Render deterministic QA artifacts for one puppet-layer package."""

from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path
from typing import Any

try:
    from PIL import Image, ImageChops, ImageDraw, ImageEnhance
except ImportError:
    print("ERROR: Pillow is required (install with: python -m pip install pillow)", file=sys.stderr)
    raise SystemExit(2)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("folder", type=Path, help="Folder containing layer_manifest.json")
    return parser.parse_args()


def fail(message: str) -> int:
    print(f"ERROR: {message}", file=sys.stderr)
    return 2


def load_rgba(path: Path) -> Image.Image:
    with Image.open(path) as image:
        return image.convert("RGBA")


def paste_registered(canvas: Image.Image, layer: Image.Image, x: int, y: int) -> None:
    left = max(0, x)
    top = max(0, y)
    right = min(canvas.width, x + layer.width)
    bottom = min(canvas.height, y + layer.height)
    if left >= right or top >= bottom:
        return
    crop = layer.crop((left - x, top - y, right - x, bottom - y))
    canvas.alpha_composite(crop, (left, top))


def checkerboard(size: tuple[int, int], cell: int = 16) -> Image.Image:
    image = Image.new("RGB", size, "#eef1f4")
    draw = ImageDraw.Draw(image)
    for y in range(0, size[1], cell):
        for x in range(0, size[0], cell):
            if (x // cell + y // cell) % 2:
                draw.rectangle((x, y, min(x + cell - 1, size[0] - 1), min(y + cell - 1, size[1] - 1)), fill="#dfe4e8")
    return image


def make_contact_sheet(items: list[tuple[str, Image.Image]], out: Path) -> None:
    columns = min(3, max(1, len(items)))
    rows = math.ceil(len(items) / columns)
    cell_w, cell_h, label_h, pad = 420, 320, 30, 14
    sheet = Image.new("RGB", (columns * cell_w, rows * (cell_h + label_h)), "#f4f6f8")
    draw = ImageDraw.Draw(sheet)
    for index, (name, image) in enumerate(items):
        col, row = index % columns, index // columns
        x0, y0 = col * cell_w, row * (cell_h + label_h)
        available = (cell_w - pad * 2, cell_h - pad * 2)
        scale = min(available[0] / image.width, available[1] / image.height, 1.0)
        thumb = image.resize((max(1, round(image.width * scale)), max(1, round(image.height * scale))), Image.Resampling.LANCZOS)
        bg = checkerboard((cell_w, cell_h))
        bg.paste(thumb, ((cell_w - thumb.width) // 2, (cell_h - thumb.height) // 2), thumb)
        sheet.paste(bg, (x0, y0))
        draw.text((x0 + pad, y0 + cell_h + 7), name, fill="#1c232b")
    sheet.save(out)


def difference_metrics(source: Image.Image, assembled: Image.Image) -> tuple[Image.Image, dict[str, Any]]:
    diff = ImageChops.difference(source, assembled)
    histogram = diff.histogram()
    channel_pixels = source.width * source.height * 4
    absolute_sum = sum((index % 256) * count for index, count in enumerate(histogram))
    rms_sum = sum(((index % 256) ** 2) * count for index, count in enumerate(histogram))
    changed = sum(1 for pixel in diff.getdata() if pixel != (0, 0, 0, 0))
    visual = ImageEnhance.Contrast(diff).enhance(2.0)
    return visual, {
        "meanAbsoluteError255": round(absolute_sum / channel_pixels, 4),
        "rootMeanSquareError255": round(math.sqrt(rms_sum / channel_pixels), 4),
        "changedPixelFraction": round(changed / (source.width * source.height), 6),
    }


def main() -> int:
    folder = parse_args().folder.resolve()
    manifest_path = folder / "layer_manifest.json"
    if not manifest_path.is_file():
        return fail(f"missing {manifest_path}")
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        return fail(f"invalid layer_manifest.json: {exc}")

    canvas_spec = manifest.get("referenceCanvas")
    if not isinstance(canvas_spec, dict) or not all(isinstance(canvas_spec.get(key), int) and canvas_spec[key] > 0 for key in ("width", "height")):
        return fail("manifest referenceCanvas is invalid")
    canvas_size = (canvas_spec["width"], canvas_spec["height"])
    source_name = manifest.get("sourceImage", "source.png")
    source_path = folder / source_name
    if not source_path.is_file():
        return fail(f"missing source master: {source_path}")
    source = load_rgba(source_path)
    if source.size != canvas_size:
        return fail(f"source master is {source.width}x{source.height}, expected {canvas_size[0]}x{canvas_size[1]}")

    entries = manifest.get("layers")
    if not isinstance(entries, list) or not entries:
        return fail("manifest layers must be a non-empty array")
    assembled = Image.new("RGBA", canvas_size, (0, 0, 0, 0))
    contact_items: list[tuple[str, Image.Image]] = []
    for entry in sorted(entries, key=lambda item: item.get("zIndex", 0)):
        filename = entry.get("file")
        origin = entry.get("originPx")
        if not isinstance(filename, str) or not isinstance(origin, dict):
            return fail("every layer needs file and originPx")
        path = folder / filename
        if not path.is_file():
            return fail(f"missing {path}")
        layer = load_rgba(path)
        paste_registered(assembled, layer, int(origin["x"]), int(origin["y"]))
        contact_items.append((filename, layer))

    assembled.save(folder / "assembled_preview.png")
    make_contact_sheet(contact_items, folder / "contact_sheet.png")
    diff, metrics = difference_metrics(source, assembled)
    diff.save(folder / "recomposition_diff.png")
    metrics.update({
        "schemaVersion": 1,
        "sourceImage": source_name,
        "layerCount": len(entries),
        "referenceCanvas": canvas_spec,
        "note": "Numerical difference assists visual QA; generated concealed anatomy can make nonzero values valid."
    })
    (folder / "qa_metrics.json").write_text(json.dumps(metrics, indent=2) + "\n", encoding="utf-8")
    print(folder)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
