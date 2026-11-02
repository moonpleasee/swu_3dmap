# 西大云游：后端与中国大陆部署说明

核对日期：2026-11-02。本文的官方价格引用与预算估算分开列出；购买时以云控制台订单为准。

## 1. 本次已做什么

网站现在可由同一个 Node.js 服务同时提供地图和社区 API。不是仅将 localStorage 同步给服务器：账号、地点、讨论、评分与建议都保存进服务器 SQLite 数据库，照片保存为服务器 WebP 文件。

| 功能 | 当前实现 |
|---|---|
| 注册、登录、退出 | 用户名密码；scrypt 加盐哈希；HttpOnly、SameSite 会话 Cookie；会话7天有效 |
| 地点讨论 | 建筑固定编号与用户自选地图位置；评论、回复；每15秒刷新当前地点，输入中不打断 |
| 照片 | 登录上传，最大5MB，解码校验，最多2400万像素，缩至1600px，转WebP并去掉原始元数据 |
| 评分 | 每个账号每个地点一条，重复提交更新 |
| 名称建议 | 待核名/冲突建筑详情内的表单；存建筑ID、建议名与依据；管理员可回地图核对 |
| 内容管理 | `/admin` 管理页，待审地点/图片/评论/名称建议、下架、举报处理、审核操作记录 |
| 可见性 | 默认人工审核；作者可看自己的待审内容，通过后其他人可见；前台可删除自己的照片和主评论 |
| 基础防护 | 同源校验、登录与API限流、参数检查、SQL参数化、受保护的待审图片访问、上传配额 |
| 运维 | Docker/Caddy配置、健康检查、数据库备份命令、整库与图片一致性备份脚本 |

“聊天”指地点内公开讨论与回复，当前没有私信、WebSocket即时聊天、在线状态、消息推送、语音或视频。最新500条帖子用于地点展示；用户地点目录与后台队列有数量上限，规模扩大需加分页。前台没有自助找回密码、注销账号、删除单条回复的完整流程；目前需运营人员处理。这是可运行的小规模社区后端，不能称为已完成公网上线的全套社交平台。

名称建议审核通过不会自动改建筑名称，避免错误信息直接进入地图。管理员先按建筑ID打开地图、核对位置和依据，再定向更新 `public/data/campus.json` 及建筑清单，构建发布；地图中原名仍保持待核状态直到这一操作完成。

原浏览器 `swu-place-community-v1` 数据仍保留；未自动上传，也未删除。当前界面读取服务器数据，旧本地记录不会自动出现在多人社区。需要迁移时先导出备份，再做显式导入与作者确认。同仓库 `campus-platform/backend` 的订单平台账号与这张地图账号暂未打通；未来需通过统一认证适配，不应直接混用密码表。

## 2. 数据存在哪里，怎样运行

```text
手机/电脑浏览器
  → https://你的域名（Caddy 自动 HTTPS）
    → Node.js 24 / Express（地图静态资源 + /api）
      → SQLite：账号、会话、地点、评论、回复、评分、建议、举报、审核日志
      → uploads：压缩后的照片
```

本地默认数据：`server-data/campus.sqlite` 和 `server-data/uploads/`。Docker 中是名为 `campus-data` 的持久化卷，容器内 `/data`。容器重建不会清空卷；不要执行 `docker compose down -v`。数据库、图片、密码配置均不应提交Git。

选择单台服务器+SQLite是为了先控制费用，不需要先购买MySQL/Redis。适合早期、小规模、单实例使用；没有做高并发压测或跨机器高可用承诺。上传会用内存解码；访问与上传多时，应改为PostgreSQL/MySQL、私有对象存储和独立图片处理队列。

### 本地启动（Windows PowerShell）

安装 Node.js 24 后，在项目目录执行：

```powershell
cd D:\Cloud_Campus\campus-platform-starter\swu-campus-3d
npm.cmd ci
npm.cmd run build
npm.cmd start
```

打开 `http://127.0.0.1:4311/`。原“打开校园网站”入口也通过新的服务启动地图及API。新终端可设置管理员：

```powershell
$env:ADMIN_USERNAME='campus_admin'
$env:ADMIN_PASSWORD=Read-Host '设置至少12位管理员密码'
npm.cmd run admin
Remove-Item Env:ADMIN_PASSWORD
```

