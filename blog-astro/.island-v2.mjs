
import { chromium } from 'playwright-core';

const URL = process.env.URL || 'http://localhost:4321/';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const result = { console: [], requests: [], checks: {} };
const ok = (name, pass, detail) => { result.checks[name] = { pass, detail }; };

const browser = await chromium.launch({ executablePath: CHROME, headless: true,
  args: ['--autoplay-policy=no-user-gesture-required', '--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') result.console.push(m.type() + ': ' + m.text()); });
page.on('pageerror', e => result.console.push('pageerror: ' + e.message));
page.on('request', r => { if (r.url().includes('island-player') || r.url().includes('/media/')) result.requests.push(r.url().replace(URL, '/')); });

await page.goto(URL, { waitUntil: 'load' });
await page.waitForTimeout(600);

const box = async sel => page.evaluate(s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), r: getComputedStyle(e).borderRadius }; }, sel);

// 1. 折叠态几何
const c = await box('#site-island');
ok('collapsed-250x48', c && Math.abs(c.w - 250) <= 2 && Math.abs(c.h - 48) <= 2, JSON.stringify(c));
ok('collapsed-top-center', c && Math.abs(c.y - 12) <= 2 && Math.abs((c.x + c.w / 2) - 720) <= 2, JSON.stringify(c));

// 2. 懒加载：初始不应有 island-player.js
ok('lazy-before-hover', !result.requests.some(u => u.includes('island-player.js')), JSON.stringify(result.requests));

// 3. hover 加载
await page.hover('#site-island');
await page.waitForFunction(() => document.querySelector('#site-island').dataset.bound === '1', null, { timeout: 8000 }).catch(() => {});
const bound = await page.getAttribute('#site-island', 'data-bound');
ok('loader-bound-on-hover', bound === '1', String(bound));

// 4. 展开几何
await page.click('#site-island-toggle', { force: true });
await page.waitForTimeout(700);
const o = await box('#site-island');
ok('expanded-544x286', o && Math.abs(o.w - 544) <= 3 && Math.abs(o.h - 286) <= 3, JSON.stringify(o));
ok('expanded-black-bg', await page.evaluate(() => getComputedStyle(document.querySelector('#site-island')).backgroundColor) === 'rgb(0, 0, 0)', '');
const inner = await page.evaluate(() => {
  const art = document.querySelector('.island-player-art').getBoundingClientRect();
  return { art: { w: +art.width.toFixed(1), h: +art.height.toFixed(1) }, lyric: getComputedStyle(document.querySelector('.island-player-lyric')).fontSize };
});
ok('cqw-art-17.55', Math.abs(inner.art.w - 544 * 0.1755) < 3, JSON.stringify(inner));

// 5. 音量菜单不被裁切
await page.click('#island-volume-button', { force: true });
await page.waitForTimeout(400);
const clip = await page.evaluate(() => {
  const m = document.querySelector('#island-volume-menu').getBoundingClientRect();
  const p = document.querySelector('#site-island').getBoundingClientRect();
  return { m: { x: Math.round(m.x), y: Math.round(m.y), w: Math.round(m.width), h: Math.round(m.height) }, p: { x: Math.round(p.x), y: Math.round(p.y) } };
});
ok('volume-menu-inside-island', clip.m.y >= 0 && clip.m.x >= 0 && clip.m.x + clip.m.w <= clip.p.x + 544 + 1, JSON.stringify(clip));
const menuVisible = await page.evaluate(() => getComputedStyle(document.querySelector('#island-volume-menu')).opacity);
ok('volume-menu-visible', menuVisible === '1', menuVisible);

// 6. 播放
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
await page.click('#island-player-toggle', { force: true });
await page.waitForTimeout(2500);
const st = await page.evaluate(() => {
  const a = document.querySelector('#site-island-audio');
  return { paused: a.paused, t: +a.currentTime.toFixed(2), state: document.querySelector('#site-island').dataset.playerState,
           cur: a.currentSrc.replace(location.origin, ''), dur: Math.round(a.duration), elapsed: document.querySelector('#island-player-elapsed').textContent.trim(), remain: document.querySelector('#island-player-duration').textContent.trim(), lyric: document.querySelector('#island-player-lyric').textContent.trim() };
});
ok('audio-plays', st.paused === false && st.t > 0.5, JSON.stringify(st));
ok('duration-536', st.dur === 536, String(st.dur));
ok('lyric-advances', st.lyric.length > 0, st.lyric);

// 7. nav 碰撞
const nav = await page.evaluate(() => {
  const isl = document.querySelector('#site-island').getBoundingClientRect();
  const cl = document.querySelector('.nav__cluster').getBoundingClientRect();
  const br = document.querySelector('.nav__brand').getBoundingClientRect();
  return { gapRight: Math.round(cl.x - (isl.x + isl.width)), gapLeft: Math.round(isl.x - (br.x + br.width)), cluster: Math.round(cl.x) };
});
ok('nav-no-overlap-1440', nav.gapRight > 0 && nav.gapLeft > 0, JSON.stringify(nav));

// 8. 移动端
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(500);
const m = await page.evaluate(() => {
  const isl = document.querySelector('#site-island').getBoundingClientRect();
  return { w: Math.round(isl.width), x: Math.round(isl.x), docW: document.documentElement.scrollWidth, winW: innerWidth };
});
ok('mobile-collapsed-fits', m.w <= 176 + 2 && m.docW <= m.winW, JSON.stringify(m));
await page.screenshot({ path: 'shots/v2-mobile-island.png' });

await page.setViewportSize({ width: 1440, height: 900 });
await page.waitForTimeout(500);
await page.screenshot({ path: 'shots/v2-desktop-island.png', fullPage: false });

result.checks.consoleErrors = result.console;
console.log(JSON.stringify({ summary: Object.fromEntries(Object.entries(result.checks).filter(([, v]) => v && v.pass !== undefined).map(([k, v]) => [k, v.pass])), details: result.checks, requests: result.requests }, null, 1));
await browser.close();
