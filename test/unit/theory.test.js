const test = require('node:test');
const assert = require('node:assert/strict');
const {load, plain} = require('../helpers/load');

const T = load('js/theory.js');
const {KEYS, ALL_KEYS, ORDER, REL_MINOR, PC, chordsFor, sharedWith, fmt, keyLabel,
  parseChord, majorOfKey, isKnownKey, functionIn, parseSongText, majorScalePcs, PROGS} = T;

const pcOf = n => PC[n];
const intervals = pcs => pcs.slice(1).map(p => (p - pcs[0] + 12) % 12);

test('każda gama durowa ma wzór cały-cały-pół-cały-cały-cały-pół i 7 różnych liter', () => {
  for(const k of Object.keys(KEYS)){
    const sc = KEYS[k];
    assert.equal(sc.length, 7, k);
    assert.equal(new Set(sc.map(n => n[0])).size, 7, `${k}: litery się powtarzają`);
    const steps = sc.map((n, i) => (pcOf(sc[(i + 1) % 7]) - pcOf(n) + 12) % 12);
    assert.deepEqual(plain(steps), [2, 2, 1, 2, 2, 2, 1], k);
  }
});

test('koło kwintowe: każda następna gama jest kwintę wyżej, a ORDER to podzbiór', () => {
  assert.equal(ALL_KEYS.length, 12);
  ALL_KEYS.forEach((k, i) => {
    const next = ALL_KEYS[(i + 1) % 12];
    assert.equal((pcOf(next) - pcOf(k) + 12) % 12, 7, `${k} → ${next}`);
  });
  for(const k of ORDER) assert.ok(ALL_KEYS.includes(k), k);
  assert.deepEqual([...ALL_KEYS].sort(), Object.keys(KEYS).sort());
});

test('równoległa molowa leży tercję małą pod toniką (vi stopień)', () => {
  for(const k of ALL_KEYS){
    assert.equal(pcOf(REL_MINOR[k]), (pcOf(k) + 9) % 12, k);
    assert.equal(REL_MINOR[k], KEYS[k][5], `${k}: pisownia jak w gamie`);
  }
});

test('akordy gamy: I dur, ii moll, iii moll, IV dur, V dur, vi moll, vii° zmniejszony', () => {
  const want = [[4, 7], [3, 7], [3, 7], [4, 7], [4, 7], [3, 7], [3, 6]];
  for(const k of ALL_KEYS){
    const ch = chordsFor(k);
    assert.deepEqual(plain(ch.map(c => intervals(c.pcs))), want, k);
    assert.deepEqual(plain(ch.map(c => c.fn)), ['t', 's', 't', 's', 'd', 't', 'd'], k);
  }
  assert.deepEqual(plain(chordsFor('C').map(c => c.name)), ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'B°']);
  assert.deepEqual(plain(chordsFor('F#').map(c => c.name)), ['F#', 'G#m', 'A#m', 'B', 'C#', 'D#m', 'E#°']);
});

test('progresje odwołują się tylko do istniejących stopni', () => {
  for(const p of PROGS) for(const d of p.deg) assert.ok(d >= 0 && d < 7, p.name);
});

test('wspólne akordy sąsiednich gam (mosty)', () => {
  assert.deepEqual(plain(sharedWith('C', 'G').map(c => c.name)), ['C', 'Em', 'G', 'Am']);
  assert.deepEqual(plain(sharedWith('C', 'F').map(c => c.name)), ['C', 'Dm', 'F', 'Am']);
  // sąsiednie gamy na kole kwintowym mają zawsze 4 wspólne trójdźwięki
  ALL_KEYS.forEach((k, i) => assert.equal(sharedWith(k, ALL_KEYS[(i + 1) % 12]).length, 4, k));
});

test('fmt zamienia # i b na ♯ i ♭ tylko po nazwie dźwięku', () => {
  assert.equal(fmt('F#m7'), 'F♯m7');
  assert.equal(fmt('Bb'), 'B♭');
  assert.equal(fmt('Cm7b5'), 'Cm7b5');
  assert.equal(fmt(null), '');
  assert.equal(keyLabel('Eb'), 'E♭-dur');
});

