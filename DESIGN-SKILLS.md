# Design Skills 选型与安装记录

> 目的：为 Astro 纯静态博客（先私网 http://192.168.31.149）准备"设计类 agent skill"。
> 调研指令来自用户 m00156："去找几个design skill给我"。
> 安装位置：**全局** `C:\Users\Jiang1021\.dsh\skills`（DSH 的 user-dsh 搜索根，所有会话可用）。
> 生效方式：DSH 启动/变更时自动发现，无需 git init（项目级 `.dsh/skills` 才需要）。

---

## 一、已安装（4 个，来自 GitHub 开源仓库）

### 1. `web-design` — 主设计管线（最推荐）
- 来源：`xiaopu-ai/web-design`（克隆目录 `D:\WorkSpace\blog\.skills-src\d0`）
- 体量：78 文件 / 1.18MB
- 自述：输入 PRD / 参考 URL / 截图 / 关键词（任意组合），**先产出标准化 DESIGN.md 设计规范，用户确认后再生成 UI/UX/动效/响应式代码**；专攻 Landing Page、Portfolio、产品页、**博客**、个人站、SaaS 页。
- 为什么选它：两阶段（先规范后代码）正好匹配"用户可能想先看设计方向再落代码"的节奏；参考 URL 分析能力可以直接吃我们已有的 `BLOG-INSPIRATION-bad0rang3.md`。
- 内含：
  - `references/design-md-template.md` — DESIGN.md 7 章模板
  - `references/design-systems/` — **58 个真实品牌设计规范**（apple / linear.app / stripe / vercel / notion / claude / raycast / figma / tesla / spotify / x.ai …）
  - `references/style-seeds.md`（10 种风格种子→Token）、`interaction-patterns.md`（L1/L2/L3 交互档位代码库）、`motion-library.md`、`scroll-story-patterns.md`、`scene-defaults.md`（7 种场景基线）、`text-decoration-rules.md`、`icon-library.md`、`quality-checklist.md`
  - `scripts/crawl_website.py`（Playwright 爬虫：截图 + tokens + 结构）、`extract_design_tokens.py`（轻量静态 token 提取）、`fetch_unsplash_images.py`
- 内含硬规则（对中文站直接有用）：中文必须用 Noto Sans SC / Noto Serif SC / LXGW WenKai 等中文字族，禁止只配英文字体；行高 ≥1.7、字距 0.02em、正文 ≥15px（长文 ≥16px）；`prefers-reduced-motion` 必须有降级路径；单页 WebGL scene ≤1 个。
- ⚠️ 需要 Python（爬虫/token 脚本）；服务器 python3 3.13.5 **无 pip**，本机可用则优先本机跑。

### 2. `ui-aesthetics` — 视觉判断力/质检（第二推荐）
- 来源：`kasonye/ui-aesthetics-skill`（`d1`）
- 体量：14 文件 / 89KB（只装了根 `SKILL.md` + `references/`）
- 自述：提升前端视觉判断力——product-grade 构图、组件工艺、克制的交互状态、受控动效、一致的深度系统。专治 generic / cluttered / flat / over-styled / AI-generated。
- 路由：Generation / Review / Refactor / Component Polish / State-Motion Refinement / Depth-Lighting Refinement 六种。
- 强约束（可当评审清单用）：不加用户没要的 hero 文案与 CTA；不用奶油/米白当"高级感"默认信号；glow 非常态；selected 与 pressed 必须可区分；移动端要"重排"不是"压扁"。
- `references/` 13 篇：design-principles、color-system、component-aesthetics、interaction-states、motion-principles、motion-patterns、depth-lighting-system、non-card-layouts、style-archetypes、anti-patterns、review-rubric、rewrite-playbook、distilled-examples。
- 附带 `Self-Critique` 25 条自检清单，适合在写完后跑一遍。
- 定位：**不做设计，只做"改好/挑错"** —— 与 web-design 互补（web-design 出规范，ui-aesthetics 当评审）。

### 3. `design-dna` — 从参考图/URL 量化出设计 DNA
- 来源：`zanwei/design-dna`（`d2`）
- 体量：15 文件 / 103KB
- 自述：三维度提取/生成 —— ①design system(tokens) ②design style(定性气质) ③visual effects(Canvas/WebGL/3D/粒子/着色器/滚动效果)。可"参考图→JSON"，也可"JSON→页面"。
- 关键机制：**不要用肉眼估 hex**（感知色会往熟悉色板漂移 ΔE 10+）；用 `scripts/measure-colors.mjs` 实测，`scripts/verify.mjs` 对实现截图做校验。`SKILL_ROOT` 需解析成绝对路径。
- 用法对接：可以把 bad0rang3 的色板 token 喂进去，或反过来把用户微调后的风格固化成可复用 JSON。

### 4. `extract-design-system` — 从公开网站反推 token
- 来源：`arvindrk/extract-design-system`（`d3`）
- 体量：3 文件 / 3KB（不含 npm CLI 本体）
- 自述：把公开网站的 design primitives 抽成项目内 starter token 文件（`.extract-design-system/{raw,normalized}.json` → `design-system/tokens.{json,css}`）。
- 用法：`npx playwright install chromium` 后 `npx extract-design-system <url>`；只提取用 `--extract-only`；已有 normalized.json 只重生成 starter 用 `init`。
- 边界（skill 自己写明）：只用于初始化，不保证像素级还原；不推断没抽到的语义 token；不改动生成物以外的项目文件。
- 与 web-design 内置的 `extract_design_tokens.py` 功能重叠，留作**备选**。

