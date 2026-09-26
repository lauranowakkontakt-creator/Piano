/* Zakładka „Przejścia" — ułóż własne akordy, a appka pokaże:
   - w jakiej gamie jesteś w każdym momencie,
   - który akord NIE pasuje (czerwony) i jak do niego dojść (gałązka z mostem),
   - drogę po kole kwintowym.
   Logika: dopóki akord pasuje do bieżącej gamy — zostajesz. Jeśli nie pasuje,
   szukamy najbliższej (po kole kwintowym) gamy, w której pasuje. Zmiana gamy jest
   „przygotowana", gdy poprzedni akord pasuje do obu gam (most). Inaczej: czerwony. */

const KEY_CANDS = SONG_KEYS.map(k=>k.v);
const fifthsPos = k => ALL_KEYS.indexOf(majorOfKey(k));
function fifthsDist(a,b){ const d=Math.abs(fifthsPos(a)-fifthsPos(b))%12; return Math.min(d,12-d); }
const fits = (c,k) => !!c && functionIn(c,k).fn!=='o';
const isMinorKey = k => k.endsWith('m');
const cname = n => n.replace('°','dim');
const sameChord = (a,b) => { const x=parseChord(a), y=parseChord(b); return x&&y&&x.rootPc===y.rootPc&&x.q===y.q; };

function tonicOf(k){ return k; }
function dominantOf(k){
  if(isMinorKey(k)) return KEYS[majorOfKey(k)][2];       // v molowej → durowe V (a-moll: E)
  return KEYS[k][4];
}
function bestKeyFor(c, from, home, next){
  const cands = KEY_CANDS.filter(k=>fits(c,k));
  if(!cands.length) return null;
  const mode = isMinorKey(from);
  const score = k => fifthsDist(from,k)
    - (next && fits(next,k) ? 1.5 : 0)              // następny akord też pasuje → lepiej
    - (k===home ? 1 : 0)                            // chętnie wracamy do gamy startowej
    + (isMinorKey(k)===mode ? 0 : 0.3)
    + fifthsDist(home,k)*0.05;
  cands.sort((a,b)=>score(a)-score(b));
  return cands[0];
}
// jednoimienna molowa (C → c-moll), skąd często „pożycza się" akordy
function parallelMinor(k){
  if(isMinorKey(k)) return null;
  return KEY_CANDS.find(x=>isMinorKey(x) && PC[x.slice(0,-1)]===PC[k]) || null;
}
// akord wspólny dwóch gam — najlepiej taki, który w nowej gamie jest ruchem (subdominantą)
function pivotChord(a, b){
  const tA = parseChord(a.replace(/m$/,'')+(isMinorKey(a)?'m':''));
  let best=null, bs=-99;
  chordsFor(majorOfKey(a)).forEach(ch=>{
    if(ch.name.endsWith('°')) return;
    const c = parseChord(ch.name);
    if(!fits(c,b)) return;
    const fB = functionIn(c,b).fn;
    let s = (fB==='s'?3:0) + (fB==='t'?1:0);
    if(tA && c.rootPc===tA.rootPc && c.q===tA.q) s-=2;
    if(fB==='d') s-=1;
    if(s>bs){ bs=s; best=ch.name; }
  });
  return best;
}
function routeKeys(a, k){
  const pa=fifthsPos(a), pk=fifthsPos(k);
  let d=(pk-pa+12)%12; let dir=1;
  if(d>6){ d=12-d; dir=-1; }
  const out=[];
  for(let s=1;s<=d;s++) out.push(ALL_KEYS[(pa+dir*s+12)%12]);
  if(out.length) out[out.length-1]=k; else out.push(k);
  return out;
}
function dedupe(arr){ return arr.filter((x,i)=>x && (i===0 || !sameChord(x,arr[i-1]))); }
function bridgeSmooth(a, k, target){
  const keys=[a, ...routeKeys(a,k)];
  let out=[];
  for(let j=1;j<keys.length;j++){
    const y=keys[j];
    out.push(pivotChord(keys[j-1],y), dominantOf(y));
    if(j<keys.length-1) out.push(tonicOf(y));
  }
  out = dedupe(out);
  while(out.length && sameChord(out[out.length-1], target)) out.pop();
  return out;
}
function bridgeFast(a, k, target){
  const v = dominantOf(k);
  return sameChord(v,target) ? [] : [v];
}

