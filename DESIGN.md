# DESIGN.md — 江枫的实验室（Jiang1021's Lab）

> 用工程制图的克制，包装一个爱折腾的人。黑白两套主题，线条是唯一装饰。

---

## 1. Visual Theme & Atmosphere

**Style**: Technical Minimalism（工程极简 / 技术制图风）
**Keywords**: 线条 · 网格 · 等宽标签 · 单色 + 一个信号色 · 留白 · 角标 · 克制的动
**Tone**: 冷静、精确、可信，带一点动手实验室的趣味 — NOT 花哨、NOT 赛博荧光、NOT 玻璃拟态堆叠
**Feel**: 像一本翻开的硬件技术手册——纸是白的，字是黑的，蓝色只用来标出"这里可以点"。

**Interaction Tier**: L2（流畅交互）
**Dependencies**: CSS only（无 GSAP / 无 Lenis）。滚动揭示用原生 IntersectionObserver。

**三个 Wow 时刻**：
1. Hero 大标题的渐变光带缓慢横扫（`gradient-pan`），配合鼠标跟随的柔光斑。
2. 卡片悬浮时四角浮现 L 形「角标」（`.ticked`）+ 跟随指针的径向光斑——这是整套设计的签名动作。
3. 跑马灯里黑体实心字与描边空心字交替滚动，悬停暂停。

**一个彩蛋**：页尾滚到底时浮出一行 `✦ 你读到页尾了，谢谢 —— 去写点自己的东西吧。`；另外点击邮箱会飘出一颗 ✦ 并显示「已复制」。

## 2. Color Palette & Roles

```css
:root {                                   /* 浅色主题（默认） */
  --bg: #F6F6F8;            --bg-rgb: 246, 246, 248;
  --surface: #FFFFFF;       --surface-rgb: 255, 255, 255;
  --surface-2: #EDEDF1;
  --line: rgba(11,11,18,.10);
  --line-strong: rgba(11,11,18,.30);
  --text: #0B0B12;          --text-rgb: 11, 11, 18;
  --text-2: #494952;
  --text-3: #6B6B78;
  --accent: #2B4BF2;        --accent-rgb: 43, 75, 242;
  --accent-hover: #1D34C9;
  --grad-a: #0B0B12; --grad-b: #3F55F5; --grad-c: #0B0B12;
  --success: #12A150; --warning: #C98A00; --error: #D93A3A;
}
[data-theme='dark'] {                     /* 深色主题 */
  --bg: #07070B;            --bg-rgb: 7, 7, 11;
  --surface: #0E0E15;       --surface-rgb: 14, 14, 21;
  --surface-2: #14141D;
  --line: rgba(255,255,255,.09);
  --line-strong: rgba(255,255,255,.28);
  --text: #F3F3F7;          --text-rgb: 243, 243, 247;
  --text-2: #A6A6B2;
  --text-3: #8F8F9E;
  --accent: #8AA0FF;        --accent-rgb: 138, 160, 255;
  --accent-hover: #A9B8FF;
  --grad-a: #F3F3F7; --grad-b: #7E93FF; --grad-c: #F3F3F7;
  --success: #3FD07E; --warning: #E2B33C; --error: #FF6B6B;
}
```

**Color Rules:**
- 所有颜色一律通过 CSS 变量引用，组件内**禁止硬编码 hex**（唯一例外：`.btn--accent` 的白色文字、深色主题下的反色文字）。
- 强调色每屏只承担一个角色：可点击 / 当前态 / 数据高亮。同一 section 内不出现第二种强调色。
- 正文对比度 ≥ 4.5:1（浅色 `--text-3` 故意压到 #6B6B78 而非更浅的灰，就是为了守住这条线）。
- 主题由 `<html data-theme>` 切换，`localStorage['blog-theme']` 记忆；无存储时跟随 `prefers-color-scheme`。首屏前用内联脚本上色，避免闪烁。

## 3. Typography Rules

```css
@import '@fontsource/space-grotesk/400.css';   /* 500 700 */
@import '@fontsource/jetbrains-mono/400.css';  /* 500 */
@import '@fontsource/noto-sans-sc/400.css';    /* 700 */
```
自托管（fontsource），不走 Google Fonts CDN——服务器在局域网，离线也必须正常。

