/* Zakładka „Pętla" — wybierasz akordy z bazy, appka układa je w pętlę,
   rysuje ją jak koło (kolor = rodzaj akordu), pokazuje, jak trzymać ręce
   (płynne przewroty, wspólne dźwięki zostają) i gra w kółko z metronomem. */

function drawLoopRing(hold, chords, texts, key, onPick){
  hold.innerHTML='';
  const W=640, H=640, cx=W/2, cy=H/2;
  const n = chords.length;
  const svg = sv('svg',{viewBox:`0 0 ${W} ${H}`,role:'img','aria-label':'Twoja pętla akordów'},hold);
  glowDefs(svg); stars(svg,W,H,80);
  if(!n){
    const t=sv('text',{x:cx,y:cy,'text-anchor':'middle',fill:'#8f8fa3','font-family':'Inter,sans-serif','font-size':16},svg);
    t.textContent='Dodaj akordy z bazy poniżej albo wybierz gotową pętlę.';
    return {nodes:[], arrows:[], center:null};
  }
  const R = n<=2 ? 150 : 205, r = n>9 ? 27 : n>6 ? 31 : 36;
  const ang = i => (-90 + i*360/n) * Math.PI/180;
  const at = (i, rad=R) => [cx+Math.cos(ang(i))*rad, cy+Math.sin(ang(i))*rad];
  sv('circle',{cx,cy,r:R,fill:'none',stroke:'#2a2a38','stroke-width':1,'stroke-dasharray':'2 6'},svg);
  const arrows=[], nodes=[];
  const ag = sv('g',{},svg), lg = sv('g',{},svg), ng = sv('g',{},svg);
  // strzałki po okręgu: i → i+1 (ostatni wraca do pierwszego)
  for(let i=0;i<n;i++){
    const j=(i+1)%n, a=chords[i], b=chords[j];
    const rel = relation(a,b);
    const tb = chordType(b);
    const col = rel.kind==='dom' ? FN_COLOR.d7 : rel.kind==='jump' ? '#8f8fa3' : FN_COLOR[tb];
    let d;
    if(n===1){ const [x,y]=at(0); d=`M${x+r},${y+8} C${x+r+90},${y+120} ${x-r-90},${y+120} ${x-r},${y+8}`; }
    else{
      const gap = (r+8)/R;                                   // kąt zajęty przez węzeł
      const a0 = ang(i)+gap, a1 = ang(j<=i ? j+n : j)-gap;
      const [x0,y0]=[cx+Math.cos(a0)*R, cy+Math.sin(a0)*R], [x1,y1]=[cx+Math.cos(a1)*R, cy+Math.sin(a1)*R];
      d = `M${x0},${y0} A${R},${R} 0 0 1 ${x1},${y1}`;
    }
    const p = sv('path',{d,fill:'none',stroke:col,'stroke-width':rel.strong?3:1.8,opacity:.55,
      'marker-end':`url(#ar-${rel.kind==='dom'?'d7':rel.kind==='jump'?'o':tb})`,'stroke-dasharray':rel.kind==='jump'?'5 6':'',filter:'url(#glow2)'},ag);
    arrows.push(p);
    // podpis przejścia do środka koła
    const mid = n===1 ? ang(0)+Math.PI : (ang(i)+ang(i+1))/2;
    const lr = n<=2 ? R-52 : R-62;
    const lx = cx+Math.cos(mid)*lr, ly = cy+Math.sin(mid)*lr;
    const t = sv('text',{x:lx,y:ly,'text-anchor':'middle','font-family':'Inter,sans-serif','font-size':15,'font-weight':600,fill:rel.kind==='dom'?FN_COLOR.d7:'#a3a3b8'},lg);
    t.textContent = rel.kind==='dom' ? (rel.strong?'V7 → I':'V → I') : rel.common.length ? `${rel.common.length} wspólne` : 'skok';
    const t2 = sv('text',{x:lx,y:ly+18,'text-anchor':'middle','font-family':'JetBrains Mono,monospace','font-size':14,fill:'#8f8fa3'},lg);
    const sb = spellChord(b);
    t2.textContent = rel.common.map(pc=>fmt(sb[pc])).join(' ');
  }
  chords.forEach((c,i)=>{
    const [x,y]=at(i);
    const f = functionIn(c,key);
    const g = vNode(ng,x,y,r,chordType(c),chordLabel(texts[i]),f.rn||'',()=>onPick(i));
    nodes.push(g);
    // dźwięki akordu na zewnątrz koła (jak na obrazku z drzewkiem C → Cm Em Am)
    const [nx,ny]=at(i, R+r+18);
    const tn = sv('text',{x:nx,y:ny+5,'text-anchor':'middle','font-family':'JetBrains Mono,monospace','font-size':15,fill:'#c9c9d6'},lg);
    const sp = spellChord(c);
    tn.textContent = c.pcs.map(pc=>fmt(sp[pc])).join(' ');
  });
  const ct = sv('text',{x:cx,y:cy-6,'text-anchor':'middle','font-family':'Fraunces,serif','font-weight':900,'font-size':36,fill:'#e9e9f0'},svg);
  ct.textContent = keyNameLabel(key);
  const cs = sv('text',{x:cx,y:cy+22,'text-anchor':'middle','font-family':'Inter,sans-serif','font-size':15,fill:'#8f8fa3'},svg);
  cs.textContent = `↻ pętla · ${n} ${n===1?'akord':n<5?'akordy':'akordów'}`;
  return {nodes, arrows, center:cs};
}

