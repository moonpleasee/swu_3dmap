"""Fetch/cache public elevation raster; never change campus building geometry.

Requires Pillow. Run from any directory; subsequent runs use the cached PNG.
The 15 m output spacing is interpolation, NOT a claim of 15 m survey accuracy.
"""
import datetime, hashlib, json, math, pathlib, urllib.request
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[1]
CACHE = ROOT / 'data-sources' / 'terrain'
CACHE.mkdir(exist_ok=True)
data = json.loads((ROOT / 'public/data/campus.json').read_text(encoding='utf8'))
origin = [106.4185, 29.8232]
zoom = 13
step = 1.5
x0 = math.floor(min(p[0] for p in data['boundary']) / step) * step - 3
z0 = math.floor(min(p[1] for p in data['boundary']) / step) * step - 3
cols = math.ceil((max(p[0] for p in data['boundary']) + 3 - x0) / step) + 1
rows = math.ceil((max(p[1] for p in data['boundary']) + 3 - z0) / step) + 1
tiles = {}
sources = []

def tile_pixel(px, py):
    tx, ix = divmod(px, 256)
    ty, iy = divmod(py, 256)
    if (tx, ty) not in tiles:
        url = f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{zoom}/{tx}/{ty}.png'
        file = CACHE / f'{zoom}-{tx}-{ty}.png'
        if not file.exists():
            with urllib.request.urlopen(url, timeout=45) as r:
                file.write_bytes(r.read())
        im = Image.open(file).convert('RGB')
        assert im.size == (256, 256)
        tiles[tx, ty] = im.load()
        sources.append({'url': url, 'file': file.name, 'sha256': hashlib.sha256(file.read_bytes()).hexdigest()})
    r, g, b = tiles[tx, ty][ix, iy]
    return r * 256 + g + b / 256 - 32768

def elevation(x, z):
    lon = origin[0] + x * 10 / (111320 * math.cos(math.radians(origin[1])))
    lat = origin[1] - z * 10 / 111320
    # Raster samples are pixel centers, not tile corners.
    px = (lon + 180) / 360 * 2**zoom * 256 - .5
    py = (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * 2**zoom * 256 - .5
    ix, iy = math.floor(px), math.floor(py)
    dx, dy = px - ix, py - iy
    return round(sum(tile_pixel(ix+a, iy+b) * (dx if a else 1-dx) * (dy if b else 1-dy)
                     for a in (0, 1) for b in (0, 1)), 2)

values = [elevation(x0+c*step, z0+r*step) for r in range(rows) for c in range(cols)]
assert all(0 < v < 1500 for v in values), 'Unexpected or missing elevation values'
output = {'version': 1, 'originWgs84': origin, 'metersPerUnit': 10, 'verticalExaggeration': 1,
          'x0': x0, 'z0': z0, 'step': step, 'cols': cols, 'rows': rows,
          'datumMeters': math.floor(min(values)/10)*10, 'elevations': values,
          'source': {'name': 'Mapzen / AWS Terrain Tiles', 'accessed': str(datetime.date.today()),
                     'url': 'https://registry.opendata.aws/terrain-tiles/', 'tiles': sources,
                     'credit': 'Terrain Tiles / Mapzen; SRTM terrain data courtesy of the U.S. Geological Survey',
                     'nominalSourceResolutionMeters': 30,
                     'note': 'Regional DEM; SRTM-era terrain, not a current campus survey. Resampling and locally inferred level platforms do not add survey detail.'}}
(ROOT/'public/data/terrain.json').write_text(json.dumps(output, ensure_ascii=False, separators=(',', ':')), encoding='utf8')
(CACHE/'manifest.json').write_text(json.dumps({k:v for k,v in output.items() if k!='elevations'}, indent=2, ensure_ascii=False), encoding='utf8')
print(json.dumps({'grid':[cols,rows], 'elevationRangeMeters':[min(values),max(values)], 'datumMeters':output['datumMeters'], 'tiles':sources}, ensure_ascii=False))
