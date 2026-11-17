# 当前接续摘要 · 2026-11-17

## 当前界面方向

用户要求默认手机版，电脑开发和预览也采用手机竖屏布局。已根据用户指出的长度问题将宽屏预览设为9∶16，最大430×764.44px，窗口较矮时等比缩小并在水平、垂直方向居中。实际手机窄屏占满宽度并沿用实际屏幕高度。手机样式共用，探索面板默认及复位时收起，选中建筑从底部展开69%画布高度的详情，内部高度随画布计算。

preview-responsive已按新需求更新并通过390×844、1280×800、1440×900、900×700、360×640检查，覆盖居中、搜索、详情、弹窗、返回和复位。截图已查看，结果位于work/mobile-layout-2026-11-17。生产构建、preview-display-only与check-packed-build均通过，启动入口为http://127.0.0.1:4311/。README截图和部署说明已同步。

## 当前公开状态

用户已将moonpleasee/swu_3dmap改为Public，匿名API及README、LICENSE、NOTICE、反馈模板和手机/电脑截图均可访问。CODEOWNERS无语法错误。已启用main分支保护，普通写入者经PR、至少一次CODEOWNERS审核、GitHub Actions的verify检查、分支同步及讨论解决后合并，新提交使旧审批失效，限制强推与分支删除。为单人维护保留管理员例外（enforce_admins:false），管理员可绕过这些限制。私密漏洞报告已启用并通过GET复核，详情在本机work/public-release-2026-11-13/public-settings-verification.json。

## 当前项目位置与仓库分离

2026-11-14仓库复查补齐Docker构建阶段所需的数据精简脚本、LICENSE和NOTICE，加入本机宣传素材及私密配置的忽略规则，移除网页未使用的旧微信小程序project.config.json。后端部署文档补充当前展示模式说明。机器未安装Docker，镜像构建尚未实测。

唯一开发目录为 `D:\swu-campus-3d`。已将最新版连同独立.git、依赖、本地用户数据、研究资料和宣传素材从云校园目录整体迁出。迁移前后核对115个源码与本机重要文件哈希、HEAD和origin均一致。当前origin为https://github.com/moonpleasee/swu_3dmap.git，main分支。云校园共享仓库保留原有内容，本机稀疏检出排除swu-campus-3d目录，工作区保持干净。

早期D盘副本的Git历史已导入个人仓库并推送标签 `archive/legacy-local-map-2026-11-14`，对应8cf50a2。已验证可从Git读回300栋地图数据。扫描含该旧版的15个提交，未检出密钥。

用户完成手动清理后复核，work/migration-2026-11-14/local-archives、work/gates和work/public-release-2026-11-13/clean-checkout三个目录均已不存在，云校园原地图目录也不存在。此前32个代码及数据文件与迁移前哈希核对一致，Git标签可读回300栋旧版数据。原照片、视频与非Git资料的校验ZIP和Git bundle仍在work/migration-2026-11-14，现用595份原研究文件位于work/research-sources。

早期C盘任务目录只保留AGENTS.md迁移指引。新路径生产构建、展示版与数据精简页面检查通过，390×844和1280×800可打开详情、无横向溢出或新增控制台错误。启动入口已从D盘新目录启动4311服务，健康接口返回backend:true。共享仓库HEAD、origin和其他文件索引哈希一致，工作区干净。本轮仓库复查完成，旧副本清理结果已确认，当前公开及保护状态见本文件顶部。

## Git迁移 · 2026-11-02

地图目录已拥有独立Git仓库，根目录为D:\Cloud_Campus\campus-platform-starter\swu-campus-3d；origin仅指向用户的私有仓库https://github.com/moonpleasee/swu_3dmap.git，main分支。以后用户说“更新git”默认更新此仓库。原Cloud_Campus平台远程未更改。通过subtree split保留地图自身的历史，不包含另一平台代码。work/outputs为本机产物，不随新版本提交；历史既有研究文件可能仍在旧提交中。源码、地图数据、构建脚本、后端及文档纳入新仓库。长期约定见AGENTS.md。

