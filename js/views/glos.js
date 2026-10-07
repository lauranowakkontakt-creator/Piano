/* Zakładka „Głos" — emisja i emocje w głosie.
   Ćwiczenia emisyjne i ich kolejność: materiał „Emisja głosu" (oprac. Kamila Pałasz,
   Misja CSM). Przebiegi melodyczne to typowe wzory rozgrzewkowe — nauczycielka
   może używać innych, zasada jest ta sama. */

const VOICES = {
  sopran:{label:'sopran', start:60},
  alt:{label:'alt / mezzosopran', start:57},
  tenor:{label:'tenor', start:48},
  bas:{label:'baryton / bas', start:45},
};
// wzory: stopnie w półtonach od podstawy; d = długość nuty (w krokach)
const PAT = {
  p5:   {name:'1-2-3-4-5-4-3-2-1', iv:[0,2,4,5,7,5,4,2,0]},
  p3:   {name:'1-2-3-2-1',         iv:[0,2,4,2,0]},
  arp:  {name:'1-3-5-3-1',         iv:[0,4,7,4,0]},
  arp8: {name:'1-3-5-8-5-3-1',     iv:[0,4,7,12,7,4,0]},
  down: {name:'5-4-3-2-1 (z góry)',iv:[7,5,4,2,0]},
  siren:{name:'syrena 1-5-8-5-1',  iv:[0,7,12,7,0], legato:true},
  one:  {name:'jeden dźwięk',      iv:[0,0,0,0]},
};

