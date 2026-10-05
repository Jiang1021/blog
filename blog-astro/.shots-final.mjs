
import { chromium } from 'playwright-core';
const exe = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const P = 'shots/';

async function shot(p, name, opts = {}, clip) {
  if (opts.theme) await p.evaluate(t => { document.documentElement.dataset.theme = t; }, opts.theme);
  if (opts.scroll !== undefined) await p.evaluate(y => window.scrollTo(0, y), opts.scroll);
  if (opts.open !== undefined) await p.evaluate(o => { document.querySelector('#site-island').dataset.open = String(o); }, opts.open);
  await p.waitForTimeout(opts.wait ?? 700);
  await p.screenshot({ path: P + name, clip });
}

const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
await p.evaluate(() => document.querySelectorAll('[data-reveal]').forEach(e => e.classList.add('is-in')));
await p.waitForTimeout(1200);
await shot(p, 'final-01-hero-light.png', { theme: 'light', scroll: 0, wait: 900 });
await shot(p, 'final-02-hero-dark.png', { theme: 'dark', wait: 700 });
await shot(p, 'final-03-work.png', { theme: 'light', scroll: 1180 });
await shot(p, 'final-04-about.png', { theme: 'dark', scroll: 3300 });
await shot(p, 'final-05-footer.png', { theme: 'light', scroll: 4700 });

// 灵动岛特写
await p.evaluate(() => { document.documentElement.dataset.theme = 'light'; window.scrollTo(0, 0); });
await p.click('#island-toggle');
await p.waitForTimeout(700);
await p.click('#island-play');
await p.waitForTimeout(3200);
await shot(p, 'final-06-island-open-light.png', {}, { x: 460, y: 620, width: 520, height: 280 });
await shot(p, 'final-07-island-open-dark.png', { theme: 'dark' }, { x: 460, y: 620, width: 520, height: 280 });
await p.evaluate(() => { document.querySelector('#site-island').dataset.volumeOpen = 'true'; });
await shot(p, 'final-08-island-volume-dark.png', {}, { x: 460, y: 600, width: 520, height: 300 });
await p.evaluate(() => { const i = document.querySelector('#site-island'); i.dataset.open = 'false'; i.dataset.volumeOpen = 'false'; document.documentElement.dataset.theme = 'light'; });
await shot(p, 'final-09-island-closed-light.png', {}, { x: 520, y: 800, width: 400, height: 100 });
await p.close();

const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
await m.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
await m.evaluate(() => document.querySelectorAll('[data-reveal]').forEach(e => e.classList.add('is-in')));
await m.waitForTimeout(1000);
await m.screenshot({ path: P + 'final-10-mobile-hero.png' });
await m.click('#island-toggle');
await m.waitForTimeout(800);
await m.screenshot({ path: P + 'final-11-mobile-island.png' });
await m.close();
await browser.close();
console.log('shots done');