function analyzeSeq(seq, start){
  let active = start;
  const res=[];
  const parsed = seq.map(t=>parseChord(t));
  seq.forEach((t,i)=>{
    const c = parsed[i];
    const next = parsed.slice(i+1).find(Boolean) || null;
    const it = {text:t, c, key:active, i};
    if(!c){ it.status='junk'; res.push(it); return; }
    const prev = res.slice().reverse().find(r=>r.c);
    const f = functionIn(c, active);
    if(f.fn!=='o'){
      // powrót do domu: tonika gamy startowej zaraz po jej dominancie
      const fh = functionIn(c, start);
      if(active!==start && fh.fn!=='o' && (fh.rn==='I'||fh.rn==='i') && prev && ['V','vii°'].includes(functionIn(prev.c,start).rn)){
        Object.assign(it,{from:active, key:start, fn:fh.fn, rn:fh.rn, realFn:fh.fn, status:'mod', prevText:prev.text});
        active=start; res.push(it); return;
      }
      Object.assign(it,{fn:f.fn, rn:f.rn, status:'ok'}); res.push(it); return;
    }
    const k = bestKeyFor(c, active, start, next);
    if(!k){ Object.assign(it,{fn:'x', rn:'', status:'none'}); res.push(it); return; }
    const prepared = prev && fits(prev.c, k);
    const f2 = functionIn(c,k);
    Object.assign(it,{from:active, key:k, fn: prepared? f2.fn : 'x', rn:f2.rn, realFn:f2.fn, status: prepared?'mod':'bad', prevText: prev&&prev.text});
    if(!prepared){
      it.smooth = bridgeSmooth(active,k,t); it.fast = bridgeFast(active,k,t);
      const pm = parallelMinor(active);
      if(pm && fits(c,pm)) it.borrowed = pm;
    }
    active = k;
    res.push(it);
  });
  return res;
}