## 当前最高优先状态：仅展示（2026-11-02）

用户暂时关闭社区。默认 `COMMUNITY_ENABLED=0`（不设也关闭）；前台不提供账号/地点创建/照片/评分/名称建议发布，详情显示讨论“暂不开放”；API除health外关闭，历史数据库和照片保留。部署Compose固定关闭社区。仅展示可直接托管dist，无社区后端依赖。不得按旧接续记录开启社区；未来恢复需用户明确要求。启用社区的旧回归测试通过createApp显式options运行临时测试库，不影响实际开关。新检查脚本preview-display-only.mjs。

## 最新接续 · 2026-11-02 名称建议、楼名缩放与社区后端

- `src/scene.js`：初始全景（相机距离>=300）不显示楼名；放大到300以内显示精选，190以内显示一般建筑，95以内显示待核名，保留碰撞避让。初始DOM标签也hidden防闪现。
- 待核名/冲突建筑详情标题下新增名称建议表单，绑定本栋ID、建议名及依据；审核不会自动覆盖地图。保留当日极简风格。
- 新增`server/`：Node24+Express+SQLite持久社区与本地WebP图片存储；账号密码会话、地点、评论/回复（15秒轮询）、评分覆盖、建议、审核、举报与删除、审核日志。`/admin`是管理入口，无默认管理员密码；`npm.cmd run admin`设置。默认先审后发，SQLite和uploads位于server-data，已忽略Git。
- `community-api.js`/`account.js`替代当前页面的localStorage读写；旧`community.js`与浏览器旧记录保留，但不自动迁移。地图账号独立，未与旁边campus-platform订单账号打通。
- 原本地启动器现在调用新后端；`npm.cmd start`与`打开校园网站`均服务dist+API。4311本地服务已重启。不要用旧纯静态服务覆盖本批API。
- 部署及成本详见根目录`docs/DEPLOY-CN.md`，提供Dockerfile/compose/Caddy/备份脚本。注册在云部署默认关闭。当前账号不是实名认证；大陆公开社区上线前需要主体、备案、真实认证、协议与运营审核等；未购买服务器、未部署到公网、未接SMS/微信/COS/自动内容审核。当前机器无Docker，容器配置未在云机实测。
- 验证：`test:backend`通过，覆盖权限、来源校验、审核隔离、图片解码与访问、评分覆盖、建议、举报、删除及重启持久化；`preview-community-backend.mjs`用临时DB测试初始无标签/缩放/名称建议/注册/评论/另浏览器读取/手机390px，无页面错误，截图和报告`work/community-backend-2026-11-02/`。生产构建通过，npm审计0漏洞；Vite升级8.3.5、sharp使用0.35.5。
- 本批未更改建筑、道路、地形数据。回退源文件在`work/gates/2026-11-02-before-community-backend/`。下一步：与用户确认实际部署主体和域名/服务器配置，再接入真实认证；先完成Docker云机部署与备份恢复验收，再开放公测。功能缺口：自助账号找回/注销、分页与单条回复管理、私信/WebSocket、云审核与对象存储；不要称完整商业社交后端或已经公网上线。

## 2026-10-27 电脑与手机分别布局

- 用户要求电脑打开为电脑界面、手机打开为手机界面。本批恢复 `760px` 响应式断点：手机仍是全屏地图加底部探索/地点论坛；电脑使用铺满窗口的地图、常驻左侧目录和右侧地点论坛。900px 小屏电脑仍保留侧栏，1280px 宽屏选中建筑后地图与论坛并排。
- `src/style.css` 将7处错误全屏生效的手机规则改为仅在 `max-width:760px` 生效，移除电脑端430px宽度上限，并补充电脑端地图、顶部栏、探索侧栏、灯光/漫游工具、详情面板和中等宽度规则。`src/main.js` 按断点展开/收起探索栏；窗口尺寸改变和返回全景时同步状态。
- 回退快照：`work/gates/2026-10-27-before-responsive/`；没有修改建筑、道路、地形或社区存储数据。
- 验证：`node --check src/main.js`、`npm.cmd run build` 通过；`scripts/preview-responsive.mjs` 检查390×844手机、1280×800电脑、桌面建筑详情、900×700小屏电脑和缩回手机后的论坛，均无页面错误和横向溢出。截图和尺寸报告在 `work/responsive-2026-10-27/`。
- 下一步可在真实手机上核对输入法弹起、安全区和地点照片浏览；当前社区仍只保存在浏览器本机。

