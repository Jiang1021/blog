
import { chromium } from 'playwright-core';
const exe = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await chromium.launch({ executablePath: exe, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
await page.evaluate(() => document.querySelectorAll('[data-reveal]').forEach(e => e.classList.add('is-in')));
await page.waitForTimeout(800);

const geo = await page.evaluate(() => {
  const box = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y + scrollY), w: Math.round(r.width), h: Math.round(r.height), fs: getComputedStyle(el).fontSize };
  };
  const sels = ['.nav', '.hero', '.hero__title', '.hero__name', '.hero__cn', '.lede', '.hero__actions', '.hero__side', '.term', '.hero__stats', '.scroll-cue', '.marquee', '#work', '.bento', '.work', '.work--wide', '#posts', '.post', '#notes', '.note', '.presence', '#about', '.about__facts', '#contact', '.mailbox', '.footer'];
  const out = {};
  sels.forEach(s => out[s] = box(s));
  // 相邻 section 间距
  const secs = [...document.querySelectorAll('section')].map(s => {
    const r = s.getBoundingClientRect();
    return { id: s.id, top: Math.round(r.top + scrollY), bottom: Math.round(r.bottom + scrollY), h: Math.round(r.height) };
  });
  // 首屏元素垂直分布
  const heroKids = [...document.querySelectorAll('.hero__inner > *, .hero__inner > .hero__grid > *')].map(el => {
    const r = el.getBoundingClientRect();
    return { cls: String(el.className).slice(0, 30), top: Math.round(r.top), h: Math.round(r.height) };
  });
  return { boxes: out, secs, heroKids, vh: innerHeight };
});
console.log(JSON.stringify(geo, null, 1));
await browser.close();