## 二、未安装（留作备选，克隆仍在 `.skills-src`）

| 目录 | 仓库 | 说明 |
|---|---|---|
| d4 | `plugin87/ux-ui-agent-skills` | 20 个子 skill + 138 个命名设计系统 + 7 篇 `.claude/rules/`。体量 8.7MB。**它的 skill 正文大量引用 `.claude/rules/*.md`**（例如 design-tokens 第一步读 `.claude/rules/tokens-and-color.md`），单独拷 `.claude/skills/<name>/` 会断链，要装就得整包连 rules/ 一起装。功能与 hallmark / ui-aesthetics 高度重叠，暂不装。 |
| d5 | `AThevon/genjutsu` | 4 个 skill：`paint`（艺术方向→设计系统→实现→审计）、`cast`（动效/微交互）、`bunshin`（整站管线，**需要宿主能 spawn subagent，会先报成本并问两次**）、`_jutsu`（子知识库，含 GSAP/Framer Motion/Three.js/Motion Principles/tells/design-audit 等）。全英文，面向 Claude Code 插件路径（`${CLAUDE_PLUGIN_ROOT}`）。动效深度最强，但风格与我们已装的 web-design 重合较多，暂不装。 |

## 三、会话内已存在的 design 相关 skill（无需安装）

- `hallmark`（在 `C:\Users\Jiang1021\.agents\skills\hallmark`，107 文件 / 683KB）：**anti-AI-slop 设计 skill**，v1.1.0。四个动作：默认设计流程 / `hallmark audit <target>`（只打分不改）/ `hallmark redesign <target> [--mood <name>]`（保留路由与文案，只换视觉层）/ `hallmark study <screenshot|URL>`（提取 DNA 出诊断报告）。**核心主张是"结构多样性与视觉多样性同等重要"**——两个不同 brief 不该共用 hero→3-feature→CTA→footer 节奏。references 有 macrostructures、structure、slop-test、anti-patterns、component-cookbook、hero-enrichment、typography、color、copy、motion、microinteractions、interaction-and-states、layout-and-space、responsive、custom-theme、custom-craft、study、design-md、export-formats、imagery-kit、assets，以及 ~60 个命名组件（h1-h9 hero、f1-f6 特性区、ft1-ft8 页脚、n1-n11 导航、c1-c4 转化件）。
- `design-dna` / `extract-design-system` / `ui-aesthetics` / `web-design`：本次新装，已在 catalog 生效。
- `skill-creator`、`find-skills`：DSH 自带能力（创作/发现 skill）。

## 四、给博客项目的建议用法

1. 先 `web-design`：把 `BLOG-INSPIRATION-bad0rang3.md` 当参考输入，产出一份 `DESIGN.md`（含色板/字体/间距/圆角/动效档位/页面清单）给你确认。
2. 你不满意风格时，用 `ui-aesthetics` 的 Review/Refactor 路由来挑错和重写，而不是重新摇一遍。
3. 需要"照抄某个站的形"时用 `hallmark study <url|截图>` 或 `design-dna` 提取 DNA。
4. 真正写 Astro 页面时优先 `hallmark`（结构多样性 + anti-slop 清单）与 `ui-aesthetics` 的 Self-Critique 做收尾。

## 附：本次调研的环境事实
- `web_search` 工具当前不可用（`DeepSeek search has no API key for "DEEPSEEK_SEARCH_API_KEY"`），全部检索改走 GitHub REST API（`api.github.com` 可用；`raw.githubusercontent.com` 直连失败，读 README 要用 `/repos/<owner>/<repo>/readme` 取 base64）。
- DSH skill 发现机制（读自 `D:\deepseek\node_modules\@deepseek-ai\dsh-skill-filesystem\lib\index.js`）：
  - 搜索根：`<projectRoot>/.dsh/skills`（project-dsh）、`<projectRoot>/.agents/skills`（project-agents）、custom dirs、`<dshHome>/skills`（user-dsh = `C:\Users\Jiang1021\.dsh\skills`）、`<agentsHome>/skills`（user-agents = `C:\Users\Jiang1021\.agents\skills`）、bundled。
  - `findProjectRoot`（index.js:807-815）：从 cwd 向上找含 `.git` 的目录，**找不到就返回 cwd**（所以项目级 `.dsh/skills` 必须先把 `D:\WorkSpace\blog` 变成 git 仓库；当前盘上 D:\ 、D:\WorkSpace、D:\WorkSpace\blog 都没有 .git）。
  - `discoverRoot`（index.js:581-614）：**只扫一层**，根下的子目录取其 `SKILL.md`，或根下的 `.md` 文件；不递归。skill name 必须匹配 `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`。
  - 变更监听 `depth: 1`（index.js:375），与只扫一层一致。
- 参考克隆暂时保留在 `D:\WorkSpace\blog\.skills-src`（d1-d5 共 981 文件 / 16.7MB），已删除与 d0 重复的 `probe-webdesign`；确认都不需要后可以整目录删掉。