const VOCAL_GROUPS = [
{ id:'rozluzniajace', title:'Rozluźniające', why:'Zdejmują napięcie z warg, języka i szczęki i uczą równego strumienia powietrza. Zawsze na początek.', items:[
  {id:'motorek', name:'Motorek', syl:'brrr', pat:'p5', how:'Parskaj wargami jak dziecko udające motor. Wargi zupełnie luźne — jeśli nie chcą wibrować, podeprzyj policzki palcami. Powietrze płynie równo, bez szarpania.', tip:'To ćwiczenie „półzamkniętej krtani" — opór na wargach odciąża struny głosowe.'},
  {id:'murmurando', name:'Murmurando', syl:'mmm', pat:'p3', how:'Mrucz na „mmm" z zamkniętymi ustami, zęby lekko rozsunięte, język luźno leży. Szukaj łaskotania na wargach i nosie („maska").', tip:'Im mniej wysiłku, tym lepiej. To ma być przyjemne.'},
]},
{ id:'glowowe', title:'Otwierające rejestr głowowy', why:'Budzą lekki, górny rejestr (głos głowowy) bez pchania. Dzięki temu wysokie dźwięki potem nie są krzykiem.', items:[
  {id:'lili', name:'łi łi łi', syl:'łi', pat:'down', how:'Lekko, jak piszcząca zabawka albo sowa. Zaczynaj z góry i schodź w dół. Nie dociskaj — mały, jasny dźwięk.', tip:'Jeśli głos się „łamie" — to dobrze, nie walcz, śpiewaj dalej lekko.'},
  {id:'bul', name:'bul bul bul', syl:'bul', pat:'arp', how:'Jak bulgotanie. Luźna szczęka, lekkie, krótkie dźwięki.', tip:'Szczęka opada sama, nie pracuje.'},
  {id:'rurka', name:'Ćwiczenia z rurką', syl:'łu łu / tu tu (przez słomkę)', pat:'siren', how:'Śpiewaj przez słomkę (najlepiej cienką). Najpierw syrena w górę i w dół, potem „łu łu" i „tu tu" na melodii. Całe powietrze idzie przez słomkę — policzki się nie nadymają.', tip:'Jedno z najlepiej zbadanych ćwiczeń dla głosu: wyrównuje rejestry i zmniejsza wysiłek strun.'},
]},
{ id:'waskie', title:'Wąskie (skupiony dźwięk)', why:'Samogłoski „u", „o", „i" i spółgłoski k/g/n/m uczą skupionego, lekkiego dźwięku i czystego początku nuty.', items:[
  {id:'ku', name:'ku ku', syl:'ku', pat:'arp', staccato:true, how:'Krótko, sprężyście (staccato), jak odbijająca się piłeczka. Brzuch lekko „podskakuje" przy każdej nucie.', tip:'Każda nuta zaczyna się czysto, bez przydechu i bez „twardego" uderzenia.'},
  {id:'gu', name:'gu gu', syl:'gu', pat:'arp', staccato:true, how:'Jak „ku ku", ale miękkiej — „g" jest dźwięczne.', tip:''},
  {id:'moj', name:'moj moj', syl:'moj', pat:'p5', how:'Legato, zaokrąglone usta na „o", „j" na końcu krótko.', tip:''},
  {id:'nol', name:'noł noł', syl:'noł', pat:'arp', how:'„n" z przodu w masce, potem okrągłe „o".', tip:''},
  {id:'nio', name:'nio nio', syl:'nio', pat:'p5', how:'Miękkie „ni", uśmiech w oczach, dźwięk z przodu.', tip:''},
  {id:'nla', name:'nła nła', syl:'nła', pat:'arp8', how:'„n" w masce, a potem otwierasz na „ła". Przejście z wąskiego do szerszego.', tip:''},
]},
{ id:'szerokie', title:'Szerokie (pełny dźwięk)', why:'Otwarte samogłoski „e", „a" dają pełniejszą barwę. Gardło otwarte jak na początku ziewnięcia — ale bez krzyczenia.', items:[
  {id:'nie', name:'nie nie', syl:'nie', pat:'arp', how:'Szeroko, jasno, z uśmiechem w policzkach.', tip:''},
  {id:'nej', name:'nej nej', syl:'nej', pat:'p5', how:'„e" szeroko, „j" na końcu lekko.', tip:''},
  {id:'maaa', name:'maaa', syl:'maaa', pat:'arp8', how:'Długie, legato, otwarte „a". Podniebienie w górze (jak przy ziewaniu), szczęka luźno w dół.', tip:'Pełnia dźwięku z oddechu i przestrzeni, nie z siły gardła.'},
]},
{ id:'dykcyjne', title:'Dykcyjne', why:'Język i wargi pracują szybko i dokładnie. Wyraźny tekst to połowa emocji — słuchacz musi rozumieć słowa.', items:[
  {id:'rrr', name:'rrrrr', syl:'rrrr', pat:'one', how:'Wibrujące „r" na jednym dźwięku, potem na syrenie. Język luźny za górnymi zębami.', tip:''},
  {id:'bra', name:'bra bre bri bro bru / tra tre tri tro tru', syl:'bra bre bri bro bru', pat:'p5', how:'Na każdą nutę jedna sylaba, wyraźne „r".', tip:''},
  {id:'toloto', name:'toloto', syl:'to-lo-to', pat:'arp', how:'Szybko i lekko, język pracuje, szczęka stoi.', tip:''},
  {id:'hosanna', name:'manna sanna hosanna sawanna', syl:'man-na san-na ho-san-na sa-wan-na', pat:'p5', how:'Lekko, rytmicznie, podwójne „n" wyraźnie.', tip:''},
  {id:'sabap', name:'sabap dupap diliadu', syl:'sa-bap du-pap di-li-a-du', pat:'p5', how:'Rytmicznie, jak jazzowy scat. Spółgłoski „p" i „d" krótkie i wyraźne.', tip:''},
  {id:'pulu', name:'pulu pulu', syl:'pu-lu pu-lu', pat:'p3', how:'Szybko, lekko, usta zaokrąglone.', tip:''},
]},
];
const ALL_VOCAL = VOCAL_GROUPS.flatMap(g=>g.items.map(it=>({...it, group:g.title})));

