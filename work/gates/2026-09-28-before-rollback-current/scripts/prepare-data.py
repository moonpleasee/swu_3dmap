import xml.etree.ElementTree as ET
import json, math, pathlib, re

project=pathlib.Path(__file__).resolve().parents[1]
root=ET.parse(project/'data-sources/campus.osm').getroot()
nodes={e.attrib['id']:e for e in root.findall('node')}
ways={e.attrib['id']:e for e in root.findall('way')}
def tags(e): return {t.attrib['k']:t.attrib['v'] for t in e.findall('tag')}
origin=[106.4185,29.8232]
def xy(n):
    return [round((float(n.attrib['lon'])-origin[0])*111320*math.cos(math.radians(origin[1]))*.1,3),round(-(float(n.attrib['lat'])-origin[1])*111320*.1,3)]
def coords(w):return [xy(nodes[n.attrib['ref']]) for n in w.findall('nd') if n.attrib['ref'] in nodes]
boundary=coords(ways['413071891'])
def inside(p,poly):
    x,y=p;v=False
    for a,b in zip(poly,poly[1:]+poly[:1]):
        if (a[1]>y)!=(b[1]>y) and x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]:v=not v
    return v
def center(p):return [round(sum(x[i] for x in p)/len(p),3) for i in (0,1)]
def polygonarea(p):return abs(sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(p,p[1:]+p[:1])))/2
buildings=[];surfaces=[];roads=[];used=set()
def classify(id,t,poly,holes=[]):
    if len(poly)<3 or not inside(center(poly),boundary):return
    typ=None
    if t.get('building') and t['building']!='no':typ='building'
    elif t.get('natural')=='water' or t.get('water') or t.get('leisure')=='swimming_pool':typ='water'
    elif t.get('leisure') in ['pitch','track','stadium','playground']:typ='sport'
    elif t.get('landuse') in ['grass','forest','meadow','recreation_ground'] or t.get('natural') in ['wood','scrub'] or t.get('leisure') in ['garden','park']:typ='green'
    if not typ:return
    f={'id':str(id),'sourceId':str(id).split('_')[0],'name':t.get('name',''),'polygon':poly,'holes':holes,'center':center(poly),'kind':typ,'tags':{k:v for k,v in t.items() if k in ['building','building:levels','height','sport','leisure','natural','amenity','alt_name']}}
    if typ=='building':
        height=re.findall(r'\d+(?:\.\d+)?',t.get('height',''))
        levels=re.findall(r'\d+',t.get('building:levels',''))
        f['height']=round((float(height[0]) if height else max(map(int,levels))*3.3 if levels else 18 if t.get('building')=='dormitory' else 12)*.1,2)
        f['heightBasis']='map-height' if height else 'map-levels' if levels else 'estimated'
        buildings.append(f)
    else:surfaces.append(f)

# Multipolygons preserve courtyards and lake islands; join open member ways.
def rings(members):
    chains=[]
    for m in members:
        if m.attrib.get('ref') in ways:
            chains.append([n.attrib['ref'] for n in ways[m.attrib['ref']].findall('nd')])
    out=[]
    while chains:
        chain=chains.pop(0); changed=True
        while chain[0]!=chain[-1] and changed:
            changed=False
            for j,c in enumerate(chains):
                if chain[-1]==c[0]:chain+=c[1:]
                elif chain[-1]==c[-1]:chain+=list(reversed(c))[1:]
                elif chain[0]==c[-1]:chain=c[:-1]+chain
                elif chain[0]==c[0]:chain=list(reversed(c))[:-1]+chain
                else:continue
                chains.pop(j);changed=True;break
        if chain[0]==chain[-1] and all(n in nodes for n in chain):out.append([xy(nodes[n]) for n in chain])
    return out
for rel in root.findall('relation'):
    t=tags(rel)
    if t.get('type')!='multipolygon':continue
    members=rel.findall('member');outer=rings([m for m in members if m.attrib.get('role') in ['outer','']]);inner=rings([m for m in members if m.attrib.get('role')=='inner'])
    if not any(k in t for k in ['building','natural','landuse','leisure']):continue
    for part,p in enumerate(sorted(outer,key=polygonarea,reverse=True)):
        before=len(buildings)+len(surfaces)
        classify('r'+rel.attrib['id']+('' if part==0 else '_'+str(part+1)),t,p,[h for h in inner if inside(h[0],p)])
        if before!=len(buildings)+len(surfaces):used.update(m.attrib['ref'] for m in members)
for id,w in ways.items():
    if id in used or id=='413071891':continue
    t=tags(w);p=coords(w)
    if len(p)<2:continue
    if t.get('highway') and t.get('highway') not in ['proposed','construction']:
        # Keep only campus-contained line segments, avoiding long outside tails.
        chunks=[];chunk=[]
        for a,b in zip(p,p[1:]):
            if inside(a,boundary) and inside(b,boundary):
                if not chunk:chunk=[a]
                chunk.append(b)
            elif chunk:chunks.append(chunk);chunk=[]
        if chunk:chunks.append(chunk)
        for chunk in chunks:
            highway=t['highway']
            roads.append({'id':id,'name':t.get('name',''),'highway':highway,'surfaceType':'brick' if highway in ['footway','path','steps'] else 'asphalt','points':chunk,'width':.55 if highway in ['footway','path','steps'] else 1.3 if highway in ['service','living_street'] else 1.8})
    elif p[0]==p[-1]:classify(id,t,p)