## 2026-10-11 探索界面与地点社区交互优化

- 本批只修改界面与交互，不修改300栋建筑、地形、道路、水域、运动场或外观资料。
- `src/main.js`：收起探索面板时保留可用的搜索入口；展开后显示可横向浏览的分类筛选；新增清除搜索/筛选操作；搜索结果数量会区分全部目录和筛选结果；用户地点不再把固定建筑的 `fixed:*` 社区记录重复计入目录。
- `src/main.js`：选中建筑或地点前记录探索面板的展开状态、搜索词、分类和列表滚动位置；关闭论坛详情后恢复这些状态；照片、评论、回复和评分刷新时保留当前讨论/照片页签及详情滚动位置；键盘 `/` 会展开探索面板再聚焦搜索。
- `src/style.css`：统一西大云游的森林绿、米白、暖金视觉 tokens；增大手机搜索框、筛选胶囊、地点结果和论坛触控区域；限制长名称溢出；修复收起面板与底部工具条的点击层级冲突；详情论坛高度改为相对 `.app-shell` 的31%/69%，桌面带外壳边距时不再被裁切。
- 新增 `scripts/preview-ui-refresh.mjs`，验证390×844收起搜索、展开筛选、搜索清除、结果选择、关闭后恢复查询和无横向溢出；报告与截图在 `work/ui-refresh/`。
- 已更新 `scripts/preview-mobile-forum.mjs` 的等待方式，使用正确的 Playwright 参数并允许场景加载较慢时继续等待。
- 验证：`npm.cmd run build` 成功；`preview-ui-refresh.mjs` 通过且 `errors: []`；截图已实际查看 `work/ui-refresh/collapsed.png` 与 `search-expanded.png`。已有论坛回归逻辑未改动，完整旧脚本应在本地服务稳定后再复跑。
- 下一步：若继续优化，优先在真实手机浏览器检查安全区、键盘弹起和论坛照片大图浏览；不要把本地 localStorage 社区数据当作多人后端。建筑、道路和地形继续按各自清单处理。

## 当前实际进度

- 数据仍为300栋建筑、93个场地/水体/绿地要素、299段道路和12处地标。
- 116栋既有参考配置保持不变（63栋单体照片、53栋园区风格）；本批为其余184栋新增独立“用途与轮廓估算”配置。当前外观依据计数为：single-photo 63、garden-photo 53、inferred 184、未配置 0。
- 300栋现在都有独立墙面、窗格、屋顶收边和入口几何；新增入口全部标记为 `entryBasis: inferred`，不代表已找到本栋照片。参考配置的轮廓、层高、名称、屋顶和颜色未被覆盖。
- 名称仍有151栋待可靠确认、4处冲突；这与外观配置统计有重叠。184栋估算楼栋仍列在 `data-sources/registers/REMAINING-BUILDINGS.csv`，状态是“已有独立估算配置，仍待照片核实”，不能称为照片精确还原。

## 2026-09-26 估算外观批次

新增保护式脚本 `scripts/apply-inferred-exteriors.py`，先把 `work/inferred-exteriors/before-campus.json` 和 `before-profiles.json` 保存为基线，再按地图轮廓、用途标签和既有层高为184栋逐栋生成稳定参数。教学/实验室/宿舍/住宅/食堂/商业/温室/服务/体育/医院分别使用不同墙色、窗格密度、阳台或百叶、屋面色和入口宽度；入口朝向按本栋OSM多边形上最接近校内道路的外墙边估算，台阶按体量缩放。

