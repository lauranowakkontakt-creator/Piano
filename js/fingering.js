/* ============================================================
   Palcowanie gam durowych — standardowe (szkolne) palcowanie dla obu rąk.
   Palce: 1 = kciuk, 2 = wskazujący, 3 = środkowy, 4 = serdeczny, 5 = mały.
   Tablica podaje palce na 7 stopni gamy w górę; ósmy dźwięk (oktawa) wraca
   do palca startowego. W dół gra się to samo wspak.
   Sama logika i dane, bez rysowania. Testy: test/unit/fingering.test.js.
   ============================================================ */

/* Trzy rodziny palcowań, w które wpada większość gam durowych:
   - „biała": kciuk na 1. i 4. stopniu (C G D A E), lewa 5 4 3 2 1 3 2 1
   - gamy z dużą liczbą bemoli: prawa zaczyna od 2/3/4, kciuk ląduje na białych klawiszach
   - F i H mają swoje wyjątki. */
const FINGERING = {
  'C':  {rh:[1,2,3,1,2,3,4], lh:[5,4,3,2,1,3,2,1]},
  'G':  {rh:[1,2,3,1,2,3,4], lh:[5,4,3,2,1,3,2,1]},
  'D':  {rh:[1,2,3,1,2,3,4], lh:[5,4,3,2,1,3,2,1]},
  'A':  {rh:[1,2,3,1,2,3,4], lh:[5,4,3,2,1,3,2,1]},
  'E':  {rh:[1,2,3,1,2,3,4], lh:[5,4,3,2,1,3,2,1]},
  'F':  {rh:[1,2,3,4,1,2,3], lh:[5,4,3,2,1,3,2,1]},
  'B':  {rh:[1,2,3,1,2,3,4], lh:[4,3,2,1,4,3,2,1]},
  'F#': {rh:[2,3,4,1,2,3,1], lh:[4,3,2,1,3,2,1,4]},
  'Db': {rh:[2,3,1,2,3,4,1], lh:[3,2,1,4,3,2,1,3]},
  'Ab': {rh:[3,4,1,2,3,1,2], lh:[3,2,1,4,3,2,1,3]},
  'Eb': {rh:[3,1,2,3,4,1,2], lh:[3,2,1,4,3,2,1,3]},
  'Bb': {rh:[4,1,2,3,1,2,3], lh:[3,2,1,4,3,2,1,3]},
};
// ósmy dźwięk gamy w prawej ręce: domykamy oktawę palcem po ostatnim
const RH_OCTAVE = {'C':5,'G':5,'D':5,'A':5,'E':5,'F':4,'B':5,'F#':2,'Db':2,'Ab':3,'Eb':3,'Bb':4};

const PALEC_NAZWA = {1:'kciuk', 2:'wskazujący', 3:'środkowy', 4:'serdeczny', 5:'mały'};

/* Gama z palcowaniem dla jednej ręki.
   key — nazwa gamy durowej z KEYS, hand — 'rh' (prawa) albo 'lh' (lewa).
   startMidi — od którego C liczymy (domyślnie: prawa od C4, lewa od C3).
   Zwraca [{step, note, pc, midi, finger, fingerName, black, thumbUnder}] — 8 pozycji (z oktawą). */
function scaleFingering(key, hand='rh', startMidi=null){
  const f = FINGERING[key];
  if(!f || (hand!=='rh' && hand!=='lh')) return [];
  const sc = KEYS[key];
  const base = startMidi ?? (hand==='rh' ? 60 : 48);
  const tonic = base + ((PC[sc[0]] - base%12) + 12) % 12;      // najbliższa tonika w górę od base
  const palce = hand==='rh' ? [...f.rh, RH_OCTAVE[key]] : [...f.lh];
  const out = [];
  let midi = tonic;
  for(let i=0; i<8; i++){
    const note = sc[i % 7];
    if(i>0){
      const prevPc = PC[sc[(i-1) % 7]];
      midi += ((PC[note] - prevPc) + 12) % 12 || 12;
    }
    const palec = palce[i];
    const poprzedni = out[i-1];
    out.push({
      step: i+1,
      note,
      pc: PC[note],
      midi,
      finger: palec,
      fingerName: PALEC_NAZWA[palec],
      black: isBlack(midi),
      // podłożenie kciuka (prawa w górę) albo przełożenie palca (lewa w górę)
      thumbUnder: !!poprzedni && (hand==='rh' ? palec===1 && poprzedni.finger>1
                                              : poprzedni.finger===1 && palec>1),
    });
  }
  return out;
}

/* Obie ręce naraz — do podpisu pod klawiaturą i do druku. */
function scaleFingeringBoth(key, opts={}){
  return {rh: scaleFingering(key, 'rh', opts.rhStart), lh: scaleFingering(key, 'lh', opts.lhStart)};
}
/* Krótki zapis palcowania, np. „1 2 3 1 2 3 4 5". */
function fingeringLine(key, hand){
  return scaleFingering(key, hand).map(x=>x.finger).join(' ');
}
/* Zdanie po polsku: gdzie jest podłożenie kciuka — to jedyne trudne miejsce w gamie. */
function fingeringTip(key, hand='rh'){
  const kroki = scaleFingering(key, hand);
  if(!kroki.length) return '';
  const miejsca = kroki.filter(k=>k.thumbUnder).map(k=>fmt(k.note));
  const start = kroki[0];
  const reka = hand==='rh' ? 'Prawa' : 'Lewa';
  const ruch = hand==='rh' ? 'kciuk podkłada się pod dłoń na' : 'palec przekłada się nad kciukiem na';
  if(!miejsca.length) return `${reka}: zaczynasz palcem ${start.finger} (${start.fingerName}).`;
  return `${reka}: start palcem ${start.finger} (${start.fingerName}), ${ruch} ${miejsca.join(' i ')}.`;
}
const FINGERING_KEYS = Object.keys(FINGERING);

/* ---------- ćwiczenie „zagraj gamę" ----------
   Oczekiwana kolejność dźwięków: w górę, a potem w dół (bez powtarzania szczytu).
   Sama logika, żeby dało się ją sprawdzić bez klikania. */
function scaleRunSequence(key, hand='rh', opts={}){
  const kroki = scaleFingering(key, hand, opts.start);
  if(!kroki.length) return [];
  const wGore = kroki.map(k=>k.midi);
  return opts.upOnly ? wGore : [...wGore, ...wGore.slice(0,-1).reverse()];
}
class ScaleRun {
  constructor(seq){ this.seq = seq || []; this.i = 0; this.bledy = 0; }
  get done(){ return this.i >= this.seq.length; }
  get expected(){ return this.done ? null : this.seq[this.i]; }
  get progress(){ return this.seq.length ? this.i/this.seq.length : 0; }
  /* Zagrany dźwięk: zgodny z oczekiwanym idzie dalej, zły liczy się jako pomyłka
     (ale nie cofa — bo wtedy nie dałoby się dokończyć gamy). */
  play(midi){
    if(this.done) return {ok:false, done:true, expected:null};
    const oczekiwany = this.seq[this.i];
    const ok = midi === oczekiwany;
    if(ok) this.i += 1; else this.bledy += 1;
    return {ok, done:this.done, expected: this.done ? null : this.seq[this.i], was:oczekiwany};
  }
  reset(){ this.i = 0; this.bledy = 0; }
}
