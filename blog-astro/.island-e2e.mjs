#!/usr/bin/env node
/**
 * .island-e2e.mjs —— 首页「灵动岛」音乐播放器端到端验收（真实 Chrome）
 * 用法： node .island-e2e.mjs [url]
 * 只读验收：不改 src/、不动 public/media/、不 kill 预览服务器。
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const URL_ = process.argv[2] || 'http://localhost:4321/';
const EXE = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const AUTOPLAY_ARG = '--autoplay-policy=no-user-gesture-required';
const USED_AUTOPLAY_ARG = true;
const MEDIA_BASE = URL_.replace(/\/$/, '');

const results = [];
const media = [];
const consoleErrors = [];
const notes = [];
const startedAt = new Date().toISOString();
const t0ms = Date.now();

function rec(group, id, name, pass, actual, expected) {
  results.push({ group: group, id: id, name: name, pass: !!pass, actual: actual, expected: expected });
}
async function step(group, id, name, expected, fn) {
  try {
    const r = await fn();
    if (r && typeof r === 'object' && Object.prototype.hasOwnProperty.call(r, 'pass')) {
      rec(group, id, name, r.pass, r.actual, r.expected === undefined ? expected : r.expected);
    } else {
      rec(group, id, name, true, r, expected);
    }
  } catch (e) {
    rec(group, id, name, false, 'THREW: ' + (e && e.message ? e.message : String(e)), expected);
  }
}

function attach(page, label) {
  page.on('console', function (m) {
    if (m.type() === 'error') consoleErrors.push('[' + label + ':console] ' + m.text());
  });
  page.on('pageerror', function (e) { consoleErrors.push('[' + label + ':pageerror] ' + e.message); });
  page.on('response', function (res) {
    const u = res.url();
    if (u.indexOf('/media/') === -1) return;
    const h = res.headers();
    let rng = null;
    try { rng = res.request().headers()['range'] || null; } catch (e) {}
    media.push({
      page: label,
      url: u.split('/media/').pop() ? '/media/' + u.split('/media/').pop() : u,
      status: res.status(),
      contentLength: h['content-length'] || null,
      contentRange: h['content-range'] || null,
      contentType: h['content-type'] || null,
      requestRange: rng
    });
  });
  page.on('requestfailed', function (req) {
    if (req.url().indexOf('/media/') !== -1) {
      media.push({ page: label, url: req.url(), status: 'REQUESTFAILED', failure: req.failure() ? req.failure().errorText : null });
    }
  });
}

async function audioSnap(page) {
  return await page.evaluate(function () {
    const a = document.getElementById('island-audio');
    const i = document.getElementById('site-island');
    if (!a || !i) return { missing: true };
    const st = document.getElementById('island-status');
    return {
      currentSrc: a.currentSrc || a.src || '',
      duration: a.duration,
      currentTime: a.currentTime,
      paused: a.paused,
      ended: a.ended,
      volume: a.volume,
      mutedProp: a.muted,
      networkState: a.networkState,
      readyState: a.readyState,
      playerState: i.dataset.playerState,
      open: i.dataset.open,
      volumeOpen: i.dataset.volumeOpen,
      mutedAttr: i.dataset.muted === undefined ? null : i.dataset.muted,
      status: st ? st.textContent : null
    };
  });
}
async function ensureOpen(page) {
  const o = await page.evaluate(function () { const i = document.getElementById('site-island'); return i ? i.dataset.open : null; });
  if (o !== 'true') { await page.click('#island-toggle'); await page.waitForTimeout(750); }
}
async function ensurePlaying(page) {
  const s = await audioSnap(page);
  if (s.paused) { await page.click('#island-play'); await page.waitForTimeout(700); }
}
function num(v) { return Number(v); }
function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m + ':' + String(s).padStart(2, '0');
}

const browser = await chromium.launch({ executablePath: EXE, headless: true, args: [AUTOPLAY_ARG] });
const chromeVersion = browser.version();

/* ============================ 桌面页 1440x900 ============================ */
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
attach(page, 'desktop');
await page.goto(URL_, { waitUntil: 'networkidle', timeout: 45000 });
await page.waitForTimeout(1200);

