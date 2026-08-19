#!/usr/bin/env python3
"""Compose turnaround_sheet.png from a turnaround folder's accepted source masters."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw
except ImportError:
    print("ERROR: Pillow is required (install with: python -m pip install pillow)", file=sys.stderr)
    raise SystemExit(2)


VIEW_ORDER = ("front", "three_quarter", "side", "three_quarter_back", "back")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("folder", type=Path, help="Turnaround folder with turnaround_manifest.json")
    return parser.parse_args()


def main() -> int:
    folder = parse_args().folder.resolve()
    manifest_path = folder / "turnaround_manifest.json"
    if not manifest_path.is_file():
        print(f"ERROR: missing {manifest_path}", file=sys.stderr)
        return 2
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    listed = {item["id"]: item for item in manifest.get("views", []) if isinstance(item, dict) and "id" in item}
    ordered_ids = [view_id for view_id in VIEW_ORDER if view_id in listed] + [
        view_id for view_id in listed if view_id not in VIEW_ORDER
    ]
    if not ordered_ids:
        print("ERROR: turnaround manifest has no views", file=sys.stderr)
        return 2

    cells: list[tuple[str, Image.Image]] = []
    for view_id in ordered_ids:
        view_entry = listed[view_id]
        image_name = view_entry.get("viewImage", "source.png")
        path = folder / "views" / view_id / image_name
        if not path.is_file():
            print(f"ERROR: missing {path}", file=sys.stderr)
            return 2
        cells.append((view_id, Image.open(path).convert("RGBA")))

    thumb_h = 360
    pad = 16
    label_h = 28
    thumbs: list[tuple[str, Image.Image]] = []
    for view_id, image in cells:
        scale = thumb_h / image.height
        thumbs.append((view_id, image.resize((max(1, int(image.width * scale)), thumb_h), Image.Resampling.LANCZOS)))

    cell_w = max(image.width for _, image in thumbs) + pad * 2
    sheet = Image.new("RGB", (cell_w * len(thumbs), thumb_h + label_h + pad * 2), "#eceff3")
    draw = ImageDraw.Draw(sheet)
    for index, (view_id, image) in enumerate(thumbs):
        x = index * cell_w
        sheet.paste(image, (x + (cell_w - image.width) // 2, pad), image)
        draw.text((x + pad, pad + thumb_h + 6), view_id, fill="#20242a")

    out = folder / "turnaround_sheet.png"
    sheet.save(out)
    print(out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