aerial='https://dwxcbwlgzb.swu.edu.cn/info/1028/1910.htm'
mapurl='https://120th.swu.edu.cn/xyhj/xydt.htm'
spec=[
('350242168','中心图书馆','CENTRAL LIBRARY','文化','中图 图书馆','玻璃与浅色墙面围合出安静的阅读空间，庭院为建筑留下一片绿意。','庭院与立面参考公开航拍，建筑高度暂按体量估算。',aerial),
('843465226','作孚楼 · 29教','ZUOFU BUILDING','教学','29 二十九教 作孚楼','弧形楼身围绕庭院展开，是校园里辨识度很高的一道曲线。','保留开放地图中的弧形轮廓，按地图标注的 5 层估高。',aerial),
('843465238','明德楼 · 25教','MINGDE BUILDING','教学','25 二十五教 明德楼','高耸的主楼与低层体块相接，在树冠之间形成醒目的校园天际线。','按开放地图标注的 19 层估高；立面细节为简化表达。',aerial),
('368589378','光大礼堂','GUANGDA AUDITORIUM','文化','礼堂','崇德湖畔的校园公共建筑，与周围教学楼共同构成文化活动空间。','位置与轮廓来自开放地图，屋顶形态和高度为示意。',mapurl),
('842765847','中心体育馆','SPORTS CENTER','运动','体育中心 体育馆','舒展的场馆轮廓，在绿树与运动场之间展开。','按地图轮廓建模；大跨度屋盖作简化示意，高度估算。','https://www.swu.edu.cn/'),
('r5522696','崇德湖','CHONGDE LAKE','风景','湖 五一所','湖水、树影与岸边小路，构成北碚校园里适合慢慢看的风景。','湖岸轮廓来自开放地图；树位为示意种植。','https://www.swu.edu.cn/info/1147/2076.htm'),
('843421780','弘文图书馆','HONGWEN LIBRARY','文化','北图 北区图书馆 弘文馆','北区的阅读地标，在树荫和教学楼之间，收起校园的喧闹。','位置、轮廓来自开放地图，高度与窗带为示意。',mapurl),
('843421763','敬德楼 · 8教','JINGDE BUILDING','教学','8 八教 敬德楼','北区教学空间的一部分，连接课堂、林荫路与学生园区。','按开放地图标注的 6 层估高，外观作简洁表达。',aerial),
('r11564781','崇实图书馆','CHONGSHI LIBRARY','文化','南图 南区图书馆 崇实馆','南区校园的阅读坐标，与教学楼和学生园区相连。','根据开放地图轮廓建模，保留内部院落；高度为估算。',mapurl),
('368578307','共青团花园','YOUTH GARDEN','风景','花园 团园','道路在花园周围交汇，为教学区留出一片可停留的绿色。','绿地轮廓来自开放地图，植被造型和位置为示意。',aerial),
('368605818','第二运动场','SECOND SPORTS FIELD','运动','二运 第二运动场','跑道围绕草坪展开，给学习之外的校园生活留出开阔空间。','运动场边界来自开放地图，跑道和球场线条为示意。',mapurl),
('r5477110','文俊楼','WENJUN BUILDING','文化','行政楼 南区行政楼 文俊楼','南区校园的公共建筑，面向花园与连接各学院的校道。','行政楼轮廓来自开放地图；名称参照官方校区图。',mapurl),
]
landmarks=[]
for id,name,en,cat,aliases,desc,note,src in spec:
    f=next((f for f in buildings+surfaces if f['id']==id),None)
    if not f:print('MISSING LANDMARK',id,name);continue
    f['landmark']=len(landmarks);f['displayName']=name
    if id=='350242168':f['height']=3.9
    if id=='842765847':f['height']=2.0;f['heightBasis']='estimated'
    landmarks.append({'id':id,'name':name,'en':en,'category':cat,'aliases':aliases,'description':desc,'note':note,'source':src,'center':f['center'],'height':f.get('height',0)})
data={'origin':origin,'boundary':boundary,'buildings':buildings,'surfaces':surfaces,'roads':roads,'landmarks':landmarks,'meta':{'retrieved':'2026-09-21','source':'OpenStreetMap API 0.6','license':'ODbL 1.0','coordinateSystem':'Local metric projection from WGS84, world unit = 10m','terrain':'External DEM terrain: data/terrain.json; inferred level platforms; no campus survey','buildingCount':len(buildings),'estimatedHeights':sum(f['heightBasis']=='estimated' for f in buildings)}}
import runpy
runpy.run_path(str(project/'scripts/enrich-data.py'))['enrich'](data,project)
out=project/'public/data/campus.json';out.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')),encoding='utf8')
print(json.dumps({'buildings':len(buildings),'surfaces':len(surfaces),'roads':len(roads),'landmarks':len(landmarks),'bytes':out.stat().st_size,'bounds':[[min(p[i] for p in boundary),max(p[i] for p in boundary)] for i in [0,1]]},ensure_ascii=False))
