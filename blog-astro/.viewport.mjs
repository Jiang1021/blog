import { chromium } from 'playwright-core';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const b = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const out = {};
for (const [w, h, label] of [[390, 844, 'mobile'], [768, 1024, 'tablet'], [1280, 800, 'laptop'], [1920, 1080, 'desktop']]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  const errs = [];
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await p.goto('http://localhost:4321/', { waitUntil: 'load' });
  await p.waitForTimeout(900);
  // 展开岛
  await p.waitForFunction(() => document.querySelector('#site-island')?.dataset.bound === '1', null, { timeout: 12000 }).catch(() => {});
  await p.dispatchEvent('#site-island', 'pointerenter');
  await p.waitForTimeout(1100);
  const m = await p.evaluate(() => {
    const isl = document.querySelector('#site-island').getBoundingClientRect();
    const br = document.querySelector('.nav__brand').getBoundingClientRect();
    const cl = document.querySelector('.nav__cluster').getBoundingClientRect();
    const overl = (a, b) => !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);
    const menuO = document.querySelector('#island-volume-menu').getBoundingClientRect();
    return {
      island: { l: Math.round(isl.left), r: Math.round(isl.right), w: Math.round(isl.width), t: Math.round(isl.top) },
      overlapBrand: overl(isl, br), overlapCluster: overl(isl, cl),
      overflowX: document.documentElement.scrollWidth - innerWidth,
      menuOpenLeft: Math.round(menuO.left), menuRight: Math.round(menuO.right),
      docH: document.documentElement.scrollHeight,
    };
  });
  // 展开时打开音量菜单，检查是否被裁
  await p.click('#island-volume-button', { force: true }).catch(() => {});
  await p.waitForTimeout(400);
  const menu = await p.evaluate(() => {
    const r = document.querySelector('#island-volume-menu').getBoundingClientRect();
    return { l: Math.round(r.left), r: Math.round(r.right), t: Math.round(r.top), op: getComputedStyle(document.querySelector('#island-volume-menu')).opacity, w: Math.round(r.width) };
  });
  out[label] = { ...m, menu, menuClipped: menu.l < 0 || menu.r > w, errs };
  await p.close();
}
console.log(JSON.stringify(out, null, 1));
await b.close();