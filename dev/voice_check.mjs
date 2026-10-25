// 起動直後のあいさつが、最初のタップで声になるかの確認
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('playwright');
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 400, height: 860 }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', hasTouch: true });
await ctx.addInitScript(() => {
  localStorage.setItem('drive-buddy-state-v1', JSON.stringify({ v: 3, settings: { lang: 'ja', onboarded: true }, drives: [] }));
  window.__spoken = [];
  // 実機のChromeと同じく、タップするまでは「未操作」にする
  let active = false;
  for (const ev of ['pointerup', 'click', 'keydown', 'touchend']) addEventListener(ev, () => { active = true; }, { capture: true });
  Object.defineProperty(navigator, 'userActivation', { get: () => ({ get hasBeenActive() { return active; }, get isActive() { return active; } }) });
  const orig = speechSynthesis.speak.bind(speechSynthesis);
  speechSynthesis.speak = (u) => { if (!navigator.userActivation.hasBeenActive) { window.__spoken.push({ text: '(未操作のため無音)' + u.text, active: false }); return; } window.__spoken.push({ text: u.text, active: navigator.userActivation.hasBeenActive }); setTimeout(() => u.onend && u.onend(), 300); };
});
const page = await ctx.newPage();
const errs = []; page.on('pageerror', (e) => errs.push(e.message));
await page.route('https://fonts.**', (r) => r.abort());
await page.goto('http://127.0.0.1:8766/');
await page.waitForFunction(() => document.querySelector('#loading').hidden, null, { timeout: 90000 });
await page.waitForTimeout(1500);
console.log('タップ前: 吹き出し=', await page.$eval('#line', (e) => e.textContent), '| ヒント表示=', await page.$eval('#tap-voice', (e) => !e.hidden), '| 発声回数=', await page.evaluate(() => __spoken.length));
await page.screenshot({ path: 'shots/voice-before-tap.png' });
await page.tap('.lcd');
await page.waitForTimeout(600);
console.log('タップ後: 発声=', JSON.stringify(await page.evaluate(() => __spoken)), '| ヒント表示=', await page.$eval('#tap-voice', (e) => !e.hidden));
console.log(errs.join('\n') || 'エラーなし');
await browser.close();
