/* Zakładka „Piosenki" — własne utwory: akordy, tonacja, notatki, audio.
   Dane w IndexedDB (u Ciebie w przeglądarce). */

const SONG_KEYS = [...ALL_KEYS.map(k=>({v:k,l:keyLabel(k)})), ...ALL_KEYS.map(k=>({v:REL_MINOR[k]+'m', l:fmt(REL_MINOR[k]).toLowerCase()+'-moll'}))];
function keyNameLabel(v){ const f=SONG_KEYS.find(k=>k.v===v); return f?f.l:v; }

/* zgadnij tonację: ile akordów pasuje + premia za ostatni / pierwszy akord jako tonikę */
function guessKey(chords){
  if(!chords.length) return [];
  const scores = SONG_KEYS.map(({v})=>{
    let s=0;
    chords.forEach(c=>{ const f=functionIn(c,v); if(f.fn!=='o') s+=1; });
    const tonicOf = v.endsWith('m') ? {pc:PC[v.slice(0,-1)], q:'min'} : {pc:PC[v], q:'maj'};
    const isTonic = c => c.rootPc===tonicOf.pc && (c.q===tonicOf.q || c.q.startsWith('sus'));
    if(isTonic(chords[chords.length-1])) s+=2;
    if(isTonic(chords[0])) s+=1.5;
    s += chords.filter(isTonic).length*0.3;
    return {v, s, fit:chords.filter(c=>functionIn(c,v).fn!=='o').length};
  });
  return scores.sort((a,b)=>b.s-a.s).slice(0,3);
}

const EXAMPLE_SONG = {
  title:'Przykład: pętla popowa', artist:'', key:'C', bpm:90, beats:4,
  chords:'[Zwrotka] C G Am F | C G F F\n[Refren] F G C Am | F G C C\n[Koniec] Dm G C',
  notes:'To jest przykład. Zmień go albo usuń i dodaj swoją piosenkę.\n\nZwróć uwagę: refren kończy się G → C, czyli dominantą wracającą do domu.',
};

