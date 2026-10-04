"""Targeted, repeatable patch for ten previously unverified buildings.
Never replaces the complete profile file or touches other profiles.
"""
import json,pathlib
root=pathlib.Path(__file__).resolve().parents[1]
profiles_file=root/'data-sources/exterior-profiles.json'
calibration_file=root/'data-sources/building-calibration.json'
profiles=json.loads(profiles_file.read_text(encoding='utf8'))
calibrations=json.loads(calibration_file.read_text(encoding='utf8'))
campus=json.loads((root/'public/data/campus.json').read_text(encoding='utf8'))
features={f['id']:f for f in campus['buildings']}
sina='https://k.sina.cn/article_2739362700_a3475b8c019001kbi.html'
aerial='https://dwxcbwlgzb.swu.edu.cn/info/1028/1910.htm'
animal='https://zcgs.swu.edu.cn/cjrh/dwyy.htm'
hotel='https://law.swu.edu.cn/rcpy/jxjy2/gbpx/hqbz/zshj.htm'
renovation='https://xdhqjt.swu.edu.cn/info/1059/4361.htm'
note='仅照片可见立面有外观依据；背面、窗数、构件尺寸和入口朝向未实测，定位沿用原地图。'
patches={
 '368577143':dict(wall='#e1e1d8',trim='#e5e5dc',glass='#293a69',accent='#5f7970',roofColor='#bdc3bd',photoFacade='badminton',entry='colonnade',columns=2,columnColor='#506d5d',columnRadius=.045,entryWidth=2.5,entryFloors=1,entryPoint=[-6.15,60.89],entrySteps=4,entryStepColor='#985744',entrySign='羽毛球馆',signColor='#a68b44',signBackground='#e3e1d8',porchDepth=.42,observations=['白色小砖立面、宽厚平顶檐口','上部成组深蓝窗、下部入口两根绿纹柱','宽白门廊和红褐台阶'],referenceFile='sina-alumni-14.jpg'),
 '304932138':dict(wall='#748c96',trim='#a7bbc3',glass='#3f5964',accent='#829daa',roofColor='#91a9b4',specialModel='twin-vault',bodyHeight=.36,roofStyle='barrel',photoFacade='curtain-canteen',entry='double-bank',entryWidth=2.3,entryFloors=1,entryPoint=[-78.93,75.82],entrySteps=1,porchDepth=.12,entrySign='网球馆',vaultFootprint=[[-79.4,67.756],[-73.949,69.562],[-76.216,76.753],[-81.649,74.898],[-79.4,67.756]],observations=['并排双筒拱形金属屋顶','蓝灰色弧形端墙、沿屋面细肋','下部深色玻璃门窗带'],referenceFile='sina-alumni-18.jpg'),
 '368589387':dict(wall='#ddcdb0',trim='#ede7d8',glass='#6c898f',accent='#6fa6bf',roofColor='#8a9995',photoFacade='blue-canteen',entry='curved-canopy',entryWidth=1.35,entryFloors=1.5,entryReserveFloors=2,entryPoint=[-31.2,33.40],entrySteps=9,porchDepth=.55,entryRailings=True,entryStepColor='#885442',entrySign='楠园学生一食堂',canopyColor='#9fa9a5',observations=['浅米黄色小砖墙、浅蓝柱网和横向分带','白框宽窗、较高内凹门厅','银灰色弧边雨棚、红褐色宽台阶'],referenceFile='sina-alumni-24.jpg'),
 '368578312':dict(wall='#d7d5bf',trim='#e3dfca',glass='#55756e',accent='#9a7c70',roofColor='#bd9a8b',photoFacade='canteen',entry='double-bank',entryWidth=2.3,entryFloors=1.1,entryPoint=[-24.157,43.291],entrySteps=3,porchDepth=.25,entryRailings=True,entrySign='楠园学生二食堂',observations=['浅米色小砖墙、粉褐色顶边','入口两组玻璃门、中间石色柱','宽门楣、低台阶和金属栏杆；照片只覆盖入口局部'],referenceFile='sina-alumni-25.jpg'),
 '843421757':dict(wall='#b48666',trim='#c6c9c3',frame='#768b88',glass='#4f7770',accent='#ad744e',roofColor='#a5aca2',photoFacade='curtain-canteen',entry='glass-canopy',entryWidth=2.4,entryFloors=1.1,entryPoint=[37.10,8.0],entrySteps=5,porchDepth=.12,entryStepColor='#969d94',entrySign='李园学生食堂',canopyColor='#aeb5ad',observations=['大幅蓝绿色玻璃幕墙、浅灰竖向柱','砖橙色端墙','沿街玻璃门和连续浅灰台阶；不复制旧商业广告'],referenceFile='sina-alumni-29.jpg'),
 '843465284':dict(wall='#c59d8b',trim='#e4e3d6',glass='#66878c',accent='#b88b79',roofColor='#aa9888',photoFacade='canteen',ac=True,entry='glass-canopy',entryWidth=1.5,entryFloors=1.1,entryPoint=[33.95,-63.39],entrySteps=2,porchDepth=.40,entrySign='橘园学生食堂',canopyColor='#838e7d',observations=['粉橘色瓷砖墙、白色成组横窗','入口薄钢架雨棚','窗间外挂机；照片能辨识三层窗带'],referenceFile='sina-alumni-32.jpg'),
 '843421755':dict(wall='#d3c6a6',trim='#bec5b3',glass='#405e54',accent='#4c7e68',roofColor='#989c8d',photoFacade='shops',entry='glass-canopy',entryWidth=.5,entryFloors=1,entryPoint=[38.012,9.614],entrySteps=1,porchDepth=.20,observations=['低矮连续店面、细柱支撑的绿色与蓝色遮棚','分间玻璃门和小招牌位置','照片内树木、商户名称和临时物品不作为当前实景复制'],referenceFile='sina-alumni-40.jpg'),
 '840970010':dict(wall='#bb8c76',trim='#ded6b9',frame='#637d69',glass='#58977f',accent='#b0826c',roofColor='#aaa893',photoFacade='animal',entry='glass-canopy',entryWidth=1.0,entryFloors=1.1,entryReserveFloors=2,entryPoint=[-99.714,109.99],entrySteps=3,porchDepth=.34,entrySign='教学动物医院',canopyColor='#99ae9e',observations=['入口弧形绿色反光玻璃、米色侧墙','顶部格栅挑檐、玻璃门上方薄雨棚','两侧红褐墙；总层数与入口精确朝向待核'],source=animal,referenceDate='页面未注明照片年份',referenceFile='animal-hospital-3.jpg'),
 '371876808':dict(wall='#deded2',trim='#e3e4d9',frame='#bbbeb2',glass='#718583',accent='#94988b',roofColor='#9da59a',photoFacade='hotel',entry='glass-canopy',entryWidth=.8,entryFloors=1.25,entryPoint=[-23.741,78.627],entrySteps=8,porchDepth=.16,doorFrame='#b3a072',entryStepColor='#a5a89d',entrySign='兰苑宾馆',signColor='#c4aa66',signBackground='#3e4842',observations=['入口白色小砖弧形墙面和挑檐','深色石门套、金色框玻璃门','灰色宽台阶；照片没有覆盖整栋，其余立面仅采用相近墙色'],source=hotel,referenceDate='页面未注明照片年份',referenceFile='lanyuan-3.jpg'),
 '842765847':dict(wall='#737e78',trim='#c1c9c0',glass='#354f50',accent='#5c6c69',roofColor='#a2afad',roofStyle='segmented',specialModel='segmented-arena',bodyHeight=.38,entry='glass-canopy',entryWidth=.75,entryFloors=1,entryPoint=[21.39,30.48],entrySteps=4,porchDepth=.24,observations=['灰银色分瓣折面外壳、深色竖向分缝','浅弧同心圆顶盖，替换原普通半球屋顶','下部玻璃环带、外圈檐廊与细柱；瓣数和门位按航拍简化估计'],source=aerial,referenceDate='2022年航拍',referenceFile='campus-photographer-3.jpg',entryBasis='inferred'),
}
for id,patch in patches.items():
    existing=profiles.get(id)
    if existing and existing.get('batchRevision')!='remaining-2026-09-23':
        raise RuntimeError(f'Refusing to overwrite existing calibrated profile: {id}')
    p=dict(basis='single-photo',batchRevision='remaining-2026-09-23',source=sina,referenceDate='2017-05-06发布',roofStyle='flat',wallFinish='tile',facade='regular',bay=.65,windowWidth=.77,windowHeight=.72,frameWidth=.012,entryBasis='photo-reference',dimensionsNote=note,entryNote='门廊、门窗和台阶参考可见照片；位置按原轮廓估计，未取得门位测绘。')
    p.update(patch)
    p.update(signAspect=15,entrySignOffset=.025)
    if id=='368577143':p['entrySignOffset']=-.015
    if id=='842765847':p.update(bodyHeight=.14,entryHeight=.40)
    p['dimensionsNote']=p['referenceDate']+'。'+p['dimensionsNote']
    p['entrySources']=[p['source']]
    if id in ['368589387','843421757']:
        p['dimensionsNote']+='2026年后勤新闻提及改造计划，未取得改造后完整外立面，当前采用2017年参考形制。'
        p['entrySources'].append(renovation)
    if id=='368578312':p['dimensionsNote']+='已知2018年有装修改造，本次门厅仍基于2017年照片，当前样貌待新照校正。'
    if id=='842765847':p['entryNote']='航拍可确认檐廊和玻璃环带；门扇数量、入口位置与台阶为估计。'
    profiles[id]=p
    c=dict(sources=[{'title':'逐栋外观参考 · '+p['referenceDate'],'url':p['source']}])
    if id=='842765847':c['heightNote']='地图标注1层，大跨场馆总高暂沿用20米示意；不是按普通层高换算，屋盖厚度与各分段高度未实测。'
    if id in ['368577143','304932138','842765847']:c['category']='运动'
    if id in ['368577143','368589387','843465284']:
        c.update(levels=2 if id=='368577143' else 3,heightBasis='photo-estimate',heightNote='按参考照片可见立面约'+('2' if id=='368577143' else '3')+'层处理；非完整测绘，体育馆净高和遮挡楼层仍有不确定性。')
    if id=='840970010':c.update(aliases=['教学动物医院','重庆立欧动物医院'],nameNote='资产公司页面确认西南大学教学动物医院位于8号门内；沿用地图动物医院轮廓，入口方向未实测。')
    calibrations[id]=c
profiles_file.write_text(json.dumps(profiles,ensure_ascii=False,indent=2),encoding='utf8')
calibration_file.write_text(json.dumps(calibrations,ensure_ascii=False,indent=2),encoding='utf8')
print('Patched exactly',len(patches),'previously unverified building profiles.')
