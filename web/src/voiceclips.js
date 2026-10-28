// Shared by the app (inlined at build time) and the dev scripts (dev/voice_export.mjs, dev/voice_import.mjs):
// how a spoken line is cut into recorded clips, and what each clip file is called.
// Plain functions only (no import/export), so the same text can be pasted into the page.

// Short fingerprint of a clip's text; the clip file is voice/<character>/<fingerprint>.m4a
function vcHash(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, '0');
}
function vcFill(template, vars, call) {
  return String(template).replace(/\{(\w+)\}/g, (_, k) => (k === 'name' ? call : (vars[k] ?? '')));
}
// Clip texts for one line, in playing order. Souvenir names are separate clips (63 names × 5 line kinds
// would be too many recordings); everything else is one clip per finished sentence.
// Returns null when the line cannot be voiced from recordings (for example a custom way of being called).
function vcClips(template, vars, call, defaultCall) {
  const t = String(template);
  if (t.includes('{name}') && call !== defaultCall) return null;
  if (!t.includes('{item}')) return [vcFill(t, vars, call).trim()].filter(Boolean);
  const out = [];
  t.split('{item}').forEach((part, i) => {
    if (i > 0) out.push(String(vars.item ?? '').trim());
    const txt = vcFill(part, vars, call).replace(/^[、,。!?！？…・〜~\s]+/, '').trim();
    if (txt && /[^、,。!?!?…\s〜~]/.test(txt)) out.push(txt);
  });
  return out.filter(Boolean);
}
