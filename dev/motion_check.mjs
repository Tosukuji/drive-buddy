// キャラの動きのなめらかさを数値で測る。
// 決まった台本の動き(途中で別の動きに切り替わる場面を含む)を60fps固定で再生し、
// 関節ごとの回転速度と、1コマで速度が急に変わった回数(=カクッと見える箇所)を数える。
import { createRequire } from 'module';
import fs from 'fs';
const { chromium } = createRequire(import.meta.url)('playwright');
const label = process.argv[2] || 'now';
const SCRIPT = [
  { t: 1.0, kind: 'nod' }, { t: 1.5, kind: 'wave' },            // うなずき中に手を振る(割り込み)
  { t: 4.0, kind: 'hop' }, { t: 4.4, kind: 'tilt' },            // ぴょん中に首かしげ(割り込み)
  { t: 6.5, kind: 'look' }, { t: 7.2, kind: 'shake' },          // よそ見中に首ふり(割り込み)
  { t: 9.0, kind: 'stretch' }, { t: 11.5, kind: 'surprised' },
  { t: 12.5, kind: 'umbOn' }, { t: 15.0, kind: 'wave' }, { t: 16.5, kind: 'umbOff' },
  { t: 17.0, kind: 'lookTap' }, { t: 18.0, kind: 'down' },
];
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 400, height: 860 }, locale: 'ja-JP' });
await ctx.addInitScript(() => localStorage.setItem('drive-buddy-state-v1', JSON.stringify({ v: 3, settings: { lang: 'ja', onboarded: true, greetOn: false }, drives: [] })));
const page = await ctx.newPage();
await page.route('https://fonts.**', (r) => r.abort());
await page.goto('http://127.0.0.1:8766/?debug');
await page.waitForFunction(() => document.querySelector('#loading').hidden && window.__dbg && __dbg.Char.vrm, null, { timeout: 90000 });
const rec = await page.evaluate((events) => __dbg.simulateMotion({ seconds: 20, fps: 60, events }), SCRIPT);
await browser.close();

const ang = (a, b) => { const d = Math.abs(a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]); return 2 * Math.acos(Math.min(1, d)) * 180 / Math.PI; };
const fps = rec.fps, rows = [];
let totalPops = 0, totalJerk = 0;
const popTimes = new Set();
rec.names.forEach((n, j) => {
  const v = []; // 角速度(度/秒)
  for (let i = 1; i < rec.frames.length; i++) v.push(ang(rec.frames[i - 1][j], rec.frames[i][j]) * fps);
  let pops = 0, jerk = 0, vmax = 0;
  for (let i = 1; i < v.length; i++) {
    const dv = Math.abs(v[i] - v[i - 1]); // 1コマでの速度変化(度/秒)
    vmax = Math.max(vmax, v[i]);
    if (dv > 60) { pops++; popTimes.add(((i + 1) / fps).toFixed(1)); }
    jerk += dv;
  }
  totalPops += pops; totalJerk += jerk;
  rows.push({ 関節: n, 最大速度: Math.round(vmax) + '°/秒', 急変化コマ数: pops, 速度変化の合計: Math.round(jerk) });
});
console.table(rows);
console.log(`[${label}] 急変化コマ数の合計: ${totalPops} / 速度変化の合計: ${Math.round(totalJerk)}`);
console.log('急変化が起きた時刻(秒):', [...popTimes].slice(0, 40).join(' '));
fs.mkdirSync('shots', { recursive: true });
fs.writeFileSync(`shots/motion-${label}.json`, JSON.stringify({ label, totalPops, totalJerk: Math.round(totalJerk), rows }, null, 1));