/* ---------- odtwarzacz drabinki (wzór coraz wyżej, potem w dół) ---------- */
const Ladder = {
  timers:[], running:false,
  stop(){ this.timers.forEach(clearTimeout); this.timers=[]; this.running=false; if(this.onStop) this.onStop(); this.onStop=null; },
  /* opts: {pat, start, steps, down, bpm, staccato, onStep(i,total,root)} */
  run(opts){
    this.stop(); audio();
    const pat = PAT[opts.pat];
    const step = 60/(opts.bpm||100);
    const noteDur = opts.staccato ? step*0.35 : (pat.legato ? step*1.9 : step*0.95);
    const noteStep = pat.legato ? step*1.8 : step;
    const up = [...Array(opts.steps).keys()];
    const seq = opts.down ? [...up, ...up.slice(0,-1).reverse()] : up;
    let t = 0;
    this.running = true;
    seq.forEach((s,i)=>{
      const root = opts.start + s;
      this.timers.push(setTimeout(()=>{
        if(!this.running) return;
        if(opts.onStep) opts.onStep(i, seq.length, root);
        strike([root%12,(root+4)%12,(root+7)%12], 0.9, 0);                // akord na wejście
        pat.iv.forEach((iv,k)=> tone(root+iv, noteDur, 0.75 + k*noteStep, 1.25));
      }, t*1000));
      t += 0.75 + pat.iv.length*noteStep + 0.6;   // + pauza na oddech
    });
    this.timers.push(setTimeout(()=>this.stop(), t*1000));
    return t;
  }
};
function midiName(m){ return fmt(PC_NAME_SHARP[m%12]) + (Math.floor(m/12)-1); }

function exerciseCard(it, getVoice){
  const status = h('div',{class:'hint',style:'min-height:1.3em'});
  const btn = h('button',{class:'btn small primary'},'▶ ćwicz ze mną');
  const one = h('button',{class:'btn small'},'posłuchaj wzoru');
  btn.onclick=()=>{
    if(Ladder.running && btn.dataset.on){ Ladder.stop(); return; }
    const v = getVoice();
    btn.dataset.on='1'; btn.textContent='■ stop';
    Ladder.onStop=()=>{ delete btn.dataset.on; btn.textContent='▶ ćwicz ze mną'; status.textContent=''; };
    Ladder.run({pat:it.pat, start:v.start, steps:v.steps, down:true, bpm:v.bpm, staccato:it.staccato,
      onStep:(i,n,root)=>{ status.innerHTML = `krok ${i+1}/${n} · start od <b>${midiName(root)}</b> · śpiewaj: <b>${esc(it.syl)}</b>`; }});
  };
  one.onclick=()=>{ const v=getVoice(); Ladder.run({pat:it.pat,start:v.start,steps:1,bpm:v.bpm,staccato:it.staccato}); };
  return h('div',{class:'card'},
    h('div',{class:'row',style:'justify-content:space-between'}, h('b',{style:'font-family:Fraunces,serif;font-size:1.15rem'},it.name), h('span',{class:'tag'},PAT[it.pat].name)),
    h('p',{style:'margin:6px 0',class:'muted'}, it.how),
    it.tip ? h('p',{class:'hint',style:'margin:0 0 8px'},'💡 '+it.tip) : null,
    h('div',{class:'row'}, btn, one), status);
}

