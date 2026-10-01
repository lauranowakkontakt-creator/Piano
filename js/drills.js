/* ============================================================
   Ćwiczenia do zakładki „Trening" — same zadania, bez rysowania i bez dźwięku.
   Każdy rodzaj ćwiczenia mówi:
     items(opts) → lista „rzeczy do opanowania" (id trafia do powtórek w srs.js),
     make(id, rng, opts) → jedno konkretne zadanie.
   Zadanie to zwykły obiekt:
     {id, kind, prompt, hint, sound, type:'wybor'|'klawisze', options, answer, why, keys}
   sound opisuje, co zagrać ({chords:[...]}, {notes:[...]}, {stack:[...]}) — gra to
   dopiero widok, dzięki czemu wszystko tutaj da się przetestować w node.
   Testowane w test/unit/drills.test.js.
   ============================================================ */

/* ---------- drobne pomocniki na losowanie (rng wstrzykiwane = testowalne) ---------- */
function pickOne(rng, arr){ return arr[Math.min(arr.length-1, Math.floor(rng()*arr.length))]; }
function shuffle(rng, arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){ const j = Math.min(i, Math.floor(rng()*(i+1))); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}
/* dobierz n-1 wabików różnych od poprawnej odpowiedzi i wymieszaj wszystko */
function withDistractors(rng, correct, all, n=4){
  const pool = all.filter(x => x !== correct);
  const picked = shuffle(rng, pool).slice(0, Math.max(0, n-1));
  const options = shuffle(rng, [correct, ...picked]);
  return {options, answer: options.indexOf(correct)};
}

/* ---------- rodzaje akordów do ucha i do chwytów ---------- */
const DRILL_QUALITIES = [
  {id:'mj',   suf:'',     name:'dur',            why:'Tercja wielka (4 półtony) + kwinta czysta. Jasny, „domowy".'},
  {id:'mn',   suf:'m',    name:'moll',           why:'Tercja mała (3 półtony) — o pół tonu niżej niż w dur. Ciemniejszy.'},
  {id:'d7',   suf:'7',    name:'septymowy (7)',  why:'Dur + septyma mała. Napięcie, które chce rozwiązać się kwartę wyżej.'},
  {id:'maj7', suf:'maj7', name:'maj7',           why:'Dur + septyma wielka. Miękki, „kawiarniany" — nie ciągnie nigdzie.'},
  {id:'m7',   suf:'m7',   name:'m7',             why:'Moll + septyma mała. Łagodniejszy od zwykłego molla.'},
  {id:'di',   suf:'dim',  name:'zmniejszony (°)',why:'Dwie tercje małe jedna na drugiej. Ciasny, niespokojny.'},
  {id:'au',   suf:'aug',  name:'zwiększony (+)', why:'Dwie tercje wielkie. Rozciągnięty, „w drodze", bez domu.'},
  {id:'su',   suf:'sus4', name:'sus4',           why:'Zamiast tercji — kwarta. Bez tercji nie wiadomo, czy dur, czy moll.'},
];
const QUAL_BY_ID = Object.fromEntries(DRILL_QUALITIES.map(q=>[q.id,q]));
const DRILL_ROOTS = ['C','D','E','F','G','A','Bb','Eb','Ab','F#'];

/* ---------- interwały ---------- */
const INTERWALY = [
  {n:1,  name:'sekunda mała',   piosenka:'motyw ze „Szczęk"'},
  {n:2,  name:'sekunda wielka', piosenka:'„Panie Janie" (Pa–nie)'},
  {n:3,  name:'tercja mała',    piosenka:'„Greensleeves"'},
  {n:4,  name:'tercja wielka',  piosenka:'„When the Saints"'},
  {n:5,  name:'kwarta czysta',  piosenka:'marsz weselny („Here comes the bride")'},
  {n:6,  name:'tryton',         piosenka:'czołówka „Simpsonów"'},
  {n:7,  name:'kwinta czysta',  piosenka:'„Świeć gwiazdeczko" / Gwiezdne wojny'},
  {n:8,  name:'seksta mała',    piosenka:''},
  {n:9,  name:'seksta wielka',  piosenka:''},
  {n:10, name:'septyma mała',   piosenka:'„Somewhere" z West Side Story'},
  {n:11, name:'septyma wielka', piosenka:''},
  {n:12, name:'oktawa',         piosenka:'„Over the Rainbow"'},
];
const INT_BY_N = Object.fromEntries(INTERWALY.map(i=>[i.n,i]));

