const test = require('node:test');
const assert = require('node:assert/strict');
const {load, plain} = require('../helpers/load');

const P = load('js/theory.js', 'js/views/piosenki.js', 'js/views/przejscia.js');
const {analyzeSeq, routeKeys, bridgeFast, bridgeSmooth, dominantOf, fifthsDist, parallelMinor, pivotChord, bestKeyFor, parseChord, functionIn} = P;

const statuses = items => items.map(i => i.status);

test('dominanta tonacji (w moll durowa)', () => {
  assert.equal(dominantOf('C'), 'G');
  assert.equal(dominantOf('D'), 'A');
  assert.equal(dominantOf('Am'), 'E');
  assert.equal(dominantOf('Em'), 'B');
});

test('odległość i droga po kole kwintowym', () => {
  assert.equal(fifthsDist('C', 'G'), 1);
  assert.equal(fifthsDist('C', 'F'), 1);
  assert.equal(fifthsDist('C', 'F#'), 6);
  assert.equal(fifthsDist('C', 'Am'), 0);
  assert.deepEqual(plain(routeKeys('C', 'D')), ['G', 'D']);
  assert.deepEqual(plain(routeKeys('C', 'Bb')), ['F', 'Bb']);
  assert.deepEqual(plain(routeKeys('C', 'Em')), ['Em']);
});

test('jednoimienna molowa', () => {
  assert.equal(parallelMinor('C'), 'Cm');
  assert.equal(parallelMinor('A'), 'Am');
  assert.equal(parallelMinor('Am'), null);
});

test('most między gamami: wspólny akord, który w nowej gamie jest ruchem', () => {
  const p = pivotChord('C', 'G');
  const c = parseChord(p);
  assert.notEqual(functionIn(c, 'C').fn, 'o', `${p} ma pasować do C`);
  assert.equal(functionIn(c, 'G').fn, 's', `${p} ma być subdominantą w G`);
});

test('wszystko w jednej gamie → same „ok"', () => {
  const r = analyzeSeq(['C', 'Am', 'F', 'G', 'C'], 'C');
  assert.deepEqual(plain(statuses(r)), ['ok', 'ok', 'ok', 'ok', 'ok']);
  assert.ok(r.every(i => i.key === 'C'));
});

test('zmiana gamy przez most jest płynna („mod")', () => {
  const r = analyzeSeq(['C', 'G', 'D', 'G'], 'C');
  assert.equal(r[2].status, 'mod');
  assert.equal(r[2].key, 'G');
  assert.equal(r[2].from, 'C');
  assert.equal(r[2].rn, 'V');
});

test('akord spoza gamy bez mostu → czerwony, z podpowiedziami', () => {
  const r = analyzeSeq(['C', 'Am', 'F', 'G', 'C', 'Eb', 'F', 'G'], 'C');
  const eb = r[5];
  assert.equal(eb.status, 'bad');
  assert.equal(eb.from, 'C');
  assert.ok(eb.smooth.length > 0, 'jest płynna droga');
  assert.ok(eb.fast.length > 0, 'jest szybka droga');
  assert.equal(eb.borrowed, 'Cm', 'E♭ to akord pożyczony z c-moll');
  // podpowiedź nie może kończyć się tym samym akordem, do którego idziemy
  assert.notEqual(parseChord(eb.smooth.at(-1).replace('°', 'dim')).rootPc, parseChord('Eb').rootPc);
  // szybka droga to dominanta nowej gamy
  assert.equal(eb.fast[0], dominantOf(eb.key));
});

test('G → E w C to płynne wejście do a-moll (G jest wspólne), a nie błąd', () => {
  const r = analyzeSeq(['C', 'G', 'E'], 'C');
  assert.equal(r[2].status, 'mod');
  assert.equal(r[2].key, 'Am');
  assert.equal(r[2].rn, 'V');
});

test('wstawienie podpowiedzi naprawia przejście', () => {
  for(const [seq, target] of [[['C', 'G', 'C', 'Eb'], 'Eb'], [['C', 'Am', 'F', 'G', 'C', 'F#'], 'F#'], [['G', 'D', 'G', 'Bb'], 'Bb']]){
    const items = analyzeSeq(seq, seq[0]);
    const bad = items.at(-1);
    assert.equal(bad.status, 'bad', seq.join(' '));
    const fixed = [...seq.slice(0, -1), ...bad.smooth.map(n => n.replace('°', 'dim')), target];
    const r = analyzeSeq(fixed, seq[0]);
    assert.ok(!r.some(i => i.status === 'bad'), fixed.join(' ') + ' → ' + statuses(r));
  }
});

test('powrót do domu po dominancie gamy startowej', () => {
  const r = analyzeSeq(['C', 'G', 'D', 'G', 'C', 'G', 'C'], 'C');
  assert.equal(r.at(-1).key, 'C');
});

test('śmieci i akordy spoza wszystkich gam', () => {
  const r = analyzeSeq(['C', 'xyz', 'Caug'], 'C');
  assert.equal(r[1].status, 'junk');
  assert.equal(r[2].status, 'none');
  assert.equal(bestKeyFor(parseChord('Caug'), 'C', 'C'), null);
});

test('szybka droga pomija dominantę, jeśli to właśnie ten akord', () => {
  assert.deepEqual(plain(bridgeFast('C', 'G', 'D')), []);
  assert.deepEqual(plain(bridgeFast('C', 'G', 'G')), ['D']);
  assert.ok(bridgeSmooth('C', 'D', 'D').length > 0);
});
