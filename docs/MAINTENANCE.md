# 维护与公开准备

更新于 2026-11-13，由 moonpleasee 维护，公开联系入口为 GitHub Issues。

## 日常开发

继续使用现有本地项目目录。先检查 `git status` 和 `git remote -v`，处理好现有修改，再同步 main 并创建任务分支。

```bash
git switch main
git pull --ff-only origin main
git switch -c fix/building-label
```

修改后构建、运行相关检查并查看页面，用 `git diff` 检查改动。逐项暂存文件后，审查 `git diff --cached`，再提交和推送分支，通过 PR 合并到 main。

源码、运行数据、依赖清单与构建脚本需要能让别人全新下载后运行。实际 .env、密钥、用户数据库和上传照片单独存储。Git 历史会保留旧提交，公开前也需要考虑历史内容。

## 协作与恢复

别人可以 Fork 后修改，再自愿提交 PR。你也可以查看公开 Fork，在许可允许的范围内引入改进。保存在对方电脑或私有仓库的修改，需要对方分享或存在适用的提供义务才能取得。

审核 PR 时确认改动范围、资料来源、检查结果和实际页面。尤其检查建筑照片是否对应正确楼栋，以及工作流、依赖和执行脚本的变动。合并由维护者决定。

部署时记录源码提交或版本号，保留上一份完整静态包。已合并的问题可以通过 `git revert` 撤销并复核。具体部署和回滚见 [DEPLOYMENT.md](DEPLOYMENT.md)。

## 常用检查

```bash
npm run build
node scripts/check-terrain.mjs
node scripts/check-ground-contact.mjs
node scripts/check-road-height-sampler.mjs
npm run test:backend
```

装有 Microsoft Edge 的开发机，还可运行 `node scripts/preview-display-only.mjs` 与 `node scripts/check-packed-build.mjs`，检查手机和电脑页面、展示模式及精简数据完整性。

## 发布准备状态

项目介绍、许可、来源说明、贡献入口、审核负责人和自动检查已准备。前批程序验证及 GitHub CI 通过，包含全新目录安装构建、390×844 与1280×800页面、建筑详情和数据还原检查。详细验证见 [VALIDATION.md](VALIDATION.md)。

准备时的自动密钥扫描未检出问题。历史仍含旧研究快照、开发工具配置与作者元数据，自动扫描无法判断所有资料的公开和再分发权。

仓库仍为 Private，Issues 已启用。GitHub API 明确返回当前套餐需升级 Pro 或先公开，才能启用分支保护。目前 main 尚未受保护，CODEOWNERS 和通过的 CI 本身不等于强制审核。

决定公开后，在仓库 Settings → General → Danger Zone 更改可见性。随后核对 main 分支保护、CI检查、PR审核和私密漏洞报告入口。单人维护时，审核规则需要兼顾作者无法批准自己PR的情况，按实际协作安排可信审核者或维护者例外权限。

公开后检查源码下载、图片和 Issues 入口，按需创建 Release。当前授权为 [PolyForm Noncommercial 1.0.0](../LICENSE)，超出许可范围的商用需另行联系授权。第三方范围见 [NOTICE.md](../NOTICE.md)。
