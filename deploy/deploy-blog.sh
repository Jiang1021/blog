#!/usr/bin/env bash
#
# 江枫的实验室 —— 一键部署 / 更新脚本（服务器端）
#
#   sudo bash deploy/deploy-blog.sh
#
# 为什么不用 git clone：这台服务器 curl github.com 不通（20.205.243.166:443 超时），
# 但 codeload.github.com（打包下载）和 api.github.com 都通，所以改成「下载源码压缩包」
# 的方式部署——不需要 git，也不受 git 端口限制。
#
# 流程：取 main 的 commit sha → 下载 tar.gz → 解压到 $SRC_ROOT → npm ci → 构建
#       → rsync 到 $WEB_ROOT → 装 nginx 站点配置 → reload
#
# 幂等：同一 commit 重复执行会跳过解压和安装，直接重建 + 同步。

set -euo pipefail

REPO="Jiang1021/blog"
SRC_ROOT="/home/jiang1021/blog-src"      # 源码（解压出来的，不带 .git）
SITE_DIR="$SRC_ROOT/blog-astro"
WEB_ROOT="/var/www/blog"
NGINX_SITE="/etc/nginx/sites-available/blog"
NGINX_LINK="/etc/nginx/sites-enabled/blog"
NODE_BIN="/home/jiang1021/.nvm/versions/node/v24.18.0/bin"
SITE_USER="jiang1021"
SITE_HOME="/home/jiang1021"
CACHE="$SITE_HOME/.cache/blog-deploy"

bold() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
ok()   { printf '\033[1;32m    + %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m    ! %s\033[0m\n' "$*"; }
die()  { printf '\033[1;31m    x %s\033[0m\n' "$*" >&2; exit 1; }

[[ ${EUID:-$(id -u)} -eq 0 ]] || die "需要 root：sudo bash deploy/deploy-blog.sh"
[[ ${1:-} == "--help" || ${1:-} == "-h" ]] && { sed -n '2,12p' "$0"; exit 0; }

# 同一时间只允许一个部署在跑，避免两次 rsync 打架
exec 9>"$CACHE.lock" 2>/dev/null || { mkdir -p "$CACHE"; exec 9>"$CACHE.lock"; }
flock -n 9 || die "已有一个部署在运行"

as_user() { runuser -u "$SITE_USER" -- env HOME="$SITE_HOME" PATH="$NODE_BIN:/usr/local/bin:/usr/bin:/bin" bash -lc "$1"; }

mkdir -p "$CACHE" "$SRC_ROOT"

# ---------- 1. 解析 main 的 commit sha ----------
bold "1/6 查询 GitHub 上 main 分支的最新提交"
# 坑：api.github.com 返回的是【单行紧凑 JSON】，里面有多个 "sha" 字段
# （commit / tree / parents…）。旧版写的是 grep -m1 '"sha"' | sed 's/.*"sha"…/\1/'，
# 而 sed 的 .* 是贪婪的，会匹配到整行【最后一个】sha —— 也就是 tree 的 sha，
# 拿它去 codeload 下 tar.gz 必然 404（curl exit 22）。这里改成 grep -o + head -n1 取第一个。
API_RESP="$(curl -fsSL --max-time 30 -H 'User-Agent: blog-deploy' \
              "https://api.github.com/repos/$REPO/commits/main" || true)"
SHA="$(printf '%s' "$API_RESP" | grep -o '"sha": *"[0-9a-f]\{40\}"' | head -n1 | grep -o '[0-9a-f]\{40\}' || true)"

STAMP_FILE="$SRC_ROOT/.deployed-sha"
CURRENT="$(cat "$STAMP_FILE" 2>/dev/null || echo none)"

if [[ "$SHA" =~ ^[0-9a-f]{40}$ ]]; then
  ok "远端 HEAD = ${SHA:0:7}"
  TARBALL_URL="https://codeload.github.com/$REPO/tar.gz/$SHA"
  TARBALL="$CACHE/blog-${SHA:0:7}.tar.gz"
