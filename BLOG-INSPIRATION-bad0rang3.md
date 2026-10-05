# 参考博客观察笔记：bad0rang3.xyz

> 观察时间：2026-10-04
> 用途：用户说「到时候会借鉴他的来要求你」，这份笔记用于以后复刻/借鉴他的站点结构与视觉。
> 相关文件：服务器配置见 [SERVER-NOTES.md](SERVER-NOTES.md)

## 1. 站点身份
- 标题：`Bad0RANG3's Studio`；作者 Bad0RANG3
- 描述：`Bad0RANG3 的个人博客，记录软件推荐、CS2、Minecraft、开发工具、项目实践与日常思考。`
- 域名：https://bad0rang3.xyz/ ，语言 `zh-CN`
- 定位：中文个人技术/游戏折腾博客，内容偏「长文教程 + 游戏/街机逆向 + 项目记录 + 随笔碎碎念」

## 2. 技术栈（关键结论）
- **Astro v5.18.1 静态站点**（`<meta name="generator" content="Astro v5.18.1">`），用了 **View Transitions**（`astro-view-transitions-enabled: true`，`ClientRouter.astro`）
- **Tailwind CSS 4**（CSS 里全是 `--tw-*` 变量；daisyUI 风格的主题变量 `--color-base-100`/`--color-primary` 等）
- **UI 库像 daisyUI**：类名 `badge badge-ghost badge-sm`、`text-base-content/60`、`bg-base-100/90`、`drawer-link`、`card-arrow` 等；且大量自定义组件类（`hard-card`、`content-card`、`eyebrow`、`rail-link`、`site-frame`、`profile-card`）
- 托管：**GitHub Pages**（隐私页自述：静态站点部署在 GitHub Pages，构建由 GitHub Actions 执行），前置 **Cloudflare** CDN（`server: cloudflare`）
- 评论：**Giscus**（滚动到评论区附近才懒加载）
- 代码高亮：**Shiki**（`astro-code` + `github-dark` 主题类）
- 搜索：自带**搜索抽屉**（ESC 打开，「打开搜索后加载索引...」，说明是自建索引/懒加载）
- **PWA/离线**：有 `/sw.js`（`CACHE_VERSION = 'b0-static-v7'`，页面 network-first + revalidate，子资源 stale-while-revalidate，Range 请求绕缓存），有 `/manifest.webmanifest`（`display: standalone`，图标 `/HP.webp` 1200x1200 maskable），还有 **`/offline/` 离线提示页**
- **Feeds**：同时提供 `/rss.xml`、`/atom.xml`、`/feed.json`（JSON Feed）
- SEO：`/robots.txt` 指向 `/sitemap-index.xml`

## 3. 站点地图 / 页面结构（sitemap 共 102 个 URL）
一级页面：
- `/` 首页概览（SECTION: 首页概览 / 项目与实验 / 最近更新 / 想聊点什么）
- `/posts/` 文章列表、`/posts/<slug>/` 文章详情（**slug 不带日期**，如 `/posts/vscode-mingw-c-setup/`）
- `/projects/` 项目、`/tools/` 在线工具、`/thoughts/` 碎碎念（短想法，按日期一行一条）、`/archive/` 归档（按年份分组，显示「2026 14 篇」）
- `/tags/`、`/tags/<标签>/`、`/series/`、`/series/<系列名>/`、`/explore/`（探索/书架）、`/about/`、`/privacy/`、`/offline/`

首页模块顺序：
1. Hero/首屏：大标题 Bad0RANG3 + 音乐与开发 + **底部音乐播放器**（Synthion - main heroine，带进度条 0:00/4:27、百分比、网易云外链）
2. 个人档案卡（头像、文章 15 / 项目 06 / 状态 在线、NOW PLAYING 歌词卡）
3. Presence 双卡：**网易云音乐卡片**（头像、黑胶VIP、徽章数、关注/粉丝、等级 Lv.10、播放量）+ **GitHub 卡片**（@Bad0RANG3、仓库/关注者/正在关注，浏览器直连 api.github.com 读公开数据）
4. Selected「项目与实验」：Yukinal / VirtualWait / SOCD Cleaner / SwitchYourCFG / CS2 HLAE Preset / Arch Install Notes
5. Journal「最近更新」：6 篇文章卡（标签 + 标题 + 描述 + 日期 + 分钟阅读）
6. Contact「想聊点什么？」+ 页脚（口号「关注塔菲谢谢喵」、导航、社交、RSS/Atom/JSON）

文章页结构（以 `/posts/vscode-mingw-c-setup/` 为例）：
- H1 标题 + 元信息行：**「✦ 本文由 DeepSeek 润色」标注**、日期「2026年9月29日」、**约 29 分钟 / 11,800 字 / 难度：入门 ☆**、收藏 ↗、分享↗
- **适合读者 / 最后验证 / 含源码或配置示例** 三个小提示块
- 标签徽章（#C #VS Code #MinGW …）
- **自动生成的多级目录（TOC）**，正文 H2 编号「0. 先给结论 / 1. …」到 14 节，H3 细分（3.1、3.2…）
- 正文：表格、有序步骤、代码块（Shiki github-dark）、task-list（`task-list-item`）、`table-wrapper` 横向滚动容器
- 文末：相关文章（3 篇卡）+ 评论区（Giscus）

