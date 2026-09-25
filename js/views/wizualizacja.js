/* Zakładka „Wizualizacja" — świecące węzły na czarnym tle.
   Dwa widoki: drzewo ruchów (dokąd akord może iść) i koło kwintowe. */

const FN_COLOR = {t:'#f472b6', s:'#2dd4bf', d:'#fbbf24', o:'#9ca3af', x:'#f87171'};
const SVGNS='http://www.w3.org/2000/svg';
function sv(tag, attrs, parent){ const e=document.createElementNS(SVGNS,tag); for(const k in attrs) e.setAttribute(k,attrs[k]); if(parent) parent.appendChild(e); return e; }
function glowDefs(svg){
  const defs = sv('defs',{},svg);
  const f = sv('filter',{id:'glow',x:'-80%',y:'-80%',width:'260%',height:'260%'},defs);
  sv('feGaussianBlur',{stdDeviation:'7',result:'b'},f);
  const m = sv('feMerge',{},f); sv('feMergeNode',{in:'b'},m); sv('feMergeNode',{in:'SourceGraphic'},m);
  const f2 = sv('filter',{id:'glow2',x:'-50%',y:'-50%',width:'200%',height:'200%'},defs);
  sv('feGaussianBlur',{stdDeviation:'3',result:'b'},f2);
  const m2 = sv('feMerge',{},f2); sv('feMergeNode',{in:'b'},m2); sv('feMergeNode',{in:'SourceGraphic'},m2);
  ['t','s','d','o','x'].forEach(fn=>{
    const g = sv('radialGradient',{id:'rg-'+fn},defs);
    sv('stop',{offset:'0%','stop-color':FN_COLOR[fn],'stop-opacity':'.55'},g);
    sv('stop',{offset:'70%','stop-color':FN_COLOR[fn],'stop-opacity':'.12'},g);
    sv('stop',{offset:'100%','stop-color':FN_COLOR[fn],'stop-opacity':'0'},g);
    const mk = sv('marker',{id:'ar-'+fn,viewBox:'0 0 10 10',refX:'9',refY:'5',markerWidth:'7',markerHeight:'7',orient:'auto-start-reverse'},defs);
    sv('path',{d:'M0,0 L10,5 L0,10 z',fill:FN_COLOR[fn]},mk);
  });
  // tło: gwiazdki
  return defs;
}
function stars(svg, w, hgt, n=70){
  const g = sv('g',{opacity:.5},svg);
  let seed=7; const rnd=()=>{ seed=(seed*9301+49297)%233280; return seed/233280; };
  for(let i=0;i<n;i++) sv('circle',{cx:rnd()*w,cy:rnd()*hgt,r:rnd()*1.1+.2,fill:'#fff',opacity:rnd()*.6+.1},g);
}
function vNode(parent, x, y, r, fn, label, sub, onClick, dim){
  const g = sv('g',{class:'vnode',tabindex:'0',role:'button','aria-label':label+(sub?' '+sub:''),transform:`translate(${x},${y})`},parent);
  sv('circle',{r:r*2.1,fill:`url(#rg-${fn})`,opacity:dim?.25:1},g);
  sv('circle',{class:'core',r,fill:'#0b0b14',stroke:FN_COLOR[fn],'stroke-width':2.2,filter:'url(#glow2)',opacity:dim?.45:1},g);
  const t = sv('text',{'text-anchor':'middle',y:sub?3:6,'font-family':'Fraunces,serif','font-weight':600,'font-size':r*.62,fill:FN_COLOR[fn],opacity:dim?.5:1},g);
  t.textContent=label;
  if(sub){ const s=sv('text',{'text-anchor':'middle',y:r*.62,'font-family':'JetBrains Mono,monospace','font-size':r*.32,fill:'#8f8fa3',opacity:dim?.5:1},g); s.textContent=sub; }
  const fire=()=>{ onClick&&onClick(g); };
  g.addEventListener('click',fire);
  g.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); fire(); } });
  return g;
}
function pulse(g){
  const c = g.querySelector('circle.core');
  if(!c) return;
  const r0 = +c.getAttribute('r');
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  c.animate([{r:r0*1.25+'px', strokeWidth:'5px'},{r:r0+'px', strokeWidth:'2.2px'}],{duration:600,easing:'ease-out'});
}