/* ---------- nagrywanie się ---------- */
function recorderWidget(){
  const box = h('div',{class:'card'});
  const takes = h('div',{style:'display:flex;flex-direction:column;gap:8px;margin-top:10px'});
  const st = h('span',{class:'hint'});
  const label = h('input',{placeholder:'podpis nagrania, np. „refren — radość"',style:'max-width:360px'});
  const rec = h('button',{class:'btn primary'},'● Nagraj');
  let mr=null, chunks=[], stream=null, t0=0, tick=null;
  rec.onclick=async()=>{
    if(mr && mr.state==='recording'){ mr.stop(); return; }
    try{
      stream = await navigator.mediaDevices.getUserMedia({audio:true});
    }catch(e){ st.textContent='Brak dostępu do mikrofonu. Zezwól przeglądarce na mikrofon (ikonka przy adresie) albo otwórz appkę z pliku index.html.'; return; }
    chunks=[]; mr = new MediaRecorder(stream);
    mr.ondataavailable=e=>chunks.push(e.data);
    mr.onstop=()=>{
      clearInterval(tick); stream.getTracks().forEach(t=>t.stop());
      const blob=new Blob(chunks,{type:mr.mimeType||'audio/webm'}); const url=URL.createObjectURL(blob);
      const name = label.value.trim() || ('nagranie '+(takes.children.length+1));
      takes.prepend(h('div',{class:'row',style:'gap:10px'}, h('b',{style:'min-width:140px;font-size:.9rem'},name), h('audio',{controls:true,src:url,style:'flex:1;min-width:200px;margin:0'}),
        h('a',{class:'btn small ghost',href:url,download:name.replace(/[^\wąćęłńóśźż -]/gi,'_')+'.webm'},'⤓ pobierz')));
      rec.textContent='● Nagraj'; st.textContent='Posłuchaj i porównaj z poprzednim nagraniem.'; label.value='';
    };
    mr.start(); t0=Date.now(); rec.textContent='■ Stop';
    tick=setInterval(()=>{ st.textContent='nagrywam… '+Math.round((Date.now()-t0)/1000)+' s'; },300);
  };
  box.append(h('h3',{style:'margin-top:0'},'🎙 Nagraj się i porównaj'),
    h('p',{class:'muted',style:'margin:0 0 10px;font-size:.92rem'},'Nagraj tę samą frazę z dwiema różnymi emocjami i posłuchaj ich po kolei. Ucho słyszy siebie inaczej z zewnątrz — nagranie to najlepszy nauczyciel. Nagrania znikają po zamknięciu strony (chyba że je pobierzesz).'),
    h('div',{class:'row'}, label, rec, st), takes);
  return box;
}

/* ---------- messa di voce: jeden dźwięk cicho → głośno → cicho ---------- */
function messaWidget(getVoice){
  const bar = h('div',{style:'height:18px;border-radius:9px;background:linear-gradient(90deg,var(--sub),var(--tonic));width:4%;transition:none'});
  const lbl = h('div',{class:'hint',style:'margin-top:6px'},'Kliknij start. Pasek pokazuje głośność: rośnie przez 4 liczenia, maleje przez 4.');
  const btn = h('button',{class:'btn primary'},'▶ start');
  let raf=null;
  btn.onclick=()=>{
    audio();
    const v=getVoice(); const note=v.start+4; const bpm=60; const total=8*60/bpm;
    tone(note, 1.2, 0, 1.2);
    for(let i=0;i<8;i++) playClick(i*60/bpm + 1.2, i===0||i===4);
    const t0=performance.now()+1200;
    cancelAnimationFrame(raf);
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const f=()=>{
      const t=(performance.now()-t0)/1000;
      if(t<0){ raf=requestAnimationFrame(f); lbl.textContent=`Weź oddech… dźwięk: ${midiName(note)} na „a"`; return; }
      if(t>total){ bar.style.width='4%'; lbl.textContent='Koniec. Czy głos był równy, bez „dziury" przy przejściu z głośno na cicho?'; return; }
      const x = t<total/2 ? t/(total/2) : 1-(t-total/2)/(total/2);
      bar.style.width = (reduce? (x>0.5?100:30) : 4+x*96)+'%';
      lbl.textContent = t<total/2 ? `crescendo — głośniej… ${Math.floor(t)+1}` : `decrescendo — ciszej… ${Math.floor(t)+1}`;
      raf=requestAnimationFrame(f);
    };
    f();
  };
  return h('div',{class:'card'}, h('div',{class:'row'},btn), h('div',{style:'margin-top:12px;background:var(--bg2);border-radius:9px;border:1px solid var(--line)'},bar), lbl);
}

