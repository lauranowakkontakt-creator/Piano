const test = require('node:test');
const assert = require('node:assert/strict');
const {load, plain} = require('../helpers/load');

const U = load('js/theory.js', 'js/audio.js', 'js/ui.js', 'js/staff.js');
const {isBlack, chordMarks, chordNames, esc, voicing, midiToFreq, parseChord, noteMidi, noteKey, chordsFor} = U;

test('czarne klawisze', () => {
  assert.deepEqual([60, 61, 62, 63, 64, 65, 66].map(isBlack), [false, true, false, true, false, false, true]);
  assert.equal(isBlack(-1), false);   // B poniżej zera też białe
});

test('chwyt akordu na klawiaturze (pozycja zasadnicza)', () => {
  assert.deepEqual(plain(chordMarks([0, 4, 7], 't')), {60: 't', 64: 't', 67: 't'});
  assert.deepEqual(plain(chordMarks([9, 0, 4], 't')), {69: 't', 72: 't', 76: 't'});
  const b = chordsFor('F#')[6];   // E#° — pisownia z gamy
  assert.deepEqual(Object.values(plain(chordNames(b.notes, b.pcs))), ['E♯', 'G♯', 'B']);
});

test('esc zabezpiecza HTML', () => {
  assert.equal(esc('<b a="1">&\'</b>'), '&lt;b a=&quot;1&quot;&gt;&amp;&#39;&lt;/b&gt;');
  assert.equal(esc(null), '');
});

test('układ akordu: bas oktawę niżej, dźwięki w górę od podstawy', () => {
  assert.deepEqual(plain(voicing([0, 4, 7])), [48, 60, 64, 67]);
  assert.deepEqual(plain(voicing([9, 0, 4])), [45, 69, 72, 76]);   // A: tam, gdzie pokazuje klawiatura (A4)
  assert.deepEqual(plain(voicing([0, 4, 7], 4)), [52, 60, 64, 67]); // C/E: bas E
  for(const t of ['C', 'F#m', 'Bb7', 'B°', 'G/B']){
    const c = parseChord(t);
    const v = voicing(c.pcs, c.bassPc);
    assert.ok(v.every(m => m >= 36 && m <= 84), `${t}: ${v}`);
    assert.ok(v.slice(1).every(m => m > v[0]), `${t}: bas najniżej`);
  }
});

test('nona (add9) idzie nad oktawę, w sus2 zostaje obok podstawy', () => {
  const add9 = voicing(parseChord('Cadd9').pcs);
  assert.ok(add9.includes(74) && !add9.includes(62), `Cadd9: ${add9}`);
  const sus2 = voicing(parseChord('Csus2').pcs);
  assert.ok(sus2.includes(62), `Csus2: ${sus2}`);
});

test('częstotliwości i nuty', () => {
  assert.equal(midiToFreq(69), 440);
  assert.ok(Math.abs(midiToFreq(60) - 261.63) < 0.01);
  assert.equal(noteMidi('C', 4), 60);
  assert.equal(noteMidi('F', 4, '#'), 66);
  assert.equal(noteMidi('B', 3, 'b'), 58);
  assert.equal(noteKey('F', 4, '#'), 'f#/4');
});

test('klawiatura pokazuje dokładnie te dźwięki, które słychać', () => {
  for(const t of ['C', 'A', 'Bb', 'B7', 'F#m', 'Cadd9', 'Gsus4', 'Bdim']){
    const c = parseChord(t);
    const shown = Object.keys(plain(chordMarks(c.pcs, 't'))).map(Number).sort((a, b) => a - b);
    const heard = plain(voicing(c.pcs)).slice(1).sort((a, b) => a - b);
    assert.deepEqual(shown, heard, t);
    assert.ok(shown.every(m => m >= 60 && m <= 86), `${t}: ${shown}`);
  }
});
