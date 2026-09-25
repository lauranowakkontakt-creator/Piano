/* Zakładka „Gamy" — prototyp akordy.html + klawiatura z chwytem akordu */
const ViewGamy = {
  title:'Gamy',
  render(root){
    let current = prefs.get('gamy.key','C');
    if(!ORDER.includes(current)) current='C';

    const h1key = h('em',null,'gamy '+fmt(current));
    const chordsHead = h('h2',null,'');
    const groups = h('div');
    const progs = h('div');
    const neigh = h('div',{class:'neigh'});
    const kbdCap = h('div',{class:'cap'});
    const kbdHold = h('div');

    root.append(
      h('header',null,
        h('p',{class:'kicker'},'harmonia do grania, nie do wkuwania'),
        h('h1',null,'Które akordy pasują do ', h1key, ' i jak między nimi chodzić'),
        h('p',{class:'lead'},'Klikaj — usłyszysz każdy akord i zobaczysz na klawiaturze, które klawisze nacisnąć. Kolor to rola akordu w gamie: ona mówi, dokąd akord chce iść dalej.')
      ),
      keyBar(current, k=>{ current=k; prefs.set('gamy.key',k); update(); }),
      h('div',{class:'card',style:'margin-top:26px'},
        h('h2',{style:'font-size:1.05rem;margin-bottom:4px'},'Jedna zasada, na której stoi cała reszta'),
        h('p',{class:'muted',style:'margin:0 0 14px;font-size:.94rem'},'Akordy dzielą się na trzy role. Idziesz od domu, przez ruch, do napięcia — a napięcie ciągnie z powrotem do domu. Możesz kręcić to w kółko.'),
        h('div',{class:'flow'},
          h('span',{class:'pill t'},'Tonika · dom'), h('span',{class:'arrow'},'→'),
          h('span',{class:'pill s'},'Subdominanta · ruch'), h('span',{class:'arrow'},'→'),
          h('span',{class:'pill d'},'Dominanta · napięcie'), h('span',{class:'arrow'},'→'),
          h('span',{class:'pill t'},'Tonika · powrót'), h('span',{class:'faint',style:'font-size:.8rem'},'↻ w kółko')
        ),
        h('p',{class:'faint',style:'margin:12px 0 0;font-size:.84rem'},'Nie wiesz, czemu tak? Zajrzyj do zakładki ', h('a',{href:'#teoria/role'},'Teoria → Trzy role akordów'),'.')
      ),
      h('section',null,
        h('div',{class:'sechead'}, chordsHead, h('span',{class:'hint'},'kliknij, żeby usłyszeć')),
        groups,
        h('div',{class:'kbd-panel'}, kbdCap, kbdHold)
      ),
      h('section',null,
        h('div',{class:'sechead'}, h('h2',null,'Gotowe przejścia'), h('span',{class:'hint'},'▶ zagra całą sekwencję')),
        progs
      ),
      h('section',null,
        h('div',{class:'sechead'}, h('h2',null,'Przechodzenie między gamami'), h('span',{class:'hint'},'C · G · D to sąsiedzi')),
        h('div',{class:'card'},
          h('p',{class:'muted',style:'margin:0'},'Sąsiednie gamy mają prawie te same akordy. Żeby przejść z jednej do drugiej, zagraj akord, który jest w obu (most), a zaraz po nim ', h('b',null,'dominantę nowej gamy'),' — to ona mówi uchu „jesteśmy już gdzie indziej". Poniżej mosty dla wybranej gamy.'),
          neigh,
          h('p',{class:'muted',style:'margin:0'},'Przykład: z ', h('b',null,'C'),' do ', h('b',null,'G'),' — zagraj wspólne C albo Am, potem ', h('b',null,'D'),' (dominanta G), i już jesteś w G. ',
            h('button',{class:'listen','data-chords':'C F C Am D G'},'posłuchaj C → G'))
        )
      ),
      h('p',{class:'hint',style:'margin-top:26px'},'Chcesz to mieć na kartce przy pianinie? ', h('a',{href:'#druk'},'Drukuj ściągawkę →'))
    );
    wireListens(root);

    function showKbd(ch){
      kbdCap.innerHTML = `<b>${fmt(ch.name)}</b> · ${FN_NAME[ch.fn].toLowerCase()} · dźwięki: <b>${ch.notes.map(fmt).join(' – ')}</b>. Prawa ręka gra te trzy dźwięki, lewa podstawę (<b>${fmt(ch.notes[0])}</b>) oktawę niżej.`;
      kbdHold.innerHTML='';
      kbdHold.appendChild(kbdSVG({from:60,to:83,marks:chordMarks(ch.pcs,ch.fn),names:chordNames(ch.notes,ch.pcs),
        onKey:(m,r)=>{ playMidi(m); flashKey(r.ownerSVGElement,m); }}));
    }

    function update(){
      h1key.textContent='gamy '+fmt(current);
      chordsHead.textContent='Akordy gamy '+keyLabel(current);
      const chords = chordsFor(current);
      groups.innerHTML='';
      ['t','s','d'].forEach(fn=>{
        const nodes = h('div',{class:'nodes'});
        chords.filter(c=>c.fn===fn).forEach(ch=>{
          const el = h('button',{class:'node '+fn,'aria-label':`${fmt(ch.name)}, ${FN_NAME[fn]}`,
            html:`<div class="rn">${ch.rn}</div><div class="name">${fmt(ch.name)}</div><div class="chipnotes">${ch.notes.map(n=>`<span>${fmt(n)}</span>`).join('')}</div>`});
          el.onclick=()=>{ strike(ch.pcs); ring(el); showKbd(ch); };
          nodes.appendChild(el);
        });
        groups.appendChild(h('div',{class:'group '+fn},
          h('div',{class:'grouptag'}, h('span',{class:'dot'}), FN_NAME[fn]+' ', h('small',null,'· '+FN_SUB[fn])), nodes));
      });
      showKbd(chords[0]);

      progs.innerHTML='';
      PROGS.forEach(p=>{
        const seq = h('div',{class:'seq'});
        p.deg.forEach(di=>{ const c=chords[di]; seq.appendChild(h('b',{class:c.fn,html:`${fmt(c.name)}<span class="deg">${c.rn}</span>`})); });
        progs.appendChild(h('div',{class:'prog'},
          h('div',null, h('div',{class:'pname'},p.name), h('div',{class:'pdesc'},p.desc), seq),
          playBtn(p.name, ()=>p.deg.map((di,i)=>({pcs:chords[di].pcs, el:seq.children[i], onStart:()=>showKbd(chords[di])})), 0.78)
        ));
      });

      const sc=KEYS[current];
      neigh.innerHTML='';
      [[sc[3],'w dół (subdominanta)'],[sc[4],'w górę (dominanta)']].forEach(([rk,role])=>{
        const card=h('div',{class:'nc'}, h('div',{class:'top'}, h('span',{class:'kn'},fmt(rk)), h('span',{class:'role'},role)));
        if(KEYS[rk]){
          const sh=h('div',{class:'shared'});
          sharedWith(current, rk).forEach(c=>{
            const b=h('button',{title:'wspólny most'},fmt(c.name)); b.onclick=()=>strike(c.pcs); sh.appendChild(b);
          });
          const dom = chordsFor(rk)[4];
          card.append(sh, h('div',{class:'faint',style:'font-size:.8rem;margin-top:8px'},'potem dominanta nowej gamy: ', h('b',{class:'d-c'},fmt(dom.name))));
        }else{
          card.append(h('div',{class:'faint',style:'font-size:.82rem'},'Zasada ta sama: wspólny akord, potem V nowej gamy.'));
        }
        neigh.appendChild(card);
      });
    }
    update();
  }
};