const EMOTIONS = [
  {name:'Czułość, bliskość', c:'t', dyn:'cicho (p)', barwa:'ciepła, ciemniejsza', oddech:'trochę powietrza w dźwięku', tempo:'bez pośpiechu, legato', art:'miękkie spółgłoski', cialo:'rozluźniona twarz, jakbyś mówiła do jednej osoby'},
  {name:'Radość', c:'d', dyn:'średnio-głośno (mf)', barwa:'jasna — uśmiech w policzkach i oczach', oddech:'pełny, czysty dźwięk', tempo:'lekko „do przodu", sprężyście', art:'wyraźne, żywe spółgłoski', cialo:'uniesione policzki, otwarta klatka'},
  {name:'Tęsknota, smutek', c:'s', dyn:'cicho do średnio', barwa:'ciemniejsza (jak na „u")', oddech:'może być trochę powietrza', tempo:'wolniej, końcówki fraz opadają', art:'miękko, przeciągnięte samogłoski', cialo:'cięższe, spokojne ciało'},
  {name:'Siła, pewność', c:'d', dyn:'głośno (f) — ale na podparciu, nie krzyk', barwa:'pełna, „metaliczna"', oddech:'bez powietrza, zwarty dźwięk', tempo:'równo, na bicie', art:'mocne, wyraźne spółgłoski, akcenty', cialo:'stabilne stopy, wyprostowana postawa'},
  {name:'Zachwyt, uwielbienie', c:'t', dyn:'rośnie w frazie (crescendo)', barwa:'otwarta, szeroka', oddech:'głęboki oddech przed kulminacją', tempo:'długie nuty trzymane do końca', art:'otwarte samogłoski, legato', cialo:'podniesiony wzrok, otwarte ramiona'},
  {name:'Spokój, pokój', c:'s', dyn:'cicho, równo', barwa:'miękka', oddech:'spokojny, długi wydech', tempo:'równe legato', art:'łagodnie', cialo:'rozluźnione barki, wolny oddech'},
];

const GLOS_PAGES = [
  {id:'rozgrzewka', title:'Rozgrzewka krok po kroku'},
  {id:'emisja', title:'Ćwiczenia emisyjne (wszystkie)'},
  {id:'emocje', title:'Emocje w głosie'},
  {id:'piosenki', title:'Emocje w Twoich piosenkach'},
];

const ViewGlos = {
  title:'Głos',
  render(root, sub){
    const page = GLOS_PAGES.find(p=>p.id===sub) ? sub : prefs.get('glos.last','rozgrzewka');
    prefs.set('glos.last',page);
    let voice = prefs.get('glos.voice','sopran');
    let bpm = prefs.get('glos.bpm',100);
    let steps = prefs.get('glos.steps',5);
    const getVoice=()=>({start:VOICES[voice].start, bpm, steps});

    const nav = h('nav',{class:'lesson-nav','aria-label':'Głos'});
    GLOS_PAGES.forEach((p,i)=>{ const b=h('button',{'aria-current':String(p.id===page)},h('span',{class:'n'},String(i+1)),p.title); b.onclick=()=>location.hash='#glos/'+p.id; nav.append(b); });
    const main = h('article',{class:'lesson'});

    const vsel = h('select',{style:'width:auto'}, ...Object.entries(VOICES).map(([k,v])=>h('option',{value:k,selected:k===voice},v.label)));
    vsel.onchange=()=>{ voice=vsel.value; prefs.set('glos.voice',voice); upd(); };
    const tsel = h('select',{style:'width:auto'}, ...[[80,'wolno'],[100,'średnio'],[120,'szybciej']].map(([v,l])=>h('option',{value:v,selected:v==bpm},l)));
    tsel.onchange=()=>{ bpm=+tsel.value; prefs.set('glos.bpm',bpm); };
    const ssel = h('select',{style:'width:auto'}, ...[3,5,7].map(n=>h('option',{value:n,selected:n==steps},n+' kroków w górę')));
    ssel.onchange=()=>{ steps=+ssel.value; prefs.set('glos.steps',steps); upd(); };
    const range = h('span',{class:'hint'});
    const upd=()=>{ const s=VOICES[voice].start; range.innerHTML=`zakres: od <b>${midiName(s)}</b> do ok. <b>${midiName(s+(steps-1)+12)}</b>`; };
    upd();

    root.append(
      h('header',{style:'margin-bottom:18px'},
        h('p',{class:'kicker'},'emisja i emocje'),
        h('h1',null,'Twój ', h('em',null,'głos')),
        h('p',{class:'lead'},'Rozgrzewka z akompaniamentem, który sam idzie w górę i w dół, ćwiczenia emisyjne i ćwiczenia na emocje w głosie. Pianino gra akord i wzór — Ty śpiewasz razem albo zaraz po nim.')),
      h('div',{class:'card no-print',style:'margin-bottom:22px'},
        h('div',{class:'row'}, h('span',{class:'muted',style:'font-size:.9rem'},'mój głos:'), vsel, tsel, ssel, range),
        h('p',{class:'hint',style:'margin:8px 0 0'},'Nie wiesz, jaki masz głos? Większość kobiet zaczyna od „alt/mezzosopran" albo „sopran". Jeśli najwyższe kroki są męczące — zmniejsz liczbę kroków. Nigdy nie śpiewaj przez ból czy chrypkę.')),
      h('div',{class:'lesson-layout'}, nav, main));

    if(page==='rozgrzewka') renderRozgrzewka(main, getVoice);
    else if(page==='emisja') renderEmisja(main, getVoice);
    else if(page==='emocje') renderEmocje(main, getVoice);
    else renderGlosPiosenki(main);
  }
};

