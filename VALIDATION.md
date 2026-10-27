# 验证记录

## 2026-10-27 响应式布局

- `node --check src/main.js` 与 `npm.cmd run build` 通过。构建仅有既有的主脚本体积提示。
- `node scripts/preview-responsive.mjs` 在本地 Edge 检查390×844手机、1280×800电脑、900×700小屏电脑和桌面建筑详情；再次缩回手机后可展开底部论坛。手机应用宽390px；1280px电脑地图从x=360开始、宽920px，探索侧栏在左；网页宽度与视口一致，无横向溢出；页面错误数组为空。
- 实际查看 `work/responsive-2026-10-27/` 的手机首页、手机论坛、电脑全景、电脑详情及小屏电脑截图。没有改动模型与地理数据，因此本批不重复几何数据检查。

## 2026-10-11 探索界面优化

- `npm.cmd run build` 通过，Vite 8.3.0 无构建错误（仅保留已有主脚本体积提示）。
- `node scripts/preview-ui-refresh.mjs` 通过：390×844收起状态仍显示搜索框；展开后分类可见；输入“大礼堂”显示结果并出现清除按钮；选择结果后详情展开；关闭详情恢复原搜索词和分类；`scrollWidth` 等于390；页面错误数组为空。
- 实际查看截图：`work/ui-refresh/collapsed.png`、`work/ui-refresh/search-expanded.png`。收起面板不再被底部工具条挡住，搜索结果长名称会截断在卡片内。
- 本批没有重跑建筑、地形或道路数据检查，因为没有修改对应数据和几何。

## 2026-09-26 估算外观批次

- 通过 `check-data.py`、`check-exteriors.mjs`、`check-roofs-entrances.mjs`、`check-refinement.mjs`、`check-terrain.mjs`、`check-ground-contact.mjs`、`check-researched-batch-2026-09-24.mjs`。结果：300栋建筑、93个场地要素、299段道路、12处地标；41个完整坡屋顶；300个已配置入口；接地异常为0。
- `data-sources/exterior-profiles.json` 中的63个单体照片配置与53个园区参考配置保持原值；新增184个 `basis: inferred` 配置；每条记录写入 `mapObjectId`、`mapSourceId`、`mapCenter`、`footprintEdgeLength` 和 `nearestRoadDistance`，入口优先落在该多边形最近的校内道路边。批前 `work/inferred-exteriors/before-campus.json` 对照确认116个参考对象的几何、层高、名称和外观未改变。
- `REMAINING-BUILDINGS.csv` 仍保留184行，表示这些楼栋尚未取得能可靠对应本栋的照片或航拍。

日期：2026-09-23（地形接入）；下方旧版记录保留供追溯。

## 2026-09-25 研究批次复核

- 当前数据为300个建筑对象、93个表面、299条道路和12处精选地标；外观参考为63个单体照片配置、53个同组园区配置，184个对象仍待细化。名称统计为151个待可靠确认、4处冲突，二者与外观待细化有重叠。
- 批次检查通过：`check-data.py`、`check-researched-batch-2026-09-24.mjs`、`check-refinement.mjs`、`check-exteriors.mjs`、`check-roofs-entrances.mjs`、`check-terrain.mjs`、`check-ground-contact.mjs`。屋顶与入口检查报告25个完整屋顶、116处常驻入口，接地异常为0。
- `npm.cmd run build` 成功：Vite 8.3.0，主脚本约680KB、gzip约181KB；只有chunk体积提示，没有构建错误。
- 生产服务 `http://127.0.0.1:4311/` 已用内置浏览器实际检查。全景能渲染；`#place=843421808` 显示“丹桂楼 · 桂园宾馆”及单体照片说明；`#place=843421784` 显示“西南大学医院”及官网入口依据；`#place=843465223` 显示“梅园学生食堂”及2026年改造依据。三处详情均显示“单栋细看/看入口”控件，未见页面错误。
- 本批没有恢复校门模型或校界外扩；DEM、既有建筑外观、运动场和道路数据保持既有结果。照片未覆盖的背面、完整层高和入口朝向仍标为估算或待核。

## DEM地形与既有模型接地

