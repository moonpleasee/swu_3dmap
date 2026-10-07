# 当前接续摘要 · 2026-09-26

## 当前实际进度

- 数据仍为300栋建筑、93个场地/水体/绿地要素、299段道路和12处地标。
- 116栋既有参考配置保持不变（63栋单体照片、53栋园区风格）；本批为其余184栋新增独立“用途与轮廓估算”配置。当前外观依据计数为：single-photo 63、garden-photo 53、inferred 184、未配置 0。
- 300栋现在都有独立墙面、窗格、屋顶收边和入口几何；新增入口全部标记为 `entryBasis: inferred`，不代表已找到本栋照片。参考配置的轮廓、层高、名称、屋顶和颜色未被覆盖。
- 名称仍有151栋待可靠确认、4处冲突；这与外观配置统计有重叠。184栋估算楼栋仍列在 `REMAINING-BUILDINGS.csv`，状态是“已有独立估算配置，仍待照片核实”，不能称为照片精确还原。

## 2026-09-26 估算外观批次

新增保护式脚本 `scripts/apply-inferred-exteriors.py`，先把 `work/inferred-exteriors/before-campus.json` 和 `before-profiles.json` 保存为基线，再按地图轮廓、用途标签和既有层高为184栋逐栋生成稳定参数。教学/实验室/宿舍/住宅/食堂/商业/温室/服务/体育/医院分别使用不同墙色、窗格密度、阳台或百叶、屋面色和入口宽度；入口朝向按本栋OSM多边形上最接近校内道路的外墙边估算，台阶按体量缩放。

本批没有新增照片证据，没有把相邻楼栋或网上其他建筑照片套用到未确认对象；所有新增对象的观察记录、估计范围、OSM轮廓来源和入口待核说明已写入 `data-sources/exterior-profiles.json`、`public/data/campus.json` 和 `EXTERIOR-REGISTER.csv`。温室等特殊用途保留原轮廓和现有低矮高度，不因估算配置擅自改动几何。

## 验证与接续

- `check-data.py`、`check-exteriors.mjs`、`check-roofs-entrances.mjs`、`check-refinement.mjs`、`check-terrain.mjs`、`check-ground-contact.mjs`、`check-researched-batch-2026-09-24.mjs` 均通过；验证显示300个入口配置、41个完整坡屋顶、无接地异常。
- 既有116栋参考外观与批前校园快照逐字段比较无差异；建筑轮廓、层高和名称也无差异。
- 下一步只应从 `REMAINING-BUILDINGS.csv` 中为能获得本栋照片的楼栋替换对应“估算”细节，并保留照片年代、可见范围和未覆盖面说明；不要把本批估算计作新增照片参考。

# 接续记录 · 2026-09-23

## 当前任务状态

用户已恢复逐栋外貌细化任务。公开DEM地形第一版已完成并保留，精度说明见TERRAIN.md。

当前外观批次：2026-09-23，10栋新配置已经落地，已完成首轮浏览器检查。ID：368577143羽毛球馆、304932138网球馆、368589387楠园第一食堂、368578312楠园第二食堂、843421757李园学生食堂、843465284橘园学生食堂、843421755李园小吃街、840970010动物医院、371876808兰苑宾馆、842765847体育中心。

新代码在src/building-character.js，定向配置脚本scripts/apply-building-batch.py只处理上述10栋。不要运行旧work/detail-pass/profiles.py。当前58栋单体照片参考、53栋园区参考，共111栋有参考配置，189栋尚未细化；152栋名称仍待核，不代表111栋均精确还原。研究照片在work/remaining，新批次备份与验收图在work/building-batch。

已发现2026年后勤新闻提及楠园一食堂及李园食堂改造计划，本次仍使用2017年可见外貌，已在数据中标注，不可说成2026年现状。体育中心瓣数、背面与各入口精确朝向仍为估计。

本地生产预览：http://127.0.0.1:4311/ 。服务脚本为 `scripts/local-server.mjs`，读取dist。源码修改后需要 `npm.cmd run build` 再刷新页面。