本批没有新增照片证据，没有把相邻楼栋或网上其他建筑照片套用到未确认对象；所有新增对象的观察记录、估计范围、OSM轮廓来源和入口待核说明已写入 `data-sources/exterior-profiles.json`、`public/data/campus.json` 和 `data-sources/registers/EXTERIOR-REGISTER.csv`。温室等特殊用途保留原轮廓和现有低矮高度，不因估算配置擅自改动几何。

## 验证与接续

- `check-data.py`、`check-exteriors.mjs`、`check-roofs-entrances.mjs`、`check-refinement.mjs`、`check-terrain.mjs`、`check-ground-contact.mjs`、`check-researched-batch-2026-09-24.mjs` 均通过；验证显示300个入口配置、41个完整坡屋顶、无接地异常。
- 既有116栋参考外观与批前校园快照逐字段比较无差异；建筑轮廓、层高和名称也无差异。
- 下一步只应从 `data-sources/registers/REMAINING-BUILDINGS.csv` 中为能获得本栋照片的楼栋替换对应“估算”细节，并保留照片年代、可见范围和未覆盖面说明；不要把本批估算计作新增照片参考。

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

原101个参考建筑、全部290个非目标建筑的记录以及道路、表面、边界经基线比较未变。基线和截图在 work/building-batch/。data-sources/registers/BUILDING-REGISTER.csv、data-sources/registers/EXTERIOR-REGISTER.csv、data-sources/registers/REMAINING-BUILDINGS.csv 已导出，剩余清单189行。

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

当前验证：300栋数据、300栋外观实例、25栋坡屋顶、113处常驻入口检查通过；生产构建成功。data-sources/registers/REMAINING-BUILDINGS.csv 当前187行。导航功能本轮只完成方案讨论，尚未写入代码。

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
- `data-sources/registers/BUILDING-REGISTER.csv`、`data-sources/registers/EXTERIOR-REGISTER.csv`、`data-sources/registers/REMAINING-BUILDINGS.csv` 已按本批数据重新导出；剩余清单184行。下一步从清单中选取有可靠对应照片的对象继续逐批处理，优先补齐能确认入口或屋顶的建筑；不要把同组参考当成单体精确复原。

## 2026-09-26 地图对应修订

用户要求每栋楼必须对应真实地图对象。本次保留184栋估算配置的外观分类，但把入口与临街方向重新按当前 `campus.json` 的本栋 OSM 多边形和299段校内道路计算：优先选择该多边形外墙中点距道路最近的一边，记录 `mapObjectId`、`mapSourceId`、`mapCenter`、`footprintEdgeLength`、`nearestRoadDistance`。没有近道路的轮廓才回退最长边；不是通过楼名查找位置。116栋既有参考配置未变。

本次验证：7组数据/几何/地形/接地检查通过；300栋入口配置、41个完整坡屋顶；`preview-inferred.mjs` 实际访问温室、教育超市、二院、物业管理中心和圆顶5个估算对象，详情均显示“用途与轮廓估算，待照片核实”，入口按钮可用，浏览器无错误；`npm.cmd run build` 成功。压缩包已更新。

下一步：继续为 `data-sources/registers/REMAINING-BUILDINGS.csv` 中的184栋寻找能与这些 OSM 对象可靠对应的本栋照片或航拍，逐栋将估算字段替换为有日期和可见范围记录的参考配置；地图对应字段应保留。

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

本批建立回退检查点：`work/gates/2026-09-29-before-ground-smoothing-164050/`。该检查点包含本批修改前的 `src/terrain.js`、`HANDOFF.md`、`docs/VALIDATION.md`，需要撤回时按 `GATE-MANIFEST.json` 恢复。

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
## 2026-10-10 统一手机界面

按用户要求，页面现在在电脑和手机上均使用手机竖屏布局。桌面浏览器中，应用居中显示，最大宽度 430px；地图、探索面板和地点论坛维持手机布局，选中地点后论坛占下方约 69% 高度。`src/main.js` 的探索面板初始化不再按浏览器宽度切换，电脑打开时也默认收起。回退点在 `work/gates/2026-10-10-before-mobile-only/`。

