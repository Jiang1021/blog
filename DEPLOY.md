# 部署说明

站点部署在**家里的服务器**上：`192.168.31.149`（局域网访问）。

- 访问地址：**http://192.168.31.149/**
- 服务器：Debian 13 (trixie) / i3-4005U 笔记本 / ASUS X540LJ
- Web 服务器：nginx 1.26.3（apt 安装，已 `systemctl enable`，开机自启）
- 站点根目录：`/var/www/blog`
- 源码目录：`/home/jiang1021/blog-src`（是解压出来的源码，不含 `.git`）
- SSH：`ssh jiang1021@192.168.31.149`（密码 `jiang1021`，sudo 密码相同）

---

## 一键部署 / 更新

在服务器上执行：

```bash
sudo bash /home/jiang1021/blog-src/deploy/deploy-blog.sh
```

流程：查 GitHub 上 `main` 的最新 commit → 下载该 commit 的源码压缩包 →
`npm ci` → `npm run build` → `rsync` 到 `/var/www/blog` → 重载 nginx。

脚本是幂等的：同一个 commit 重复执行会复用已有的 `node_modules`（不重装依赖），
直接重新构建 + 同步。用 `flock` 加了锁，不会有两个部署同时跑。

> 首次部署时 `blog-src` 还不存在，需要先手动把源码弄到服务器上，见下面「首次部署」。

---

## ⚠️ 为什么不用 `git clone`

**因为这台服务器连不上 `github.com:443`。**

实测（服务器上 `curl`，超时 12 秒）：

| 地址 | 结果 |
|---|---|
| `github.com` | ❌ 000（TCP 443 直接超时，等 134 秒才报 Failed to connect） |
| `raw.githubusercontent.com` | ❌ 000 |
| `api.github.com` | ✅ 200 |
| `codeload.github.com` | ✅ 301 → 200（`.tar.gz` 能下） |
| `registry.npmmirror.com` | ✅ 200 |
| `gitclone.com` | ✅ 200 |

DNS 解析正常（`github.com → 20.205.243.166`），是 TCP 层被挡了。`git clone` 只能走
`github.com:443`，所以必然失败（第一次尝试就是卡 134 秒后报错）。

而 **`codeload.github.com` 通** —— 它就是 GitHub 打包下载的域名，`/repos/{owner}/{repo}/tar.gz/{sha}`
可以直接拿到任意 commit 的源码快照。所以部署脚本改走这条路：

1. 用 `api.github.com` 查 `main` 的 HEAD sha（不占大流量）
2. 用 `codeload.github.com` 下这个 sha 的 `tar.gz`

这样不需要 git，也不受 `github.com` 被墙影响。如果哪天 `codeload` 也不通了，
备选是加 GitHub 镜像前缀（`gh-proxy.com` 实测也通）。

---

## 首次部署（在新机器上重建）

```bash
# 1. 装 nginx
sudo apt-get update && sudo apt-get install -y nginx

# 2. 下载源码压缩包（SHA 换成 GitHub 上 main 的 commit）
SHA=<40 位 commit sha>
mkdir -p /home/jiang1021/blog-src
curl -fL -o /tmp/blog.tar.gz "https://codeload.github.com/Jiang1021/blog/tar.gz/$SHA"
tar -xzf /tmp/blog.tar.gz -C /home/jiang1021/blog-src --strip-components=1
chown -R jiang1021:jiang1021 /home/jiang1021/blog-src

# 3. 跑部署脚本
sudo bash /home/jiang1021/blog-src/deploy/deploy-blog.sh
```

（第 2 步只是为了先把脚本本身弄到服务器上；脚本跑起来后会按同一个 commit
重新下载一份到自己的缓存目录 `~/.cache/blog-deploy/`。如果你已经用别的办法
（scp、U 盘、粘贴）把 `deploy/deploy-blog.sh` 传到服务器，直接从第 3 步开始就行。）

---

## 目录与配置

