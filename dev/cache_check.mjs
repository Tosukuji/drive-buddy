// 圧縮モデルの読み込みと、アプリ更新後もモデルの保存が残るかの確認
import { createRequire } from 'module';
import { execSync } from 'child_process';
const { chromium } = createRequire(import.meta.url)('playwright');
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 400, height: 860 }, locale: 'ja-JP' });
await ctx.addInitScript(() => localStorage.setItem('drive-buddy-state-v1', JSON.stringify({ v: 3, settings: { lang: 'ja', onboarded: true, greetOn: false, persona: 'ottori' }, drives: [] })));
const page = await ctx.newPage();
const errs = []; page.on('pageerror', (e) => errs.push(e.message));
const net = []; ctx.on('request', (r) => { if (r.url().includes('/models/')) net.push(r.url().replace(/^.*\/models\//, '')); });
await page.route('https://fonts.**', (r) => r.abort());
let t0 = Date.now();
await page.goto('http://127.0.0.1:8766/?debug');
await page.waitForFunction(() => document.querySelector('#loading').hidden && window.__dbg && __dbg.Char.vrm, null, { timeout: 90000 });
console.log('1回目: 表示まで', Date.now() - t0, 'ms / 見た目', await page.evaluate(() => __dbg.Char.modelKey), '/ 通信', net.join(', '));
await page.waitForTimeout(1500);
console.log('保存の一覧:', JSON.stringify(await page.evaluate(async () => { const out = {}; for (const k of await caches.keys()) out[k] = (await (await caches.open(k)).keys()).filter((r) => r.url.includes('/models/')).map((r) => r.url.replace(/^.*\/models\//, '')); return out; })));
// アプリの更新(新しいバージョンを組み立てる)→ 再読み込み2回
execSync('node build.mjs', { stdio: 'ignore' });
net.length = 0;
await page.reload(); await page.waitForTimeout(2000); await page.reload();
t0 = Date.now();
await page.waitForFunction(() => document.querySelector('#loading').hidden && window.__dbg && __dbg.Char.vrm, null, { timeout: 90000 });
console.log('更新後: 表示まで', Date.now() - t0, 'ms / モデルの要求', net.length, '件');
console.log('更新後の保存:', JSON.stringify(await page.evaluate(async () => { const out = {}; for (const k of await caches.keys()) out[k] = (await (await caches.open(k)).keys()).filter((r) => r.url.includes('/models/')).length; return out; })));
console.log(errs.join('\n') || 'エラーなし');
await browser.close();
