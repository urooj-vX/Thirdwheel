import os
from PIL import Image, ImageFilter
import collections

def remove_connected_white_bg(input_path, output_path, tolerance=16, feather_radius=1):
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size
    pixels = img.load()

    bg_mask = [[False for _ in range(height)] for _ in range(width)]

    def is_near_white(x, y):
        r, g, b, a = pixels[x, y]
        return r >= (255 - tolerance) and g >= (255 - tolerance) and b >= (255 - tolerance)

    queue = collections.deque()

    for x in range(width):
        for y in (0, height - 1):
            if is_near_white(x, y) and not bg_mask[x][y]:
                bg_mask[x][y] = True
                queue.append((x, y))

    for y in range(height):
        for x in (0, width - 1):
            if is_near_white(x, y) and not bg_mask[x][y]:
                bg_mask[x][y] = True
                queue.append((x, y))

    neighbors = [(-1, 0), (1, 0), (0, -1), (0, 1)]
    while queue:
        cx, cy = queue.popleft()
        for dx, dy in neighbors:
            nx, ny = cx + dx, cy + dy
            if 0 <= nx < width and 0 <= ny < height:
                if not bg_mask[nx][ny] and is_near_white(nx, ny):
                    bg_mask[nx][ny] = True
                    queue.append((nx, ny))

    alpha_img = Image.new("L", (width, height), 255)
    alpha_pixels = alpha_img.load()

    for x in range(width):
        for y in range(height):
            if bg_mask[x][y]:
                alpha_pixels[x, y] = 0

    if feather_radius > 0:
        alpha_img = alpha_img.filter(ImageFilter.GaussianBlur(radius=feather_radius))

    # Erode alpha edge by 1px to prevent white fringe
    eroded_alpha = alpha_img.filter(ImageFilter.MinFilter(3))

    img.putalpha(eroded_alpha)

    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)

    img.save(output_path, "PNG")
    print(f"Saved transparent eroded PNG: {output_path} ({img.width}x{img.height})")

def remove_all_white(input_path, output_path, tolerance=14, feather_radius=1):
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size
    pixels = img.load()

    alpha_img = Image.new("L", (width, height), 255)
    alpha_pixels = alpha_img.load()

    threshold = 255 - tolerance
    for x in range(width):
        for y in range(height):
            r, g, b, a = pixels[x, y]
            if r >= threshold and g >= threshold and b >= threshold:
                alpha_pixels[x, y] = 0

    if feather_radius > 0:
        alpha_img = alpha_img.filter(ImageFilter.GaussianBlur(radius=feather_radius))

    # Erode alpha edge by 1px to prevent white fringe
    eroded_alpha = alpha_img.filter(ImageFilter.MinFilter(3))

    img.putalpha(eroded_alpha)

    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)

    img.save(output_path, "PNG")
    print(f"Saved transparent eroded PNG (all white): {output_path} ({img.width}x{img.height})")

def main():
    base_dir = "/Users/uroojnaqvi/ThirdWheel/public/illustrations"

    remove_connected_white_bg(
        os.path.join(base_dir, "Boy Standing.jpeg"),
        os.path.join(base_dir, "boy.png"),
        tolerance=16,
        feather_radius=1
    )

    remove_connected_white_bg(
        os.path.join(base_dir, "Girl Standing.jpeg"),
        os.path.join(base_dir, "girl.png"),
        tolerance=16,
        feather_radius=1
    )

    remove_all_white(
        os.path.join(base_dir, "third-wheel-wordmark.png"),
        os.path.join(base_dir, "wordmark.png"),
        tolerance=14,
        feather_radius=1
    )

if __name__ == "__main__":
    main()



