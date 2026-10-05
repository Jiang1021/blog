# `src/lib/lyrics.ts` 接口文档

纯 TypeScript 的 LRC 歌词解析模块。**无副作用、不读文件、不依赖 DOM / Node API**，浏览器、Astro 前端脚本、SSR、Node 脚本里都能直接跑。

路径：`D:\WorkSpace\blog\blog-astro\src\lib\lyrics.ts`

---

## 1. 如何 import

```ts
import {
  parseLyrics,
  findActiveIndex,
  findActiveIndexAt,
  filterByKind,
} from "../lib/lyrics";
import type { LyricLine, LyricKind, ParseLyricsOptions } from "../lib/lyrics";
```

> 路径按调用方所在目录调整（`src/lib/lyrics.ts` 相对 `src/pages/` 是 `../lib/lyrics`）。
> 该模块只导出函数与类型，**没有默认导出**，也没有任何顶层副作用，可以放心被 tree-shake / 打进前端 bundle。

---

## 2. 精确类型定义

```ts
/** 歌词行的语义分类。 */
export type LyricKind = "meta" | "line";

export interface LyricLine {
  /** 该行生效的时间点，单位「秒」，0 起点，浮点。 */
  time: number;
  /** 行文本，已整体 trim；全角/半角混排与行内方括号原样保留。空文本行为 ""。 */
  text: string;
  /** meta = 制作信息（作词/作曲/编曲/演奏人员）；line = 正式演唱歌词。 */
  kind: LyricKind;
}

export interface ParseLyricsOptions {
  /**
   * 文本 trim 后为空的 LRC 行是否保留，默认 true。
   * 保留时该行 kind = "line"、text = ""，播放器可用它「清空当前高亮」；
   * 传 false 则直接丢弃。
   */
  keepEmpty?: boolean;
}
```

---

## 3. 导出函数

### `parseLyrics(raw: string, options?: ParseLyricsOptions): LyricLine[]`

| 参数 | 类型 | 含义 |
| --- | --- | --- |
| `raw` | `string` | 歌词文件**完整文本**。允许带 UTF-8 BOM，允许 CRLF / LF / CR 混用。 |
| `options.keepEmpty` | `boolean \| undefined` | 空文本行是否保留，默认 `true`。 |

- **返回**：一个新的 `LyricLine[]`，按 `time` **升序**；时间相同时保持源文件出现顺序。
- 解析不出任何内容（空串、纯空行）时返回 `[]`。**任何输入都不会抛异常。**
- 支持的输入形态：
  - 网易云 JSON 元数据行 `{"t":0,"c":[{"tx":"作词: "},{"tx":"姬赓"}]}` → `t` 单位毫秒，`/1000` 转秒；`c` 数组按顺序拼接每个 `tx`；分类为 **meta**。
  - 标准 LRC 行 `[mm:ss.xxx]文本` → 分类为 **line**；一行多个时间标签（`[00:01.00][00:05.00]同一句`）展开成多行、共享同一文本。
  - 文件级 `[offset:±毫秒]` 标签 → 对全部行的 `time` 做整体平移（解析阶段生效，与运行时 offset 不叠加冲突）。负数时间被夹到 0。
  - 无时间标签、也非 JSON 的行（如 `[ar:xxx]`）→ 安全丢弃。
- 小数位规则（LRC 惯例）：**1 位 = 0.1s，2 位 = 0.01s，3 位及以上 = 毫秒**。

### `findActiveIndex(lines: readonly LyricLine[], currentTime: number): number`

| 参数 | 类型 | 含义 |
| --- | --- | --- |
| `lines` | `readonly LyricLine[]` | **必须按 time 升序**（`parseLyrics` 的输出天然满足）。 |
| `currentTime` | `number` | 当前播放时间，单位秒。 |

- **返回**：最后一个满足 `lines[i].time <= currentTime` 的 `i`。
  > 即「当前时间落在第 i 行时间点之后、第 i+1 行之前时返回 i」。