- 六组几何/数据检查通过：check-data、check-refinement、check-exteriors、check-roofs-entrances、check-terrain、check-ground-contact。
- 对比本轮前备份，300栋建筑、93个表面、299条道路、精选地标、校界数据完全不变；仅meta.terrain说明更新。300栋的楼体和屋顶顶点、材质颜色、缩放/旋转相同，位置仅竖直平移；所有立面实例保持相同颜色和构件尺寸。
- 校界内源DEM采样约197.1—289.9米；1世界单位=10米，竖直不夸张。校界外缓冲数据不计入此范围。295组水平平台为估计，精度限制见TERRAIN.md。
- 检查300栋每段墙边的1/4、1/2、3/4位置与最终地面三角网，未出现大于0.2米的穿插或大于0.8米的缝隙；这是采样式接地检查，不代表逐像素验证或测绘精度。
- 地面网格在建筑/场地/绿地边界切分；绿地直接着色于同一网格，消除了独立草地薄片与地面三角形交错产生的碎片。检查多边形孔洞保留、面积守恒和法线朝上。
- 独立Edge浏览器检查1440×960全景、等高线及单独地形、旋转、第二运动场、兰华楼校园视图、单栋细看、入口、返回、夜景、资料说明。390×844检查图书馆和单栋查看/返回，无横向溢出，页面无error日志。
- 生产构建成功；JS约671KB，gzip约178KB，保留Vite体积提示。高程已经本地缓存，无远程瓦片加载依赖。
- 截屏与浏览器报告位于项目上两级work/terrain/；数据检查报告位于data-sources/terrain/validation.json。

## 第三轮屋顶、入口与逐栋立面

- 数据检查、体量分割面积检查、外观构件检查、屋顶与入口检查全部通过。覆盖300栋建筑、24栋坡屋顶、101处常驻入口；验证门廊不超出所附墙段、雨僧楼共线立面合并、三组人工屋面方案、书楠楼4/3层和弘诚/弘信/弘义各立面区域能匹配轮廓。
- 屋面测试核对坡面总投影面积等于原轮廓减去院落孔洞，且所有坐标有限；这不是现场测绘精度验证。
- 本轮15栋入口有照片形制参考，86栋仍是示意。外观证据分类仍为48栋单体照片、53栋园区照片、199栋尚缺单体证据。
- 桌面检查兰华屋顶、雨僧门套、文俊六柱门廊、明德深门厅、书楠跨层拱窗、弘信弧形立面；修复门窗穿插和独立查看时穿透楼体的选中轮廓线。
- 生产构建成功，主脚本约660 KB，gzip约174 KB；保留体积提示。细部仍主要在选中楼栋生成，总实例测试数不等于同时渲染数。
- 逐栋修改和精度限制见 ROOF-ENTRANCE-PASS.md，入口证据已导出至 EXTERIOR-REGISTER.csv。
- 390×844实际检查兰华入口与关闭详情返回校园，宽度与滚动宽度均390，无横向溢出；检查结束恢复默认尺寸。当前浏览器无error级日志。

## 第二轮外观细化

- `check-exteriors.mjs` 通过：300栋外观记录，粗细两级共667811个有限坐标实例，单栋最大22854个；细部只在选中时生成。检查材质颜色、外法线、切割面排除、纹理尺寸、文俊楼6/3层及梅园三段体量。
- 数据检查和前一轮几何检查通过，生产构建成功。打包器仍提示主脚本约652 KB；gzip约171 KB，属于体积提示，不影响构建。
- 桌面实际检查田家炳、李园1舍、梅园1舍、明德楼；修复近景遮挡，将校园底座在独立查看时隐藏。
- 手机390×844检查中心图书馆：修正不规则轮廓取景中心，完整显示建筑；页面无横向溢出（clientWidth=scrollWidth=390）；夜景与返回校园可用。
- 单体48、园区53、外观尚未核实199；上述覆盖数为数据来源分类，不代表四向立面或构件尺寸均已核实。

## 本轮细化验证

