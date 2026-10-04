"""Apply the 2026-09-24 exterior batch without replacing unrelated research."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def load(name):
    return json.loads((ROOT / name).read_text(encoding='utf-8'))

profiles = load('data-sources/exterior-profiles.json')
calibrations = load('data-sources/building-calibration.json')

patches = {
    '843421808': {
        'basis': 'single-photo', 'batchRevision': 'researched-2026-09-24',
        'source': 'https://tuchong.com/30762006/140468613/',
        'referenceDate': '2026-04-09，图虫个人实拍；照片标题明确为西南大学桂园宾馆',
        'referenceFile': 'work/remaining/guiyuan-photo-0.jpg',
        'wallFinish': 'panel', 'wall': '#e5e7e1', 'trim': '#e9ece5',
        'accent': '#202d30', 'glass': '#536d72', 'frame': '#c8d0cb',
        'base': '#a5aaa4', 'roofStyle': 'flat', 'roofColor': '#7c8582',
        'facade': 'louver', 'photoFacade': 'guiyuan', 'bay': .34,
        'windowWidth': .58, 'windowHeight': .70, 'frameWidth': .012,
        'front': [1, 0], 'entryBasis': 'inferred', 'entry': 'glass-canopy',
        'entryWidth': 1.25, 'entryFloors': 1, 'entryPoint': [111.7365, -97.3705],
        'entrySteps': 6, 'porchDepth': .24, 'entrySign': '桂园宾馆',
        'signColor': '#c53f2e', 'signBackground': '#e7e9e3',
        'entryStepColor': '#999f98', 'entrySources': ['https://tuchong.com/30762006/140468613/'],
        'dimensionsNote': '个人实拍只覆盖桂园宾馆东南侧高层立面；白色板墙、深色百叶带、连续竖向窗鳍按照片简化，背面、完整屋顶和入口未测绘。',
        'entryNote': '照片未拍到正门；大门、雨棚和六级台阶按建筑主入口方向估计，位置沿原轮廓长边推定。',
        'observations': ['白色大板墙与深灰色连续百叶带', '密集的窄窗组和竖向外挑窗鳍', '高层平屋顶及端部竖向白色收边；入口未在照片中出现']
    },
    '843421784': {
        'basis': 'single-photo', 'batchRevision': 'researched-2026-09-24',
        'source': 'https://xndxyy.swu.edu.cn/',
        'referenceDate': '医院官网首页照片；照片门头明确为西南大学医院一院',
        'referenceFile': 'work/next-batch/hospital-home-15.jpg',
        'wallFinish': 'paint', 'wall': '#d5d8d2', 'trim': '#eef0ea',
        'accent': '#b52d42', 'glass': '#356f78', 'frame': '#9aa9a5',
        'base': '#8f9991', 'roofStyle': 'flat', 'roofColor': '#aab3aa',
        'facade': 'regular', 'photoFacade': 'hospital', 'bay': .82,
        'windowWidth': .68, 'windowHeight': .65, 'frameWidth': .012,
        'entryBasis': 'photo-reference', 'entry': 'glass-canopy',
        'entryWidth': 1.34, 'entryFloors': 1, 'entryPoint': [88.562, -50.234],
        'entrySteps': 8, 'porchDepth': .30, 'entrySign': '西南大学医院一院',
        'signColor': '#b52d42', 'signBackground': '#e4e6de',
        'canopyColor': '#adb5ad', 'entryStepColor': '#969b94',
        'entrySources': ['https://xndxyy.swu.edu.cn/'],
        'dimensionsNote': '医院官网首页照片明确对应西南大学医院一院入口，模型保留地图六层高度；白色小砖、红色院名牌、灰色雨棚、玻璃门和宽台阶按照片简化，侧面及高层立面仍为估计。',
        'entryNote': '一院入口有官网照片依据；照片没有给出平面测绘，门洞中心、雨棚深度和八级台阶按原轮廓长边估计。',
        'observations': ['白色小砖墙面与红色“西南大学医院一院”门头', '灰色金属雨棚、蓝绿色玻璃门和两侧防护窗', '宽台阶与入口绿化；完整高层立面未被照片覆盖']
    },
    '843465223': {
        'basis': 'single-photo', 'batchRevision': 'researched-2026-09-24',
        'source': 'https://xdhqjt.swu.edu.cn/info/1059/4361.htm',
        'referenceDate': '2026-04-15后勤集团报道；改造后试营业照片',
        'referenceFile': 'work/remaining/meiyuan-2.jpg',
        'wallFinish': 'stone-tile', 'wall': '#e8ddc7', 'trim': '#f2eadb',
        'accent': '#bd3038', 'glass': '#557174', 'frame': '#b7afa0',
        'base': '#9fa29a', 'roofStyle': 'flat', 'roofColor': '#a6aa9e',
        'facade': 'regular', 'photoFacade': 'meiyuan', 'bay': .72,
        'windowWidth': .68, 'windowHeight': .70, 'frameWidth': .012,
        'entryBasis': 'photo-reference', 'entry': 'glass-canopy',
        'entryWidth': 1.45, 'entryFloors': 1, 'entryPoint': [6.6025, -43.3265],
        'entrySteps': 8, 'porchDepth': .26, 'entrySign': '梅园学生食堂',
        'signColor': '#fff4df', 'signBackground': '#bd3038',
        'canopyColor': '#d3c2a4', 'entryStepColor': '#91968f',
        'entrySources': ['https://xdhqjt.swu.edu.cn/info/1059/4361.htm'],
        'dimensionsNote': '后勤集团2026年改造报道确认梅园学生食堂；入口照片显示米白分格墙、宽台阶和红色校名标识，后场、屋顶与完整外立面未拍摄，保留地图轮廓和估算层数。',
        'entryNote': '入口台阶和门头依据2026年改造后照片；门扇中心、雨棚尺寸和侧面窗组按原轮廓估计。',
        'observations': ['改造后米白色石材分格墙面', '入口有宽灰色台阶、玻璃门和浅色雨棚', '红色西南大学标识牌；内部照片显示明亮大跨度就餐厅，外部背面未确认']
    }
}

if not set(patches).issubset(set(json.loads((ROOT / 'public/data/campus.json').read_text(encoding='utf-8'))['buildings'][i]['id'] for i in range(300))):
    raise RuntimeError('A target building is not present in the current 300-object dataset')

for bid, patch in patches.items():
    old = profiles.get(bid, {})
    if old.get('basis') in {'single-photo', 'garden-photo'} and old.get('batchRevision') != 'researched-2026-09-24':
        raise RuntimeError(f'Refusing to overwrite existing researched profile: {bid}')
    profiles[bid] = patch

calibrations['843421808'] = {
    'displayName': '丹桂楼 · 桂园宾馆', 'nameStatus': 'official',
    'nameNote': '学校楼宇目录确认2016年丹桂楼现为桂园宾馆；个人实拍标题也明确写出西南大学桂园宾馆，建筑轮廓沿用开放地图。',
    'aliases': ['丹桂楼', '桂园宾馆', '桂园酒店'], 'levels': 11,
    'heightBasis': 'photo-estimate',
    'heightNote': '个人实拍可见约11层窗带；按每层约3.3米估高，底部遮挡、层高和屋顶设备未实测。',
    'category': '生活',
    'sources': [
        {'title': '图虫 · 西南大学桂园宾馆（个人实拍）', 'url': 'https://tuchong.com/30762006/140468613/'},
        {'title': '西南大学楼宇目录 · 丹桂楼', 'url': 'https://www.swu.edu.cn/info/1153/16909.htm'},
        {'title': 'OpenStreetMap · 原始轮廓与标注', 'url': 'https://www.openstreetmap.org/way/843421808'}
    ]
}
calibrations['843421784'] = {
    'displayName': '西南大学医院', 'nameStatus': 'official',
    'nameNote': '医院官网与入口照片确认西南大学医院一院；建筑轮廓沿用开放地图。',
    'aliases': ['西南大学医院', '社区卫生服务中心'], 'levels': 6,
    'heightBasis': 'map-levels',
    'heightNote': '沿用地图六层标注；报道照片只覆盖入口低层，未据此推断整栋高度。',
    'category': '生活',
    'sources': [
        {'title': '西南大学医院官网首页 · 一院入口照片', 'url': 'https://xndxyy.swu.edu.cn/'},
        {'title': 'OpenStreetMap · 原始轮廓与标注', 'url': 'https://www.openstreetmap.org/way/843421784'}
    ]
}
calibrations['843465223'] = {
    'displayName': '梅园学生食堂', 'nameStatus': 'official',
    'nameNote': '西南大学后勤集团2026年改造报道标题明确使用“梅园学生食堂”；建筑轮廓沿用开放地图。',
    'aliases': ['梅园食堂', '梅园学生食堂'], 'category': '生活',
    'sources': [
        {'title': '西南大学后勤集团 · 梅园学生食堂升级焕新（2026）', 'url': 'https://xdhqjt.swu.edu.cn/info/1059/4361.htm'},
        {'title': 'OpenStreetMap · 原始轮廓与标注', 'url': 'https://www.openstreetmap.org/way/843465223'}
    ]
}

(ROOT / 'data-sources/exterior-profiles.json').write_text(json.dumps(profiles, ensure_ascii=False, indent=2), encoding='utf-8')
(ROOT / 'data-sources/building-calibration.json').write_text(json.dumps(calibrations, ensure_ascii=False, indent=2), encoding='utf-8')
print('Patched exactly', len(patches), 'researched building profiles:', ', '.join(patches))
