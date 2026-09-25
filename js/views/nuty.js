/* Zakładka „Nuty" — czytanie nut od zera + trener „Jaka to nuta?" */

const NUTY_LESSONS = [
{ id:'pieciolinia', title:'Pięciolinia: gdzie mieszkają nuty',
  body:`
<p class="kicker">nuty · lekcja 1</p>
<h2>Pięć linii i cztery pola</h2>
<p>Nuty zapisuje się na <b>pięciolinii</b>: 5 poziomych linii i 4 pola (odstępy) między nimi. Każda linia i każde pole to <b>jeden biały klawisz</b>. Im <b>wyżej</b> nuta, tym <b>wyższy</b> dźwięk (bardziej w prawo na klawiaturze).</p>
<div class="staff-box" data-staff="scale"></div>
<p><button class="listen" data-notes="60 62 64 65 67 69 71 72">posłuchaj</button> Nuty idą schodkami: linia, pole, linia, pole… Każdy schodek to następny biały klawisz.</p>
<div class="box tip"><p>Liczymy linie <b>od dołu</b>: 1. linia to najniższa. Nuty wyżej lub niżej niż pięciolinia dostają małe kreseczki — <b>linie dodane</b>.</p></div>
<h3>Klucz mówi, która to wysokość</h3>
<p>Znak na początku pięciolinii to <b>klucz</b>. Na pianinie są dwa:</p>
<ul>
<li><b>Wiolinowy</b> (𝄞) — dla prawej ręki, wyższe dźwięki. Zakręca się wokół 2. linii i mówi: „tu jest G".</li>
<li><b>Basowy</b> (𝄢) — dla lewej ręki, niższe dźwięki. Jego dwie kropki otaczają 4. linię i mówią: „tu jest F".</li>
</ul>
<p>Na pianinie oba grasz naraz — to <b>system fortepianowy</b>. Między nimi leży <b>środkowe C</b> (C4), na linii dodanej:</p>
<div class="staff-box" data-staff="grand-c"></div>
<div class="box try"><p>Znajdź środkowe C na pianinie: to C najbliżej środka klawiatury, zwykle pod nazwą firmy. Od niego prawa ręka idzie w górę (klucz wiolinowy), lewa w dół (klucz basowy).</p></div>`,
  quiz:[
    {q:'Ile linii ma pięciolinia?', opts:['4','5','6'], a:1},
    {q:'Nuta wyżej na pięciolinii to…', opts:['wyższy dźwięk','niższy dźwięk','głośniejszy dźwięk'], a:0},
    {q:'Klucz basowy to zwykle…', opts:['prawa ręka','lewa ręka'], a:1},
  ]},
{ id:'wiolinowy', title:'Klucz wiolinowy (prawa ręka)',
  body:`
<p class="kicker">nuty · lekcja 2</p>
<h2>Dwa zdania i znasz cały klucz wiolinowy</h2>
<p><b>Linie</b> od dołu: <span class="mono">E G B D F</span> — <b>„Ewa Gra Bardzo Dobrze Fortepian"</b>.</p>
<div class="staff-box" data-staff="t-lines"></div>
<p><b>Pola</b> od dołu: <span class="mono">F A C E</span> — po angielsku <b>„FACE"</b>, twarz. Łatwe.</p>
<div class="staff-box" data-staff="t-spaces"></div>
<div class="box tip"><p>Punkty zaczepienia (ucz się ich na pamięć, resztę licz od nich): <b>G</b> na 2. linii (tam zakręca się klucz), <b>środkowe C</b> pod pięciolinią na linii dodanej, <b>wysokie C</b> w 3. polu.</p></div>
<p>Od punktu zaczepienia liczysz schodkami: linia → pole → linia. Zobaczysz nutę tuż nad G? To A.</p>
<div class="box try"><p>Połóż prawą rękę na środkowym C (kciuk) — palce same leżą na C D E F G. Na pięciolinii to: linia dodana, pod pięciolinią, 1. linia, 1. pole, 2. linia. Zagraj je patrząc tylko na nuty.</p></div>
<p>Teraz ćwicz w <a href="#nuty/trener">trenerze</a> — tylko klucz wiolinowy, zakres „na pięciolinii".</p>`,
  quiz:[
    {q:'Linie klucza wiolinowego od dołu:', opts:['E G B D F','F A C E','G B D F A'], a:0, why:'Ewa Gra Bardzo Dobrze Fortepian.'},
    {q:'Nuta w 2. polu (od dołu) w kluczu wiolinowym to…', opts:['A','C','E'], a:0, why:'F-A-C-E: drugie pole to A.'},
  ]},
{ id:'basowy', title:'Klucz basowy (lewa ręka)',
  body:`
<p class="kicker">nuty · lekcja 3</p>
<h2>Basowy: te same linie, inne nazwy</h2>
<p><b>Linie</b> od dołu: <span class="mono">G B D F A</span> — <b>„Gosia Bardzo Dobrze Fotografuje Auta"</b>.</p>
<div class="staff-box" data-staff="b-lines"></div>
<p><b>Pola</b> od dołu: <span class="mono">A C E G</span> — <b>„Ala Chce Ekstra Gitarę"</b>.</p>
<div class="staff-box" data-staff="b-spaces"></div>
<div class="box tip"><p>Punkty zaczepienia: <b>F</b> na 4. linii (między kropkami klucza), <b>środkowe C</b> nad pięciolinią na linii dodanej, <b>niskie C</b> w 2. polu.</p></div>
<div class="box why"><p>Sprytny trik: na tym samym miejscu pięciolinii nazwa w kluczu basowym jest <b>o dwie litery dalej</b> niż w wiolinowym: na 1. linii wiolinowego jest E, basowego — G (E → F → G). W 1. polu: F → A. Ale uwaga, to tylko pomoc na start — docelowo czytaj każdy klucz osobno.</p></div>
<div class="box try"><p>Lewa ręka: mały palec na C w 2. polu basowego (C3). Zagraj C–F–G–C (podstawy akordów z gamy C) patrząc na nuty w trenerze.</p></div>`,
  quiz:[
    {q:'Linie klucza basowego od dołu:', opts:['E G B D F','G B D F A','A C E G'], a:1, why:'Gosia Bardzo Dobrze Fotografuje Auta.'},
    {q:'Pola klucza basowego od dołu:', opts:['F A C E','A C E G','G B D F'], a:1},
  ]},
{ id:'rytm', title:'Rytm: jak długo trzymać nutę',
  body:`
<p class="kicker">nuty · lekcja 4</p>
<h2>Wygląd nuty mówi, jak długo ją trzymać</h2>
<p>Wysokość mówi <b>który</b> klawisz, a kształt — <b>jak długo</b>. Liczymy w <b>uderzeniach</b> (miarach), jak tupanie nogą do muzyki.</p>
<div class="rhythm-grid" data-widget="values"></div>
<div class="box tip"><p>Każda następna wartość to <b>połowa</b> poprzedniej: 1 cała = 2 półnuty = 4 ćwierćnuty = 8 ósemek. <b>Kropka</b> obok nuty dodaje jej połowę: półnuta z kropką = 2 + 1 = 3 uderzenia.</p></div>
<h3>Pauzy — cisza też ma długość</h3>
<p>Każda wartość ma swoją pauzę: znak, że przez tyle uderzeń <b>nic nie grasz</b> (ale dalej liczysz).</p>
<div class="staff-box" data-staff="rests"></div>
<h3>Takt i metrum</h3>
<p>Muzyka dzieli się na <b>takty</b> (pionowe kreski). <b>4/4</b> na początku znaczy: w każdym takcie są 4 ćwierćnuty. Liczysz „<b>raz</b> dwa trzy cztery", i akcent jest na „raz". 3/4 to walc: „<b>raz</b> dwa trzy".</p>
<div class="staff-box" data-staff="bar"></div>
<p><button class="btn small" data-rhythm="1 1 2 0.5 0.5 0.5 0.5 2">▶ Posłuchaj z metronomem</button></p>
<div class="box try"><p>Ósemki licz „raz <b>i</b> dwa <b>i</b> trzy <b>i</b> cztery <b>i</b>". Klaszcz rytm z tego taktu, licząc na głos. Potem zagraj go na jednym klawiszu.</p></div>`,
  quiz:[
    {q:'Ile uderzeń trwa półnuta?', opts:['1','2','4'], a:1},
    {q:'Ile ósemek mieści się w ćwierćnucie?', opts:['2','4','8'], a:0},
    {q:'Półnuta z kropką trwa…', opts:['2 uderzenia','3 uderzenia','2,5 uderzenia'], a:1, why:'2 + połowa z 2 = 3.'},
  ]},
{ id:'znaki', title:'Krzyżyki, bemole i znaki przykluczowe',
  body:`
<p class="kicker">nuty · lekcja 5</p>
<h2>♯ ♭ ♮ — przesuń o pół tonu</h2>
<ul>
<li><b>♯ krzyżyk</b> przed nutą: zagraj klawisz o pół tonu wyżej.</li>
<li><b>♭ bemol</b>: pół tonu niżej.</li>
<li><b>♮ kasownik</b>: odwołaj krzyżyk/bemol, zagraj „zwykły" biały.</li>
</ul>
<div class="staff-box" data-staff="acc"></div>
<p><button class="listen" data-notes="65 66 64 63 71 70 70 71">posłuchaj</button> Znak przed nutą działa <b>do końca taktu</b>.</p>
<h3>Znaki przykluczowe = gama utworu</h3>
<p>Żeby nie pisać ♯ przed każdym F, gama zapisuje swoje czarne klawisze <b>raz, na początku</b> każdej linijki, zaraz po kluczu. To <b>znaki przykluczowe</b> i od razu mówią Ci, w jakiej gamie jest utwór:</p>
<div class="grid2">
  <div><div class="staff-box" data-staff="ks-G"></div><p class="muted" style="font-size:.86rem">1♯ (F♯) → <b>G-dur</b> (albo e-moll)</p></div>
  <div><div class="staff-box" data-staff="ks-D"></div><p class="muted" style="font-size:.86rem">2♯ (F♯ C♯) → <b>D-dur</b> (albo h-moll)</p></div>
  <div><div class="staff-box" data-staff="ks-F"></div><p class="muted" style="font-size:.86rem">1♭ (B♭) → <b>F-dur</b> (albo d-moll)</p></div>
  <div><div class="staff-box" data-staff="ks-Bb"></div><p class="muted" style="font-size:.86rem">2♭ (B♭ E♭) → <b>B♭-dur</b> (albo g-moll)</p></div>
</div>
<div class="box tip"><p>Krzyżyki zawsze w kolejności <b>F C G D A E B</b>, bemole odwrotnie: <b>B E A D G C F</b>. Szybki trik: przy krzyżykach gama to <b>pół tonu nad ostatnim krzyżykiem</b> (ostatni C♯ → D-dur). Przy bemolach — <b>przedostatni bemol</b> to nazwa gamy (B♭ E♭ → B♭-dur).</p></div>`,
  quiz:[
    {q:'Na początku jest jeden krzyżyk. Gama to…', opts:['G-dur','F-dur','D-dur'], a:0},
    {q:'♮ oznacza…', opts:['pół tonu wyżej','odwołaj znak','pauzę'], a:1},
  ]},
{ id:'akordy-nuty', title:'Akordy w nutach i obie ręce',
  body:`
<p class="kicker">nuty · lekcja 6</p>
<h2>Akord w nutach to „bałwanek"</h2>
<p>Nuty ułożone jedna nad drugą grasz <b>razem</b>. Akord w pozycji zasadniczej to trzy nuty na <b>trzech liniach</b> albo w <b>trzech polach</b> pod rząd — wygląda jak bałwanek.</p>
<div class="staff-box" data-staff="chords"></div>
<p><button class="listen" data-chords="C F G C">C F G C</button></p>
<h3>Obie ręce naraz</h3>
<p>Na pianinie czytasz dwie pięciolinie naraz: górną prawą ręką, dolną lewą. Tu progresja I–IV–V–I z basem w lewej ręce i przewrotami w prawej (patrz <a href="#teoria/przewroty">Teoria → Przewroty</a>):</p>
<div class="staff-box" data-staff="grand-prog"></div>
<p><button class="listen" data-chords="C F/C G/B C" data-step="1">posłuchaj</button></p>
<div class="box try"><p>Zagraj to najpierw każdą ręką osobno, powoli. Potem razem. Liczy się, żeby akordy zmieniały się równo, nie szybko.</p></div>`,
  quiz:[
    {q:'Trzy nuty na trzech liniach jedna nad drugą to…', opts:['melodia','akord','pauza'], a:1},
  ]},
];

