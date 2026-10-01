const test = require('node:test');
const assert = require('node:assert/strict');
const {load, plain} = require('../helpers/load');

const F = load('js/theory.js', 'js/audio.js', 'js/ui.js', 'js/fingering.js');
const {FINGERING, FINGERING_KEYS, scaleFingering, scaleFingeringBoth, fingeringLine, fingeringTip,
  scaleRunSequence, ScaleRun, isBlack, KEYS, PC, majorScalePcs} = F;

const RECE = ['rh','lh'];

test('palcowanie jest dla wszystkich 12 gam durowych i ma 8 stopni', () => {
  assert.equal(FINGERING_KEYS.length, 12);
  assert.equal(new Set(FINGERING_KEYS.map(k=>PC[k])).size, 12, 'każda tonika inna');
  for(const key of FINGERING_KEYS){
    for(const hand of RECE){
      const kroki = scaleFingering(key, hand);
      assert.equal(kroki.length, 8, `${key} ${hand}`);
      assert.ok(kroki.every(k=>k.finger >= 1 && k.finger <= 5), `${key} ${hand}: palec spoza dłoni`);
    }
  }
});

test('gama idzie w górę wzorem cały-cały-pół i kończy się oktawę wyżej', () => {
  for(const key of FINGERING_KEYS){
    for(const hand of RECE){
      const kroki = scaleFingering(key, hand);
      const midis = kroki.map(k=>k.midi);
      assert.deepEqual(plain(midis), plain([...midis].sort((a,b)=>a-b)), `${key} ${hand}: dźwięki nie rosną`);
      assert.equal(midis[7] - midis[0], 12, `${key} ${hand}: ostatni dźwięk to nie oktawa`);
      // te same dźwięki co gama durowa z teorii
      assert.deepEqual(plain(midis.slice(0,7).map(m=>m%12)), plain(majorScalePcs(PC[key])), key);
      // nazwy stopni zgodne z KEYS, bez powtórzonych liter
      assert.deepEqual(plain(kroki.slice(0,7).map(k=>k.note)), plain(KEYS[key]), key);
    }
  }
});

test('kciuk nigdy nie ląduje na czarnym klawiszu', () => {
  // to jest cała zasada stojąca za „dziwnymi" palcowaniami gam bemolowych
  for(const key of FINGERING_KEYS)
    for(const hand of RECE)
      for(const k of scaleFingering(key, hand))
        if(k.finger === 1) assert.equal(k.black, false, `${key} ${hand}: kciuk na czarnym ${k.note}`);
});

test('palce idą po kolei — bez przeskoków większych niż jeden przy sąsiednich dźwiękach', () => {
  for(const key of FINGERING_KEYS){
    for(const hand of RECE){
      const kroki = scaleFingering(key, hand);
      for(let i=1;i<kroki.length;i++){
        const a = kroki[i-1].finger, b = kroki[i].finger;
        const sasiednie = Math.abs(a-b) === 1;
        const przeklada = a === 1 || b === 1;      // podłożenie kciuka wolno zrobić szerzej
        assert.ok(sasiednie || przeklada, `${key} ${hand}: skok z palca ${a} na ${b} przy ${kroki[i].note}`);
      }
    }
  }
});

test('w każdej gamie ręka przekłada się raz albo dwa razy na oktawę', () => {
  // mniej niż raz = fizycznie nie da się zagrać oktawy pięcioma palcami,
  // więcej niż dwa razy = palcowanie jest bez sensu
  for(const key of FINGERING_KEYS){
    for(const hand of RECE){
      const ile = scaleFingering(key, hand).filter(k=>k.thumbUnder).length;
      assert.ok(ile >= 1 && ile <= 2, `${key} ${hand}: ${ile} przełożeń`);
    }
  }
  assert.equal(scaleFingering('C','rh').filter(k=>k.thumbUnder).length, 1, 'C w prawej: kciuk raz, na F');
  assert.equal(scaleFingering('Bb','lh').filter(k=>k.thumbUnder).length, 2);
});