test('parseChord: rodzaje akordów i ich dźwięki', () => {
  const cases = {
    'C':       ['maj', [0, 4, 7]],
    'Cmaj':    ['maj', [0, 4, 7]],
    'Am':      ['min', [9, 0, 4]],
    'Amin':    ['min', [9, 0, 4]],
    'F#m':     ['min', [6, 9, 1]],
    'F♯m':     ['min', [6, 9, 1]],
    'Bb':      ['maj', [10, 2, 5]],
    'B♭':      ['maj', [10, 2, 5]],
    'G7':      ['maj', [7, 11, 2, 5]],
    'Cmaj7':   ['maj', [0, 4, 7, 11]],
    'CM7':     ['maj', [0, 4, 7, 11]],
    'CΔ7':     ['maj', [0, 4, 7, 11]],
    'Cmaj9':   ['maj', [0, 4, 7, 11, 2]],
    'Em7':     ['min', [4, 7, 11, 2]],
    'Cm(maj7)':['min', [0, 3, 7, 11]],
    'C6':      ['maj', [0, 4, 7, 9]],
    'Am6':     ['min', [9, 0, 4, 6]],
    'C9':      ['maj', [0, 4, 7, 10, 2]],
    'C6/9':    ['maj', [0, 4, 7, 9, 2]],
    'C5':      ['pow', [0, 7]],
    'Bdim':    ['dim', [11, 2, 5]],
    'B°':      ['dim', [11, 2, 5]],
    'Bdim7':   ['dim', [11, 2, 5, 8]],
    'Bm7b5':   ['dim', [11, 2, 5, 9]],
    'Bø':      ['dim', [11, 2, 5, 9]],
    'Caug':    ['aug', [0, 4, 8]],
    'C+':      ['aug', [0, 4, 8]],
    'Csus2':   ['sus2', [0, 2, 7]],
    'Csus4':   ['sus4', [0, 5, 7]],
    'Csus':    ['sus4', [0, 5, 7]],
    'C7sus4':  ['sus4', [0, 5, 7, 10]],
    'D2':      ['sus2', [2, 4, 9]],
    'Cadd9':   ['maj', [0, 4, 7, 2]],
    'Gadd4':   ['maj', [7, 11, 2, 0]],
    'am':      ['min', [9, 0, 4]],
  };
  for(const [txt, [q, pcs]] of Object.entries(cases)){
    const c = parseChord(txt);
    assert.ok(c, `${txt} nie został rozpoznany`);
    assert.equal(c.q, q, `${txt}: rodzaj`);
    assert.deepEqual(plain(c.pcs), pcs, `${txt}: dźwięki`);
  }
});

test('parseChord: bas po ukośniku', () => {
  const c = parseChord('C/E');
  assert.equal(c.bass, 'E');
  assert.equal(c.bassPc, 4);
  assert.deepEqual(plain(c.pcs), [0, 4, 7]);
  const d = parseChord('Em7/B');
  assert.equal(d.q, 'min');
  assert.equal(d.bassPc, 11);
  assert.equal(parseChord('E/G#').bassPc, 8);
  assert.equal(parseChord('C').bassPc, null);
});

test('parseChord: słowa i śmieci to nie akordy', () => {
  for(const t of ['', ' ', 'Every', 'Hello', 'Hej', 'hm', 'Cxyz', 'Am7x', 'X7', '|', '[Refren]', 'C/X', null, undefined]){
    assert.equal(parseChord(t), null, `„${t}" nie powinno być akordem`);
  }
});

test('parseChord: nona leży nad oktawą w odstępach (iv), podstawa zawsze pierwsza', () => {
  assert.deepEqual(plain(parseChord('Cadd9').iv), [0, 4, 7, 14]);
  for(const t of ['C', 'Am7', 'G/B', 'Bø', 'Dsus4']) assert.equal(parseChord(t).pcs[0], parseChord(t).rootPc, t);
});

test('majorOfKey i isKnownKey', () => {
  assert.equal(majorOfKey('C'), 'C');
  assert.equal(majorOfKey('Am'), 'C');
  assert.equal(majorOfKey('C#m'), 'E');
  assert.equal(majorOfKey('D#m'), 'F#');
  assert.equal(majorOfKey('Ebm'), 'F#');   // ta sama molowa, inna pisownia
  assert.equal(majorOfKey('Bbm'), 'Db');
  assert.equal(majorOfKey('Gb'), 'F#');
  assert.equal(majorOfKey('bzdura'), 'C');
  assert.equal(majorOfKey('constructor'), 'C');
  assert.equal(majorOfKey(undefined), 'C');
  assert.ok(isKnownKey('Eb') && isKnownKey('Gm') && isKnownKey('Ebm'));
  assert.ok(!isKnownKey('X') && !isKnownKey('') && !isKnownKey('toString') && !isKnownKey('<b>x</b>'));
});

