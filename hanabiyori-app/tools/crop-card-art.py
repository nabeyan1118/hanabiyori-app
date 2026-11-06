"""Offline: python3 tools/crop-card-art.py /path/to/card-art-adopted-2026-11-03"""
from pathlib import Path
from PIL import Image
import json
import sys

source = Path(sys.argv[1])
target = Path(__file__).resolve().parents[1] / 'assets/cards'
sheets = [(1, [36, 37, 40, 41, 42, 44]), (2, [24, 25, 28, 29, 32, 33]),
          (3, [0, 1, 4, 5, 8, 9]), (4, [12, 13, 16, 17, 20, 21])]
(target / 'originals').mkdir(parents=True, exist_ok=True)
records = []
for sheet, ids in sheets:
    path = next(source.glob(f'cards-sheet{sheet}_*.jpg'))
    image = Image.open(path).convert('RGB')
    assert image.size == (1290, 860)
    for position, card_id in enumerate(ids):
        x0, x1 = [(190, 495), (495, 795), (795, 1100)][position % 3]
        y0, y1 = [(0, 430), (430, 860)][position // 3]
        # Cream border against the dark green sheet; include one AA pixel outside.
        points = []
        for y in range(y0, y1):
            for x in range(x0, x1):
                r, g, b = image.getpixel((x, y))
                if r > 175 and g > 145 and b > 90 and r > g * 1.03 and g > b * 1.08:
                    points.append((x, y))
        box = (min(x for x, y in points)-1, min(y for x, y in points)-1,
               max(x for x, y in points)+2, max(y for x, y in points)+2)
        card = image.crop(box)
        card.save(target / 'originals' / f'card-{card_id:02}.png', optimize=True)
        # Native crop is already smaller than the requested ~460px; never upscale.
        card.thumbnail((460, 1000), Image.Resampling.LANCZOS)
        output = target / f'card-{card_id:02}.jpg'
        card.save(output, quality=85, optimize=True, progressive=True, subsampling=0)
        records.append(dict(id=card_id, sheet=path.name, position=position+1,
                            box=list(box), size=list(card.size), ratio=card.width/card.height,
                            bytes=output.stat().st_size))
(target / 'crop-manifest.json').write_text(json.dumps(records, ensure_ascii=False, indent=2)+'\n')
print(f'{len(records)} cards; JPEG total {sum(r["bytes"] for r in records)} bytes')