- `python scripts/check-data.py` 通过：300个独立建筑、93个表面、299条道路；闭环、坐标、ID追溯、精选地标引用通过。
- `node scripts/check-refinement.mjs` 通过：全部300栋来源字段；分层体块面积守恒；坡屋顶顶点有限；图书馆15/5层分区；新旧宿舍别名、楠园名称冲突和李园4舍轮廓合并；足球场尺寸范围及运动场细部几何。
- `npm.cmd run build` 成功，构建后的静态页面通过127.0.0.1:4311实际加载。
- 桌面1280×720检查第二运动场、图书馆和楼栋近景：可见单一跑道、矩形足球场、看台、棚顶及高低楼体。
- 宿舍分类64栋；旧名“竹园A栋”找到茶园1舍，“杏园A栋”找到杏园3舍；“二十九教”找到伴月楼；“李园4”只有一个目录条目。
- 第一至第六运动场已进入目录；“第五运动场”可检索。
- “待核名”目录156个条目，即152处未取得名称和4处冲突/旧标；搜索“楠园4”显示两处位置冲突，不隐藏其中一处。
- 手机390×844检查展开探索面板、检索和详情卡；页面宽度与滚动宽度均390，无横向溢出。测试后恢复浏览器默认尺寸。
- 本轮浏览器未记录error级日志。所有楼栋名称及照片估读层数仍未经过现场验证，程序测试不能证明地理准确性。

## 以下为第一版记录（2026-09-21）

## 构建与数据

- Node.js 24.15.0，Vite 8.3.0，Three.js 0.186.0。
- `npm.cmd run build` 成功。
- `python scripts/check-data.py` 通过：301 个建筑轮廓、93 个表面要素、299 条道路分段、12 处精选地标。
- 校验所有面闭合、非退化、坐标有限、建筑高度范围正常；每个要素可追溯到原始 OSM 快照；精选地标指向唯一要素。
- 修正了多片区关系共用渲染 ID 的问题，保留独立 `sourceId` 用于来源追溯；精选地标定位到对应关系中最大的多边形片区。

## 实际浏览器检查

使用 Codex 内置 Chromium 浏览器，在开发服务与构建后的独立静态 HTTP 服务上实际打开。

- 桌面 1280 × 720：全景、29 教近景与夜景可见；地图和操作按钮正常显示。
- 手机 390 × 844：全景、可展开/折叠的探索面板、搜索、中心图书馆详情可见；未发现横向溢出。
- 搜索 `29` 返回 29 教并可定位；搜索 `图书馆` 返回三个图书馆；不存在名称显示空结果。
- 风景分类返回两个精选地标；崇德湖定位与 `#place=r5522696` 地址更新成功。
- 夜景切换后状态更新，模型窗户发光；恢复日间成功。
- 地标名称图层取消后隐藏，重新选中恢复。
- 自动漫游可启动并推进到后续地标；暂停、结束和全景复位可用。
- 静态构建页面已加载和渲染；未发现 JavaScript error 级日志。
- 去除了开发时 Three.js 旧阴影类型警告，改用 PCFShadowMap。
- 导出生成 PNG Blob 并显示带署名的图片预览。内置浏览器未提供可靠下载事件，不能据此确认文件已经落盘；界面改为预览后由用户点击下载或长按图片保存。

## 尚未验证

- iOS Safari、Android 实机和低端 GPU 性能。
- 公网托管与跨设备访问（尚未部署）。
- 每栋楼的实地高度、完整立面及真实地形。
- 所有原生浏览器的全屏和下载兼容性。

## 2026-09-29 地面视觉平滑

- `src/terrain.js` 仅为现有 DEM 地面生成连续局部法线，平滑三角面的明暗过渡；未改变高程、顶点、建筑、道路、水域、树木或社区数据。
- `python scripts/check-data.py`、`node scripts/check-terrain.mjs`、`node scripts/check-ground-contact.mjs`、`node scripts/check-refinement.mjs`、`node --check src/terrain.js` 通过。
- `npm.cmd run build` 成功；`scripts/preview-ground-smoothing.mjs` 实际加载 `http://127.0.0.1:4311/` 并生成 `work/ground-smoothing/ground.png`，`__campusDebug` 可用且无页面错误。
- 本批保留地面网格拓扑，改变的是视觉折面感；网格密度是否需要进一步降低留待下一批单独处理。

## 2026-09-30 道路连续面与交叉口平滑