- **边界语义**（已由测试锁定）：
  - `lines` 为空 → `-1`
  - `currentTime < lines[0].time`（早于第一行）→ `-1`
  - `currentTime >= 最后一行 time`（晚于最后一行）→ 返回**最后一行下标**（不返回 -1，播放器可一直显示末句）
  - `currentTime` 为 `NaN` / `±Infinity` → `-1`
  - 时间点恰好相等 → 命中该行（**左闭**区间）
  - 多行时间完全相同时 → 返回其中最后一个的下标
- 实现是二分查找，O(log n)，可每帧调用。

### `findActiveIndexAt(lines: readonly LyricLine[], currentTime: number, offset?: number): number`

| 参数 | 类型 | 含义 |
| --- | --- | --- |
| `lines` | `readonly LyricLine[]` | 同 `findActiveIndex`。 |
| `currentTime` | `number` | **原始**播放时间（秒），不要自己先加偏移。 |
| `offset` | `number`（可选，默认 `0`） | 校准偏移，单位秒，可正可负。非有限数按 0 处理。 |

- **返回**：`findActiveIndex(lines, currentTime + offset)`，即全局校准后的高亮下标。
- 方向说明：
  - `offset > 0` → 命中更靠后的歌词 = 歌词整体**推迟**出现（歌词比音频跑得快时用它压回去）。
  - `offset < 0` → 命中更靠前的歌词 = 歌词整体**提前**出现（歌词比音频慢半拍时用它拽上来）。
  - 若手上是「音频偏移 `audioDelay`」，等价关系是 `offset = -audioDelay`。
- LRC 常见的 ±0.3s 校准直接传 `±0.3`。

### `filterByKind(lines: readonly LyricLine[], kind: LyricKind): LyricLine[]`

按 `kind` 过滤，返回**新数组**，不修改入参。典型用法：正式歌词做主滚动区，meta 做「制作信息」小字区。

---

## 4. 调用示例（可直接照抄）

```ts
import { parseLyrics, findActiveIndexAt, filterByKind } from "../lib/lyrics";
import type { LyricLine } from "../lib/lyrics";

// 1) 解析（raw 可以从 fetch / import.meta.glob raw / 内联字符串来）
const raw = `{"t":0,"c":[{"tx":"作词: "},{"tx":"姬赓"}]}
[01:19.080]开采 我的血肉的火光
[01:24.397]发动 新世界的前进的泡影`;

const lines: LyricLine[] = parseLyrics(raw);
// [
//   { time: 0,        text: "作词: 姬赓",           kind: "meta" },
//   { time: 79.08,    text: "开采 我的血肉的火光",  kind: "line" },
//   { time: 84.397,   text: "发动 新世界的前进的泡影", kind: "line" },
// ]

// 2) 播放中每帧查询当前高亮行（±0.3s 校准）
const OFFSET = -0.3; // 歌词整体提前 0.3s
audioEl.addEventListener("timeupdate", () => {
  const idx = findActiveIndexAt(lines, audioEl.currentTime, OFFSET);
  if (idx >= 0) highlight(lines[idx]);
});

// 3) 只要正式歌词做滚动区
const singable: LyricLine[] = filterByKind(lines, "line");
```

---

## 5. 测试

```powershell
cd D:\WorkSpace\blog\blog-astro
node --test src/lib/lyrics.test.mjs
```

- 测试文件：`src/lib/lyrics.test.mjs`（Node 内置 `node:test` + `node:assert/strict`，**零第三方依赖**）。
- 依赖 Node ≥ 22.6 的「类型剥离」能力直接 `import "./lyrics.ts"`，无需编译步骤（本机实测 Node v24.14.0 通过）。
- fixture：`src/lib/__fixtures__/cai-shi.lrc`（真实《采石》歌词的逐字节副本）。