本批仅调整 `src/style.css` 和 `src/main.js`，没有修改校园模型、地点数据或论坛存储。`node --check src/main.js` 与 `npm.cmd run build` 通过。桌面 1440×900 的实测应用宽度为 430px 且居中，地点论坛面板尺寸为 430×621px，页面没有横向溢出或脚本错误。旧的 `preview-mobile-forum.mjs` 在当前运行环境启动 Edge 时失败，不能将整套自动预览记为通过。下一步如需调整电脑上的手机画布宽度，可修改 `.app-shell` 的 `max-width`。
## 2026-10-10 修复“打开校园网站”启动文件

复现后确认原 `打开校园网站.cmd` 依赖的 Node 后台进程在 4311 端口异常占用时会一直等待，浏览器不会打开。启动文件现在先检查 4311 的健康接口；如果不可用，就在新窗口启动 4312 端口的静态服务器，等待后自动打开对应地址。`dist/index.html` 已存在时不需要重新安装依赖或启动开发服务器。

相关文件：`打开校园网站.cmd`、`scripts/local-server.mjs`、`scripts/open-local.mjs`。双击文件即可启动；若电脑已有健康的 4311 服务，继续使用 4311；若 4311 被占用或无响应，使用 4312。下次若要恢复单一端口，只需释放占用 4311 的旧 Node 进程。
## 2026-10-11 双击启动文件复核

复现了用户双击 `打开校园网站.cmd` 后无浏览器的情况。根因是临时的批处理端口启动逻辑没有可靠等待后台 Node 进程，导致端口状态异常时直接结束。现在恢复为：检查 Node.js 和 `dist/index.html`，必要时先生产构建，再调用 `scripts/open-local.mjs`；该脚本按 4311、4312 检查健康接口，服务就绪后再调用 Windows 浏览器打开实际地址，并输出失败原因。

已在正常 Windows 权限下执行 `cmd.exe /d /c "打开校园网站.cmd"`，输出 `Opening campus website: http://127.0.0.1:4311/`；随后首页健康检查返回 HTTP 200。`node --check` 和生产构建通过。

## 2026-11-02 极简界面
新增 src/minimal.css，统一中性色、蓝色操作、简洁圆角及边框。main.js 精简品牌与搜索文案。移除首页宣传语、英文副标题、背景纹理及重复辅助小字；保留社区本机存储提示、资料精度与地图署名。地图和社区数据未更改。回退文件在 work/gates/2026-11-02-before-minimal。生产构建及 JS 语法检查通过；preview-responsive.mjs 手机、桌面、详情及900px检查通过，无页面错误；已查看截图，报告保存在 work/minimal-ui-2026-11-02。下一步可继续真实手机触控检查。

### 名称建议简化
按用户要求，名称建议仅需名称；前台移除依据输入框，API将依据改为可选（空字符串），保留历史数据库字段。后端测试已覆盖只提交名称成功；生产构建通过。

## 双AI分工与集成接续
用户现有域名及原站由另一个AI维护和部署；本AI继续负责西大云游实际开发。已新增根目录 docs/DEPLOYMENT.md 供部署AI阅读，首选子域名入口集成；子路径和跨origin iframe尚需源码/响应头适配，不可称已即插即用。当前未改部署拓扑、未操作域名或线上网站。

## 仅展示版部署交接文档重写
INTEGRATION-HANDOFF.md已整体改写为静态展示集成交接，移除本次必须部署后端的表述。覆盖子域/子目录/iframe、尾斜线、API探测冲突、文件清单与数据保护、缓存/回滚/验收。旧文档保存在work/handoffs/INTEGRATION-HANDOFF-before-display-only.md。仅改文档，未动功能或线上配置。

## 2026-11-02 手机端地图加载修复

