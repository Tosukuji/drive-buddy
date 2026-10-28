// 手の確認:待機・手を上げる途中・手振り・傘 を、上半身と手元のアップで撮る
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('playwright');
const look = process.argv[2] || 'michi';
const tag = process.argv[3] || 'x';
const extra = process.argv[4] ? JSON.parse(process.argv[4]) : null; // HAND の値を試すとき
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 400, height: 860 }, locale: 'ja-JP', colorScheme: 'light' });
await ctx.addInitScript((look) => localStorage.setItem('drive-buddy-state-v1', JSON.stringify({ v: 3, settings: { lang: 'ja', onboarded: true, greetOn: false, persona: 'kohai', zoom: 0.85, looks: { kohai: look } }, drives: [] })), look);
const page = await ctx.newPage();
const errs = []; page.on('pageerror', (e) => errs.push(e.message));
await page.route('https://fonts.**', (r) => r.abort());
await page.goto('http://127.0.0.1:8766/?debug');
await page.waitForFunction(() => document.querySelector('#loading').hidden && window.__dbg && __dbg.Char.vrm, null, { timeout: 90000 });
await page.addStyleTag({ content: '#bubble,.zoom-ctl,#toast-slot{display:none!important}' });
if (extra) await page.evaluate((e) => Object.assign(__dbg.HAND, e), extra);
let poses = [['rest', null, 0, 0], ['up', 'wave', 0.12, 0], ['wave', 'wave', 0.45, 0], ['umb', null, 0, 1]];
if (process.env.POSES) poses = poses.filter((p) => process.env.POSES.split(',').includes(p[0]));
for (const [name, kind, p, umb] of poses) {
  await page.evaluate(([k, p, u]) => __dbg.posePreview(k, p, u), [kind, p, umb]);
  await page.waitForTimeout(150);
  await page.screenshot({ path: `shots/hand-${tag}-${name}-body.png`, clip: { x: 0, y: 60, width: 400, height: 420 } });
  // 手元のアップ
  await page.evaluate(() => {
    const C = __dbg.Char, cam = __dbg.camera;
    const h = C.vrm.humanoid.getRawBoneNode('rightHand'); const v = h.getWorldPosition(h.position.clone());
    cam.userData.saved = cam.userData.saved || { p: cam.position.clone() };
    cam.position.set(v.x, v.y + 0.02, v.z + 0.45); cam.lookAt(v.x, v.y, v.z); __dbg.renderNow();
  });
  await page.waitForTimeout(100);
  await page.screenshot({ path: `shots/hand-${tag}-${name}-close.png`, clip: { x: 0, y: 60, width: 400, height: 420 } });
  await page.evaluate(() => { const cam = __dbg.camera; cam.position.copy(cam.userData.saved.p); __dbg.Char.freeze = false; });
  await page.evaluate(() => { const { Char } = __dbg; }); 
  await page.waitForTimeout(100);
}
console.log(look, errs.join(' | ') || 'エラーなし');
await browser.close();
