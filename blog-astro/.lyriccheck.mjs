import { chromium } from 'playwright-core';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const b = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
p.on('pageerror', e => errs.push('pageerror: ' + e.message));
p.on('response', r => { if (r.status() >= 400) errs.push('HTTP ' + r.status() + ' ' + r.url()); });
await p.goto('http://localhost:4321/', { waitUntil: 'load' });
await p.waitForFunction(() => document.querySelector('#site-island')?.dataset.bound === '1', null, { timeout: 15000 });
await p.dispatchEvent('#site-island', 'pointerenter');
await p.waitForTimeout(1200);
await p.click('#island-player-toggle', { force: true });
await p.waitForTimeout(1400);
await p.click('#island-player-next', { force: true });
await p.waitForTimeout(1600);
const lyricAt = async (t) => {
  await p.evaluate(tt => { document.querySelector('#site-island-audio').currentTime = tt; }, t);
  await p.waitForTimeout(600);
  return p.evaluate(() => document.querySelector('#island-player-lyric').textContent.trim());
};
const out = {
  t5: await lyricAt(5),      // 无歌词区 -> 曲名
  t12: await lyricAt(12),    // House of cards
  t21: await lyricAt(21),    // I loved you so
  t60: await lyricAt(60),    // Don't call my phone
  t130: await lyricAt(130),  // 末段
  t200: await lyricAt(200),  // 歌词结束后 -> 曲名
  errors: errs,
};
console.log(JSON.stringify(out, null, 1));
await b.close();