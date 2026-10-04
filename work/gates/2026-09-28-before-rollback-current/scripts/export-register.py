"""Export the current building evidence without altering calibration data."""
import csv,json,pathlib
project=pathlib.Path(__file__).resolve().parents[1]
data=json.loads((project/'public/data/campus.json').read_text(encoding='utf8'))
with (project/'BUILDING-REGISTER.csv').open('w',encoding='utf-8-sig',newline='') as fp:
    writer=csv.writer(fp)
    writer.writerow(['对象ID','显示名','原地图名','类别','名称状态','楼层数','高度依据','说明','参考链接'])
    for f in data['buildings']:
        writer.writerow([f['id'],f['displayName'],f['originalName'],f['category'],f['nameStatus'],f['levels'],f['heightBasis'],' '.join([f['nameNote'],f['heightNote']]),' | '.join(s['url'] for s in f['sources'])])
basis={'single-photo':'单体照片','garden-photo':'园区照片风格','inferred':'用途与轮廓估算（待照片核实）','unverified':'尚未核实','map-only':'仅地图线索'}
with (project/'EXTERIOR-REGISTER.csv').open('w',encoding='utf-8-sig',newline='') as fp:
    writer=csv.writer(fp)
    writer.writerow(['对象ID','楼栋','外观依据','墙色','檐口色','玻璃色','屋顶色','屋顶形式','观察记录','估计范围','外观参考页面','入口依据','入口说明','入口参考页面'])
    for f in data['buildings']:
        p=f['exterior']
        writer.writerow([f['id'],f['displayName'],basis[p['basis']],p['wall'],p['trim'],p['glass'],p['roofColor'],p['roofStyle'],'；'.join(p['observations']),p.get('dimensionsNote','通用示意，尚无可靠立面资料'),p.get('source',''),p.get('entryBasis','未建模'),p.get('entryNote',''),' | '.join(p.get('entrySources',[]))])
print('Exported two 300-row registers.')