- `src/scene.js` 保留299条道路中心线和原宽度，在端点、折弯点和线段交点生成 DEM 贴地的圆角补面，统一道路顶点属性后合并渲染。
- `python scripts/check-data.py`、`node scripts/check-terrain.mjs`、`node scripts/check-ground-contact.mjs`、`node scripts/check-refinement.mjs`、`node --check src/scene.js` 全部通过。
- `npm.cmd run build` 成功；浏览器实际加载页面后 `__campusDebug` 可用且无 pageerror/console error。道路图层截图保存为 `work/road-smoothing/roads.png`。
- 建筑、DEM 地形、运动场、水域、树木、社区数据与299条道路原始数据均未修改；本批处理的是道路渲染几何的转弯和交叉连接。

## 2026-09-30 柏油道路配色

- 道路材质改为深灰柏油色 `#5a5f5a`，粗糙度 `.96`；既有圆角、交叉口连接、DEM 贴地和道路数据保持不变。
- `python scripts/check-data.py`、`node scripts/check-terrain.mjs`、`node scripts/check-ground-contact.mjs`、`node --check src/scene.js` 通过。
- `npm.cmd run build` 成功；浏览器页面无错误，道路图层截图保存为 `work/road-smoothing/asphalt.png`。

## 2026-09-30 道路横向找平

- 道路每个截面使用中心线 DEM 高度，保持左右标高一致，仅沿道路方向保留上下坡；交叉口圆角补面使用交点标高的水平面。
- `python scripts/check-data.py`、`node scripts/check-terrain.mjs`、`node scripts/check-ground-contact.mjs`、`node scripts/check-refinement.mjs`、`node --check src/scene.js` 通过。
- `npm.cmd run build` 成功；浏览器无 pageerror/console error，道路截图保存为 `work/road-smoothing/level-crossfall.png`。
- 柏油颜色、道路中心线、宽度、建筑、地形和水域数据未改变。

## 2026-10-03 道路边缘平滑与地图审计

- 299条道路仍使用原始 OSM 中心线和宽度；渲染改为带圆角连接的连续轮廓，普通折点不叠加额外圆盘，减少锯齿。
- 道路网格采样 `.22`，落入建筑和水面轮廓的渲染三角面被裁掉，路线中心线不变。
- `node scripts/check-roads.mjs` 通过：299条道路、0个校界外路线点、0个非法宽度；36个建筑内中点和9个水面内中点作为原始 OSM 重叠审计旗标记录。
- 数据、地形、接地、外观和语法检查通过；生产构建和浏览器实际页面检查通过，无错误。截图：`work/road-smoothing/trimmed-roads.png`。

## 2026-10-03 连续曲线道路边界

- 新增 `src/roads.js`：用连续圆弧连接生成道路轮廓，使用精确多边形联合与差集裁剪建筑/水面；299条 OSM 中心线不变。
- `node scripts/check-continuous-roads.mjs` 通过：14个连续道路面、153个边界环、7287个边界顶点、`centerlinesChanged:false`。
- `node scripts/check-roads.mjs`、数据/地形/接地/外观/语法检查通过；生产构建和 `preview-terrain.mjs` 实际页面检查通过，无页面错误。
- 截图保存于 `work/road-smoothing/continuous-roads.png`；原始道路审计保留于 `work/road-smoothing/road-map-audit.json`。

## 2026-10-04 转弯与交叉口连续圆角

- `src/roads.js` 使用线段矩形与节点圆盘构造道路，再做精确多边形联合；急弯和相交处不依赖单个偏移多边形的尖锐斜接。299条 OSM 中心线、原宽度、路线点均保持不变。
- `src/scene.js` 复用同一组最终道路多边形给地面顶面开孔和道路贴地渲染，避免道路/地面重叠造成的锯齿、闪烁和地面露边。
- `node scripts/check-continuous-roads.mjs` 通过：299条道路、14个连续面、144个边界环、8939个边界顶点，`centerlinesChanged:false`。
- `node scripts/check-roads.mjs`、`python scripts/check-data.py`、`node scripts/check-terrain.mjs`、`node scripts/check-ground-contact.mjs`、`node scripts/check-refinement.mjs`、两个 JavaScript 语法检查通过。
- `npm.cmd run build` 成功；`preview-terrain.mjs` 实际检查桌面/移动端和页面错误，截图 `work/terrain/overview.png`；道路俯视截图 `work/road-smoothing/rounded-junctions.png`。
- 该批只改道路显示几何与地面开孔，不改变建筑、水域、运动场、DEM或社区数据；OSM原始道路中存在的可能重叠仍保留在 `work/road-smoothing/road-map-audit.json`，不能据此宣称每条道路已完成现场测绘。

