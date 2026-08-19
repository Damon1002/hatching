from __future__ import annotations

from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter


SOURCE = Path("/Users/damonsu/Desktop/head.png")
OUTPUT = Path("/Users/damonsu/Desktop/Hatching/head-pieces")


def components(mask: np.ndarray):
    height, width = mask.shape
    seen = np.zeros_like(mask, dtype=bool)
    found = []
    for y, x in zip(*np.nonzero(mask & ~seen)):
        if seen[y, x]:
            continue
        queue = deque([(int(y), int(x))])
        seen[y, x] = True
        xs, ys = [], []
        while queue:
            cy, cx = queue.popleft()
            xs.append(cx)
            ys.append(cy)
            for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
                if 0 <= ny < height and 0 <= nx < width and mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    queue.append((ny, nx))
        if len(xs) >= 80:
            found.append((min(xs), min(ys), max(xs) + 1, max(ys) + 1, len(xs), xs, ys))
    return found


def category(x: float, y: float, w: int, h: int) -> str:
    if y < 480:
        if x < 630:
            return "head-side"
        if x < 1010:
            return "head-front"
        if x < 1370:
            return "head-back"
        return "face-detail"
    if y < 720:
        if x < 420:
            return "body-shell"
        if x < 670:
            return "small-head-side"
        if x < 930:
            return "tail-curl"
        if x < 1110:
            return "neck-piece"
        return "expression"
    if x < 770:
        return "spike"
    if x < 1340:
        return "spike-cluster"
    return "scale"


def main() -> None:
    image = Image.open(SOURCE).convert("RGBA")
    alpha = np.asarray(image.getchannel("A"))
    # Ignore nearly transparent fringe pixels while retaining antialiased edges in final crops.
    boxes = components(alpha >= 24)
    boxes.sort(key=lambda b: ((b[1] + b[3]) // 2 // 45, (b[0] + b[2]) // 2))
    OUTPUT.mkdir(parents=True, exist_ok=True)

    counts: dict[str, int] = {}
    rows = ["filename,x,y,width,height,opaque_pixels"]
    previews = []
    for left, top, right, bottom, area, xs, ys in boxes:
        cx, cy = (left + right) / 2, (top + bottom) / 2
        kind = category(cx, cy, right - left, bottom - top)
        counts[kind] = counts.get(kind, 0) + 1
        suffix = f"-{counts[kind]:02d}" if kind in {"face-detail", "expression", "spike", "spike-cluster", "scale"} else ""
        filename = f"{kind}{suffix}.png"
        pad = 8
        crop_box = (max(0, left - pad), max(0, top - pad), min(image.width, right + pad), min(image.height, bottom + pad))
        crop = image.crop(crop_box)
        component_mask = Image.new("L", crop.size, 0)
        mask_pixels = component_mask.load()
        for px, py in zip(xs, ys):
            mask_pixels[px - crop_box[0], py - crop_box[1]] = 255
        # Restore the component's antialiased fringe, while excluding nearby assets.
        component_mask = component_mask.filter(ImageFilter.MaxFilter(7))
        original_alpha = crop.getchannel("A")
        isolated_alpha = Image.fromarray(
            np.where(np.asarray(component_mask) > 0, np.asarray(original_alpha), 0).astype(np.uint8)
        )
        crop.putalpha(isolated_alpha)
        crop.save(OUTPUT / filename)
        rows.append(f"{filename},{crop_box[0]},{crop_box[1]},{crop.width},{crop.height},{area}")
        previews.append((filename, crop))

    (OUTPUT / "manifest.csv").write_text("\n".join(rows) + "\n", encoding="utf-8")

    thumb_w, thumb_h = 180, 150
    sheet = Image.new("RGBA", (thumb_w * 5, thumb_h * ((len(previews) + 4) // 5)), "white")
    draw = ImageDraw.Draw(sheet)
    for index, (filename, crop) in enumerate(previews):
        thumb = crop.copy()
        thumb.thumbnail((thumb_w - 16, thumb_h - 32), Image.Resampling.LANCZOS)
        x = (index % 5) * thumb_w + (thumb_w - thumb.width) // 2
        y = (index // 5) * thumb_h + 4
        sheet.alpha_composite(thumb, (x, y))
        draw.text(((index % 5) * thumb_w + 5, (index // 5 + 1) * thumb_h - 22), filename, fill="black")
    sheet.convert("RGB").save(OUTPUT / "contact-sheet.jpg", quality=92)
    print(f"Exported {len(previews)} pieces to {OUTPUT}")


if __name__ == "__main__":
    main()
