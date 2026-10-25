// 表情の見え方を比べる:笑顔+「あ」の口で、まばたき・揺れを止めて撮影
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('playwright');
const tag = process.argv[2], look = process.argv[3] || 'michi-orig';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 400, height: 860 }, locale: 'ja-JP', colorScheme: 'light' });
await ctx.addInitScript((look) => localStorage.setItem('drive-buddy-state-v1', JSON.stringify({ v: 3, settings: { lang: 'ja', onboarded: true, greetOn: false, persona: 'kohai', zoom: 1.8, motion: 'low', looks: { kohai: look } }, drives: [] })), look);
const page = await ctx.newPage();
const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await page.route('https://fonts.**', (r) => r.abort());
await page.goto('http://127.0.0.1:8766/?debug');
await page.waitForFunction(() => document.querySelector('#loading').hidden && window.__dbg && __dbg.Char.vrm, null, { timeout: 90000 });
await page.waitForTimeout(3500);
await page.evaluate(() => {
  const C = __dbg.Char; C.blinkAt = 1e9; C.blinkT = -1;
  const em = C.vrm.expressionManager;
  // 表情を完全に固定:笑顔 1.0、口「あ」0.8、他は0
  const fixed = { happy: 1, aa: 0.8 };
  const orig = em.setValue.bind(em);
  em.setValue = (n) => orig(n, fixed[n] || 0);
});
await page.waitForTimeout(1200);
await page.screenshot({ path: `shots/slim-${tag}.png`, clip: { x: 0, y: 60, width: 400, height: 400 } });
console.log(tag, errs.join(' | ') || 'エラーなし');
await browser.close();
