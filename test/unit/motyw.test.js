const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {load, plain, ROOT} = require('../helpers/load');

const M = load('js/motyw.js');
const {motywZ} = M;

test('trzy motywy, domyślny jest jasny', () => {
  assert.deepEqual(plain(M.MOTYWY.map(m => m.id)), ['kosc', 'noc', 'szalwia']);
  assert.equal(M.MOTYW_DOMYSLNY, 'kosc');
  for(const m of M.MOTYWY){
    assert.ok(m.name && m.opis, m.id);
    assert.match(m.bar, /^#[0-9a-f]{6}$/);
  }
});

test('motywZ: zapisany wybór wraca, a śmieci dają motyw domyślny', () => {
  assert.equal(motywZ('"noc"'), 'noc');           // tak zapisuje localStorage (JSON)
  assert.equal(motywZ('szalwia'), 'szalwia');
  assert.equal(motywZ(null), 'kosc');
  assert.equal(motywZ(''), 'kosc');
  assert.equal(motywZ('"róż"'), 'kosc');
  assert.equal(motywZ('{zepsute'), 'kosc');
});

test('każdy motyw ma w CSS swój blok z tymi samymi tokenami', () => {
  const css = fs.readFileSync(path.join(ROOT, 'css', 'style.css'), 'utf8');
  const blok = id => {
    const m = css.match(new RegExp(`\\[data-theme="${id}"\\]\\{([^}]*)\\}`));
    assert.ok(m, 'brak bloku motywu ' + id);
    return [...m[1].matchAll(/--([a-z0-9-]+):/g)].map(x => x[1]).sort();
  };
  const kosc = blok('kosc');
  assert.ok(kosc.length > 30, 'tokenów: ' + kosc.length);
  assert.deepEqual(blok('noc'), kosc, 'noc ma inne tokeny niż kość słoniowa');
  assert.deepEqual(blok('szalwia'), kosc, 'szałwia ma inne tokeny niż kość słoniowa');
  for(const m of M.MOTYWY) assert.match(css, new RegExp(`\\.motyw\\[data-motyw="${m.id}"\\]`), 'brak próbki ' + m.id);
});

/* kontrast WCAG: tekst ≥ 4.5:1 na tłach, na których stoi */
const lum = hex => {
  const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(x => x <= .03928 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4);
  return .2126 * c[0] + .7152 * c[1] + .0722 * c[2];
};
const kontrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + .05) / (y + .05); };

test('teksty są czytelne w każdym motywie (kontrast ≥ 4.5:1)', () => {
  const css = fs.readFileSync(path.join(ROOT, 'css', 'style.css'), 'utf8');
  for(const m of M.MOTYWY){
    const blok = css.match(new RegExp(`\\[data-theme="${m.id}"\\]\\{([^}]*)\\}`))[1];
    const t = Object.fromEntries([...blok.matchAll(/--([a-z0-9-]+):(#[0-9a-f]{6});/g)].map(x => [x[1], x[2]]));
    for(const fg of ['ink', 'ink-muted', 'ink-faint', 'accent', 'tonic', 'sub', 'dom', 'out', 'ok', 'bad'])
      for(const bg of ['bg', 'surface', 'surface-sunk'])
        assert.ok(kontrast(t[fg], t[bg]) >= 4.5, `${m.id}: ${fg} na ${bg} = ${kontrast(t[fg], t[bg]).toFixed(2)}`);
    for(const [fg, bg] of [['tonic', 'tonic-soft'], ['sub', 'sub-soft'], ['dom', 'dom-soft'], ['on-accent', 'accent'], ['accent', 'accent-soft']])
      assert.ok(kontrast(t[fg], t[bg]) >= 4.5, `${m.id}: ${fg} na ${bg} = ${kontrast(t[fg], t[bg]).toFixed(2)}`);
  }
});
