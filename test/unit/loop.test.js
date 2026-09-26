const test = require('node:test');
const assert = require('node:assert/strict');
const {load, plain} = require('../helpers/load');

const L = load('js/theory.js', 'js/audio.js', 'js/ui.js', 'js/views/piosenki.js', 'js/loop.js');
const {parseChord: P, chordType, relation, commonTones, smoothVoicing, loopVoicings, inversionName, suggestNext,
  orderLoop, guessLoopKey, transposeChord, spellChord, LOOP_PRESETS, LOOP_ROOTS, LOOP_KINDS, CHORD_TYPES} = L;
const chords = s => s.split(' ').map(P);

test('rodzaje akordów (kolory jak na obrazkach)', () => {
  const t = s => chordType(P(s));
  assert.deepEqual(['C', 'Cmaj7', 'Cadd9', 'Am', 'Am7', 'G7', 'G7sus4', 'Bdim', 'Bm7b5', 'C+', 'Csus2', 'C5'].map(t),
    ['mj', 'mj', 'mj', 'mn', 'mn', 'd7', 'd7', 'di', 'di', 'au', 'su', 'su']);
  for(const k of ['mj', 'mn', 'd7', 'au', 'di', 'su']) assert.ok(CHORD_TYPES[k].color.startsWith('#'), k);
});

test('baza akordów: każdy akord z tabeli jest rozpoznawany', () => {
  assert.equal(LOOP_ROOTS.length, 12);
  for(const r of LOOP_ROOTS) for(const k of LOOP_KINDS) assert.ok(P(r + k.suf), r + k.suf);
});

test('relacje między akordami', () => {
  assert.equal(relation(P('G7'), P('C')).kind, 'dom');
  assert.equal(relation(P('G7'), P('C')).strong, true);
  assert.equal(relation(P('C'), P('F')).kind, 'dom');
  assert.equal(relation(P('C'), P('Cm')).kind, 'mode');
  assert.equal(relation(P('C'), P('Am')).kind, 'near');
  assert.equal(relation(P('C'), P('F#')).kind, 'jump');
  assert.deepEqual(plain(commonTones(P('C'), P('Am'))), [0, 4]);
});

test('pisownia dźwięków od podstawy akordu', () => {
  const sp = s => Object.values(plain(spellChord(P(s)))).sort();
  assert.deepEqual(sp('A7'), ['A', 'C#', 'E', 'G']);
  assert.deepEqual(sp('Bb7'), ['Ab', 'Bb', 'D', 'F']);
  assert.deepEqual(sp('Ebm'), ['Bb', 'Eb', 'Gb']);
  assert.deepEqual(sp('F#dim'), ['A', 'C', 'F#']);
  assert.deepEqual(sp('E/G#'), ['B', 'E', 'G#']);
});

test('płynne prowadzenie głosów: C → G → Am → F rusza ręką o małe kroki', () => {
  const v = plain(loopVoicings(chords('C G Am F')));
  assert.equal(v.length, 4);
  for(let i = 0; i < v.length; i++){
    const a = v[i], b = v[(i + 1) % v.length];
    const move = b.reduce((s, x) => s + Math.min(...a.map(y => Math.abs(x - y))), 0);
    assert.ok(move <= 6, `${a} → ${b}: ruch ${move} półtonów`);   // każdy palec max ~2 półtony
    assert.ok(b.every(m => m >= 52 && m <= 81), `${b} poza zakresem prawej ręki`);
  }
  // wspólny dźwięk zostaje w tym samym miejscu (C i Am mają C i E)
  const c = v[0], am = v[2];
  assert.ok(c.filter(m => am.includes(m)).length >= 1);
});

test('chwyt ma dokładnie dźwięki akordu (maks. 4 palce)', () => {
  for(const t of ['C', 'F#m', 'Bb7', 'Dm7', 'Cmaj9', 'G13', 'Bdim7']){
    const c = P(t), v = plain(smoothVoicing(c, null));
    assert.ok(v.length >= 3 && v.length <= 4, `${t}: ${v}`);
    for(const m of v) assert.ok(c.pcs.includes(m % 12), `${t}: ${m} nie należy do akordu`);
    for(let i = 1; i < v.length; i++) assert.ok(v[i] > v[i - 1], `${t}: rosnąco`);
  }
  assert.equal(inversionName(P('F'), [60, 65, 69]), '2. przewrót');
  assert.equal(inversionName(P('C'), [60, 64, 67]), 'pozycja zasadnicza');
});

test('tonacja pętli nie zależy od kolejności akordów', () => {
  assert.equal(guessLoopKey(chords('C G Am F')), 'C');
  assert.equal(guessLoopKey(chords('Am F C G')), 'C');
  assert.equal(guessLoopKey(chords('Am Dm E7')), 'Am');
  assert.equal(guessLoopKey(chords('C A7 D7 G7')), 'C');
  assert.equal(guessLoopKey(chords('D G/D Bm7 Em7 G A')), 'D');
  assert.equal(guessLoopKey(chords('C#m7 Bsus4 E/G# Asus2')), 'E');
});

test('układanie w pętlę: start od toniki, dominanta rozwiązuje się', () => {
  assert.deepEqual(plain(orderLoop(['G7', 'Dm7', 'Cmaj7']).order), ['Cmaj7', 'Dm7', 'G7']);
  assert.deepEqual(plain(orderLoop(['D7', 'C', 'G7', 'A7']).order), ['C', 'A7', 'D7', 'G7']);
  const pop = plain(orderLoop(['G', 'F', 'C', 'Am']));
  assert.equal(pop.key, 'C');
  assert.equal(pop.order[0], 'C');
  assert.equal(pop.order.length, 4);
  // dużo akordów: bez wysypania i bez gubienia akordów
  const many = ['C', 'D', 'E', 'F', 'G', 'A', 'Bb', 'Dm', 'Em', 'Am'];
  assert.deepEqual(plain(orderLoop(many).order).sort(), many.slice().sort());
});

test('podpowiedzi „co dalej"', () => {
  const names = s => plain(suggestNext(P(s))).map(x => x.name);
  assert.ok(names('G7').includes('C'), 'G7 → C');
  assert.ok(names('C').includes('Am') && names('C').includes('Em') && names('C').includes('Cm'), 'drzewko C → Am, Em, Cm');
  assert.ok(names('Am').includes('C'));
  assert.ok(names('Bdim').includes('C'));
  assert.ok(names('C').includes('G7'), 'dominanta do C');
  for(const t of ['C', 'F#m7', 'Bb7', 'Ebdim', 'Aaug', 'Dsus4']) for(const n of names(t)) assert.ok(P(n), `${t} → ${n}`);
});

test('transpozycja zachowuje rodzaj akordu i bas', () => {
  assert.equal(transposeChord('C#m7', 2), 'D#m7');
  assert.equal(transposeChord('E/G#', 1), 'F/A');
  assert.equal(transposeChord('Bb', 2), 'C');
  assert.equal(transposeChord('Asus2', -2), 'Gsus2');
  assert.equal(transposeChord('xyz', 1), 'xyz');
  for(let n = -11; n <= 11; n++) assert.equal(P(transposeChord('Dm7', n)).q, 'min');
});

test('gotowe pętle są poprawne', () => {
  for(const p of LOOP_PRESETS){
    assert.ok(p.chords.length >= 3, p.name);
    for(const t of p.chords) assert.ok(P(t), `${p.name}: ${t}`);
  }
});
