/* ============================================================
   Pętle akordów — logika bez rysowania (testowana w test/unit/loop.test.js).
   Rodzaje akordów, relacje między akordami, płynne prowadzenie głosów
   (jak trzymać rękę), podpowiedzi „co dalej" i układanie akordów w pętlę.
   ============================================================ */

/* rodzaj akordu → kolor jak na obrazkach: dur róż, moll niebieski, septymowy (dominanta)
   bursztyn, zwiększony zielony, zmniejszony fiolet, zawieszony szary */
const CHORD_TYPES = {
  mj:{name:'dur',          color:'#f472b6', desc:'jasny, stabilny'},
  mn:{name:'moll',         color:'#60a5fa', desc:'ciemniejszy, miękki'},
  d7:{name:'septymowy (7)',color:'#fbbf24', desc:'napięcie — chce rozwiązać się kwartę wyżej'},
  au:{name:'zwiększony (+)',color:'#4ade80',desc:'rozciągnięty, „w drodze"'},
  di:{name:'zmniejszony (°)',color:'#a78bfa',desc:'ciasny, niespokojny'},
  su:{name:'zawieszony (sus)',color:'#9ca3af',desc:'bez tercji — otwarty, niedopowiedziany'},
};
function chordType(c){
  if(!c) return 'su';
  if(c.q==='dim') return 'di';
  if(c.q==='aug') return 'au';
  if(c.q==='min') return 'mn';
  if(c.ext==='7' && (c.q==='maj' || c.q==='sus4')) return 'd7';
  if(c.q==='sus2' || c.q==='sus4' || c.q==='pow') return 'su';
  return 'mj';
}

/* baza akordów: 12 podstaw po kole kwintowym × rodzaje */
const LOOP_ROOTS = ['C','G','D','A','E','B','F#','Db','Ab','Eb','Bb','F'];
const LOOP_KINDS = [
  {suf:'',     label:'dur'},
  {suf:'m',    label:'moll'},
  {suf:'7',    label:'7'},
  {suf:'maj7', label:'maj7'},
  {suf:'m7',   label:'m7'},
  {suf:'sus4', label:'sus4'},
  {suf:'sus2', label:'sus2'},
  {suf:'dim',  label:'°'},
  {suf:'+',    label:'+'},
];

