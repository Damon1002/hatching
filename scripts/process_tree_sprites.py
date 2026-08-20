import os
import glob
from PIL import Image

def remove_white_background_floodfill(img_path, out_path, tolerance=22, feather=2):
    img = Image.open(img_path).convert('RGBA')
    width, height = img.size
    pixels = img.load()

    # Find external background using BFS flood-fill from all 4 borders
    visited = [[False] * height for _ in range(width)]
    queue = []

    def is_bg(r, g, b):
        return r >= (255 - tolerance) and g >= (255 - tolerance) and b >= (255 - tolerance)

    # Seed all border pixels
    for x in range(width):
        for y in (0, height - 1):
            r, g, b, a = pixels[x, y]
            if is_bg(r, g, b) and not visited[x][y]:
                visited[x][y] = True
                queue.append((x, y))

    for y in range(height):
        for x in (0, width - 1):
            r, g, b, a = pixels[x, y]
            if is_bg(r, g, b) and not visited[x][y]:
                visited[x][y] = True
                queue.append((x, y))

    # 4-way BFS
    head = 0
    while head < len(queue):
        cx, cy = queue[head]
        head += 1

        for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            nx, ny = cx + dx, cy + dy
            if 0 <= nx < width and 0 <= ny < height and not visited[nx][ny]:
                r, g, b, a = pixels[nx, ny]
                if is_bg(r, g, b):
                    visited[nx][ny] = True
                    queue.append((nx, ny))

    # Apply alpha: 0 for flooded background, smooth feathering near edges
    for x in range(width):
        for y in range(height):
            if visited[x][y]:
                pixels[x, y] = (0, 0, 0, 0)
            else:
                r, g, b, a = pixels[x, y]
                # If very close to white threshold, blend alpha smoothly
                brightness = min(r, g, b)
                if brightness > 230:
                    alpha_factor = (255 - brightness) / 25.0
                    alpha = max(0, min(255, int(255 * alpha_factor)))
                    pixels[x, y] = (r, g, b, alpha)

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    img.save(out_path, 'PNG')
    print(f"Saved: {out_path} ({width}x{height})")

def main():
    brain_dir = "/Users/damonsu/.gemini/antigravity-ide/brain/22961f01-839f-4a25-ab79-ac02e5d8c136"
    target_dir = "/Users/damonsu/Desktop/Hatching/assets/plants/broadleaf_oak"

    # Find the latest generated images
    f1_list = sorted(glob.glob(f"{brain_dir}/broadleaf_oak_form1_*.jpg"))
    f2_list = sorted(glob.glob(f"{brain_dir}/broadleaf_oak_form2_*.jpg"))
    f3_list = sorted(glob.glob(f"{brain_dir}/broadleaf_oak_form3_*.jpg"))

    if f1_list:
        remove_white_background_floodfill(f1_list[-1], f"{target_dir}/form_1_basic.png", tolerance=26)
    if f2_list:
        remove_white_background_floodfill(f2_list[-1], f"{target_dir}/form_2_advanced.png", tolerance=26)
    if f3_list:
        remove_white_background_floodfill(f3_list[-1], f"{target_dir}/form_3_majestic.png", tolerance=26)

if __name__ == '__main__':
    main()