/* ---------- drzewo ruchów ---------- */
// stopnie: 0=I 1=ii 2=iii 3=IV 4=V 5=vi 6=vii°, 7 = I (powrót)
const TREE_POS = {0:[80,260], 2:[230,110], 5:[380,260], 3:[530,150], 1:[530,370], 4:[690,150], 6:[690,370], 7:[840,260]};
const TREE_EDGES = [
  [0,2],[0,5],[0,3],[0,1],[0,4],[0,6],
  [2,5],[2,3],
  [5,3],[5,1],
  [3,1],[3,4],[3,6],[3,7],
  [1,4],[1,6],
  [4,7],[6,7],
  [4,5,'back'],
];
function drawTree(hold, key, info, pathEl){
  hold.innerHTML='';
  const W=920, H=500;
  const svg = sv('svg',{viewBox:`0 0 ${W} ${H}`,role:'img','aria-label':'Drzewo ruchów akordów'},hold);
  glowDefs(svg); stars(svg,W,H);
  const chords = chordsFor(key);
  const ch = i => chords[i===7?0:i];
  // podpisy kolumn
  const cols = [[80,'dom','t'],[305,'dom (zamienniki)','t'],[530,'ruch','s'],[690,'napięcie','d'],[840,'powrót','t']];
  cols.forEach(([x,l,fn])=>{ const t=sv('text',{x,y:34,'text-anchor':'middle','font-family':'Inter,sans-serif','font-size':13,'letter-spacing':'.08em',fill:FN_COLOR[fn],opacity:.7},svg); t.textContent=l.toUpperCase(); });
  const edgeG = sv('g',{},svg);
  const nodeG = sv('g',{},svg);
  const edges = TREE_EDGES.map(([a,b,kind])=>{
    const [x1,y1]=TREE_POS[a], [x2,y2]=TREE_POS[b];
    const R=34;
    const ang=Math.atan2(y2-y1,x2-x1);
    const sx=x1+Math.cos(ang)*R, sy=y1+Math.sin(ang)*R, ex=x2-Math.cos(ang)*(R+4), ey=y2-Math.sin(ang)*(R+4);
    let d;
    if(kind==='back'){ d=`M${x1},${y1+R} C${x1-40},${y1+230} ${x2+60},${y2+180} ${x2+18},${y2+R+4}`; }
    else if(a===0 && Math.abs(x2-x1)>300){ const cy = y2<260 ? 60 : 470; d=`M${sx},${sy} Q${(x1+x2)/2},${cy} ${ex},${ey}`; }
    else d=`M${sx},${sy} L${ex},${ey}`;
    const fn = ch(b).fn;
    const p = sv('path',{d,fill:'none',stroke:FN_COLOR[fn],'stroke-width':1.6,opacity:.22,'marker-end':`url(#ar-${fn})`,'stroke-dasharray':kind==='back'?'5 6':''},edgeG);
    return {a,b,p,kind};
  });
  const nodes={};
  Object.entries(TREE_POS).forEach(([i,[x,y]])=>{
    i=+i; const c=ch(i);
    nodes[i] = vNode(nodeG,x,y,34,c.fn,fmt(c.name),c.rn,(g)=>select(i,g));
  });
  let path=[];
  function select(i,g){
    const c=ch(i);
    strike(c.pcs); pulse(g);
    edges.forEach(e=>{
      const on = e.a===i || (i===7 && false);
      e.p.setAttribute('opacity', on? .95 : .12);
      e.p.setAttribute('stroke-width', on? 2.6 : 1.4);
      e.p.setAttribute('filter', on? 'url(#glow2)':'');
    });
    const nexts = edges.filter(e=>e.a===i).map(e=>ch(e.b));
    info.innerHTML = `<b style="color:${FN_COLOR[c.fn]}">${fmt(c.name)}</b> (${c.rn}, ${FN_NAME[c.fn].toLowerCase()}) — ` +
      (i===7||i===0&&path.length>1 ? 'jesteś w domu. Stąd możesz iść <b>wszędzie</b>.' :
       nexts.length ? 'naturalnie idzie dalej do: ' + nexts.map(n=>`<b style="color:${FN_COLOR[n.fn]}">${fmt(n.name)}</b>`).join(', ') : '');
    if(i===4) info.innerHTML += ' · przerywana linia do vi to <i>kadencja zwodnicza</i> — niespodzianka zamiast domu.';
    path.push(c); if(path.length>12) path.shift();
    drawPath();
  }
  function drawPath(){
    pathEl.innerHTML='';
    if(!path.length){ pathEl.append(h('span',{class:'hint'},'Klikaj akordy po kolei — zbudujesz własną progresję.')); return; }
    const seq=h('div',{class:'seq',style:'margin:0'});
    path.forEach(c=>seq.appendChild(h('b',{class:c.fn,html:`${fmt(c.name)}<span class="deg">${c.rn}</span>`})));
    pathEl.append(seq,
      h('button',{class:'btn small',onclick:()=>playChordSeq(path.map((c,i)=>({pcs:c.pcs,el:seq.children[i]})),0.8)},'▶ zagraj ścieżkę'),
      h('button',{class:'btn small ghost',onclick:()=>{ path=[]; drawPath(); }},'wyczyść'),
      h('button',{class:'btn small ghost',title:'Skopiuj akordy — wkleisz je w zakładce Piosenki',onclick:(e)=>{ const txt=path.map(c=>c.name.replace('°','dim')).join(' '); navigator.clipboard&&navigator.clipboard.writeText(txt).then(()=>{e.target.textContent='skopiowano ✓';}); }},'kopiuj'));
  }
  drawPath();
  info.innerHTML = 'Kliknij akord: zabrzmi i zaświecą się ścieżki, <b>dokąd naturalnie może pójść</b>. Tak wygląda mapa, z której składa się większość piosenek.';
}

