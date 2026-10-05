import { chromium } from 'playwright-core';
const URL_ = process.env.URL || 'http://localhost:4321/';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const out = { checks: {}, console: [], reqs: [], analyser: {} };
const ok = (n, p, d) => { out.checks[n] = { pass: p, detail: d }; };
const browser = await chromium.launch({ executablePath: CHROME, headless: true,
  args: ['--autoplay-policy=no-user-gesture-required', '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
// 插桩：记录 AnalyserNode 实际读到的最大频谱值 + AudioContext 状态
await page.addInitScript(() => {
  const w = window;
  w.__probe = { maxFreq: 0, ctxState: '', samples: 0 };
  const AC = w.AudioContext || w.webkitAudioContext;
  if (!AC) return;
  const origAnalyser = AC.prototype.createAnalyser;
  AC.prototype.createAnalyser = function () {
    const a = origAnalyser.call(this);
    const orig = a.getByteFrequencyData.bind(a);
    a.getByteFrequencyData = function (arr) {
      orig(arr);
      const m = Math.max(...arr);
      if (m > w.__probe.maxFreq) w.__probe.maxFreq = m;
      w.__probe.samples++;
      w.__probe.ctxState = a.context ? a.context.state : '';
      return undefined;
    };
    return a;
  };
});
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') out.console.push(m.type() + ': ' + m.text()); });
page.on('pageerror', e => out.console.push('pageerror: ' + e.message));
page.on('request', r => { if (r.url().includes('/player.js')) out.reqs.push('player.js'); });
await page.goto(URL_, { waitUntil: 'load' });
await page.waitForTimeout(300);
const box = s => page.evaluate(x => { const e = document.querySelector(x); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; }, s);
const c = await box('#site-island');
ok('collapsed-250x48', c && Math.abs(c.w - 250) <= 2 && Math.abs(c.h - 48) <= 2, JSON.stringify(c));
ok('collapsed-top-center-12px', c && Math.abs(c.y - 12) <= 2 && Math.abs(c.x + c.w / 2 - 720) <= 3, JSON.stringify(c));
await page.hover('#site-island-toggle').catch(async () => { await page.dispatchEvent('#site-island', 'pointerenter'); });
await page.waitForFunction(() => document.querySelector('#site-island')?.dataset.bound === '1', null, { timeout: 10000 }).catch(() => {});
ok('loader-binds', await page.getAttribute('#site-island', 'data-bound') === '1', String(await page.getAttribute('#site-island', 'data-bound')));
await page.dispatchEvent('#site-island', 'pointerenter');
await page.waitForTimeout(1000);
// 参考站真实生效值：后出现的 cqw 块覆盖先出现的 430x222 块
const o = await box('#site-island');
ok('expanded-min(34rem)=544x286', o && Math.abs(o.w - 544) <= 3 && Math.abs(o.h - 286) <= 3, JSON.stringify(o));
const inner = await page.evaluate(() => ({
  art: +document.querySelector('.island-player-art').getBoundingClientRect().width.toFixed(1),
  lyric: getComputedStyle(document.querySelector('.island-player-lyric')).fontSize,
  radius: getComputedStyle(document.querySelector('#site-island')).borderRadius,
  bg: getComputedStyle(document.querySelector('#site-island')).backgroundColor,
  actionsH: +document.querySelector('.island-player-actions').getBoundingClientRect().height.toFixed(1),
}));
ok('cqw-driven-internals', Math.abs(inner.art - 95.5) < 2 && inner.radius === '58.4px' && inner.bg === 'rgb(0, 0, 0)' && Math.abs(inner.actionsH - 69.6) < 2, JSON.stringify(inner));
const clusterFaded = await page.evaluate(() => getComputedStyle(document.querySelector('.nav__cluster')).opacity);
ok('nav-cluster-fades-when-open', clusterFaded === '0', clusterFaded);
const brandVisible = await page.evaluate(() => getComputedStyle(document.querySelector('.nav__brand')).opacity);
ok('brand-stays-visible', brandVisible === '1', brandVisible);
await page.click('#island-volume-button', { force: true });
await page.waitForTimeout(400);
const vm = await page.evaluate(() => {
  const m = document.querySelector('#island-volume-menu').getBoundingClientRect();
  const p = document.querySelector('#site-island').getBoundingClientRect();
  return { ok: m.left >= p.left && m.right <= p.right + 1 && m.top >= -1, m: { l: Math.round(m.left), r: Math.round(m.right), t: Math.round(m.top) }, p: { l: Math.round(p.left), r: Math.round(p.right) }, op: getComputedStyle(document.querySelector('#island-volume-menu')).opacity };
});
ok('volume-menu-unclipped', vm.ok && vm.op === '1', JSON.stringify(vm));
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
await page.click('#island-player-toggle', { force: true });
await page.waitForTimeout(3000);
const st = await page.evaluate(() => {
  const a = document.querySelector('#site-island-audio');
  return { vol: a.volume, muted: a.muted, paused: a.paused, t: +a.currentTime.toFixed(2), state: document.querySelector('#site-island').dataset.playerState, cur: a.currentSrc.replace(location.origin, ''), dur: Math.round(a.duration),
    el: document.querySelector('#island-player-elapsed').textContent.trim(), rem: document.querySelector('#island-player-duration').textContent.trim(),
    lyric: document.querySelector('#island-player-lyric').textContent.trim(), probe: JSON.parse(JSON.stringify(window.__probe)) };
});
ok('audio-plays', st.paused === false && st.t > 0.5 && st.dur === 536, JSON.stringify({ paused: st.paused, t: st.t, dur: st.dur, cur: st.cur }));
ok('default-volume-72', st.vol === 0.72 && st.muted === false, JSON.stringify({ vol: st.vol, muted: st.muted }));
ok('remaining-uses-U+2212', st.rem.startsWith('\u2212'), st.rem);
ok('analyser-gets-signal', st.probe.maxFreq > 0 && st.probe.samples > 10, JSON.stringify(st.probe));
// 跳到 100s 检查歌词推进
await page.evaluate(() => { const a = document.querySelector('#site-island-audio'); a.currentTime = 100; });
await page.waitForTimeout(800);
const lyr = await page.evaluate(() => document.querySelector('#island-player-lyric').textContent.trim());
ok('lyric-tracks-time', lyr.includes('血肉') || lyr.includes('太行') || lyr.length > 0 && lyr !== '前奏里，故事正准备开始。', lyr);
const wv = await page.evaluate(() => +parseFloat(getComputedStyle(document.querySelector('.island-mini-wave i')).getPropertyValue('--visualizer-height')).toFixed(2));
ok('visualizer-height-moves', wv > 4.2, String(wv));
await page.screenshot({ path: 'shots/v2-expanded.png' });
await page.keyboard.press('Escape');
await page.waitForTimeout(700);
await page.screenshot({ path: 'shots/v2-collapsed.png' });
const nav = await page.evaluate(() => { const i = document.querySelector('#site-island').getBoundingClientRect(); const b = document.querySelector('.nav__brand').getBoundingClientRect(); return { gapLeft: Math.round(i.left - b.right) }; });
ok('brand-not-covered', nav.gapLeft >= 0, JSON.stringify(nav));
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(600);
const mob = await page.evaluate(() => { const r = document.querySelector('#site-island').getBoundingClientRect(); return { w: Math.round(r.width), l: Math.round(r.left), docW: document.documentElement.scrollWidth, winW: innerWidth }; });
ok('mobile-no-overflow', mob.docW <= mob.winW && mob.l >= 0, JSON.stringify(mob));
await page.screenshot({ path: 'shots/v2-mobile.png' });
out.summary = Object.fromEntries(Object.entries(out.checks).map(([k, v]) => [k, v.pass]));
console.log(JSON.stringify(out, null, 1));
await browser.close();
