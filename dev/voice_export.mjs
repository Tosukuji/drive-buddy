// VOICEVOX に読み込ませるセリフ一覧を作る(キャラごとに1ファイル、1行=1音声)。
// 出力: voice-export/<キャラ>.txt(VOICEVOXの「テキスト読み込み」用)と <キャラ>.json(番号と文章の対応)
// 使い方: node voice_export.mjs
import fs from 'fs';
import path from 'path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const P = (...p) => path.join(root, ...p);
const read = (p) => fs.readFileSync(P(p), 'utf8');
const { vcClips, vcHash } = new Function(read('web/src/voiceclips.js') + '; return { vcClips, vcHash };')();

const i18n = JSON.parse(read('web/src/i18n.json')).ja;
const items = JSON.parse(read('web/src/items.json'));
const saReco = JSON.parse(read('web/src/sa_reco.json')).list;
const app = read('web/src/app.html');
const demoStops = new Function('return ' + app.match(/const DEMO_STOPS = (\[[\s\S]*?\n\]);/)[1])();
const fill = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');
const fmtDur = (min) => { const h = Math.floor(min / 60), m = min % 60; return !h ? fill(i18n.dur.m, { m }) : !m ? fill(i18n.dur.h, { h }) : fill(i18n.dur.hm, { h, m }); };
const fmtHours = (h) => (h === '24h' ? i18n.hours24 : fill(i18n.hoursRange, { o: h[0], c: h[1] }));
const range = (a, b, step = 1) => { const r = []; for (let x = a; x <= b; x += step) r.push(x); return r; };

const itemNames = [...items.general, ...items.special, ...Object.values(items.prefs)].map((it) => it.ja);
const prefNames = Object.values(items.prefs).map((it) => it.pref.ja);
const medalNames = Object.values(i18n.medals).map((m) => m[0]);
const stopVars = demoStops.flatMap((st) => [true, false].map((withInfo) => ({
  stop: st.name.ja, dist: fill(i18n.distSpeak, { n: st.km }),
  info: withInfo ? fill(i18n.info, { hours: fmtHours(st.hours), crowd: i18n.crowd[st.crowd] }) : '',
})));
const stopOnly = demoStops.map((st) => ({ stop: st.name.ja }));
// the values each placeholder can take when spoken
const VARS = {
  hourly: range(1, 10).map((h) => ({ h })),
  breakDue: range(30, 480, 30).map((m) => ({ t: fmtDur(m) })),
  levelUp: i18n.levels.slice(1).map((lv) => ({ lv })),
  milestone: [5, 10, 20, 30, 50, 100, 200].map((n) => ({ n })),
  anniv: [30, 100, 365].map((n) => ({ n })),
  newPlace: prefNames.map((place) => ({ place })),
  season: Object.values(i18n.events).map((event) => ({ event })),
  medal: medalNames.map((medal) => ({ medal })),
  restReco: [...new Set(saReco.flatMap((e) => ['all', 'up', 'dn'].filter((d) => e[d]).map((d) => e[d].ja)))].map((reco) => ({ reco })),
  restLocal: Object.values(items.prefs).map((it) => ({ place: it.pref.ja, item: it.ja })),
  stopCue: demoStops.flatMap((st) => [2, 1].map((n) => ({ stop: st.name.ja, dist: fill(i18n.distSpeak, { n }) }))),
  stopAhead: stopVars, stopAheadBreak: stopVars,
  stopYes: stopOnly, stopNo: stopOnly, stopNoReply: stopOnly, stopReached: stopOnly,
};
for (const k of ['itemGet', 'giftLove', 'giftLike', 'giftNeutral', 'giftDislike']) VARS[k] = itemNames.map((item) => ({ item }));

fs.mkdirSync(P('voice-export'), { recursive: true });
const summary = [];
for (const pid of ['kohai', 'onee', 'genki', 'ottori', 'sora']) {
  const p = JSON.parse(read(`web/src/personas/${pid}.json`));
  const call = p.call.ja, lines = p.lines.ja;
  const texts = new Map(); // text -> first key
  for (const [key, entry] of Object.entries(lines)) {
    for (const tpl of [].concat(entry)) {
      const other = (tpl.match(/\{(\w+)\}/g) || []).filter((x) => x !== '{name}');
      const sets = other.length ? VARS[key] : [{}];
      if (!sets) { console.warn(`  (声なし) ${pid}.${key}`); continue; }
      for (const v of sets) for (const t of vcClips(tpl, v, call, call) || []) if (!texts.has(t)) texts.set(t, key);
    }
  }
  // Keep the numbers of an earlier export, so audio already made with it still lines up:
  // lines that are no longer used keep their number (marked unused), new lines go at the end.
  const prevFile = P(`voice-export/${pid}.json`);
  const prev = fs.existsSync(prevFile) ? JSON.parse(fs.readFileSync(prevFile, 'utf8')).clips : [];
  const list = prev.map((c) => ({ n: c.n, text: c.text, hash: vcHash(c.text), ...(texts.has(c.text) ? {} : { unused: true }) }));
  const known = new Set(prev.map((c) => c.text));
  for (const text of texts.keys()) if (!known.has(text)) list.push({ n: list.length + 1, text, hash: vcHash(text) });
  fs.writeFileSync(P(`voice-export/${pid}.txt`), list.map((x) => (x.unused ? '' : x.text)).join('\n') + '\n'); // blank lines are skipped
  fs.writeFileSync(P(`voice-export/${pid}.json`), JSON.stringify({ character: p.name.ja, call, clips: list }, null, 1));
  const unused = list.filter((c) => c.unused).length, added = list.length - prev.length;
  summary.push(`${p.name.ja}(${pid}): ${list.length}行${prev.length ? `(新しく${added}行${unused ? `、使わなくなった${unused}行` : ''})` : ''}`);
}
console.log(summary.join('\n'));
