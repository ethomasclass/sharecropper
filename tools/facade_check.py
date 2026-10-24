"""Draws art/facades.json over each building painting, so you can see that the
wall corners, base, eave, and ridge lines sit where they should.
Writes dist/facade-check/<name>.png. Run: python3 tools/facade_check.py

  red    the wall's left and right corners
  green  the base, where the wall meets the ground
  blue   the eave, the top of the wall
  purple the ridge, the top of the roof
  orange the blank sign board, the porch's end, and see-through holes
"""
import base64, io, json, os, subprocess, sys
from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parent.parent
art_dir = Path(os.environ.get("ART_DIR") or root / "art")
fits = json.loads((art_dir / "facades.json").read_text()) if (art_dir / "facades.json").exists() else {}
run = subprocess.run([sys.executable, str(root / "tools" / "prepare_art.py")], capture_output=True, text=True, check=True)
facades = json.loads(run.stdout)["art"].get("facades", {})
out = root / "dist" / "facade-check"
out.mkdir(parents=True, exist_ok=True)

for name, uri in facades.items():
    img = Image.open(io.BytesIO(base64.b64decode(uri.split(",")[1]))).convert("RGBA")
    sheet = Image.new("RGBA", img.size, (200, 225, 245, 255))   # pale blue shows the see-through parts
    sheet.alpha_composite(img)
    d = ImageDraw.Draw(sheet)
    w, h = img.size
    f = fits.get(name)
    if not f:
        print(f"{name}: no entry in facades.json, so the game guesses")
        continue
    line = max(2, w // 300)
    for u in f["wall"]:
        d.line([(u * w, 0), (u * w, h)], fill=(220, 30, 30), width=line)
    for key, col in (("base", (30, 160, 60)), ("eave", (30, 90, 230)), ("ridge", (150, 50, 200))):
        y = (1 - f[key]) * h
        d.line([(0, y), (w, y)], fill=col, width=line)
    if "sign" in f:
        u0, v0, u1, v1 = f["sign"]
        d.rectangle([u0 * w, (1 - v1) * h, u1 * w, (1 - v0) * h], outline=(240, 140, 20), width=line)
    for u0, v0, u1, v1 in f.get("holes", []):
        d.rectangle([u0 * w, (1 - v1) * h, u1 * w, (1 - v0) * h], outline=(240, 140, 20), width=line)
    for poly in f.get("clear", []):
        d.polygon([(u * w, (1 - v) * h) for u, v in poly], outline=(240, 140, 20), width=line)
    if "porch" in f:
        d.line([(f["porch"] * w, 0), (f["porch"] * w, h)], fill=(240, 140, 20), width=line)
    sheet.convert("RGB").save(out / f"{name}.png")
    print(f"{name}: dist/facade-check/{name}.png")
