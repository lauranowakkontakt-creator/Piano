const test = require('node:test');
const assert = require('node:assert/strict');
const {load, plain} = require('../helpers/load');

const S = load('js/srs.js');
const {srsNew, srsSanitize, srsAnswer, srsIsDue, srsWeight, srsPick, srsWeakest, srsProgress,
  dayKey, prevDayKey, SRS_ODSTEPY, SRS_MAX_BOX} = S;

const DZIEN = 24*60*60*1000;
const T0 = new Date(2026, 4, 12, 9, 0, 0).getTime();   // 12 maja 2026, 9:00 czasu lokalnego

test('dobra odpowiedź podnosi pudełko i odkłada powtórkę, zła zeruje', () => {
  const s = srsNew();
  srsAnswer(s, 'ucho:mn', true, T0);
  assert.equal(s.items['ucho:mn'].box, 1);
  assert.equal(s.items['ucho:mn'].due, T0 + SRS_ODSTEPY[1]);
  assert.equal(s.items['ucho:mn'].ok, 1);

  srsAnswer(s, 'ucho:mn', true, T0+1);
  assert.equal(s.items['ucho:mn'].box, 2);

  srsAnswer(s, 'ucho:mn', false, T0+2);
  assert.equal(s.items['ucho:mn'].box, 0, 'pomyłka cofa na sam początek');
  assert.equal(s.items['ucho:mn'].due, T0+2, 'wraca od razu');
  assert.equal(s.items['ucho:mn'].bad, 1);
});

test('pudełko nie przekracza ostatniego odstępu', () => {
  const s = srsNew();
  for(let i=0;i<20;i++) srsAnswer(s, 'int:7', true, T0+i);
  assert.equal(s.items['int:7'].box, SRS_MAX_BOX);
  assert.equal(s.items['int:7'].due, T0+19 + SRS_ODSTEPY[SRS_MAX_BOX]);
});

test('zaległe i nowe rzeczy mają większą wagę niż świeżo powtórzone', () => {
  const s = srsNew();
  srsAnswer(s, 'swieze', true, T0);
  const nowe = srsWeight(s, 'nigdy-nie-pytane', T0);
  const swieze = srsWeight(s, 'swieze', T0);
  const zalegle = srsWeight(s, 'swieze', T0 + 3*DZIEN);
  assert.ok(nowe > swieze, 'nowe przed świeżo zrobionym');
  assert.ok(zalegle > swieze, 'zaległe wraca');
  assert.equal(srsIsDue(s, 'nigdy-nie-pytane', T0), true);
  assert.equal(srsIsDue(s, 'swieze', T0), false);
});

test('rzeczy, które lecą, mają większą wagę niż te, które idą dobrze', () => {
  const s = srsNew();
  for(let i=0;i<4;i++) srsAnswer(s, 'latwe', true, T0+i);
  for(let i=0;i<4;i++) srsAnswer(s, 'trudne', i%2===0, T0+i);
  const t = T0 + 30*DZIEN;        // obie zaległe — porównujemy sam „opór"
  assert.ok(srsWeight(s,'trudne',t) > srsWeight(s,'latwe',t));
});

test('losowanie: nie powtarza tego samego zadania pod rząd i trzyma się puli', () => {
  const s = srsNew();
  const pool = ['a','b','c'];
  let r = 0;
  const rng = () => (r = (r + 0.37) % 1);
  for(let i=0;i<50;i++){
    const id = srsPick(s, pool, T0, rng, 'a');
    assert.ok(pool.includes(id));
    assert.notEqual(id, 'a');
  }
  // pula jednoelementowa: mimo „avoid" musi coś zwrócić
  assert.equal(srsPick(s, ['a'], T0, rng, 'a'), 'a');
  assert.equal(srsPick(s, [], T0, rng), null);
});

test('losowanie częściej trafia w rzecz, z którą są problemy', () => {
  const s = srsNew();
  const pool = ['dobre','slabe'];
  for(let i=0;i<6;i++) srsAnswer(s, 'dobre', true, T0+i);
  for(let i=0;i<6;i++) srsAnswer(s, 'slabe', false, T0+i);
  const t = T0 + 10*DZIEN;
  let slabe = 0;
  let seed = 0.123;
  const rng = () => (seed = (seed*7919 + 0.613) % 1);
  for(let i=0;i<400;i++) if(srsPick(s, pool, t, rng)==='slabe') slabe++;
  assert.ok(slabe > 240, `słabe wypadło ${slabe}/400 razy`);
});