## 地形阶段历史记录（早于当前10栋外观批次）

- 300栋建筑、93个表面、299段道路的记录及形状未变，campus.json只更新meta.terrain说明。
- 原48栋单体照片配置、53栋园区参考配置仍保留；本次没有推进剩余199栋外貌任务。
- 新增terrain.js、terrain.json和来源瓦片。海拔范围、295个平台、竖直比例1:1见data-sources/terrain/validation.json。
- 整体抬升楼栋、门廊字牌、看台和标线；道路、树木、标签适配坡面；单栋查看回到原有平面展示坐标。
- 地形网格按平台边界切分，修复不同平台间的墙脚穿插。新增10米等高线开关、详情估算海拔、资料署名。

## 已知限制和后续方向

- DEM约30米级且来源年代较早，不保证局部地势和2026年的校园现状完全一致。
- 平台海拔取区域DEM中位数；平台、接地缓冲、过渡边坡为建模估计。台阶、挡土墙、入口分级标高和局部道路坡度仍需更细地形或现场资料。
- 继续地形时应优先校正用户指出的实际坡道/台阶，不要随意移动或重新细化已有建筑外貌。
- 外貌细化已恢复，前轮照片和来源仍在项目上两级的work/remaining/。用户先前明确要求不要重复改已经完善的楼栋。
- 不要运行旧work/detail-pass/profiles.py，以免覆盖后来的屋顶与入口修订。

## 校验与备份

- 脚本：check-data.py、check-refinement.mjs、check-exteriors.mjs、check-roofs-entrances.mjs、check-terrain.mjs、check-ground-contact.mjs。
- 浏览器检查：preview-terrain.mjs；截屏和报告输出到项目上两级的work/terrain/。
- 改动前scene/main/exteriors源码与完整校园数据备份在work/terrain/，名称含before。
- 原始高程瓦片和可复现脚本随项目保留，不依赖会话记忆。

## 当前外观批次结果和接续事项

用户最新要求报告进度并提供接续提示词。已重新核对数据并运行 check-building-batch.mjs 通过：300个对象，58个单体照片参考、53个同组参考，合计113个（38%）有参考配置，187个尚未完成参考外观细化，152个名称待核。名称待核与外观待细化有重叠，不能相加。单体照片可能只覆盖入口，不代表整栋精确还原。

本批主要成果：羽毛球馆白色宽檐/绿色门柱/红台阶；网球馆双拱筒形屋顶；楠园一食堂蓝白立面/弧雨棚；楠园二食堂双组入口；李园食堂绿色幕墙；橘园食堂粉墙/窗组/空调；李园小吃街连续绿蓝雨棚店面；动物医院弧形玻璃/顶部格架；兰苑宾馆金色门框/灰台阶；体育中心分瓣外壳/浅顶盘/玻璃环带，替换旧半球。

原101个参考建筑、全部290个非目标建筑的记录以及道路、表面、边界经基线比较未变。基线和截图在 work/building-batch/。BUILDING-REGISTER.csv、EXTERIOR-REGISTER.csv、REMAINING-BUILDINGS.csv 已导出，剩余清单189行。

本批已通过数据、外观、屋顶入口、地形、墙脚接地和专用批次检查以及生产构建。preview-building-batch.mjs 覆盖10栋和390像素移动端，browser-validation.json 中 errors 为空。个别截图可能拍在模式切换过渡中；下一轮先增加布局/相机稳定等待，再复核羽毛球馆全景和各入口。

尚未收尾：本批独立总结、README/VALIDATION/SOURCES中的旧数字需统一；压缩包尚未重新生成。旧文档101/199为历史基线，以当前数据为准。兰苑宾馆仅入口有可靠照片，其余立面仍有通用表达；动物医院总层数未确认；体育中心瓣数和入口朝向仍为估计。