/* tonacja zadania: wybrana przez Laurę albo losowa z prostszych gam */
const DRILL_KEYS = ['C','G','D','A','F','Bb','Eb','E'];
function drillKey(rng, opts){
  const k = opts && opts.key;
  return k && k!=='los' && KEYS[k] ? k : pickOne(rng, DRILL_KEYS);
}
const RN_ALL = DEG.map(d=>d.rn);

/* ============================================================
   Rodzaje ćwiczeń
   ============================================================ */
const DRILL_KINDS = [
{
  id:'ucho', name:'Akord ze słuchu', opis:'Słyszysz akord — rozpoznaj rodzaj.',
  items(){ return DRILL_QUALITIES.map(q=>'ucho:'+q.id); },
  make(id, rng){
    const q = QUAL_BY_ID[id.split(':')[1]] || DRILL_QUALITIES[0];
    const root = pickOne(rng, DRILL_ROOTS);
    const txt = root + q.suf;
    const names = DRILL_QUALITIES.map(x=>x.name);
    const {options, answer} = withDistractors(rng, q.name, names, 4);
    return {id, kind:'ucho', prompt:'Jaki to rodzaj akordu?',
      hint:'Posłuchaj jeszcze raz — tercja decyduje, czy dur, czy moll.',
      sound:{chords:[txt]}, type:'wybor', options, answer,
      why:`To ${chordLabel(txt)} — ${q.name}. ${q.why}`,
      reveal:chordLabel(txt)};
  }
},
{
  id:'int', name:'Interwał ze słuchu', opis:'Dwa dźwięki po kolei — jak daleko od siebie?',
  items(){ return INTERWALY.map(i=>'int:'+i.n); },
  make(id, rng){
    const n = +id.split(':')[1];
    const iv = INT_BY_N[n] || INTERWALY[0];
    const from = 57 + Math.floor(rng()*8);                 // A3–E4, żeby góra mieściła się wygodnie
    const names = INTERWALY.map(x=>x.name);
    const {options, answer} = withDistractors(rng, iv.name, names, 4);
    return {id, kind:'int', prompt:'Jaki to interwał?',
      hint:'Zanucz oba dźwięki pod rząd — i policz schodki.',
      sound:{notes:[from, from+n], step:0.6, dur:0.9}, type:'wybor', options, answer,
      why:`${iv.name} — ${n} ${n===1?'półton':n<5?'półtony':'półtonów'}.` + (iv.piosenka ? ` Zapamiętaj przez ${iv.piosenka}.` : ''),
      reveal:`${iv.name} (${n})`};
  }
},
{
  id:'stopien', name:'Który stopień', opis:'Akord w tonacji — podaj cyfrę rzymską.',
  items(){ return RN_ALL.map(rn=>'stopien:'+rn); },
  make(id, rng, opts){
    const rn = id.split(':')[1];
    const key = drillKey(rng, opts);
    const chords = chordsFor(key);
    const ch = chords.find(c=>c.rn===rn) || chords[0];
    const tonic = chords[0];
    const {options, answer} = withDistractors(rng, ch.rn, RN_ALL, 4);
    return {id, kind:'stopien', prompt:`Jesteś w <b>${esc(keyLabel(key))}</b>. Który to stopień: <b>${esc(chordLabel(ch.name))}</b>?`,
      hint:'Policz od toniki w górę po gamie: I, ii, iii, IV…',
      sound:{chords:[tonic.name, ch.name]}, type:'wybor', options, answer,
      why:`W ${keyLabel(key)} akord ${chordLabel(ch.name)} to stopień ${ch.rn} — ${FN_NAME[ch.fn].toLowerCase()} (${FN_SUB[ch.fn]}).`,
      reveal:ch.rn};
  }
},
{
  id:'rola', name:'Rola akordu', opis:'Tonika, subdominanta czy dominanta?',
  items(){ return ['rola:t','rola:s','rola:d']; },
  make(id, rng, opts){
    const fn = id.split(':')[1];
    const key = drillKey(rng, opts);
    const chords = chordsFor(key);
    const ch = pickOne(rng, chords.filter(c=>c.fn===fn)) || chords[0];
    const names = ['Tonika','Subdominanta','Dominanta'];
    const correct = FN_NAME[ch.fn];
    const {options, answer} = withDistractors(rng, correct, names, 3);
    return {id, kind:'rola', prompt:`W <b>${esc(keyLabel(key))}</b>: jaką rolę gra <b>${esc(chordLabel(ch.name))}</b>?`,
      hint:'Najpierw słychać tonikę (dom), potem akord z pytania.',
      sound:{chords:[chords[0].name, ch.name]}, type:'wybor', options, answer,
      why:`${chordLabel(ch.name)} to ${ch.rn} w ${keyLabel(key)} — ${FN_NAME[ch.fn].toLowerCase()}: ${FN_SUB[ch.fn]}.`,
      reveal:FN_NAME[ch.fn]};
  }
},
{
  id:'dalej', name:'Co dalej', opis:'Który akord rozwiązuje napięcie.',
  items(){ return ['dalej:V7','dalej:V','dalej:vii°','dalej:ii','dalej:IV']; },
  make(id, rng, opts){
    const co = id.split(':')[1];
    const key = drillKey(rng, opts);
    const chords = chordsFor(key);
    const byRn = rn => chords.find(c=>c.rn===rn);
    const plan = {
      'V7':   {from: byRn('V').name+'7', to: byRn('I').name,  why:'Septymowy na V ciągnie kwartę w górę — prosto do I.'},
      'V':    {from: byRn('V').name,     to: byRn('I').name,  why:'Dominanta wraca do domu: V → I.'},
      'vii°': {from: byRn('vii°').notes[0]+'dim', to: byRn('I').name, why:'Zmniejszony na VII stopniu leży pół tonu pod toniką i do niej ciągnie.'},
      'ii':   {from: byRn('ii').name,    to: byRn('V').name,  why:'ii–V–I: ruch (ii) prowadzi do napięcia (V).'},
      'IV':   {from: byRn('IV').name,    to: byRn('V').name,  why:'Subdominanta zwykle idzie dalej od domu — do dominanty.'},
    }[co] || {from: byRn('V').name, to: byRn('I').name, why:''};
    const all = [...chords.map(c=>c.name), byRn('V').name+'7'].map(chordLabel);
    const {options, answer} = withDistractors(rng, chordLabel(plan.to), all, 4);
    return {id, kind:'dalej', prompt:`Jesteś w <b>${esc(keyLabel(key))}</b> i grasz <b>${esc(chordLabel(plan.from))}</b>. Co najnaturalniej dalej?`,
      hint:'Posłuchaj, dokąd ucho samo chce iść.',
      sound:{chords:[plan.from]}, type:'wybor', options, answer,
      why:plan.why+` (${chordLabel(plan.from)} → ${chordLabel(plan.to)})`,
      answerSound:{chords:[plan.from, plan.to]},
      reveal:chordLabel(plan.to)};
  }
},
{
  id:'chwyt', name:'Zagraj akord', opis:'Złóż akord na klawiaturze.',
  items(){ return ['chwyt:mj','chwyt:mn','chwyt:d7','chwyt:maj7','chwyt:m7','chwyt:di','chwyt:su']; },
  make(id, rng){
    const q = QUAL_BY_ID[id.split(':')[1]] || DRILL_QUALITIES[0];
    const root = pickOne(rng, DRILL_ROOTS);
    const txt = root + q.suf;
    const c = parseChord(txt);
    return {id, kind:'chwyt', prompt:`Kliknij dźwięki akordu <b>${esc(chordLabel(txt))}</b>`,
      hint:'Podstawa, tercja, kwinta — a przy septymowych jeszcze septyma.',
      sound:null, type:'klawisze', keys:{pcs:c.pcs, from:60, to:84},
      options:[], answer:0,
      why:`${chordLabel(txt)} = ${c.pcs.map(p=>fmt(spellChord(c)[p])).join(' + ')}. ${q.why}`,
      answerSound:{chords:[txt]},
      reveal:chordLabel(txt)};
  }
},
{
  id:'inv', name:'Przewrót', opis:'Patrzysz na chwyt — który to przewrót?',
  items(){ return ['inv:0','inv:1','inv:2']; },
  make(id, rng){
    const want = +id.split(':')[1];
    const q = pickOne(rng, [QUAL_BY_ID.mj, QUAL_BY_ID.mn]);
    const root = pickOne(rng, DRILL_ROOTS);
    const c = parseChord(root + q.suf);
    const pcs = rightHandPcs(c);
    // przewrót = który dźwięk akordu leży najniżej
    const order = [...pcs.slice(want), ...pcs.slice(0, want)];
    const notes = [60 + order[0] - (order[0]>8 ? 12 : 0)];
    for(let k=1;k<order.length;k++){ let m = notes[k-1]+1; while(m%12 !== order[k]) m++; notes.push(m); }
    const names = INV_NAMES.slice(0, 3);
    const {options, answer} = withDistractors(rng, names[want], names, 3);
    return {id, kind:'inv', prompt:`To akord <b>${esc(chordLabel(c.text))}</b>. Który to przewrót?`,
      hint:'Patrz na najniższy dźwięk: podstawa, tercja czy kwinta?',
      sound:{stack:notes}, type:'wybor', options, answer,
      keys:{show:notes, from:55, to:84},
      why:`Najniżej leży ${fmt(spellChord(c)[order[0]])} — ${want===0?'podstawa, więc pozycja zasadnicza':want===1?'tercja, więc 1. przewrót':'kwinta, więc 2. przewrót'}.`,
      reveal:names[want]};
  }
},
];
const DRILL_BY_ID = Object.fromEntries(DRILL_KINDS.map(k=>[k.id,k]));
const DRILL_DEFAULT = ['ucho','int','stopien','rola','dalej','chwyt','inv'];

