import { chromium } from 'playwright-core';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL_ = 'http://localhost:4321/';
const b = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });

const open = async (p) => {
  await p.waitForFunction(() => document.querySelector('#site-island')?.dataset.bound === '1', null, { timeout: 15000 });
  await p.dispatchEvent('#site-island', 'pointerenter');
  await p.waitForTimeout(1200);
};
const mk = async (name, action, theme = 'dark', vw = 1600, vh = 900) => {
  const p = await b.newPage({ viewport: { width: vw, height: vh }, deviceScaleFactor: 2 });
  await p.addInitScript(t => { try { localStorage.setItem('blog-theme', t); } catch {} }, theme);
  await p.goto(URL_, { waitUntil: 'load' });
  await p.waitForTimeout(600);
  await open(p);
  await action(p);
  await p.screenshot({ path: 'shots/' + name, clip: { x: Math.max(0, vw / 2 - 320), y: 0, width: Math.min(vw, 640), height: 330 } });
  await p.close();
};

const play = async (p) => { await p.click('#island-player-toggle', { force: true }); await p.waitForTimeout(1500); };

// 1. 采石播放中（歌词区）
await mk('pl-01-cai-shi.png', async p => { await play(p); await p.evaluate(() => { document.querySelector('#site-island-audio').currentTime = 90; }); await p.waitForTimeout(800); });
// 2. 采石开头——无歌词时显示曲名
await mk('pl-02-cai-shi-intro.png', async p => { await play(p); await p.waitForTimeout(400); });
// 3. 切到 Don't Call
await mk('pl-03-dont-call.png', async p => { await play(p); await p.click('#island-player-next', { force: true }); await p.waitForTimeout(1800); }, 'dark');
// 4. Don't Call 歌词处
await mk('pl-04-dont-call-lyric.png', async p => { await play(p); await p.click('#island-player-next', { force: true }); await p.waitForTimeout(1500); await p.evaluate(() => { document.querySelector('#site-island-audio').currentTime = 17; }); await p.waitForTimeout(800); }, 'dark');
// 5. 亮色主题下的 Don't Call
await mk('pl-05-dont-call-light.png', async p => { await play(p); await p.click('#island-player-next', { force: true }); await p.waitForTimeout(1800); }, 'light');
// 6. 移动端 390
await mk('pl-06-mobile-dont-call.png', async p => { await play(p); await p.click('#island-player-next', { force: true }); await p.waitForTimeout(1800); }, 'dark', 390, 844);

console.log('done');
await b.close();