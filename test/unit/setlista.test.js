const test = require('node:test');
const assert = require('node:assert/strict');
const {load, plain} = require('../helpers/load');

const S = load('js/theory.js', 'js/loop.js', 'js/lyrics.js', 'js/views/piosenki.js', 'js/views/przejscia.js', 'js/setlista.js');
const {transposeKey, shiftBetween, shiftToMatch, songChordTexts, songChordsIn, setlistTransition, wybraneOpcja,
  sanitizeSetlisty, przesun, setlistaNowa, parseChord, functionIn} = S;

test('transposeKey: dur zostaje dur, moll zostaje moll', () => {
  assert.equal(transposeKey('C', 2), 'D');
  assert.equal(transposeKey('C', -2), 'Bb');
  assert.equal(transposeKey('G', 0), 'G');
  assert.equal(transposeKey('Am', 3), 'Cm');
  assert.equal(transposeKey('Em', -2), 'Dm');
  assert.equal(transposeKey('D', 12), 'D');
});

test('shiftBetween: najkrótsza droga, a shiftToMatch dopasowuje do tych samych akordów', () => {
  assert.equal(shiftBetween('C', 'D'), 2);
  assert.equal(shiftBetween('C', 'A'), -3);
  assert.equal(shiftBetween('G', 'F#'), -1);
  assert.equal(shiftBetween('C', 'F#'), 6);
  // a-moll po G-dur → e-moll (równoległa do G)
  assert.equal(transposeKey('Am', shiftToMatch('Am', 'G')), 'Em');
  assert.equal(transposeKey('E', shiftToMatch('E', 'C')), 'C');
});

test('akordy piosenki: z tekstu, a bez tekstu z pola akordów; przeniesione', () => {
  const zTekstem = {key:'C', lyrics:'[C]Wlazł kotek [G]na płotek', chords:'Am F'};
  assert.deepEqual(plain(songChordTexts(zTekstem)), ['C', 'G']);
  const bezTekstu = {key:'C', lyrics:'', chords:'[Zwrotka] C Am | F G'};
  assert.deepEqual(plain(songChordTexts(bezTekstu)), ['C', 'Am', 'F', 'G']);
  assert.deepEqual(plain(songChordsIn(bezTekstu, 2)), ['D', 'Bm', 'G', 'A']);
  assert.deepEqual(plain(songChordTexts(null)), []);
});

test('ta sama gama (także równoległa moll) → można od razu', () => {
  for(const [a, b] of [['D', 'D'], ['C', 'Am'], ['Em', 'G']]){
    const t = setlistTransition(a, b, null, null);
    assert.equal(t.ta, true, `${a} → ${b}`);
    assert.equal(t.opcje[0].id, 'od-razu');
    assert.deepEqual(plain(t.opcje[0].chords), []);
  }
});

test('zmiana tonacji: każdy wariant kończy się dominantą nowej tonacji', () => {
  for(const [a, b] of [['C', 'D'], ['G', 'Eb'], ['C', 'F#'], ['G', 'F'], ['Am', 'Em'], ['D', 'Bb']]){
    const t = setlistTransition(a, b, a.replace(/m$/, '') + (a.endsWith('m') ? 'm' : ''), b);
    assert.equal(t.ta, false, `${a} → ${b}`);
    assert.ok(t.opcje.length >= 2, `${a} → ${b}: wariantów ${t.opcje.length}`);
    for(const o of t.opcje){
      assert.ok(o.chords.length >= 1 && o.chords.length <= 6, `${a} → ${b} ${o.id}: ${o.chords.join(' ')}`);
      const ost = parseChord(o.chords[o.chords.length - 1]);
      assert.equal(functionIn(ost, b).fn, 'd', `${a} → ${b} ${o.id}: ostatni ${o.chords.at(-1)} nie jest dominantą`);
      assert.ok(o.name && o.opis, o.id);
    }
    // warianty się nie powtarzają
    const klucze = t.opcje.map(o => o.chords.join(' '));
    assert.equal(new Set(klucze).size, klucze.length, `${a} → ${b}: powtórzony wariant`);
  }
});

test('gładko: pierwszy akord pasuje do obu tonacji', () => {
  const t = setlistTransition('C', 'G', 'C', 'G');
  const g = t.opcje.find(o => o.id === 'gladko');
  assert.ok(g, 'brak wariantu gładko');
  const c = parseChord(g.chords[0]);
  assert.notEqual(functionIn(c, 'C').fn, 'o');
  assert.notEqual(functionIn(c, 'G').fn, 'o');
});

test('przejście nie powtarza ostatniego akordu ani pierwszego następnej', () => {
  const t = setlistTransition('C', 'G', 'D', 'D7');
  for(const o of t.opcje){
    assert.notEqual(o.chords[0], 'D', o.id);
  }
});

test('wybrany wariant albo pierwszy', () => {
  const t = setlistTransition('C', 'D', 'C', 'D');
  assert.equal(wybraneOpcja(t, 'szybko').id, 'szybko');
  assert.equal(wybraneOpcja(t, 'nie-ma').id, t.opcje[0].id);
  assert.equal(wybraneOpcja(t, '').id, t.opcje[0].id);
});

test('sanitizeSetlisty: zepsute dane nie wywracają zakładki', () => {
  assert.deepEqual(plain(sanitizeSetlisty(null)), []);
  assert.deepEqual(plain(sanitizeSetlisty('x')), []);
  const ok = plain(sanitizeSetlisty([
    {id:'a', name:'Niedziela', items:[{songId:'s1', shift:2, przejscie:'gladko'}, {songId:''}, null, {songId:'s2', shift:99}]},
    {name:'bez id'}, 5,
  ]));
  assert.equal(ok.length, 1);
  assert.deepEqual(ok[0].items, [{songId:'s1', shift:2, przejscie:'gladko'}, {songId:'s2', shift:0, przejscie:''}]);
  assert.equal(plain(sanitizeSetlisty([{id:'b', name:''}]))[0].name, 'Setlista');
});

test('przesun: zmiana kolejności bez psucia listy', () => {
  assert.deepEqual(plain(przesun(['a', 'b', 'c'], 0, 1)), ['b', 'a', 'c']);
  assert.deepEqual(plain(przesun(['a', 'b', 'c'], 2, -1)), ['a', 'c', 'b']);
  assert.deepEqual(plain(przesun(['a', 'b', 'c'], 0, -1)), ['a', 'b', 'c']);
  assert.deepEqual(plain(przesun(['a', 'b', 'c'], 2, 1)), ['a', 'b', 'c']);
  const n = setlistaNowa('X');
  assert.match(n.id, /^sl-/); assert.equal(n.name, 'X'); assert.deepEqual(plain(n.items), []);
});