/* ---------- koło kwintowe ---------- */
function drawCircle(hold, key, onKey, info){
  hold.innerHTML='';
  const W=720, H=720, cx=W/2, cy=H/2;
  const svg = sv('svg',{viewBox:`0 0 ${W} ${H}`,role:'img','aria-label':'Koło kwintowe'},hold);
  glowDefs(svg); stars(svg,W,H,90);
  const R1=290, R2=195, R3=108;
  [R1,R2].forEach(r=>sv('circle',{cx,cy,r,fill:'none',stroke:'#2a2a38','stroke-width':1},svg));
  const idx = ALL_KEYS.indexOf(key);
  const chords = chordsFor(key);
  // pozycje akordów gamy: I, IV, V na zewnątrz; vi, ii, iii w środku; vii° najbliżej środka
  const pos = {};
  const at = (i, r)=>{ const a = (i*30-90)*Math.PI/180; return [cx+Math.cos(a)*r, cy+Math.sin(a)*r]; };
  pos[0]=at(idx,R1); pos[3]=at(idx-1,R1); pos[4]=at(idx+1,R1);
  pos[5]=at(idx,R2); pos[1]=at(idx-1,R2); pos[2]=at(idx+1,R2);
  pos[6]=at(idx+1,R3+10);
  // obszar gamy — świecący klin
  const a0=((idx-1.5)*30-90)*Math.PI/180, a1=((idx+1.5)*30-90)*Math.PI/180;
  const Ro=R1+48, Ri=R3-30;
  const wedge=`M${cx+Math.cos(a0)*Ri},${cy+Math.sin(a0)*Ri} L${cx+Math.cos(a0)*Ro},${cy+Math.sin(a0)*Ro} A${Ro},${Ro} 0 0 1 ${cx+Math.cos(a1)*Ro},${cy+Math.sin(a1)*Ro} L${cx+Math.cos(a1)*Ri},${cy+Math.sin(a1)*Ri} A${Ri},${Ri} 0 0 0 ${cx+Math.cos(a0)*Ri},${cy+Math.sin(a0)*Ri} Z`;
  sv('path',{d:wedge,fill:'rgba(244,114,182,.05)',stroke:'rgba(244,114,182,.35)','stroke-width':1,'stroke-dasharray':'3 5'},svg);
  // połączenia T→S→D→T
  const lines = sv('g',{},svg);
  [[0,3],[3,4],[4,0],[5,1],[1,4],[2,5],[6,0]].forEach(([a,b])=>{
    const [x1,y1]=pos[a],[x2,y2]=pos[b];
    sv('line',{x1,y1,x2,y2,stroke:FN_COLOR[chords[b].fn],'stroke-width':1.4,opacity:.35,filter:'url(#glow2)'},lines);
  });
  // wszystkie tonacje (przyciemnione) + akordy gamy (świecące)
  const inKey = new Set([idx-1,idx,idx+1].map(i=>(i+12)%12));
  ALL_KEYS.forEach((k,i)=>{
    const [x,y]=at(i,R1);
    if(!inKey.has(i)) vNode(svg,x,y,26,'o',fmt(k),'',()=>onKey(k),true);
    const [x2,y2]=at(i,R2);
    const mn = REL_MINOR[k];
    if(!inKey.has(i)) vNode(svg,x2,y2,21,'o',fmt(mn)+'m','',()=>{ strike(parseChord(mn+'m').pcs); },true);
  });
  Object.entries(pos).forEach(([d,[x,y]])=>{
    const c=chords[d];
    const big = d==0;
    vNode(svg,x,y,big?36:(d==6?22:29),c.fn,fmt(c.name),c.rn,(g)=>{
      strike(c.pcs); pulse(g);
      info.innerHTML = `<b style="color:${FN_COLOR[c.fn]}">${fmt(c.name)}</b> — ${c.rn}, ${FN_NAME[c.fn].toLowerCase()} w ${keyLabel(key)}. Dźwięki: ${c.notes.map(fmt).join(' – ')}.`;
    });
  });
  const ct = sv('text',{x:cx,y:cy-6,'text-anchor':'middle','font-family':'Fraunces,serif','font-weight':900,'font-size':30,fill:'#e9e9f0'},svg); ct.textContent=keyLabel(key);
  const cs = sv('text',{x:cx,y:cy+18,'text-anchor':'middle','font-family':'Inter,sans-serif','font-size':12,fill:'#8f8fa3'},svg);
  const nAcc = KEYS[key].filter(n=>n.length>1);
  cs.textContent = nAcc.length ? nAcc.map(fmt).join(' ') : 'same białe';
  info.innerHTML = 'Każdy krok po okręgu w prawo = kwinta w górę = jeden krzyżyk więcej. Świecący klin to 7 akordów wybranej gamy — zawsze leżą obok siebie. Kliknij przygaszoną tonację, żeby się tam przenieść.';
}

