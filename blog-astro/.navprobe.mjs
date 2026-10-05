import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:4321/', { waitUntil: 'load' });
await p.waitForFunction(() => document.querySelector('#site-island')?.dataset.bound === '1', null, { timeout: 15000 }).catch(() => {});
await p.dispatchEvent('#site-island', 'pointerenter');
await p.waitForTimeout(1200);
const r = await p.evaluate(() => {
  const isl = document.querySelector('#site-island');
  const cl = document.querySelector('.nav__cluster');
  const parent = isl.parentElement;
  const kids = [...parent.children].map(c => c.className || c.tagName);
  const matches = isl.matches(':has(~ .nav__cluster)');
  return { open: isl.dataset.open, op: getComputedStyle(cl).opacity, parentClass: parent.className, kids, siblingMatches: isl.matches('.music-island[data-open="true"] ~ .nav__cluster'), clParent: cl.parentElement.className,
           cssMatches: [...document.styleSheets].flatMap(s => { try { return [...s.cssRules] } catch { return [] } }).filter(r => r.cssText && r.cssText.includes('.nav__cluster')).map(r => r.cssText.slice(0, 200)) };
});
console.log(JSON.stringify(r, null, 1));
await b.close();