function renderRozgrzewka(main, getVoice){
  const plan = ['motorek','murmurando','rurka','lili','ku','nio','maaa','bra','hosanna'];
  const items = plan.map(id=>ALL_VOCAL.find(x=>x.id===id));
  let idx = 0;
  const cur = h('div');
  const prog = h('div',{class:'seq',style:'margin:0 0 14px'});
  function draw(){
    prog.innerHTML='';
    items.forEach((it,i)=>{ const b=h('b',{class:i<idx?'s':i===idx?'t':'',style:'cursor:pointer'},it.name); b.onclick=()=>{ Ladder.stop(); idx=i; draw(); }; prog.append(b); });
    cur.innerHTML='';
    const it = items[idx];
    cur.append(h('p',{class:'hint',style:'margin:0 0 6px'},`ćwiczenie ${idx+1} z ${items.length} · ${it.group}`), exerciseCard(it,getVoice),
      h('div',{class:'lesson-foot'},
        idx>0? h('button',{class:'btn',onclick:()=>{ Ladder.stop(); idx--; draw(); }},'← poprzednie') : h('span'),
        idx<items.length-1 ? h('button',{class:'btn primary',onclick:()=>{ Ladder.stop(); idx++; draw(); }},'następne →') :
          h('a',{class:'btn primary',href:'#glos/emocje'},'Gotowe! Teraz emocje →')));
  }
  main.append(
    h('h2',null,'Rozgrzewka: 9 ćwiczeń, ok. 10 minut'),
    h('p',null,'Kolejność jest ważna: najpierw ', h('b',null,'rozluźnienie'),', potem ', h('b',null,'lekki głos głowowy'),', potem ', h('b',null,'wąskie'),', ', h('b',null,'szerokie'),' i na koniec ', h('b',null,'dykcja'),'. Każde ćwiczenie: pianino gra akord (żebyś złapała dźwięk) i wzór, potem pauza na oddech i to samo pół tonu wyżej. Na górze zawraca w dół.'),
    h('div',{class:'box tip'}, h('p',null,'Stój stabilnie, kolana nie zablokowane, barki luźno. Oddech nisko — brzuch i boki się rozszerzają, barki się nie podnoszą. Pij wodę.')),
    prog, cur);
  draw();
}

function renderEmisja(main, getVoice){
  main.append(h('h2',null,'Ćwiczenia emisyjne'),
    h('p',null,'Ćwiczenia emisyjne nie tylko rozgrzewają — ', h('b',null,'ustawiają głos'),' (struny, krtań, przepływ powietrza) do prawidłowego wydobywania dźwięku. Nie każde pasuje każdemu, dlatego jest ich więcej — wybierz swoje ulubione z każdej grupy.'),
    h('p',{class:'hint'},'Ćwiczenia i ich kolejność: „Emisja głosu", oprac. Kamila Pałasz (Misja CSM). Przebiegi melodii to typowe wzory — nauczyciel może używać innych.'));
  VOCAL_GROUPS.forEach((g,gi)=>{
    main.append(h('h3',null,`${gi+1}. ${g.title}`), h('p',{class:'muted',style:'margin-top:0'},g.why));
    g.items.forEach(it=>{ const c=exerciseCard({...it,group:g.title},getVoice); c.style.marginTop='10px'; main.append(c); });
  });
}