| Role | Font | Size | Weight | Line Height | Letter Spacing |
|------|------|------|--------|-------------|----------------|
| Hero H1 | Space Grotesk → Noto Sans SC | clamp(44px, 10vw, 112px) | 700 | 0.94 | -0.035em |
| Section H2 | 同上 | clamp(28px, 4vw, 44px) | 700 | 1.18 | -0.02em |
| H3 | 同上 | clamp(17px, 1.6vw, 20px) | 600 | 1.3 | 0 |
| Body | 同上 | 16px | 400 | 1.75 | 0.02em |
| Label / Eyebrow | JetBrains Mono → Noto Sans SC | 12px | 400 | 1.6 | 0.22em（uppercase） |
| Mono/Code | JetBrains Mono | 13px | 400 | 1.9 | 0.06em |

**Typography Rules:**
- 中文页面**必须显式声明中文字族**（Noto Sans SC），绝不依赖系统回退；行高 ≥ 1.7（正文 1.75），字距 0.02em。
- 中文字族排在拉丁回退之后（Space Grotesk 先行），这样中文用思源、西文用 Grotesk。
- 标题 weight ≥ 700；标题 `text-wrap: balance`，正文 `text-wrap: pretty`。
- 数字一律 `font-variant-numeric: tabular-nums`（计数器、统计数字槽对齐）。

**Text Decoration（按 text-decoration-rules.md 决策）：**
- Hero h1：**允许**渐变文字（`--grad-a/b/c` 三段光带横扫）。理由：极简风格下唯一的"科技感"来源，且只在大字号生效。
- Hero h1：**不加** text-shadow（该风格禁止投影）。
- Section h2 / h3 / 正文 p：无渐变、无投影、无描边；层次完全靠字号和颜色变量拉开。
- 跑马灯里的空心字用 `-webkit-text-stroke: 1px var(--line-strong)`——这是图形元素，不是文案。

## 4. Component Stylings

### Buttons
```css
.btn {                    /* default */
  display: inline-flex; align-items: center; gap: .55rem;
  min-height: 46px; padding: .75rem 1.4rem;
  border-radius: var(--r-pill); border: 1px solid var(--line-strong);
  font-family: var(--font-mono); font-size: .78rem; letter-spacing: .1em; text-transform: uppercase;
  color: var(--text); background: transparent;
  transition: background-color .25s var(--ease-out), color .25s var(--ease-out),
              border-color .25s var(--ease-out), transform .25s var(--ease-spring),
              box-shadow .25s var(--ease-out);
}
.btn:hover   { transform: translateY(-2px); border-color: var(--text); }
.btn:active  { transform: translateY(0); }
.btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.btn[disabled] { opacity: .45; pointer-events: none; }

.btn--solid { background: var(--text); color: var(--bg); border-color: var(--text); }
.btn--solid:hover { background: var(--accent); border-color: var(--accent); color: #fff;
                    box-shadow: 0 12px 30px -14px rgba(var(--accent-rgb), .8); }
.btn--accent { background: var(--accent); border-color: var(--accent); color: #fff; }
.btn--accent:hover { background: var(--accent-hover); border-color: var(--accent-hover); }
[data-theme='dark'] .btn--accent { color: #07070B; }   /* 深色下反色，保证对比度 */
.btn__arrow { transition: transform .3s var(--ease-out); }
.btn:hover .btn__arrow { transform: translateX(4px); }
```

### Cards
```css
.card {
  position: relative; background: var(--surface);
  border: 1px solid var(--line); border-radius: var(--r-card);
  padding: clamp(1.25rem, 2.5vw, 1.75rem);
  transition: border-color .3s var(--ease-out), transform .3s var(--ease-out), box-shadow .3s var(--ease-out);
}
.card:hover { border-color: var(--line-strong); box-shadow: var(--shadow); }
.card:focus-within { outline: 2px solid var(--accent); outline-offset: 3px; }

/* 指针跟随光斑 */
.spot::before {
  content: ''; position: absolute; inset: 0; opacity: 0;
  background: radial-gradient(260px circle at var(--mx,50%) var(--my,50%), rgba(var(--accent-rgb),.13), transparent 70%);
  transition: opacity .35s var(--ease-out); pointer-events: none;
}
.spot:hover::before { opacity: 1; }

/* 签名角标：悬浮时四角浮现 L 形刻度 */
.ticked::after {
  content: ''; position: absolute; inset: 8px; opacity: 0;
  background:
    linear-gradient(var(--line-strong), var(--line-strong)) left top / 12px 1px no-repeat,
    linear-gradient(var(--line-strong), var(--line-strong)) left top / 1px 12px no-repeat,
    linear-gradient(var(--line-strong), var(--line-strong)) right bottom / 12px 1px no-repeat,
    linear-gradient(var(--line-strong), var(--line-strong)) right bottom / 1px 12px no-repeat;
  transition: opacity .3s var(--ease-out); pointer-events: none;
}
.ticked:hover::after { opacity: 1; }
```

