import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('playwright');
import fs from 'fs'; import path from 'path';
const NM = path.resolve('node_modules');
const genki = JSON.parse(fs.readFileSync('../web/src/personas/genki.json', 'utf8'));
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 400, height: 860 }, colorScheme: process.argv[2] || 'light', locale: 'ja-JP' });
// fake claude runtime: no db, a "sample" that returns a canned custom character
await ctx.addInitScript((lines) => {
  const fake = Object.assign(async () => ({ text: '' }), {
    json: async (prompt, opts) => {
      window.__lastPrompt = prompt;
      opts && opts.onText && opts.onText({ text: '{...}', delta: '{...}' });
      await new Promise((r) => setTimeout(r, 300));
      const L = JSON.parse(JSON.stringify(lines));
      L.hello = 'テストキャラの{name}担当、ナギです。よろしく。';
      delete L.chat; // missing key should fall back
      L.stopAhead = '{stop}が近いよ。'; // missing placeholders -> fallback
      return { name: 'ナギ', tagline: '天然で物知りな執事', call: 'ご主人', lines: L };
    },
  });
  window.claude = { use: async (n) => (n === 'sample' ? fake : null) };
}, genki.lines.ja);
const page = await ctx.newPage();
const logs = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(m.type() + ': ' + m.text()); });
page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
await page.route('https://cdn.jsdelivr.net/npm/**', (route) => {
  const u = new URL(route.request().url());
  const p = u.pathname.replace('/npm/', '').replace(/^three@[^/]+/, 'three').replace(/^@pixiv\/three-vrm@[^/]+/, '@pixiv/three-vrm');
  route.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(path.join(NM, p)) });
});
await page.route('https://fonts.**', (r) => r.abort());
const shot = async (n) => { await page.waitForTimeout(700); await page.screenshot({ path: `shots/v2-${n}.png` }); };
await page.goto('http://127.0.0.1:8765/_preview.html?debug');
await page.waitForFunction(() => document.querySelector('#loading').hidden, null, { timeout: 60000 });
await page.waitForTimeout(1500);
await shot('01-home-ja');
await page.click('#open-persona');
await shot('02-persona');
// switch to cool sister
await page.click('#persona-cards .pcard:nth-child(2) button');
await page.waitForTimeout(1500);
await shot('03-onee-home');
// custom builder with fake sample
await page.click('#open-persona');
await page.click('#tr-random');
await page.selectOption('#tr-rel', 'butler'); await page.selectOption('#tr-temp', 'ottori'); await page.selectOption('#tr-quirk', 'tennen');
await page.click('#tr-generate');
await page.waitForTimeout(1500);
await shot('04-custom-home');
const custom = await page.evaluate(() => { const c = window.__dbg.Store.state.custom; return { name: c.name, base: c.base, chat: c.lines.chat, stopAhead: c.lines.stopAhead, hello: c.lines.hello }; });
console.log('custom:', JSON.stringify(custom));
console.log('prompt chars:', (await page.evaluate(() => window.__lastPrompt.length)));
// back to kohai, settings: verbosity + language zh
await page.click('#open-persona');
await page.click('#persona-cards .pcard:nth-child(1) button');
await page.click('#open-settings');
await page.selectOption('#set-lang', 'zh');
await page.waitForTimeout(500);
await shot('05-settings-zh');
await page.click('#sheet-settings [data-close]');
await shot('06-home-zh');
// demo drive in zh with rest stops
await page.click('#go-demo');
await page.waitForFunction(() => !document.querySelector('#stop-card').hidden, null, { timeout: 40000 });
await page.waitForTimeout(3000);
await shot('07-stop-asking-zh');
await page.click('#stop-yes');
await page.waitForTimeout(1500);
await shot('08-stop-going-zh');
await page.waitForFunction(() => document.querySelector('#stop-card').hidden, null, { timeout: 30000 });
await page.waitForTimeout(800);
await shot('09-stop-reached-zh');
console.log('breaks after stop:', await page.evaluate(() => window.__dbg.drive && window.__dbg.drive.breaks));
// next stop: let it time out (no answer)
await page.waitForFunction(() => !document.querySelector('#stop-card').hidden, null, { timeout: 40000 });
await page.waitForTimeout(16000);
await shot('10-stop-noreply-zh');
await page.focus('#arrive-btn'); await page.keyboard.press('Enter');
await shot('11-arrive-zh');
await page.click('#save-drive');
// ko + en quick looks
for (const L of ['ko', 'en']) {
  await page.click('#open-settings');
  await page.selectOption('#set-lang', L);
  await page.click('#sheet-settings [data-close]');
  await shot(`12-home-${L}`);
  await page.click('#open-persona');
  await shot(`13-persona-${L}`);
  await page.click('#sheet-persona [data-close]');
}
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
console.log('horizontal overflow:', overflow);
console.log(logs.join('\n') || 'no console errors');
await browser.close();