/* ---------- rysunek: drzewo (łańcuch z gałązkami) ---------- */
function drawSeqTree(hold, items, onPlayChord){
  hold.innerHTML='';
  const R=30, H=430, yMain=200, yBr=340;
  // x każdego akordu; przed czerwonym robimy miejsce na gałązkę
  let x=70; const xs=[];
  items.forEach((it,i)=>{
    if(i>0){ const br = it.status==='bad' ? it.smooth.length : 0; x += Math.max(110, (br+1)*62); }
    xs.push(x);
  });
  const W = Math.max(640, x+80);
  const svg = sv('svg',{viewBox:`0 0 ${W} ${H}`,role:'img','aria-label':'Drzewo Twoich akordów'},hold);
  const narrow = window.innerWidth < 700;
  svg.style.width = narrow ? Math.round(W*0.62)+'px' : (W>1000 ? W+'px' : '100%');
  if(narrow || W>1000) hold.appendChild(h('div',{class:'hint',style:'position:sticky;left:8px;padding:0 8px 6px'},'↔ przesuń w bok, żeby zobaczyć całość'));
  svg.style.maxHeight='none';
  glowDefs(svg); stars(svg,W,H,Math.round(W/12));
  if(!items.length){
    const t=sv('text',{x:W/2,y:H/2,'text-anchor':'middle',fill:'#8f8fa3','font-family':'Inter,sans-serif','font-size':15},svg);
    t.textContent='Dodaj akordy — kliknij je w palecie poniżej albo wpisz.';
    return {nodes:[]};
  }
  // pasy gam u góry
  let segStart=0;
  const bands = sv('g',{},svg);
  const drawBand=(from,to,key)=>{
    const x1 = xs[from]-R-14, x2 = xs[to]+R+14;
    sv('rect',{x:x1,y:44,width:x2-x1,height:30,rx:15,fill:'rgba(244,114,182,.07)',stroke:'rgba(244,114,182,.35)','stroke-dasharray':'3 4'},bands);
    const t=sv('text',{x:(x1+x2)/2,y:64,'text-anchor':'middle','font-family':'Fraunces,serif','font-weight':600,'font-size':14,fill:'#f472b6'},bands);
    t.textContent=keyNameLabel(key);
  };
  for(let i=1;i<=items.length;i++){
    if(i===items.length || items[i].key!==items[i-1].key){ drawBand(segStart,i-1,items[segStart].key); segStart=i; }
  }
  const edges = sv('g',{},svg);
  const nodeG = sv('g',{},svg);
  const nodes=[];
  items.forEach((it,i)=>{
    if(i>0){
      const col = it.status==='bad'||it.status==='none' ? FN_COLOR.x : FN_COLOR[it.fn]||FN_COLOR.o;
      sv('path',{d:`M${xs[i-1]+R},${yMain} L${xs[i]-R-5},${yMain}`,stroke:col,'stroke-width':it.status==='bad'?2.4:1.8,opacity:it.status==='bad'?.9:.5,'marker-end':`url(#ar-${it.status==='bad'||it.status==='none'?'x':(it.fn||'o')})`,'stroke-dasharray':it.status==='bad'?'6 5':'',filter:'url(#glow2)'},edges);
      if(it.status==='mod'){
        const mx=(xs[i-1]+xs[i])/2;
        const t=sv('text',{x:mx,y:yMain-44,'text-anchor':'middle','font-family':'Inter,sans-serif','font-size':11,fill:'#f472b6'},svg);
        t.textContent='most ✓';
      }
      if(it.status==='bad' && it.smooth.length){
        // gałązka w dół: poprzedni → most… → ten akord
        const n=it.smooth.length;
        const bx = k => xs[i-1] + (xs[i]-xs[i-1])*(k+1)/(n+1);
        let px=xs[i-1], py=yMain+R;
        it.smooth.forEach((name,k)=>{
          const c=parseChord(cname(name)); const f=functionIn(c,k<n-1?routeKeys(it.from,it.key)[0]:it.key);
          const nx=bx(k);
          sv('path',{d:`M${px},${py} Q${(px+nx)/2},${yBr} ${nx-18},${yBr}`,fill:'none',stroke:'#f472b6','stroke-width':1.5,opacity:.55,'stroke-dasharray':'4 4'},edges);
          const g=vNode(nodeG,nx,yBr,20,f.fn==='o'?'t':f.fn,fmt(name),'',(gg)=>{ strike(c.pcs); pulse(gg); });
          px=nx+20; py=yBr;
        });
        sv('path',{d:`M${px},${py} Q${(px+xs[i])/2},${yBr} ${xs[i]},${yMain+R+6}`,fill:'none',stroke:'#f472b6','stroke-width':1.5,opacity:.55,'stroke-dasharray':'4 4','marker-end':'url(#ar-t)'},edges);
        const t=sv('text',{x:(xs[i-1]+xs[i])/2,y:yBr+44,'text-anchor':'middle','font-family':'Inter,sans-serif','font-size':11,fill:'#f472b6'},svg);
        t.textContent='podpowiedź: tak przejdziesz';
      }
    }
    const fn = it.status==='bad'||it.status==='none' ? 'x' : (it.fn||'o');
    const g = vNode(nodeG,xs[i],yMain,R,fn,fmt(it.text),it.rn||(fn==='x'?'!':''),(gg)=>{ onPlayChord(it, gg); });
    nodes.push(g);
  });
  return {nodes};
}

