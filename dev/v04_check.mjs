// v0.3 追加分の確認:記念日のあいさつ、記念写真、実績、今週のまとめ、なめらか運転
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('playwright');
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 400, height: 860 }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', colorScheme: 'light', acceptDownloads: true });
await ctx.addInitScript(() => {
  const day = 86400000, now = Date.now();
  const drives = [
    { id: 'a1', start: new Date(now - 2 * day).toISOString(), min: 95, km: 80.2, breaks: 1, checked: true },
    { id: 'a2', start: new Date(now - 9 * day).toISOString(), min: 40, km: 22, breaks: 0, checked: true },
    { id: 'a3', start: new Date(now - 31 * day).toISOString(), min: 30, km: 15, breaks: 0, checked: false },
  ];
  if (!sessionStorage.getItem('seeded')) {
    localStorage.setItem('drive-buddy-state-v1', JSON.stringify({ v: 3, settings: { lang: 'ja', onboarded: true, persona: 'genki' }, drives }));
    sessionStorage.setItem('seeded', '1');
  }
});
const page = await ctx.newPage();
const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('TUNNEL')) errs.push(m.text()); });
await page.route('https://fonts.**', (r) => r.abort());
await page.goto('http://127.0.0.1:8766/?debug');
await page.waitForFunction(() => document.querySelector('#loading').hidden && window.__dbg && __dbg.Char.vrm, null, { timeout: 90000 });
await page.waitForTimeout(800);
console.log('起動時のあいさつ:', await page.$eval('#line', (e) => e.textContent), '| 記録済みの記念日:', JSON.stringify(await page.evaluate(() => __dbg.S().annivSaid)));
console.log('起動時に記録された実績:', Object.keys(await page.evaluate(() => __dbg.Store.state.medals)).join(', '));
// 記念写真
await page.click('#photo-btn');
await page.waitForFunction(() => !document.querySelector('#sheet-photo').hidden, null, { timeout: 30000 });
await page.waitForTimeout(800);
await page.screenshot({ path: 'shots/v04-photo-sheet.png' });
const imgUrl = await page.$eval('#photo-img', (e) => e.src);
const b64 = await page.evaluate(async (u) => { const b = await (await fetch(u)).blob(); return await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b); }); }, imgUrl);
(await import('fs')).writeFileSync('shots/v04-photo.jpg', Buffer.from(b64.split(',')[1], 'base64'));
await page.click('#sheet-photo [data-close]');
// 記録(今週のまとめ)
await page.click('#open-history'); await page.waitForTimeout(400);
console.log('今週のまとめ:', await page.$eval('#week-sum', (e) => e.textContent));
await page.click('#sheet-history [data-close]');
// なめらか運転:オンにして実走行(デモでない)→ 急な動きを1回発生させる
await page.evaluate(() => { __dbg.S().safetyOn = true; });
await page.click('#go-check'); await page.click('#depart-skip'); await page.waitForTimeout(500);
console.log('なめらか計測中:', await page.evaluate(() => __dbg.Safety.on), '| 小窓ボタン表示:', await page.$eval('#pip-btn', (e) => !e.hidden));
await page.evaluate(async () => {
  for (let i = 0; i < 50; i++) { dispatchEvent(new DeviceMotionEvent('devicemotion', { acceleration: { x: 4.2, y: 0.5, z: 0.3 }, interval: 16 })); }
  for (let i = 0; i < 50; i++) { dispatchEvent(new DeviceMotionEvent('devicemotion', { acceleration: { x: 0.2, y: 0.1, z: 0.6 }, interval: 16 })); }
});
console.log('数えた急な操作:', await page.evaluate(() => __dbg.Safety.count));
await page.evaluate(() => { __dbg.drive.sim = 25 * 60; });
await page.dispatchEvent('#arrive-btn', 'click', { detail: 0 }); await page.waitForTimeout(800);
await page.screenshot({ path: 'shots/v04-arrive.png' });
console.log('到着画面の急な操作:', await page.$eval('#sum-harsh', (e) => e.textContent), '| 表示:', await page.$eval('#sum-harsh-box', (e) => !e.hidden));
await page.click('#save-drive'); await page.waitForTimeout(800);
// 実績タブ
await page.click('#open-coll'); await page.click('[data-tab="medals"]'); await page.waitForTimeout(400);
await page.screenshot({ path: 'shots/v04-medals.png' });
console.log(errs.join('\n') || 'エラーなし');
await browser.close();