主要来源：
- 2017图文：https://k.sina.cn/article_2739362700_a3475b8c019001kbi.html
- 体育中心2022航拍：https://dwxcbwlgzb.swu.edu.cn/info/1028/1910.htm
- 动物医院：https://zcgs.swu.edu.cn/cjrh/dwyy.htm
- 兰苑入口：https://law.swu.edu.cn/rcpy/jxjy2/gbpx/hqbz/zshj.htm
- 2026食堂改造消息：https://xdhqjt.swu.edu.cn/info/1059/4361.htm
- 楠园二食堂2018改造消息：https://xdhqjt.swu.edu.cn/info/1009/1561.htm

下一步先收尾截图和文档，再从189个待细化对象中选可靠对应照片的楼栋逐批实施；不能声称已重新研究全部189栋。逐栋记录来源日期、可见特征、估算部分、名称置信度。每批修改、验证、更新本文件；无证据时保持待核，不混用邻楼照片。

## 2026-09-24 校门批次撤回

按用户要求撤回上一轮校门和校界外扩实验：已删除 `src/gates.js`、`public/data/gates.json`，恢复 `scene.js` 使用原始 `data.boundary` 渲染地面，恢复 `main.js` 只加载校园与DEM数据。当前版本不包含校门模型，也不包含校界外扩地形；既有建筑、运动场、道路、DEM和外观细化成果保持不变。生产构建、地形、接地、外观、屋顶入口检查已重新通过，浏览器页面恢复为原校园范围。

## 2026-09-23 咏修楼批次

新增并验证2栋单体照片参考：843421765 咏修楼A栋/新闻传媒学院、843465310 咏修楼B栋/旧出版社与阅见书店。A栋采用官方航拍可见的灰砖、中央门厅、分段坡屋面和浅色窗间墙；B栋采用学校楼宇页照片可见的米色板墙、弧形端部、连续露台栏杆和底层书店入口。两栋的完整背面、精确层高和全部门位仍未测绘，B栋与地图轮廓的对应是基于弧端、长翼及相邻关系的匹配。

来源和研究图在 work/next-batch/：学校楼宇目录 https://www.swu.edu.cn/whxd/hjwh/ly.htm、咏修楼B栋 https://www.swu.edu.cn/info/1153/16911.htm、阅见书店 https://www.swu.edu.cn/info/1197/7774.htm。新增脚本 scripts/apply-yongxiu-batch.py，仅保护式写入这2栋。

当前验证：300栋数据、300栋外观实例、25栋坡屋顶、113处常驻入口检查通过；生产构建成功。REMAINING-BUILDINGS.csv 当前187行。导航功能本轮只完成方案讨论，尚未写入代码。

## 2026-09-24/25 研究批次：丹桂楼、医院、梅园学生食堂

### 接续时的实际状态

- 以当前 `public/data/campus.json` 和 `data-sources/exterior-profiles.json` 为准：300个建筑对象，63个单体照片参考、53个同组园区参考，共116处参考外观；184个对象仍待外观细化。
- 151个对象名称仍待可靠确认，另有4处名称冲突；名称和外观统计有重叠，不能相加。
- 2026-09-24校门/校界外扩实验保持撤回状态；本批没有重新加入校门、边界外扩或新的地形几何。

### 本批实际修改

1. `843421808`：地图原标注“桂园宾馆”改为显示名“丹桂楼 · 桂园宾馆”。依据楼宇目录与个人实拍，加入白色大板墙、深灰连续百叶带、密集窄窗、竖向外挑窗鳍和高层平屋顶收边；照片估读约11层。正门未出现在照片中，雨棚和六级台阶按轮廓长边方向估计，背面与完整屋顶设备未核。
2. `843421784`：西南大学医院使用官网首页“一院”入口照片作为单体依据，加入白色小砖、红色“西南大学医院一院”门头、灰色金属雨棚、蓝绿色玻璃门、防护窗和宽台阶；保留地图六层和原轮廓。门洞、雨棚深度和八级台阶为估计，照片未覆盖侧面及高层立面。
3. `843465223`：梅园学生食堂使用后勤集团2026年改造报道及照片，加入米白石材分格墙、入口玻璃门、浅色雨棚、红色校名标识和宽台阶；保留地图轮廓，层数仍待核，后场、屋顶和完整外立面未确认。

