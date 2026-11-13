# 西大云游：长期协作约定

- 唯一开发项目根目录：`D:\swu-campus-3d`，本目录拥有独立Git元数据。旧位置只用于历史追溯。
- 用户所说“更新git”“上传GitHub”“推送项目”，默认且唯一目标为仓库 `https://github.com/moonpleasee/swu_3dmap.git`，主分支 `main`。
- 执行Git操作前先确认 `git rev-parse --show-toplevel` 和 `git remote -v`。云校园共享仓库为 `snsn78/Cloud_Campus`，用户选择保留其中已有内容。地图更新只推送上述个人仓库。
- 不将用户数据库、上传图片、密钥、依赖目录、构建产物或视频输出提交Git。work为本机研究、回退与测试产物，默认不提交；需要可移植证据时另选必要文件。
- 先阅读 `HANDOFF.md` 最新状态、`docs/DEPLOYMENT.md` 和现有源码。当前只展示地图，讨论显示“暂不开放”；未经用户要求不得恢复社区。
- 地图功能开发由本项目开发AI负责；现有主站及集成部署由另一AI负责。部署交接以 `docs/DEPLOYMENT.md` 为准。
- 自有代码按 LICENSE 中的 PolyForm Noncommercial 1.0.0 授权，第三方数据和依赖按 NOTICE.md 保留各自许可。公开联系入口为 GitHub Issues。
- 用户已选择使用者自愿回馈改进、外部贡献沿用项目现有许可。后续授权调整需依据用户新的明确决定。
- 用户偏好简洁的个人项目仓库。详细文档集中在docs，维护说明与公开准备合并在docs/MAINTENANCE.md，楼栋清单放在data-sources/registers，规则优先合并进现有说明。
- 此文件记录用户长期偏好。新会话应沿用上述仓库，并实际核对可见性与文件状态。
