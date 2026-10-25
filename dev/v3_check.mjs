import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('playwright');
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 400, height: 860 }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
const page = await ctx.newPage();
const logs = [];
page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
await page.route('https://fonts.**', (r) => r.abort());
// model fails twice, then works
let modelHits = 0;
await page.route('**/models/michi.vrm', (r) => { modelHits++; if (modelHits <= 2) r.fulfill({ status: 503, body: 'busy' }); else r.continue(); });
await page.goto('http://127.0.0.1:8766/');
await page.waitForFunction(() => document.querySelector('#loading').hidden, null, { timeout: 60000 });
console.log('model attempts:', modelHits, '| fallback shown:', await page.isVisible('#fallback'));
// night check
await page.click('#go-check');
console.log('light check visible at night:', await page.isVisible('#check-light'));
for (const k of ['belt', 'mirror', 'light', 'route']) await page.click(`.check[data-k="${k}"]`);
console.log('depart enabled:', await page.isEnabled('#depart'));
await page.screenshot({ path: 'shots/v3-check-night.png', clip: { x: 0, y: 380, width: 400, height: 480 } });
await page.click('#check-back');
// three quick drives
for (let i = 0; i < 3; i++) {
  await page.click('#go-check'); await page.click('#depart-skip'); await page.waitForTimeout(300);
  await page.focus('#arrive-btn'); await page.keyboard.press('Enter'); await page.waitForTimeout(300);
  await page.click('#save-drive'); await page.waitForTimeout(300);
}
const bond = async () => page.textContent('#aff-next');
console.log('after 3 drives:', await bond());
await page.click('#open-history');
await page.click('#sel-start');
const boxes = await page.$$('#hist-list .sel');
await boxes[0].check(); await boxes[1].check();
await page.screenshot({ path: 'shots/v3-select.png', clip: { x: 0, y: 0, width: 400, height: 520 } });
await page.click('#sel-delete');
await page.screenshot({ path: 'shots/v3-confirm.png', clip: { x: 0, y: 0, width: 400, height: 300 } });
await page.click('#sel-yes');
console.log('rows left:', (await page.$$('#hist-list li')).length);
await page.click('#sheet-history [data-close]');
console.log('after deleting 2:', await bond());
console.log(logs.join('\n') || 'no page errors');
// full failure shows retry
const p2 = await ctx.newPage();
await p2.route('https://fonts.**', (r) => r.abort());
await p2.route('**/models/michi.vrm', (r) => r.fulfill({ status: 404, body: 'nope' }));
await p2.goto('http://127.0.0.1:8766/');
await p2.waitForFunction(() => !document.querySelector('#model-retry').hidden, null, { timeout: 60000 });
await p2.screenshot({ path: 'shots/v3-retry.png', clip: { x: 0, y: 60, width: 400, height: 470 } });
console.log('retry button shown');
await browser.close();