let metaReady = true;
try {
  await page.waitForFunction(function () {
    const a = document.getElementById('island-audio');
    return !!a && a.readyState >= 1;
  }, null, { timeout: 20000 });
} catch (e) { metaReady = false; }
if (!metaReady) {
  await page.waitForTimeout(2000);
  notes.push('loadedmetadata/readyState>=1 在 20s 内未达成，后续音频时长可能无效');
}
const metaSnap = await audioSnap(page);

/* ---------------- A. DOM 与可访问性 ---------------- */
await step('A', 'A1', '#site-island 存在且 data-open=false / data-player-state=idle', 'exists, data-open="false", data-player-state="idle"', async function () {
  const r = await page.evaluate(function () {
    const i = document.getElementById('site-island');
    return i ? { exists: true, open: i.dataset.open, playerState: i.dataset.playerState, volumeOpen: i.dataset.volumeOpen } : { exists: false };
  });
  return { pass: r.exists && r.open === 'false' && r.playerState === 'idle', actual: r };
});

await step('A', 'A2', '折叠态：aria-expanded=false / 曲名含「采石」/ 艺人含「万能青年旅店」/ mini 封面 naturalWidth>0', 'aria-expanded="false", 文案命中, naturalWidth>0', async function () {
  try {
    await page.waitForFunction(function () {
      const im = document.querySelector('.island__art--mini img');
      return !!im && im.complete && im.naturalWidth > 0;
    }, null, { timeout: 10000 });
  } catch (e) {}
  const r = await page.evaluate(function () {
    const t = document.getElementById('island-toggle');
    const im = document.querySelector('.island__art--mini img');
    return {
      ariaExpanded: t ? t.getAttribute('aria-expanded') : null,
      title: (document.querySelector('.island__title') || {}).textContent || '',
      artist: (document.querySelector('.island__artist') || {}).textContent || '',
      miniNaturalWidth: im ? im.naturalWidth : null,
      miniCurrentSrc: im ? (im.currentSrc || im.src) : null,
      panelHiddenByCopy: getComputedStyle(document.querySelector('.island__copy') || document.body).display
    };
  });
  const pass = r.ariaExpanded === 'false'
    && r.title.indexOf('采石') !== -1
    && r.artist.indexOf('万能青年旅店') !== -1
    && r.miniNaturalWidth > 0;
  return { pass: pass, actual: r };
});

await step('A', 'A3', '岛内所有 button/a 的宽高 ≥ 24x24', '所有目标 >=24x24', async function () {
  const r = await page.evaluate(function () {
    const island = document.getElementById('site-island');
    return Array.prototype.slice.call(island.querySelectorAll('button, a')).map(function (el) {
      const b = el.getBoundingClientRect();
      return {
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        cls: String(el.className),
        w: Number(b.width.toFixed(2)),
        h: Number(b.height.toFixed(2)),
        ariaLabel: el.getAttribute('aria-label')
      };
    });
  });
  const bad = r.filter(function (x) { return !(x.w >= 24 && x.h >= 24); });
  return { pass: bad.length === 0, actual: { total: r.length, below24: bad, all: r } };
});

await step('A', 'A4', '岛内所有 button/a 都有非空可访问名', 'aria-label 或可见文本非空', async function () {
  const r = await page.evaluate(function () {
    const island = document.getElementById('site-island');
    return Array.prototype.slice.call(island.querySelectorAll('button, a')).map(function (el) {
      const label = (el.getAttribute('aria-label') || '').trim();
      const text = (el.textContent || '').trim();
      return { id: el.id || null, cls: String(el.className), ariaLabel: label, text: text, ok: label.length > 0 || text.length > 0 };
    });
  });
  const bad = r.filter(function (x) { return !x.ok; });
  return { pass: bad.length === 0, actual: { total: r.length, unnamed: bad } };
});