/* ---------- rysunek: koło kwintowe z Twoją drogą ---------- */
function drawSeqCircle(hold, items, startKey, onAdd){
  hold.innerHTML='';
  const W=720, H=720, cx=W/2, cy=H/2, R1=290, R2=195, R3=110;
  const svg = sv('svg',{viewBox:`0 0 ${W} ${H}`,role:'img','aria-label':'Koło kwintowe z Twoją drogą'},hold);
  glowDefs(svg); stars(svg,W,H,90);
  [R1,R2].forEach(r=>sv('circle',{cx,cy,r,fill:'none',stroke:'#2a2a38','stroke-width':1},svg));
  const at=(i,r)=>{ const a=(i*30-90)*Math.PI/180; return [cx+Math.cos(a)*r, cy+Math.sin(a)*r]; };
  const idxOfPc = pc => ALL_KEYS.findIndex(k=>PC[k]===((pc%12)+12)%12);
  function posOf(c){
    if(c.q==='min') return at(idxOfPc(c.rootPc+3), R2);
    if(c.q==='dim') return at(idxOfPc(c.rootPc+1), R3);
    return at(idxOfPc(c.rootPc), R1);
  }
  function keyPos(k){ return isMinorKey(k) ? at(fifthsPos(k),R2) : at(fifthsPos(k),R1); }
  // odwiedzone gamy: pierścienie + strzałki
  const visited=[]; items.forEach(it=>{ if(it.c && (!visited.length || visited[visited.length-1]!==it.key)) visited.push(it.key); });
  if(!visited.length) visited.push(startKey);
  const kg = sv('g',{},svg);
  visited.forEach((k,i)=>{
    const [x,y]=keyPos(k);
    sv('circle',{cx:x,cy:y,r:46,fill:'none',stroke:'#f472b6','stroke-width':i===0?2:1.2,'stroke-dasharray':i===0?'':'4 4',opacity:.7,filter:'url(#glow2)'},kg);
    if(i>0){
      const [x0,y0]=keyPos(visited[i-1]);
      const mx=(x0+x)/2, my=(y0+y)/2, qx=cx+(mx-cx)*.55, qy=cy+(my-cy)*.55;
      sv('path',{d:`M${x0},${y0} Q${qx},${qy} ${x},${y}`,fill:'none',stroke:'#f472b6','stroke-width':2,opacity:.55,'marker-end':'url(#ar-t)'},kg);
    }
  });
  // droga akordów
  const lines = sv('g',{},svg);
  for(let i=1;i<items.length;i++){
    const a=items[i-1], b=items[i]; if(!a.c||!b.c) continue;
    const [x1,y1]=posOf(a.c), [x2,y2]=posOf(b.c);
    const bad = b.status==='bad'||b.status==='none';
    sv('line',{x1,y1,x2,y2,stroke:bad?FN_COLOR.x:(FN_COLOR[b.fn]||FN_COLOR.o),'stroke-width':bad?2.6:1.6,opacity:bad?.9:.45,'stroke-dasharray':bad?'6 5':'',filter:'url(#glow2)'},lines);
  }
  // wszystkie akordy: przygaszone (klik = dodaj), użyte — świecące
  const used = new Map();
  items.forEach(it=>{ if(!it.c) return; const key=it.c.rootPc+'|'+(it.c.q==='min'?'m':it.c.q==='dim'?'d':'M'); const prev=used.get(key); const fn=(it.status==='bad'||it.status==='none')?'x':it.fn; if(!prev || fn==='x') used.set(key,{fn,it}); });
  const ng = sv('g',{},svg);
  const nodes=[];
  ALL_KEYS.forEach((k,i)=>{
    [[k,'M',R1,26],[REL_MINOR[k]+'m','m',R2,21]].forEach(([name,q,r,size])=>{
      const c=parseChord(name); const u=used.get(c.rootPc+'|'+q);
      const [x,y]=at(i,r);
      const g=vNode(ng,x,y,u?size+5:size,u?u.fn:'o',fmt(name),'',()=>onAdd(name),!u);
      if(u) nodes.push({g,key:c.rootPc+'|'+q});
    });
  });
  items.forEach(it=>{ if(it.c && it.c.q==='dim'){ const [x,y]=posOf(it.c); const g=vNode(ng,x,y,20,it.status==='bad'?'x':it.fn,fmt(it.text),'',()=>strike(it.c.pcs)); nodes.push({g,key:it.c.rootPc+'|d'}); } });
  const ct=sv('text',{x:cx,y:cy-4,'text-anchor':'middle','font-family':'Fraunces,serif','font-weight':900,'font-size':24,fill:'#e9e9f0'},svg);
  ct.textContent = visited.length>1 ? visited.map(v=>fmt(v)).join(' → ') : keyNameLabel(visited[0]);
  const cs=sv('text',{x:cx,y:cy+20,'text-anchor':'middle','font-family':'Inter,sans-serif','font-size':12,fill:'#8f8fa3'},svg);
  cs.textContent = visited.length>1 ? 'Twoja droga po gamach' : 'kliknij akord na kole, żeby go dodać';
  return {nodeFor:(c)=>{ const key=c.rootPc+'|'+(c.q==='min'?'m':c.q==='dim'?'d':'M'); const n=nodes.find(n=>n.key===key); return n&&n.g; }};
}

