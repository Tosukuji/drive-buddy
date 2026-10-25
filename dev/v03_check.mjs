// End-to-end walk through the v0.3 screens on the own-site build (docs/), phone size.
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('playwright');
const scheme = process.argv[2] || 'light';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 400, height: 860 }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', colorScheme: scheme, hasTouch: true });
const page = await ctx.newPage();
const logs = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(m.type() + ': ' + m.text()); });
page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
await page.route('https://fonts.**', (r) => r.abort());
await page.route('https://api.open-meteo.com/**', (r) => r.fulfill({ json: { current: { precipitation: 1.2, rain: 1.2, showers: 0, weather_code: 63 } } }));
const T0 = Date.now();
const shot = (n) => { console.log('shot', n, ((Date.now() - T0) / 1000).toFixed(1) + 's'); return page.screenshot({ path: `shots/v03-${scheme}-${n}.png` }); };
const wait = (ms) => page.waitForTimeout(ms);
const tx = (s) => page.$eval(s, (e) => e.textContent.trim());
const vis = (s) => page.$eval(s, (e) => !e.hidden && e.offsetParent !== null).catch(() => false);

await page.goto('http://127.0.0.1:8766/?debug');
await page.waitForFunction(() => document.querySelector('#loading').hidden, null, { timeout: 90000 });
await wait(1200);
console.log('welcome sheet open:', await vis('#sheet-welcome'));
await shot('01-welcome');
// pick onee in the welcome sheet
const btns = await page.$$('#welcome-cards .pcard button.btn');
await btns[0].click(); // first non-current preset = onee
await page.waitForFunction(() => !document.querySelector('#loading').hidden === false);
await wait(1500);
await page.fill('#welcome-name', 'たろう');
await shot('02-welcome-onee');
await page.click('#welcome-start');
await wait(1200);
console.log('persona:', await page.evaluate(() => __dbg.S().persona), '| name:', await tx('#char-name'), '| line:', await tx('#line'));
await shot('03-home-onee');

// zoom
await page.click('#zoom-in'); await page.click('#zoom-in'); await wait(400);
await shot('04-zoom-in');
await page.click('#zoom-out'); await page.click('#zoom-out'); await page.click('#zoom-out'); await page.click('#zoom-out'); await wait(400);
await shot('05-zoom-out');
console.log('zoom now', await page.evaluate(() => __dbg.S().zoom));
await page.evaluate(() => { __dbg.S().zoom = 1; });

// demo drive, fast-forward to first stop
await page.click('#go-demo'); await wait(600);
await page.evaluate(() => { __dbg.drive.sim = 25.5 * 60; });
await wait(1500);
console.log('stop card:', await vis('#stop-card'), await tx('#stop-name').catch(() => ''));
await shot('06-drive-stop');
await page.click('#stop-yes'); await wait(600);
await page.evaluate(() => { const d = __dbg.drive; d.sim = d.stop.reachAt * 60 + 1; });
await wait(1500);
console.log('rest card:', await vis('#rest-card'), '| rest pref', await page.evaluate(() => __dbg.drive.rest && __dbg.drive.rest.pref));
await shot('07-rest');
await page.evaluate(() => { const r = __dbg.drive.rest; __dbg.drive.sim = r.t0 + 121; });
await wait(1200);
console.log('got:', await tx('#rest-got'), '| bag', JSON.stringify(await page.evaluate(() => __dbg.Store.state.bag)));
await shot('08-rest-got');
await wait(6000);
console.log('rest ended automatically:', !(await vis('#rest-card')));
// rain while driving
await page.evaluate(() => __dbg.Weather.demo());
await wait(2600);
await shot('09-drive-rain');
await page.dispatchEvent('#arrive-btn', 'click', { detail: 0 });
await wait(800);
await shot('10-arrive');
await page.click('#save-drive'); await wait(1000);

// give more items so the gift list has variety
await page.evaluate(() => { const st = __dbg.Store.state; st.bag['p-14'] = 1; st.bag['s-goldsoft'] = 1; st.bag['g-softcream'] = 2; st.got['p-14'] = { n: 1, first: '' }; st.got['s-goldsoft'] = { n: 1, first: '' }; st.got['g-softcream'] = { n: 2, first: '' }; });
await page.click('#open-gifts'); await wait(500);
await shot('11-gifts');
const gb = await page.$$('#gift-list .item-row button');
console.log('gift rows:', gb.length);
await gb[gb.length - 1].click(); // the general sweet → onee dislikes sweet
await wait(1500);
console.log('after gift line:', await tx('#line'), '| gifts', JSON.stringify(await page.evaluate(() => __dbg.Store.state.gifts.map((g) => g.d))));
await shot('12-after-gift');

// collection
await page.click('#open-coll'); await wait(400);
await shot('13-coll-lines');
await page.click('[data-tab="items"]'); await wait(300);
await shot('14-coll-items');
await page.click('[data-tab="prefs"]'); await wait(300);
await shot('15-coll-prefs');
await page.click('#sheet-coll [data-close]');

// settings
await page.click('#open-settings'); await wait(400);
await shot('16-settings-top');
await page.$eval('#sheet-settings .sheet-body', (e) => { e.scrollTop = 900; }); await wait(200);
await shot('17-settings-mid');
await page.$eval('#sheet-settings .sheet-body', (e) => { e.scrollTop = 2200; }); await wait(200);
await shot('18-settings-low');
await page.$eval('#sheet-settings .sheet-body', (e) => { e.scrollTop = 99999; }); await wait(200);
await shot('19-settings-end');
// look sheet
await page.click('#open-look-settings'); await wait(600);
await shot('20-look');
await page.click('#sheet-look [data-close]');

// persona switch to genki → recolor
await page.click('#open-persona'); await wait(300);
await shot('21-persona');
await page.evaluate(() => __dbg.setPersona('genki')); await wait(2500);
await shot('22-home-genki');
await page.evaluate(() => __dbg.setPersona('ottori')); await wait(2500);
await shot('23-home-ottori');
await page.evaluate(() => __dbg.setPersona('kohai')); await wait(2500);
// rain at home (umbrella)
await page.evaluate(() => __dbg.Weather.set(true)); await wait(2500);
await shot('24-home-rain');
// bubble fade
await page.evaluate(() => { __dbg.S().bubbleFade = true; __dbg.S().bubbleOp = 0.7; });
await page.evaluate(() => { document.documentElement.style.setProperty('--bubble-op', 0.7); __dbg.say('hello'); });
await wait(9000);
console.log('bubble faded:', await page.$eval('#bubble', (e) => e.classList.contains('faded')));
await shot('25-bubble-faded');

console.log('heard count:', await page.evaluate(() => Object.keys((__dbg.Store.state.heard.onee || {}).ja || {}).length));
console.log(logs.filter((l) => !l.includes('ERR_FAILED') && !l.includes('Failed to load resource')).join('\n') || 'no errors');
await browser.close();
