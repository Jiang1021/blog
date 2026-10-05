
import { chromium } from 'playwright-core';
const exe = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const b = await chromium.launch({ executablePath: exe, headless: true });

async function audit(w, h, theme) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  const errs = [];
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
  await p.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
  await p.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
  await p.waitForTimeout(800);
  const res = await p.evaluate(() => {
    const small = [];
    document.querySelectorAll('a, button').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return;
      if (r.height < 44 || r.width < 24) small.push({ t: (el.textContent || '').trim().slice(0, 24), w: Math.round(r.width), h: Math.round(r.height) });
    });
    const overflowX = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    const cs = getComputedStyle(document.body);
    return { small, overflowX, bg: cs.backgroundColor, fg: cs.color, docH: document.documentElement.scrollHeight };
  });
  await p.close();
  return { w, h, theme, ...res, errs };
}

const out = [];
out.push(await audit(1440, 900, 'light'));
out.push(await audit(1440, 900, 'dark'));
out.push(await audit(390, 844, 'light'));
out.push(await audit(390, 844, 'dark'));
console.log(JSON.stringify(out, null, 1));
await b.close();
