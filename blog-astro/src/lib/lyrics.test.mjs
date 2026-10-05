/**
 * lyrics.test.mjs —— src/lib/lyrics.ts 的单元测试（Node 内置 test runner，零第三方依赖）
 *
 * 运行方式（在 D:\\WorkSpace\\blog\\blog-astro 下）：
 *   node --test src/lib/lyrics.test.mjs
 *
 * 说明：Node >= 22.6 / 24 原生支持「类型剥离」，可以直接 import 一个 .ts 模块，
 * 所以 .mjs 测试文件无需任何编译步骤即可加载 lyrics.ts。本机实测 Node v24.14.0。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import {
  parseLyrics,
  findActiveIndex,
  findActiveIndexAt,
  filterByKind,
} from "./lyrics.ts";

const here = dirname(fileURLToPath(import.meta.url));
const fixturePath = join(here, "__fixtures__", "cai-shi.lrc");
const raw = readFileSync(fixturePath, "utf8");

/** 整首《采石》只解析一次，多个用例共享（parseLyrics 是纯函数，不会互相污染）。 */
const lines = parseLyrics(raw);

const textOf = (i) => lines[i].text;
const timeOf = (i) => lines[i].time;
const indexOfText = (needle) => lines.findIndex((l) => l.text === needle);

/* ------------------------------------------------------------------ *
 * 1. 整体规模与排序
 * ------------------------------------------------------------------ */

test("真实 LRC: 解析出 44 行（3 条开头 JSON 制作信息 + 33 行标准 LRC 歌词 + 8 条结尾 JSON 演奏人员）", () => {
  assert.equal(lines.length, 44);
});

test("真实 LRC: 时间严格升序（允许相邻相等）", () => {
  for (let i = 1; i < lines.length; i += 1) {
    assert.ok(
      lines[i].time >= lines[i - 1].time,
      `第 ${i} 行时间 ${lines[i].time} 小于前一行 ${lines[i - 1].time}`,
    );
  }
});

/* ------------------------------------------------------------------ *
 * 2. 第一行 / 最后一行
 * ------------------------------------------------------------------ */

test("真实 LRC: 第一行是 0s 的「作词: 姬赓」，kind=meta", () => {
  assert.equal(timeOf(0), 0);
  assert.equal(textOf(0), "作词: 姬赓");
  assert.equal(lines[0].kind, "meta");
});

test("真实 LRC: 最后一行是 535.542s 的「硬件噪音：积木」，kind=meta", () => {
  const last = lines[lines.length - 1];
  assert.equal(last.time, 535.542);
  assert.equal(last.text, "硬件噪音：积木");
  assert.equal(last.kind, "meta");
});

/* ------------------------------------------------------------------ *
 * 3. meta / line 分类
 * ------------------------------------------------------------------ */

test("真实 LRC: 作词 / 作曲 / 编曲 都是 meta", () => {
  assert.equal(indexOfText("作词: 姬赓"), 0);
  assert.equal(indexOfText("作曲: 董亚千"), 1);
  assert.equal(indexOfText("编曲: 董亚千"), 2);
  assert.equal(lines[0].kind, "meta");
  assert.equal(lines[1].kind, "meta");
  assert.equal(lines[2].kind, "meta");
});

test("真实 LRC: 演奏人员那批（唱/木吉他、贝斯、鼓……）都是 meta", () => {
  for (const t of [
    "唱、木吉他、电吉他、和声：董亚千",
    "贝斯：姬赓",
    "鼓：冯江",
    "Double Bass：马飞",
    "小号、次中音号：史立",
    "中音萨克斯：赵路",
    "钢琴：郑皓荣",
    "硬件噪音：积木",
  ]) {
    const i = indexOfText(t);
    assert.ok(i >= 0, `找不到演奏人员行: ${t}`);
    assert.equal(lines[i].kind, "meta", `${t} 应为 meta`);
  }
});

test("真实 LRC: 正式演唱歌词都是 line", () => {
  for (const t of [
    "开采 我的血肉的火光",
    "发动 新世界的前进的泡影",
    "此生再不归太行",
    "乌云遮目",
    "千座山峰化水泥",
    "唔——",
  ]) {
    const i = indexOfText(t);
    assert.ok(i >= 0, `找不到歌词行: ${t}`);
    assert.equal(lines[i].kind, "line", `${t} 应为 line`);
  }
});

test("真实 LRC: meta 11 行 / line 33 行", () => {
  assert.equal(filterByKind(lines, "meta").length, 11);
  assert.equal(filterByKind(lines, "line").length, 33);
  assert.equal(filterByKind(lines, "meta").length + filterByKind(lines, "line").length, lines.length);
});

