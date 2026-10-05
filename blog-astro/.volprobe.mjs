import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:4321/', { waitUntil: 'load' });
await p.waitForFunction(() => document.querySelector('#site-island')?.dataset.bound === '1', null, { timeout: 15000 }).catch(() => {});
await p.click('#island-player-toggle', { force: true }).catch(() => {});
await p.waitForTimeout(2500);
const r = await p.evaluate(() => {
  const a = document.querySelector('#site-island-audio');
  return { volume: a.volume, muted: a.muted, paused: a.paused, t: +a.currentTime.toFixed(2), dataMuted: document.querySelector('#site-island').dataset.muted,
           slider: document.querySelector('#island-volume-slider').value, out: document.querySelector('#island-volume-value').textContent,
           lsVol: localStorage.getItem('b0-player-volume') };
});
console.log(JSON.stringify(r));
await b.close();