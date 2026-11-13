# 西大云游 · 西南大学三维校园地图

西南大学北碚校区的交互式三维校园地图，使用 Three.js 程序化生成建筑、道路、水域与地形，支持在手机和电脑上探索校园。

由 [moonpleasee](https://github.com/moonpleasee) 维护。自有代码采用 **PolyForm Noncommercial 1.0.0 非商用许可证，商用需另行联系授权**，适用范围见文末。

![电脑上的西大云游全景](docs/images/campus-desktop.webp)

## 当前功能

- 三维地图包含 300 个建筑对象、299 条道路分段、93 个水体、绿地及运动场要素。
- 搜索现名、旧名和宿舍舍号，按类型筛选，通过列表或地图选中建筑。
- 查看建筑资料与参考来源，单栋旋转、缩放，近距离观察外观和入口。
- 旋转、平移、缩放、俯视、全景复位，切换日间、黄昏及夜景，自动漫游。
- 按需显示建筑、道路、绿地、水体和名称，导出带地图署名的 PNG 图片。
- 手机采用折叠探索面板与底部详情，电脑采用宽屏布局。

**当前公开展示版本中，讨论区域显示“暂不开放”。** 登录、上传照片、评论、评分和用户地点创建属于仓库保留的后续功能代码。默认运行和静态部署均使用展示模式。

<img src="docs/images/campus-mobile.webp" alt="手机上的西大云游全景" width="280">

## 本地运行

需要 Node.js 24 和 npm，浏览器需要支持 WebGL。首次下载需要联网安装依赖。

```bash
git clone https://github.com/moonpleasee/swu_3dmap.git
cd swu_3dmap
npm ci
npm run build
npm run preview
```

打开终端显示的地址，默认是 `http://127.0.0.1:4310/`。Windows PowerShell 如遇到脚本执行策略限制，可将命令中的 `npm` 换成 `npm.cmd`。

前端开发使用 `npm run dev`，该模式支持源码热更新。完整本地服务使用 `npm start`，默认地址为 `http://127.0.0.1:4311/`，并在本机创建 `server-data/`。环境变量示例见 `.env.example`，社区开关默认为关闭。

校园数据通过 HTTP 加载，请通过上述本地服务访问页面。启动文件 `打开校园网站.cmd` 也可用于 Windows 本机预览。

## 构建与部署

```bash
npm ci
npm run build
```

将 `dist/` 内全部文件上传到静态托管空间。`assets/` 和 `data/` 需要随 `index.html` 一起发布。展示模式可部署到对象存储、静态网站服务或现有站点子目录。

项目使用相对资源路径 `base: './'`。部署到子目录时，入口地址应保留结尾的 `/`，例如 `/campus/`。源码数据在 `public/data/`，构建脚本会无损精简 `dist/data/` 中的 JSON，页面读取时自动还原。

接入已有网站、缓存、发布与回滚说明见 [INTEGRATION-HANDOFF.md](INTEGRATION-HANDOFF.md)。社区后端的后续部署资料见 [DEPLOY-CN.md](DEPLOY-CN.md)。

## 模型与资料精度

当前 116 个建筑有照片或同组建筑参考配置，其中 63 个为单体照片参考、53 个为园区同组参考。其余 184 个按各自地图轮廓、用途和已有层高估算外观。上述配置均为简化表达，同组参考和估算部分需要继续核实。

地理轮廓来自 OpenStreetMap，地形基于约 30 米级公开 DEM。建筑高度、入口方向、局部平台与植被包含估算，模型可用于校园探索与展示，实地位置和道路通行情况仍需现场确认。

逐栋记录见 [BUILDING-REGISTER.csv](BUILDING-REGISTER.csv)、[EXTERIOR-REGISTER.csv](EXTERIOR-REGISTER.csv) 和 [REMAINING-BUILDINGS.csv](REMAINING-BUILDINGS.csv)。来源与地形说明见 [SOURCES.md](SOURCES.md)、[TERRAIN.md](TERRAIN.md)。

## 目录与开发检查

| 路径 | 内容 |
| --- | --- |
| `src/` | 界面、场景、建筑、道路、地形与数据读取代码 |
| `public/data/` | 可编辑的完整校园与地形数据 |
| `data-sources/` | 地图快照、建筑配置、校准及来源记录 |
| `scripts/` | 构建精简、验证、历史数据处理与预览脚本 |
| `server/` | 默认关闭社区功能的本地服务及社区后端代码 |
| `docs/images/` | 当前展示版本的界面截图 |

常用检查在完成构建后运行。

```bash
node scripts/check-terrain.mjs
node scripts/check-ground-contact.mjs
node scripts/check-road-height-sampler.mjs
npm run test:backend
```

安装了 Microsoft Edge 的开发机还可运行以下生产页面检查，覆盖手机与电脑布局、建筑详情、展示模式和精简数据完整性。

```bash
node scripts/preview-display-only.mjs
node scripts/check-packed-build.mjs
```

验证记录见 [VALIDATION.md](VALIDATION.md)。修改建筑或研究资料前，请先阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 和 [HANDOFF.md](HANDOFF.md)。历史生成脚本会重写数据，运行前需检查其输入与覆盖范围。

日常开发、审查贡献与发布回退的操作见 [维护指南](MAINTAINER-GUIDE.md)，公开前的检查结果与平台待办见 [发布准备报告](PUBLICATION-REPORT.md)。

## 反馈与参与

欢迎提交建筑名称纠错、模型照片参考、页面问题和功能建议，也欢迎通过 Pull Request 改进代码与资料。

[前往 GitHub Issues 反馈](https://github.com/moonpleasee/swu_3dmap/issues/new/choose)

Issues 是公开讨论区。提交建筑资料时请说明地图对象 ID 或具体位置、资料日期和可核实来源。照片请说明作者与允许使用的范围。具体步骤见 [CONTRIBUTING.md](CONTRIBUTING.md)，安全问题报告方式见 [SECURITY.md](SECURITY.md)。

## 授权与署名

由项目作者有权授权的自有代码采用 [PolyForm Noncommercial License 1.0.0](LICENSE)。使用、修改和分发须遵守完整条款。该许可证明确列举了个人研究等用途及教育机构等机构的许可范围。

**商用需联系授权。** 超出上述许可证许可范围的商业使用，须通过 GitHub Issues 联系维护者 moonpleasee，说明使用计划，并取得另行书面授权后再使用。商业授权的范围、期限及费用按双方实际约定确定，提交咨询本身不构成授权。

[发起商业授权咨询](https://github.com/moonpleasee/swu_3dmap/issues/new?template=commercial.yml)

| 内容 | 适用许可 |
| --- | --- |
| 自有项目代码 | PolyForm Noncommercial 1.0.0 |
| `data-sources/campus.osm` 与衍生校园数据库 | ODbL 1.0，保留 OpenStreetMap 署名及共享要求 |
| 地形数据 | 按 Mapzen / Terrain Tiles 与上游来源条款和署名要求使用 |
| 第三方依赖 | 各自许可证，前端依赖的完整文本见 `public/THIRD-PARTY-NOTICES.txt` |

第三方数据、软件与图片的权利归其相应权利人。完整范围和署名见 [NOTICE.md](NOTICE.md)。按照 OSI 的定义，开源许可包含商业使用权，本项目采用“公开源码、非商用授权”的表述。[定义说明](https://opensource.org/faq)

本项目是个人校园可视化作品，与西南大学官方无关。学校名称用于说明地图展示对象。模型与校园资料欢迎持续纠错。