const ViewPrzejscia = {
  title:'Przejścia',
  render(root){
    let seq = prefs.get('przejscia.seq', ['C','Am','F','G','C','Eb','F','G']);
    if(!Array.isArray(seq)) seq = [];
    seq = seq.filter(t=>typeof t==='string');
    let startSel = prefs.get('przejscia.start','auto');
    if(!KEY_CANDS.includes(startSel)) startSel = 'auto';
    let mode = prefs.get('przejscia.mode','tree');
    const save=()=>{ prefs.set('przejscia.seq',seq); prefs.set('przejscia.start',startSel); prefs.set('przejscia.mode',mode); };

    const startSelect = h('select',{style:'width:auto'}, h('option',{value:'auto'},'sama zgadnij'), ...SONG_KEYS.map(k=>h('option',{value:k.v},k.l)));
    startSelect.value = startSel;
    const input = h('input',{class:'mono',placeholder:'np. C Am F G Eb …','aria-label':'Akordy (wpisz, oddziel spacją)'});
    const seqBox = h('div',{class:'seqbox'});
    const status = h('p',{class:'muted',style:'margin:10px 0 0'});
    const vizHold = h('div',{class:'viz-wrap scrollx'});
    const fixes = h('div');
    const palette = h('div',{class:'palette'});
    const playB = h('button',{class:'btn primary'},'▶ Zagraj');
    const seg = h('div',{class:'seg',role:'group','aria-label':'Widok'});
    [['tree','Drzewo'],['circle','Koło kwintowe']].forEach(([v,l])=>{
      const b=h('button',{'aria-pressed':String(v===mode)},l);
      b.onclick=()=>{ mode=v; save(); seg.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b))); draw(); };
      seg.appendChild(b);
    });

    root.append(
      h('header',{style:'margin-bottom:18px'},
        h('p',{class:'kicker'},'modulacje bez zgadywania'),
        h('h1',null,'Twoje akordy, ', h('em',null,'twoja droga')),
        h('p',{class:'lead'},'Ułóż akordy, których chcesz użyć. Appka pokaże, w jakiej gamie jesteś w każdym momencie. Akord, który nie pasuje, świeci na czerwono — a pod nim wyrasta gałązka: jak do niego płynnie dojść.')),
      h('div',{class:'card'},
        h('div',{class:'row'}, h('span',{class:'muted',style:'font-size:.9rem'},'gama startowa'), startSelect,
          h('span',{style:'flex:1'}), playB,
          h('button',{class:'btn',onclick:()=>{ seq.pop(); save(); draw(); }},'⌫ cofnij'),
          h('button',{class:'btn ghost',onclick:()=>{ if(!seq.length||confirm('Wyczyścić wszystkie akordy?')){ seq=[]; save(); draw(); } }},'wyczyść')),
        h('div',{style:'height:10px'}),
        seqBox,
        h('div',{class:'row',style:'margin-top:10px'}, input, h('button',{class:'btn',onclick:addFromInput},'+ dodaj')),
        status),
      h('div',{class:'row',style:'margin:18px 0 10px'}, seg, h('span',{class:'hint'},'klik w węzeł = dźwięk · na kole: klik w przygaszony akord = dodaj')),
      vizHold,
      h('div',{class:'legend'}, h('span',{class:'t-c'},'tonika'), h('span',{class:'s-c'},'subdominanta'), h('span',{class:'d-c'},'dominanta'), h('span',{style:'color:var(--bad)'},'nie pasuje — potrzebne przejście'), h('span',{style:'color:var(--tonic)'},'- - - most / nowa gama')),
      fixes,
      h('section',null, h('div',{class:'sechead'}, h('h2',null,'Paleta akordów'), h('span',{class:'hint'},'kolory pokazują, co pasuje TERAZ (do ostatniej gamy)')), palette),
      h('div',{class:'row',style:'margin-top:22px'},
        h('button',{class:'btn',onclick:saveAsSong},'💾 Zapisz jako piosenkę'),
        h('a',{class:'btn ghost',href:'#teoria/modulacja'},'Jak działają przejścia? (lekcja 8)')));

    startSelect.onchange=()=>{ startSel=startSelect.value; save(); draw(); };
    input.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); addFromInput(); } });
    function addFromInput(){
      const toks = input.value.split(/[\s,|]+/).filter(Boolean);
      const bad = toks.filter(t=>!parseChord(t));
      toks.filter(t=>parseChord(t)).forEach(t=>seq.push(t));
      input.value = bad.join(' ');
      input.title = bad.length ? 'Nie rozpoznano: '+bad.join(', ') : '';
      save(); draw();
    }
    function addChord(name){ seq.push(cname(name)); const c=parseChord(cname(name)); if(c) strike(c.pcs); save(); draw(); }
    async function saveAsSong(){
      if(!seq.length) return;
      const s={id:uid(), title:'Moje przejście', artist:'', key:startKey(), bpm:90, beats:2, chords:seq.join(' '), notes:'Stworzone w zakładce Przejścia.'};
      await DB.putSong(s); location.hash='#piosenki/'+s.id;
    }
    function startKey(){
      if(startSel!=='auto') return startSel;
      const cs = seq.map(parseChord).filter(Boolean);
      if(!cs.length) return 'C';
      // zgadnij po pierwszych akordach (do pierwszego „wyjścia")
      const g = guessKey(cs.slice(0, Math.min(cs.length, 4)));
      return g[0] ? g[0].v : 'C';
    }

    let current = {items:[], tree:null, circle:null};
    function draw(){
      stopSeq();
      const sk = startKey();
      const items = analyzeSeq(seq, sk);
      current.items = items;
      // chipsy
      seqBox.innerHTML='';
      if(!seq.length) seqBox.append(h('span',{class:'hint'},'Pusto. Klikaj akordy w palecie albo wpisz je niżej.'));
      items.forEach((it,i)=>{
        if(i>0 && it.key!==items[i-1].key) seqBox.append(h('span',{class:'keymark'},'→ '+keyNameLabel(it.key)));
        const fn = it.status==='bad'||it.status==='none'||it.status==='junk' ? 'x' : it.fn;
        const chip = h('span',{class:'chord-chip '+fn,title: it.status==='bad'?'nie pasuje do '+keyNameLabel(it.from):FN_NAME[fn]||''},
          fmt(it.text), it.rn?h('span',{class:'deg'},it.rn):null,
          h('button',{type:'button',class:'rm',title:'usuń','aria-label':'usuń '+it.text,onclick:(e)=>{ e.stopPropagation(); seq.splice(i,1); save(); draw(); }},'×'));
        chip.onclick=()=>{ if(it.c){ strike(it.c.pcs,1.1,0,it.c.bassPc); ring(chip,'lit'); } };
        it.chip=chip;
        seqBox.append(chip);
      });
      // podsumowanie
      const bads = items.filter(i=>i.status==='bad'||i.status==='none');
      const keysUsed = [...new Set(items.filter(i=>i.c).map(i=>i.key))];
      status.innerHTML = !seq.length ? '' :
        `Start: <b>${keyNameLabel(sk)}</b>${startSel==='auto'?' (zgadnięta)':''}` +
        (keysUsed.length>1 ? ` · droga: ${keysUsed.map(k=>'<b>'+keyNameLabel(k)+'</b>').join(' → ')}` : ' · wszystko w jednej gamie') +
        (bads.length ? ` · <span style="color:var(--bad)">${bads.length} ${bads.length===1?'akord nie pasuje':'akordy nie pasują'}</span> — podpowiedzi niżej` : (seq.length?' · <span class="t-c">wszystkie przejścia płynne ✓</span>':''));
      // wizualizacja
      vizHold.innerHTML='';
      if(mode==='tree'){ current.tree = drawSeqTree(vizHold, items, (it,g)=>{ if(it.c){ strike(it.c.pcs); pulse(g); } }); current.circle=null; }
      else { current.circle = drawSeqCircle(vizHold, items, sk, addChord); current.tree=null; }
      drawFixes(items);
      drawPalette(items.length ? items[items.length-1].key : sk);
    }

    function chordRow(names){
      const seqEl=h('div',{class:'seq',style:'margin:0'});
      names.forEach(n=>seqEl.append(h('b',null,fmt(n))));
      return seqEl;
    }
    function drawFixes(items){
      fixes.innerHTML='';
      items.forEach((it,i)=>{
        if(it.status==='bad'){
          const insert = (arr)=>{ seq.splice(i,0,...arr.map(cname)); save(); draw(); };
          const listen = (arr)=>{ const prev = it.prevText? [it.prevText]:[]; playChordSeq([...prev,...arr,it.text].map(t=>({pcs:parseChord(cname(t)).pcs})),0.8); };
          const d = fifthsDist(it.from,it.key);
          const box = h('div',{class:'fix'},
            h('h3',null, h('span',{style:'color:var(--bad)'},fmt(it.text)), ` nie pasuje do ${keyNameLabel(it.from)}`),
            h('p',{class:'muted',style:'margin:0;font-size:.9rem'},
              `Najbliżej pasuje do `, h('b',null,keyNameLabel(it.key)), ` (tam to ${it.rn}, ${FN_NAME[it.realFn].toLowerCase()})`,
              d? ` — ${d} ${d===1?'krok':d<5?'kroki':'kroków'} po kole kwintowym.` : ' — to te same dźwięki, tylko inny dom.',
              it.prevText? ` Poprzedni akord (${fmt(it.prevText)}) nie jest wspólny dla obu gam, więc ucho dostaje „skok".`:''),
            it.smooth.length ? h('div',{class:'opt'}, h('span',{class:'lbl'},d>1?'płynnie, przez sąsiednie gamy:':'płynnie, przez most:'), chordRow(it.smooth),
              h('button',{class:'btn small',onclick:()=>listen(it.smooth)},'▶ posłuchaj'), h('button',{class:'btn small primary',onclick:()=>insert(it.smooth)},'wstaw')) : null,
            it.fast.length && (!it.smooth.length || it.fast.join()!==it.smooth.join()) ? h('div',{class:'opt'}, h('span',{class:'lbl'},'szybko (sama dominanta):'), chordRow(it.fast),
              h('button',{class:'btn small',onclick:()=>listen(it.fast)},'▶ posłuchaj'), h('button',{class:'btn small',onclick:()=>insert(it.fast)},'wstaw')) : null,
            it.borrowed ? h('div',{class:'box why',style:'margin:10px 0 0'}, h('p',null, `${fmt(it.text)} pochodzi z ${keyNameLabel(it.borrowed)} — gamy molowej od tego samego dźwięku. W popie i rocku taki akord często się „pożycza" bez żadnego przejścia (brzmi mocno, trochę filmowo) i od razu wraca do ${keyNameLabel(it.from)}. Jeśli Twojemu uchu to się podoba — zostaw!`)) : null,
            h('div',{class:'opt'}, h('span',{class:'lbl'},'albo:'), h('button',{class:'btn small ghost danger',onclick:()=>{ seq.splice(i,1); save(); draw(); }},'usuń ten akord'))
          );
          fixes.append(box);
        }else if(it.status==='none'){
          fixes.append(h('div',{class:'fix'}, h('h3',null,h('span',{style:'color:var(--bad)'},fmt(it.text)),' nie należy do żadnej gamy durowej ani molowej'),
            h('p',{class:'muted',style:'margin:0;font-size:.9rem'},'To „przyprawa" (np. akord zwiększony albo zawieszony). Możesz go zostawić dla koloru — tylko niech po nim wróci akord z bieżącej gamy.')));
        }else if(it.status==='mod'){
          fixes.append(h('div',{class:'fix okmod'}, h('h3',null,'✓ ', h('span',{class:'t-c'},keyNameLabel(it.from)+' → '+keyNameLabel(it.key))),
            h('p',{class:'muted',style:'margin:0;font-size:.9rem'}, `Płynna zmiana gamy: ${fmt(it.prevText)} jest wspólny dla obu gam (most), a ${fmt(it.text)} to już ${it.rn} w ${keyNameLabel(it.key)}.`,
              it.realFn==='d' ? ' Do tego to dominanta nowej gamy — najmocniejszy sposób na przejście.' : ` Żeby zmiana była jeszcze wyraźniejsza, zagraj potem ${fmt(dominantOf(it.key))} (dominantę nowej gamy).`)));
        }
      });
    }

    function drawPalette(key){
      palette.innerHTML='';
      const mk = (name)=>{
        const c=parseChord(name);
        const f=functionIn(c,key);
        let fn=f.fn, sub=f.rn;
        if(fn==='o'){ fn='x'; const k=bestKeyFor(c,key,key); sub = k? '→ '+fmt(k)+(isMinorKey(k)?'':'') : 'poza gamami'; }
        const b=h('button',{class:'node '+fn,title: fn==='x'?`nie pasuje do ${keyNameLabel(key)} — kliknij, i tak dodam i pokażę przejście`:`${FN_NAME[fn]} w ${keyNameLabel(key)}`,
          html:`<div class="name">${fmt(name)}</div><div class="to">${sub||''}</div>`});
        b.onclick=()=>addChord(name);
        return b;
      };
      const majors=h('div',{class:'nodes'}), minors=h('div',{class:'nodes'});
      ALL_KEYS.forEach(k=>{ majors.append(mk(k)); minors.append(mk(REL_MINOR[k]+'m')); });
      palette.append(h('div',{class:'hint',style:'margin-bottom:6px'},'durowe'), majors, h('div',{class:'hint',style:'margin:12px 0 6px'},'molowe'), minors,
        h('p',{class:'hint',style:'margin-top:10px'},`Teraz jesteś w: `, h('b',{class:'t-c'},keyNameLabel(key)), '. Kolorowe pasują od ręki. Czerwone też możesz kliknąć — dostaniesz podpowiedź, jak do nich dojść. Inne akordy (7, sus, dim, C/E) wpisz w pole wyżej.'));
    }

    playB.onclick=()=>{
      if(playB.dataset.on){ stopSeq(); return; }
      const items = current.items.filter(it=>it.c);
      if(!items.length) return;
      playB.dataset.on='1'; playB.textContent='■ Stop';
      playChordSeq(items.map((it,k)=>({pcs:it.c.pcs,bassPc:it.c.bassPc,el:it.chip,onStart:()=>{
        if(current.tree){ const g=current.tree.nodes[current.items.indexOf(it)]; if(g) pulse(g); }
        if(current.circle){ const g=current.circle.nodeFor(it.c); if(g) pulse(g); }
      }})), 0.85, ()=>{ delete playB.dataset.on; playB.textContent='▶ Zagraj'; });
    };
    draw();
  }
};
