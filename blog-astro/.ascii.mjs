
import { chromium } from 'playwright-core';
const exe = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await chromium.launch({ executablePath: exe, headless: true });
const an = await browser.newPage();
await an.setContent('<html><body></body></html>');

async function art(o) {
  const p = await browser.newPage({ viewport: { width: o.w, height: o.h } });
  await p.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
  await p.evaluate((t) => { document.documentElement.dataset.theme = t; }, o.theme || 'light');
  await p.evaluate(() => document.querySelectorAll('[data-reveal]').forEach(e => e.classList.add('is-in')));
  if (o.y) await p.evaluate((y) => window.scrollTo(0, y), o.y);
  await p.waitForTimeout(1500);
  const buf = await p.screenshot({ clip: o.clip });
  const b64 = buf.toString('base64');
  const lum = await an.evaluate(async ({ b64, cols, rows }) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = cols; c.height = rows;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0, cols, rows);
    const d = x.getImageData(0, 0, cols, rows).data; const out = [];
    for (let i = 0; i < d.length; i += 4) out.push(Math.round((0.2126*d[i] + 0.7152*d[i+1] + 0.0722*d[i+2]) / 255 * 9));
    return out;
  }, { b64, cols: o.cols, rows: o.rows });
  await p.close();
  // invert: dark = dense
  const chars = '@%#*+=-:. ';
  let s = '';
  for (let y = 0; y < o.rows; y++) {
    let line = '';
    for (let xx = 0; xx < o.cols; xx++) line += chars[9 - lum[y * o.cols + xx]];
    s += line + '\n';
  }
  return s;
}

console.log('##### HERO LIGHT (1440x860) #####');
console.log(await art({ w: 1440, h: 860, cols: 124, rows: 38 }));
console.log('##### WORK AREA LIGHT (1440x860 @ y=1180) #####');
console.log(await art({ w: 1440, h: 860, cols: 124, rows: 38, y: 1180 }));
console.log('##### CONTACT+FOOTER LIGHT (1440x820 @ y=4560) #####');
console.log(await art({ w: 1440, h: 820, cols: 124, rows: 34, y: 4560 }));
await browser.close();