test('zakresy: prawa od C4 w górę, lewa od C3 — i da się je przesunąć', () => {
  assert.equal(scaleFingering('C','rh')[0].midi, 60);
  assert.equal(scaleFingering('C','lh')[0].midi, 48);
  assert.equal(scaleFingering('G','rh')[0].midi, 67, 'G powyżej C4');
  assert.equal(scaleFingering('Bb','rh')[0].midi, 70);
  assert.equal(scaleFingering('C','rh', 72)[0].midi, 72, 'start można podać ręcznie');
  const obie = scaleFingeringBoth('F');
  assert.equal(obie.rh[0].midi - obie.lh[0].midi, 12, 'lewa gra oktawę niżej niż prawa');
});

test('znane palcowania zgadzają się ze szkolnymi', () => {
  assert.equal(fingeringLine('C','rh'), '1 2 3 1 2 3 4 5');
  assert.equal(fingeringLine('C','lh'), '5 4 3 2 1 3 2 1');
  assert.equal(fingeringLine('F','rh'), '1 2 3 4 1 2 3 4', 'w F kciuk omija B♭');
  assert.equal(fingeringLine('B','lh'), '4 3 2 1 4 3 2 1');
  assert.equal(fingeringLine('Bb','rh'), '4 1 2 3 1 2 3 4');
  assert.equal(fingeringLine('F#','rh'), '2 3 4 1 2 3 1 2');
});

test('podpowiedź mówi, gdzie dokładnie przekłada się ręka', () => {
  assert.equal(fingeringTip('C','rh'), 'Prawa: start palcem 1 (kciuk), kciuk podkłada się pod dłoń na F.');
  assert.match(fingeringTip('C','lh'), /^Lewa: start palcem 5/);
  assert.match(fingeringTip('Bb','rh'), /start palcem 4/);
  for(const key of FINGERING_KEYS)
    for(const hand of RECE)
      assert.ok(fingeringTip(key, hand).length > 20 && !/undefined/.test(fingeringTip(key, hand)), key+' '+hand);
});

test('nieznana gama albo ręka nie wysypuje palcowania', () => {
  assert.deepEqual(plain(scaleFingering('Gb','rh')), []);
  assert.deepEqual(plain(scaleFingering('C','trzecia')), []);
  assert.deepEqual(plain(scaleFingering(null)), []);
  assert.equal(fingeringTip('Gb','rh'), '');
  assert.deepEqual(plain(scaleRunSequence('Gb')), []);
});

test('ćwiczenie gamy: w górę i w dół, bez powtarzania szczytu', () => {
  const seq = plain(scaleRunSequence('C','rh'));
  assert.equal(seq.length, 15, '8 w górę + 7 w dół');
  assert.deepEqual(seq.slice(0,8), [60,62,64,65,67,69,71,72]);
  assert.deepEqual(seq.slice(8), [71,69,67,65,64,62,60]);
  assert.deepEqual(plain(scaleRunSequence('C','rh',{upOnly:true})).length, 8);
});

test('ćwiczenie gamy: dobre dźwięki posuwają do przodu, złe liczą się jako pomyłki', () => {
  const run = new ScaleRun(scaleRunSequence('C','rh'));
  assert.equal(run.expected, 60);
  assert.equal(run.done, false);

  let w = run.play(62);                       // nie ten dźwięk
  assert.equal(w.ok, false);
  assert.equal(run.bledy, 1);
  assert.equal(run.expected, 60, 'wciąż czekamy na ten sam dźwięk');

  w = run.play(60);
  assert.equal(w.ok, true);
  assert.equal(run.expected, 62);
  assert.ok(run.progress > 0 && run.progress < 1);

  // dograj resztę poprawnie
  while(!run.done) run.play(run.expected);
  assert.equal(run.done, true);
  assert.equal(run.bledy, 1);
  assert.equal(run.progress, 1);
  assert.equal(run.expected, null);
  assert.deepEqual(plain(run.play(60)), {ok:false, done:true, expected:null}, 'po końcu nic się nie psuje');

  run.reset();
  assert.deepEqual([run.i, run.bledy, run.done], [0, 0, false]);
});

test('ćwiczenie gamy: cała gama bez pomyłki przechodzi do końca', () => {
  for(const key of FINGERING_KEYS){
    for(const hand of RECE){
      const run = new ScaleRun(scaleRunSequence(key, hand));
      for(const m of scaleRunSequence(key, hand)) run.play(m);
      assert.equal(run.done, true, key+' '+hand);
      assert.equal(run.bledy, 0, key+' '+hand);
    }
  }
});