else
  warn "没解析出 commit sha，退化为直接下载 main 最新快照"
  SHA="main-$(date +%Y%m%d%H%M%S)"
  TARBALL_URL="https://codeload.github.com/$REPO/tar.gz/refs/heads/main"
  TARBALL="$CACHE/blog-main.tar.gz"
  CURRENT="none"
fi
[[ "$CURRENT" == "$SHA" ]] && warn "和上次部署的是同一个提交，仍会重新构建同步"

# ---------- 2. 下载并解压源码 ----------
bold "2/6 下载源码压缩包"
mkdir -p "$CACHE"
if [[ ! -s "$TARBALL" ]]; then
  curl -fL --max-time 900 --retry 3 --retry-delay 3 -o "$TARBALL.part" "$TARBALL_URL" \
    || die "下载失败：$TARBALL_URL"
  mv "$TARBALL.part" "$TARBALL"
fi
ok "压缩包 $(du -h "$TARBALL" | cut -f1)"

NEW_SRC="$SRC_ROOT.new"
rm -rf "$NEW_SRC"; mkdir -p "$NEW_SRC"
tar -xzf "$TARBALL" -C "$NEW_SRC" --strip-components=1
[[ -f "$NEW_SRC/blog-astro/package.json" ]] || die "压缩包结构不对，找不到 blog-astro/package.json"

# 保留已装好的 node_modules：同一 commit 重跑时不用重装
if [[ -d "$SITE_DIR/node_modules" && "$CURRENT" == "$SHA" ]]; then
  mv "$SITE_DIR/node_modules" "$NEW_SRC/blog-astro/node_modules"
  ok "复用已有 node_modules"
fi
rm -rf "$SRC_ROOT.old"; [[ -d "$SRC_ROOT" ]] && mv "$SRC_ROOT" "$SRC_ROOT.old"
mv "$NEW_SRC" "$SRC_ROOT"
rm -rf "$SRC_ROOT.old"
chown -R "$SITE_USER:$SITE_USER" "$SRC_ROOT"
ok "源码就位：$SRC_ROOT"

# ---------- 3. 安装依赖 ----------
bold "3/6 安装依赖"
if [[ -d "$SITE_DIR/node_modules" ]]; then
  ok "node_modules 已存在，跳过（要强制重装就删掉 $SITE_DIR/node_modules）"
else
  as_user "cd '$SITE_DIR' && npm ci --no-audit --no-fund 2>&1 | tail -6"
  ok "依赖安装完成"
fi

# ---------- 4. 构建 ----------
bold "4/6 构建静态站点"
as_user "cd '$SITE_DIR' && npm run build 2>&1 | tail -14"
[[ -f "$SITE_DIR/dist/index.html" ]] || die "构建失败：没有 $SITE_DIR/dist/index.html"
ok "产物 $(du -sh "$SITE_DIR/dist" | cut -f1)"

# ---------- 5. 同步到 web 根目录 ----------
bold "5/6 同步到 $WEB_ROOT"
mkdir -p "$WEB_ROOT"
rsync -a --delete --chmod=D755,F644 "$SITE_DIR/dist/" "$WEB_ROOT/"
chown -R root:root "$WEB_ROOT"
echo "$SHA" > "$STAMP_FILE"
ok "已发布 $(du -sh "$WEB_ROOT" | cut -f1)"

# ---------- 6. nginx ----------
bold "6/6 配置 nginx"
if [[ -f "$SRC_ROOT/deploy/blog.nginx.conf" ]]; then
  install -m 644 "$SRC_ROOT/deploy/blog.nginx.conf" "$NGINX_SITE"
  ln -sfn "$NGINX_SITE" "$NGINX_LINK"
  rm -f /etc/nginx/sites-enabled/default    # Debian 默认站点会抢 default_server
  nginx -t || die "nginx 配置语法错误"
  systemctl enable nginx >/dev/null 2>&1 || true
  systemctl reload nginx 2>/dev/null || systemctl restart nginx
  ok "nginx 已重载"
else
  warn "没找到 deploy/blog.nginx.conf，跳过 nginx 配置"
fi

bold "部署完成"
printf '    本次提交   %s\n' "${SHA:0:7}"
printf '    局域网     http://192.168.31.149/\n'
printf '    本机自测   curl -sI http://127.0.0.1/ | head -1\n'
