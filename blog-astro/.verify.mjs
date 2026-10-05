
import { chromium } from 'playwright-core';
const exe = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await chromium.launch({ executablePath: exe, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
await page.goto(process.argv[2] || 'http://localhost:4321/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);

const report = await page.evaluate(async () => {
  await document.fonts.ready;
  const cs = (el, p) => el ? getComputedStyle(el).getPropertyValue(p).trim() : null;
  const q = (s) => document.querySelector(s);
  const sections = [...document.querySelectorAll('section[id], .marquee')].map(s => s.id || 'marquee');
  return {
    theme: document.documentElement.dataset.theme,
    fonts: [...document.fonts].map(f => f.family + ' ' + f.weight + ' ' + f.status).slice(0, 20),
    bodyFont: cs(document.body, 'font-family'),
    bodySize: cs(document.body, 'font-size'),
    bodyLH: cs(document.body, 'line-height'),
    h1Font: cs(q('.display'), 'font-family'),
    h1Size: cs(q('.display'), 'font-size'),
    accent: cs(document.documentElement, '--accent'),
    bg: cs(document.body, 'background-color'),
    textColor: cs(document.body, 'color'),
    sections,
    sectionCount: sections.length,
    counts: {
      reveal: document.querySelectorAll('[data-reveal]').length,
      revealIn: document.querySelectorAll('[data-reveal].is-in').length,
      spotlight: document.querySelectorAll('[data-spot]').length,
      works: document.querySelectorAll('.work').length,
      posts: document.querySelectorAll('.post').length,
      notes: document.querySelectorAll('.note').length,
      socials: document.querySelectorAll('.social').length,
      marqueeSpans: document.querySelectorAll('.marquee span').length,
    },
    openBadge: cs(q('.nav__link'), 'min-height'),
    btnMinH: cs(q('.btn'), 'min-height'),
    touchTargetsBelow44: [...document.querySelectorAll('a, button')]
      .filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && (r.height < 44 || r.width < 24); })
      .map(el => (el.textContent || el.className).trim().slice(0, 40)),
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    docHeight: document.body.scrollHeight,
    pageBg: cs(q('.hero'), 'background-color'),
  };
});

// 深色
await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
await page.waitForTimeout(400);
const dark = await page.evaluate(() => {
  const cs = (el, p) => getComputedStyle(el).getPropertyValue(p).trim();
  return { bg: cs(document.body, 'background-color'), text: cs(document.body, 'color'), accent: cs(document.documentElement, '--accent') };
});

// 移动端溢出
const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
await m.goto(process.argv[2] || 'http://localhost:4321/', { waitUntil: 'networkidle' });
await m.waitForTimeout(800);
const mob = await m.evaluate(() => {
  const wide = [...document.querySelectorAll('*')]
    .filter(el => el.getBoundingClientRect().right > window.innerWidth + 1)
    .map(el => el.tagName + '.' + String(el.className).slice(0, 50)).slice(0, 10);
  return { overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, wide };
});

console.log(JSON.stringify({ report, dark, mob, errs }, null, 2));
await browser.close();
