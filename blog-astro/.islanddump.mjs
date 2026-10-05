import { chromium } from 'playwright-core';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const b = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
await p.goto('http://localhost:4321/', { waitUntil: 'load' });
await p.waitForFunction(() => document.querySelector('#site-island')?.dataset.bound === '1', null, { timeout: 15000 }).catch(() => {});
await p.dispatchEvent('#site-island', 'pointerenter');
await p.waitForTimeout(1300);
await p.click('#island-player-toggle', { force: true });
await p.waitForTimeout(2200);
const dump = await p.evaluate(() => {
  const isl = document.querySelector('#site-island');
  const ir = isl.getBoundingClientRect();
  const rows = [];
  const walk = (el, depth) => {
    if (depth > 4) return;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return;
    const cs = getComputedStyle(el);
    const tag = el.tagName.toLowerCase();
    const txt = el.children.length === 0 ? (el.textContent || '').trim().slice(0, 28) : '';
    rows.push('  '.repeat(depth) + tag + '.' + (el.className || '').toString().split(' ').filter(Boolean).join('.') +
      ' [' + Math.round(r.left - ir.left) + ',' + Math.round(r.top - ir.top) + ' ' + Math.round(r.width) + '×' + Math.round(r.height) + ']' +
      (txt ? ' “' + txt + '”' : '') + ' fs=' + cs.fontSize + ' op=' + cs.opacity);
    [...el.children].forEach(c => walk(c, depth + 1));
  };
  walk(isl, 0);
  return rows.join('\n');
});
console.log('island rect + tree @1600px, expanded, playing');
console.log(dump);
console.log('---');
console.log('audio:', await p.evaluate(() => { const a = document.querySelector('#site-island-audio'); return JSON.stringify({ t: +a.currentTime.toFixed(1), vol: a.volume, dur: Math.round(a.duration), lyric: document.querySelector('#island-player-lyric').textContent.trim(), status: document.querySelector('#island-player-status').textContent, elapsed: document.querySelector('#island-player-elapsed').textContent, remain: document.querySelector('#island-player-duration').textContent }); }));
await b.close();