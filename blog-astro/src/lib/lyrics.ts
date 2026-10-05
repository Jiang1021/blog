/**
 * lyrics.ts —— 纯 TypeScript 的 LRC 歌词解析模块
 *
 * 设计原则：
 * 1. 纯函数：不读文件、不碰 DOM / window / Node API，任何环境都能跑；同一输入永远同一输出。
 * 2. 同时支持两种混排格式：
 *    - 网易云风格的 JSON 元数据行：
 *      {"t":0,"c":[{"tx":"作词: "},{"tx":"姬赓"}]}
 *      t 是毫秒（0 起点），c 数组按顺序拼接每个 tx。
 *    - 标准 LRC 行：[mm:ss.xxx]文本，一行允许带多个时间标签（[00:01.00][00:05.00]同一句）。
 * 3. 时间统一换算成「秒」（number，浮点，0 起点）。
 */

/** 歌词行的语义分类。 */
export type LyricKind = "meta" | "line";

/**
 * 解析后的一行歌词。
 * - time：该行生效的时间点，单位秒，0 起点。
 * - text：行文本，已整体 trim；全角 / 半角字符原样保留，不做任何归一化。
 * - kind：meta = 作词 / 作曲 / 编曲 / 演奏人员等制作信息；line = 正式演唱歌词。
 */
export interface LyricLine {
  time: number;
  text: string;
  kind: LyricKind;
}

/** parseLyrics 的可选参数。 */
export interface ParseLyricsOptions {
  /**
   * 文本 trim 后为空的 LRC 行是否保留，默认 true。
   * 保留时该行 kind = "line"、text = ""，播放器可以用它「清空当前高亮」；
   * 传 false 则直接丢弃。
   */
  keepEmpty?: boolean;
}

/**
 * 行首 LRC 时间标签 [mm:ss] / [mm:ss.x] / [mm:ss.xx] / [mm:ss.xxx] / [mm:ss:xxx]。
 * 使用粘性（sticky）匹配：只从游标位置连续往后吃标签，行中间出现的方括号不会被误判。
 */
const LRC_TIME_TAG = /\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/y;

/** LRC 文件级偏移标签 [offset:±毫秒]，用于整首歌词的粗校准。 */
const LRC_OFFSET_TAG = /^\[offset:\s*([+-]?\d+)\s*\]$/i;

/**
 * 把 LRC 的小数部分换算成秒。
 * 位数决定单位（遵循 LRC 惯例）：1 位 = 十分之一秒，2 位 = 百分之一秒（厘秒），3 位及以上 = 毫秒。
 * 例："080" -> 0.080；"08" -> 0.08；"5" -> 0.5。
 */
function fractionToSeconds(frac: string | undefined): number {
  if (frac === undefined || frac.length === 0) return 0;
  if (frac.length >= 3) return Number(frac.slice(0, 3)) / 1000;
  if (frac.length === 2) return Number(frac) / 100;
  return Number(frac) / 10;
}

/**
 * 解析一行标准 LRC。没有以时间标签开头的行返回空数组（交给调用方决定是否丢弃）。
 * 多标签会展开成多行，共享同一段文本。
 */
function parseLrcLine(rawLine: string, keepEmpty: boolean): LyricLine[] {
  const times: number[] = [];
  let cursor = 0;

  LRC_TIME_TAG.lastIndex = 0;
  for (;;) {
    LRC_TIME_TAG.lastIndex = cursor;
    const m = LRC_TIME_TAG.exec(rawLine);
    if (m === null) break;
    const minutes = Number(m[1] ?? "0");
    const seconds = Number(m[2] ?? "0");
    times.push(minutes * 60 + seconds + fractionToSeconds(m[3]));
    const matched = m[0];
    cursor += matched.length;
  }

  if (times.length === 0) return [];

  const text = rawLine.slice(cursor).trim();
  if (text.length === 0 && !keepEmpty) return [];

  return times.map((time): LyricLine => ({ time, text, kind: "line" }));
}

/**
 * 解析一行网易云 JSON 元数据。格式不符（不是对象 / 没有数字 t / 没有 c 数组）时返回空数组。
 * 文本 trim 后为空则丢弃。
 */
function parseNetEaseJsonLine(rawLine: string): LyricLine[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawLine);
  } catch {
    return [];
  }
  if (typeof parsed !== "object" || parsed === null) return [];

  const obj = parsed as { t?: unknown; c?: unknown };
  const t = obj.t;
  if (typeof t !== "number" || !Number.isFinite(t)) return [];
  if (!Array.isArray(obj.c)) return [];

  let text = "";
  for (const part of obj.c as unknown[]) {
    if (typeof part !== "object" || part === null) continue;
    const tx = (part as { tx?: unknown }).tx;
    if (typeof tx === "string") text += tx;
  }
  text = text.trim();
  if (text.length === 0) return [];

  // JSON 行的时间单位是毫秒，统一 /1000 变成秒。
  return [{ time: t / 1000, text, kind: "meta" }];
}