function renderEmocje(main, getVoice){
  main.innerHTML = `
<h2>Emocje w głosie: 6 pokręteł</h2>
<p>Emocja w śpiewie to nie „czucie mocniej", tylko <b>konkretne zmiany w dźwięku</b>, które słuchacz odbiera jako emocję. Masz do dyspozycji sześć pokręteł:</p>
<ol>
<li><b>Głośność (dynamika)</b> — od szeptu do pełnego głosu. Najważniejsza jest <i>zmiana</i> głośności, nie sama głośność.</li>
<li><b>Barwa</b> — jasna (jak na „i", z uśmiechem) albo ciemna (jak na „u", jak przy ziewaniu).</li>
<li><b>Oddech w dźwięku</b> — czysty, zwarty dźwięk albo z odrobiną powietrza (intymny).</li>
<li><b>Czas</b> — śpiewanie lekko przed bitem (energia), za bitem (luz, tęsknota), trzymanie nut do końca albo ucinanie.</li>
<li><b>Artykulacja</b> — miękkie albo wyraziste spółgłoski, legato (łączenie) albo staccato.</li>
<li><b>Kształt frazy</b> — gdzie fraza rośnie, gdzie jest najważniejsze słowo, gdzie opada. Gdzie bierzesz oddech.</li>
</ol>
<div class="box why"><p><b>Harmonia i emocja idą razem.</b> Tonika to spokój, dominanta to napięcie. W głosie: rośnij (crescendo) w stronę dominanty, rozluźnij się, kiedy harmonia wraca do domu. Posłuchaj poniżej — to samo działa w Twoich piosenkach.</p></div>
<div data-w="emo-table"></div>
<h3>Ćwiczenie 1 · Messa di voce — jeden dźwięk, cicho → głośno → cicho</h3>
<p>Klasyczne ćwiczenie na panowanie nad dynamiką. Na „a", jednym oddechem. Głos ma rosnąć równo, bez skoku, i tak samo równo maleć. To podstawa każdego „budowania" emocji w piosence.</p>
<div data-w="messa"></div>
<h3>Ćwiczenie 2 · Jedno zdanie, pięć emocji</h3>
<p>Weź proste zdanie: <b>„Jestem tutaj, z Tobą"</b>. Powiedz je, potem zaśpiewaj na jednym dźwięku, potem na melodii 1-2-3-2-1 — za każdym razem z inną emocją z tabeli. Zmieniaj tylko pokrętła, nie słowa. Nagraj dwie wersje i porównaj.</p>
<p><button class="btn small" data-play="p3">▶ melodia 1-2-3-2-1</button></p>
<h3>Ćwiczenie 3 · Jasno — ciemno</h3>
<p>Na jednym dźwięku przejdź płynnie z „i" do „u" (i-e-a-o-u). Słyszysz, jak barwa ciemnieje? Teraz zaśpiewaj „maaa" <b>jasno</b> (uśmiech w policzkach) i <b>ciemno</b> (podniebienie w górze, jak ziewnięcie). Te same nuty, dwie różne emocje.</p>
<p><button class="btn small" data-play="one">▶ dźwięk</button></p>
<h3>Ćwiczenie 4 · Napięcie i rozluźnienie z harmonią</h3>
<p>Pianino zagra wolno T → S → D → T. Śpiewaj <b>jeden, ten sam dźwięk</b> (dom) na „a" przez wszystkie cztery akordy. Na <span class="d-c">dominancie</span> daj więcej energii (głośniej, jaśniej), na powrocie do <span class="t-c">toniki</span> — odpuść, zmiękcz. Poczujesz, jak harmonia „prowadzi" emocję.</p>
<p><button class="btn small" data-harm="1">▶ T → S → D → T (wolno)</button></p>
<h3>Ćwiczenie 5 · Kształt frazy</h3>
<p>Weź jedną linię z refrenu swojej piosenki. Znajdź <b>najważniejsze słowo</b> (zwykle na najdłuższej albo najwyższej nucie). Zaśpiewaj tak, żeby fraza <b>rosła do tego słowa</b> i <b>łagodnie opadała</b> po nim. Potem źle: równo, bez kształtu. Różnica jest ogromna.</p>
<div data-w="rec"></div>
<div class="box tip"><p>Emocja = kontrast. Jeśli cała piosenka jest głośna, nic nie jest głośne. Zostaw sobie miejsce: zwrotka ciszej, refren pełniej, bridge buduje, outro wycisza.</p></div>`;
  const t = main.querySelector('[data-w="emo-table"]');
  const tbl = h('div',{class:'card',style:'overflow-x:auto'});
  tbl.innerHTML = '<table style="width:100%;border-collapse:collapse;font-size:.88rem;min-width:640px"><tr>'+['emocja','głośność','barwa','oddech','czas','artykulacja','ciało'].map(x=>`<th style="text-align:left;padding:6px;color:var(--faint);font-weight:500">${x}</th>`).join('')+'</tr>'+
    EMOTIONS.map(e=>`<tr style="border-top:1px solid var(--line)"><td style="padding:6px" class="${e.c}-c"><b>${e.name}</b></td><td style="padding:6px">${e.dyn}</td><td style="padding:6px">${e.barwa}</td><td style="padding:6px">${e.oddech}</td><td style="padding:6px">${e.tempo}</td><td style="padding:6px">${e.art}</td><td style="padding:6px">${e.cialo}</td></tr>`).join('')+'</table>';
  t.replaceWith(tbl);
  main.querySelector('[data-w="messa"]').replaceWith(messaWidget(getVoice));
  main.querySelector('[data-w="rec"]').replaceWith(recorderWidget());
  main.querySelectorAll('[data-play]').forEach(b=>b.onclick=()=>{ const v=getVoice(); Ladder.run({pat:b.dataset.play,start:v.start+2,steps:1,bpm:80}); });
  main.querySelectorAll('[data-harm]').forEach(b=>b.onclick=()=>{
    const v=getVoice(); const r=v.start%12;
    const names = PC_NAME_SHARP;
    const ch = [0,5,7,0].map((iv,i)=>{ const q = parseChord(names[(r+iv)%12]); return {pcs:q.pcs}; });
    playChordSeq(ch, 2.4);
    setTimeout(()=>padTone(v.start+12, 9.4, 0, .9), 0);
  });
}