const ViewWizualizacja = {
  title:'Wizualizacja',
  render(root){
    let key = prefs.get('viz.key','C'); if(!KEYS[key]) key='C';
    let mode = prefs.get('viz.mode','tree');
    const hold = h('div',{class:'viz-wrap'});
    const info = h('p',{class:'muted',style:'margin-top:14px;min-height:3em'});
    const pathEl = h('div',{class:'row',style:'margin-top:6px'});
    const kb = h('div');
    const seg = h('div',{class:'seg',role:'group','aria-label':'Widok'});
    [['tree','Drzewo ruchów'],['circle','Koło kwintowe']].forEach(([v,l])=>{
      const b=h('button',{'aria-pressed':String(v===mode)},l);
      b.onclick=()=>{ mode=v; prefs.set('viz.mode',v); seg.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b))); draw(); };
      seg.appendChild(b);
    });
    root.append(
      h('header',{style:'margin-bottom:10px'},
        h('p',{class:'kicker'},'zobacz harmonię'),
        h('h1',null,'Mapa ', h('em',null,'akordów')),
        h('p',{class:'lead'},'Każdy węzeł to akord, kolor to jego rola. Klikaj — węzły grają. Chcesz ułożyć własne akordy i zobaczyć, jak przejść do innej gamy? ', h('a',{href:'#przejscia'},'Zakładka Przejścia →'))),
      h('div',{class:'row',style:'margin:16px 0 4px'}, seg),
      kb, hold, info, pathEl,
      h('div',{class:'legend'}, h('span',{class:'t-c'},'tonika · dom'), h('span',{class:'s-c'},'subdominanta · ruch'), h('span',{class:'d-c'},'dominanta · napięcie'), h('span',{style:'color:var(--out)'},'poza gamą')));
    function draw(){
      kb.innerHTML='';
      kb.append(keyBar(key, k=>{ key=k; prefs.set('viz.key',k); draw(); }, ALL_KEYS));
      pathEl.style.display = mode==='tree'?'':'none';
      if(mode==='tree') drawTree(hold,key,info,pathEl);
      else drawCircle(hold,key,(k)=>{ key=k; prefs.set('viz.key',k); strike(chordsFor(k)[0].pcs); draw(); },info);
    }
    draw();
  }
};
