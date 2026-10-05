import { chromium } from 'playwright-core';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const b = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await p.addInitScript(() => { try { localStorage.setItem('blog-theme', 'dark'); } catch {} });
await p.goto('http://localhost:4321/', { waitUntil: 'load' });
await p.waitForFunction(() => document.querySelector('#site-island')?.dataset.bound === '1', null, { timeout: 15000 });
await p.dispatchEvent('#site-island', 'pointerenter');
await p.waitForTimeout(1200);
await p.click('#island-player-toggle', { force: true });
await p.waitForTimeout(1500);
const box = await p.evaluate(() => {
  const r = document.querySelector('#site-island').getBoundingClientRect();
  return { x: Math.round(r.left), y: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) };
});
await p.screenshot({ path: 'shots/pl-00-island-tight.png', clip: { x: box.x, y: box.y, width: box.width, height: box.height } });
console.log(JSON.stringify(box));
await b.close();