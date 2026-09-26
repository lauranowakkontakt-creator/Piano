/* ============================================================
   Teoria — logika przeniesiona 1:1 z prototypu akordy.html.
   Dodane: brakujące gamy (A♭, D♭, B, F♯), gamy molowe (równoległe),
   parser symboli akordów do piosenek, formatowanie ♯/♭.
   ============================================================ */
const KEYS = {
  'C':  ['C','D','E','F','G','A','B'],
  'G':  ['G','A','B','C','D','E','F#'],
  'D':  ['D','E','F#','G','A','B','C#'],
  'A':  ['A','B','C#','D','E','F#','G#'],
  'E':  ['E','F#','G#','A','B','C#','D#'],
  'B':  ['B','C#','D#','E','F#','G#','A#'],
  'F#': ['F#','G#','A#','B','C#','D#','E#'],
  'F':  ['F','G','A','Bb','C','D','E'],
  'Bb': ['Bb','C','D','Eb','F','G','A'],
  'Eb': ['Eb','F','G','Ab','Bb','C','D'],
  'Ab': ['Ab','Bb','C','Db','Eb','F','G'],
  'Db': ['Db','Eb','F','Gb','Ab','Bb','C'],
};
// gamy z prototypu — na nich stoi zakładka Gamy i druk
const ORDER = ['C','G','D','A','E','F','Bb','Eb'];
const ALL_KEYS = ['C','G','D','A','E','B','F#','Db','Ab','Eb','Bb','F']; // koło kwintowe
// równoległa molowa: vi stopień gamy durowej
const REL_MINOR = {C:'A',G:'E',D:'B',A:'F#',E:'C#',B:'G#','F#':'D#',F:'D',Bb:'G',Eb:'C',Ab:'F',Db:'Bb'};

const DEG = [
  {rn:'I',    suf:'',   fn:'t'},
  {rn:'ii',   suf:'m',  fn:'s'},
  {rn:'iii',  suf:'m',  fn:'t'},
  {rn:'IV',   suf:'',   fn:'s'},
  {rn:'V',    suf:'',   fn:'d'},
  {rn:'vi',   suf:'m',  fn:'t'},
  {rn:'vii°', suf:'°',  fn:'d'},
];
const FN_NAME = {t:'Tonika', s:'Subdominanta', d:'Dominanta', o:'Spoza gamy'};
const FN_SUB  = {t:'dom, odpoczynek', s:'ruch od domu', d:'napięcie, chce do domu', o:'kolor z zewnątrz'};

const PC = {'C':0,'B#':0,'C#':1,'Db':1,'D':2,'D#':3,'Eb':3,'E':4,'Fb':4,'E#':5,'F':5,
  'F#':6,'Gb':6,'G':7,'G#':8,'Ab':8,'A':9,'A#':10,'Bb':10,'B':11,'Cb':11};
const PC_NAME_SHARP = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const PC_NAME_FLAT  = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];

// zbuduj akordy dla gamy: {rn, name, fn, notes[3], pcs[3]}
function chordsFor(keyName){
  const sc = KEYS[keyName];
  return DEG.map((d,i)=>{
    const notes=[sc[i%7], sc[(i+2)%7], sc[(i+4)%7]];
    const name = notes[0] + d.suf;
    return {rn:d.rn, name, fn:d.fn, notes, pcs:notes.map(n=>PC[n]), deg:i};
  });
}

/* progresje jako indeksy stopni (0 = I) */
const PROGS = [
  {name:'Podstawowa', deg:[0,3,4,0], desc:'Dom, ruch, napięcie, powrót. Od tego zacznij.'},
  {name:'Popowa („cztery akordy")', deg:[0,4,5,3], desc:'Słychać ją w połowie piosenek z radia.'},
  {name:'Nostalgiczna', deg:[5,3,0,4], desc:'Startuje z molowego vi, brzmi bardziej rzewnie.'},
  {name:'Kadencja ii–V–I', deg:[1,4,0], desc:'Serce jazzu. Bardzo mocne rozwiązanie na koniec.'},
  {name:'Doo-wop (lata 50.)', deg:[0,5,3,4], desc:'Klasyka, którą znasz, nawet jeśli nie wiesz skąd.'},
];

