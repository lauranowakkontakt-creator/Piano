const test = require('node:test');
const assert = require('node:assert/strict');
const {load, plain} = require('../helpers/load');

const D = load('js/srs.js', 'js/views/dzis.js');
const {tydzienSerii, seriaTeraz, nastepnaLekcja} = D;

// środa 8 października 2025, południe
const SRODA = new Date(2025, 9, 8, 12).getTime();

test('tydzień: 7 dni od poniedziałku, zaznaczone dni serii i dzisiejszy', () => {
  const t = plain(tydzienSerii({days:3, best:3, last:'2025-10-08'}, SRODA));
  assert.deepEqual(t.map(d => d.lit), ['P','W','Ś','C','P','S','N']);
  assert.equal(t[0].key, '2025-10-06');
  assert.equal(t[6].key, '2025-10-12');
  assert.deepEqual(t.map(d => d.on), [true, true, true, false, false, false, false]);
  assert.deepEqual(t.map(d => d.dzis), [false, false, true, false, false, false, false]);
});

test('tydzień: seria z wczoraj jeszcze żyje, starsza już nie', () => {
  assert.deepEqual(plain(tydzienSerii({days:2, last:'2025-10-07'}, SRODA)).map(d => d.on).slice(0, 3), [true, true, false]);
  assert.ok(plain(tydzienSerii({days:5, last:'2025-10-05'}, SRODA)).every(d => !d.on));
  assert.ok(plain(tydzienSerii(null, SRODA)).every(d => !d.on));
});

test('seriaTeraz: przerwa dłuższa niż dzień zeruje serię', () => {
  assert.equal(seriaTeraz({days:4, last:'2025-10-08'}, SRODA), 4);
  assert.equal(seriaTeraz({days:4, last:'2025-10-07'}, SRODA), 4);
  assert.equal(seriaTeraz({days:4, last:'2025-10-06'}, SRODA), 0);
  assert.equal(seriaTeraz({days:0, last:null}, SRODA), 0);
});

test('nastepnaLekcja: wraca do ostatniej niezaliczonej, inaczej pierwsza niezaliczona', () => {
  const L = [{id:'a'}, {id:'b'}, {id:'c'}];
  assert.equal(nastepnaLekcja(L, {}, null).id, 'a');
  assert.equal(nastepnaLekcja(L, {a:true}, null).id, 'b');
  assert.equal(nastepnaLekcja(L, {a:true}, 'c').id, 'c');
  assert.equal(nastepnaLekcja(L, {a:true, c:true}, 'c').id, 'b');
  assert.equal(nastepnaLekcja(L, {a:true, b:true, c:true}, 'a'), null);
});
