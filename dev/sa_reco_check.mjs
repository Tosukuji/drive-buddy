// 有名SA・PAの名物(おすすめ)の照合と、休憩でのセリフ・停車カードの表示を確かめる
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('playwright');
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 400, height: 860 }, locale: 'ja-JP', permissions: ['geolocation'], geolocation: { latitude: 35.45, longitude: 139.5, accuracy: 10 } });
await ctx.addInitScript(() => {
  if (sessionStorage.getItem('s')) return; sessionStorage.setItem('s', '1');
  localStorage.setItem('drive-buddy-state-v1', JSON.stringify({ v: 3, settings: { lang: 'ja', onboarded: true, greetOn: false, persona: 'sora', weatherOn: false }, drives: [] }));
});
const page = await ctx.newPage();
const errs = []; page.on('pageerror', (e) => errs.push(e.message));
await page.route('https://fonts.**', (r) => r.abort());
await page.goto('http://127.0.0.1:8766/?debug');
await page.waitForFunction(() => document.querySelector('#loading').hidden && window.__dbg && __dbg.Char.vrm, null, { timeout: 90000 });

// 1) 名前の照合(OpenStreetMap にありそうな書き方いろいろ)
const cases = [
  ['海老名サービスエリア(下り)', 'SA', null, '海老名メロンパン'],
  ['海老名サービスエリア（上り線）', 'SA', null, '海老名カレーパン'],
  ['EXPASA海老名', 'SA', null, '海老名メロンパン'],
  ['海老名SA 下り', 'SA', null, '海老名メロンパン'],
  ['談合坂ＳＡ（上り）', 'SA', null, '甲州味噌かつ丼'],
  ['Pasar三芳', 'PA', null, 'わらじタレかつ丼'],
  ['三芳パーキングエリア(下り)', 'PA', null, '狭山茶つつみ焼'],
  ['高坂サービスエリア', 'SA', null, '肉汁うどん'],
  ['高坂パーキングエリア', 'PA', null, null],
  ['足柄サービスエリア(上り)', 'SA', null, null],
  ['横川サービスエリア(上り)', 'SA', null, '峠の釜めし'],
  ['NEOPASA浜松', 'SA', null, '浜松餃子'],
  ['刈谷ハイウェイオアシス', 'PA', null, '手羽先唐揚げ'],
  ['海ほたるパーキングエリア', 'PA', null, 'あさりの塩ラーメン'],
  ['宮島サービスエリア(下り)', 'SA', 'JP-34', 'カキフライ'],
  ['宮島サービスエリア(下り)', 'SA', 'JP-13', null],
  ['道の駅 佐野', 'michi', null, null],
  ['どこかのPA', 'PA', null, null],
];
const got = await page.evaluate((cases) => cases.map(([nm, kind, pref]) => { const r = __dbg.recoFor({ name: { ja: nm }, kind }, pref); return r ? r.ja : null; }), cases);
let ok = 0;
cases.forEach(([nm, , pref, want], i) => { const pass = got[i] === want; ok += pass; if (!pass) console.log(`  × ${nm}${pref ? `(${pref})` : ''} → ${got[i]}(期待 ${want})`); });
console.log(`名前の照合: ${ok}/${cases.length} 件 OK`);
const stat = await page.evaluate(() => { const l = [...__dbg.SA_RECO.values()]; const langs = ['ja', 'zh', 'ko', 'en']; const miss = l.flatMap((e) => ['all', 'up', 'dn'].filter((d) => e[d]).flatMap((d) => langs.filter((g) => !e[d][g]).map((g) => `${e.n}.${d}.${g}`))); return { n: l.length, items: l.reduce((a, e) => a + ['all', 'up', 'dn'].filter((d) => e[d]).length, 0), miss }; });
console.log(`収録: ${stat.n} か所・${stat.items} 品/訳の抜け: ${stat.miss.length ? stat.miss.join(', ') : 'なし'}`);

// 2) デモで海老名SAに寄る:停車カードの表示と、休憩でのセリフ
const lines = [];
await page.exposeFunction('logLine', (t) => lines.push(t));
await page.evaluate(() => new MutationObserver(() => { const t = document.querySelector('#line-sr').textContent; if (t) window.logLine(t); }).observe(document.querySelector('#line-sr'), { childList: true, characterData: true, subtree: true }));
await page.click('#go-demo'); await page.waitForTimeout(400);
await page.evaluate(() => { __dbg.drive.sim = 25.5 * 60; });
await page.waitForFunction(() => !document.querySelector('#stop-card').hidden, null, { timeout: 20000 });
console.log('停車カードのタグ:', await page.$$eval('#stop-tags .tag', (els) => els.map((e) => e.textContent).join(' / ')));
await page.screenshot({ path: 'shots/sa-reco-card.png' });
await page.waitForTimeout(1500);
await page.click('#stop-yes');
await page.waitForFunction(() => __dbg.drive && __dbg.drive.rest, null, { timeout: 60000 });
await page.waitForTimeout(7000);
console.log('休憩で話したこと:\n  ' + [...new Set(lines)].filter((t) => /到着|着いた|おすすめ|名物/.test(t)).join('\n  '));
// 3) 他の言語でも同じ品が出るか
for (const lg of ['zh', 'ko', 'en']) {
  const r = await page.evaluate(() => __dbg.recoFor({ name: { ja: '来島海峡サービスエリア' }, kind: 'SA' }));
  console.log(`  ${lg}: ${r[lg]}`);
}
console.log(errs.join('\n') || 'エラーなし');
await browser.close();