| 位置 | 作用 |
|---|---|
| `/var/www/blog` | 对外提供的静态文件（`root` 所有，只读权限） |
| `/etc/nginx/sites-available/blog` | 站点配置，由 `deploy/blog.nginx.conf` 安装 |
| `/etc/nginx/sites-enabled/blog` | 指向上面的软链 |
| `/etc/nginx/sites-enabled/default` | **已删除** —— Debian 默认站点会抢占 `default_server` |
| `/home/jiang1021/blog-src` | 源码 + `node_modules` + `dist` |
| `/home/jiang1021/.cache/blog-deploy/` | 下载的 tar.gz 缓存 + 部署锁 |
| `/var/log/nginx/access.log` | 访问日志 |

### nginx 配置要点

- `try_files $uri $uri/ $uri/index.html =404` —— Astro 是 `build.format: 'directory'`，
  `/about/` 实际是 `/about/index.html`
- `/_astro/` 下的文件名带内容 hash → 缓存 1 年、`immutable`
- 音频/封面/歌词文件名不带 hash → 只缓存 7 天，改了能马上生效
- **opus 单独配了 MIME**：Debian 的 `/etc/nginx/mime.types` 里没有 `.opus`，
  不补 `default_type audio/ogg` 的话浏览器会收到 `application/octet-stream`
- HTML 不缓存（`expires -1`），不然部署完还看到旧页面
- gzip 已开，覆盖 css/js/json/svg

### www-data 读取权限

nginx 以 `www-data` 运行，而 `/home/jiang1021` 是 `drwx--x---`（只有 owner 能进），
所以**不能直接把站点根目录指到源码目录**。构建产物由 `rsync -a --delete --chmod=D755,F644`
同步到 `/var/www/blog`，再把 owner 设成 root —— 这样 `www-data` 一定读得到，网站也改不动。

---

## 验证

```bash
# 服务器本机
curl -sI http://127.0.0.1/ | head -1                    # → HTTP/1.1 200 OK
curl -s  http://127.0.0.1/ | grep -o '<title>[^<]*'     # → <title>江枫的实验室
curl -sI http://127.0.0.1/media/cai-shi.opus | grep -i content-type   # → audio/ogg
curl -sI http://127.0.0.1/_astro/*.css | head -1        # → Cache-Control: public, immutable

# 局域网（Windows 上）
curl -sI http://192.168.31.149/
```

---

## 回滚

源码目录里没有 `.git`。部署脚本永远跟踪 `main` 的 HEAD，所以**回滚要手动来**：

```bash
OLD=<想回滚到的 40 位 commit sha>
curl -fL -o /tmp/old.tar.gz "https://codeload.github.com/Jiang1021/blog/tar.gz/$OLD"
rm -rf /tmp/old && mkdir -p /tmp/old
tar -xzf /tmp/old.tar.gz -C /tmp/old --strip-components=1
cd /tmp/old/blog-astro && npm ci --no-audit --no-fund && npm run build
sudo rsync -a --delete --chmod=D755,F644 dist/ /var/www/blog/
sudo chown -R root:root /var/www/blog
```

（更省事的做法：直接改本地仓库、`git revert` 后推回 `main`，再在服务器跑一次
部署脚本 —— 脚本会跟着 `main` 一起回退。）

或者临时改 `/var/www/blog` 里的文件（但下次部署会被 `rsync --delete` 覆盖）。

---

## 其它

- **frpc 内网穿透目前是关闭状态**，所以外网访问不了。要对外开放：
  `sudo systemctl start frpc`（配置见 `SERVER-NOTES.md`）。国内家宽 80/443 需要备案，
  一般映射到非标准端口。
- **apache2 已安装但 inactive**，它有自己的 :443 WebDAV vhost，将来站点要上 HTTPS 时注意避让。
- 服务器已开 `unattended-upgrades`？—— 实际是 inactive，有 199 个包待升级。想升级：
  `sudo apt-get upgrade`（别 `dist-upgrade`，省得出意外）。