/* wspólne akordy dwóch gam — dopasowanie po podstawie + jakości */
function sharedWith(keyA, keyB){
  const A=chordsFor(keyA), B=chordsFor(keyB);
  const qual=n=>n.replace(/^[A-G][#b]?/,'');
  const bkey=B.map(c=>c.pcs[0]+'|'+qual(c.name));
  return A.filter(c=>bkey.includes(c.pcs[0]+'|'+qual(c.name)));
}

/* ---------- formatowanie: # → ♯, b → ♭ ---------- */
function fmt(s){
  if(s==null) return '';
  return String(s).replace(/([A-G])#/g,'$1♯').replace(/([A-G])b/g,'$1♭');
}
function keyLabel(k){ return fmt(k)+'-dur'; }

/* ---------- parser akordów do piosenek ----------
   Obsługuje m.in.: C, Cm, Cmaj, C7, Cmaj7, CM7, Cm7, Cm(maj7), C6, Cm6, C9, C6/9, C5,
   Cdim, C°, Cdim7, Cm7b5, Cø, Caug, C+, Csus2, Csus4, Csus, C7sus4, C2, Cadd9, Gadd4, C/E.
   Nieznana końcówka (np. „Every", „Cxyz") = null, żeby słowa nie udawały akordów.
   Zwraca {root, rootPc, q:'maj'|'min'|'dim'|'aug'|'sus2'|'sus4'|'pow', ext, bass, bassPc, text, iv[], pcs[]}
   iv = odstępy od podstawy w półtonach (9 = 14, nie 2), pcs = klasy dźwięków (0–11), pcs[0] = podstawa. */
const CHORD_SUFFIX = new RegExp('^(?:' +
  '(?<maj>maj|M|Δ)(?<majN>7|9|11|13)?' +
  '|(?<hdim>m7b5|min7b5|-7b5|ø7?)' +
  '|(?<dim>dim|°|o)(?<dim7>7)?' +
  '|(?<aug>aug|\\+)(?<aug7>7)?' +
  '|(?<min>min|mi|m|-)(?:(?<mmaj>maj7|M7|Δ7?)|(?<minN>6|7|9|11|13))?' +
  '|(?<pow>5)' +
  '|(?<six9>6\\/9|69)' +
  '|(?<num>6|7|9|11|13)' +
  '|(?<two>2)|(?<four>4)' +
')?(?<sus>sus2|sus4|sus)?(?:add(?<add>2|4|9|11))?$');
const TRIAD_IV = {maj:[0,4,7],min:[0,3,7],dim:[0,3,6],aug:[0,4,8],sus2:[0,2,7],sus4:[0,5,7],pow:[0,7]};

function parseChord(txt){
  const raw = String(txt??'').trim().replace(/♯/g,'#').replace(/♭/g,'b');
  const m = raw.match(/^([A-Ga-g])([#b]?)(.*)$/);
  if(!m) return null;
  const root = m[1].toUpperCase()+m[2];
  if(PC[root]===undefined) return null;
  let rest = m[3].replace(/[()]/g,'');
  let bass = null;
  const sl = rest.match(/\/([A-Ga-g][#b]?)$/);
  if(sl){ bass = sl[1][0].toUpperCase()+sl[1].slice(1); rest = rest.slice(0, sl.index); }
  const g = (rest.match(CHORD_SUFFIX)||{}).groups;
  if(!g) return null;
  let q='maj', ext='';
  const extra=[];
  const upper = n => { extra.push(10); if(n!=='7') extra.push(14); ext='7'; };   // 9/11/13 = septyma + nona
  if(g.maj){ if(g.majN){ extra.push(11); if(g.majN!=='7') extra.push(14); ext='maj7'; } }
  else if(g.hdim){ q='dim'; extra.push(10); ext='m7b5'; }
  else if(g.dim){ q='dim'; if(g.dim7){ extra.push(9); ext='dim7'; } }
  else if(g.aug){ q='aug'; if(g.aug7){ extra.push(10); ext='7'; } }
  else if(g.min){
    q='min';
    if(g.mmaj){ extra.push(11); ext='mmaj7'; }
    else if(g.minN==='6'){ extra.push(9); ext='6'; }
    else if(g.minN) upper(g.minN);
  }
  else if(g.pow){ q='pow'; }
  else if(g.six9){ extra.push(9,14); ext='6'; }
  else if(g.num==='6'){ extra.push(9); ext='6'; }
  else if(g.num) upper(g.num);
  else if(g.two){ q='sus2'; }
  else if(g.four){ q='sus4'; }
  if(g.sus) q = g.sus==='sus2' ? 'sus2' : 'sus4';
  if(g.add==='2'||g.add==='9'){ extra.push(14); if(!ext) ext='add9'; }
  if(g.add==='4'||g.add==='11'){ extra.push(17); if(!ext) ext='add4'; }
  const rp = PC[root];
  const iv = [...TRIAD_IV[q], ...extra];
  const pcs = [...new Set(iv.map(i=>(rp+i)%12))];
  return {root, rootPc:rp, q, ext, bass, bassPc: bass && PC[bass]!==undefined ? PC[bass] : null, text:raw, iv, pcs};
}

/* Funkcja akordu w tonacji.
   keyName: 'C' (dur) albo 'Am' (moll — używa akordów równoległej gamy durowej,
   plus durowa dominanta V i zmniejszony vii°, typowe w moll). Zwraca {fn, rn} albo {fn:'o', rn:''}. */
function isMinorKeyName(keyName){ return /m$/.test(String(keyName||'')); }
// gama durowa, na której akordach stoi tonacja (a-moll → C, d♯-moll/e♭-moll → F♯).
// Nieznana nazwa → 'C', żeby nic się nie wysypało na złych danych (np. z importu).
function majorOfKey(keyName){
  const k = String(keyName||'');
  if(Object.hasOwn(KEYS,k)) return k;
  const byPc = pc => pc===undefined ? null : ALL_KEYS.find(x=>PC[x]===pc%12) || null;
  if(isMinorKeyName(k)){ const pc=PC[k.slice(0,-1)]; const maj = pc===undefined ? null : byPc(pc+3); if(maj) return maj; }
  return byPc(PC[k]) || 'C';
}
// czy to tonacja, którą appka umie obsłużyć (dur z KEYS albo moll od dowolnego dźwięku)
function isKnownKey(keyName){
  const k = String(keyName||'');
  if(Object.hasOwn(KEYS,k)) return true;
  return isMinorKeyName(k) && PC[k.slice(0,-1)]!==undefined;
}
const MINOR_RN = ['III','iv','v','VI','VII','i','ii°'];
const MINOR_FN = ['t','s','d','s','d','t','s']; // funkcje w moll (względem i)
function functionIn(chord, keyName){
  if(!chord) return {fn:'o', rn:''};
  const major = majorOfKey(keyName);
  const isMinor = isMinorKeyName(keyName);
  const chords = chordsFor(major);
  const qOf = c => c.name.endsWith('°') ? 'dim' : c.name.endsWith('m') ? 'min' : 'maj';
  let qq = chord.q;
  if(qq==='sus2'||qq==='sus4'||qq==='pow') qq = null; // sus i „5": bez tercji, dopasuj tylko po podstawie
  for(const c of chords){
    if(c.pcs[0]===chord.rootPc && (qq===null || qOf(c)===qq)){
      if(isMinor) return {fn:MINOR_FN[c.deg], rn:MINOR_RN[c.deg]};
      return {fn:c.fn, rn:c.rn};
    }
  }
  if(isMinor){
    // durowa dominanta w moll (np. E w a-moll)
    const tonicPc = (PC[major]+9)%12;
    if(chord.rootPc===(tonicPc+7)%12 && chord.q==='maj') return {fn:'d', rn:'V'};
    // zmniejszony na dźwięku prowadzącym (np. G♯° w a-moll) — też dominanta
    if(chord.rootPc===(tonicPc+11)%12 && chord.q==='dim') return {fn:'d', rn:'vii°'};
  }else{
    // dominanta wtrącona do V (np. D w C) — też napięcie
    const tonicPc = PC[major];
    if(chord.rootPc===(tonicPc+2)%12 && chord.q==='maj') return {fn:'o', rn:'V/V'};
  }
  return {fn:'o', rn:''};
}

/* Rozbij tekst akordów piosenki na linie i akordy.
   Linia może zaczynać się od etykiety w nawiasie: "[Zwrotka] C G Am F". "|" = kreska taktowa. */
function parseSongText(text){
  return String(text||'').split(/\n/).map(line=>{
    let label = '';
    const lm = line.match(/^\s*\[([^\]]+)\]\s*/);
    if(lm){ label = lm[1]; line = line.slice(lm[0].length); }
    const tokens = line.split(/\s+/).filter(Boolean).map(t=>{
      if(t==='|' ) return {bar:true};
      const p = parseChord(t);
      return p ? {chord:p} : {junk:t};
    });
    return {label, tokens};
  }).filter(l=>l.label || l.tokens.length);
}

/* skala z dowolnego dźwięku wg wzoru C-C-P-C-C-C-P (do lekcji) */
const MAJOR_STEPS = [2,2,1,2,2,2,1];
function majorScalePcs(rootPc){
  const out=[rootPc]; let p=rootPc;
  for(let i=0;i<6;i++){ p=(p+MAJOR_STEPS[i])%12; out.push(p); }
  return out;
}