## 2026-10-04 手机版地点论坛

- 选中建筑或地点后，390×844等竖屏将地图缩为上方约31%，底部论坛面板占约69%；论坛是当前手机版主体。
- 论坛支持讨论/照片页签、照片上传、1—5分评分、发布评价、逐条回复；建筑资料和模型查看移入可展开的“建筑资料与模型”。
- 固定建筑使用对应 `fixed:<建筑ID>` 社区记录，避免与用户选点混淆；评论使用随机ID并支持回复。
- `scripts/preview-mobile-forum.mjs` 通过：390×844、360×640、固定地点、发布/回复/评分/照片、刷新持久化、关闭恢复、桌面细看；错误数组为空，移动页面无横向溢出。
- `node --check src/main.js`、`node --check src/community.js`、`npm.cmd run build` 通过。截图：`work/mobile-forum/mobile-map.png`、`mobile-discussion.png`、`mobile-9x16.png`。
- 当前照片、评价和回复仍只保存在本机浏览器；云端、多用户身份和审核尚未接入。

## 2026-10-07 地面透明缺口

- 根因：道路外环被当作地面孔洞，terrain-only 视图出现大块缺面，能看到背景和底座边墙。
- 修复：恢复完整地形顶面；材质显式 `transparent:false`、`opacity:1`、`depthWrite:true`、`side:THREE.DoubleSide`。
- 道路继续使用独立连续面，贴地偏移为 `.038`，避免与完整地面发生深度竞争。
- `npm.cmd run build`、`node scripts/check-terrain.mjs`、`node scripts/check-ground-contact.mjs` 通过。
- 实际截图 `D:\Cloud_Campus\work\terrain\terrain-only.png` 显示地面连续，透明缺口消失。

## 2026-10-07 道路边缘深度竞争

- 完整地面恢复后，路面锯齿来自道路与DEM地面边缘重叠，不是道路颜色消失。
- 道路贴地偏移调整为 `.05`；柏油材质启用 `transparent:false`、`opacity:1`、`depthWrite:true` 和 `polygonOffset`。
- 地面保持完整，不再使用道路外环挖孔。
- `npm.cmd run build`、`node scripts/check-roads.mjs`、`node scripts/check-terrain.mjs`、`node scripts/check-ground-contact.mjs` 通过。
## 2026-10-10 统一手机界面

- 电脑和手机均使用同一套手机布局；桌面最大宽度 430px，居中显示。
- `node --check src/main.js` 与 `npm.cmd run build` 通过。
- 1440×900 浏览器检测：应用 x=505、宽 430px；地点论坛宽 430px、高 621px；无脚本错误，页面无横向溢出。
- `preview-mobile-forum.mjs` 本批因 Edge 启动环境退出而未跑完，不计为通过。
- 回退点：`work/gates/2026-10-10-before-mobile-only/`。
## 2026-10-10 修复打开校园网站

- `打开校园网站.cmd` 先检查 `http://127.0.0.1:4311/__campus_health`。
- 4311 无响应时，自动启动 4312 端口并打开对应网站，避免端口异常导致双击后无反应。
- `scripts/local-server.mjs` 支持 `PORT` 环境变量；`scripts/open-local.mjs` 也按 4311、4312 顺序尝试。
- `node --check scripts/open-local.mjs`、`node --check scripts/local-server.mjs` 与 `npm.cmd run build` 通过。
## 2026-10-11 双击启动文件复核

- 直接执行 `打开校园网站.cmd` 成功启动并输出实际访问地址。
- `http://127.0.0.1:4311/__campus_health` 返回 `{"app":"swu-campus-local"}`。
- 首页返回 HTTP 200，内容类型为 `text/html`。
- `node --check scripts/open-local.mjs`、`node --check scripts/local-server.mjs` 和 `npm.cmd run build` 通过。
