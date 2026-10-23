"""Prepares your art for the game and prints it as JSON data URIs.

Sprites and props (art/sprites, art/props) are trimmed to their visible
edges, so feet sit on the ground; given a cream paper edge, like the drawn
cutouts; and resized to at most 1024 px tall. Scenes and cards are resized
to at most 1600 px wide. Everything is saved as WebP to keep the game small.
Name a file something.noedge.png to skip the paper edge.
"""
import base64, io, json, sys
from pathlib import Path
from PIL import Image, ImageFilter

root = Path(__file__).resolve().parent.parent
slots = json.loads((root / "tools" / "art-slots.json").read_text())
out, notes = {}, []
CREAM = (246, 239, 223, 255)

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

for kind in ("sprites", "props", "scenes", "cards"):
    folder = root / "art" / kind
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
        if kind in ("sprites", "props"):
            box = img.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox()
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
