import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage();
await p.setContent('<html><body></body></html>');
const r = await p.evaluate(async () => {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const an = ctx.createAnalyser();
  an.fftSize = 512;
  const g = ctx.createGain(); g.gain.value = 0.5;
  osc.connect(g); g.connect(an); an.connect(ctx.destination);
  osc.start();
  await new Promise(r => setTimeout(r, 800));
  const d = new Uint8Array(an.frequencyBinCount);
  let max = 0;
  for (let k = 0; k < 20; k++) { an.getByteFrequencyData(d); max = Math.max(max, Math.max(...d)); await new Promise(r => setTimeout(r, 50)); }
  const ctx2 = ctx.state;
  // also try an audio element source
  return { oscMax: max, state: ctx2, sampleRate: ctx.sampleRate };
});
console.log(JSON.stringify(r));
await b.close();