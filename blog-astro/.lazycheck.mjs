import { chromium } from 'playwright-core';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const b = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const reqs = [];
p.on('request', r => { if (r.url().includes('/player.js')) reqs.push(Date.now()); });
const t0 = Date.now();
await p.goto('http://localhost:4321/', { waitUntil: 'load' });
await p.waitForTimeout(3000);
const early = reqs.length;
await p.mouse.move(720, 40);   // 悬停到岛
await p.waitForTimeout(1500);
const afterHover = reqs.length;
console.log(JSON.stringify({ playerRequestedWithin3sIdle: early, lazyOK: early === 0, requestedAfterHover: afterHover, bound: await p.getAttribute('#site-island','data-bound') }));
console.log('scroll depth check...');
await p.evaluate(() => window.scrollTo(0, 2000));
await p.waitForTimeout(500);
console.log('console errors:', JSON.stringify(await p.evaluate(() => window.__errs || [])));
await b.close();