### Navigation
```css
.nav { position: fixed; inset: 0 0 auto 0; z-index: 100;
       border-bottom: 1px solid transparent;
       transition: background-color .3s, border-color .3s, backdrop-filter .3s; }
.nav.is-scrolled { background: rgba(var(--bg-rgb), .72);
                   backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
                   border-bottom-color: var(--line); }
.nav__link { min-height: 44px; padding: .7rem .8rem; color: var(--text-2);
             font-family: var(--font-mono); font-size: .75rem;
             letter-spacing: .12em; text-transform: uppercase; }
.nav__link::after { content: ''; position: absolute; left: .8rem; right: .8rem; bottom: .55rem;
                    height: 1px; background: var(--accent);
                    transform: scaleX(0); transform-origin: left;
                    transition: transform .32s var(--ease-out); }
.nav__link:hover, .nav__link[aria-current='page'] { color: var(--text); }
.nav__link:hover::after, .nav__link[aria-current='page']::after { transform: scaleX(1); }
```
`backdrop-filter` 只在**不移动**的导航条上使用（≤12px），滚动条本身不做 blur。

### Links / Tags / Socials
```css
.tag { font-family: var(--font-mono); font-size: .66rem; letter-spacing: .1em;
       min-height: 26px; padding: .3rem .6rem; border-radius: var(--r-pill);
       background: var(--surface-2); color: var(--text-2); border: 1px solid transparent;
       transition: color .25s var(--ease-out), border-color .25s var(--ease-out); }
a.tag:hover { color: var(--accent); border-color: var(--accent); }

.social { min-height: 44px; padding: .55rem 1rem; border: 1px solid var(--line);
          border-radius: var(--r-pill); font-family: var(--font-mono); font-size: .74rem;
          color: var(--text-2);
          transition: color .25s, border-color .25s, background-color .25s, transform .25s var(--ease-spring); }
.social:hover { color: var(--bg); background: var(--text); border-color: var(--text); transform: translateY(-2px); }

.post { transition: padding-inline .3s var(--ease-out), background-color .3s var(--ease-out); }
.post:hover { padding-inline: .75rem; background: rgba(var(--accent-rgb), .04); }
.post::before { /* 左侧一截刻度线滑出 */ }
```

### 数据槽（Stats / Mini counters）
```css
.stats { display: grid; grid-template-columns: repeat(4, minmax(0,1fr));
         gap: 1px; background: var(--line);          /* 1px 间隙即分隔线 */
         border: 1px solid var(--line); border-radius: var(--r-card); overflow: hidden; }
.stat { background: var(--surface); padding: clamp(1.25rem, 3vw, 2rem);
        transition: background-color .3s var(--ease-out); }
.stat:hover { background: var(--surface-2); }
.stat__num { font-size: clamp(2rem, 5vw, 3.25rem); font-weight: 700; line-height: 1;
             letter-spacing: -0.03em; font-variant-numeric: tabular-nums; }
.stat__num em { font-style: normal; color: var(--accent); font-size: .5em; vertical-align: .55em; }
```

## 5. Layout Principles

**Container:**
- Max width: `--wrap: 1180px`
- Padding: `--gutter: clamp(1.25rem, 4vw, 2.5rem)`
- 窄版（长文阅读）：60ch 左右（正文段落用 `max-width: 58ch`）

**Spacing Scale:**
- Section padding: `clamp(4.5rem, 9vw, 8rem)`（紧凑版 `clamp(3rem, 6vw, 5rem)`）
- Section 之间用 `border-top: 1px solid var(--line)` 而不是留白堆叠
- 组件间距: 1rem / 1.5rem；卡片内边距 `clamp(1.25rem, 2.5vw, 1.75rem)`

