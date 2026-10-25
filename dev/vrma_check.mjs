// VRMAの読み込み→場面への割り当て→再生の確認
import { createRequire } from 'module';
import fs from 'fs';
const { chromium } = createRequire(import.meta.url)('playwright');
const look = process.argv[2] || 'michi';
// 使い方: node vrma_check.mjs <見た目> <VRMAファイル> [<VRMAファイル>...](公式モーションは各自BOOTHから入手。リポジトリには含めない)
const files = process.argv.slice(3);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 400, height: 860 }, locale: 'ja-JP', colorScheme: 'light' });
await ctx.addInitScript((look) => localStorage.setItem('drive-buddy-state-v1', JSON.stringify({ v: 3, settings: { lang: 'ja', onboarded: true, greetOn: false, persona: 'kohai', motion: 'low', looks: { kohai: look } }, drives: [] })), look);
const page = await ctx.newPage();
const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('ERR_TUNNEL')) errs.push(m.text()); });
await page.route('https://fonts.**', (r) => r.abort());
await page.goto('http://127.0.0.1:8766/?debug');
await page.waitForFunction(() => document.querySelector('#loading').hidden && window.__dbg && __dbg.Char.vrm, null, { timeout: 90000 });
await page.evaluate(() => { const c = document.querySelector('#c'); c.addEventListener('webglcontextlost', () => console.error('WebGL消失')); c.addEventListener('webglcontextrestored', () => console.error('WebGL復帰')); });
await page.click('#open-settings'); await page.click('#open-look-settings'); await page.waitForTimeout(800);
await page.setInputFiles('#vrma-file', files.map((f) => ({ name: f.split('/').pop(), mimeType: 'application/octet-stream', buffer: fs.readFileSync(f) }))); await page.waitForTimeout(2500);
console.log('メモ:', await page.$eval('#mot-note', (e) => e.textContent), '| 割り当て:', JSON.stringify(await page.evaluate(() => __dbg.S().motionSlots)));
await page.$eval('#mot-list', (e) => e.scrollIntoView());
await page.screenshot({ path: 'shots/vrma-' + look + '-list.png' });
await page.click('#sheet-look [data-close]'); await page.waitForTimeout(400);
const t0 = Date.now();
await page.evaluate(() => __dbg.gesture('wave'));
const marks = [];
for (let i = 0; i < 40; i++) { await page.waitForTimeout(250); const [on, info] = await page.evaluate(() => [!!__dbg.Motion.playing, __dbg.Motion.playing ? (__dbg.now - __dbg.Motion.playing.t0).toFixed(2) + '/' + __dbg.Motion.playing.dur.toFixed(1) : '']); marks.push(on ? '■' : '□'); if (i % 8 === 0) console.log('  経過(アプリ内時計)', info); if (!on && i > 4) break; }
console.log('画面の状態:', await page.evaluate(() => document.visibilityState), '| rAF:', await page.evaluate(() => Promise.race([new Promise((r) => requestAnimationFrame(() => r('動いている'))), new Promise((r) => setTimeout(() => r('止まっている'), 1500))])));
console.log('再生状態(0.25秒ごと):', marks.join(''), '経過', ((Date.now() - t0) / 1000).toFixed(1) + '秒');
console.log(errs.join(' | ') || 'エラーなし');
await browser.close();
