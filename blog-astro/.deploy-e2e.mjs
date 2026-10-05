import { chromium } from 'playwright-core';

const URL = process.argv[2] || 'http://192.168.31.149/';
const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--autoplay-policy=no-user-gesture-required', '--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
const requests = [];
page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE ' + m.text()); });
page.on('requestfailed', r => errors.push('REQFAIL ' + r.url() + ' :: ' + (r.failure() && r.failure().errorText)));
page.on('response', r => requests.push(r.status() + ' ' + r.url()));

const resp = await page.goto(URL, { waitUntil: 'load', timeout: 30000 });
console.log('STATUS', resp.status(), '| TITLE', await page.title());
console.log('ISLAND-COUNT', await page.locator('#site-island').count());

const isOpen = () => page.evaluate(() => document.querySelector('.dynamic-island')?.dataset.open === 'true');
const setOpen = async (want) => {
  for (let i = 0; i < 4; i++) {
    if ((await isOpen()) === want) return true;
    await page.mouse.move(10, 700);
    await page.waitForTimeout(300);
    try { await page.click('#site-island-toggle', { timeout: 3000, force: true }); } catch (e) { }
    await page.waitForTimeout(700);
  }
  return (await isOpen()) === want;
};

// 1. 懒加载触发
await page.locator('#site-island').hover();
await page.waitForTimeout(2000);
console.log('BOUND', await page.evaluate(() => document.getElementById('site-island')?.dataset.bound));
console.log('PLAYER-SCRIPT', await page.evaluate(() => !!document.querySelector('script[data-islandPlayer], #site-island-audio')));
console.log('OPEN-AFTER-HOVER', await isOpen());

// 2. 展开
console.log('SET-OPEN', await setOpen(true));
await page.mouse.move(10, 700); await page.waitForTimeout(600);
const geo = await page.evaluate(() => {
  const el = document.querySelector('.dynamic-island'); const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
  return { open: el.dataset.open, w: Math.round(r.width), h: Math.round(r.height), radius: cs.borderRadius, bg: cs.backgroundColor, playlistLen: JSON.parse(el.dataset.playerPlaylist || '[]').length };
});
console.log('GEO', JSON.stringify(geo));

// 3. 播放
await page.click('#island-player-toggle', { force: true });
await page.waitForTimeout(3000);
const snap = () => page.evaluate(() => {
  const a = document.getElementById('site-island-audio');
  return { paused: a.paused, t: +a.currentTime.toFixed(1), dur: Math.round(a.duration || 0), vol: a.volume,
           src: (a.currentSrc || '').split('/').pop(),
           title: document.querySelector('.island-track-title')?.textContent?.trim(),
           artist: document.querySelector('.island-track-artist')?.textContent?.trim(),
           lyric: document.getElementById('island-player-lyric')?.textContent?.trim(),
           status: document.querySelector('.island-player-status')?.textContent?.trim(),
           cover: (document.querySelector('.island-player-art img')?.getAttribute('src') || '').split('/').pop() };
});
console.log('TRACK1', JSON.stringify(await snap()));

// 4. 切歌
await page.click('#island-player-next', { force: true });
await page.waitForTimeout(3500);
console.log('TRACK2', JSON.stringify(await snap()));

// 5. 上一首
await page.click('#island-player-previous', { force: true });
await page.waitForTimeout(2000);
console.log('TRACK1-AGAIN', JSON.stringify(await snap()));

// 6. 歌词推进
await page.waitForTimeout(8000);
console.log('LYRIC-LATER', JSON.stringify(await snap()));

// 7. 折叠
console.log('SET-CLOSED', await setOpen(false));
await page.mouse.move(10, 700); await page.waitForTimeout(600);
console.log('GEO-COLLAPSED', JSON.stringify(await page.evaluate(() => { const el = document.querySelector('.dynamic-island'); const r = el.getBoundingClientRect(); return { open: el.dataset.open, w: Math.round(r.width), h: Math.round(r.height) }; })));

// 8. 移动端
const page2 = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await page2.goto(URL, { waitUntil: 'load', timeout: 30000 });
await page2.waitForTimeout(2500);
console.log('MOBILE', JSON.stringify(await page2.evaluate(() => {
  const el = document.querySelector('.dynamic-island'); const r = el.getBoundingClientRect();
  return { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top), scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth };
})));

const bad = requests.filter(r => !/ (200|206|304|301|302)$/.test(r));
console.log('BAD-RESPONSES', JSON.stringify(bad));
console.log('ERRORS', JSON.stringify(errors.slice(0, 15)));

await page.screenshot({ path: 'D:\\WorkSpace\\blog\\shots\\deploy-island-open.png' });
await page2.screenshot({ path: 'D:\\WorkSpace\\blog\\shots\\deploy-mobile.png' });
await browser.close();