/* ---------- statyczne pięciolinie w lekcjach ---------- */
const STAFFS = {
  'scale': el=>drawStaff(el,{notes:['c/4','d/4','e/4','f/4','g/4','a/4','b/4','c/5'].map(k=>({keys:[k]}))}),
  'grand-c': el=>drawGrand(el,{treble:[{keys:['c/4'],d:'w'}], bass:[{keys:['c/4'],d:'w'}], width:220}),
  't-lines': el=>drawStaff(el,{notes:['e/4','g/4','b/4','d/5','f/5'].map(k=>({keys:[k],color:'#be185d'}))}),
  't-spaces': el=>drawStaff(el,{notes:['f/4','a/4','c/5','e/5'].map(k=>({keys:[k],color:'#0f766e'}))}),
  'b-lines': el=>drawStaff(el,{clef:'bass',notes:['g/2','b/2','d/3','f/3','a/3'].map(k=>({keys:[k],color:'#be185d'}))}),
  'b-spaces': el=>drawStaff(el,{clef:'bass',notes:['a/2','c/3','e/3','g/3'].map(k=>({keys:[k],color:'#0f766e'}))}),
  'rests': el=>drawStaff(el,{notes:[{keys:['d/5'],d:'wr'},{keys:['b/4'],d:'hr'},{keys:['b/4'],d:'qr'},{keys:['b/4'],d:'8r'}],width:300}),
  'bar': el=>drawStaff(el,{time:'4/4',beam:true,notes:[{keys:['g/4']},{keys:['g/4']},{keys:['g/4'],d:'h'},{bar:true},{keys:['g/4'],d:'8'},{keys:['g/4'],d:'8'},{keys:['g/4'],d:'8'},{keys:['g/4'],d:'8'},{keys:['g/4'],d:'h'}],width:420}),
  'acc': el=>drawStaff(el,{notes:[{keys:['f/4']},{keys:['f#/4'],acc:['#']},{keys:['e/4']},{keys:['eb/4'],acc:['b']},{keys:['b/4']},{keys:['bb/4'],acc:['b']},{keys:['bb/4']},{keys:['b/4'],acc:['n']}],width:420}),
  'ks-G': el=>drawStaff(el,{keySig:'G',width:170}),
  'ks-D': el=>drawStaff(el,{keySig:'D',width:170}),
  'ks-F': el=>drawStaff(el,{keySig:'F',width:170}),
  'ks-Bb': el=>drawStaff(el,{keySig:'Bb',width:170}),
  'chords': el=>drawStaff(el,{notes:[{keys:['c/4','e/4','g/4'],d:'h'},{keys:['f/4','a/4','c/5'],d:'h'},{keys:['g/4','b/4','d/5'],d:'h'},{keys:['c/5','e/5','g/5'],d:'h'}],width:340}),
  'grand-prog': el=>drawGrand(el,{
    treble:[{keys:['e/4','g/4','c/5'],d:'q'},{keys:['f/4','a/4','c/5'],d:'q'},{keys:['d/4','g/4','b/4'],d:'q'},{keys:['e/4','g/4','c/5'],d:'q'}],
    bass:[{keys:['c/3'],d:'q'},{keys:['f/2'],d:'q'},{keys:['g/2'],d:'q'},{keys:['c/3'],d:'q'}], width:360}),
};