/* ------------------------------------------------------------------ *
 * 4. 关键行的时间换算（mm:ss.xxx -> 秒）
 * ------------------------------------------------------------------ */

test("真实 LRC: 关键时间点换算正确", () => {
  assert.equal(timeOf(indexOfText("开采 我的血肉的火光")), 79.08); // [01:19.080]
  assert.equal(timeOf(indexOfText("此生再不归太行")), 95.247); // [01:35.247]
  assert.equal(timeOf(indexOfText("捶打我天然的沉默")), 100.727); // [01:40.727]
  // "乌云遮目" 出现多次：首次 138.908s，最后一次 323.892s
  assert.equal(timeOf(indexOfText("乌云遮目")), 138.908); // [02:18.908] 首次
  const wuyunIdx = lines.map((l) => l.text).lastIndexOf("乌云遮目");
  assert.equal(timeOf(wuyunIdx), 323.892); // [05:23.892] 最后一次
});

test("真实 LRC: JSON 元的毫秒时间正确换算成秒", () => {
  assert.equal(timeOf(indexOfText("唱、木吉他、电吉他、和声：董亚千")), 531.167); // t:531167
});

/* ------------------------------------------------------------------ *
 * 5. findActiveIndex —— 指定时间点（0s / 79.5s / 100s / 1000s）
 * ------------------------------------------------------------------ */

test("findActiveIndex(0) 命中第 0 行「作词: 姬赓」", () => {
  assert.equal(findActiveIndex(lines, 0), 0);
  assert.equal(textOf(0), "作词: 姬赓");
});

test("findActiveIndex(79.5) 命中「开采 我的血肉的火光」(79.08s)，而不是下一句 (84.397s)", () => {
  assert.equal(findActiveIndex(lines, 79.5), indexOfText("开采 我的血肉的火光"));
  assert.equal(textOf(findActiveIndex(lines, 79.5)), "开采 我的血肉的火光");
});

test("findActiveIndex(100) 命中「此生再不归太行」(95.247s)，而不是「捶打我天然的沉默」(100.727s)", () => {
  assert.equal(findActiveIndex(lines, 100), indexOfText("此生再不归太行"));
  assert.equal(textOf(findActiveIndex(lines, 100)), "此生再不归太行");
});

test("findActiveIndex(1000) 晚于最后一行 -> 固定返回最后一行下标", () => {
  assert.equal(findActiveIndex(lines, 1000), lines.length - 1);
  assert.equal(textOf(findActiveIndex(lines, 1000)), "硬件噪音：积木");
});

test("findActiveIndex 恰好等于某行时间点 -> 命中该行（左闭区间）", () => {
  const t = timeOf(indexOfText("正上升幻灭如明星"));
  assert.equal(findActiveIndex(lines, t), indexOfText("正上升幻灭如明星"));
});

/* ------------------------------------------------------------------ *
 * 6. findActiveIndexAt —— 全局偏移
 * ------------------------------------------------------------------ */

test("offset 生效：同一时间点 100s，offset 不同结果不同", () => {
  const zero = findActiveIndexAt(lines, 100, 0);
  const plus = findActiveIndexAt(lines, 100, 0.8);

  assert.equal(textOf(zero), "此生再不归太行");
  assert.equal(textOf(plus), "捶打我天然的沉默");
  assert.notEqual(zero, plus);
  assert.equal(plus, zero + 1);
});

test("offset 可为负：79.5s + (-0.5) = 79.0s -> 还没到第一句歌词(79.08s)，落在「编曲: 董亚千」", () => {
  assert.equal(findActiveIndexAt(lines, 79.5, -0.5), indexOfText("编曲: 董亚千"));
  assert.equal(findActiveIndexAt(lines, 79.5, 0), indexOfText("开采 我的血肉的火光"));
  // 同样 -0.5s 的偏移在 79.6s 处仍然落在第一句歌词里（79.1 > 79.08）
  assert.equal(findActiveIndexAt(lines, 79.6, -0.5), indexOfText("开采 我的血肉的火光"));
});

test("offset 默认值为 0，与不传等价；offset 非有限数按 0 处理", () => {
  assert.equal(findActiveIndexAt(lines, 100), findActiveIndex(lines, 100));
  assert.equal(findActiveIndexAt(lines, 100, Number.NaN), findActiveIndex(lines, 100));
  assert.equal(findActiveIndexAt(lines, 100, Number.POSITIVE_INFINITY), findActiveIndex(lines, 100));
});

