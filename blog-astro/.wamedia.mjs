import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage();
await p.goto('http://localhost:4321/', { waitUntil: 'load' });
const r = await p.evaluate(async () => {
  const audio = new Audio('/media/cai-shi.opus');
  audio.preload = 'auto';
  audio.volume = 0.7;
  document.body.appendChild(audio);
  const ctx = new AudioContext();
  const an = ctx.createAnalyser();
  an.fftSize = 512; an.smoothingTimeConstant = 0.68;
  const src = ctx.createMediaElementSource(audio);
  src.connect(an); an.connect(ctx.destination);
  await audio.play();
  await new Promise(r => setTimeout(r, 2500));
  const d = new Uint8Array(an.frequencyBinCount);
  let max = 0;
  for (let k = 0; k < 20; k++) { an.getByteFrequencyData(d); max = Math.max(max, Math.max(...d)); await new Promise(r => setTimeout(r, 40)); }
  // 同时用 ScriptProcessor 之外的第二种手段：MediaStreamDestination? 直接看 volume/currentTime
  return { max, ctxState: ctx.state, t: +audio.currentTime.toFixed(2), paused: audio.paused, sr: ctx.sampleRate, readyState: audio.readyState };
});
console.log(JSON.stringify(r));
// 对照：不走 WebAudio，看元素本身是否真的在解码
const r2 = await p.evaluate(async () => {
  const a = new Audio('/media/cai-shi.opus'); a.volume = 0.5; document.body.appendChild(a);
  await a.play(); await new Promise(r => setTimeout(r, 1200));
  return { t: +a.currentTime.toFixed(2), paused: a.paused, d: Math.round(a.duration) };
});
console.log('plain element:', JSON.stringify(r2));
await b.close();