const RHYTHM_VALUES = [
  {name:'Cała nuta', d:'w', beats:4, count:'raz-dwa-trzy-czte-ry'},
  {name:'Półnuta', d:'h', beats:2, count:'raz-dwa'},
  {name:'Ćwierćnuta', d:'q', beats:1, count:'raz'},
  {name:'Ósemka', d:'8', beats:.5, count:'raz / i'},
  {name:'Szesnastka', d:'16', beats:.25, count:'bardzo szybko'},
];

/* ---------- trener ---------- */
const TRAINER_RANGES = {
  treble:{ staff:['e/4','f/4','g/4','a/4','b/4','c/5','d/5','e/5','f/5'], wide:['a/3','b/3','c/4','d/4','e/4','f/4','g/4','a/4','b/4','c/5','d/5','e/5','f/5','g/5','a/5','b/5','c/6'] },
  bass:{ staff:['g/2','a/2','b/2','c/3','d/3','e/3','f/3','g/3','a/3'], wide:['c/2','d/2','e/2','f/2','g/2','a/2','b/2','c/3','d/3','e/3','f/3','g/3','a/3','b/3','c/4','d/4','e/4'] },
};
function renderTrainer(root){
  const st = prefs.get('nuty.trainer',{clef:'treble',range:'staff'});
  const stats = prefs.get('nuty.stats',{}); // key -> {h,m}
  let cur=null, answered=false, sessOk=0, sessTot=0, streak=0;
  const staffEl = h('div',{class:'staff-box',style:'min-height:150px'});
  const fb = h('div',{class:'fb muted',style:'min-height:1.5em'});
  const statsEl = h('div',{class:'stats'});
  const answers = h('div',{class:'answers'});
  const kbdHold = h('div');
  const weakEl = h('div',{class:'hint'});

  const segClef = h('div',{class:'seg',role:'group','aria-label':'Klucz'});
  [['treble','𝄞 wiolinowy'],['bass','𝄢 basowy'],['both','oba']].forEach(([v,l])=>{
    const b=h('button',{'aria-pressed':String(st.clef===v)},l);
    b.onclick=()=>{ st.clef=v; prefs.set('nuty.trainer',st); segClef.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b))); next(); };
    segClef.appendChild(b);
  });
  const segRange = h('div',{class:'seg',role:'group','aria-label':'Zakres'});
  [['staff','na pięciolinii'],['wide','+ linie dodane']].forEach(([v,l])=>{
    const b=h('button',{'aria-pressed':String(st.range===v)},l);
    b.onclick=()=>{ st.range=v; prefs.set('nuty.trainer',st); segRange.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b))); next(); };
    segRange.appendChild(b);
  });

  ['C','D','E','F','G','A','B'].forEach(L=>{
    const b=h('button',{'data-l':L},L); b.onclick=()=>answer(L); answers.appendChild(b);
  });

  function pick(){
    const clef = st.clef==='both' ? (Math.random()<.5?'treble':'bass') : st.clef;
    const pool = TRAINER_RANGES[clef][st.range];
    // częściej te, które sprawiają trudność
    const weights = pool.map(k=>{ const s=stats[clef+':'+k]||{h:0,m:0}; return 1 + s.m*2/(1+s.h*.5); });
    let tot = weights.reduce((a,b)=>a+b,0), r=Math.random()*tot, i=0;
    for(;i<pool.length;i++){ r-=weights[i]; if(r<=0) break; }
    let k = pool[Math.min(i,pool.length-1)];
    if(cur && cur.k===k && pool.length>1) k = pool[(pool.indexOf(k)+1+Math.floor(Math.random()*(pool.length-1)))%pool.length];
    const L = k[0].toUpperCase(), oct = +k.split('/')[1];
    return {clef, k, L, oct, midi:noteMidi(L,oct)};
  }
  function next(){
    cur = pick(); answered=false;
    drawStaff(staffEl,{clef:cur.clef, notes:[{keys:[cur.k],d:'w'}], width:190, height:150, top:26});
    answers.querySelectorAll('button').forEach(b=>b.className='');
    fb.textContent = 'Jaka to nuta? Kliknij literę, klawisz na klawiaturze albo wciśnij literę na klawiaturze komputera.';
    drawKbd();
  }
  function drawKbd(mark){
    kbdHold.innerHTML='';
    const from = cur.clef==='bass'?36:57, to = cur.clef==='bass'?64:84;
    kbdHold.appendChild(kbdSVG({from,to,labels:'c',marks:mark||{},onKey:(m,r)=>{ playMidi(m); flashKey(r.ownerSVGElement,m); const L=PC_NAME_SHARP[m%12]; if(L.length===1) answer(L, m); }}));
  }
  function answer(L, midi){
    if(!cur) return;
    if(answered){ next(); return; }
    const key = cur.clef+':'+cur.k;
    const s = stats[key] || {h:0,m:0};
    const btn = answers.querySelector(`[data-l="${L}"]`);
    if(L===cur.L){
      answered=true; s.h++; sessOk++; sessTot++; streak++;
      btn.classList.add('good');
      playMidi(cur.midi);
      const octMsg = (midi!=null && midi!==cur.midi) ? ` (dobra nazwa — ten dźwięk leży w innej oktawie: ${fmt(cur.L)}${cur.oct})` : '';
      fb.innerHTML = `✓ <b>${cur.L}${cur.oct}</b>${octMsg}. Kliknij dowolną literę albo Enter — następna.`;
      drawKbd({[cur.midi]:'t'});
      setTimeout(()=>{ if(answered && fb.isConnected) next(); }, 1300);
    }else{
      s.m++; sessTot++; streak=0;
      btn.classList.add('wrong');
      fb.innerHTML = `✗ To nie ${L}. Podpowiedź: znajdź najbliższy punkt zaczepienia (${cur.clef==='treble'?'G na 2. linii, C pod pięciolinią':'F na 4. linii, C nad pięciolinią'}) i policz schodki.`;
    }
    stats[key]=s; prefs.set('nuty.stats',stats);
    updStats();
  }
  function updStats(){
    statsEl.innerHTML = `ta sesja: <b>${sessOk}/${sessTot}</b> <span>seria: <b>${streak}</b></span>`;
    const weak = Object.entries(stats).filter(([k,s])=>s.m>0).map(([k,s])=>({k,r:s.m/(s.h+s.m),n:s.h+s.m})).filter(x=>x.r>0.25).sort((a,b)=>b.r-a.r).slice(0,5);
    weakEl.textContent = weak.length ? 'Najczęściej mylone (trener pokazuje je częściej): '+weak.map(x=>{ const [c,k]=x.k.split(':'); return (c==='treble'?'𝄞':'𝄢')+' '+k.replace('/','').toUpperCase(); }).join(', ') : '';
  }
  const onKey = (e)=>{
    if(!root.isConnected){ document.removeEventListener('keydown',onKey); return; }
    if(e.target.matches('input,textarea,select')) return;
    const L = e.key.toUpperCase();
    if('CDEFGAB'.includes(L) && L.length===1){ answer(L); e.preventDefault(); }
    else if(e.key==='Enter' && answered){ next(); }
    else if(e.key===' '){ if(cur) playMidi(cur.midi); e.preventDefault(); }
  };
  document.addEventListener('keydown', onKey);

  root.append(h('div',{class:'trainer'},
    h('div',{class:'row'}, segClef, segRange,
      h('button',{class:'btn small ghost',onclick:()=>cur&&playMidi(cur.midi)},'🔊 zagraj tę nutę'),
      h('button',{class:'btn small ghost danger',onclick:()=>{ for(const k in stats) delete stats[k]; prefs.set('nuty.stats',stats); updStats(); }},'wyczyść statystyki')),
    staffEl, answers, fb, h('div',{class:'kbd-panel'},kbdHold), statsEl, weakEl,
    h('div',{class:'box tip'},h('p',null,'Cel to rozpoznawać nutę „z widzenia", bez liczenia linii. Zacznij od zakresu „na pięciolinii". Kiedy seria przekracza 20 bez błędu — dodaj linie dodane albo drugi klucz. 3 minuty dziennie wystarczą.'))
  ));
  updStats(); next();
}