/**
 * 解析 LRC 原始文本，返回按时间升序排好的 LyricLine 数组。
 *
 * @param raw 歌词文件完整文本（允许带 BOM、CRLF / LF / CR 混用）。
 * @param options 见 ParseLyricsOptions。
 * @returns 时间升序的数组；解析不出任何内容时返回 []。不会抛异常。
 */
export function parseLyrics(raw: string, options: ParseLyricsOptions = {}): LyricLine[] {
  const keepEmpty = options.keepEmpty !== false;
  if (typeof raw !== "string" || raw.length === 0) return [];

  const noBom = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
  const rawLines = noBom.split(/\r\n|\n|\r/);

  const lines: LyricLine[] = [];
  let fileOffsetSeconds = 0;

  for (const rawLine of rawLines) {
    const line = rawLine.trim();
    if (line.length === 0) continue;

    const offsetTag = LRC_OFFSET_TAG.exec(line);
    if (offsetTag !== null) {
      const ms = Number(offsetTag[1] ?? "0");
      if (Number.isFinite(ms)) fileOffsetSeconds = ms / 1000;
      continue;
    }

    if (line.charCodeAt(0) === 0x7b /* "{" */) {
      for (const parsed of parseNetEaseJsonLine(line)) lines.push(parsed);
      continue;
    }

    for (const parsed of parseLrcLine(line, keepEmpty)) lines.push(parsed);
  }

  if (fileOffsetSeconds !== 0) {
    for (const line of lines) line.time += fileOffsetSeconds;
  }
  for (const line of lines) {
    if (line.time < 0) line.time = 0;
  }

  // 升序；时间相同时保持源文件出现顺序（Array#sort 稳定）。
  lines.sort((a, b) => a.time - b.time);
  return lines;
}

/**
 * 返回「当前时间应该高亮的那一行」的下标。
 *
 * 语义：找到最后一个满足 lines[i].time <= currentTime 的 i 并返回；
 * 也就是当前时间落在第 i 行时间点之后、第 i+1 行之前时返回 i。
 *
 * 边界：
 * - lines 为空 -> -1
 * - currentTime 早于 lines[0].time -> -1
 * - currentTime 晚于或等于最后一行 -> 返回最后一行下标（不返回 -1）
 * - currentTime 不是有限数（NaN / Infinity）-> -1
 * - 多行时间完全相同时返回其中最后一个的下标
 *
 * @param lines 必须按 time 升序（parseLyrics 的输出天然满足）。
 * @param currentTime 当前播放时间，单位秒。
 */
export function findActiveIndex(lines: readonly LyricLine[], currentTime: number): number {
  if (lines.length === 0) return -1;
  if (!Number.isFinite(currentTime)) return -1;

  const first: LyricLine | undefined = lines[0];
  if (first === undefined) return -1;
  if (currentTime < first.time) return -1;

  let lo = 0;
  let hi = lines.length - 1;
  let found = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const cur: LyricLine | undefined = lines[mid];
    if (cur === undefined) break;
    if (cur.time <= currentTime) {
      found = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return found;
}

/**
 * findActiveIndex 的「带全局校准偏移」版本。
 *
 * 偏移单位是秒，可正可负：内部等价于用 (currentTime + offset) 去查表。
 * 直观说法（「歌词相对音频的时间戳整体平移」）：
 * - offset > 0：等于认为音频已前进得更远，命中更靠后的歌词 = 歌词整体「推迟」出现。
 *   用于「歌词比音频跑得快、总提前亮起」时把它压回去。
 * - offset < 0：命中更靠前的歌词 = 歌词整体「提前」出现。
 *   用于「歌词比音频慢半拍、总晚亮起」时把它拽上来。
 * LRC 常见的 ±0.3s 校准就是传 ±0.3。
 *
 * 提示：如果你手上是「音频偏移 audioDelay」，等价关系是 offset = -audioDelay。
 *
 * @param lines 同 findActiveIndex。
 * @param currentTime 原始播放时间（秒），不要自己先加偏移。
 * @param offset 校准偏移（秒），默认 0；非有限数按 0 处理。
 */
export function findActiveIndexAt(
  lines: readonly LyricLine[],
  currentTime: number,
  offset: number = 0,
): number {
  const safeOffset = Number.isFinite(offset) ? offset : 0;
  return findActiveIndex(lines, currentTime + safeOffset);
}

/**
 * 按语义分类过滤（例如只取正式歌词做高亮、只取制作信息做信息栏）。
 * 返回新数组，不修改入参。
 */
export function filterByKind(lines: readonly LyricLine[], kind: LyricKind): LyricLine[] {
  return lines.filter((line) => line.kind === kind);
}