const ViewPiosenki = {
  title:'Piosenki',
  async render(root, sub){
    root.append(
      h('header',{style:'margin-bottom:22px'},
        h('p',{class:'kicker'},'Twoje utwory'),
        h('h1',null,'Piosenki ', h('em',null,'rozebrane na części')),
        h('p',{class:'lead'},'Wpisz akordy piosenki, a appka pokaże rolę każdego akordu w tonacji, zagra je i pomoże zgadnąć tonację. Możesz dołączyć nagranie do odsłuchu. Wszystko zapisuje się w tej przeglądarce.')));

    let songs;
    try{ songs = await DB.allSongs(); }
    catch(e){
      root.append(h('div',{class:'card'},h('p',null,'Ta przeglądarka nie pozwala zapisywać danych (IndexedDB). Otwórz appkę w Chrome, Edge albo Firefox. Jeśli otwierasz plik bezpośrednio z dysku w Safari — uruchom ją przez start (patrz README).')));
      return;
    }
    if(!songs.length && !prefs.get('songs.seeded',false)){
      const s = {...EXAMPLE_SONG, id:uid()}; await DB.putSong(s); prefs.set('songs.seeded',true); songs=[s];
    }

    const list = h('div',{class:'song-list'});
    const main = h('div');
    root.append(h('div',{class:'songs-layout'}, h('div',null,
      h('div',{class:'row',style:'margin-bottom:10px'},
        h('button',{class:'btn primary',onclick:newSong},'+ Nowa piosenka')),
      list,
      h('div',{class:'row',style:'margin-top:16px'},
        h('button',{class:'btn small ghost',onclick:exportAll,title:'Zapisz kopię wszystkich piosenek do pliku'},'⤓ Kopia zapasowa'),
        h('label',{class:'btn small ghost',title:'Wczytaj kopię z pliku'},'⤒ Wczytaj', h('input',{type:'file',accept:'.json,application/json',style:'display:none',onchange:importAll})))
    ), main));

    let currentId = sub && songs.find(s=>s.id===sub) ? sub : (songs[0]&&songs[0].id);

    function drawList(){
      list.innerHTML='';
      if(!songs.length){ list.append(h('div',{class:'empty'},'Nie masz jeszcze piosenek. Kliknij „+ Nowa piosenka".')); return; }
      songs.forEach(s=>{
        const b=h('button',{class:'item','aria-current':String(s.id===currentId)}, s.title||'(bez tytułu)', h('small',null,[s.artist,keyNameLabel(s.key)].filter(Boolean).join(' · ')));
        b.onclick=()=>{ currentId=s.id; history.replaceState(null,'','#piosenki/'+s.id); drawList(); drawSong(); };
        list.appendChild(b);
      });
    }

    async function newSong(){
      const s={id:uid(), title:'Nowa piosenka', artist:'', key:'C', bpm:90, beats:4, chords:'', notes:''};
      await DB.putSong(s); songs.unshift(s); currentId=s.id; drawList(); drawSong(true);
    }
    async function exportAll(){
      const all = await DB.allSongs();
      const blob = new Blob([JSON.stringify({app:'harmonia',version:1,exported:new Date().toISOString(),songs:all},null,2)],{type:'application/json'});
      const a=h('a',{href:URL.createObjectURL(blob),download:'harmonia-piosenki-'+new Date().toISOString().slice(0,10)+'.json'});
      document.body.appendChild(a); a.click(); a.remove();
    }
    async function importAll(e){
      const f=e.target.files[0]; if(!f) return;
      try{
        const data = JSON.parse(await f.text());
        const arr = Array.isArray(data)?data:data.songs;
        let n=0;
        for(const s of arr||[]){ if(s && s.id){ await DB.putSong(s); n++; } }
        songs = await DB.allSongs(); drawList(); drawSong();
        alert(`Wczytano piosenek: ${n}. (Nagrania audio nie są w kopii — dodaj je ponownie.)`);
      }catch(err){ alert('To nie wygląda na plik kopii z tej appki.'); }
      e.target.value='';
    }

    let saveT=null;
    function drawSong(focusTitle){
      stopSeq();
      main.innerHTML='';
      const s = songs.find(x=>x.id===currentId);
      if(!s){ main.append(h('div',{class:'empty'},'Wybierz piosenkę z listy albo dodaj nową.')); return; }
      const save = ()=>{ clearTimeout(saveT); saveT=setTimeout(()=>{ DB.putSong(s); drawList(); },400); };

      /* --- pola --- */
      const fTitle = h('input',{value:s.title||'',placeholder:'Tytuł','aria-label':'Tytuł',style:'font-family:Fraunces,serif;font-size:1.5rem;font-weight:600;padding:8px 12px'});
      const fArtist = h('input',{value:s.artist||'',placeholder:'Wykonawca (opcjonalnie)'});
      const fKey = h('select',null, ...SONG_KEYS.map(k=>h('option',{value:k.v,selected:k.v===s.key},k.l)));
      const fBpm = h('input',{type:'number',min:40,max:200,value:s.bpm||90});
      const fBeats = h('select',null, ...[1,2,3,4,8].map(n=>h('option',{value:n,selected:(s.beats||4)==n}, n+' '+(n===1?'uderzenie':n<5?'uderzenia':'uderzeń'))));
      const fChords = h('textarea',{spellcheck:'false',class:'mono',style:'min-height:130px;font-size:.95rem',placeholder:'[Zwrotka] C G Am F\n[Refren] F G C C'}, s.chords||'');
      const fNotes = h('textarea',{placeholder:'Twoje notatki: co ćwiczyć, gdzie jest trudno, jak grać…'}, s.notes||'');

      fTitle.oninput=()=>{ s.title=fTitle.value; save(); };
      fArtist.oninput=()=>{ s.artist=fArtist.value; save(); };
      fKey.onchange=()=>{ s.key=fKey.value; save(); drawSheet(); drawBuilder(); };
      fBpm.oninput=()=>{ s.bpm=+fBpm.value||90; save(); };
      fBeats.onchange=()=>{ s.beats=+fBeats.value; save(); };
      fChords.oninput=()=>{ s.chords=fChords.value; save(); drawSheet(); };
      fNotes.oninput=()=>{ s.notes=fNotes.value; save(); };

      /* --- arkusz z akordami --- */
      const sheet = h('div',{class:'song-sheet'});
      const analysis = h('div',{class:'hint',style:'margin-top:10px'});
      const playAll = h('button',{class:'btn primary'},'▶ Zagraj akordy');
      playAll.onclick=()=>{
        if(playAll.dataset.on){ stopSeq(); return; }
        const items=[];
        sheet.querySelectorAll('.chord-chip').forEach(el=>{ const c=parseChord(el.dataset.c); if(c) items.push({pcs:c.pcs,bassPc:c.bassPc,el}); });
        if(!items.length) return;
        playAll.dataset.on='1'; playAll.textContent='■ Stop';
        playChordSeq(items, (60/(s.bpm||90))*(s.beats||4), ()=>{ delete playAll.dataset.on; playAll.textContent='▶ Zagraj akordy'; });
      };
      function drawSheet(){
        sheet.innerHTML='';
        const lines = parseSongText(s.chords);
        const all=[];
        const junk=[];
        lines.forEach(l=>{
          const line = h('div',{class:'line'});
          if(l.label) line.append(h('div',{class:'lbl'},l.label));
          l.tokens.forEach(t=>{
            if(t.bar){ line.append(h('span',{class:'bar-sep'},'|')); return; }
            if(t.junk){ junk.push(t.junk); line.append(h('span',{class:'faint mono',title:'nie rozpoznano akordu'},t.junk)); return; }
            const c=t.chord; all.push(c);
            const f=functionIn(c, s.key);
            const b=h('button',{class:'chord-chip '+f.fn,'data-c':c.text,title:FN_NAME[f.fn]+(f.rn?' · '+f.rn:'')}, fmt(c.text), f.rn?h('span',{class:'deg'},f.rn):null);
            b.onclick=()=>{ strike(c.pcs,1.1,0,c.bassPc); ring(b,'lit'); };
            line.append(b);
          });
          sheet.append(line);
        });
        if(!lines.length) sheet.append(h('div',{class:'empty'},'Wpisz akordy poniżej albo klikaj akordy w kreatorze.'));
        // analiza
        const cnt={t:0,s:0,d:0,o:0}; all.forEach(c=>cnt[functionIn(c,s.key).fn]++);
        const guesses = guessKey(all);
        analysis.innerHTML='';
        if(all.length){
          analysis.append(
            h('span',null,'Role: '), h('span',{class:'t-c'},`tonika ${cnt.t}`),' · ', h('span',{class:'s-c'},`subdominanta ${cnt.s}`),' · ', h('span',{class:'d-c'},`dominanta ${cnt.d}`),
            cnt.o? h('span',null,' · ', h('span',{style:'color:var(--out)'},`spoza gamy ${cnt.o}`)) : '');
          if(guesses[0] && guesses[0].v!==s.key && guesses[0].s > (guesses.find(g=>g.v===s.key)||{s:-1}).s){
            const g=guesses[0];
            const use=h('button',{class:'btn small',style:'margin-left:8px'},'ustaw '+keyNameLabel(g.v));
            use.onclick=()=>{ s.key=g.v; fKey.value=g.v; save(); drawSheet(); drawBuilder(); };
            analysis.append(h('div',{style:'margin-top:6px'},`Podpowiedź: akordy najlepiej pasują do tonacji `, h('b',null,keyNameLabel(g.v)), ` (${g.fit}/${all.length} akordów w gamie).`, use));
          }
        }
        if(junk.length) analysis.append(h('div',{style:'margin-top:6px'},'Nie rozpoznano: '+junk.join(', ')+' — pisz akordy jak C, Am, F#m, Bb7, G/B.'));
      }

      /* --- kreator: akordy tonacji do klikania --- */
      const builder = h('div',{class:'builder'});
      function drawBuilder(){
        builder.innerHTML='';
        const major = majorOfKey(s.key);
        const isMin = s.key.endsWith('m');
        let chords = chordsFor(major).map(c=>({...c, ...functionIn(parseChord(c.name.replace('°','dim')), s.key)}));
        if(isMin){ chords = [...chords.slice(5), ...chords.slice(0,5)]; const V = parseChord((PC_NAME_SHARP[(PC[s.key.slice(0,-1)]+7)%12])); chords.push({name:V.root, pcs:V.pcs, fn:'d', rn:'V', notes:[]}); }
        const nodes = h('div',{class:'nodes'});
        chords.forEach(c=>{
          const b=h('button',{class:'node '+c.fn,title:'dodaj do piosenki',html:`<div class="rn">${c.rn}</div><div class="name">${fmt(c.name)}</div>`});
          b.onclick=()=>{
            strike(c.pcs); ring(b);
            const ins = c.name.replace('°','dim');
            const v=fChords.value; const pos = fChords.selectionStart ?? v.length;
            const before = v.slice(0,pos), after=v.slice(pos);
            const sep = before && !/[\s]$/.test(before) ? ' ' : '';
            fChords.value = before + sep + ins + ' ' + after;
            const np = (before+sep+ins+' ').length; fChords.setSelectionRange(np,np);
            s.chords=fChords.value; save(); drawSheet();
          };
          nodes.appendChild(b);
        });
        builder.append(h('div',{class:'hint',style:'margin-bottom:8px'},`Akordy tonacji ${keyNameLabel(s.key)} — kliknij, żeby dopisać w miejscu kursora. Enter w polu akordów = nowa linia.`), nodes,
          h('div',{class:'row',style:'margin-top:10px'},
            ...[['T→S→D→T',[0,3,4,0]],['I–V–vi–IV',[0,4,5,3]],['vi–IV–I–V',[5,3,0,4]],['ii–V–I',[1,4,0]]].map(([l,deg])=>{
              const b=h('button',{class:'btn small'},'+ '+l);
              b.onclick=()=>{ const cs=chordsFor(major); const names = deg.map(d=>cs[isMin? (d+5)%7 : d].name.replace('°','dim'));
                fChords.value = (fChords.value.trim()? fChords.value.replace(/\s*$/,'')+'\n':'') + names.join(' ');
                s.chords=fChords.value; save(); drawSheet(); };
              return b;
            })));
      }

      /* --- audio --- */
      const audioBox = h('div');
      async function drawAudio(){
        audioBox.innerHTML='';
        const rec = await DB.getAudio(s.id).catch(()=>null);
        const input = h('input',{type:'file',accept:'audio/*',style:'display:none'});
        input.onchange=async()=>{ const f=input.files[0]; if(!f) return; await DB.putAudio(s.id,f,f.name); s.audioName=f.name; save(); drawAudio(); };
        if(rec && rec.blob){
          const url = URL.createObjectURL(rec.blob);
          const player = h('audio',{controls:true,src:url,preload:'metadata'});
          const rates = h('div',{class:'seg',role:'group','aria-label':'Tempo odsłuchu'});
          [0.5,0.75,1].forEach(r=>{ const b=h('button',{'aria-pressed':String(r===1)}, r===1?'normalnie':'×'+r); b.onclick=()=>{ player.playbackRate=r; player.preservesPitch=true; rates.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b))); }; rates.appendChild(b); });
          audioBox.append(h('div',{class:'hint'},'🎵 '+(rec.name||'nagranie')), player,
            h('div',{class:'row',style:'margin-top:8px'}, rates,
              h('label',{class:'btn small ghost'},'zmień plik',input),
              h('button',{class:'btn small ghost danger',onclick:async()=>{ if(confirm('Usunąć nagranie z tej piosenki?')){ await DB.delAudio(s.id); delete s.audioName; save(); drawAudio(); } }},'usuń nagranie')),
            h('div',{class:'hint',style:'margin-top:6px'},'Zwolnij nagranie (×0.5), żeby łatwiej wyłapać zmiany akordów.'));
        }else{
          audioBox.append(h('label',{class:'btn'},'⤒ Dodaj nagranie (mp3, m4a, wav…)',input),
            h('div',{class:'hint',style:'margin-top:6px'},'Plik zostaje tylko u Ciebie, w przeglądarce. Akordy wpisujesz ręcznie — słuchasz i dopasowujesz.'));
        }
      }

      main.append(
        h('div',{class:'card'},
          fTitle,
          h('div',{class:'grid2'},
            h('div',null,h('label',{class:'f'},'Wykonawca'),fArtist),
            h('div',null,h('label',{class:'f'},'Tonacja'),fKey)),
          h('div',{class:'grid2'},
            h('div',null,h('label',{class:'f'},'Tempo (uderzeń na minutę)'),fBpm),
            h('div',null,h('label',{class:'f'},'Jeden akord trwa'),fBeats))),
        h('section',{style:'margin-top:18px'},
          h('div',{class:'sechead'}, h('h2',null,'Akordy'), h('div',{class:'row'}, playAll, h('a',{class:'btn',href:'#druk/song/'+s.id},'🖨 Drukuj'))),
          h('div',{class:'card'}, sheet, analysis)),
        h('section',{style:'margin-top:18px'},
          h('h2',null,'Edytuj akordy'),
          fChords,
          h('div',{class:'hint',style:'margin-top:6px'},'Jak pisać: akordy oddzielone spacją · „|" = kreska taktowa · [Zwrotka] na początku linii = etykieta · przykłady: C  Am  F#m  Bb7  Gsus4  C/E'),
          h('div',{class:'card',style:'margin-top:12px'}, builder)),
        h('section',{style:'margin-top:18px'},
          h('h2',null,'Nagranie'), h('div',{class:'card'},audioBox)),
        h('section',{style:'margin-top:18px'},
          h('h2',null,'Notatki'), fNotes),
        h('div',{class:'row',style:'margin-top:22px'},
          h('button',{class:'btn danger',onclick:async()=>{ if(!confirm(`Usunąć „${s.title}"? Tego nie da się cofnąć.`)) return; await DB.delSong(s.id); songs=songs.filter(x=>x.id!==s.id); currentId=songs[0]&&songs[0].id; drawList(); drawSong(); }},'Usuń piosenkę'))
      );
      drawSheet(); drawBuilder(); drawAudio();
      if(focusTitle){ fTitle.focus(); fTitle.select(); }
    }

    drawList(); drawSong();
  }
};
