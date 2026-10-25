// 昼間の時間帯で、記念日(30日)のあいさつと記念写真を確認
import { createRequire } from 'module';
import fs from 'fs';
const { chromium } = createRequire(import.meta.url)('playwright');
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 400, height: 860 }, locale: 'ja-JP', timezoneId: 'America/New_York', colorScheme: 'light' });
await ctx.addInitScript(() => {
  if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
  const day = 86400000, now = Date.now();
  localStorage.setItem('drive-buddy-state-v1', JSON.stringify({ v: 3, settings: { lang: 'ja', onboarded: true, persona: 'ottori' }, drives: [{ id: 'a3', start: new Date(now - 31 * day).toISOString(), min: 30, km: 15, breaks: 0, checked: false }] }));
});
const page = await ctx.newPage();
const errs = []; page.on('pageerror', (e) => errs.push(e.message));
await page.route('https://fonts.**', (r) => r.abort());
await page.goto('http://127.0.0.1:8766/?debug');
await page.waitForFunction(() => document.querySelector('#loading').hidden && window.__dbg && __dbg.Char.vrm, null, { timeout: 90000 });
await page.waitForTimeout(2500);
console.log('時間帯:', await page.evaluate(() => document.querySelector('#stage').dataset.tod), '| あいさつ:', await page.evaluate(() => document.querySelector('#line-sr').textContent), '| 記録:', JSON.stringify(await page.evaluate(() => __dbg.S().annivSaid)));
await page.click('#photo-btn');
await page.waitForFunction(() => !document.querySelector('#sheet-photo').hidden, null, { timeout: 30000 });
await page.waitForTimeout(600);
await page.screenshot({ path: 'shots/v04-photo-sheet.png' });
const u = await page.$eval('#photo-img', (e) => e.src);
const b64 = await page.evaluate(async (u) => { const b = await (await fetch(u)).blob(); return await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b); }); }, u);
fs.writeFileSync('shots/v04-photo.jpg', Buffer.from(b64.split(',')[1], 'base64'));
console.log(errs.join('\n') || 'エラーなし');
await browser.close();
