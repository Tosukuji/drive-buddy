import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('playwright');
import fs from 'fs'; import path from 'path';
const NM = path.resolve('node_modules');
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: 400, height: 860 }, colorScheme: 'light' })).newPage();
page.on('pageerror', (e) => console.log('pageerror', e.message));
await page.route('https://cdn.jsdelivr.net/npm/**', (route) => {
  const u = new URL(route.request().url());
  let p = u.pathname.replace('/npm/', '').replace(/^three@[^/]+/, 'three').replace(/^@pixiv\/three-vrm@[^/]+/, '@pixiv/three-vrm');
  route.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(path.join(NM, p)) });
});
await page.route('https://fonts.**', (r) => r.abort());
await page.goto('http://127.0.0.1:8765/_preview.html?debug');
await page.waitForFunction(() => document.querySelector('#loading').hidden, null, { timeout: 60000 });
await page.waitForTimeout(4000);
const clip = { x: 100, y: 70, width: 200, height: 200 };
// neutral, no gesture, blink suppressed
await page.evaluate(() => { const d = window.__dbg; d.Char.emotion = 'neutral'; d.Char.gesture = null; d.Char.blinkAt = 1e9; d.Char.blinkT = -1; });
await page.waitForTimeout(1500);
await page.screenshot({ path: 'shots/face-neutral.png', clip });
for (const e of ['relaxed', 'happy', 'sad', 'angry', 'surprised']) {
  await page.evaluate((e) => { window.__dbg.Char.emotion = e; }, e);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `shots/face-${e}.png`, clip });
}
await page.evaluate(() => { const d = window.__dbg; d.Char.emotion = 'neutral'; d.gesture('wave'); });
await page.waitForTimeout(1100);
await page.screenshot({ path: 'shots/wave-peak.png', clip: { x: 0, y: 60, width: 400, height: 470 } });
await browser.close();
