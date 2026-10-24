"""Prepares your art for the game and prints it as JSON data URIs.

Sprites and props (art/sprites, art/props) are trimmed to their visible
edges, so feet sit on the ground; given a cream paper edge, like the drawn
cutouts; and resized to at most 1024 px tall. Scenes and cards are resized
to at most 1600 px wide. Everything is saved as WebP to keep the game small.
Name a file something.noedge.png to skip the paper edge.

Image generators rarely make transparent backgrounds, so a cutout can also
be made on a solid magenta (#FF00FF) background. The build removes it.
"""
import base64, io, json, os, sys
from pathlib import Path
from PIL import Image, ImageFilter
try:
    import numpy as np
except ImportError:
    np = None

root = Path(__file__).resolve().parent.parent
art_dir = Path(os.environ.get("ART_DIR") or root / "art")
slots = json.loads((root / "tools" / "art-slots.json").read_text())
fits = json.loads((art_dir / "facades.json").read_text()) if (art_dir / "facades.json").exists() else {}
out, notes = {}, []
CREAM = (246, 239, 223, 255)

def key_out(img, top_only=False):
    """Remove a solid magenta background, with a soft edge and no pink fringe.
    Hill and tree strips and building fronts may have ground along the bottom,
    so they check the top corners."""
    if np is None:
        return img, False
    a = np.asarray(img).astype(np.float32)
    rgb = a[..., :3]
    corners = np.array([rgb[2, 2], rgb[2, -3]] if top_only else [rgb[2, 2], rgb[2, -3], rgb[-3, 2], rgb[-3, -3]])
    # a corner counts as magenta when red and blue are high and green is low;
    # generators paint it anywhere from hot pink to a dull violet
    pink = (np.minimum(corners[:, 0], corners[:, 2]) - corners[:, 1] > 90) & (np.abs(corners[:, 0] - corners[:, 2]) < 70)
    if pink.sum() < len(corners) - (0 if top_only else 1):
        return img, False
    # how far each pixel is from magenta: magenta is high red and blue, low green.
    # Generators paint it brighter or duller, so match this image's own background.
    magenta = np.clip(np.minimum(rgb[..., 0], rgb[..., 2]) - rgb[..., 1], 0, 255) / 255
    cm = np.clip(np.minimum(corners[:, 0], corners[:, 2]) - corners[:, 1], 0, 255) / 255
    bg = float(np.median(cm))
    alpha = np.clip((bg * 0.85 - magenta) / (bg * 0.45), 0, 1)
    # pull the pink cast out of every pixel; the palette has no magenta in it
    spill = np.clip(np.minimum(rgb[..., 0], rgb[..., 2]) - rgb[..., 1], 0, None)
    rgb[..., 0] -= spill
    rgb[..., 2] -= spill
    a[..., :3] = np.clip(rgb, 0, 255)
    a[..., 3] = np.minimum(a[..., 3], alpha * 255)
    # JPEG noise along the frame edge would survive as a stray line
    if not top_only:
        e = 3
        a[:e, :, 3] = 0; a[-e:, :, 3] = 0; a[:, :e, 3] = 0; a[:, -e:, 3] = 0
    return Image.fromarray(a.astype(np.uint8), "RGBA"), True

def cut_hole(img, hole):
    """Make a dark painted opening see-through. `hole` is [left, bottom, right, top]
    as fractions of the trimmed picture; only the dark pixels inside it go, so
    the cut follows the painted edges of the posts and walls around it."""
    if np is None:
        return img
    a = np.asarray(img).copy()
    h, w = a.shape[:2]
    x0, x1 = int(hole[0] * w), int(hole[2] * w)
    y0, y1 = int((1 - hole[3]) * h), int((1 - hole[1]) * h)
    part = a[y0:y1, x0:x1].astype(np.float32)
    lum = part[..., 0] * 0.3 + part[..., 1] * 0.59 + part[..., 2] * 0.11
    keep = np.clip((lum - 95) / 30, 0, 1)        # dark goes, light stays, soft between
    part[..., 3] = np.minimum(part[..., 3], keep * 255)
    a[y0:y1, x0:x1] = part.astype(np.uint8)
    return Image.fromarray(a, "RGBA")

def paper_edge(img):
    w, h = img.size
    pad = max(4, round(h * 0.012))
    canvas = Image.new("RGBA", (w + pad * 2, h + pad * 2), (0, 0, 0, 0))
    canvas.paste(img, (pad, pad), img)
    alpha = canvas.getchannel("A").point(lambda a: 255 if a > 40 else 0)
    size = pad * 2 + 1
    grown = alpha.filter(ImageFilter.MaxFilter(size if size % 2 else size + 1))
    edge = Image.new("RGBA", canvas.size, CREAM)
    edge.putalpha(grown)
    edge.alpha_composite(canvas)
    return edge

for kind in ("sprites", "props", "facades", "textures", "backdrops", "scenes", "cards"):
    folder = art_dir / kind
    if not folder.exists():
        continue
    for f in sorted(folder.iterdir()):
        if f.suffix.lower() not in (".png", ".webp", ".jpg", ".jpeg"):
            continue
        name = f.name.split(".")[0]
        if name not in slots[kind]:
            notes.append(f"skipped art/{kind}/{f.name}: no slot named '{name}' (see art/README.md)")
            continue
        img = Image.open(f).convert("RGBA")
        if kind in ("facades", "backdrops") and img.getchannel("A").getextrema()[0] == 255:
            img, keyed = key_out(img, top_only=True)
            if keyed:
                notes.append(f"art/{kind}/{f.name}: removed the magenta background")
        if kind == "facades":
            # trim to the painted building, so its bottom edge is the ground line
            box = img.getchannel("A").point(lambda a: 255 if a > 96 else 0).filter(ImageFilter.MinFilter(5)).getbbox()
            if box:
                img = img.crop(box)
            for hole in fits.get(name, {}).get("holes", []):
                img = cut_hole(img, hole)
        if kind == "textures" and img.width != img.height:
            notes.append(f"art/{kind}/{f.name} is not square; textures should be 1:1 and seamless")
        if kind in ("facades", "textures", "backdrops"):
            limit = 1024 if kind == "textures" else 2048
            if max(img.size) > limit:
                k = limit / max(img.size)
                img = img.resize((round(img.width * k), round(img.height * k)), Image.LANCZOS)
        elif kind in ("sprites", "props"):
            if img.getchannel("A").getextrema()[0] == 255:
                img, keyed = key_out(img)
                if keyed:
                    notes.append(f"art/{kind}/{f.name}: removed the magenta background")
            box = img.getchannel("A").point(lambda a: 255 if a > 96 else 0).filter(ImageFilter.MinFilter(5)).getbbox()
            if box:
                img = img.crop(box)
            if img.height > 1024:
                img = img.resize((round(img.width * 1024 / img.height), 1024), Image.LANCZOS)
            if ".noedge" not in f.name:
                img = paper_edge(img)
            if img.getchannel("A").getextrema()[0] == 255:
                notes.append(f"art/{kind}/{f.name} has no transparent background, so it will stand in the world as a rectangle")
        elif img.width > 1600:
            img = img.resize((1600, round(img.height * 1600 / img.width)), Image.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, "WEBP", quality=86, method=5)
        out.setdefault(kind, {})[name] = "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode()
        notes.append(f"art/{kind}/{f.name} -> {img.width}x{img.height}, {len(buf.getvalue()) // 1024} KB")

print(json.dumps({"art": out, "notes": notes}))
