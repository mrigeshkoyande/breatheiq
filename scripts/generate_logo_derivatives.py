"""Generate web, icon, and OpenGraph logo assets from the master brand image."""

import os

from PIL import Image


def _save_logo_pair(img_rgba: Image.Image, out_dir: str, stem: str, size: int, colors: int) -> None:
    """Save WebP and quantized PNG derivatives at ``size``x``size`` px."""
    resized = img_rgba.resize((size, size), Image.Resampling.LANCZOS)
    webp_path = os.path.join(out_dir, f"{stem}.webp")
    png_path = os.path.join(out_dir, f"{stem}.png")
    resized.save(webp_path, "WEBP", quality=85)
    resized.quantize(colors=colors).save(png_path, "PNG", optimize=True)
    print(f"Saved {webp_path}: {os.path.getsize(webp_path) / 1024:.2f} KB")
    print(f"Saved {png_path}: {os.path.getsize(png_path) / 1024:.2f} KB")


def _save_icons_and_og(img_rgba: Image.Image, out_dir: str) -> None:
    """Save favicon, touch icon, and OpenGraph canvas derivatives."""
    img_rgba.resize((180, 180), Image.Resampling.LANCZOS).quantize(colors=128).save(
        os.path.join(out_dir, "apple-touch-icon.png"), "PNG", optimize=True
    )
    img_rgba.resize((32, 32), Image.Resampling.LANCZOS).save(
        os.path.join(out_dir, "favicon-32.png"), "PNG", optimize=True
    )
    fav_ico_path = os.path.join(out_dir, "favicon.ico")
    img_rgba.resize((48, 48), Image.Resampling.LANCZOS).save(
        fav_ico_path, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)]
    )
    print(f"Saved {fav_ico_path}: {os.path.getsize(fav_ico_path) / 1024:.2f} KB")

    og_bg = Image.new("RGBA", (1200, 630), (248, 250, 247, 255))
    logo_og = img_rgba.resize((480, 480), Image.Resampling.LANCZOS)
    og_bg.paste(logo_og, ((1200 - 480) // 2, (630 - 480) // 2), logo_og)
    og_path = os.path.join(out_dir, "og-image.webp")
    og_bg.save(og_path, "WEBP", quality=85)
    print(f"Saved {og_path}: {os.path.getsize(og_path) / 1024:.2f} KB")


def generate_derivatives() -> None:
    """Export all web-optimized brand logo derivatives into ``frontend/public``."""
    source_logo = os.path.join("Media", "BreatheIQ Clean Air Logo.png")
    out_dir = os.path.join("frontend", "public")
    os.makedirs(out_dir, exist_ok=True)
    if not os.path.exists(source_logo):
        print(f"[ERROR] Source logo not found at {source_logo}")
        return
    print(f"Reading master logo: {source_logo}")
    with Image.open(source_logo) as img:
        img_rgba = img.convert("RGBA")
        _save_logo_pair(img_rgba, out_dir, "logo", 400, 256)
        _save_logo_pair(img_rgba, out_dir, "logo-mark", 128, 128)
        _save_icons_and_og(img_rgba, out_dir)


if __name__ == "__main__":
    generate_derivatives()
