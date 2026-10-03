const test = require('node:test');
const assert = require('node:assert/strict');
const {load, plain} = require('../helpers/load');

const A = load('js/theory.js', 'js/views/piosenki.js');
const {SONG_KEYS, SEED_SONGS, guessKey, sanitizeSong, keyNameLabel, parseChord, parseSongText, isKnownKey} = A;

const chords = s => s.split(/\s+/).map(t => parseChord(t));

test('lista tonacji: 12 durowych + 12 molowych, bez powtórek, wszystkie obsługiwane', () => {
  assert.equal(SONG_KEYS.length, 24);
  assert.equal(new Set(SONG_KEYS.map(k => k.v)).size, 24);
  for(const k of SONG_KEYS) assert.ok(isKnownKey(k.v), k.v);
  assert.equal(keyNameLabel('Am'), 'a-moll');
  assert.equal(keyNameLabel('F#m'), 'f♯-moll');
  assert.equal(keyNameLabel('Eb'), 'E♭-dur');
});

test('piosenki startowe: każdy akord jest rozpoznany, a tonacja jest wśród podpowiedzi', () => {
  for(const s of SEED_SONGS){
    const lines = parseSongText(s.chords);
    const junk = lines.flatMap(l => l.tokens.filter(t => t.junk).map(t => t.junk));
    assert.deepEqual(plain(junk), [], `${s.title}: nierozpoznane`);
    assert.ok(SONG_KEYS.some(k => k.v === s.key), `${s.title}: tonacja ${s.key}`);
    const all = lines.flatMap(l => l.tokens.filter(t => t.chord).map(t => t.chord));
    const top = guessKey(all).map(g => g.v);
    assert.ok(top.includes(s.key), `${s.title}: ${s.key} nie ma w ${top}`);
  }
});

test('guessKey: zgaduje tonację po akordach', () => {
  assert.equal(guessKey(chords('C G Am F C'))[0].v, 'C');
  assert.equal(guessKey(chords('G C D G'))[0].v, 'G');
  assert.equal(guessKey(chords('Am Dm E Am'))[0].v, 'Am');
  assert.equal(guessKey(chords('Bb Eb F Bb'))[0].v, 'Bb');
  assert.equal(guessKey([]).length, 0);
  const g = guessKey(chords('C F G C'))[0];
  assert.equal(g.fit, 4);
});

test('sanitizeSong: przyjmuje poprawną piosenkę', () => {
  const s = plain(sanitizeSong({id: 'x1', title: 'T', artist: 'A', key: 'Am', bpm: 120, beats: 2, chords: 'Am', lyrics: '[Am]tekst', notes: 'n', audioName: 'a.mp3', updated: 5, junk: 1}));
  assert.deepEqual(s, {id: 'x1', title: 'T', artist: 'A', key: 'Am', bpm: 120, beats: 2, chords: 'Am', lyrics: '[Am]tekst', notes: 'n', audioName: 'a.mp3', updated: 5});
});

test('sanitizeSong: odrzuca śmieci i naprawia złe pola', () => {
  for(const bad of [null, undefined, 5, 'x', [], {}, {id: ''}, {id: '  '}, {id: {}}]) assert.equal(sanitizeSong(bad), null, JSON.stringify(bad));
  const s = plain(sanitizeSong({id: 7, title: 42, key: '<img src=x onerror=alert(1)>', bpm: 'szybko', beats: 99, chords: ['C'], lyrics: {}, notes: null}));
  assert.deepEqual(s, {id: '7', title: '', artist: '', key: 'C', bpm: 90, beats: 4, chords: '', lyrics: '', notes: ''});
  assert.equal(sanitizeSong({id: 'a', key: 'toString'}).key, 'C');
});
