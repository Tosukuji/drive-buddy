// 実際の運転での前方SA案内の確認(位置情報と地図データは見本)
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('playwright');
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 400, height: 860 }, locale: 'ja-JP', timezoneId: 'America/New_York', permissions: ['geolocation'], geolocation: { latitude: 35.45, longitude: 139.50, accuracy: 10 } });
await ctx.addInitScript(() => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', '1'); localStorage.setItem('drive-buddy-state-v1', JSON.stringify({ v: 3, settings: { lang: 'ja', onboarded: true, persona: 'onee', greetOn: false, breakMin: 60 }, drives: [] })); } });
const page = await ctx.newPage();
const errs = []; page.on('pageerror', (e) => errs.push(e.message));
let overpassCalls = 0;
await page.route('https://fonts.**', (r) => r.abort());
await page.route('https://overpass-api.de/**', (r) => { overpassCalls++; r.fulfill({ json: { elements: [
  { type: 'way', id: 1, center: { lat: 35.4495, lon: 139.42 }, tags: { highway: 'services', name: '海老名サービスエリア(下り)', opening_hours: '24/7' } },
  { type: 'way', id: 2, center: { lat: 35.4505, lon: 139.42 }, tags: { highway: 'services', name: '海老名サービスエリア(上り)' } },
  { type: 'node', id: 3, lat: 35.4498, lon: 139.46, tags: { highway: 'rest_area', name: 'テストPA' } },
  { type: 'node', id: 4, lat: 35.48, lon: 139.60, tags: { highway: 'rest_area', name: '道の駅 うしろ' } },
] } }); });
await page.route('https://nominatim.openstreetmap.org/**', (r) => r.fulfill({ json: { address: { city: '海老名市', province: '神奈川県', 'ISO3166-2-lvl4': 'JP-14' } } }));
await page.route('https://api.open-meteo.com/**', (r) => r.fulfill({ json: { current: { precipitation: 0, rain: 0, showers: 0, weather_code: 1 } } }));
await page.goto('http://127.0.0.1:8766/?debug');
await page.waitForFunction(() => document.querySelector('#loading').hidden && window.__dbg && __dbg.Char.vrm, null, { timeout: 90000 });
await page.click('#go-check'); await page.click('#depart-skip');
let lon = 139.50;
for (let i = 0; i < 14; i++) {
  lon -= 0.0004; await ctx.setGeolocation({ latitude: 35.45, longitude: lon, accuracy: 10 });
  await page.waitForTimeout(1000);
  if (await page.$eval('#stop-card', (e) => !e.hidden)) break;
}
const r = await page.evaluate(() => ({ heading: __dbg.drive.real.heading, speed: Math.round(__dbg.drive.real.speedKmh), n: __dbg.drive.real.list.length }));
console.log('進行方向', Math.round(r.heading), '° / 速度', r.speed, 'km/h / 取得した施設', r.n, '件 / 地図データ取得回数', overpassCalls);
console.log('案内カード:', await page.$eval('#stop-card', (e) => !e.hidden), '|', await page.$eval('#stop-name', (e) => e.textContent), '|', await page.$eval('#stop-dist', (e) => e.textContent));
await page.waitForTimeout(1500);
console.log('セリフ:', await page.evaluate(() => document.querySelector('#line-sr').textContent));
await page.screenshot({ path: 'shots/real-stop.png' });
await page.click('#stop-yes'); await page.waitForTimeout(800);
// 近づく:約1.9km → 0.9km → 0.55km(それぞれ数秒走る)
const heard = [];
for (const off of [0.0215, 0.0211, 0.0105, 0.0101, 0.0062, 0.0058]) {
  await ctx.setGeolocation({ latitude: 35.45, longitude: 139.42 + off, accuracy: 10 }); await page.waitForTimeout(1600);
  heard.push(await page.evaluate(() => document.querySelector('#line-sr').textContent));
}
console.log('近づくときの案内:', [...new Set(heard)].join(' / '));
// SAに到着(近くで減速)
for (const lo of [139.4215, 139.4205, 139.4201]) { await ctx.setGeolocation({ latitude: 35.4496, longitude: lo, accuracy: 10 }); await page.waitForTimeout(1200); }
await page.waitForTimeout(1500);
console.log('休憩カード:', await page.$eval('#rest-card', (e) => !e.hidden), '| 休憩先の県:', await page.evaluate(() => __dbg.drive.rest && __dbg.drive.rest.pref), '| セリフ:', await page.evaluate(() => document.querySelector('#line-sr').textContent));
console.log(errs.join('\n') || 'エラーなし');
await browser.close();