function renderGlosPiosenki(main){
  main.append(h('h2',null,'Emocje w Twoich piosenkach'),
    h('p',null,'Każda piosenka ma swoją „mapę emocji": gdzie ciszej, gdzie budujesz, gdzie kulminacja. Plan jest w notatkach piosenki — obok akordów, żebyś widziała harmonię i emocję razem.'));
  SEED_SONGS.forEach(s=>{
    const plan = (s.notes.split('EMOCJE W GŁOSIE (plan):')[1]||'').split('\n\nTekst:')[0].trim();
    main.append(h('div',{class:'card',style:'margin-top:12px'},
      h('div',{class:'row',style:'justify-content:space-between'}, h('b',{style:'font-family:Fraunces,serif;font-size:1.2rem'},s.title), h('span',{class:'hint'},keyNameLabel(s.key)+' · '+s.bpm+' BPM')),
      h('div',{style:'white-space:pre-wrap;margin-top:8px;color:var(--text);font-size:.92rem'},plan),
      h('div',{class:'row',style:'margin-top:10px'}, h('a',{class:'btn small primary',href:'#piosenki/'+s.id},'Otwórz piosenkę →'))));
  });
  main.append(h('div',{class:'box try'}, h('p',null,'Dodałaś swoją piosenkę? Dopisz w jej notatkach własną mapę emocji: dla każdej części (zwrotka, refren, bridge) jedna emocja i jedno pokrętło, które zmieniasz.')));
}
