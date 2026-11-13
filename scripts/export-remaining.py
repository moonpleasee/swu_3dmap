import json,csv,pathlib
root=pathlib.Path(__file__).resolve().parents[1]
data=json.loads((root/'public/data/campus.json').read_text(encoding='utf8'))
pending=[f for f in data['buildings'] if f['exterior']['basis'] not in ('single-photo','garden-photo')]
registers=root/'data-sources/registers'
registers.mkdir(parents=True,exist_ok=True)
with (registers/'REMAINING-BUILDINGS.csv').open('w',encoding='utf-8-sig',newline='') as fp:
    writer=csv.writer(fp);writer.writerow(['对象ID','显示名','名称状态','下一步','现有来源'])
    for f in pending:
        todo=('先确认具体楼名及位置，再匹配单体照片；不能用邻楼照片套用' if f['nameStatus']=='unresolved' else '继续查找能匹配本栋的外观照片；当前已有独立估算配置，仍待照片核实')
        writer.writerow([f['id'],f['displayName'],f['nameStatus'],todo,' | '.join(s['url'] for s in f['sources'])])
print('Exported',len(pending),'unfinished buildings; not a claim that all were researched this turn.')
