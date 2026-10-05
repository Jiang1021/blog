import { chromium } from 'playwright-core';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const b = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
p.on('pageerror', e => errs.push('pageerror: ' + e.message));
p.on('response', r => { if (r.status() >= 400) errs.push('HTTP ' + r.status() + ' ' + r.url()); });
await p.goto('http://localhost:4321/', { waitUntil: 'load' });
await p.waitForFunction(() => document.querySelector('#site-island')?.dataset.bound === '1', null, { timeout: 15000 });
await p.dispatchEvent('#site-island', 'pointerenter');
await p.waitForTimeout(1300);

const read = () => p.evaluate(() => {
  const isl = document.querySelector('#site-island');
  const a = document.querySelector('#site-island-audio');
  const r = isl.getBoundingClientRect();
  return {
    island: Math.round(r.width) + 'x' + Math.round(r.height),
    lyric: document.querySelector('#island-player-lyric').textContent.trim(),
    small: document.querySelector('.island-player-copy > span:not(.island-player-status)').textContent.trim(),
    cardTitle: document.querySelector('.island-track-title').textContent.trim(),
    cardArtist: document.querySelector('.island-track-artist').textContent.trim(),
    songId: isl.dataset.songId,
    src: (a.currentSrc || '').split('/').pop(),
    dur: Math.round(a.duration || 0), t: +a.currentTime.toFixed(1), paused: a.paused,
    remain: document.querySelector('#island-player-duration').textContent,
    art: document.querySelector('.island-player-art').getAttribute('src').split('/').pop(),
    fav: document.querySelector('#island-player-favorite').getAttribute('href').slice(0, 48),
    playing: isl.dataset.playerState,
  };
});

const out = {};
out.A_initial = await read();

// 播放第一首，跳到 90s 看歌词
await p.click('#island-player-toggle', { force: true });
await p.waitForTimeout(1300);
out.B_track1_playing = await read();
await p.evaluate(() => { document.querySelector('#site-island-audio').currentTime = 90; });
await p.waitForTimeout(700);
out.C_track1_lyricAt90s = await read();

// 切到第二首
await p.click('#island-player-next', { force: true });
await p.waitForTimeout(1600);
out.D_track2_afterNext = await read();
await p.evaluate(() => { document.querySelector('#site-island-audio').currentTime = 15; });
await p.waitForTimeout(700);
out.E_track2_lyricAt15s = await read();

// 第二首开头（无歌词区）应显示曲名
await p.click('#island-player-previous', { force: true });
await p.waitForTimeout(900);
await p.click('#island-player-next', { force: true });
await p.waitForTimeout(600);
out.F_track2_at0s = await read();

// 自动续播：把第二首拖到快结束，看是否自动接回第一首
await p.evaluate(() => { const a = document.querySelector('#site-island-audio'); a.currentTime = a.duration - 0.6; });
await p.waitForTimeout(3500);
out.G_autoNextAfterEnd = await read();

out.errors = errs;
console.log(JSON.stringify(out, null, 1));
await b.close();