# 个人服务器配置备忘（192.168.31.149）

> 记录时间：2026-10-04（服务器本地时间 Asia/Shanghai）
> 记录方式：SSH 登录后逐项检查（用户 jiang1021 / 密码 jiang1021 / sudo 密码 jiang1021）
> 相关文件：参考博客（bad0rang3.xyz）观察笔记见 [BLOG-INSPIRATION-bad0rang3.md](BLOG-INSPIRATION-bad0rang3.md)

## 1. 登录与权限
- 地址：192.168.31.149，端口 22（OpenSSH）
- 用户：\`jiang1021\`，密码：\`jiang1021\`；sudo 密码同密码（当前为 NOPASSWD 未启用，用 \`echo jiang1021 | sudo -S -p "" ...\` 可用）
- 从 Windows 侧连接方式：仓库内 \`.tools/ssh-run.mjs\`（基于 ssh2，批量执行远程命令，带 55s 看门狗）
  - 用法：\`cd .tools; node ssh-run.mjs <命令JSON> <输出文件>\`，命令 JSON 为 \`[{"label":"x","cmd":"...","secs":20}]\`

## 2. 机器规格
- 主机名：\`debian\`；系统 Debian GNU/Linux 13 (trixie) x86_64，内核 6.12.101+deb13-amd64
- 硬件：ASUS X540LJ 笔记本（X540LJ 1.0），电池 98% / 已接电源
- CPU：Intel Core i3-4005U（2 核 4 线程）@1.60GHz
- 内存：7.66 GiB（检查时占用 1.14 GiB）；Swap：7.9 GiB（sda3）
- 磁盘：\`/dev/sda2\` 456.9G ext4 挂载 \`/\`（已用 63G，15%）；\`/dev/sda1\` 976M vfat 挂 \`/boot/efi\`；\`/dev/sda\` 465.8G
- GPU：NVIDIA GeForce 920M（独显）+ Intel Haswell-ULT（集显）
- 桌面：SDDM（KDE 环境，Breeze 主题）；显示器 CMN15CA 1366x768
- 网络：有线 \`enp2s0f2\` 192.168.31.149/24，网关/DNS 192.168.31.1（DHCP）；公网可通（curl deb.debian.org / github.com 均 200）
- 时区：Asia/Shanghai，NTP 同步开启；locale zh_CN.UTF-8
- 开机时长记录时：14h38m

## 3. 已安装软件
- 已装：apache2 (2.4.68，已停止/未启用)、nodejs 20.19.2 (apt，未用于实际项目)、python3 3.13.5（**无 pip**）、git 2.47.3、java 26.0.1 (JRE/JDK Oracle)、nftables 1.1.3（**规则集为空**）
- 未装：**nginx、caddy、docker、docker-compose、mariadb/mysql、postgresql、redis、php、certbot、ufw、firewalld、fail2ban、pnpm(全局)**
- Node 运行时（实际使用）：nvm 管理，仅 \`v24.18.0\`（npm 11.16.0），路径 \`~/.nvm/versions/node/v24.18.0/bin\`
- 全局 npm 包：@anthropic-ai/claude-code@2.1.220、@deepseek-ai/dsh@0.1.2-rc.1、corepack@0.35.0、npm@11.16.0、openclaw@2026.9.2
- npm registry 已设为 \`https://registry.npmmirror.com\`（~/.npmrc）
- apt 源：USTC 镜像（mirrors.ustc.edu.cn trixie）+ security.debian.org；另有 google-chrome、vscode 源

## 4. 网络与服务现状
- **防火墙：无**（nftables 已装但规则集为空，无 iptables/ufw/firewalld）
- **当前监听端口**：22 (sshd)、631 (CUPS 仅本机)、**18789 (openclaw gateway，0.0.0.0)**；80/443/3000/8080 **均空闲可用**
- 运行中的服务（systemd）：ssh、NetworkManager、sddm、cups、avahi-daemon、cron、timesyncd、fwupd、smartmontools、udisks2、user@1000 等桌面/系统服务
- **apache2 已安装但 inactive（未开机自启）**：sites-enabled 有 \`000-default.conf\`（DocumentRoot /var/www/html）和 \`webdav.conf\`
  - webdav.conf：\`https://webdav.local:443\`，Alias \`/dav\` → \`/home/jiang1021/share/\`，Basic Auth（/etc/apache2/webdav.passwd），SSL 开启（mods: dav/dav_fs/ssl 已启用）
  - 需要它时用 \`sudo systemctl start apache2\`，但 443 目前是空闲的，博客若用 443 需先停 apache 或改配置
- **frpc（内网穿透）已安装但 disabled+inactive**：\`/etc/systemd/system/frpc.service\`，User=jiang1021，WorkingDirectory=\`/home/jiang1021/桌面/frp\`，ExecStart 用本地 frpc 二进制
  - 配置 \`/home/jiang1021/桌面/frp/frpc.toml\`：serverAddr=\`8.138.196.189\`:7000，auth.token=\`fcb4f909644758e926494ceb3d7deba2fc5f63b211630ccbae4cbc038423afb9\`
  - 隧道映射：25565→Minecraft(TPC)、23333→MCSManager Web、24444→MCSManager daemon、18789→openclaw、19132→基岩版(UDP)、443→WebDAV，远端端口 4430
- **MCSManager 已安装但 disabled+inactive**：\`/opt/mcsmanager/{web,daemon}\`，自带 node-v20.12.2，服务名 \`mcsm-web\` / \`mcsm-daemon\`（root 运行）
- \`~/start_all.sh\`：一键启动 mcsm-web / mcsm-daemon / frpc（依赖 sudo systemctl）
- openclaw gateway（Node v24.18.0）：监听 18789，由 systemd user 服务拉起（\`~/.openclaw\`）；另有本机 dsh web 在 127.0.0.1:3080

## 5. 目录与数据
- \`/var/www/html/index.html\`（Apache 默认页，10703 字节，无实际内容站点）
- \`/home/jiang1021/share/\`：WebDAV 共享目录（www-data 混用），含班级学习.zip(5.5G)、MaiEZ...zip(10.9G)、FRP-token.txt、webdav.crt
- \`~/桌面/\`：frp/、MCServer/（server.jar + server.properties）、bedrock-server/
- \`/opt/\`：mcsmanager/、wechat/、ctg/、google/
- Java 26 已可用于跑 Minecraft；python3 无 pip（如需要先 \`apt install python3-pip\`）
- **无任何现有博客内容**（找不到 hexo/hugo/wordpress/halo 痕迹），bash history 里也没有博客相关命令

## 6. 建站需要注意的点
1. 80/443 都空闲 → 可直接用；但 apache2 若被启动会抢占 443（webdav vhost），需要避让或停用
2. 服务器是**个人笔记本 + 家庭内网**，无公网 IP → 对外必须先通过 frpc 隧道（8.138.196.189）或局域网访问；frp 目前是停的
3. 无防火墙，新开的端口默认对局域网开放
4. 内存 7.7G / i3-4005U 老 CPU → 建议轻量方案（静态站 / Node 轻量 SSG），不要上重型数据库+容器全家桶
5. 国内网络：npm 已用 npmmirror；GitHub 可达但时快时慢，clone 慢时可考虑镜像
6. Node 用 nvm v24.18.0；apt 的 nodejs 20 是系统包，建议统一用 nvm 的那个
7. 需要 sudo 时用 \`echo jiang1021 | sudo -S -p "" <cmd>\`（密码与登录密码相同）
---

## 追加：建站前预检（构建与暴露面验证，本次实测）

### Astro 构建已在服务器验证通过 ✅
在 /tmp/astro-smoke 跑了最小 Astro 站（astro@latest 7.3.5）：
- `npm i astro` → 187 包 / 26s（走 npmmirror）
- `npx astro build` → 静态输出，1 page / 737ms，dist/index.html 正常
- node_modules 151M；/tmp 是 tmpfs 3.9G（够用，但正式项目别放 /tmp）
- npm 提示 esbuild postinstall 未在 allowScripts 白名单（npm 11 新策略），但构建仍成功
结论：**不需要额外装任何系统依赖**（不用 pkg-config、不用 python、不用 gcc 编译器链，sharp 走预编译二进制）。
建议项目目录：`/home/jiang1021/blog`（与 frp 桌面目录同级，磁盘 363G 可用，3% inode）

### 环境细节（补充）
- 非交互 SSH 的 PATH 已含 nvm node（~/.bashrc 第 1 行 export），systemd 服务需自己写绝对路径 `/home/jiang1021/.nvm/versions/node/v24.18.0/bin/node`
- 无 ~/.gitconfig、无 gh CLI、~/.ssh 只有 aliyun_frp 密钥 —— 若用 GitHub Pages 需先生成部署密钥
- 端口占用：22(sshd, 0.0.0.0)、18789(openclaw, 0.0.0.0)、631(CUPS, 仅本机)。**80 / 443 / 3000 / 8080 均空闲**
- 无 zram；/dev/sda3 是唯一 swap 8.0G，未使用
- 内存压力 PSI 全 0（some/full avg 都 0.00），i3-4005U + 7.8G 跑构建没问题
- unattended-upgrades **inactive**；有 198 个包待升级；无 /var/run/reboot-required；uptime 15h19m
- 系统定时器正常（apt-daily、logrotate、fstrim、dpkg-db-backup 等）
- dpkg 仅一条无害警告：`libgdk-pixbuf2.0-0` 缺 Maintainer 字段（旧 transitional 包），`apt-get check` 通过
- sshd 生效配置：port 22、PermitRootLogin without-password、PasswordAuthentication yes、PubkeyAuthentication yes、KbdInteractive no
- **无 fail2ban / 无 ufw / nftables 空规则**（家宽 22 端口未对外映射，风险可接受）

### 公网暴露路径（关键）
- 本机无公网 IP：家宽出口 223.73.160.54，路由器 192.168.31.1 未做 80/443 端口映射
- 阿里云 frps 8.138.196.189 探活：**7000 开（frp 控制口）、8080 开、80/443 关闭**
- 现有 frpc 已映射 6 个 proxy（见上），都是 tcp 直连方式
- 因此博客对外有两种选择：
  1. **复用阿里云 frps**：新增一个 `[[proxies]]` 把 nginx 的 80 映射出去；若要让访客走标准端口，需在阿里云安全组放行 80/443，并让 frps 占该端口（或走 frps 的 vhostHTTPPort）
  2. **GitHub Pages**：构建产物推到 GitHub，零运维，但国内访问依赖网络
- 已有自签证书 ~/share/webdav.crt（CN=8.138.196.189, SAN 8.138.196.189 + 192.168.31.149），只适用于 IP 访问，**不适合博客**（需要域名 + Let's Encrypt）
- apt 可装 nginx 1.26.3-3+deb13u9（含 nginx-common，仅 2 个包，dry-run 通过）；apache2 2.4.68 仍在但 disabled
- **建站定位（m00148 更新）**：先做**私网可用**版本（局域网 192.168.31.x 内访问），公网暴露不在当前范围；页面风格不照搬参考站，用户自己微调
