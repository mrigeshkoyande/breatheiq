import os
from PIL import Image

def generate_derivatives():
    source_logo = os.path.join("Media", "BreatheIQ Clean Air Logo.png")
    out_dir = os.path.join("frontend", "public")
    os.makedirs(out_dir, exist_ok=True)

    if not os.path.exists(source_logo):
        print(f"[ERROR] Source logo not found at {source_logo}")
        return

    print(f"Reading master logo: {source_logo}")
    with Image.open(source_logo) as img:
        img_rgba = img.convert("RGBA")

        # 1. Full Logo (WebP and quantized PNG <= 60 KB)
        logo_400 = img_rgba.resize((400, 400), Image.Resampling.LANCZOS)
        logo_webp_path = os.path.join(out_dir, "logo.webp")
        logo_png_path = os.path.join(out_dir, "logo.png")
        logo_400.save(logo_webp_path, "WEBP", quality=85)
        
        logo_png_quantized = logo_400.quantize(colors=256)
        logo_png_quantized.save(logo_png_path, "PNG", optimize=True)
        print(f"Saved {logo_webp_path}: {os.path.getsize(logo_webp_path) / 1024:.2f} KB")
        print(f"Saved {logo_png_path}: {os.path.getsize(logo_png_path) / 1024:.2f} KB")

        # 2. Square Logo Mark (128x128)
        logo_mark = img_rgba.resize((128, 128), Image.Resampling.LANCZOS)
        mark_webp_path = os.path.join(out_dir, "logo-mark.webp")
        mark_png_path = os.path.join(out_dir, "logo-mark.png")
        logo_mark.save(mark_webp_path, "WEBP", quality=85)
        logo_mark.quantize(colors=128).save(mark_png_path, "PNG", optimize=True)
        print(f"Saved {mark_webp_path}: {os.path.getsize(mark_webp_path) / 1024:.2f} KB")
        print(f"Saved {mark_png_path}: {os.path.getsize(mark_png_path) / 1024:.2f} KB")

        # 3. Favicon & Apple Touch Icon
        apple_icon = img_rgba.resize((180, 180), Image.Resampling.LANCZOS)
        apple_path = os.path.join(out_dir, "apple-touch-icon.png")
        apple_icon.quantize(colors=128).save(apple_path, "PNG", optimize=True)

        fav_32 = img_rgba.resize((32, 32), Image.Resampling.LANCZOS)
        fav_32_path = os.path.join(out_dir, "favicon-32.png")
        fav_32.save(fav_32_path, "PNG", optimize=True)

        fav_ico_path = os.path.join(out_dir, "favicon.ico")
        fav_icon_base = img_rgba.resize((48, 48), Image.Resampling.LANCZOS)
        fav_icon_base.save(fav_ico_path, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
        print(f"Saved {fav_ico_path}: {os.path.getsize(fav_ico_path) / 1024:.2f} KB")

        # 4. OpenGraph Preview Image (1200 x 630 on canvas #F8FAF7)
        og_bg = Image.new("RGBA", (1200, 630), (248, 250, 247, 255))
        logo_og = img_rgba.resize((480, 480), Image.Resampling.LANCZOS)
        og_bg.paste(logo_og, ((1200 - 480) // 2, (630 - 480) // 2), logo_og)
        og_path = os.path.join(out_dir, "og-image.webp")
        og_bg.save(og_path, "WEBP", quality=85)
        print(f"Saved {og_path}: {os.path.getsize(og_path) / 1024:.2f} KB")

if __name__ == "__main__":
    generate_derivatives()
