import { chromium } from 'playwright-core';
const URL = 'http://192.168.31.149/';
const browser = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', args: ['--autoplay-policy=no-user-gesture-required', '--no-sandbox'] });

const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await page.goto(URL, { waitUntil: 'load' });
await page.locator('#site-island').hover();
await page.waitForTimeout(1800);
for (let i = 0; i < 3; i++) {
  if (await page.evaluate(() => document.querySelector('.dynamic-island')?.dataset.open === 'true')) break;
  await page.mouse.move(10, 760); await page.waitForTimeout(250);
  await page.click('#site-island-toggle', { force: true }); await page.waitForTimeout(700);
}
await page.click('#island-player-toggle', { force: true });
await page.waitForTimeout(6000);
await page.mouse.move(10, 760);
await page.waitForTimeout(800);
await page.screenshot({ path: 'D:\\WorkSpace\\blog\\shots\\deploy-desktop.png' });

const page2 = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
await page2.goto(URL, { waitUntil: 'load' });
await page2.waitForTimeout(1500);
await page2.locator('#site-island').tap().catch(() => {});
await page2.waitForTimeout(1200);
await page2.screenshot({ path: 'D:\\WorkSpace\\blog\\shots\\deploy-mobile-open.png' });
console.log('shots done');
await browser.close();