用户反馈手机页面能打开，但三维地图长时间加载或空白。Pixel 7 触控模拟的基线测量显示，初始化约 26–30 秒；其中道路高度计算约 22 秒：每个道路网格点原先都线性扫描全校道路。6 倍 CPU 限速模拟超过 3 分钟仍未完成。

本批改动：`src/roads.js` 增加精确道路中心线空间索引，`src/scene.js` 的道路网格改为复用索引采样，保留原道路多边形与中心线；手机触控窄屏适度降低地面及道路内部网格密度、画布像素比，关闭高开销阴影与抗锯齿，电脑端渲染配置保留。手机保存地图图片前显式重绘。`src/main.js` 不再等待社区接口才创建地图，接口慢或不可用时仍先展示三维校园。追加启动阶段时间信息到 `__campusDebug` 供后续排查。回退文件在 `work/gates/2026-11-02-before-mobile-map-fix/`，基线提交见其中 `BASE-COMMIT.txt`。

验证：`check-road-height-sampler.mjs` 将 2799 个采样点与旧精确扫描逐点对照，通过；`check-continuous-roads.mjs`、`check-terrain.mjs`、`check-ground-contact.mjs`、JavaScript 语法检查及生产构建通过。Pixel 7 正常触控模拟地图约 3–4 秒完成，6 倍 CPU 限速约 10 秒完成；手机首帧绘制调用由 1635 降至 916，三角面约 262 万降至 173 万。放大到中心图书馆的路面截图与本批调整前对照，未见明显轮廓或接地退步。实际操作验证地图显示、搜索并打开中心图书馆、导出地图图片均通过；模拟社区接口延迟 12 秒时，地图仍约 3.6 秒加载完成。`preview-responsive.mjs` 的手机、电脑、详情和紧凑窗口检查通过，无页面错误。报告和截图在 `work/mobile-load-2026-11-02/`。

未在用户的真实手机及其线上网址上实测。若该手机更新后仍空白，下一步需取得手机型号、浏览器和实际网址，检查 WebGL 支持与资源请求；不要把模拟器结果称为所有手机均已验证。

## 2026-11-02 OSS 静态资源加载优化

源 `index.html` 增加相对路径 `./data/campus.json` 的匿名 fetch 预加载、纯 CSS 启动画面，并将描述改为仅展示定位。`src/main.js` 仍使用默认同源 `fetch`；生产构建的 `import.meta.env.BASE_URL` 为 `./`，与预加载的 URL 和凭据模式一致。浏览器实测校园数据只请求一次。

构建时 `scripts/pack-dist-data.mjs` 将公开的完整 JSON 转为可检查的精简 JSON，写入 `dist/data/`。`src/data-pack.js` 用重复字符串和对象字段表、坐标差值及高程厘米差值编码；页面读取后无损还原。`public/data/` 保持原样，全部建筑及详情字段不删不改。构建脚本在写出前比较还原结果与原始数据；`scripts/check-packed-build.mjs` 再核对 dist、预加载路径、浏览器请求次数和响应式页面。

本批体积（字节，未压缩）：campus 818573 → 342341；terrain 174296 → 100816。建筑 300 栋，ID、名称、分类和所有其他字段前后逐项相同。新资源：`dist/assets/index-Bi_5u_1O.js`、`index-C0NqqXvJ.css`。`npm.cmd run build`、`node scripts/preview-display-only.mjs`、`node scripts/check-packed-build.mjs` 均通过；390×844 与 1280×800 无横向溢出、页面错误或控制台错误，建筑详情可打开。

部署时上传整个 `dist/`，勿用 `public/data/` 覆盖已精简的 `dist/data/`；静态更新宜原子切换，避免旧版 JS 与新版 JSON 混用。线上香港 OSS 的实际握手与首屏时间仍需部署侧复测。

## 2026-11-13 公开源码准备与商业授权

用户确认采用标准 PolyForm Noncommercial 1.0.0，并明确要求超出其许可范围的商业使用先联系本人、取得另行书面许可。公开联系入口为 GitHub Issues。LICENSE 来自官方完整文本，README、NOTICE、包元数据和贡献说明记录适用范围，OSM 数据继续按 ODbL 1.0 提供。