/* ---------------- B. 展开 / 收起 ---------------- */
await step('B', 'B5', '点击 #island-toggle：data-open=true / aria-expanded=true / #island-panel offsetHeight>0', 'open=true, expanded=true, panelH>0', async function () {
  await page.click('#island-toggle');
  await page.waitForTimeout(800);
  const r = await page.evaluate(function () {
    const i = document.getElementById('site-island');
    const t = document.getElementById('island-toggle');
    const p = document.getElementById('island-panel');
    return { open: i.dataset.open, ariaExpanded: t.getAttribute('aria-expanded'), panelOffsetHeight: p.offsetHeight, panelOpacity: getComputedStyle(p).opacity };
  });
  return { pass: r.open === 'true' && r.ariaExpanded === 'true' && r.panelOffsetHeight > 0, actual: r };
});

await step('B', 'B6', '记录展开后的岛宽高与面板高度（观测项）', 'n/a', async function () {
  const r = await page.evaluate(function () {
    const i = document.getElementById('site-island');
    const p = document.getElementById('island-panel');
    const b = i.getBoundingClientRect();
    const pb = p.getBoundingClientRect();
    return {
      island: { x: Number(b.x.toFixed(1)), y: Number(b.y.toFixed(1)), w: Number(b.width.toFixed(1)), h: Number(b.height.toFixed(1)), left: Number(b.left.toFixed(1)), right: Number(b.right.toFixed(1)) },
      panel: { offsetHeight: p.offsetHeight, rectW: Number(pb.width.toFixed(1)), rectH: Number(pb.height.toFixed(1)), maxHeight: getComputedStyle(p).maxHeight },
      viewport: { w: window.innerWidth, h: window.innerHeight }
    };
  });
  return { pass: true, actual: r };
});

await step('B', 'B7', 'Esc 收起；再展开后点击岛外(5,5) 也收起', 'Esc->false, outsideClick->false', async function () {
  const out = {};
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  out.afterEsc = await page.evaluate(function () { return document.getElementById('site-island').dataset.open; });
  await ensureOpen(page);
  out.reopened = await page.evaluate(function () { return document.getElementById('site-island').dataset.open; });
  const urlBefore = page.url();
  await page.mouse.click(5, 5);
  await page.waitForTimeout(400);
  out.afterOutsideClick = await page.evaluate(function () { return document.getElementById('site-island').dataset.open; });
  out.urlBefore = urlBefore;
  out.urlAfter = page.url();
  return { pass: out.afterEsc === 'false' && out.reopened === 'true' && out.afterOutsideClick === 'false' && out.urlAfter === urlBefore, actual: out };
});

/* ---------------- C. 音频真实可用性 ---------------- */
await ensureOpen(page);
await step('C', 'C8', '音频元数据：currentSrc 非空 / duration ∈ [530,545] / networkState / readyState', 'currentSrc!="" && 530<=duration<=545', async function () {
  const s = await audioSnap(page);
  return { pass: !!s.currentSrc && s.duration >= 530 && s.duration <= 545, actual: { currentSrc: s.currentSrc, duration: s.duration, networkState: s.networkState, readyState: s.readyState, status: s.status, metaReadyFlag: metaReady } };
});

await step('C', 'C9', '记录浏览器实际选中的 source（观测项，预期 opus 优先）', '记录原样 currentSrc', async function () {
  const s = await audioSnap(page);
  const isOpus = /cai-shi\.opus/.test(s.currentSrc);
  const isMp3 = /cai-shi\.mp3/.test(s.currentSrc);
  notes.push('currentSrc = ' + s.currentSrc + '  => ' + (isOpus ? '选中 opus' : isMp3 ? '选中 mp3（与「opus 在前」的预期不符）' : '未知格式'));
  return { pass: true, actual: { currentSrc: s.currentSrc, picked: isOpus ? 'opus' : isMp3 ? 'mp3' : 'unknown' } };
});

