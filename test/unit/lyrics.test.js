const test = require('node:test');
const assert = require('node:assert/strict');
const {load, plain} = require('../helpers/load');

const L = load('js/theory.js', 'js/audio.js', 'js/ui.js', 'js/loop.js', 'js/lyrics.js', 'js/views/piosenki.js');
const {parseLyrics, lyricsChords, lyricsHasChords, lyricsPlain, transposeLyrics, SEED_SONGS, functionIn} = L;

// skrót: linia → [[akord albo null, tekst], …]
const linia = (txt) => plain(parseLyrics(txt)[0].parts.map(p => [p.chord && p.chord.text, p.text]));

test('akord w nawiasie staje przed sylabą, która po nim idzie', () => {
  assert.deepEqual(linia('[C]Wlazł kotek na [G7]płotek'), [['C', 'Wlazł kotek na '], ['G7', 'płotek']]);
  assert.deepEqual(linia('Ty je[D]steś'), [[null, 'Ty je'], ['D', 'steś']]);
  assert.deepEqual(linia('bez akordów'), [[null, 'bez akordów']]);
  assert.deepEqual(linia('[Am]'), [['Am', '']], 'sam akord bez tekstu też jest OK');
});

test('etykieta części kontra akord w nawiasie', () => {
  const l = plain(parseLyrics('[Zwrotka]\n[Refren 2]\n[C]\n[Bm7]'));
  assert.equal(l[0].label, 'Zwrotka');
  assert.equal(l[1].label, 'Refren 2');
  assert.equal(l[2].label, undefined, 'samo [C] to akord, nie nagłówek');
  assert.equal(l[2].parts[0].chord.text, 'C');
  assert.equal(l[3].parts[0].chord.text, 'Bm7');
});

test('puste linie zostają — rozdzielają zwrotki', () => {
  const l = plain(parseLyrics('[C]raz\n\n[G]dwa'));
  assert.equal(l.length, 3);
  assert.equal(l[1].empty, true);
  assert.equal(lyricsPlain('[C]raz\n\n[G]dwa'), 'raz\n\ndwa');
});

test('nierozpoznany nawias zostaje zwykłym tekstem', () => {
  assert.deepEqual(linia('[x2] śpiewaj [C]dalej'), [[null, '[x2] śpiewaj '], ['C', 'dalej']]);
  assert.deepEqual(linia('koniec [bis]'), [[null, 'koniec [bis]']]);
  assert.deepEqual(plain(lyricsChords('[x2] nic tu nie ma')), []);
});

test('polskie H działa też w tekście', () => {
  assert.equal(parseLyrics('[H]Hej')[0].parts[0].chord.text, 'B');
  assert.deepEqual(plain(lyricsChords('[Hm7]raz')).map(c => c.text), ['Bm7']);
});

test('lista akordów z tekstu, po kolei', () => {
  const t = '[Zwrotka]\n[C]raz [G7]dwa\n[Am]trzy';
  assert.deepEqual(plain(lyricsChords(t)).map(c => c.text), ['C', 'G7', 'Am']);
  assert.equal(lyricsHasChords(t), true);
  assert.equal(lyricsHasChords('sam tekst, bez akordów'), false);
  assert.equal(lyricsHasChords(''), false);
  assert.deepEqual(plain(lyricsChords(null)), []);
});

test('sam tekst bez akordów — do czytania i do druku', () => {
  assert.equal(lyricsPlain('[C]Wlazł kotek na [G7]płotek i mruga'), 'Wlazł kotek na płotek i mruga');
  assert.equal(lyricsPlain('[Zwrotka]\n[C]raz'), '[Zwrotka]\nraz');
  assert.equal(lyricsPlain(''), '');
});

test('transpozycja zmienia akordy, a słów nie rusza', () => {
  const t = '[Zwrotka]\n[C]Wlazł kotek na [G7]płotek,\nład[Am]na to [F]piosenka';
  const w = transposeLyrics(t, 2);
  assert.equal(w, '[Zwrotka]\n[D]Wlazł kotek na [A7]płotek,\nład[Bm]na to [G]piosenka');
  assert.equal(lyricsPlain(w), lyricsPlain(t), 'słowa bez zmian');
  // w tę i z powrotem wraca do punktu wyjścia
  assert.equal(transposeLyrics(transposeLyrics(t, 5), -5), t);
  assert.equal(transposeLyrics(t, 0), t);
  assert.equal(transposeLyrics('[x2] nic', 3), '[x2] nic', 'nie-akordy zostają');
  assert.equal(transposeLyrics('[Zwrotka]\nnic', 3), '[Zwrotka]\nnic', 'nagłówki zostają');
});

test('nic, śmieci i dziwne typy nie wysypują parsera', () => {
  for(const zle of [null, undefined, '', 5, {}]){
    assert.ok(Array.isArray(parseLyrics(zle)), String(zle));
    assert.deepEqual(plain(lyricsChords(zle)), []);
  }
  assert.deepEqual(plain(parseLyrics('[C]x')[0].parts.length), 1);
  assert.ok(parseLyrics('[[C]]tekst').length, 'podwójne nawiasy');
  assert.ok(parseLyrics('[]pusty nawias').length);
});

test('Piosenki startowe: polski tekst z akordami, które rozpoznaje appka', () => {
  for(const id of ['seed-blizej', 'seed-lean-back', 'seed-surrender', 'seed-famous-for']){
    const s = SEED_SONGS.find(x => x.id === id);
    assert.ok(s && s.lyrics, id + ': brak tekstu');
    // każdy [..] to albo akord, albo nagłówek części w osobnej linii
    const linie = plain(parseLyrics(s.lyrics));
    const zle = linie.flatMap(l => (l.parts || []).map(p => p.text)).filter(t => /\[[^\]]*\]/.test(t));
    assert.deepEqual(zle, [], id + ': nierozpoznane akordy');
    assert.ok(lyricsChords(s.lyrics).length >= 30, id);
    assert.ok(linie.some(l => l.label && l.label.startsWith('Refren')), id + ': brak refrenu');
  }
});

test('lyricsChordSheet: akordy z tekstu z podziałem na części', () => {
  const {lyricsChordSheet} = L;
  const t = '[Zwrotka]\n[C]raz [G7]dwa\n[Am]trzy\n\n[Refren]\n[F]cztery\nbez akordów';
  assert.equal(lyricsChordSheet(t), '[Zwrotka] C G7 | Am\n[Refren] F');
  assert.equal(lyricsChordSheet('[Hm]raz'), 'Bm');
  assert.equal(lyricsChordSheet('sam tekst'), '');
  assert.equal(lyricsChordSheet(null), '');
});

test('lyricsChordSheet: po transpozycji tekstu arkusz idzie za tekstem', () => {
  const {lyricsChordSheet} = L;
  assert.equal(lyricsChordSheet(transposeLyrics('[Zwrotka]\n[C]raz [G]dwa', 2)), '[Zwrotka] D A');
});