// ładna nazwa dźwięku w danym kontekście (bemole dla gam bemolowych)
const SPELL = ['C','Db','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
function pcName(pc, preferSharp){
  pc = ((pc%12)+12)%12;
  return preferSharp ? PC_NAME_SHARP[pc] : SPELL[pc];
}
/* pisownia dźwięków akordu od jego podstawy: A7 = A C♯ E G (nie D♭), B♭7 = B♭ D F A♭.
   Zwraca {pc: nazwa}. Bas spoza akordu dostaje pisownię jak podstawa (♯ albo ♭). */
const LETTERS = ['C','D','E','F','G','A','B'];
const ACC = {0:'',1:'#',2:'##',11:'b',10:'bb'};
function intervalDegree(iv, c){
  const r = iv%12;
  if(r===0) return 0;
  if(r===1 || r===2) return 1;
  if(r===3 || r===4) return 2;
  if(r===5) return 3;
  if(r===6) return c.q==='dim' ? 4 : 3;
  if(r===7 || r===8) return 4;
  if(r===9) return c.ext==='dim7' ? 6 : 5;
  return 6;
}
function spellChord(c){
  const out = {};
  const li = LETTERS.indexOf(c.root[0]);
  (c.iv||[]).forEach(iv=>{
    const pc = (c.rootPc+iv)%12;
    if(out[pc]) return;
    const L = LETTERS[(li+intervalDegree(iv,c))%7];
    const acc = ACC[(pc - LETTER_PC_L[L] + 12)%12];
    out[pc] = acc===undefined ? pcName(pc, c.root.includes('#')) : L+acc;
  });
  if(c.bassPc!=null && !out[c.bassPc]) out[c.bassPc] = pcName(c.bassPc, c.root.includes('#'));
  return out;
}
const LETTER_PC_L = {C:0,D:2,E:4,F:5,G:7,A:9,B:11};
function chordLabel(txt){ return fmt(String(txt).replace(/dim$/,'°')); }

/* transpozycja zapisu akordu o n półtonów (zachowuje końcówkę i bas) */
function transposeChord(txt, n){
  const c = parseChord(txt);
  if(!c) return txt;
  const m = c.text.match(/^([A-Ga-g][#b]?)(.*?)(\/[A-Ga-g][#b]?)?$/);
  const suffix = m ? m[2] : '';
  const sharp = c.root.includes('#');
  const root = pcName(c.rootPc + n, sharp);
  const bass = c.bassPc!=null ? '/'+pcName(c.bassPc + n, sharp) : '';
  return root + suffix + bass;
}

/* wspólne dźwięki (klasy dźwięków) dwóch akordów */
function commonTones(a, b){ return a.pcs.filter(p=>b.pcs.includes(p)); }

/* relacja a → b, do podpisu strzałki i do oceniania pętli */
function relation(a, b){
  const common = commonTones(a,b);
  const up4 = (b.rootPc - a.rootPc + 12)%12 === 5;          // kwarta w górę = kwinta w dół
  const ta = chordType(a);
  if(up4 && (ta==='d7' || (ta==='mj' || ta==='su'))){
    return {kind:'dom', strong: ta==='d7', label: ta==='d7' ? 'napięcie → rozwiązanie' : 'kwinta w dół', common};
  }
  if(a.rootPc===b.rootPc && a.q!==b.q) return {kind:'mode', strong:false, label:'ten sam dźwięk, inny kolor', common};
  if(common.length>=2) return {kind:'near', strong:false, label:`${common.length} wspólne dźwięki`, common};
  if((b.rootPc - a.rootPc + 12)%12 === 7) return {kind:'up5', strong:false, label:'kwinta w górę', common};
  if(common.length===1) return {kind:'one', strong:false, label:'1 wspólny dźwięk', common};
  return {kind:'jump', strong:false, label:'skok (0 wspólnych)', common};
}

/* ---------- płynne prowadzenie głosów (prawa ręka) ----------
   Wybiera przewrót najbliższy poprzedniemu chwytowi: wspólne dźwięki zostają,
   reszta rusza się o najmniejszy krok. Bez poprzedniego — pozycja blisko środkowego C. */
function rightHandPcs(c){
  let pcs = c.pcs.slice();
  // max 4 palce: w akordach 9/13 odpuszczamy kwintę (najmniej ważna)
  if(pcs.length>4){ const fifth=(c.rootPc+7)%12; pcs = pcs.filter(p=>p!==fifth).slice(0,4); }
  return pcs;
}
function closeVoicings(pcs, lo=52, hi=81){
  const out=[];
  for(let r=0;r<pcs.length;r++){
    const order = [...pcs.slice(r), ...pcs.slice(0,r)];
    for(let base=lo; base<=hi; base++){
      if(base%12!==order[0]) continue;
      const notes=[base];
      for(let k=1;k<order.length;k++){ let m=notes[k-1]+1; while(m%12!==order[k]) m++; notes.push(m); }
      if(notes[notes.length-1]<=hi) out.push(notes);
    }
  }
  return out;
}
function voiceDistance(prev, next){
  // każdy nowy dźwięk do najbliższego starego i odwrotnie (działa też dla 3 → 4 dźwięków)
  const d = (a,b)=>a.reduce((s,x)=>s+Math.min(...b.map(y=>Math.abs(x-y))),0);
  return d(next,prev) + d(prev,next);
}
function smoothVoicing(c, prev, center=66){
  const cands = closeVoicings(rightHandPcs(c));
  let best=null, bs=Infinity;
  for(const v of cands){
    const mean = v.reduce((a,b)=>a+b,0)/v.length;
    const cost = (prev ? voiceDistance(prev, v) : 0) + Math.abs(mean-center)*(prev ? .35 : 1);
    if(cost<bs){ bs=cost; best=v; }
  }
  return best;
}
/* chwyty całej pętli: liczymy dwa razy dookoła, żeby pierwszy akord też płynnie wynikał z ostatniego */
function loopVoicings(chords){
  if(!chords.length) return [];
  let prev=null, out=[];
  for(let round=0; round<2; round++){
    out = chords.map(c=>{ const v=smoothVoicing(c, prev); prev=v; return v; });
  }
  return out;
}
const INV_NAMES = ['pozycja zasadnicza','1. przewrót','2. przewrót','3. przewrót'];
function inversionName(c, v){
  const lowest = ((v[0]%12)+12)%12;
  const idx = rightHandPcs(c).indexOf(lowest);
  return INV_NAMES[idx] || '';
}
// bas lewej ręki (podstawa albo dźwięk po ukośniku) w zakresie E2–G3
function bassMidi(c){ const bp = c.bassPc!=null ? c.bassPc : c.rootPc; return 40 + ((bp-4+12)%12); }

/* ---------- podpowiedzi: co może być dalej po akordzie c ---------- */
function suggestNext(c){
  if(!c) return [];
  const r = c.rootPc, t = chordType(c), sharp = c.root.includes('#');
  const N = (pc, suf)=>pcName(pc, sharp)+suf;
  const out=[];
  const add=(name, why)=>{ if(!out.some(o=>o.name===name) && !sameName(name, c.text)) out.push({name, why}); };
  if(t==='d7' || t==='mj' || t==='su'){
    add(N(r+5,''), 'rozwiązanie: kwinta w dół');
    add(N(r+5,'m'), 'rozwiązanie do molla');
  }
  if(t==='di'){ add(N(r+1,''), 'rozwiązanie: pół tonu w górę'); add(N(r+1,'m'), 'rozwiązanie do molla'); }
  if(t==='au'){ add(N(r+5,''), 'rozwiązanie: kwarta w górę'); add(N(r+4,'m'), 'dźwięk w górę'); }
  // sąsiedzi z dwoma wspólnymi dźwiękami (jak drzewko C → Cm, Em, Am)
  if(c.q==='maj' || t==='d7'){ add(N(r,'m'),'ten sam dźwięk, moll'); add(N(r+4,'m'),'2 wspólne dźwięki'); add(N(r+9,'m'),'2 wspólne (równoległa molowa)'); }
  if(c.q==='min'){ add(N(r,''),'ten sam dźwięk, dur'); add(N(r+3,''),'2 wspólne (równoległa durowa)'); add(N(r+8,''),'2 wspólne dźwięki'); }
  // dominanta do tego akordu — „wtrącona" (jak G7 → C, E7 → Am)
  add(N(r+7,'7'), 'dominanta, która prowadzi do '+chordLabel(c.text));
  // subdominanta
  add(N(r+5, c.q==='min'?'m':''), 'ruch: kwarta w górę');
  return out.slice(0,8);
}
function sameName(a,b){ const x=parseChord(a), y=parseChord(b); return !!x && !!y && x.rootPc===y.rootPc && x.q===y.q && x.ext===y.ext; }

/* ---------- ułóż akordy w pętlę ----------
   Ocena przejścia: rozwiązanie dominanty, wspólne dźwięki, kolejność ról T → S → D → T. */
function transitionScore(a, b, key){
  if(sameName(a.text, b.text)) return -5;
  const rel = relation(a,b);
  let s = rel.common.length;
  if(rel.kind==='dom') s += rel.strong ? 4 : 2.5;
  const fa = functionIn(a,key).fn, fb = functionIn(b,key).fn;
  if(fa==='t' && fb==='s') s += 1;
  if(fa==='s' && fb==='d') s += 1.5;
  if(fa==='d' && fb==='t') s += 2;
  if(fa==='d' && fb==='s') s -= 1;
  return s;
}
function loopScore(chords, key){
  let s=0;
  for(let i=0;i<chords.length;i++) s += transitionScore(chords[i], chords[(i+1)%chords.length], key);
  return s;
}
function permutations(arr){
  if(arr.length<=1) return [arr];
  const out=[];
  arr.forEach((x,i)=>{ permutations([...arr.slice(0,i),...arr.slice(i+1)]).forEach(p=>out.push([x,...p])); });
  return out;
}
/* zwraca {order: [teksty akordów], key}: pętla startuje od toniki, reszta w najlepszej kolejności */
function orderLoop(texts){
  const chords = texts.map(t=>parseChord(t)).filter(Boolean);
  if(chords.length<3) return {order: chords.map(c=>c.text), key: chords.length ? guessLoopKey(chords) : 'C'};
  const key = guessLoopKey(chords);
  const tonicPc = PC[key.replace(/m$/,'')];
  let start = chords.findIndex(c=>c.rootPc===tonicPc && functionIn(c,key).fn==='t');
  if(start<0) start = 0;
  const first = chords[start], rest = chords.filter((_,i)=>i!==start);
  let best=null, bs=-Infinity;
  if(rest.length<=7){
    for(const p of permutations(rest)){ const sc=loopScore([first,...p], key); if(sc>bs){ bs=sc; best=[first,...p]; } }
  }else{
    best=[first]; const left=rest.slice();
    while(left.length){ let bi=0, bv=-Infinity; left.forEach((c,i)=>{ const v=transitionScore(best[best.length-1],c,key); if(v>bv){ bv=v; bi=i; } }); best.push(left.splice(bi,1)[0]); }
  }
  return {order: best.map(c=>c.text), key};
}
/* tonacja pętli: w pętli nie ma „pierwszego" ani „ostatniego" akordu, więc liczy się:
   ile akordów pasuje, dominanty wtrącone (A7 → Dm w C) i czy jest akord toniki (bez septymy). */
function guessLoopKey(chords){
  let best='C', bs=-Infinity;
  for(const {v} of SONG_KEYS){
    const minor = v.endsWith('m'), tonicPc = PC[minor ? v.slice(0,-1) : v];
    const diatonicRoots = chordsFor(majorOfKey(v)).filter(c=>!c.name.endsWith('°')).map(c=>c.pcs[0]);
    let s = 0;
    for(const c of chords){
      if(functionIn(c,v).fn!=='o') s += 1;
      else if(chordType(c)==='d7' && diatonicRoots.includes((c.rootPc+5)%12)) s += .7;
    }
    if(chords.some(c=>c.rootPc===tonicPc && c.q===(minor?'min':'maj') && c.ext!=='7')) s += 1.5;
    if(!minor) s += .1;
    if(s>bs){ bs=s; best=v; }
  }
  return best;
}

/* gotowe pętle do nauki */
const LOOP_PRESETS = [
  {name:'Cztery akordy (pop)', chords:['C','G','Am','F'], desc:'I–V–vi–IV. Pół radia na tym stoi.'},
  {name:'Nostalgiczna', chords:['Am','F','C','G'], desc:'vi–IV–I–V. Ta sama, ale startuje z molla.'},
  {name:'Doo-wop', chords:['C','Am','F','G'], desc:'I–vi–IV–V. Lata 50., ballady.'},
  {name:'ii–V–I (jazz)', chords:['Dm7','G7','Cmaj7'], desc:'Serce jazzu: ruch, napięcie, dom.'},
  {name:'Koło dominant', chords:['C','A7','D7','G7'], desc:'Każdy septymowy ciągnie kwartę w górę: A7 → D7 → G7 → C.'},
  {name:'Kanon (Pachelbel)', chords:['C','G','Am','Em','F','C','F','G'], desc:'Bas schodzi krok po kroku.'},
  {name:'Andaluzyjska', chords:['Am','G','F','E'], desc:'Moll z hiszpańskim zakończeniem na E.'},
  {name:'Moll z dominantą', chords:['Am','Dm','E7'], desc:'i–iv–V7 — E7 mocno ciągnie do Am.'},
  {name:'Widzę dom (refren)', chords:['D','G/D','Bm7','Em7','G','A'], desc:'Twoja piosenka, D-dur.'},
  {name:'Bliżej (zwrotka)', chords:['C#m7','Bsus4','E/G#','Asus2'], desc:'Twoja piosenka, bas idzie schodkami.'},
];