await step('C', 'C10', '点击 #island-play：state=playing / paused=false / 1.5s 后 currentTime 真实增长', 'state=playing, paused=false, t1>t0+0.8', async function () {
  const before = await audioSnap(page);
  await page.click('#island-play');
  let reachedPlaying = true;
  try {
    await page.waitForFunction(function () { return document.getElementById('site-island').dataset.playerState === 'playing'; }, null, { timeout: 6000 });
  } catch (e) { reachedPlaying = false; }
  const mid = await audioSnap(page);
  await page.waitForTimeout(1600);
  const after = await audioSnap(page);
  const delta = after.currentTime - before.currentTime;
  return {
    pass: reachedPlaying && after.paused === false && delta > 0.8,
    actual: {
      usedAutoplayArg: USED_AUTOPLAY_ARG,
      autoplayArgs: [AUTOPLAY_ARG],
      reachedPlaying: reachedPlaying,
      paused: after.paused,
      t0: before.currentTime,
      t1: after.currentTime,
      delta: Number(delta.toFixed(3)),
      playerState: after.playerState,
      statusText: after.status,
      playBlockedHint: /拦截/.test(after.status || '')
    }
  };
});

await step('C', 'C11', '再点一次 #island-play：state=paused / paused=true / currentTime 停止增长', 'state=paused, paused=true, delta≈0', async function () {
  await page.click('#island-play');
  await page.waitForTimeout(300);
  const a = await audioSnap(page);
  await page.waitForTimeout(1200);
  const b = await audioSnap(page);
  return { pass: a.playerState === 'paused' && b.paused === true && Math.abs(b.currentTime - a.currentTime) < 0.1, actual: { playerState: a.playerState, paused: b.paused, t0: a.currentTime, t1: b.currentTime, delta: Number((b.currentTime - a.currentTime).toFixed(3)) } };
});

await step('C', 'C12', '点击 #island-forward：currentTime 增加约 10s（±1s）', 'delta ∈ [9,11]', async function () {
  const a = await audioSnap(page);
  await page.click('#island-forward');
  await page.waitForTimeout(300);
  const b = await audioSnap(page);
  const d = b.currentTime - a.currentTime;
  return { pass: d >= 9 && d <= 11, actual: { t0: a.currentTime, t1: b.currentTime, delta: Number(d.toFixed(3)) } };
});

await step('C', 'C13', '点击 #island-restart：currentTime < 1', 'currentTime < 1', async function () {
  await page.click('#island-restart');
  await page.waitForTimeout(300);
  const b = await audioSnap(page);
  return { pass: b.currentTime < 1, actual: { currentTime: b.currentTime } };
});

/* ---------------- D. 进度条 ---------------- */
await step('D', 'D14', 'scrubber=value(duration/2)+input/change → currentTime ≈ duration/2，elapsed 文本更新', '|currentTime-duration/2|<=2 且 elapsed 匹配 m:ss', async function () {
  const pre = await page.evaluate(function () {
    const s = document.getElementById('island-scrubber');
    return { max: s.max, min: s.min, step: s.step };
  });
  const target = Number(pre.max) / 2;
  await page.evaluate(function (v) {
    const s = document.getElementById('island-scrubber');
    s.value = String(v);
    s.dispatchEvent(new Event('input', { bubbles: true }));
    s.dispatchEvent(new Event('change', { bubbles: true }));
  }, target);
  await page.waitForTimeout(600);
  const r = await page.evaluate(function () {
    const a = document.getElementById('island-audio');
    return { currentTime: a.currentTime, elapsed: document.getElementById('island-elapsed').textContent, scrubberValue: Number(document.getElementById('island-scrubber').value), durationText: document.getElementById('island-duration').textContent };
  });
  const expectedElapsed = fmtTime(target);
  return {
    pass: Math.abs(r.currentTime - target) <= 2 && r.elapsed === expectedElapsed,
    actual: { target: target, currentTime: r.currentTime, delta: Number((r.currentTime - target).toFixed(2)), elapsed: r.elapsed, expectedElapsed: expectedElapsed, scrubberValue: r.scrubberValue, scrubberMax: pre.max, durationText: r.durationText }
  };
});

