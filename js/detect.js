/* ============================================================
   Rozpoznawanie akordu z granych dźwięków — odwrotność parseChord.
   Dostaje dźwięki MIDI (to, co trzymasz na klawiaturze albo na pianinie
   przez MIDI) i mówi, co to za akord: nazwa, przewrót, bas po ukośniku.
   Sama logika, bez rysowania i bez dźwięku. Testy: test/unit/detect.test.js.
   ============================================================ */

/* Wzory akordów od podstawy, w półtonach. „waga" to pierwszeństwo przy remisie:
   zwykły dur ma wygrywać z egzotycznym akordem o tych samych dźwiękach. */
const CHORD_SHAPES = [
  {suf:'',      iv:[0,4,7],        waga:10, opis:'dur'},
  {suf:'m',     iv:[0,3,7],        waga:10, opis:'moll'},
  {suf:'7',     iv:[0,4,7,10],     waga:9,  opis:'septymowy (dominanta)'},
  {suf:'m7',    iv:[0,3,7,10],     waga:8,  opis:'moll z septymą małą'},
  {suf:'maj7',  iv:[0,4,7,11],     waga:8,  opis:'dur z septymą wielką'},
  {suf:'sus4',  iv:[0,5,7],        waga:7,  opis:'zawieszony na kwarcie'},
  {suf:'sus2',  iv:[0,2,7],        waga:7,  opis:'zawieszony na sekundzie'},
  {suf:'6',     iv:[0,4,7,9],      waga:7,  opis:'dur z sekstą'},
  {suf:'dim',   iv:[0,3,6],        waga:7,  opis:'zmniejszony'},
  {suf:'m6',    iv:[0,3,7,9],      waga:6,  opis:'moll z sekstą'},
  {suf:'m7b5',  iv:[0,3,6,10],     waga:6,  opis:'półzmniejszony'},
  {suf:'dim7',  iv:[0,3,6,9],      waga:6,  opis:'zmniejszony septymowy'},
  {suf:'aug',   iv:[0,4,8],        waga:6,  opis:'zwiększony'},
  {suf:'add9',  iv:[0,2,4,7],      waga:6,  opis:'dur z dodaną noną'},
  {suf:'7sus4', iv:[0,5,7,10],     waga:6,  opis:'zawieszony z septymą'},
  {suf:'m(maj7)',iv:[0,3,7,11],    waga:5,  opis:'moll z septymą wielką'},
  {suf:'9',     iv:[0,2,4,7,10],   waga:5,  opis:'nonowy'},
  {suf:'m9',    iv:[0,2,3,7,10],   waga:5,  opis:'molowy nonowy'},
  {suf:'maj9',  iv:[0,2,4,7,11],   waga:5,  opis:'nonowy z septymą wielką'},
  {suf:'5',     iv:[0,7],          waga:4,  opis:'kwinta (power chord)'},
];
// akordy, w których wolno nie grać kwinty (pianiści często ją pomijają)
const KWINTA_OPCJONALNA = new Set(['7','m7','maj7','9','m9','maj9','m(maj7)','6','m6']);

const pcOf = m => ((m % 12) + 12) % 12;
const uniq = a => [...new Set(a)];

/* Rozpoznaj akord. midis = dźwięki MIDI (kolejność bez znaczenia, duplikaty i oktawy OK).
   Zwraca null (nic sensownego) albo:
   {name, label, root, rootPc, suf, opis, bassPc, slash, inversion, invName, pcs, missing, extra, exact}
   name  — zapis, który rozumie parseChord (np. „Dm7", „C/E"),
   slash — czy bas jest inny niż podstawa, inversion — numer przewrotu (0 = zasadnicza). */
