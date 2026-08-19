from __future__ import annotations

from collections import deque
import json
from pathlib import Path
import shutil

import numpy as np
from PIL import Image, ImageDraw


BASE = Path("/Users/damonsu/.codex/generated_images/01a01449-9042-7162-a8d0-a83a62086b74")
SOURCE = Path("/Users/damonsu/Downloads/red.png")
OUTPUT = Path("/Users/damonsu/Desktop/Hatching/red-dragon-puppet-layers")
CANVAS = (1359, 1158)

LAYERS = [
    {
        "file": "layer_back_wing.png",
        "source": BASE / "exec-58f7c6e5-4291-4b12-8d18-ca1f7d709ca6.png",
        "name": "back_wing",
        "origin": (820, 350),
        "size": (420, 300),
        "pivot": (0.17, 0.27),
        "parent": "neck_and_torso",
        "attachment": "back_shoulder",
        "z": 10,
        "region": "entire concealed inner wing and shoulder root; visible image-right fragment used as reference",
    },
    {
        "file": "layer_tail.png",
        "source": BASE / "exec-d7834840-aaad-4e48-85e4-3b9f0bf55ac5.png",
        "name": "tail",
        "origin": (65, 555),
        "size": (850, 535),
        "pivot": (0.92, 0.48),
        "parent": "neck_and_torso",
        "attachment": "tail_root",
        "z": 20,
        "region": "concealed pelvis root",
    },
    {
        "file": "layer_front_wing.png",
        "source": BASE / "exec-649a131e-9814-4d38-bf76-c5afc8ced4d0.png",
        "name": "front_wing",
        "origin": (215, 350),
        "size": (665, 440),
        "pivot": (0.88, 0.22),
        "parent": "neck_and_torso",
        "attachment": "front_shoulder",
        "z": 25,
        "region": "concealed shoulder anchor",
    },
    {
        "file": "layer_neck_and_torso.png",
        "source": BASE / "exec-830dd4e3-46b5-487e-9fe0-e239a28d2c7a.png",
        "name": "neck_and_torso",
        "origin": (565, 320),
        "size": (625, 815),
        "pivot": (0.55, 0.62),
        "parent": None,
        "attachment": "body_root",
        "z": 30,
        "region": "contours concealed by head, wing roots, hips, and tail root",
    },
    {
        "file": "layer_legs.png",
        "source": BASE / "exec-e78355d2-918e-4d86-a752-7a8dec9308d6.png",
        "name": "legs",
        "origin": (645, 710),
        "size": (570, 420),
        "pivot": (0.50, 0.16),
        "parent": "neck_and_torso",
        "attachment": "hip_center",
        "z": 50,
        "region": "concealed upper thighs and hip overlap",
    },
    {
        "file": "layer_head.png",
        "source": BASE / "exec-0ed825ca-c584-4baa-9cba-273a47342725.png",
        "name": "head",
        "origin": (535, 5),
        "size": (805, 535),
        "pivot": (0.53, 0.84),
        "parent": "neck_and_torso",
        "attachment": "skull_base",
        "z": 60,
        "region": "concealed neck insertion",
    },
]


def remove_checkerboard(image: Image.Image) -> Image.Image:
    """Flood-fill the pale neutral checkerboard from the canvas edges."""
    rgb = np.asarray(image.convert("RGB"))
    maximum = rgb.max(axis=2)
    minimum = rgb.min(axis=2)
    candidate = (maximum >= 195) & ((maximum - minimum) <= 22)
    height, width = candidate.shape
    outside = np.zeros_like(candidate, dtype=bool)
    queue: deque[tuple[int, int]] = deque()

    for x in range(width):
        if candidate[0, x]:
            outside[0, x] = True
            queue.append((0, x))
        if candidate[height - 1, x] and not outside[height - 1, x]:
            outside[height - 1, x] = True
            queue.append((height - 1, x))
    for y in range(height):
        if candidate[y, 0] and not outside[y, 0]:
            outside[y, 0] = True
            queue.append((y, 0))
        if candidate[y, width - 1] and not outside[y, width - 1]:
            outside[y, width - 1] = True
            queue.append((y, width - 1))

    while queue:
        y, x = queue.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < height and 0 <= nx < width and candidate[ny, nx] and not outside[ny, nx]:
                outside[ny, nx] = True
                queue.append((ny, nx))

    alpha = np.where(outside, 0, 255).astype(np.uint8)
    rgba = np.dstack((rgb, alpha))
    return Image.fromarray(rgba, "RGBA")


def trim_with_padding(image: Image.Image, padding: int = 24) -> Image.Image:
    bbox = image.getchannel("A").getbbox()
    if bbox is None:
        raise ValueError("generated layer is empty")
    left, top, right, bottom = bbox
    left = max(0, left - padding)
    top = max(0, top - padding)
    right = min(image.width, right + padding)
    bottom = min(image.height, bottom + padding)
    return image.crop((left, top, right, bottom))


def make_contact_sheet(items: list[tuple[str, Image.Image]]) -> Image.Image:
    cell_w, cell_h = 420, 330
    sheet = Image.new("RGB", (cell_w * 2, cell_h * 3), "#eceff3")
    draw = ImageDraw.Draw(sheet)
    for index, (filename, layer) in enumerate(items):
        tile = Image.new("RGBA", (cell_w, cell_h), "#eceff3")
        thumb = layer.copy()
        thumb.thumbnail((cell_w - 32, cell_h - 58), Image.Resampling.LANCZOS)
        tile.alpha_composite(thumb, ((cell_w - thumb.width) // 2, 10 + (cell_h - 58 - thumb.height) // 2))
        x = (index % 2) * cell_w
        y = (index // 2) * cell_h
        sheet.paste(tile.convert("RGB"), (x, y))
        draw.text((x + 12, y + cell_h - 32), filename, fill="#20242a")
    return sheet


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=False)
    shutil.copy2(SOURCE, OUTPUT / "source.png")
    preview = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    contacts: list[tuple[str, Image.Image]] = []
    manifest_layers = []

    for spec in sorted(LAYERS, key=lambda item: item["z"]):
        cleaned = remove_checkerboard(Image.open(spec["source"]))
        trimmed = trim_with_padding(cleaned)
        final = trimmed.resize(spec["size"], Image.Resampling.LANCZOS)
        final.save(OUTPUT / spec["file"])
        preview.alpha_composite(final, spec["origin"])
        contacts.append((spec["file"], final))
        manifest_layers.append(
            {
                "file": spec["file"],
                "name": spec["name"],
                "parent": spec["parent"],
                "attachment": spec["attachment"],
                "zIndex": spec["z"],
                "originPx": {"x": spec["origin"][0], "y": spec["origin"][1]},
                "pivotNormalized": {"x": spec["pivot"][0], "y": spec["pivot"][1]},
                "reconstructed": True,
                "reconstructedRegion": spec["region"],
            }
        )

    preview.save(OUTPUT / "assembled_preview.png")
    make_contact_sheet(contacts).save(OUTPUT / "contact_sheet.png")
    manifest = {
        "schemaVersion": 1,
        "character": "red_dragon",
        "sourceImage": "source.png",
        "perspectiveConvention": "front/back refer to visual depth; back wing is the partially hidden image-right wing",
        "referenceCanvas": {"width": CANVAS[0], "height": CANVAS[1]},
        "generationMode": "built-in image editing with deterministic checkerboard removal",
        "layers": manifest_layers,
    }
    (OUTPUT / "layer_manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(OUTPUT)


if __name__ == "__main__":
    main()
