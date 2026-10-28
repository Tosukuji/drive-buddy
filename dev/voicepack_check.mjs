// キャラボイス(仮の音声)の再生確認:録音で話すか、口が音に合わせて動くか、無いセリフは端末の声になるか
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('playwright');
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: 400, height: 860 }, locale: 'ja-JP', timezoneId: 'America/New_York' });
await ctx.addInitScript(() => {
  localStorage.setItem('drive-buddy-state-v1', JSON.stringify({ v: 3, settings: { lang: 'ja', onboarded: true, greetOn: false, persona: 'sora' }, drives: [] }));
  window.__tts = []; speechSynthesis.speak = (u) => { window.__tts.push(u.text); setTimeout(() => u.onend && u.onend(), 200); };
});
const page = await ctx.newPage();
const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (/voice pack/.test(m.text())) errs.push(m.text()); });
await page.route('https://fonts.**', (r) => r.abort());
await page.goto('http://127.0.0.1:8766/?debug');
await page.waitForFunction(() => document.querySelector('#loading').hidden && window.__dbg && __dbg.Char.vrm, null, { timeout: 90000 });
await page.mouse.click(200, 700); // 一度タップ(音を出せるようにする)
console.log('AAC対応:', await page.evaluate(() => MediaSource.isTypeSupported('audio/mp4; codecs="mp4a.40.2"')), '/ 仮ボイス読み込み:', await page.evaluate(async () => { await __dbg.VoicePack.load('sora'); const p = __dbg.VoicePack.ready('sora'); return p ? p.keys.size + '本 ' + p.credit : 'なし'; }));
const check = async (label, fn) => {
  await page.evaluate(fn);
  const samples = [];
  for (let i = 0; i < 12; i++) { await page.waitForTimeout(150); samples.push(await page.evaluate(() => [__dbg.VoicePack.active(), Math.round(__dbg.VoicePack.level() * 100), Math.round((__dbg.Char.mouth.aa + __dbg.Char.mouth.oh + __dbg.Char.mouth.ih + __dbg.Char.mouth.ee + __dbg.Char.mouth.ou) * 100)])); }
  const tts = await page.evaluate(() => { const t = window.__tts.slice(); window.__tts.length = 0; return t; });
  console.log(label.padEnd(12), '| 録音で再生:', samples.some((s) => s[0]), '| 音量(%):', samples.map((s) => s[1]).join(' '), '| 端末の声:', tts.length ? tts.join(' / ') : 'なし');
};
await check('あいさつ', () => { __dbg.say('hello'); });
await page.waitForTimeout(2500);
await check('おみやげ', () => { __dbg.say('giftLike', { item: 'シウマイ' }); });
await page.waitForTimeout(2500);
await check('実際のSA', () => { __dbg.say('stopYes', { stop: '談合坂サービスエリア' }); });
console.log(errs.join('\n') || 'エラーなし');
await browser.close();
