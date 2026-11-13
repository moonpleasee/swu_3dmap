# 西大云游维护指南

更新于 2026-11-13，面向第一次维护公开源码项目的维护者。

## 当前授权选择

自有代码采用 LICENSE 中的 PolyForm Noncommercial 1.0.0。符合条款的使用按该许可证进行，超出许可范围的商业使用需通过 GitHub Issues 联系维护者并取得另行书面授权。

外部贡献按项目现有许可提交。欢迎使用者通过 Pull Request 分享改进。使用者向本仓库提交修改属于自愿贡献，具体使用及分发义务以 LICENSE 原文为准。

地图、地形、第三方软件和照片等资料分别按其适用条款处理，范围见 NOTICE.md。采用他人的改进时，也要检查修改部分的授权并保留适用署名。

## 本地、仓库与网站

| 位置 | 用途 |
| --- | --- |
| 本地工作目录及开发分支 | 编写、调试和尝试修改 |
| GitHub 的 main | 保存维护者已经接纳的源码 |
| Git 标签与 Release | 标识可以复现的发布版本 |
| 线上静态网站 | 运行某个明确版本的 dist 构建产物 |

本地使用一个项目目录即可。分支用于区分尚在开发的改动与已接纳版本。公开仓库里的分支、提交及已发布附件都应按可公开内容管理。

部署时记录提交号或版本号。负责部署的人应按 INTEGRATION-HANDOFF.md 构建和验收，部署凭据及用户数据由相应服务单独管理。

## 每次开发的操作

先在项目目录检查状态和远程地址。

```bash
git status
git remote -v
```

确认远程为 `moonpleasee/swu_3dmap`。已有未提交修改时，先确认其归属，保存为适当提交或继续当前任务。工作目录干净后，可以从 main 更新并创建任务分支。

```bash
git switch main
git pull --ff-only origin main
git switch -c fix/building-label
```

分支名按本次任务更换。`pull --ff-only` 失败时，先查看分支和提交差异，决定如何处理双方修改。

修改后执行构建及与任务相关的现有检查。界面或模型改动还应实际查看手机和电脑页面。

```bash
npm run build
git diff
git status
```

按实际文件名逐项暂存，再审查暂存内容。

```bash
git add src/main.js
git diff --cached
git commit -m "Fix building label behavior"
git push -u origin fix/building-label
```

在 GitHub 发起 PR，目标为本仓库 main。审核、检查完成并合并后，再同步本地 main。依赖及数据检查命令见 README.md。

## 提交文件的判断

| 内容 | 管理方式 |
| --- | --- |
| 源码、运行数据、构建脚本与 package-lock.json | 提交到仓库，保证全新下载可构建 |
| 配置示例 .env.example | 使用示例值并提交 |
| 实际 .env、令牌、密钥 | 在本机或部署平台配置 |
| 用户数据库、上传照片、数据库备份 | 单独存储并备份 |
| node_modules 与 dist | 通过安装及构建生成 |
| 研究照片和素材 | 核对公开必要性及来源许可后处理 |
| 本机截图、研究缓存和回退文件 | 按 .gitignore 管理，提交前核对暂存清单 |

Git 历史可能保留已经删除的文件。.gitignore 对已跟踪内容的处理范围需要配合实际跟踪状态核对。如果发现有效凭据曾被提交，应先撤销或更换，再评估历史清理。个人本机备份与云端用户数据备份也需要另外安排。

## 接收外部修改

外部开发者可以 Fork、修改、测试，再通过 PR 提交。普通访客的 Fork 有独立权限。是否给某人本仓库写入权限，应按实际协作需要决定。

维护者审核 PR 时检查以下内容。

- 修改是否围绕一个明确的问题，原因是否清楚。
- 建筑照片是否对应真实地图上的具体楼栋，名称与尺寸的依据是否可追溯。
- 是否意外改动大量建筑、已有参考配置或地形数据。
- 是否引入凭据、私人文件、权限不明的照片或第三方代码。
- 构建和相关自动检查是否通过，界面与模型是否实际查看。
- 是否修改工作流、依赖安装命令或其他会执行代码的内容。

首次贡献者的工作流可能需要维护者批准运行。批准前先查看改动，尤其是 .github/workflows 和安装脚本。一般贡献测试使用最小权限，部署密钥由部署流程单独管理。

自动检查覆盖程序和数据约束，建筑真实性、审美与需求仍由人工判断。资料不足时，可要求补充或保留待核状态。维护者可以要求修改，也可以说明原因后关闭 PR。

## 别人的改进如何获得

PR 是直接接收改进的入口。公开 Fork 也可以查看和比较，在许可允许的范围内引入合适修改。仅保存在对方电脑或私有仓库的修改，需要对方愿意分享或存在适用的提供义务才能取得。

GitHub 不会自动将所有下游修改同步给维护者。本项目通过清楚的贡献说明、反馈入口和具体可参与任务鼓励回馈。

## 保护 main

.github/CODEOWNERS 将 moonpleasee 设为审核负责人。GitHub 的强制合并规则还需单独启用。

本次核对时，仓库仍为 Private，main 尚未受保护。GitHub API 返回当前套餐需升级 Pro 或将仓库公开后才能启用分支保护。可用性应以实际账户和仓库结果为准。

公开后，在 Settings → Branches 为 main 配置保护，按实际协作情况设置。

- Require a pull request before merging。
- 外部贡献需要维护者审核，可结合 CODEOWNERS 要求审核。
- Require status checks to pass before merging，选择本仓库 CI 的 verify 检查。
- 新提交使旧审批失效，并要求处理未解决的讨论。
- 对 main 的强推和删除施加限制。

单人维护时，要确认本人提交的 PR 能通过所选规则完成。GitHub 不允许作者批准自己的 PR，需要另一位可信审核者，或明确的维护者绕过安排。管理员绕过同样属于需要审慎使用的权限。

保存后查看一条实际 PR 的合并条件，确认规则生效。CODEOWNERS 文件和通过的 CI 本身不等于已启用上述保护。

## 发布与恢复

从通过检查的 main 选择一个明确提交，按 README 构建，实际检查手机和电脑页面。记录发布版本、已知问题、数据精度及部署提交号。创建标签和 Release 时使用描述清楚的版本号，例如 v0.1.0，后续修复可递增为 v0.1.1。

开发者可按标签取回源码。部署者还需保留上一个静态包或托管平台发布版本。源码中撤销已合并修改可以使用 git revert，并通过 PR 复核。线上快速恢复按部署交接切回上一份完整静态版本，随后修复源码。

恢复地图静态包时，同时检查数据库与用户上传资料的处理范围，按实际部署方案保护这些内容。

## GitHub 日常管理

Issues 用于收集问题和讨论，PR 用于提交实际文件改动。对反馈说明已确认、待补资料、计划处理或暂不处理的状态。合并修复后关联并关闭相应 Issue。

给愿意参与的人提供范围明确的小任务，例如某栋楼的名称核实或入口照片整理。处理贡献时保留作者署名与来源。依赖升级、功能变动和数据更新应分别记录影响，方便定位回归。

仓库权限只授予必要的协作者。账号认证、服务凭据、数据备份和漏洞反馈渠道定期核对。安全问题入口见 SECURITY.md，建筑与代码贡献规则见 CONTRIBUTING.md。

## 参考

- [GitHub 的分支、Fork 与 PR 流程](https://docs.github.com/en/pull-requests/concepts/writing-code-for-a-project)
- [GitHub 分支保护](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [PolyForm Noncommercial 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0)