await step('D', 'D15', '播放中 scrubber.value 自动推进（>0 且持续增长）', 'v1>0 && v2>v1', async function () {
  await ensurePlaying(page);
  await page.waitForTimeout(2000);
  const v1 = num(await page.evaluate(function () { return document.getElementById('island-scrubber').value; }));
  await page.waitForTimeout(1000);
  const v2 = num(await page.evaluate(function () { return document.getElementById('island-scrubber').value; }));
  const s = await audioSnap(page);
  return { pass: v1 > 0 && v2 > v1, actual: { v1: v1, v2: v2, delta: Number((v2 - v1).toFixed(3)), paused: s.paused, currentTime: s.currentTime } };
});

await step('D', 'D16', '#island-duration 文本为 8:56', '"8:56"', async function () {
  const t = await page.evaluate(function () { return document.getElementById('island-duration').textContent; });
  return { pass: t === '8:56', actual: { text: t } };
});

/* ---------------- E. 音量 ---------------- */
await ensureOpen(page);
await step('E', 'E17', '点击 #island-volume-btn：data-volume-open=true / aria-expanded=true / 菜单可见', 'volumeOpen=true, expanded=true, 菜单可见(opacity=1, pointer-events!=none)', async function () {
  await page.click('#island-volume-btn');
  await page.waitForTimeout(500);
  const r = await page.evaluate(function () {
    const i = document.getElementById('site-island');
    const b = document.getElementById('island-volume-btn');
    const m = document.getElementById('island-volume-menu');
    const cs = getComputedStyle(m);
    return { volumeOpen: i.dataset.volumeOpen, ariaExpanded: b.getAttribute('aria-expanded'), menuOffsetHeight: m.offsetHeight, menuOpacity: cs.opacity, menuPointerEvents: cs.pointerEvents, menuDisplay: cs.display };
  });
  const visible = r.menuOffsetHeight > 0 && r.menuOpacity === '1' && r.menuPointerEvents !== 'none';
  return { pass: r.volumeOpen === 'true' && r.ariaExpanded === 'true' && visible, actual: r, expected: 'volumeOpen=true, expanded=true, offsetHeight>0(注:关闭时也非0), opacity=1, pointer-events!=none' };
});

