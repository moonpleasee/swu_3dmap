"""Validate geographic topology prerequisites and traceability for the rendered model."""
import json, math, pathlib, xml.etree.ElementTree as ET

project=pathlib.Path(__file__).resolve().parents[1]
data=json.loads((project/'public/data/campus.json').read_text(encoding='utf8'))
osm=ET.parse(project/'data-sources/campus.osm').getroot()
source_ids={('r' if e.tag=='relation' else '')+e.attrib['id'] for e in osm if e.tag in ['way','relation']}
features=data['buildings']+data['surfaces']
assert len({f['id'] for f in features})==len(features),'Duplicate feature ID'
for f in features:
    assert f['sourceId'] in source_ids, f"Untraceable feature {f['id']}"
    for ring in [f['polygon']]+f['holes']:
        assert len(ring)>=4 and ring[0]==ring[-1],f"Open polygon {f['id']}"
        assert all(len(p)==2 and all(math.isfinite(v) for v in p) for p in ring)
        area=abs(sum(a[0]*b[1]-a[1]*b[0] for a,b in zip(ring,ring[1:])))/2
        assert area>.00001,f"Degenerate polygon {f['id']}"
    if f['kind']=='building':assert 0<f['height']<30,f"Implausible height {f['id']}"
for l in data['landmarks']:
    matches=[f for f in features if f['id']==l['id']]
    assert len(matches)==1 and matches[0]['center']==l['center']
    assert l['source'].startswith('https://') and l['note']
for road in data['roads']:
    assert road['id'] in source_ids and len(road['points'])>=2 and road['width']>0
print(f"PASS: {len(data['buildings'])} buildings, {len(data['surfaces'])} surfaces, {len(data['roads'])} road segments, {len(data['landmarks'])} landmarks")
print('All polygons closed and nondegenerate; all IDs traced to OSM snapshot; all landmark targets resolved.')