test('functionIn: role akordów w dur', () => {
  const f = (ch, k) => plain(functionIn(parseChord(ch), k));
  assert.deepEqual(f('C', 'C'), {fn: 't', rn: 'I'});
  assert.deepEqual(f('Am', 'C'), {fn: 't', rn: 'vi'});
  assert.deepEqual(f('Dm7', 'C'), {fn: 's', rn: 'ii'});
  assert.deepEqual(f('F', 'C'), {fn: 's', rn: 'IV'});
  assert.deepEqual(f('G7', 'C'), {fn: 'd', rn: 'V'});
  assert.deepEqual(f('Bdim', 'C'), {fn: 'd', rn: 'vii°'});
  assert.deepEqual(f('D', 'C'), {fn: 'o', rn: 'V/V'});
  assert.deepEqual(f('Eb', 'C'), {fn: 'o', rn: ''});
  assert.deepEqual(f('Cm', 'C'), {fn: 'o', rn: ''});
  assert.deepEqual(f('Gsus4', 'C'), {fn: 'd', rn: 'V'});     // sus: po podstawie
  assert.deepEqual(f('G5', 'C'), {fn: 'd', rn: 'V'});
  assert.deepEqual(f('Bm7', 'D'), {fn: 't', rn: 'vi'});
  assert.deepEqual(f('G/D', 'D'), {fn: 's', rn: 'IV'});
});

test('functionIn: role akordów w moll', () => {
  const f = (ch, k) => plain(functionIn(parseChord(ch), k));
  assert.deepEqual(f('Am', 'Am'), {fn: 't', rn: 'i'});
  assert.deepEqual(f('Dm', 'Am'), {fn: 's', rn: 'iv'});
  assert.deepEqual(f('Em', 'Am'), {fn: 'd', rn: 'v'});
  assert.deepEqual(f('E', 'Am'), {fn: 'd', rn: 'V'});         // durowa dominanta
  assert.deepEqual(f('E7', 'Am'), {fn: 'd', rn: 'V'});
  assert.deepEqual(f('G#dim', 'Am'), {fn: 'd', rn: 'vii°'});  // dźwięk prowadzący
  assert.deepEqual(f('C', 'Am'), {fn: 't', rn: 'III'});
  assert.deepEqual(f('F#', 'Am'), {fn: 'o', rn: ''});
  assert.deepEqual(f('A#', 'D#m'), {fn: 'd', rn: 'V'});
});

test('functionIn nie wysypuje się na złych danych', () => {
  assert.deepEqual(plain(functionIn(null, 'C')), {fn: 'o', rn: ''});
  assert.doesNotThrow(() => functionIn(parseChord('C'), 'bzdura'));
  assert.doesNotThrow(() => functionIn(parseChord('C'), undefined));
});

test('parseSongText: etykiety, kreski taktowe, nierozpoznane słowa', () => {
  const lines = plain(parseSongText('[Zwrotka] C G Am F | C G F F\n\n  \n[Refren] F G la C'));
  assert.equal(lines.length, 2);
  assert.equal(lines[0].label, 'Zwrotka');
  assert.equal(lines[0].tokens.length, 9);
  assert.deepEqual(lines[0].tokens[4], {bar: true});
  assert.equal(lines[1].label, 'Refren');
  assert.deepEqual(lines[1].tokens[2], {junk: 'la'});
  assert.deepEqual(plain(parseSongText('')), []);
  assert.deepEqual(plain(parseSongText(null)), []);
});

test('majorScalePcs: gama z dowolnego dźwięku', () => {
  assert.deepEqual(plain(majorScalePcs(0)), [0, 2, 4, 5, 7, 9, 11]);
  for(const k of ALL_KEYS) assert.deepEqual(plain(majorScalePcs(PC[k])), plain(KEYS[k].map(n => PC[n])), k);
});

test('parseChord: polskie H to międzynarodowe B', () => {
  for(const [pl, intl] of [['H','B'], ['Hm','Bm'], ['H7','B7'], ['Hmaj7','Bmaj7'], ['Hm7b5','Bm7b5'], ['C/H','C/B']]){
    assert.deepEqual(plain(parseChord(pl)), plain(parseChord(intl)), pl);
    assert.equal(parseChord(pl).text, intl, `${pl} zapisuje się dalej jako ${intl}`);
  }
  // „B" zostaje B (polskie H), a nie B-flat — tak jak w śpiewnikach międzynarodowych
  assert.equal(parseChord('B').rootPc, 11);
  assert.equal(parseChord('Bb').rootPc, 10);
});
