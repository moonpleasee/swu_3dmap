"""Two explicitly matched buildings; preserves every unrelated profile."""
import json,pathlib
root=pathlib.Path(__file__).resolve().parents[1]
read=lambda f:json.loads((root/f).read_text(encoding='utf8'))
profiles=read('data-sources/exterior-profiles.json');calibrations=read('data-sources/building-calibration.json')
common=dict(basis='single-photo',batchRevision='yongxiu-2026-09-23',referenceDate='学校楼宇目录照片，未注明拍摄年份；2026-09-23查阅',wallFinish='tile',roofStyle='flat',facade='regular',frameWidth=.012,bay=.48,windowWidth=.64,windowHeight=.72,base='#92958c',entryBasis='photo-reference',entryFloors=1,entrySteps=3,signAspect=15,entrySignOffset=.015,
 dimensionsNote='平面保留原地图。可见立面、屋顶及入口按对应照片简化；层数为照片估读，层高、背面、构件数量与门位未测绘。',
 entryNote='入口形制参考本栋照片；门扇、台阶数量和精确位置为估计。')
patches={
 '843421765':dict(source='https://www.swu.edu.cn/info/1153/2392.htm',referenceFile='work/next-batch/journalism-2.jpg',wall='#8b918b',trim='#dddace',accent='#8b918b',frame='#e5e3d6',glass='#405759',roofColor='#706d61',roofStyle='hip',roofRise=.32,wallFinish='brick',facade='historic',photoFacade='yongxiu-a',bay=.52,windowWidth=.57,
  roofPlan=dict(angle=-.127,rects=[[-.02,1.96,-.01,.92,.22],[1.76,4.96,-.33,1.34,.36],[4.65,7.57,-.035,.99,.23],[6.61,7.57,-.59,.99,.23]]),
  entry='lanhua-porch',entryWidth=1.48,entryPoint=[40.16,-22.32],porchDepth=.23,entrySign='新闻传媒学院',signColor='#3b463e',signBackground='#d5d1bd',entryStepColor='#96998e',
  observations=['灰砖长条楼体、中央门厅向外突出，约三层','中部较高的灰褐坡屋面与两侧较低翼部屋面，分段屋脊','浅色窗下墙、白色窗框，中央入口薄挑檐和灰色台阶'],
  matchNote='原地图已标新闻传媒学院；照片长条两翼、中央凸部、东端后凸部与该轮廓相符，校园图4教位置及学院地址佐证。'),
 '843465310':dict(source='https://www.swu.edu.cn/info/1153/16911.htm',referenceFile='work/next-batch/journalism-b-2.jpg',wall='#c1b69a',trim='#d8d2be',accent='#a79d84',frame='#666f68',glass='#496266',roofColor='#aaa994',photoFacade='yongxiu-b',
  photoFacadePoints=[[40.50,-28.40],[39.85,-28.05],[38.85,-27.98],[38.02,-27.83],[37.69,-28.02],[37.43,-28.39],[37.37,-28.74],[37.47,-29.03],[38.25,-29.81]],
  entry='glass-canopy',entryWidth=.72,entryPoint=[38.80,-27.97],porchDepth=.14,entrySteps=2,entrySign='阅见书店',signColor='#3a463f',signBackground='#d7d2bd',entryReserveFloors=1,entryStepColor='#a7a99f',
  observations=['浅米色方板外墙、深灰窗框和宽玻璃窗','弧形端部、分层横带及两层露台栏杆','底层书店入口和橱窗；长条后翼及屋顶背面未获完整照片'],
  matchNote='学校B栋照片显示旧出版社弧形端部及长条后翼；在A栋西北侧对应轮廓中，本对象具有相同弧端与斜向长翼。位置为轮廓和相邻关系匹配，非坐标测绘。'),
}
for id,p in patches.items():
 if id in profiles and profiles[id].get('batchRevision')!='yongxiu-2026-09-23':raise RuntimeError('Refusing existing profile '+id)
 p={**common,**p};p['entrySources']=[p['source']];p['dimensionsNote']+=p['matchNote'];profiles[id]=p
 letter='A' if id=='843421765' else 'B';levels=3 if letter=='A' else 5
 c=dict(displayName=f'咏修楼{letter}栋 · 4教',nameStatus='official',nameNote='名称来自学校楼宇目录；'+p['matchNote'],levels=levels,heightBasis='photo-estimate',heightNote=f'照片可见约{levels}层；按每层3.3米估高，坡地露出层、层高及屋顶未实测。',category='教学',aliases=[f'咏修楼{letter}栋',f'第4教学楼{letter}栋','新闻传媒学院'],sources=[dict(title=f'学校楼宇目录 · 咏修楼{letter}栋',url=p['source'])])
 if letter=='B':
  c['name']='咏修楼B栋'
  c['aliases']+=['旧出版社','阅见书店']
  c['sources'].append(dict(title='2021年阅见书店改造消息',url='https://www.swu.edu.cn/info/1197/7774.htm'))
 calibrations[id]=c
for f,d in [('data-sources/exterior-profiles.json',profiles),('data-sources/building-calibration.json',calibrations)]:
 (root/f).write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding='utf8')
print('Patched two matched buildings; no other profiles replaced.')