### 来源与文件

- 丹桂楼官方说明：[西南大学楼宇目录](https://www.swu.edu.cn/info/1153/16909.htm)；个人实拍：[图虫·西南大学桂园宾馆](https://tuchong.com/30762006/140468613/)（页面日期2026-04-09）。
- 医院入口：[西南大学医院官网首页](https://xndxyy.swu.edu.cn/)，本地研究图 `work/next-batch/hospital-home-15.jpg`。
- 梅园食堂：[西南大学后勤集团改造报道](https://xdhqjt.swu.edu.cn/info/1059/4361.htm)（2026-04-15），本地研究图 `work/remaining/meiyuan-*.jpg`。
- 保护式脚本为 `scripts/apply-researched-batch-2026-09-24.py`；不会运行旧的 `work/detail-pass/profiles.py`。

### 本批验证与接续

- `check-data.py`、`check-researched-batch-2026-09-24.mjs`、`check-refinement.mjs`、`check-exteriors.mjs`、`check-roofs-entrances.mjs`、`check-terrain.mjs`、`check-ground-contact.mjs` 全部通过；结果为300栋、93个表面、299条道路、12处地标、25个完整屋顶、116处常驻入口、无接地异常。
- `npm.cmd run build` 成功，Vite仅提示主chunk约680KB的体积建议。生产页面已在 `http://127.0.0.1:4311/` 实际打开；全景、丹桂楼、医院、梅园学生食堂三个 hash 详情均能加载，名称、参考说明和入口按钮可见，未见页面错误。
- `BUILDING-REGISTER.csv`、`EXTERIOR-REGISTER.csv`、`REMAINING-BUILDINGS.csv` 已按本批数据重新导出；剩余清单184行。下一步从清单中选取有可靠对应照片的对象继续逐批处理，优先补齐能确认入口或屋顶的建筑；不要把同组参考当成单体精确复原。

## 2026-09-26 地图对应修订

用户要求每栋楼必须对应真实地图对象。本次保留184栋估算配置的外观分类，但把入口与临街方向重新按当前 `campus.json` 的本栋 OSM 多边形和299段校内道路计算：优先选择该多边形外墙中点距道路最近的一边，记录 `mapObjectId`、`mapSourceId`、`mapCenter`、`footprintEdgeLength`、`nearestRoadDistance`。没有近道路的轮廓才回退最长边；不是通过楼名查找位置。116栋既有参考配置未变。

本次验证：7组数据/几何/地形/接地检查通过；300栋入口配置、41个完整坡屋顶；`preview-inferred.mjs` 实际访问温室、教育超市、二院、物业管理中心和圆顶5个估算对象，详情均显示“用途与轮廓估算，待照片核实”，入口按钮可用，浏览器无错误；`npm.cmd run build` 成功。压缩包已更新。

下一步：继续为 `REMAINING-BUILDINGS.csv` 中的184栋寻找能与这些 OSM 对象可靠对应的本栋照片或航拍，逐栋将估算字段替换为有日期和可见范围记录的参考配置；地图对应字段应保留。

## 2026-09-26 地点社区第一阶段

用户确认开始开发“地图地点社区”功能。本阶段已建立回退检查点：`work/gates/2026-09-26-before-place-community/`，包含源码、网页数据、脚本和主要文档。需要回退时按 `GATE-MANIFEST.json` 说明恢复对应路径。

已完成：

- 新增 `src/community.js`，定义地点、照片、评论和评分的数据结构；当前使用浏览器 `localStorage` 保存，键名为 `swu-place-community-v1`。
- 地图面板新增“创建地点”。用户点击地图选择位置，重复点击可移动位置标记，确认后填写名称和简介，创建后生成 `#place=user:...` 地点入口。
- 用户地点会在三维地图显示图钉，也会进入左侧地点列表；点击图钉或列表可打开地点详情。
- 固定建筑和场地详情页追加地点内容区域；用户地点页支持本地照片选择、评论输入和1—5分评分。照片单张限制约1.8MB，当前只保存到本机浏览器。
- 新增 `scripts/preview-place-community.mjs`，实际验证了创建地点、详情页、地图列表和页面错误收集。

当前限制：本阶段还没有接入账号、云端数据库、共享图片存储和多人实时聊天；换设备或清除浏览器数据后内容不会同步。下一阶段应保持现有数据结构，接入后端地点表、对象存储和用户身份，再将本地草稿迁移为云端数据。

验证：`npm.cmd run build` 成功；浏览器实际创建“测试地点”，详情页显示照片/评论/评分区域，地点列表可见，未发现页面错误。

## 2026-09-29 地面视觉平滑处理

本批建立回退检查点：`work/gates/2026-09-29-before-ground-smoothing-164050/`。该检查点包含本批修改前的 `src/terrain.js`、`HANDOFF.md`、`VALIDATION.md`，需要撤回时按 `GATE-MANIFEST.json` 恢复。

本批只调整地面渲染的法线和明暗过渡：`src/terrain.js` 的 `colorTerrain()` 根据现有 DEM 采样生成连续的局部坡面法线，降低三角面之间的明暗断裂。没有修改高程采样、地面顶点、建筑、道路、水域、树木、运动场或地点社区数据，因此既有对象位置和接地关系保持不变。地面网格的分割数量也没有伪装成被减少；本批解决的是可见的折面感，后续如仍需降低网格量，应单独调整底面网格密度并重新检查接地。

验证：`check-data.py`、`check-terrain.mjs`、`check-ground-contact.mjs`、`check-refinement.mjs` 和 `node --check src/terrain.js` 通过；`npm.cmd run build` 成功。生产页面 `http://127.0.0.1:4311/` 实际打开并截图至 `work/ground-smoothing/ground.png`，页面 `__campusDebug` 可用且无 pageerror/console error。下一步先由用户查看地面平滑效果；若仍有明显折面，再只对校园底面网格密度做保守降采样，保持道路、水域和建筑数据不变。

## 2026-09-30 道路连续面与交叉口平滑

本批建立回退检查点：`work/gates/2026-09-30-before-road-smoothing-0915/`。检查点由本批开始前的压缩包恢复，包含 `src/scene.js` 和主要文档；按其中的 `GATE-MANIFEST.json` 可撤回本批道路几何。

本批修改 `src/scene.js` 的 `buildRoads()`：保留299条 OSM 道路中心线和原宽度，在线段端点、折弯点与真实线段交点增加贴地圆角补面，统一道路几何的法线后再合并渲染。道路仍逐点调用 DEM 采样，建筑、地形、运动场、水域、树木和社区数据未改动；道路数据本身也未重写。这样可以覆盖旧的线段接缝，减少弯道尖角、相交处毛刺和地面穿插。

验证：`check-data.py`、`check-terrain.mjs`、`check-ground-contact.mjs`、`check-refinement.mjs` 和 `node --check src/scene.js` 通过。生产构建成功；浏览器实际加载后 `__campusDebug` 可用、无 pageerror/console error，截图 `work/road-smoothing/roads.png` 显示道路图层连续，交叉口和转弯处为圆滑贴地连接。压缩包已在本批收尾后重新生成。下一步如发现某个具体路口仍穿过建筑，应按该路口的 OSM 轮廓单独裁剪，不扩大范围修改全校道路。

## 2026-09-30 柏油道路配色

本批建立回退检查点：`work/gates/2026-09-30-before-asphalt-road-color-0945/`。本批只改变道路材质颜色，回退不会移除上一批的圆角和交叉口几何。

将道路材质从浅色示意面改为深灰绿色的柏油色 `#5a5f5a`，粗糙度设为 `.96`，保留现有贴地高度、圆角端点、弯道和交叉口补面。建筑、地形、道路中心线、水域、运动场、树木和社区功能均未改动。

验证：`check-data.py`、`check-terrain.mjs`、`check-ground-contact.mjs` 和 `node --check src/scene.js` 通过；生产构建成功；浏览器实际加载无错误，道路截图为 `work/road-smoothing/asphalt.png`。下一步如需车道线、斑马线或人行道颜色，应单独增加图层，不与柏油底色混合修改。

## 2026-09-30 道路横向找平

本批建立回退检查点：`work/gates/2026-09-30-before-road-crossfall-fix-1015/`。

修正 `src/scene.js` 的道路贴地算法：道路每个截面的左右顶点现在共享同一条中心线高度，只沿道路前进方向采样 DEM，因此道路可以自然上下坡，但不会因地形横向坡度而左右倾斜。弯道和交叉口圆角补面也改为以交点标高保持水平。柏油颜色、道路宽度、圆角连接、建筑、地形、水域、运动场、树木和社区功能均保留。

验证：`check-data.py`、`check-terrain.mjs`、`check-ground-contact.mjs`、`check-refinement.mjs`、`node --check src/scene.js` 通过；生产构建成功；浏览器实际加载无错误，截图 `work/road-smoothing/level-crossfall.png`。下一步如需排水横坡或无障碍坡道，应作为明确的道路类型单独建模，当前普通道路统一按横向找平处理。

## 2026-10-03 道路边缘平滑与原始地图审计

本批建立回退检查点：`work/gates/2026-09-30-before-road-edge-smoothing-1040/`。

本批按原始 OSM 道路点生成带圆角连接的连续道路轮廓，不重画、不移动道路中心线；圆角只用于渲染边缘，原始 299 条道路及宽度保留。普通折点不再叠加额外圆盘，只在真实 OSM 道路端点连接和线段交点补面，减少叠加造成的锯齿。道路网格采样细化至 `.22`，并在渲染阶段裁掉落入建筑和水面轮廓的三角面，避免道路穿过建筑/水面；这一步不删、不改 OSM 中心线。

新增 `scripts/check-roads.mjs` 和 `work/road-smoothing/road-map-audit.json`：审计结果为299条道路、0个越出校界的路线点、0个非法宽度；原始快照中有36个建筑轮廓内中点和9个水面轮廓内中点，已作为审计旗标记录，未擅自改线。地图基准为项目缓存的 OpenStreetMap API 0.6 数据，实时地图入口为 `https://www.openstreetmap.org/#map=17/29.8232/106.4185`；学校道路施工公告只用于识别道路可能存在时段性变化，不能把临时封闭当成永久改线。

验证：`check-roads.mjs`、`check-data.py`、`check-terrain.mjs`、`check-ground-contact.mjs`、`check-refinement.mjs`、`node --check src/scene.js` 均通过；生产构建成功；浏览器无 pageerror/console error，道路截图为 `work/road-smoothing/trimmed-roads.png`。下一步如用户指出具体一条道路与现场不符，应提供道路编号或位置后逐条对照，不凭名称推测。

## 2026-10-03 连续曲线道路边界

本批建立回退检查点：`work/gates/2026-10-03-before-continuous-roads/`。

新增 `src/roads.js`，使用 `polygon-clipping` 将每条 OSM 道路中心线生成带圆弧连接的连续道路轮廓，再把全校道路联合为14个连续面；建筑和水面轮廓用精确多边形差集裁剪，不再按三角形中心点删除边界。道路中心线、路线点、宽度和道路数量未改变，横向找平仍按最近道路中心线标高生成。`src/scene.js` 只负责把这些连续面按 DEM 贴地并渲染柏油材质。

新增 `scripts/check-continuous-roads.mjs`，审计结果为299条来源道路、14个联合连续面、153个边界环、7287个边界顶点，`centerlinesChanged:false`。原始道路位置核对仍见 `work/road-smoothing/road-map-audit.json`；实时地图基准为 `https://www.openstreetmap.org/#map=17/29.8232/106.4185`。学校道路施工公告只代表时间性交通状态，未被当作永久改线。

验证：`check-continuous-roads.mjs`、`check-roads.mjs`、`check-data.py`、`check-terrain.mjs`、`check-ground-contact.mjs`、`check-refinement.mjs`、两个 JavaScript 语法检查均通过；生产构建成功；`preview-terrain.mjs` 桌面/移动端实际页面检查通过且无错误，道路截图为 `work/road-smoothing/continuous-roads.png`。下一步如仍发现锯齿，应在实际放大视角下指定道路位置，区分 OSM 中心线问题和屏幕像素抗锯齿问题后再改。

## 2026-10-04 转弯与交叉口圆角重构、道路地面开孔

本批建立回退检查点：`work/gates/2026-10-04-before-rounded-road-junctions/`。该检查点保存了本批修改前的连续道路版本；按其中 `GATE-MANIFEST.json` 可恢复。

针对用户反馈的“转弯或交叉口有尖角、断开”，重写 `src/roads.js` 的可见道路轮廓：每条 OSM 道路由线段矩形、每个折点的圆盘和端点圆盘组成，再经过 `polygon-clipping` 联合。这样道路在急弯、道路端点相接和交叉位置采用连续圆角过渡，避免单一偏移轮廓在锐角处产生尖刺，也不移动、不改写299条原始中心线和宽度。建筑物与水域仍通过精确差集裁掉道路显示面。

`src/scene.js` 现在只计算一次最终道路多边形：地面顶面用同一组道路外环开孔，道路本身再使用这组多边形贴地渲染；因此道路与地面不再重叠竞争，地面不会从道路边缘露出。DEM采样、横向找平、建筑、运动场、水域、树木和地点社区数据未改动。

本批实际验证：

- `check-continuous-roads.mjs` 通过：299条来源道路、14个联合连续面、144个边界环、8939个边界顶点，`centerlinesChanged:false`。
- `check-roads.mjs`、`check-data.py`、`check-terrain.mjs`、`check-ground-contact.mjs`、`check-refinement.mjs`、`node --check src/roads.js`、`node --check src/scene.js` 全部通过。
- `npm.cmd run build` 成功；Vite仍只有主chunk体积提示。
- `preview-terrain.mjs` 实际检查桌面/移动端，`__campusDebug` 正常，未出现 pageerror/console error；默认全景截图更新于项目上级 `work/terrain/overview.png`。
- 额外俯视道路图层截图为 `work/road-smoothing/rounded-junctions.png`，用于检查转弯和交叉口的连续性。

当前仍有边界：道路来源是项目缓存的 OSM 快照，真实现场临时道路和未测绘小路不会被本批自动推断；如仍有问题，请指出具体路口或截图位置，以便按对应 OSM 轮廓单独核对。下一步不扩大到全校猜测性改线。

## 2026-10-04 手机版地点论坛主界面

本批建立回退检查点：`work/gates/2026-10-04-before-mobile-forum/`。

将现有地点社区改成手机版的主要使用界面：在390×844等竖屏尺寸下，用户点选建筑或场地后，地图缩到上方约31%区域，地点论坛从底部展开约69%的圆角面板。面板提供“讨论/照片”切换、上传照片、评分、发布评价、评价回复和本机访客时间信息；建筑资料、外观说明、入口按钮等收进“建筑资料与模型”折叠区，避免抢占论坛主体空间。关闭面板后恢复地图浏览。

本批保留固定建筑地点身份：对大礼堂、31教等固定对象的评价、照片和回复仍写入对应 `fixed:<建筑ID>`，不会被误建成用户地点。评论改用随机ID并支持 `replies` 数组；照片和评价仍保存于 `localStorage`，当前是单浏览器体验版，不是多人共享论坛。

验证：`scripts/preview-mobile-forum.mjs` 实际检查390×844和360×640竖屏、约69%论坛面板、固定地点身份、评价、回复、评分、照片上传、刷新持久化、关闭恢复地图、桌面建筑细看；无页面错误且无横向溢出。截图保存于 `work/mobile-forum/mobile-map.png`、`mobile-discussion.png`、`mobile-9x16.png`。`node --check src/main.js`、`node --check src/community.js` 和 `npm.cmd run build` 通过。

下一步：可继续把本机存储迁移到云端地点/照片/评论服务，并补充登录、审核和多人同步；在此之前不要把 localStorage 内容称为其他用户的真实发言。

## 2026-10-07 地面透明缺口修复

实际 terrain-only 截图确认：之前把道路连续面外环作为地面孔洞，导致隐藏道路图层后出现大块缺面，背景和底座边墙可见；这不是地面材质透明。

本批恢复完整校园地形顶面，不再用道路外环切开地面；地面材质显式设置为不透明、双面渲染和深度写入。道路仍保留连续圆角多边形，贴地偏移调整为 `.038`，避免道路与完整地面发生深度竞争。建筑、DEM高程、道路中心线和道路裁剪逻辑未改动。

验证：`npm.cmd run build`、`check-terrain.mjs`、`check-ground-contact.mjs` 通过。实际截图 `D:\Cloud_Campus\work\terrain\terrain-only.png` 显示地面连续覆盖校园范围，原先透明缺口消失。

回退点：`work/gates/2026-10-07-before-ground-fill/`；双面材质检查点：`work/gates/2026-10-07-before-ground-opaque/`。

## 2026-10-07 道路边缘深度竞争修复

恢复完整地面后，道路边缘重新出现锯齿的原因是道路表面与DEM地面在同一像素深度附近重叠。道路中心线按中心高度贴地，而地面按每个地形点起伏，边缘并不共面。

本批将道路贴地偏移从 `.038` 调整为 `.05`，并给柏油材质启用显式不透明、深度写入和 `polygonOffset`，让道路在深度测试中稳定位于地面上方。地面仍保持完整，不再开道路孔洞。

`npm.cmd run build`、`check-roads.mjs`、`check-terrain.mjs`、`check-ground-contact.mjs` 通过。道路中心线、宽度、建筑和DEM数据未改动。上一提交 `219adc7` 可作为地面完整版本的回退点。

## 2026-10-07 校园外围正方形缓坡地形

本批建立回退检查点：`work/gates/2026-10-07-before-land-extension/`，按其中的 `GATE-MANIFEST.json` 可恢复外围扩展前的 `scene.js`、`terrain.js` 和文档。

用户要求把现有校园土地向四周扩展成更大的正方形，并从校园边线向外缓缓下坡，最外围保持统一平面。本批只修改 `src/scene.js` 的 `buildGround()`：

- 保留原校园边界顶面、DEM采样、建筑、道路、水域、运动场、树木和地点社区，不移动或重写任何对象数据。
- 以当前校园边界包围盒中心为中心，四边各外扩约82个模型单位，生成约372×371模型单位的正方形外围地块；校园边界作为内孔，避免覆盖现有校园顶面。
- 外围高度按最近校园边界的实测DEM采样向外插值，在约82单位范围内平滑下降；外圈统一使用 `outerLevel` 平面（由当前边界最低采样和地形底标高计算，保持在底座之上）。
- 增加外围地块侧壁并与现有背景平面衔接，外围没有额外可见边框，保持开阔地面效果。

页面截图显示校园四周已经有连续的浅绿色外扩地面；当前截图保存在本次浏览器检查记录中。由于预览脚本的Edge启动环境在本批出现进程退出，未生成新的自动化截图文件，已使用本地浏览器标签实际截图确认页面可加载。

验证：`python scripts/check-data.py`、`node scripts/check-terrain.mjs`、`node scripts/check-ground-contact.mjs`、`node scripts/check-roads.mjs`、`node scripts/check-refinement.mjs`、`node --check src/scene.js` 和 `npm.cmd run build` 全部通过。构建只有既有主chunk体积提示。

下一步：由用户查看外围坡度和正方形范围；若需要更宽、更缓或更低的外扩地块，只调整 `half`、`transition` 与外圈标高参数，不改校园对象和道路数据。暂未把本地提交推送到GitHub。