await step('E', 'E18', 'volume-slider=0.3 + input → audio.volume≈0.3 且 #island-volume-value=30%', 'volume≈0.3, 文本 "30%"', async function () {
  await page.evaluate(function () {
    const s = document.getElementById('island-volume-slider');
    s.value = '0.3';
    s.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForTimeout(300);
  const r = await page.evaluate(function () {
    const a = document.getElementById('island-audio');
    return { volume: a.volume, valueText: document.getElementById('island-volume-value').textContent, sliderValue: document.getElementById('island-volume-slider').value };
  });
  return { pass: Math.abs(r.volume - 0.3) < 0.001 && r.valueText === '30%', actual: r };
});

await step('E', 'E19', '音量设 0 → data-muted=true 且 .island__iv--off 显示', 'muted=true, iv--off display!=="none"', async function () {
  const r = await page.evaluate(function () {
    const s = document.getElementById('island-volume-slider');
    s.value = '0';
    s.dispatchEvent(new Event('input', { bubbles: true }));
    const i = document.getElementById('site-island');
    const off = document.querySelector('.island__iv--off');
    const offCs = getComputedStyle(off);
    const onCs = getComputedStyle(document.querySelector('.island__iv--on'));
    return {
      muted: i.dataset.muted,
      offDisplay: offCs.display,
      offOffsetParent: off.offsetParent === undefined ? 'n/a(svg)' : (off.offsetParent === null ? null : 'non-null'),
      onDisplay: onCs.display,
      ivOffRect: (function () { const b = off.getBoundingClientRect(); return { w: Number(b.width.toFixed(1)), h: Number(b.height.toFixed(1)) }; })()
    };
  });
  return { pass: r.muted === 'true' && r.offDisplay !== 'none', actual: r };
});
/* 复位音量 & 关闭菜单，避免遮挡后续真实点击 */
await page.evaluate(function () {
  const s = document.getElementById('island-volume-slider');
  s.value = '0.72';
  s.dispatchEvent(new Event('input', { bubbles: true }));
});
await page.click('#island-volume-btn');
await page.waitForTimeout(400);
notes.push('E 之后已把音量复位 0.72 并收起音量菜单（避免遮挡后续点击）');

/* ---------------- F. 歌词与波形 ---------------- */
await step('F', 'F20', '歌词跟进：currentTime=82 显示「开采/血肉」；currentTime=10 显示 meta 行', '命中歌词或 meta', async function () {
  let at82 = null;
  for (let i = 0; i < 12; i++) {
    await page.evaluate(function () { document.getElementById('island-audio').currentTime = 82; });
    await page.waitForTimeout(450);
    at82 = await page.evaluate(function () {
      const el = document.getElementById('island-lyric');
      return { text: el.textContent, cls: el.className };
    });
    if (/开采|血肉/.test(at82.text)) break;
  }
  await page.evaluate(function () { document.getElementById('island-audio').currentTime = 10; });
  await page.waitForTimeout(600);
  const at10 = await page.evaluate(function () {
    const el = document.getElementById('island-lyric');
    return { text: el.textContent, cls: el.className };
  });
  const p82 = /开采|血肉/.test(at82.text);
  const p10 = at10.text.trim().length > 0 && (/[作编词曲]/.test(at10.text) || /is-meta/.test(at10.cls)) && at10.text !== '按下播放，开始听。';
  return { pass: p82 && p10, actual: { at82: at82, at10: at10 }, expected: '82s 命中「开采/血肉」；10s 命中 meta 行' };
});

await step('F', 'F21', '波形：.island__wave--big i ≥6；播放中高度变化', 'count>=6 且高度有变化（reduced-motion 时豁免）', async function () {
  const info = await page.evaluate(function () {
    return {
      big: document.querySelectorAll('.island__wave--big i').length,
      mini: document.querySelectorAll('.island__wave[data-wave="mini"] i').length,
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
    };
  });
  if (info.big < 6) return { pass: false, actual: info };
  if (info.reducedMotion) {
    notes.push('prefers-reduced-motion 生效：按规范跳过波形动画断言（waveRaf 被 JS 主动跳过）');
    return { pass: true, actual: { count: info.big, miniCount: info.mini, reducedMotion: true, skipped: true } };
  }
  await ensurePlaying(page);
  await page.waitForTimeout(500);
  const sample = async function () {
    return await page.evaluate(function () {
      const bars = document.querySelectorAll('.island__wave--big i');
      return Array.prototype.slice.call(bars).map(function (b) { return Number(getComputedStyle(b).height.replace('px', '')); });
    });
  };
  const s0 = await sample();
  await page.waitForTimeout(300);
  const s1 = await sample();
  await page.waitForTimeout(300);
  const s2 = await sample();
  let changed = 0;
  for (let i = 0; i < s0.length; i++) {
    if (Math.abs(s1[i] - s0[i]) > 0.4 || Math.abs(s2[i] - s1[i]) > 0.4) changed++;
  }
  return { pass: changed > 0, actual: { count: info.big, miniCount: info.mini, reducedMotion: false, s0: s0, s1: s1, s2: s2, barsChanged: changed } };
});

/* ---------------- G. 响应式与主题 ---------------- */
const mobile = await ctx.newPage();
await mobile.setViewportSize({ width: 390, height: 844 });
attach(mobile, 'mobile390');
await mobile.goto(URL_, { waitUntil: 'networkidle', timeout: 45000 });
await mobile.waitForTimeout(1200);
try {
  await mobile.waitForFunction(function () { const a = document.getElementById('island-audio'); return !!a && a.readyState >= 1; }, null, { timeout: 15000 });
} catch (e) { notes.push('移动页音频 metadata 未在 15s 内就绪'); }

await step('G', 'G22a', '390x844：折叠态关键断言（aria-expanded=false / 文案 / mini 封面）', '同 A1/A2（排除尺寸）', async function () {
  const r = await mobile.evaluate(function () {
    const i = document.getElementById('site-island');
    const t = document.getElementById('island-toggle');
    const im = document.querySelector('.island__art--mini img');
    return {
      exists: !!i,
      open: i.dataset.open,
      playerState: i.dataset.playerState,
      ariaExpanded: t.getAttribute('aria-expanded'),
      title: (document.querySelector('.island__title') || {}).textContent || '',
      artist: (document.querySelector('.island__artist') || {}).textContent || '',
      copyDisplay: getComputedStyle(document.querySelector('.island__copy')).display,
      miniNaturalWidth: im ? im.naturalWidth : null,
      islandRect: (function () { const b = i.getBoundingClientRect(); return { left: Number(b.left.toFixed(1)), right: Number(b.right.toFixed(1)), w: Number(b.width.toFixed(1)), h: Number(b.height.toFixed(1)) }; })(),
      viewportW: window.innerWidth
    };
  });
  const pass = r.exists && r.open === 'false' && r.playerState === 'idle' && r.ariaExpanded === 'false'
    && r.title.indexOf('采石') !== -1 && r.artist.indexOf('万能青年旅店') !== -1 && r.miniNaturalWidth > 0
    && r.islandRect.left >= -0.5 && r.islandRect.right <= r.viewportW + 0.5;
  return { pass: pass, actual: r, expected: '折叠态断言通过且岛在视口内' };
});

await step('G', 'G22b', '390x844：展开 → open=true/aria=true/panel>0；Esc 收起；无横向溢出；岛不越界', 'open 切换正常 & scrollWidth-clientWidth===0 & 0<=left,right<=vw', async function () {
  await mobile.click('#island-toggle');
  await mobile.waitForTimeout(800);
  const open = await mobile.evaluate(function () {
    const i = document.getElementById('site-island');
    const p = document.getElementById('island-panel');
    const b = i.getBoundingClientRect();
    return {
      open: i.dataset.open,
      ariaExpanded: document.getElementById('island-toggle').getAttribute('aria-expanded'),
      panelOffsetHeight: p.offsetHeight,
      islandRect: { left: Number(b.left.toFixed(1)), right: Number(b.right.toFixed(1)), w: Number(b.width.toFixed(1)), h: Number(b.height.toFixed(1)) },
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      docScrollW: document.documentElement.scrollWidth,
      docClientW: document.documentElement.clientWidth,
      viewportW: window.innerWidth
    };
  });
  await mobile.keyboard.press('Escape');
  await mobile.waitForTimeout(400);
  const closed = await mobile.evaluate(function () { return document.getElementById('site-island').dataset.open; });
  const pass = open.open === 'true' && open.ariaExpanded === 'true' && open.panelOffsetHeight > 0
    && closed === 'false' && open.overflowX === 0
    && open.islandRect.left >= -0.5 && open.islandRect.right <= open.viewportW + 0.5;
  return { pass: pass, actual: { expanded: open, afterEsc: closed }, expected: '展开成立、Esc 收起、overflowX=0、岛在视口内' };
});

await step('G', 'G23', '1440x900 切深色：岛背景色与文字色都变化（无白底白字）', 'bg 与 color 均变化', async function () {
  await ensureOpen(page);
  const light = await page.evaluate(function () {
    const cs = getComputedStyle(document.getElementById('site-island'));
    return { theme: document.documentElement.dataset.theme || null, bg: cs.backgroundColor, fg: cs.color, surfaceRgb: getComputedStyle(document.documentElement).getPropertyValue('--surface-rgb').trim() };
  });
  await page.evaluate(function () { document.documentElement.dataset.theme = 'dark'; });
  await page.waitForTimeout(600);
  const dark = await page.evaluate(function () {
    const cs = getComputedStyle(document.getElementById('site-island'));
    return { theme: document.documentElement.dataset.theme, bg: cs.backgroundColor, fg: cs.color, surfaceRgb: getComputedStyle(document.documentElement).getPropertyValue('--surface-rgb').trim() };
  });
  const parse = function (c) { const m = c.match(/rgba?\(([^)]+)\)/); return m ? m[1].split(',').map(function (x) { return Number(x.trim()); }) : null; };
  const lum = function (c) { const p = parse(c); if (!p) return null; return (0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]) / 255; };
  const bgChanged = light.bg !== dark.bg;
  const fgChanged = light.fg !== dark.fg;
  const lightLum = { bg: lum(light.bg), fg: lum(light.fg) };
  const darkLum = { bg: lum(dark.bg), fg: lum(dark.fg) };
  const lowContrast = function (x) { return x.bg !== null && x.fg !== null && Math.abs(x.bg - x.fg) < 0.15; };
  return { pass: bgChanged && fgChanged && !lowContrast(lightLum) && !lowContrast(darkLum), actual: { light: light, dark: dark, lumLight: lightLum, lumDark: darkLum, bgChanged: bgChanged, fgChanged: fgChanged } };
});