/* ------------------------------------------------------------------ *
 * 7. 边界语义
 * ------------------------------------------------------------------ */

test("边界：lines 为空 -> -1", () => {
  assert.equal(findActiveIndex([], 0), -1);
  assert.equal(findActiveIndex([], 1000), -1);
  assert.equal(findActiveIndexAt([], 100, 0.3), -1);
});

test("边界：早于第一行时间点 -> -1（第一行是 0s，所以负数时间返回 -1）", () => {
  assert.equal(findActiveIndex(lines, -1), -1);
  assert.equal(findActiveIndex(lines, -0.001), -1);
  // 第一行时间点本身是左闭的，正好 0 命中
  assert.equal(findActiveIndex(lines, 0), 0);
});

test("边界：晚于最后一行 -> 返回最后一行下标（不返回 -1）", () => {
  assert.equal(findActiveIndex(lines, 535.542), lines.length - 1);
  assert.equal(findActiveIndex(lines, 1e9), lines.length - 1);
});

test("边界：currentTime 为 NaN -> -1", () => {
  assert.equal(findActiveIndex(lines, Number.NaN), -1);
});

test("parseLyrics: 空字符串 / 空数组输入 -> []", () => {
  assert.deepEqual(parseLyrics(""), []);
  assert.deepEqual(parseLyrics("\n\n\n"), []);
});

/* ------------------------------------------------------------------ *
 * 8. 合成输入：多时间标签、空文本行、[offset:] 标签、括号文本
 * ------------------------------------------------------------------ */

test("合成: 一行多个时间标签展开成多行，共享同一文本", () => {
  const out = parseLyrics("[00:01.00][00:05.00]同一句");
  assert.equal(out.length, 2);
  assert.deepEqual(out, [
    { time: 1, text: "同一句", kind: "line" },
    { time: 5, text: "同一句", kind: "line" },
  ]);
});

test("合成: 空文本行默认保留（kind=line 且文本为空），keepEmpty=false 时丢弃", () => {
  const kept = parseLyrics("[00:07.00]   ");
  assert.deepEqual(kept, [{ time: 7, text: "", kind: "line" }]);
  assert.deepEqual(parseLyrics("[00:07.00]   ", { keepEmpty: false }), []);
});

test("合成: 小数位决定单位（1 位=0.1s，2 位=0.01s，3 位=0.001s）", () => {
  const out = parseLyrics("[00:01.5]a\n[00:02.25]b\n[00:03.125]c");
  assert.deepEqual(out.map((l) => l.time), [1.5, 2.25, 3.125]);
});

test("合成: [offset:-500] 全局偏移 -0.5s 生效，并按新时间重排", () => {
  const src = "[00:01.00][00:05.00]同一句\n[00:03.500]另一句\n[00:07.00]\n[offset:-500]\n";
  const out = parseLyrics(src);
  assert.deepEqual(
    out.map((l) => [l.time, l.text]),
    [
      [0.5, "同一句"],
      [3.0, "另一句"],
      [4.5, "同一句"],
      [6.5, ""],
    ],
  );
});

test("合成: 全角/半角混排与行内方括号不会被破坏", () => {
  const out = parseLyrics("[00:01.00] Ｄo uble Bass：马飞 [Live]  ");
  assert.equal(out.length, 1);
  assert.equal(out[0].text, "Ｄo uble Bass：马飞 [Live]");
});

test("合成: 非 LRC 行（无时间标签、非 JSON）被安全丢弃，不抛异常", () => {
  const out = parseLyrics("这不是歌词\n[ar:万能青年旅店]\n{\"t\":1000,\"c\":[{\"tx\":\"作曲: \"},{\"tx\":\"董亚千\"}]}");
  assert.deepEqual(out, [{ time: 1, text: "作曲: 董亚千", kind: "meta" }]);
});

test("已知语义限制（锁定行为）: 标准 LRC 行形式的「作词: xxx」仍被判为 line", () => {
  // 解析器只看行形状，不看关键词。当前真实文件里制作信息全部是 JSON 行，所以不受影响。
  const out = parseLyrics("[00:00.00]作词：张三");
  assert.deepEqual(out, [{ time: 0, text: "作词：张三", kind: "line" }]);
});

test("filterByKind 返回新数组，不修改入参", () => {
  const before = lines.length;
  const metas = filterByKind(lines, "meta");
  assert.equal(lines.length, before);
  assert.notEqual(metas, lines);
  assert.ok(metas.every((l) => l.kind === "meta"));
});