const ViewNuty = {
  title:'Nuty',
  render(root, sub){
    const done = prefs.get('nuty.done',{});
    const items = [...NUTY_LESSONS.map(l=>({id:l.id,title:l.title})), {id:'trener',title:'🎯 Trener: jaka to nuta?'}];
    let id = sub || prefs.get('nuty.last', NUTY_LESSONS[0].id);
    if(!items.find(i=>i.id===id)) id = NUTY_LESSONS[0].id;
    prefs.set('nuty.last', id);

    const nav = h('nav',{class:'lesson-nav','aria-label':'Lekcje nut'});
    items.forEach((it,i)=>{
      const b=h('button',{'aria-current':String(it.id===id)}, h('span',{class:'n'}, it.id==='trener'?'':String(i+1)), it.title, done[it.id]?h('span',{class:'ck'},'✓'):null);
      b.onclick=()=>location.hash='#nuty/'+it.id;
      nav.appendChild(b);
    });
    const main = h('article',{class:'lesson'});
    root.append(
      h('header',{style:'margin-bottom:26px'},
        h('p',{class:'kicker'},'czytanie nut od podstaw'),
        h('h1',null,'Nuty to ', h('em',null,'mapa klawiatury')),
        h('p',{class:'lead'},'Sześć krótkich lekcji i trener do codziennych 3 minut. Nie musisz czytać nut, żeby grać akordami — ale z nimi otworzy się każdy śpiewnik.')),
      h('div',{class:'lesson-layout'}, nav, main));

    if(id==='trener'){
      main.append(h('h2',null,'Jaka to nuta?'));
      renderTrainer(main);
      return;
    }
    const l = NUTY_LESSONS.find(x=>x.id===id);
    main.innerHTML = l.body;
    main.querySelectorAll('[data-staff]').forEach(el=>{ try{ STAFFS[el.dataset.staff](el); }catch(e){ console.error(e); el.textContent='(nie udało się narysować nut)'; } });
    main.querySelectorAll('[data-widget="values"]').forEach(el=>{
      RHYTHM_VALUES.forEach(v=>{
        const sb = h('div',{class:'staff-box'});
        const card = h('div',{class:'card'}, sb,
          h('div',{style:'margin-top:8px;font-weight:600'},v.name),
          h('div',{class:'muted',style:'font-size:.84rem'}, (v.beats>=1? v.beats+' '+(v.beats===1?'uderzenie':'uderzenia'):v.beats===.5?'pół uderzenia':'ćwierć uderzenia')+' · '+v.count));
        card.style.cursor='pointer'; card.title='kliknij, żeby usłyszeć (z metronomem)';
        card.onclick=()=>{ const n = Math.max(1, Math.round(4/v.beats)); const bs = Array(Math.min(n,8)).fill(v.beats); metroPlay(bs); };
        el.appendChild(card);
        drawStaff(sb,{clef:'none',notes:[{keys:['b/4'],d:v.d}],width:110,height:110,top:6});
      });
    });
    main.querySelectorAll('[data-rhythm]').forEach(b=>b.onclick=()=>metroPlay(b.dataset.rhythm.split(' ').map(Number)));
    wireListens(main);
    if(l.quiz) main.appendChild(quizBox('Sprawdź się', l.quiz, ()=>{ done[l.id]=true; prefs.set('nuty.done',done); }));
    const i = NUTY_LESSONS.indexOf(l);
    const nx = NUTY_LESSONS[i+1];
    main.appendChild(h('div',{class:'lesson-foot'},
      i>0 ? h('a',{class:'btn',href:'#nuty/'+NUTY_LESSONS[i-1].id},'← wstecz') : h('span'),
      h('a',{class:'btn primary',href:'#nuty/'+(nx?nx.id:'trener')}, nx? nx.title+' →' : 'Trener →')));
  }
};
function metroPlay(beats, bpm=84){
  audio();
  const total = beats.reduce((a,b)=>a+Math.abs(b),0);
  const q=60/bpm;
  for(let i=0;i<Math.ceil(total);i++) playClick(i*q, i%4===0);
  playRhythm(beats, bpm, 72);
}
