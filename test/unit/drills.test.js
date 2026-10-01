const test = require('node:test');
const assert = require('node:assert/strict');
const {load, plain} = require('../helpers/load');

const D = load('js/theory.js', 'js/audio.js', 'js/ui.js', 'js/loop.js', 'js/drills.js');
const {DRILL_KINDS, DRILL_BY_ID, DRILL_DEFAULT, DRILL_QUALITIES, INTERWALY, DRILL_KEYS,
  drillPool, makeTask, drillLabel, checkAnswer, parseChord, chordsFor, functionIn, voicing} = D;

/* prosty, powtarzalny generator: dzięki niemu test chodzi po wielu wariantach zadań */
function rng(seed){
  let s = seed >>> 0;
  return () => { s = (s*1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
const ALL_IDS = drillPool(DRILL_KINDS.map(k=>k.id), {});
// każde zadanie w kilkunastu losowaniach — łapie warianty tonacji i podstaw
function everyTask(fn, ziarna = 24){
  for(const id of ALL_IDS)
    for(let s=1; s<=ziarna; s++)
      fn(makeTask(id, rng(s*7919), {key:'los'}), id, s);
}

test('pula: każdy rodzaj daje swoje rzeczy, a id zaczyna się od nazwy rodzaju', () => {
  assert.ok(ALL_IDS.length >= 40, 'pula ma z czego losować: '+ALL_IDS.length);
  assert.equal(new Set(ALL_IDS).size, ALL_IDS.length, 'bez powtórek');
  for(const id of ALL_IDS) assert.ok(DRILL_BY_ID[id.split(':')[0]], id);
  assert.deepEqual(plain(drillPool(['ucho'], {})), plain(DRILL_QUALITIES.map(q=>'ucho:'+q.id)));
  // wyłączone rodzaje znikają z puli, nieznane są pomijane
  assert.deepEqual(plain(drillPool(['ucho','nie-ma-takiego'], {})), plain(DRILL_QUALITIES.map(q=>'ucho:'+q.id)));
  assert.deepEqual(plain(drillPool([], {})), plain(drillPool(DRILL_DEFAULT, {})));
});

test('każde zadanie jest kompletne: treść, odpowiedzi i wyjaśnienie', () => {
  everyTask((t, id) => {
    assert.ok(t, 'brak zadania dla '+id);
    assert.equal(t.id, id);
    assert.ok(t.prompt && t.prompt.length > 3, id);
    assert.ok(t.why && t.why.length > 5, 'brak wyjaśnienia: '+id);
    assert.ok(t.reveal, 'brak poprawnej odpowiedzi do pokazania: '+id);
    assert.ok(!/undefined|NaN|\[object/.test(t.prompt + t.why + t.reveal), `${id}: ${t.prompt} / ${t.why}`);
  });
});

test('zadania na wybór: 3–4 różne odpowiedzi, dokładnie jedna poprawna', () => {
  everyTask((t, id) => {
    if(t.type !== 'wybor') return;
    assert.ok(t.options.length >= 3 && t.options.length <= 4, `${id}: ${t.options.length} odpowiedzi`);
    assert.equal(new Set(t.options).size, t.options.length, `${id}: powtórzona odpowiedź w ${t.options.join('/')}`);
    assert.ok(t.answer >= 0 && t.answer < t.options.length, id);
    assert.equal(checkAnswer(t, t.answer), true);
    for(let i=0;i<t.options.length;i++) if(i!==t.answer) assert.equal(checkAnswer(t, i), false, id);
  });
});

test('dźwięk zadania to akordy albo dźwięki, które da się zagrać', () => {
  everyTask((t, id) => {
    for(const s of [t.sound, t.answerSound]){
      if(!s) continue;
      if(s.chords){ s.chords.forEach(c => assert.ok(parseChord(c), `${id}: nie rozpoznaję akordu ${c}`)); }
      else if(s.notes){ s.notes.forEach(m => assert.ok(m>=21 && m<=108, `${id}: dźwięk ${m} poza pianinem`)); }
      else if(s.stack){ s.stack.forEach(m => assert.ok(m>=21 && m<=108, `${id}: dźwięk ${m} poza pianinem`)); }
      else assert.fail(`${id}: dźwięk bez treści`);
    }
  });
});

test('akord ze słuchu: gramy dokładnie ten rodzaj, o który pytamy', () => {
  for(const q of DRILL_QUALITIES){
    for(let s=1;s<=12;s++){
      const t = makeTask('ucho:'+q.id, rng(s), {});
      assert.equal(t.options[t.answer], q.name);
      const c = parseChord(t.sound.chords[0]);
      const wzor = parseChord('C'+q.suf);
      const odstepy = p => p.pcs.map(x => (x - p.pcs[0] + 12) % 12).sort((a,b)=>a-b);
      assert.deepEqual(plain(odstepy(c)), plain(odstepy(wzor)), `${q.id}: ${t.sound.chords[0]} ma inną budowę`);
    }
  }
});

test('interwał: różnica dźwięków zgadza się z nazwą', () => {
  for(const iv of INTERWALY){
    for(let s=1;s<=10;s++){
      const t = makeTask('int:'+iv.n, rng(s), {});
      const [a, b] = t.sound.notes;
      assert.equal(b - a, iv.n, iv.name);
      assert.equal(t.options[t.answer], iv.name);
    }
  }
});

test('stopień i rola: pytamy o akord, który naprawdę tak działa w tej tonacji', () => {
  for(const key of DRILL_KEYS){
    for(const ch of chordsFor(key)){
      const t = makeTask('stopien:'+ch.rn, rng(3), {key});
      assert.equal(t.options[t.answer], ch.rn);
      assert.ok(t.prompt.includes(key.replace('#','♯').replace('b','♭')), `${key}: ${t.prompt}`);
      // zagrany akord to tonika + ten akord
      assert.equal(t.sound.chords.length, 2);
      assert.equal(parseChord(t.sound.chords[1]).rootPc, ch.pcs[0]);
    }
    for(const fn of ['t','s','d']){
      for(let s=1;s<=8;s++){
        const t = makeTask('rola:'+fn, rng(s), {key});
        const grany = parseChord(t.sound.chords[1]);
        assert.equal(functionIn(grany, key).fn, fn, `${key}: ${t.sound.chords[1]} miał być ${fn}`);
      }
    }
  }
});

test('co dalej: poprawna odpowiedź faktycznie rozwiązuje napięcie', () => {
  const oczekiwane = {'V7':'I', 'V':'I', 'vii°':'I', 'ii':'V', 'IV':'V'};
  for(const key of DRILL_KEYS){
    for(const [co, docelowy] of Object.entries(oczekiwane)){
      const t = makeTask('dalej:'+co, rng(5), {key});
      const cel = chordsFor(key).find(c => c.rn === docelowy);
      assert.equal(t.reveal, t.options[t.answer], `${key} ${co}: odpowiedź nie zgadza się z opcją`);
      assert.equal(parseChord(t.answerSound.chords[1]).rootPc, cel.pcs[0], `${key}: po ${co} miało iść ${docelowy}`);
      // akord z pytania musi być grywalny (np. vii° zapisany jako „Bdim", nie „B°dim")
      assert.ok(parseChord(t.answerSound.chords[0]), `${key} ${co}: ${t.answerSound.chords[0]}`);
    }
  }
});

test('zagraj akord: sprawdzamy dźwięki, nie konkretne klawisze', () => {
  const t = makeTask('chwyt:mj', rng(1), {});
  const pcs = plain(t.keys.pcs);
  assert.equal(t.type, 'klawisze');
  const jako = (base) => pcs.map(p => base + p);
  assert.equal(checkAnswer(t, jako(60)), true, 'w oktawie razowej');
  assert.equal(checkAnswer(t, jako(72)), true, 'ta sama rzecz oktawę wyżej');
  assert.equal(checkAnswer(t, [60 + pcs[1], 72 + pcs[0], 60 + pcs[2]]), true, 'kolejność i przewrót bez znaczenia');
  assert.equal(checkAnswer(t, jako(60).slice(1)), false, 'brakujący dźwięk');
  assert.equal(checkAnswer(t, [...jako(60), 61 + pcs[0]]), false, 'dodatkowy obcy dźwięk');
  assert.equal(checkAnswer(t, []), false);
  assert.equal(checkAnswer(t, null), false);
  assert.equal(checkAnswer(null, [60]), false);
});

test('przewrót: na dole leży ten dźwięk, o który chodzi, i chwyt mieści się na klawiaturze', () => {
  for(const nr of [0,1,2]){
    for(let s=1;s<=14;s++){
      const t = makeTask('inv:'+nr, rng(s), {});
      const notes = plain(t.sound.stack);
      assert.deepEqual(notes, notes.slice().sort((a,b)=>a-b), 'dźwięki idą w górę');
      assert.ok(notes[0] >= t.keys.from && notes[notes.length-1] <= t.keys.to, `${nr}: ${notes} nie mieści się na pokazanej klawiaturze`);
      const c = parseChord(t.prompt.replace(/.*<b>([^<]+)<\/b>.*/s, '$1').replace('♯','#').replace('♭','b').replace('°','dim'));
      assert.ok(c, 'akord z treści da się odczytać');
      const kolejnosc = c.pcs;
      assert.equal(notes[0] % 12, kolejnosc[nr], `${nr}. przewrót ma mieć na dole ${kolejnosc[nr]}`);
      assert.equal(t.options[t.answer].startsWith(nr===0 ? 'pozycja' : nr+'.'), true, t.options[t.answer]);
    }
  }
});

test('nazwy rzeczy do opanowania są czytelne po polsku', () => {
  assert.equal(drillLabel('ucho:mn'), 'Akord ze słuchu: moll');
  assert.equal(drillLabel('int:7'), 'Interwał ze słuchu: kwinta czysta');
  assert.equal(drillLabel('rola:d'), 'Rola akordu: Dominanta');
  assert.equal(drillLabel('inv:1'), 'Przewrót: 1. przewrót');
  assert.equal(drillLabel('stopien:vii°'), 'Który stopień: vii°');
  assert.equal(drillLabel('chwyt:maj7'), 'Zagraj akord: maj7');
  assert.equal(drillLabel('dalej:V7'), 'Co dalej: po V7');
  assert.equal(drillLabel('nie-ma-takiego:x'), 'nie-ma-takiego:x');
  for(const id of ALL_IDS) assert.ok(!/undefined/.test(drillLabel(id)), id);
});

test('wybrana tonacja jest respektowana, „losowa" kręci różnymi', () => {
  for(let s=1;s<=10;s++){
    const t = makeTask('stopien:V', rng(s), {key:'G'});
    assert.ok(t.prompt.includes('G-dur'), t.prompt);
  }
  const widziane = new Set();
  for(let s=1;s<=40;s++) widziane.add(makeTask('rola:t', rng(s*13), {key:'los'}).prompt.match(/<b>([^<]+)<\/b>/)[1]);
  assert.ok(widziane.size > 2, 'losowa tonacja faktycznie się zmienia');
  // nieznana tonacja z zapisanych ustawień nie wywraca zadania
  assert.ok(makeTask('rola:t', rng(1), {key:'Xyz'}));
});

test('nieznane id nie wysypuje treningu', () => {
  assert.equal(makeTask('nie-ma', Math.random, {}), null);
  assert.equal(makeTask('', Math.random, {}), null);
});
