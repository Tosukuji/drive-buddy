// なかよし度がキャラごとか、休憩で名物を話すか、入口までの距離を知らせるかの確認
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('playwright');
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 400, height: 860 }, locale: 'ja-JP', timezoneId: 'America/New_York', permissions: ['geolocation'], geolocation: { latitude: 35.45, longitude: 139.5, accuracy: 10 } });
await ctx.addInitScript(() => {
  if (sessionStorage.getItem('s')) return; sessionStorage.setItem('s', '1');
  const now = Date.now(), day = 86400000;
  localStorage.setItem('drive-buddy-state-v1', JSON.stringify({ v: 3, settings: { lang: 'ja', onboarded: true, greetOn: false, persona: 'ottori', weatherOn: false }, drives: [
    { id: 'old1', start: new Date(now - 2 * day).toISOString(), min: 60, km: 40, breaks: 0, checked: true },
    { id: 'old2', start: new Date(now - day).toISOString(), min: 30, km: 20, breaks: 0, checked: true },
  ], gifts: [{ id: 'g-coffee', p: 'sora', d: 8, at: new Date().toISOString() }] }));
});
const page = await ctx.newPage();
const errs = []; page.on('pageerror', (e) => errs.push(e.message));
const lines = []; 
await page.route('https://fonts.**', (r) => r.abort());
await page.route('https://nominatim.openstreetmap.org/**', (r) => r.fulfill({ json: { address: { city: '海老名市', province: '神奈川県', 'ISO3166-2-lvl4': 'JP-14' } } }));
await page.route('https://overpass-api.de/**', (r) => r.fulfill({ json: { elements: [{ type: 'way', id: 1, center: { lat: 35.4495, lon: 139.42 }, tags: { highway: 'services', name: '海老名サービスエリア(下り)' } }] } }));
await page.goto('http://127.0.0.1:8766/?debug');
await page.waitForFunction(() => document.querySelector('#loading').hidden && window.__dbg && __dbg.Char.vrm, null, { timeout: 90000 });
await page.exposeFunction('logLine', (t) => lines.push(t));
await page.evaluate(() => { const o = __dbg.say; new MutationObserver(() => { const t = document.querySelector('#line-sr').textContent; if (t) window.logLine(t); }).observe(document.querySelector('#line-sr'), { childList: true, characterData: true, subtree: true }); });
console.log('キャラ別なかよし度:', JSON.stringify(await page.evaluate(() => Object.fromEntries(['kohai', 'onee', 'genki', 'ottori', 'sora'].map((id) => [id, __dbg.bondPts(id)])))), '| 画面の表示(ユズ):', await page.$eval('#chip-lv', (e) => e.textContent), await page.$eval('#aff-next', (e) => e.textContent));
await page.evaluate(() => __dbg.setPersona('sora')); await page.waitForTimeout(800);
console.log('ソラに切り替え後の表示:', await page.$eval('#chip-lv', (e) => e.textContent), await page.$eval('#aff-next', (e) => e.textContent));
// デモ:海老名SAに寄る
lines.length = 0;
await page.click('#go-demo'); await page.waitForTimeout(400);
await page.evaluate(() => { __dbg.drive.sim = 25.5 * 60; });
await page.waitForFunction(() => !document.querySelector('#stop-card').hidden, null, { timeout: 20000 });
await page.waitForTimeout(1500);
await page.click('#stop-yes');
await page.waitForFunction(() => __dbg.drive && __dbg.drive.rest, null, { timeout: 60000 });
await page.waitForTimeout(7000);
console.log('デモで話した順:\n  ' + [...new Set(lines)].join('\n  '));
await page.dispatchEvent('#arrive-btn', 'click', { detail: 0 }); await page.waitForTimeout(500);
await page.click('#save-drive'); await page.waitForTimeout(500);
// 実際の運転:手動で休憩 → 県の名物
lines.length = 0;
await page.click('#go-check'); await page.click('#depart-skip'); await page.waitForTimeout(1500);
await page.click('#break-btn');
await page.waitForTimeout(6000);
console.log('実際の運転で休憩:\n  ' + [...new Set(lines)].join('\n  '));
await page.screenshot({ path: 'shots/rest-local.png' });
await page.click('#open-persona'); await page.waitForTimeout(300);
await page.screenshot({ path: 'shots/persona-levels.png' });
console.log(errs.join('\n') || 'エラーなし');
await browser.close();