README 已按当前展示状态重写，补充安装、构建、部署、模型资料精度和实际手机/电脑截图。新增建筑纠错、页面问题、功能建议和商业授权咨询表单、PR 模板、安全反馈说明及只读构建检查工作流。前端第三方许可全文在 public/THIRD-PARTY-NOTICES.txt，构建还将 LICENSE、NOTICE.md 复制到 dist。仓库简介和主题已通过 API 更新，Issues 已启用。

检查时发现前批手机性能和数据加载优化尚未提交，相关源码与检查脚本也纳入本次版本保存。建筑和地形源数据无变更。宣传图片所在 launch-assets/ 为本机未提交内容。

Gitleaks 8.30.1 对现有 11 个提交和本批暂存改动均未检出密钥。历史包含 284 个 work 路径及旧 project.private.config.json，后者字段仅为开发工具设置。此扫描为自动密钥检查，资料再分发权及历史内容是否适合公开仍需结合实际内容判断。历史清理或改写尚未执行。

从 Git 索引导出的干净目录完成依赖安装和构建。首次 npm 下载连接重置，补齐官方缓存后 npm ci --offline --no-audit 成功。地形、接地、2799点道路采样与后端测试通过。preview-display-only 和 check-packed-build 通过，390×844、1280×800 下详情可打开，每页仅一次 campus 请求，无横向溢出及新增控制台错误。源码恢复后的完整数据与原始文件相同。报告在本机 work/public-release-2026-11-13/。

最后核对仓库为 Private，账号有推送和管理权限。下一步在本批提交推送后询问用户是否立即改为 Public，说明现有提交历史会同时公开。仓库可见性须以 GitHub 实际结果为准。公开后可检查私密漏洞报告功能及首次工作流结果，再按需创建发布版本。

## 2026-11-13 维护流程与公开准备报告

上一批19bfdcb已推送至main，GitHub Actions执行成功。用户进一步选择继续采用当前标准非商用许可，使用者自愿回馈改进，外部贡献沿用现有项目许可。

新增 docs/MAINTENANCE.md 回答本地开发、公开文件、分支/PR审核、获取下游改进、权限、发布和回退问题。新增 docs/MAINTENANCE.md#发布准备状态 记录公开准备结果及限制，README提供入口，CODEOWNERS指定moonpleasee审查PR。贡献指南明确维护者决定实际合并。

实际API检查显示仓库Private、Issues开启、自动合并关闭，main尚未受保护。分支保护和rulesets返回403，GitHub要求升级Pro或将仓库公开。私密漏洞报告状态接口返回404。报告已明确这些未完成配置，公开后需实际启用并验证。源码文件及平台状态分开记录。

本批仅修改文档和审核负责人文件，文档链接检查与生产构建已通过。推送后CI结果可在GitHub Actions核对。下一步由用户决定公开，公开后落实平台保护规则。

## 2026-11-13 精简仓库文件

用户要求按个人项目的规模减少文件和重复规则。README缩短，维护指南与发布报告合并为docs/MAINTENANCE.md，详细部署、来源、地形与验证说明移入docs。三份建模历史合并为docs/BUILDING-HISTORY.md，原文信息保留。贡献与安全入口移入GitHub可识别的.github目录，反馈模板统一为一个。

三份CSV原样移至data-sources/registers，export-register.py和export-remaining.py同步输出路径，迁移同时更新文档引用。根目录保留README、LICENSE、NOTICE、AGENTS、HANDOFF及运行配置。后续资料优先补充现有文档。

根目录已跟踪文件32→17，其中Markdown16→4；仓库已跟踪文件总数114→107。相对链接检查、三份CSV的Git对象逐字节比较、隔离目录导出与生产构建均通过。

当前仓库依然为Private，公开与商用授权方式沿用用户已确认的决定，GitHub平台保护的套餐限制仍记录在docs/MAINTENANCE.md。
