import { chromium } from 'playwright-core';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const b = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
p.on('pageerror', e => errs.push('pageerror: ' + e.message));
p.on('response', r => { if (r.status() >= 400) errs.push('HTTP ' + r.status() + ' ' + r.url()); });
await p.goto('http://localhost:4321/', { waitUntil: 'load' });
await p.waitForFunction(() => document.querySelector('#site-island')?.dataset.bound === '1', null, { timeout: 15000 }).catch(() => {});
await p.dispatchEvent('#site-island', 'pointerenter');
await p.waitForTimeout(1200);

const read = () => p.evaluate(() => {
  const a = document.querySelector('#site-island-audio');
  return {
    title: document.querySelector('#island-player-lyric').textContent.trim(),
    artistSmall: document.querySelector('.island-player-copy > span:not(.island-player-status)').textContent.trim(),
    summaryTitle: document.querySelector('.island-track-title')?.textContent.trim(),
    summaryArtist: document.querySelector('.island-track-artist')?.textContent.trim(),
    songTitle: document.querySelector('#site-island').dataset.songTitle,
    art: document.querySelector('.island-player-art').getAttribute('src'),
    smallArt: document.querySelector('.island-mini-art').getAttribute('src'),
    fav: document.querySelector('#island-player-favorite')?.getAttribute('href'),
    t: +a.currentTime.toFixed(2), paused: a.paused, src: a.currentSrc.split('/').pop(), dur: Math.round(a.duration || 0),
    remain: document.querySelector('#island-player-duration').textContent,
    scrubMax: document.querySelector('#island-player-scrubber').max,
    state: document.querySelector('#site-island').dataset.playerState,
  };
});

const out = {};
out.t0_initial_noPlay = await read();

// 播放第一首
await p.click('#island-player-toggle', { force: true });
await p.waitForTimeout(1500);
out.t1_playingTrack1 = await read();
await p.evaluate(() => { document.querySelector('#site-island-audio').currentTime = 90; });
await p.waitForTimeout(800);
out.t2_track1_lyricAt90s = await read();

// 点「下一首」
await p.click('#island-player-next', { force: true });
await p.waitForTimeout(1800);
out.t3_afterNext = await read();
await p.evaluate(() => { document.querySelector('#site-island-audio').currentTime = 15; });
await p.waitForTimeout(700);
out.t4_track2_lyricAt15s = await read();

// 点「上一首」
await p.click('#island-player-previous', { force: true });
await p.waitForTimeout(1600);
out.t5_afterPrev = await read();

// 第二首从 0 播放时应该显示曲名，不是占位文案
await p.click('#island-player-next', { force: true });
await p.waitForTimeout(900);
out.t6_track2_atStart = await read();

out.errors = errs;
console.log(JSON.stringify(out, null, 1));
await b.close();