`Read-Host` 这里是可见输入，避免放进命令历史；不要录屏或共享终端。设置后打开 `/admin`。命令重新设置同名管理员会重置密码并清除此账号的会话，不改变其内容。

默认本地注册开放、审核开启。需要固定设置可将 `.env.example` 复制为 `.env`。不要在HTTP本地环境设置 `COOKIE_SECURE=1`，否则浏览器可能不发会话Cookie。服务必须持续运行；关闭终端后应重新启动。SQLite要求Node 24，不可用旧版Node替代。

## 3. 大陆公开上线之前要先确认的事项

1. **主体与服务范围**：先向选定接入商说明“校园地图+用户照片+公开评论/回复”，确认允许的备案主体和所需手续。不能把它仅报成静态个人展示站。腾讯云当前备案指引明确个人主体不能开办论坛性质网站；不要将旧资料中的前置审批说法当作适用于所有地区的统一最新流程，具体由接入商及所在地主管部门确认。[腾讯云备案指引](https://cloud.tencent.cn/document/product/243/19628)
2. **ICP备案与域名实名**：中国大陆服务器对外提供网站服务需完成适用的备案。应在服务器所属云厂商办理接入备案，不是仅买域名就结束。[工信部备案管理办法](https://www.miit.gov.cn/gyhxxhb/jgsj/cyzcyfgs/bmgz/xxtxl/art/2024/art_84a0cfa0ebd049bbbe751dca9a008e56.html)。腾讯云当前轻量服务器备案要求包括大陆地区、包年包月购买至少3个月等条件，购买前核对。[备案云资源](https://cloud.tencent.cn/document/product/243/18908)
3. **身份认证**：公开评论服务有后台真实身份认证要求。当前用户名密码只完成账号管理，不等同于实名核验。公测开放注册前需接入经主体审核通过的手机号/学校统一身份等认证服务，并落实隐私告知和数据处理规则；微信昵称也不能直接当作已实名证明。[网信办跟帖评论服务规定](https://www.cac.gov.cn/2022-11/16/c_1670253725725039.htm)
4. **运营事项**：确认适用的公安联网备案、内容处置与用户协议/隐私政策，准备反馈联系方式，指定审核人员。代码默认先审后发；自动图片审查不能替代运营管理。
5. **若包进微信小程序**：还需另行核对小程序主体/类目、备案、HTTPS合法域名、用户生成内容审核及web-view权限；网站备案通过不表示小程序可直接上架。本次未改小程序包。

因此部署模板默认 `REGISTRATION=closed`。这允许先部署私有测试与验证环境，**不代表管理员创建的账号可绕过公开评论服务要求**。完成认证与服务主体确认后再做开放注册版本。当前未接入真实SMS、微信或学校认证、云内容安全API；没有在代码里伪造通过认证的结果。

## 4. 推荐起步配置与费用

推荐：腾讯云成都或其他合适的中国大陆地域，Ubuntu 24.04，2核4GB、约90GB磁盘、6Mbps及每月流量包；或同档阿里云服务器。学校位于重庆不表示必须在重庆购买服务器。

腾讯云官方刊例调价表列出的2核2GB/60GB/4Mbps/300GB月流量为52元/月，2核4GB/90GB/6Mbps/800GB月流量为80元/月。这是官方公开表的参考价，不是锁价承诺，地区、产品、续费和活动可能改变。[官方价格表](https://cloud.tencent.com/document/product/1207/119345)

| 项目 | 小规模起步预算 | 说明 |
|---|---:|---|
| 服务器 | 52–90元/月 | 推荐按80元/月预算；含该套餐磁盘/带宽/流量包，不重复计费 |
| 域名 | 60–120元/年 | 估算，取决于后缀及续费；非某域名实时报价 |
| HTTPS | 可从0元开始 | Caddy自动申请/续期，需域名正确解析且80/443可达；免费证书不等于永久有效 |
| 数据库 | 无单独云数据库费 | SQLite使用服务器磁盘 |
| 异地备份 | 5–20元/月预留 | 估算；至少保存到另一机器/私有存储；本机同盘备份不是容灾 |
| 图片自动审核（后续） | 按调用量 | 腾讯云公开后付费参考25元/万张；每月1万张约25元；人工时间另算 |
| 手机短信（后续） | 按模板及套餐 | 预算暂按0.05–0.1元/条估算，不是官方单价；以获批套餐订单为准 |
| 运营审核 | 不计入基础云费 | 人工审核、处理举报及维护账号是持续成本 |

图片审核依据：[腾讯云图片内容安全计费](https://cloud.tencent.com/document/product/1125/37108)。短信需要签名/模板及套餐，账户有余额不代表可直接发送：[短信计费与套餐说明](https://cloud.tencent.com/document/product/382/18058)。

**举例预算（估算，不含人工与主体办理费用）**：服务器80 + 域名折算8 + 备份10 = **约98元/月**；再加每月1000条短信按0.08估算80元、1万张图片审核25元，合计约203元/月。由于真实认证/审核尚未接入，现在运行本地版不会实际产生这些API费用。购买短信套餐可能一次预付，不等于每月只付80元。

若只内部少量试用，不接短信/自动审核，基础预算按 **70–120元/月** 预留；若公开运营并有认证/审核需求，按 **150–300元/月起** 预留更合理。新用户几十元或百元一年的活动不作为长期预算。大流量、攻击、CDN回源和额外磁盘会增加费用。

### 图片与流量怎么算

- 每张压缩图按300KB仅作为估算：每月1000张新增约0.3GB；1万张约3GB。实际由照片复杂度决定，不保证每张都在300KB以内。
- 10万次图片读取×300KB约30GB；同一照片被看1000次算1000次下载流量。
- 初次加载地图模型和地形也消耗流量。不要只按上传量估带宽费用，应根据实际浏览器网络面板和云监控计量。
- 6Mbps只是理论约0.75MB/s，并发多人下载大地图可能慢。先看实际体验，再考虑更高带宽或国内CDN。
- 当前每账号最多200张、全站最多1万张图片；这是代码的保护上限，不表示已经完成1万张负载测试。
- 当前照片存本地磁盘，**未接COS**。后续若迁移COS，免费标准存储额度也不抵扣请求和流量，不能理解为“图片服务全免费”。[COS免费额度范围](https://cloud.tencent.com/document/product/436/6240)

## 5. 我负责什么，你准备什么

| 我已提供/可以继续做 | 你需要持有或操作 |
|---|---|
| 地图界面、社区API、数据结构、审核页、部署配置和测试 | 决定公开运营主体、确认学校名称/资料使用与服务范围 |
| 部署命令、排错、检查持久化及备份、后续认证接口适配 | 云账号实名认证、购买服务器及域名、支付账单 |
| 配置域名反向代理与HTTPS技术部分 | ICP/适用备案提交、实名核验、短信签名/模板或学校认证接入申请 |
| 有服务器访问条件后可协助实际发布 | 将密钥放在服务器环境变量/密钥管理，勿发进公开仓库 |
| 后续图片审核/私有对象存储接入 | 管理员密码、审核人员、反馈联系人、运营成本 |

现在没有你的服务器、域名和认证服务配置，所以本次未购买资源、未替你提交备案，也未将网站公开发布。

## 6. 大陆服务器实际部署步骤

先完成主体与接入资格确认；只验证程序可使用私有网络或防火墙限制的测试环境。

1. 购买Ubuntu服务器并设置SSH密钥；安全组开放80/443，SSH仅限你的管理IP；不要把4311或SQLite文件对公网开放。
2. 域名A记录指向服务器公网IPv4；若没有IPv6服务，不要留错误AAAA记录。
3. 按 [Docker官方Ubuntu安装说明](https://docs.docker.com/engine/install/ubuntu/) 安装Docker Engine和Compose插件。大陆拉取镜像失败时使用可信云厂商容器镜像服务做受控镜像缓存，不关闭TLS、不使用来历不明的镜像源。
4. 把**项目根目录**上传到服务器，例如 `/opt/swu-campus-3d`；包含 `src/public/server/deploy/package*.json/Dockerfile/compose.yaml`，不包含 `node_modules/work/outputs/server-data/.env`。上传到私有仓库或使用SCP，不公开个人测试数据。
5. 进入目录并创建服务器 `.env`：

```dotenv
DOMAIN=campus.example.cn
REGISTRATION=closed
```

将域名替换为你自己的域名。不要直接套用本地 `.env` 中的 HTTP origin 或 DATA_DIR。

6. 构建并运行：

```bash
cd /opt/swu-campus-3d
docker compose build
docker compose up -d
docker compose ps
docker compose logs --tail=80 app caddy
```

7. 设置管理员，密码不写进命令历史：

```bash
read -r -p '管理员用户名: ' ADMIN_USERNAME
read -r -s -p '至少12位密码: ' ADMIN_PASSWORD
echo
export ADMIN_USERNAME ADMIN_PASSWORD
docker compose exec -T -e ADMIN_USERNAME -e ADMIN_PASSWORD app node server/manage.mjs admin
unset ADMIN_USERNAME ADMIN_PASSWORD
```

8. 查看 `https://你的域名/api/health`，访问地图及 `/admin`。Caddy负责自动HTTPS；签发失败先核对DNS、防火墙和端口占用。
9. 用两个不同浏览器账号测试：提交待审评论/照片，另一账号暂时看不到；管理员通过后能看到。重启app后再次读取，验证磁盘卷未丢。
10. 认证接入、主体/备案、协议、审核安排都完成后再讨论开放注册；不要只把closed改open就称为完成实名上线。

当前机器未安装Docker，**Compose与Dockerfile已提供，但本次未在真实Linux云主机上构建验证**。实际云端镜像拉取、端口、证书和磁盘权限仍需上线时验收。

## 7. 备份、恢复、更新与回滚

### 本地数据库备份

`npm.cmd run backup` 使用 SQLite 的 `VACUUM INTO` 创建一致性数据库快照；需要另存 `uploads`。若要求图片和数据库严格同一时刻，暂停写入再复制整个 `server-data` 目录，不要只拷运行中SQLite主文件而忽略WAL。

### Docker备份

在项目根目录执行 `sh deploy/backup.sh`。脚本短暂停止app，打包整个数据卷到 `backups/` 后恢复服务；建议每天一次、保留最近7日和每周4份，另存异地并验证可读取。管理好备份访问权限，其中含账号哈希和用户内容。

恢复到同一项目：

```bash
docker compose stop app
# 替换为真实备份名。恢复前先备份当前卷。
docker compose run --rm --no-deps --user root -T --entrypoint tar app -C /data -xzf - < backups/campus-YYYYMMDD-HHMMSS.tgz
docker compose start app
```

建议恢复到一个空的新数据卷，避免旧文件与备份残留混合；切换卷前先保留旧卷，不要删它。首次上线前做一次实际恢复演练。

更新程序：先备份，保存当前Git提交/镜像版本，再 `git pull` → `docker compose build app` → `docker compose up -d app`。当前表结构用 `CREATE IF NOT EXISTS` 初始化，无破坏性迁移；未来更改字段需单独迁移脚本和版本记录。代码回退不等于数据回退。

## 8. API、验证与剩余工作

接口代码 `server/app.mjs`，前台连接 `src/community-api.js`，认证界面 `src/account.js`，管理员 `server/admin.*`。

- 读取：`GET /api/health`、`/api/me`、`/api/places`、`/api/places/:id`。
- 账号：`POST /api/auth/register|login|logout`，会话通过Cookie发送。
- 发布：`POST /api/places`、`/api/places/:id/comments`（可带parentId）、`/rating`、`/photos`（multipart字段photo）。
- 建议：`POST /api/buildings/:id/suggestions`；`GET`读取自己提交的建议。
- 管理：`GET /api/admin/queue`，`POST /api/admin/review`，自身删除与举报接口。
- 所有写请求带 `X-Campus-Request: 1`；同域请求；浏览器无需保存JWT。

检查命令：`npm.cmd run test:backend`、`node scripts/preview-community-backend.mjs`、`npm.cmd run build`。浏览器测试使用临时数据库，不向真实社区发布样例。

后续优先事项：真实认证接入；依据服务规模完善账号恢复/注销、内容分页与单条回复管理；用户地点重名/合并治理；管理员审核理由和批量处理；自动内容审查与对象存储；压测和容量监控。没有在本次暗中开启这些收费服务。