## 4. 视觉设计（可直接复用的 token）
主题名 `paper`（浅）/ `paper-dark`（深），**粉色系 + 微紫**，圆角很大，卡片有边框与柔和阴影。

浅色（light，`data-theme="paper"`）：
- base-100 `oklch(97.5% .012 355)`（近白粉）、base-200 `oklch(94.5% .024 350)`、base-300 `oklch(89.5% .038 350)`
- base-content / ink `oklch(24% .045 345)`（深紫褐）
- primary `oklch(64% .23 355)`（亮粉红）、secondary `oklch(88% .11 350)`、accent `oklch(70% .16 320)`（紫粉）、neutral `oklch(28% .045 340)`
- `--accent-pink: #e95786`、`--accent-violet: #8764c5`、`--accent-blue: #477dae`
- 玻璃卡片：`--surface: rgba(255,255,255,.72)`、`--surface-strong: rgba(255,255,255,.92)`、`--surface-soft: rgba(255,255,255,.54)`
- 边线：`--line: rgba(41,23,39,.13)`、`--line-soft: rgba(41,23,39,.08)`
- 文字：`--text-dim:#8e5e73`、`--text-faint:#87667a`；主题色 `theme-color #fdf2f6`

深色（`paper-dark`）：
- base-100 `oklch(18% .022 340)`、base-200 `oklch(22% .026 340)`、base-300 `oklch(28% .03 340)`
- base-content `oklch(84% .018 340)`、primary `oklch(74% .2 355)`、accent `oklch(76% .15 315)`
- `--fx-bg: #0b080d`、`--fx-text:#fff7fb`、`--fx-pink:#ff8fb6`；主题色 `#21131c`
- 代码块固定 `--code-block-bg:#1c161f` / `#e5e7eb`

其它：
- 动效曲线 `--ease: cubic-bezier(.22,.61,.36,1)`、弹性 `--spring: cubic-bezier(.34,1.45,.5,1)`
- 字体 **JetBrains Mono 全站统一**（含中文回退 Noto Sans SC），本地 woff2 自托管 + `unicode-range` 分包（latin / latin-ext / italic），`font-display:swap`；`--font-sans` 与 `--font-mono` 相同
- 布局：`rounded-[1.5rem]`、`p-5 sm:p-6`、`max-w` 系列；响应式靠 Tailwind `sm:` 前缀
- 主题切换：localStorage key `b0-theme`，值 `paper` / `paper-dark`，**内联脚本在首屏前上色**避免闪烁；`data-theme-ready`、`data-ambient-motion="true"` 控制环境动效

## 5. 值得借鉴的点（我觉得最有价值的）
1. **首页信息密度高但排版清晰**：Hero + 档案 + 音乐/GitHub 卡片 + 精选项目 + 最近更新 + 联系，一屏到多屏的信息流
2. **文章页元信息做得很细**：字数、阅读时长、难度、最后验证时间、「是否含源码」、「适合读者」——对教程类内容很友好
3. **自动 TOC + 编号章节**（0. 1. 2. …）适合长教程
4. **`/explore/` 本地书架**：收藏、阅读进度全存 localStorage，另有「清除本地记录」——零后端实现个性化
5. **`/thoughts/` 碎碎念**：轻量短内容，按日期一行，补足长文之外的更新频率
6. **`/tools/` 在线工具**：纯前端小工具（CS2 配置编辑器、NCM 解密）挂在站内
7. **PWA + 离线页 + Service Worker**，静态站体验接近 App
8. **三套 Feed + sitemap + robots**，SEO/订阅完整
9. **透明化隐私说明页**，写清每个外部请求去哪
10. **内容诚实标注**（「本文由 DeepSeek 润色，很抱歉我的文笔并不好」）

## 6. 若要复刻的落地建议（结合我们的服务器）
- 技术选型首选 **Astro + Tailwind（+ daisyUI）静态构建**，和参考站一致，也适合 [SERVER-NOTES.md](SERVER-NOTES.md) 里那台 i3-4005U 小机器（构建产物纯静态，nginx/apache 直接托管即可）
- 服务器侧可用 80/443（当前空闲）；若要对外需走 frpc 隧道（8.138.196.189）或换公网方案
- GitHub Pages/Cloudflare 那套我们不一定有（无公网 IP），可改为自托管静态目录 + frpc 映射
- 评论（Giscus 需 GitHub 仓库 + 公开仓库 Discussions）、GitHub 卡片（走 GitHub API，国内可能不稳）、网易云卡片这三块要考虑国内网络可达性

---

## 7. 定位澄清（用户 m00148）

用户明确表示：**不是要完全仿照 Bad0RANG3 的页面**，风格等细节他本人也会微调。
→ 本文件的定位降级为**参考/灵感清单**，不是复刻规格书。
→ 硬性沿用的只有技术方向（Astro 纯静态）；以下元素列为"可选借鉴"，需用户逐项确认后才做：
  首页 Hero + 音乐播放器、Presence 双卡、Selected 项目区、Journal、Giscus 评论、
  PWA/sw.js、三套 Feed、碎碎念 /thoughts/、本地书架 /explore/、在线工具 /tools/、
  元信息行（字数/阅读时长/难度）、自动多级编号 TOC、JetBrains Mono 全局字体、粉色 paper 主题。
→ 色板 token 仅作调色参考，不作为既定主题。
→ 部署目标（m00148）：**先私网跑起来**，局域网内可访问即可；公网暴露不急。