/* ---------------- H. 网络与控制台 ---------------- */
await step('H', 'H24', 'console error / pageerror 为空', '0 条', async function () {
  return { pass: consoleErrors.length === 0, actual: consoleErrors };
});

await step('H', 'H25', '/media/ 响应状态码与 Content-Length（200/206 均正常；媒体元素主动 abort 的请求单列）', '所有拿到响应的请求为 200 或 206；REQUESTFAILED/ERR_ABORTED 属媒体 demux/seek 主动取消，单列不计失败', async function () {
  const isAborted = function (m) { return m.status === 'REQUESTFAILED' && m.failure === 'net::ERR_ABORTED'; };
  const aborted = media.filter(isAborted);
  const bad = media.filter(function (m) { return m.status !== 200 && m.status !== 206 && !isAborted(m); });
  return { pass: bad.length === 0, actual: { count: media.length, okCount: media.length - bad.length - aborted.length, abortedCount: aborted.length, aborted: aborted, nonOk: bad, all: media } };
});

/* ============================ 汇总 ============================ */
await ctx.close();
await browser.close();

const groups = {};
for (const r of results) {
  if (!groups[r.group]) groups[r.group] = { pass: [], fail: [] };
  (r.pass ? groups[r.group].pass : groups[r.group].fail).push(r.id + ' ' + r.name);
}
const failures = results.filter(function (r) { return !r.pass; });
const compGroups = {};
for (const g of Object.keys(groups)) {
  compGroups[g] = { pass: groups[g].pass.length, fail: groups[g].fail.length, failedItems: groups[g].fail };
}
const report = {
  meta: {
    url: URL_,
    executablePath: EXE,
    chromeVersion: chromeVersion,
    usedAutoplayArg: USED_AUTOPLAY_ARG,
    autoplayArgs: [AUTOPLAY_ARG],
    headless: true,
    startedAt: startedAt,
    elapsedMs: Date.now() - t0ms,
    audioMeta: { currentSrc: metaSnap.currentSrc, duration: metaSnap.duration, readyState: metaSnap.readyState, networkState: metaSnap.networkState }
  },
  summary: { total: results.length, pass: results.length - failures.length, fail: failures.length, byGroup: compGroups },
  groups: {
    A: results.filter(function (r) { return r.group === 'A'; }),
    B: results.filter(function (r) { return r.group === 'B'; }),
    C: results.filter(function (r) { return r.group === 'C'; }),
    D: results.filter(function (r) { return r.group === 'D'; }),
    E: results.filter(function (r) { return r.group === 'E'; }),
    F: results.filter(function (r) { return r.group === 'F'; }),
    G: results.filter(function (r) { return r.group === 'G'; }),
    H: results.filter(function (r) { return r.group === 'H'; })
  },
  failures: failures,
  mediaResponses: media,
  consoleErrors: consoleErrors,
  notes: notes
};
fs.writeFileSync('.island-e2e-report.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