function detectChord(midis, opts={}){
  const sharp = !!opts.preferSharp;
  const nuty = (midis||[]).filter(m=>Number.isFinite(m)).sort((a,b)=>a-b);
  if(!nuty.length) return null;
  const pcs = uniq(nuty.map(pcOf));
  const bassPc = pcOf(nuty[0]);
  if(pcs.length === 1) return null;              // jeden dźwięk (choćby w oktawach) to jeszcze nie akord
  if(pcs.length === 2) return dwaDzwieki(pcs, bassPc, nuty, sharp);

  let best = null;
  for(let root=0; root<12; root++){
    for(const shape of CHORD_SHAPES){
      const chceme = shape.iv.map(i=>(root+i)%12);
      const brak = chceme.filter(p=>!pcs.includes(p));
      const nadmiar = pcs.filter(p=>!chceme.includes(p));
      if(nadmiar.length) continue;               // obcy dźwięk = to nie ten akord
      if(brak.length > 1) continue;
      if(brak.length === 1){
        const kwinta = (root+7)%12;
        if(brak[0] !== kwinta || !KWINTA_OPCJONALNA.has(shape.suf)) continue;
      }
      const wynik = (brak.length ? 0 : 200)       // komplet zawsze bije akord „bez kwinty"
        + shape.waga*10
        + (root===bassPc ? 25 : 0)               // potem: najchętniej czytamy od basu
        + pcs.length;                            // przy remisie wygrywa bogatsza interpretacja
      if(!best || wynik > best.wynik) best = {root, shape, brak, wynik};
    }
  }
  if(!best) return null;
  return opisz(best.root, best.shape, bassPc, pcs, best.brak, nuty, sharp);
}

/* dwa dźwięki: kwinta/kwarta to „power chord", reszta to po prostu interwał */
function dwaDzwieki(pcs, bassPc, nuty, sharp){
  const odstep = (nuty[nuty.length-1] - nuty[0]) % 12;
  const root = odstep===7 ? bassPc : odstep===5 ? pcOf(nuty[nuty.length-1]) : null;
  if(root===null) return null;
  return opisz(root, CHORD_SHAPES.find(s=>s.suf==='5'), bassPc, pcs, [], nuty, sharp);
}

/* Pisownia: domyślnie bemolami (jak w SPELL), ale w tonacjach krzyżykowych
   wołamy z preferSharp, żeby w D-dur wyszło C♯, a nie D♭. */
function opisz(root, shape, bassPc, pcs, brak, nuty, sharp){
  const rootName = pcName(root, sharp);
  const slash = root !== bassPc;
  const name = rootName + shape.suf + (slash ? '/' + pcName(bassPc, sharp) : '');
  const ivFromRoot = shape.iv.filter(i=>!brak.includes((root+i)%12));
  const inversion = slash ? Math.max(0, ivFromRoot.indexOf((bassPc-root+12)%12)) : 0;
  return {
    name,
    label: chordLabel(name),
    root: rootName,
    rootPc: root,
    suf: shape.suf,
    opis: shape.opis,
    bassPc,
    slash,
    inversion,
    invName: INV_NAMES[inversion] || '',
    pcs,
    missing: brak,
    exact: !brak.length,
    nuty,
  };
}

/* Nazwy granych dźwięków z pisownią akordu (np. w A7 zagrane C♯, nie D♭). */
function detectNoteNames(midis, det, preferSharp=false){
  const parsed = det ? parseChord(det.name) : null;
  const spell = parsed ? spellChord(parsed) : null;
  return (midis||[]).slice().sort((a,b)=>a-b).map(m=>{
    const pc = pcOf(m);
    const n = spell && spell[pc] ? spell[pc] : pcName(pc, preferSharp);
    return {midi:m, pc, name:fmt(n), oktawa: Math.floor(m/12)-1};
  });
}

/* Interwał między dwoma dźwiękami — do podpowiedzi przy dwóch klawiszach. */
const INTERVAL_NAMES = ['pryma','sekunda mała','sekunda wielka','tercja mała','tercja wielka',
  'kwarta czysta','tryton','kwinta czysta','seksta mała','seksta wielka','septyma mała','septyma wielka','oktawa'];
function intervalName(a, b){
  const d = Math.abs(a-b);
  if(d <= 12) return INTERVAL_NAMES[d];
  const reszta = d % 12;
  return (INTERVAL_NAMES[reszta] || '') + ' + ' + Math.floor(d/12) + (Math.floor(d/12)===1?' oktawa':' oktawy');
}

/* Gamy, do których pasują wszystkie zagrane dźwięki — „w czym to gram". */
function matchingKeys(midis, max=4){
  const pcs = uniq((midis||[]).map(pcOf));
  if(!pcs.length) return [];
  return SONG_KEYS
    .map(k => ({...k, scale: majorScalePcs(PC[majorOfKey(k.v)])}))
    .filter(k => pcs.every(p => k.scale.includes(p)))
    .slice(0, max)
    .map(k => ({v:k.v, l:k.l}));
}