/* pula „rzeczy do opanowania" dla włączonych rodzajów */
function drillPool(enabled, opts){
  const on = (enabled && enabled.length ? enabled : DRILL_DEFAULT).filter(k=>DRILL_BY_ID[k]);
  return on.flatMap(k => DRILL_BY_ID[k].items(opts||{}));
}
/* zbuduj zadanie dla danego id („ucho:mn" → rodzaj „ucho") */
function makeTask(id, rng=Math.random, opts={}){
  const kind = DRILL_BY_ID[String(id).split(':')[0]];
  if(!kind) return null;
  return kind.make(id, rng, opts);
}
/* ludzka nazwa rzeczy do opanowania — do listy „nad tym popracuj" */
function drillLabel(id){
  const [k, rest] = String(id).split(':');
  const kind = DRILL_BY_ID[k];
  if(!kind) return String(id);
  let co = rest;
  if(k==='ucho' || k==='chwyt') co = (QUAL_BY_ID[rest]||{}).name || rest;
  else if(k==='int') co = (INT_BY_N[+rest]||{}).name || rest;
  else if(k==='rola') co = FN_NAME[rest] || rest;
  else if(k==='inv') co = INV_NAMES[+rest] || rest;
  else if(k==='dalej') co = 'po '+fmt(rest);
  else co = fmt(co);
  return `${kind.name}: ${co}`;
}
/* czy odpowiedź jest dobra. Dla klawiatury porównujemy zbiory klas dźwięków. */
function checkAnswer(task, given){
  if(!task) return false;
  if(task.type==='klawisze'){
    const want = new Set(task.keys.pcs);
    const got = new Set((given||[]).map(m => ((m%12)+12)%12));
    return want.size===got.size && [...want].every(p=>got.has(p));
  }
  return given === task.answer;
}