**Grid:**
```css
/* Hero：主标题区 + 260px 终端侧栏 */
.hero__grid { display: grid; grid-template-columns: minmax(0,1fr) 260px;
              gap: clamp(2rem, 5vw, 4rem); align-items: end; }

/* Bento 工作区：6 列，宽卡占 4、常规卡占 2 */
.bento { display: grid; grid-template-columns: repeat(6, minmax(0,1fr)); gap: 1rem; }
.work       { grid-column: span 2; }
.work--wide { grid-column: span 4; }
```

**背景网格**：`.grid-bg` 用 72px 双向 1px 渐变线平铺，再叠 `mask-image: radial-gradient(ellipse 90% 70% at 50% 30%, #000 20%, transparent 80%)`，只在中上部微露（opacity .55）——这是"科技线条"的地基，不是装饰画。

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat | 无阴影，仅 1px 边框 | 静态卡片、表格行、notes 列表 |
| Subtle | `0 1px 2px rgba(11,11,18,.05)` | 内嵌小容器 |
| Elevated | `--shadow: 0 1px 2px …, 0 14px 34px -22px …` | 卡片 hover |
| Lift | `--shadow-lift`（更大扩散） | 弹层 / 抽屉（预留） |

深色主题下阴影改为纯黑加深（`0 18px 40px -26px #000`），因为浅色阴影在深底上不可见。**不使用发光/霓虹辉光**——那会破坏单色基调。

## 7. Animation & Interaction

**Motion Philosophy**: 只用 `opacity` 与 `transform`，时长短、缓动统一；动效只解释"层次从哪里来"，不做表演。
**Tier**: L2

### Entrance Animation
```css
.hero [data-enter] { opacity: 0; animation: fade-up .9s var(--ease-out) forwards;
                     animation-delay: calc(var(--i, 0) * 110ms + 120ms); }
@keyframes fade-up { from { opacity: 0; transform: translate3d(0,18px,0); } to { opacity: 1; transform: none; } }
```
Hero 内 6 个元素用 `--i:0..5` 逐级入场。

### Scroll Behavior
```js
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
}, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));
```
```css
[data-reveal] { opacity: 0; transform: translate3d(0,22px,0);
                transition: opacity .7s var(--ease-out), transform .7s var(--ease-out);
                transition-delay: calc(var(--d, 0) * 70ms); }
[data-reveal].is-in { opacity: 1; transform: none; }
```
导航滚动态：`window.scrollY > 24` 时加 `.is-scrolled`（被动监听）。

### Hover & Focus States
- 所有可点元素都有 hover + `:focus-visible` 戒指（`outline: 2px solid var(--accent); outline-offset: 3px`）。
- 卡片的指针光斑与 Hero 聚光都用 **rAF 节流** 的 `pointermove`（每次只写一次 CSS 变量），且仅在 `(hover: hover) and (pointer: fine)` 下启用。

### Special Effects
- Hero 鼠标跟随柔光（`.hero__spot`，420px 径向渐变）。
- 跑马灯（38s linear，悬停 `animation-play-state: paused`）。
- 数字滚动：IntersectionObserver 触发，1100ms 三次方缓出。
- 邮箱点击复制 + ✦ 飘出。

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { animation-duration: .001ms !important; animation-iteration-count: 1 !important;
                           transition-duration: .001ms !important; }
  .hero__name { animation: none; background-position: 30% 50%; }
  .marquee__track { animation: none; }
  [data-enter], [data-reveal] { opacity: 1 !important; transform: none !important; }
  .hero__spot { display: none; }
}
```
JS 侧同步降级：reduce 时直接把 `[data-reveal]` 全部标记为已进入、计数器直接写终值。

## 8. Do's and Don'ts

### Do
- 颜色、圆角、缓动、字体全部走 CSS 变量，改主题只改一处。
- 线条优先于色块：能用一个 1px 边框表达的边界，不要用阴影或填充。
- 中文页显式声明中文字族，正文行高 ≥ 1.7、字距 0.02em。
- 每个可交互元素都要有 hover / active / focus-visible 三态。
- 任何动效都必须有 `prefers-reduced-motion` 降级，且 JS 侧行为一致。
- 深色主题单独调对比度（强调色变亮、阴影变纯黑），不是简单反色。
- 所有点击目标 ≥ 44×44px（链接类文字加足够 padding）。
- 单色基调 + 单一强调色：蓝色是"可点"的信号，不是装饰。

### Don't
- ❌ 不硬编码 hex：组件里出现 `#fff` 以外的字面色值就是违规。
- ❌ 不用 Emoji 做图标（调性不是 playful）；图标一律内联 SVG 线性描边（1.6–2px）。
- ❌ 不用纯色块占位图；图片位必须是真实图片或 SVG。本次首页刻意不用任何照片，避免假素材。
- ❌ 不在移动元素上使用 `backdrop-filter` / `filter: blur`（性能红线）；导航的 blur ≤ 12px 且它不移动。
- ❌ 不做玻璃拟态堆叠、不做霓虹辉光、不做 3D 翻转卡片。
- ❌ 不用渐变文字做正文，也不给正文加 text-shadow。
- ❌ 不引入 GSAP / Lenis / Three.js：L2 档位用原生 API 就够，多一个依赖多一个故障点。
- ❌ 不使用 `!important` 管理状态（reduced-motion 降级除外）。
- ❌ 不在一个 section 里混用两种强调色。
- ❌ 不让内容横向溢出（`overflow-x: hidden` 是兜底，不是解决方案）。