const ViewPetla = {
  title:'Pętla',
  render(root){
    let seq = prefs.get('petla.seq', ['C','G','Am','F']);
    if(!Array.isArray(seq)) seq=[];
    seq = seq.filter(t=>typeof t==='string' && parseChord(t));
    let bpm = prefs.get('petla.bpm', 80);
    let beats = prefs.get('petla.beats', 4);
    let countIn = prefs.get('petla.countIn', true);
    let sel = 0;
    const save = ()=>{ prefs.set('petla.seq',seq); prefs.set('petla.bpm',bpm); prefs.set('petla.beats',beats); prefs.set('petla.countIn',countIn); };

    const chipsBox = h('div',{class:'seqbox'});
    const status = h('p',{class:'hint',style:'margin:10px 0 0'});
    const ringHold = h('div',{class:'viz-wrap'});
    const nowEl = h('div',{class:'now'});
    const beatsEl = h('div',{class:'beats','aria-hidden':'true'});
    const kbdHold = h('div');
    const kbdCap = h('div',{class:'cap'});
    const howBox = h('div',{class:'howto'});
    const nextBox = h('div');
    const dbBox = h('div',{class:'chorddb scrollx'});
    const presetBox = h('div',{class:'presets'});
    const input = h('input',{id:'petla-add',class:'mono',placeholder:'wpisz akord, np. F#m7, Bb, E7, C/E','aria-label':'Dopisz akord'});

    const playB = h('button',{class:'btn primary big'},'▶ Graj w kółko');
    const bpmIn = h('input',{id:'petla-bpm',type:'range',min:40,max:160,step:1,value:bpm,'aria-label':'Tempo'});
    const bpmOut = h('b',{class:'mono'},String(bpm));
    const beatsSel = h('select',{id:'petla-beats',style:'width:auto'}, ...[1,2,3,4,6,8].map(v=>h('option',{value:v,selected:v===beats},v+' '+(v===1?'uderzenie':v<5?'uderzenia':'uderzeń'))));
    const countB = h('button',{type:'button',class:'btn small ghost','aria-pressed':String(countIn),title:'Jeden takt odliczania przed startem'},'⏱ odliczanie');

    root.append(
      h('header',{style:'margin-bottom:18px'},
        h('p',{class:'kicker'},'graj w kółko'),
        h('h1',null,'Twoja ', h('em',null,'pętla')),
        h('p',{class:'lead'},'Wybierz akordy z bazy albo gotową pętlę. Appka ułoży je w koło, pokaże, jak trzymać ręce, żeby przejścia były gładkie, i będzie grać w kółko w Twoim tempie. Grasz razem z nią.')),
      h('div',{class:'card'},
        h('div',{class:'sechead',style:'margin-bottom:8px'}, h('h2',null,'Akordy w pętli'),
          h('div',{class:'row'},
            h('button',{class:'btn small',title:'Ułóż w kolejności, która najlepiej brzmi w kółko',onclick:autoOrder},'✨ Ułóż w pętlę'),
            h('button',{class:'btn small ghost',title:'Wszystko pół tonu niżej',onclick:()=>transpose(-1)},'♭ −½'),
            h('button',{class:'btn small ghost',title:'Wszystko pół tonu wyżej',onclick:()=>transpose(1)},'♯ +½'),
            h('button',{class:'btn small ghost',onclick:()=>{ seq.pop(); sel=Math.min(sel,seq.length-1); changed(); }},'⌫ cofnij'),
            h('button',{class:'btn small ghost danger',onclick:()=>{ seq=[]; sel=0; changed(); }},'wyczyść'))),
        chipsBox,
        h('div',{class:'row',style:'margin-top:10px'}, input, h('button',{class:'btn',onclick:addFromInput},'+ dodaj')),
        status),
      h('div',{class:'player card'},
        h('div',{class:'row'}, playB,
          h('label',{class:'row',style:'gap:6px',for:'petla-bpm'}, h('span',{class:'muted'},'tempo'), bpmIn, bpmOut, h('span',{class:'hint'},'BPM')),
          h('span',{class:'row',style:'gap:6px'}, h('span',{class:'muted'},'akord trwa'), beatsSel),
          clickToggle(), countB),
        h('div',{class:'nowrow'}, nowEl, beatsEl)),
      h('div',{class:'loop-layout'},
        ringHold,
        h('div',null,
          h('div',{class:'kbd-panel',style:'margin-top:0'}, kbdCap, kbdHold),
          howBox)),
      h('div',{class:'legend'}, ...Object.entries(CHORD_TYPES).map(([k,t])=>h('span',{style:`color:${t.color}`},t.name)),
        h('span',{style:'color:#fff'},'biała obwódka = palec zostaje')),
      h('section',null, h('div',{class:'sechead'}, h('h2',null,'Co pasuje dalej'), h('span',{class:'hint'},'po zaznaczonym akordzie · kliknij, żeby dodać')), nextBox),
      h('section',null, h('div',{class:'sechead'}, h('h2',null,'Baza akordów'), h('span',{class:'hint'},'kolumny idą po kole kwintowym · kliknij, żeby dodać')), dbBox),
      h('section',null, h('div',{class:'sechead'}, h('h2',null,'Gotowe pętle'), h('span',{class:'hint'},'kliknij, żeby wczytać')), presetBox),
      h('div',{class:'box tip',style:'margin-top:26px'}, h('p',null,'Jak ćwiczyć: najpierw sama lewa ręka (bas), potem sama prawa w pokazanych przewrotach, potem razem. Zacznij od 60 BPM i 4 uderzeń na akord. Kiedy pętla idzie bez zatrzymania 4 razy pod rząd — przyspiesz o 5 BPM.')));

    input.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); addFromInput(); } });
    bpmIn.oninput=()=>{ bpm=+bpmIn.value; bpmOut.textContent=bpm; save(); };
    bpmIn.onchange=()=>{ if(isPlaying()) start(); };
    beatsSel.onchange=()=>{ beats=+beatsSel.value; save(); drawBeats(-1,-1); if(isPlaying()) start(); };
    countB.onclick=()=>{ countIn=!countIn; countB.setAttribute('aria-pressed',String(countIn)); save(); };
    playB.onclick=()=>{ if(isPlaying()) stopSeq(); else start(); };

    let view = {nodes:[], arrows:[], center:null};
    let chords=[], voices=[], key='C';

    function addChord(name){
      const c=parseChord(name); if(!c) return;
      seq.push(c.text); sel=seq.length-1;
      strike(c.pcs,1.1,0,c.bassPc); changed();
    }
    function addFromInput(){
      const toks = input.value.split(/[\s,|]+/).filter(Boolean);
      const bad = toks.filter(t=>!parseChord(t));
      toks.filter(t=>parseChord(t)).forEach(t=>seq.push(parseChord(t).text));
      if(toks.length>bad.length) sel=seq.length-1;
      input.value = bad.join(' ');
      input.title = bad.length ? 'Nie rozpoznano: '+bad.join(', ') : '';
      changed();
    }
    function autoOrder(){
      if(seq.length<3) return;
      seq = orderLoop(seq).order; sel=0; changed();
    }
    function transpose(k){ seq = seq.map(t=>transposeChord(t,k)); changed(); }
    function changed(){ stopSeq(); save(); draw(); }

    function start(){
      if(!seq.length) return;
      const step = 60/bpm*beats;
      playB.textContent='■ Stop'; playB.classList.add('on');
      playChordSeq(chords.map((c,i)=>({pcs:c.pcs, bassPc:c.bassPc, voiced:voices[i], el:chipsBox.querySelectorAll('.chord-chip')[i],
        onStart:(idx,cycle)=>{ showChord(idx); if(view.nodes[idx]) pulse(view.nodes[idx]); lightArrow(idx);
          if(view.center) view.center.textContent = `↻ runda ${cycle+1}`; }})), step,
        ()=>{ playB.textContent='▶ Graj w kółko'; playB.classList.remove('on'); lightArrow(-1); drawBeats(-1,-1);
          if(view.center) view.center.textContent = `↻ pętla · ${seq.length} ${seq.length===1?'akord':seq.length<5?'akordy':'akordów'}`; showChord(sel); },
        {loop:true, beats, click:clickPref(), countIn: countIn ? beats : 0,
         onBeat:(idx,b)=>drawBeats(idx,b),
         onCount:(left)=>{ nowEl.innerHTML=`<span class="muted">start za</span> <b class="count">${left}</b>`; drawBeats(-1,-1); }});
    }
    function lightArrow(idx){
      view.arrows.forEach((a,i)=>{ a.setAttribute('opacity', i===idx ? .95 : .55); a.setAttribute('stroke-width', i===idx ? 3.4 : (relation(chords[i],chords[(i+1)%chords.length]).strong?3:1.8)); });
    }
    function drawBeats(idx,b){
      beatsEl.innerHTML='';
      for(let k=0;k<beats;k++) beatsEl.append(h('span',{class:'dot'+(k===b?' on':'')+(k===0?' first':'')}));
    }

    // klawiatura: prawa ręka w kolorze akordu, wspólne z poprzednim z białą obwódką, bas szary
    function showChord(i){
      if(!chords.length){ kbdCap.textContent=''; kbdHold.innerHTML=''; nowEl.innerHTML=''; return; }
      const c=chords[i], v=voices[i], prevV=voices[(i-1+chords.length)%chords.length];
      const t=chordType(c);
      const sp = spellChord(c), nm = m=>fmt(sp[m%12]);
      const bass = voicing(c.pcs, c.bassPc)[0];
      const marks={}, names={};
      v.forEach(m=>{ marks[m]=t; names[m]=nm(m); });
      marks[bass]='bs'; names[bass]=nm(bass);
      const svg = kbdSVG({from:43,to:84,marks,names,labels:'marked',aria:'Klawiatura z chwytem '+chordLabel(c.text),
        onKey:(m,r)=>{ playMidi(m); flashKey(r.ownerSVGElement,m); }});
      svg.classList.add('wide');
      const held = chords.length>1 ? v.filter(m=>prevV.includes(m)) : [];
      held.forEach(m=>{ const r=svg.querySelector(`rect[data-midi="${m}"]`); if(r) r.classList.add('hold'); });
      kbdHold.innerHTML=''; kbdHold.append(svg);
      const nx = chords[(i+1)%chords.length];
      kbdCap.innerHTML = `<b style="color:${CHORD_TYPES[t].color}">${esc(chordLabel(c.text))}</b> · ${esc(CHORD_TYPES[t].name)} · prawa ręka: <b>${v.map(nm).join(' – ')}</b> (${inversionName(c,v)}) · lewa: <b>${nm(bass)}</b>`+
        (held.length ? ` · zostaje: <b>${held.map(nm).join(', ')}</b>` : '');
      nowEl.innerHTML = `<span class="muted">teraz</span> <b class="cur" style="color:${CHORD_TYPES[t].color}">${esc(chordLabel(c.text))}</b>`+
        (chords.length>1 ? ` <span class="muted">→ potem</span> <b style="color:${CHORD_TYPES[chordType(nx)].color}">${esc(chordLabel(nx.text))}</b>` : '');
      howBox.querySelectorAll('tr[data-i]').forEach(tr=>tr.classList.toggle('sel', +tr.dataset.i===i));
    }

    function draw(){
      chords = seq.map(t=>parseChord(t));
      key = chords.length ? guessLoopKey(chords) : 'C';
      voices = loopVoicings(chords);
      if(sel>=seq.length) sel=Math.max(0,seq.length-1);
      // chipsy
      chipsBox.innerHTML='';
      if(!seq.length) chipsBox.append(h('span',{class:'hint'},'Pusto. Kliknij akordy w bazie niżej albo wczytaj gotową pętlę.'));
      seq.forEach((txt,i)=>{
        const c=chords[i], t=chordType(c);
        const chip = h('span',{class:'chord-chip ty-'+t+(i===sel?' sel':''),tabindex:'0',role:'button','aria-label':chordLabel(txt)+', zaznacz'},
          chordLabel(txt),
          i===sel && seq.length>1 ? h('button',{type:'button',class:'rm',title:'przesuń w lewo','aria-label':'przesuń w lewo',onclick:e=>{ e.stopPropagation(); move(i,-1); }},'‹') : null,
          i===sel && seq.length>1 ? h('button',{type:'button',class:'rm',title:'przesuń w prawo','aria-label':'przesuń w prawo',onclick:e=>{ e.stopPropagation(); move(i,1); }},'›') : null,
          h('button',{type:'button',class:'rm',title:'usuń','aria-label':'usuń '+txt,onclick:e=>{ e.stopPropagation(); seq.splice(i,1); if(sel>=i) sel=Math.max(0,sel-1); changed(); }},'×'));
        const pick=()=>{ sel=i; strike(c.pcs,1.1,0,c.bassPc,voices[i]); ring(chip,'lit'); draw(); };
        chip.addEventListener('click',pick);
        chip.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); pick(); } });
        chipsBox.append(chip);
      });
      // podsumowanie
      if(seq.length){
        const rels = chords.map((c,i)=>relation(c, chords[(i+1)%chords.length]));
        const doms = rels.filter(r=>r.kind==='dom').length, jumps = rels.filter(r=>r.kind==='jump').length;
        const outs = chords.filter(c=>functionIn(c,key).fn==='o').length;
        status.innerHTML = `Tonacja: <b class="t-c">${esc(keyNameLabel(key))}</b> · ${seq.length} ${seq.length===1?'akord':seq.length<5?'akordy':'akordów'} · jedna runda = ${Math.round(seq.length*beats*60/bpm*10)/10} s`+
          (doms ? ` · <span class="d-c">${doms}× rozwiązanie dominanty</span>` : '')+
          (jumps ? ` · ${jumps}× skok bez wspólnych dźwięków (tu ręka musi się przesunąć)` : '')+
          (outs ? ` · ${outs} spoza ${esc(keyNameLabel(key))} (kolor z zewnątrz — to OK)` : '');
      }else status.textContent='';
      view = drawLoopRing(ringHold, chords, seq, key, i=>{ sel=i; const c=chords[i]; strike(c.pcs,1.1,0,c.bassPc,voices[i]); draw(); pulse(view.nodes[i]); });
      drawHow(); showChord(sel); drawNext(); drawBeats(-1,-1);
      if(view.nodes[sel]) view.nodes[sel].classList.add('selnode');
    }
    function move(i,d){
      const j=(i+d+seq.length)%seq.length;
      [seq[i],seq[j]]=[seq[j],seq[i]]; sel=j; changed();
    }

    // tabela „jak grać"
    function drawHow(){
      howBox.innerHTML='';
      if(!chords.length) return;
      const tb = h('table',{class:'howtbl'});
      tb.append(h('tr',null, h('th',null,'akord'), h('th',null,'prawa ręka'), h('th',null,'lewa'), h('th',null,'zostaje z poprzedniego')));
      chords.forEach((c,i)=>{
        const v=voices[i], prevV=voices[(i-1+chords.length)%chords.length];
        const sp = spellChord(c), nm = m=>fmt(sp[m%12]);
        const held = chords.length>1 ? v.filter(m=>prevV.includes(m)) : [];
        const tr = h('tr',{'data-i':i,tabindex:'0',class:i===sel?'sel':''},
          h('td',{class:'cn',style:`color:${CHORD_TYPES[chordType(c)].color}`}, chordLabel(c.text)),
          h('td',{class:'mono'}, v.map(nm).join(' – '), h('small',null,' '+inversionName(c,v))),
          h('td',{class:'mono'}, nm(voicing(c.pcs,c.bassPc)[0])),
          h('td',{class:'mono muted'}, held.length ? held.map(nm).join(', ') : '—'));
        const pick=()=>{ sel=i; strike(c.pcs,1.1,0,c.bassPc,v); showChord(i); drawNext(); };
        tr.addEventListener('click',pick);
        tr.addEventListener('keydown',e=>{ if(e.key==='Enter'){ pick(); } });
        tb.append(tr);
      });
      howBox.append(h('div',{class:'scrollx'},tb));
    }

    function chipBtn(name, why){
      const c=parseChord(name); if(!c) return null;
      const t=chordType(c);
      const b=h('button',{type:'button',class:'chord-chip ty-'+t,title:why||CHORD_TYPES[t].name}, chordLabel(name));
      b.onclick=()=>addChord(name);
      return b;
    }
    function drawNext(){
      nextBox.innerHTML='';
      const c = chords[sel];
      if(!c){ nextBox.append(h('p',{class:'hint'},'Zaznacz akord w pętli, a zobaczysz, co może po nim zabrzmieć.')); return; }
      const list = h('div',{class:'nextlist'});
      suggestNext(c).forEach(s=>{ const b=chipBtn(s.name, s.why); if(b) list.append(h('div',{class:'nx'}, b, h('span',{class:'hint'},s.why))); });
      nextBox.append(h('p',{class:'muted',style:'margin:0 0 8px;font-size:.9rem'},'Po ', h('b',{style:`color:${CHORD_TYPES[chordType(c)].color}`},chordLabel(c.text)),' dobrze brzmi:'), list);
    }

    // baza: wiersze = rodzaje, kolumny = 12 podstaw po kole kwintowym
    function drawDb(){
      dbBox.innerHTML='';
      const tb = h('table',{class:'dbtbl'});
      tb.append(h('tr',null, h('th',null,''), ...LOOP_ROOTS.map(r=>h('th',{class:'mono'},fmt(r)))));
      LOOP_KINDS.forEach(k=>{
        const row = h('tr',null, h('th',{class:'mono'},k.label));
        LOOP_ROOTS.forEach(r=>{
          const name = r+k.suf;
          const c=parseChord(name), t=chordType(c);
          const sp=spellChord(c); const b=h('button',{type:'button',class:'dbc ty-'+t,title:`${chordLabel(name)} · ${c.pcs.map(p=>fmt(sp[p])).join(' ')}`,'aria-label':'dodaj '+chordLabel(name)}, chordLabel(name));
          b.onclick=()=>addChord(name);
          row.append(h('td',null,b));
        });
        tb.append(row);
      });
      dbBox.append(tb);
    }
    function drawPresets(){
      presetBox.innerHTML='';
      LOOP_PRESETS.forEach(p=>{
        const row = h('div',{class:'seq',style:'margin:6px 0 0'}, ...p.chords.map(n=>{ const t=chordType(parseChord(n)); return h('b',{class:'ty-'+t},chordLabel(n)); }));
        const b=h('button',{type:'button',class:'preset card'}, h('div',{class:'pname'},p.name), h('div',{class:'hint'},p.desc), row);
        b.onclick=()=>{ seq=p.chords.slice(); sel=0; changed(); window.scrollTo({top:0,behavior:'smooth'}); };
        presetBox.append(b);
      });
    }

    const onSpace = e=>{
      if(!root.isConnected){ document.removeEventListener('keydown',onSpace); return; }
      if(e.key===' ' && !e.target.matches('input,textarea,select,button,[role=button],tr')){ e.preventDefault(); playB.click(); }
    };
    document.addEventListener('keydown',onSpace);

    drawDb(); drawPresets(); draw();
  }
};
