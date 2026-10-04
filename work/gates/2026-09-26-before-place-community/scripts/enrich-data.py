"""Apply explicit researched claims, retaining uncertainty and original OSM tags."""
import json,pathlib,re,collections

def enrich(data,project):
    by={f['id']:f for f in data['buildings']+data['surfaces']}
    # These two ways share the same outline, the newer one adds a stair projection.
    # Keep the named object and preserve both source IDs instead of drawing two blocks.
    a,b=by['843421743'],by['925243984']
    a['polygon']=b['polygon'];a['height']=b['height'];a['tags']['building:levels']='7';a['heightBasis']='map-levels'
    a['sourceIds']=[a['sourceId'],b['sourceId']];a['geometryNote']='合并两条重叠的李园4舍轮廓，保留较完整的楼梯间外形。'
    data['buildings'].remove(b)
    calibrations=json.loads((project/'data-sources/building-calibration.json').read_text(encoding='utf8'))
    groups={'桃园':'2434','李园':'2433','橘园':'2435','杏园':'2432','梅园':'2438','竹园':'2436','茶园':'3870','楠园':'2437','榕园':'2430'}
    digits={'一':'1','二':'2','三':'3','四':'4','五':'5','六':'6','七':'7','八':'8','九':'9','十':'10','十一':'11','十二':'12','十三':'13'}
    renames={'843465303':('杏园',1),'843465304':('杏园',2),'843465308':('杏园',3),'843465307':('杏园',4),'843465299':('杏园',5),'843465305':('杏园',6),'843465306':('杏园',7),'843465309':('杏园',8),'r11661636':('茶园',1),'840830756':('茶园',2),'840830755':('茶园',3),'840830754':('茶园',4),'840830753':('茶园',5),'840830760':('茶园',6)}
    palettes={'杏园':('#d89a7d','#905e4b'),'橘园':('#d0a48c','#aca796'),'梅园':('#e3d6b9','#b2b8a8'),'桃园':('#e5dbcc','#aaa99c'),'李园':('#e4dfd0','#afb9ac'),'楠园':('#e6d6bf','#b9baa9'),'茶园':('#deceb0','#b4b6a3'),'竹园':('#dfc7ac','#bab29f')}
    for f in data['buildings']:
        original=f['name'];f['originalName']=original;f['aliases']=[original] if original else []
        f['nameStatus']='map' if original else 'unresolved'
        f['nameNote']='沿用开放地图标注，尚未逐栋完成名称与坐标的现场核验。'
        f['displayName']=re.sub(r'^西南大学','',original)
        f['category']='宿舍' if f['tags'].get('building')=='dormitory' else '教学' if f['tags'].get('building') in ['university','college','construction'] else '生活'
        f['sources']=[{'title':'OpenStreetMap · 原始轮廓与标注','url':'https://www.openstreetmap.org/'+('relation/'+f['sourceId'][1:] if f['sourceId'].startswith('r') else 'way/'+f['sourceId'])}]
        floors=re.findall(r'\d+',f['tags'].get('building:levels',''))
        f['levels']=max(map(int,floors)) if floors else None
        f['heightNote']='地图标注 '+f['tags'].get('building:levels','')+' 层；模型按每层约 3.3 米估高。' if floors else '缺少可靠层数资料，当前采用示意高度。'
        if f['heightBasis']=='map-height':f['heightNote']='采用地图标注的 '+f['tags']['height']+' 米高度；未独立测量。'
        if f['id'] in calibrations:
            patch=calibrations[f['id']];old=f['sources'];aliases=f['aliases'];f.update(patch);f['sources']=patch.get('sources',[])+old;f['aliases']=list(dict.fromkeys(aliases+patch.get('aliases',[])))
            if patch.get('levels'):f['height']=round(patch['levels']*(.36 if f['id']=='350242168' else .33),2)
        if f['category']=='宿舍':
            m=re.match(r'(桃园|李园|橘园|梅园|楠园|竹园)([一二三四五六七八九十]+)舍',original)
            group,num=(m[1],int(digits[m[2]])) if m else (None,None)
            if f['id'] in renames:group,num=renames[f['id']]
            if group:
                f['dormGroup']=group;f['displayName']=f'{group}{num}舍';f['aliases'] += [f'{group}{num}栋',f'{group}{num}号楼']
                f['sources'].insert(0,{'title':group+' · 学校学生园区目录','url':f'https://www.swu.edu.cn/info/1154/{groups[group]}.htm'})
                f['nameStatus']='official';f['nameNote']='园区名称与舍号参照学校目录；楼栋坐标沿用开放地图。'
                wall,roof=palettes[group];f['appearance']={'wall':wall,'roof':'hip' if group=='杏园' and num>=3 else 'flat','roofColor':roof,'facade':'balcony'}
                f['appearanceNote']='参考园区官方照片提取墙面、屋顶和阳台风格；园区照片未必对应本栋，细部仍为示意。'
                if f['id'] in renames:f['nameNote']+=' 原名：'+original+'。'
                if original in ['竹园七舍','竹园八舍']:
                    f['nameStatus']='conflict';f['displayName']=original+'（旧标）';f['nameNote']='原竹园A—F已改称茶园1—6舍；本栋原7/8舍的新园区归属未找到明确对照，暂保留旧标。'
            else:f['appearance']={'wall':'#dfd7c3','roof':'flat','roofColor':'#b7bead','facade':'balcony'}
        if not f['displayName']:
            typ={'dormitory':'宿舍','residential':'住宅','apartments':'住宅','service':'附属建筑','greenhouse':'温室','university':'教学建筑','office':'办公建筑'}.get(f['tags'].get('building'),'建筑')
            f['displayName']=f'{typ} · 待核名 {f["id"][-4:]}'
            f['nameNote']='未找到能可靠对应此轮廓的名称。末四位为地图对象编号，不是学校楼号。'
        if f['id'] in ['840863405','840863426']:
            f['nameStatus']='conflict';f['displayName']='楠园4舍（位置待核） '+f['id'][-3:];f['nameNote']='地图将两栋不同建筑都标为楠园四舍，现有资料不足以裁定，保留冲突提示。'
        if f['id']=='842727329':f['displayName']='物业管理中心';f['nameNote']='由地图英文名 Property Management Centre, S.W.U 翻译。'
        if f['id']=='846878949':f['displayName']='磁共振实验室';f['nameNote']='由地图英文名 MRI Laboratory 翻译。'
        if f['tags'].get('building')=='greenhouse':f['height']=.48;f['heightBasis']='estimated';f['levels']=1;f['heightNote']='温室低矮体量按约4.8米示意，未测量。';f['appearance']={'wall':'#abc4b9','roof':'hip','roofColor':'#b8cfca','facade':'glass'}
        number=re.search(r'第?(\d+)教',f['displayName'])
        if number:
            n=int(number[1]);zh='零一二三四五六七八九'
            chinese=zh[n] if n<10 else ('十' if n<20 else zh[n//10]+'十')+(zh[n%10] if n%10 else '')
            f['aliases'] += [f'{n}教',f'{chinese}教',f'第{chinese}教学楼']
    fieldNames={'843421786':'第一运动场','368577140':'第三运动场','368577141':'第四运动场','304932139':'第五运动场','842727313':'第六运动场'}
    for f in data['surfaces']:
        if f['id'] in fieldNames:
            f['displayName']=fieldNames[f['id']];f['category']='运动';f['nameStatus']='map';f['aliases']=[f['name'],fieldNames[f['id']][1]+'运'];f['height']=0
            f['sources']=[{'title':'学校校园地图 · 运动场布局','url':'https://120th.swu.edu.cn/xyhj/xydt.htm'}]
            f['nameNote']='名称与相对位置参照校园地图，场地轮廓来自开放地图。';f['appearanceNote']='第二运动场以外的场地仍为简化平面与标线，未逐场完成看台建模。'
    for l in data['landmarks']:
        f=by[l['id']]
        if f['kind']=='building':
            l.update(name=f['displayName'],height=f['height'],note=f['heightNote']+' '+f.get('appearanceNote',''),source=f['sources'][0]['url'])
            f['category']=l['category'];l['aliases']=' '.join(f['aliases']+[l['aliases']])
        if l['id']=='843465226':l['en']='BANYUE BUILDING';l['aliases']=l['aliases'].replace('作孚楼','')
        if l['id']=='368605818':
            l['description']='按独立的场地外界、跑道和足球场轮廓重建，加入阶梯看台、顶棚与球场标线。'
            l['note']='蓝紫色跑道参考2026年校运会照片；看台与膜棚参考2019年全景。道数、台阶数、顶棚尺寸为示意，未取得施工图。'
            l['source']='https://www.swu.edu.cn/info/1197/27757.htm'
            f['sources']=[{'title':'2026年校运会 · 跑道近照','url':l['source']},{'title':'2019年校运会 · 看台与顶棚全景','url':'https://www.swu.edu.cn/info/1197/4683.htm'}]
    exterior=json.loads((project/'data-sources/exterior-profiles.json').read_text(encoding='utf8'))
    dormLooks={
        '杏园':{'wall':'#d6a381','trim':'#ece0c9','accent':'#b97658','glass':'#61787d','roofColor':'#9c5144','facade':'dorm-window','ac':True,'observations':['粉橘色墙面、白色水平分缝','红褐色坡屋顶、端部山花','白框成组窗和外置空调']},
        '李园':{'wall':'#ded3bc','trim':'#e9e1cb','accent':'#c9b79d','glass':'#5b6e70','roofColor':'#838779','facade':'balcony','balcony':'rounded','ac':True,'observations':['浅色弧形外挑阳台','竖向栏杆和白色阳台边','浅米黄墙面']},
        '橘园':{'wall':'#c58c71','trim':'#e5d6ba','accent':'#ae7059','glass':'#50676b','roofColor':'#747c70','facade':'balcony','balcony':'rooms','ac':True,'observations':['红橘色墙面和浅色柱网','连续的凹入阳台、室外空调','浅色阳台栏板']},
        '梅园':{'wall':'#d2b599','trim':'#e1d8c4','accent':'#bca18a','glass':'#456371','roofColor':'#646f65','facade':'balcony','balcony':'rooms','ac':True,'observations':['浅粉米色墙面、浅色框架','退台式屋面和金属栏杆','窗边空调、竖向玻璃楼梯间']},
        '茶园':{'wall':'#d2c5aa','trim':'#e2d9c3','accent':'#b8a885','glass':'#506972','roofColor':'#8b9080','facade':'balcony','balcony':'rooms','observations':['米黄色墙面和深色窗','阳台与楼层线脚；园区图不一定对应本栋']},
        '竹园':{'wall':'#d2b198','trim':'#e6d7be','accent':'#ad8b75','glass':'#506b72','roofColor':'#92927f','facade':'balcony','balcony':'rooms','observations':['暖色墙面与浅色框架；旧标楼栋归属仍待核实']},
        '楠园':{'wall':'#dfc6a7','trim':'#e7dcc3','accent':'#b9967d','glass':'#546d70','roofColor':'#929785','facade':'balcony','balcony':'continuous','observations':['米黄与浅粉色外墙','层层开敞走廊和浅色栏杆']},
        '桃园':{'wall':'#ddd6c5','trim':'#e5e0cd','accent':'#bdb9a5','glass':'#577176','roofColor':'#858c7b','facade':'balcony','balcony':'rooms','observations':['浅色楼体与阳台；树木遮挡，部分立面待补充']}}
    for f in data['buildings']:
        a=f.get('appearance',{})
        p={'basis':'unverified','wall':a.get('wall','#d8d9cd'),'trim':'#e5e4d8','accent':'#afb3a6','glass':'#52696f','base':'#939a8b','roofColor':a.get('roofColor','#a5ad9d'),'roofStyle':a.get('roof','flat'),'roofRise':.38,'facade':a.get('facade','regular'),'bay':.46,'windowWidth':.63,'windowHeight':.64,'frameWidth':.011,'entry':None,'observations':['仅有地图轮廓，窗框与屋面收边为通用示意；颜色和真实立面尚未核实。']}
        if f['id'] in exterior:p.update(exterior[f['id']])
        elif f.get('dormGroup') in dormLooks:
            p.update(dormLooks[f['dormGroup']]);p.update(basis='garden-photo',entry='canopy',entryWidth=.8,entryFloors=1,front=[1,1],bay=.4,source=f['sources'][0]['url'],dimensionsNote='采用园区参考照片的共同风格，未逐栋取得四向立面；阳台、空调等构件数量与尺寸为示意。')
            if f['dormGroup']=='梅园':f['model']='terraced-dorm'
        f['exterior']=p
        if p.get('entry'):
            p.setdefault('entryBasis','inferred')
            p.setdefault('entryNote','尚无能确认本栋大门的近照；门厅位置、门扇、台阶为示意。')
            for url in p.get('entrySources',[]):
                if url not in [s['url'] for s in f['sources']]:f['sources'].insert(0,{'title':'入口与屋面参考','url':url})
        f['appearance']={**a,'wall':p['wall'],'roof':p['roofStyle'],'roofColor':p['roofColor'],'facade':p['facade']}
        f['appearanceNote']='；'.join(p['observations'])+'。'+p.get('dimensionsNote','')
    data['meta'].update(detailRevision=5,individualExteriorProfiles=sum(f['exterior']['basis']=='single-photo' for f in data['buildings']),gardenExteriorProfiles=sum(f['exterior']['basis']=='garden-photo' for f in data['buildings']),inferredExteriorProfiles=sum(f['exterior']['basis']=='inferred' for f in data['buildings']),unconfiguredExteriorProfiles=sum(f['exterior']['basis'] in ('unverified','map-only') for f in data['buildings']),refined='2026-09-26',buildingCount=len(data['buildings']),estimatedHeights=sum(f['heightBasis']=='estimated' for f in data['buildings']),namedBuildings=sum(f['nameStatus']!='unresolved' for f in data['buildings']),officialNames=sum(f['nameStatus']=='official' for f in data['buildings']),unresolvedNames=sum(f['nameStatus']=='unresolved' for f in data['buildings']),appearanceCalibrations=len(calibrations),photoEstimatedHeights=sum(f['heightBasis']=='photo-estimate' for f in data['buildings']),nameConflicts=sum(f['nameStatus']=='conflict' for f in data['buildings']))
