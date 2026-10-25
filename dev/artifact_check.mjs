// claude.ai版(見た目は内蔵のみ・記録はClaudeのデータ保存)の簡易確認
import { createRequire } from 'module';
import fs from 'fs'; import path from 'path';
const { chromium } = createRequire(import.meta.url)('playwright');
const NM = path.resolve('node_modules');
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 400, height: 860 }, locale: 'ja-JP', timezoneId: 'America/New_York' });
await ctx.addInitScript(() => {
  const mem = {};
  const db = { doc: (p) => ({ get: async () => ({ exists: !!mem[p], data: () => mem[p] }), set: async (d) => { mem[p] = d; } }) };
  window.claude = { use: async (n) => (n === 'db' ? db : n === 'user' ? { id: async () => 'u1' } : null) };
});
const page = await ctx.newPage();
const logs = []; page.on('pageerror', (e) => logs.push('pageerror: ' + e.message)); page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('fonts')) logs.push(m.text()); });
await page.route('https://cdn.jsdelivr.net/npm/**', (route) => {
  const u = new URL(route.request().url());
  const p = u.pathname.replace('/npm/', '').replace(/^(@[^/]+\/[^@/]+|[^@/]+)@[^/]+/, '$1');
  route.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(path.join(NM, p)) });
});
await page.route('https://fonts.**', (r) => r.abort());
await page.goto('http://127.0.0.1:8765/_preview.html?debug');
await page.waitForFunction(() => document.querySelector('#loading').hidden && window.__dbg && __dbg.Char.vrm, null, { timeout: 120000 });
await page.waitForTimeout(800);
console.log('保存先:', await page.evaluate(() => __dbg.Store.kind), '| ようこそ:', await page.$eval('#sheet-welcome', (e) => !e.hidden), '| キャラ数:', await page.$$eval('#welcome-cards .pcard', (e) => e.length));
await page.click('#welcome-start'); await page.waitForTimeout(500);
await page.evaluate(() => __dbg.setPersona('sora')); await page.waitForTimeout(3000);
console.log('ソラの見た目(claude.ai版は色違い):', await page.evaluate(() => __dbg.Char.modelKey));
await page.screenshot({ path: 'shots/artifact-sora.png' });
await page.click('#open-settings'); await page.click('#open-look-settings'); await page.waitForTimeout(600);
console.log('サンプル見た目の数(claude.ai版は0のはず):', await page.$$eval('#look-builtin .look-cell img', (e) => e.length), '| 小窓ボタン:', await page.$eval('#pip-btn', (e) => !e.hidden));
console.log(logs.join('\n') || 'エラーなし');
await browser.close();