test('seria dni: ten sam dzień nie liczy się dwa razy, przerwa zeruje', () => {
  const s = srsNew();
  srsAnswer(s, 'x', true, T0);
  srsAnswer(s, 'x', true, T0 + 60*1000);
  assert.equal(s.streak.days, 1, 'dwa razy tego samego dnia to wciąż jeden dzień');

  srsAnswer(s, 'x', true, T0 + DZIEN);
  assert.equal(s.streak.days, 2);
  srsAnswer(s, 'x', true, T0 + 2*DZIEN);
  assert.equal(s.streak.days, 3);
  assert.equal(s.streak.best, 3);

  srsAnswer(s, 'x', true, T0 + 9*DZIEN);
  assert.equal(s.streak.days, 1, 'po przerwie seria startuje od nowa');
  assert.equal(s.streak.best, 3, 'rekord zostaje');
});

test('licznik dnia zeruje się o północy', () => {
  const s = srsNew();
  srsAnswer(s, 'x', true, T0);
  srsAnswer(s, 'y', false, T0);
  assert.deepEqual(plain([s.day.answered, s.day.ok]), [2, 1]);
  srsAnswer(s, 'x', true, T0 + DZIEN);
  assert.deepEqual(plain([s.day.answered, s.day.ok]), [1, 1]);
  assert.deepEqual(plain([s.totals.asked, s.totals.ok]), [3, 2]);
});

test('dayKey i prevDayKey liczą dni lokalnie, także przez koniec miesiąca', () => {
  assert.equal(dayKey(T0), '2026-05-12');
  assert.equal(prevDayKey('2026-05-12'), '2026-05-11');
  assert.equal(prevDayKey('2026-05-01'), '2026-04-30');
  assert.equal(prevDayKey('2026-01-01'), '2025-12-31');
  assert.equal(prevDayKey('2026-03-30'), '2026-03-29', 'zmiana czasu nie gubi dnia');
});

test('najsłabsze: najpierw te z najgorszą skutecznością', () => {
  const s = srsNew();
  for(let i=0;i<5;i++) srsAnswer(s, 'ok', true, T0+i);
  srsAnswer(s, 'polowa', true, T0); srsAnswer(s, 'polowa', false, T0+1);
  srsAnswer(s, 'fatalnie', false, T0); srsAnswer(s, 'fatalnie', false, T0+1);
  const w = plain(srsWeakest(s, 5).map(x=>x.id));
  assert.deepEqual(w, ['fatalnie','polowa'], 'bezbłędne nie trafiają na listę');
});

test('postęp: opanowane = pudełko 3 i wyżej', () => {
  const s = srsNew();
  const pool = ['a','b','c','d'];
  for(let i=0;i<3;i++) srsAnswer(s, 'a', true, T0+i);       // pudełko 3
  srsAnswer(s, 'b', true, T0);                               // pudełko 1
  const p = srsProgress(s, pool, T0+4);
  assert.equal(p.total, 4);
  assert.equal(p.known, 1);
  assert.equal(p.fresh, 2);
  assert.equal(p.pct, 25);
});

test('stan z localStorage: śmieci nie wysypują treningu', () => {
  for(const zle of [null, 'bzdura', [1,2], 42]) assert.deepEqual(plain(srsSanitize(zle)), plain(srsNew()), String(zle));
  const s = srsSanitize({
    items:{dobre:{box:99, due:-5, ok:'3', bad:2, seen:7}, zle:'nie obiekt'},
    streak:{days:-4, best:2, last:5},
    day:{date:'2026-05-12', answered:3.7, ok:1},
    totals:{asked:10, ok:4},
  });
  assert.equal(s.items.dobre.box, SRS_MAX_BOX, 'pudełko przycięte do zakresu');
  assert.equal(s.items.dobre.due, 0);
  assert.equal(s.items.dobre.ok, 0, 'tekst zamiast liczby → zero');
  assert.equal(s.items.zle, undefined);
  assert.deepEqual(plain(s.streak), {days:0, best:2, last:null});
  assert.equal(s.day.answered, 4);
  assert.deepEqual(plain(s.totals), {asked:10, ok:4});
  // po oczyszczeniu dalej da się normalnie odpowiadać
  srsAnswer(s, 'dobre', true, T0);
  assert.equal(s.items.dobre.box, SRS_MAX_BOX);
});
