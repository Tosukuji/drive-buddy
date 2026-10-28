// VOICEVOX で書き出した音声(WAV)を、アプリ用のキャラボイスに変換して docs/voice/<キャラ>/ に置く。
// 使い方: node voice_import.mjs <キャラ: kohai|onee|genki|ottori|sora> <WAVのフォルダ> --credit "VOICEVOX:キャラ名"
//   WAVは VOICEVOX の「音声を全て書き出し(個別)」で出たもの。ファイル名の先頭の連番(001_…)で
//   voice-export/<キャラ>.txt の行番号と対応づける。ffmpeg が必要。
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execFileSync } from 'child_process';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const P = (...p) => path.join(root, ...p);
const [pid, dir] = process.argv.slice(2);
const credit = (process.argv.find((a, i) => process.argv[i - 1] === '--credit') || '').trim();
if (!pid || !dir || !credit) {
  console.error('使い方: node voice_import.mjs <キャラ> <WAVのフォルダ> --credit "VOICEVOX:キャラ名"');
  process.exit(1);
}
const exp = JSON.parse(fs.readFileSync(P(`voice-export/${pid}.json`), 'utf8'));
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const wavs = walk(path.resolve(dir)).filter((f) => /\.wav$/i.test(f));
const byNum = new Map();
for (const f of wavs) {
  const m = path.basename(f).match(/^(\d+)/);
  if (m) byNum.set(Number(m[1]), f);
}
const missing = [], suspicious = [];
const out = P(`docs/voice/${pid}`);
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const done = [];
for (const c of exp.clips) {
  const f = byNum.get(c.n);
  if (!f) { missing.push(c.n); continue; }
  // VOICEVOX puts the start of the text in the file name; check the order did not slip
  const name = path.basename(f, path.extname(f));
  const shown = name.split('_').slice(2).join('_');
  const norm = (s) => s.replace(/[\s、。,.!?!?…・〜~「」()()]/g, '');
  if (shown && !norm(c.text).startsWith(norm(shown).slice(0, 6))) suspicious.push(`${c.n}: ${shown} / ${c.text}`);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', f, '-ac', '1', '-ar', '24000', '-c:a', 'aac', '-b:a', '40k', '-movflags', '+faststart', path.join(out, `${c.hash}.m4a`)]);
  done.push(c.hash);
}
const v = crypto.createHash('sha1').update(done.join(',') + credit).digest('hex').slice(0, 10);
fs.writeFileSync(path.join(out, 'index.json'), JSON.stringify({ character: exp.character, credit, v, clips: done }));
const size = fs.readdirSync(out).reduce((a, f) => a + fs.statSync(path.join(out, f)).size, 0);
console.log(`${exp.character}: ${done.length}/${exp.clips.length} 本を変換(合計 ${(size / 1048576).toFixed(1)}MB)`);
if (missing.length) console.log(`  見つからない番号: ${missing.slice(0, 20).join(', ')}${missing.length > 20 ? ' …' : ''}(その行は端末の声で話します)`);
if (suspicious.length) console.log(`  順番がずれている可能性: \n   ${suspicious.slice(0, 10).join('\n   ')}`);