## 9. Responsive Behavior

**Breakpoints:**
| Name | Width | Key Changes |
|------|-------|-------------|
| Desktop | > 900px | Hero 双栏（正文 + 260px 终端侧栏）；Bento 6 列；Stats 4 列；Presence 1 张横向卡（身份左 / 数据右）|
| Tablet | 640–900px | Hero 收成单栏、侧栏隐藏；Bento 4 列（宽卡占满）；Stats 2 列；Presence 卡换行上下堆叠；About/Contact 单栏 |
| Mobile | < 640px | 导航折叠成汉堡 + 下拉面板；Bento 单列；文章行改为上下堆叠；Hero stats 单列；网格背景 72px→46px |

**Touch Targets:** 最小 44×44px（导航按钮、主题切换、社交按钮、页脚文字链、邮箱文字链均为 44px 高；页脚链接触发器额外 `min-width: 44px`，避免 "X" 这类单字链接过窄）。
**Collapsing Strategy:** 先收栏、再收列、最后折叠导航；任何一级都不出现横向滚动。

```css
@media (max-width: 900px) {
  .hero__grid { grid-template-columns: minmax(0,1fr); align-items: start; }
  .hero__side { display: none; }
  .bento { grid-template-columns: repeat(4, minmax(0,1fr)); }
  .work { grid-column: span 2; } .work--wide { grid-column: span 4; }
  .stats { grid-template-columns: repeat(2, minmax(0,1fr)); }
  .presence__card { flex-direction: column; align-items: flex-start; }
}
@media (max-width: 640px) {
  .nav__links { position: fixed; inset: 64px 0 auto 0; flex-direction: column;
                background: rgba(var(--bg-rgb), .96); backdrop-filter: blur(14px);
                opacity: 0; pointer-events: none; transform: translateY(-8px);
                transition: opacity .25s var(--ease-out), transform .25s var(--ease-out); }
  .nav__links.is-open { opacity: 1; transform: none; pointer-events: auto; }
  .nav__toggle { display: grid; }
  .bento { grid-template-columns: minmax(0,1fr); }
  .work, .work--wide { grid-column: auto; grid-row: auto; }
  .post { grid-template-columns: minmax(0,1fr); gap: .45rem; }
  .hero__stats { grid-template-columns: minmax(0,1fr); }
  .grid-bg { background-size: 46px 46px; }
}
```

---

## 附：交互档位自检（L2 签名动作清单）

| 类别 | 实现 | 位置 |
|------|------|------|
| Hero 主标题文字动效 | 渐变光带横扫 + 6 段错峰入场 | `.hero__name` / `[data-enter]` |
| Section H2 文字动效 | 滚动揭示 + 标签淡入 | 各 `.section-head` |
| 正文 / 标签文字动效 | 文章行 hover 左移 + 刻度线滑出 | `.post` |
| 元素级动效 | 卡片角标浮现、边框色变、阴影升起 | `.ticked` / `.card` |
| 组件交互 | 数字滚动、跑马灯暂停、邮箱复制彩蛋 | `#presence` / `.marquee` / `.mailbox` |
| 背景氛围 | 网格背景 + 鼠标跟随柔光 | `.grid-bg` / `.hero__spot` |
