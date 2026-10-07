/* Zakładka „Piosenki" — własne utwory: akordy, tonacja, notatki, audio.
   Dane w IndexedDB (u Ciebie w przeglądarce). */

/* SONG_KEYS i keyNameLabel są w js/theory.js — korzysta z nich też Pętla i Przejścia. */

/* Piosenka z pliku kopii: bierzemy tylko znane pola i właściwe typy.
   Zła tonacja → C (inaczej coś by się wysypało albo pokazało obcy tekst jako HTML). */
function sanitizeSong(raw){
  if(!raw || typeof raw!=='object' || Array.isArray(raw)) return null;
  const id = typeof raw.id==='string' || typeof raw.id==='number' ? String(raw.id).trim() : '';
  if(!id) return null;
  const str = v => typeof v==='string' ? v : '';
  const num = (v,min,max,d) => { const n=Number(v); return Number.isFinite(n) && n>=min && n<=max ? n : d; };
  const key = SONG_KEYS.some(k=>k.v===raw.key) ? raw.key : 'C';
  const out = {id, title:str(raw.title), artist:str(raw.artist), key,
    bpm:num(raw.bpm,20,300,90), beats:num(raw.beats,1,16,4), chords:str(raw.chords),
    lyrics:str(raw.lyrics), notes:str(raw.notes)};
  if(typeof raw.audioName==='string') out.audioName = raw.audioName;
  if(Number.isFinite(raw.updated)) out.updated = raw.updated;
  return out;
}

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


/* Piosenki Laury — akordy z jej PDF-ów i z angielskich wersji,
   tekst po polsku z akordami nad słowami. */
const SEED_SONGS = [
{ id:'seed-kotek', title:'Wlazł kotek na płotek', artist:'ludowa', key:'C', bpm:104, beats:2,
  chords:`[Zwrotka] C G7 C | C G7 C
[Refren] F C G7 C | C G7 C`,
  lyrics:`[Zwrotka]
[C]Wlazł kotek na [G7]płotek i [C]mruga,
[C]ładna to [G7]piosenka, nie[C]długa.

[Refren]
Nie [F]długa, nie [C]krótka, lecz [G7]w sam [C]raz,
[C]zaśpiewaj [G7]koteczku jeszcze [C]raz.`,
  notes:`Przykład, jak działa tekst z akordami: akord w nawiasie kwadratowym staje nad następną sylabą.
Trzy akordy — C, F i G7 — i cała piosenka. Dobra na pierwszy raz: lewa ręka sam bas, prawa akord.
Możesz ją spokojnie usunąć, kiedy nie będzie już potrzebna.`},
{ id:'seed-widze-dom', title:'Widzę dom', artist:'K. Kukier, O. Juraszus, Z. Muzalewska', key:'D', bpm:76, beats:2,
  chords:`[Intro] Bm7 Asus4 A | G | Bm7 Asus4 A | G
[Zwrotka — 1. linia] D G/D D Bm7 A Gadd4
[Zwrotka — 2. linia] D G/D D Bm7 A Gadd4
[Tag] Bm7 A Gadd4
[Refren] D G/D D Bm7 | Em7 G | D | Dsus4 D
[Interludium] D | G/D | D
[Instrumental] D | D | Em7 | Em7 | Gsus2 | Gsus2 | D | D
[Bridge 1] D Em7 G D
[Bridge 2] D Em7 G D
[Bridge 2 — powtórka, bas w górę] D/A Em7/B G D
[Refren — ostatni] D G/D D Bm7 | Em7 G Bm7 A
[Outro] Em7 G D`,
  notes:`Tonacja D-dur · metrum 6/8 · 76 BPM (liczymy „RAZ dwa trzy CZTE-ry pięć sześć", akcent na 1 i 4).
Jeden akord w appce = 2 uderzenia (jeden takt 6/8).

KOLEJNOŚĆ: Intro → Zwrotka → Tag → Refren → Interludium → Zwrotka → Tag → Refren → Instrumental → Bridge 1 → Bridge 2 ×2 → Refren (ostatni) → Outro.

HARMONIA (zobacz kolory): cała piosenka stoi na akordach D-dur: D (I, dom), G (IV, ruch), Em7 (ii, ruch), Bm7 (vi, dom smutniejszy), A (V, napięcie).
• Asus4 → A w intro: „zawieszone" napięcie, które się rozwiązuje — zagraj powoli i posłuchaj.
• G/D = akord G z D w basie: lewa ręka zostaje na D, zmienia się tylko prawa. Brzmi jak „oddech" w domu.
• Refren kończy się Dsus4 → D: mały „amen" na koniec.
• Bridge 2 powtórka: bas idzie w górę D/A → Em7/B — ta sama harmonia, ale czuć wznoszenie. Idealne miejsce na crescendo.

EMOCJE W GŁOSIE (plan):
• Zwrotka — spokojna opowieść, jak do jednej osoby. Ciszej, ciepło, legato, trochę powietrza w głosie.
• Tag — lekkie zmęczenie, wspomnienie trudu: ciemniejsza barwa, wolniej końcówki fraz.
• Refren — radość i pewność: pełniejszy głos na podparciu (nie krzyk), jaśniejsza barwa, wyraźne spółgłoski, lekko do przodu w rytmie.
• Bridge 1 — odwaga, deklaracja: rytmicznie, zdecydowanie, prosty dźwięk bez vibrato.
• Bridge 2 — wdzięczność, która rośnie: 1. raz ciszej i miękko, 2. raz pełniej (crescendo przez całą frazę).
• Outro — wyciszenie, pokój: decrescendo, ostatni dźwięk trzymaj i puszczaj powoli.

Tekst: dołącz swój PDF w sekcji „Tekst i nuty (PDF)" niżej.`},
{ id:'seed-blizej', title:'Bliżej (Closer)', artist:'Bethel Music · tł. Winnica Worship', key:'E', bpm:70, beats:4,
  chords:`[Intro] A B C#m B | A B C#m B
[Zwrotka] C#m B E/G# A | C#m B E/G# A
[Refren] E B/D# C#m A E | B/D# C#m A
[Interludium] F#m E/G# A | F#m E/G# A
[Bridge] A E B C#m | A E B C#m`,
  lyrics:`[Intro — 2×]
[A] [B] [C#m] [B]

[Zwrotka]
[C#m]Twa miłość zdobyła [B]mnie
I całe me [E/G#]serce, całe me [A]serce
[C#m]Dziś to, czego pragnę, to [B]być
Z Tobą na [E/G#]zawsze, z Tobą na [A]zawsze

[Refren 1]
[E]Przyciągnij mnie do [B/D#]siebie
Zabierz trochę [C#m]głębiej
Pragnę poznać [A]Cię
Poznać serce [E]Twe

Wiem, miłość Twa jest [B/D#]słodsza,
Niż miłość tego [C#m]świata
Pragnę poznać [A]Cię
Poznać serce Twe

[Interludium — 2×]
[F#m] [E/G#] [A]

[Bridge]
[A]Ooo [E]ooo,
[B]Jak wielka jest Twa [C#m]miłość
[A]Ooo [E]ooo,
[B]Cudowna [C#m]miłość

[Refren 2]
[E]Przyciągnij mnie do [B/D#]siebie
Zabierz trochę [C#m]głębiej
Pragnę poznać [A]Cię
Poznać serce [E]Twe

Twa miłość jest [B/D#]silniejsza,
Niż wszystko, z czym się [C#m]zmagam
Pragnę poznać [A]Cię
Poznać serce [E]Twe`,
  notes:`Tekst: tłumaczenie Winnica Worship (oryginał: Bethel Music). Akordy przeniesione z angielskiej wersji — każdy stoi nad tym słowem, nad którym był w oryginale.
Tonacja E-dur · 4/4 · ok. 70 BPM.

KOLEJNOŚĆ: Intro ×2 → Zwrotka → Refren 1 → Interludium ×2 → Bridge (×2 lub więcej) → Refren 2.

HARMONIA: E (I, dom), A (IV, ruch), B i B/D# (V, napięcie), C#m (vi, dom smutniejszy), F#m (ii, ruch).
• Zwrotka startuje od C#m, nie od E — dlatego brzmi tęsknie. E pojawia się dopiero jako E/G#.
• Bas w zwrotce idzie schodkami: C# → B → G# → A.
• B/D# w refrenie: bas schodzi E → D# → C# — miękkie zejście, prawie jak westchnienie.
• Interludium F#m → E/G# → A: bas w górę F# → G# → A, jak wchodzenie coraz bliżej.

EMOCJE W GŁOSIE (plan):
• Zwrotka — intymnie, blisko: cicho, miękko, trochę powietrza.
• Refren — prośba i tęsknota: fraza rośnie do środka i łagodnie opada.
• Bridge („Ooo") — kulminacja: pełny głos na podparciu, szeroko otwarte „o", potem wyciszenie.`},
{ id:'seed-lean-back', title:'Wtulę się (Lean Back)', artist:'Jesus Culture · tł. Winnica Worship', key:'B', bpm:70, beats:4,
  chords:`[Intro] B D#m7 C#sus | B D#m7 C#sus
[Zwrotka] B D#m7 C#sus | B D#m7 C#sus | B D#m7 C#sus F#/A# | B D#m7 C#sus
[Refren] B F# C#sus | G#m F#/A# B D#m7 C#sus
[Instrumental] C# D#m7 B F# | C# D#m7 B F#
[Bridge] C# D#m7 B F# | C# D#m7 B C#`,
  lyrics:`[Intro — 2×]
[B] [D#m7] [C#sus] [B] [D#m7] [C#sus]

[Zwrotka 1]
Nie o[B]puścisz [D#m7]mnie [C#sus]
[B]Trzymasz [D#m7]życie [C#sus]me
U[B]kochałeś [D#m7]mnie, nim [C#sus]poznałem [F#/A#]Cię [B] [D#m7] [C#sus]

[Zwrotka 2]
W [B]Tobie wy[D#m7]ciszam [C#sus]się
Bio[B]rę głę[D#m7]boki [C#sus]wdech
[B]Będę pewnie [D#m7]stał, [C#sus]aż wypeł[F#/A#]nisz mnie [B] [D#m7] [C#sus]

[Refren]
W [B]Twe ramiona [F#]znowu wtulę [C#sus]się
[G#m]Mój u[F#/A#]kochany [B]Tato [D#m7] [C#sus]
[B]Jesteś [F#]dobry dla [C#sus]mnie
[G#m]Kochasz [F#/A#]jak nikt [B]inny [D#m7] [C#sus]

[Powtórz zwrotki i refren]

[Instrumental — 2×]
[C#] [D#m7] [B] [F#]

[Bridge — 2×]
Teraz już [C#]wiem
Twoja miłość jest [D#m7]lepsza
Niż każda [B]inna, którą [F#]znam
Biorę więc [C#]wdech Twojej [D#m7]dobroci
Wielkiej [B]miłości do [C#]mnie

[Refren — 3×]`,
  notes:`Tekst: tłumaczenie Winnica Worship (oryginał: Jesus Culture / Chris McClarney). Akordy z angielskiej wersji, przeniesione nad odpowiednie słowa.
Tonacja H-dur (w appce B) · 4/4 · tempo wolne, ok. 70 BPM — sprawdź z nagraniem.

KOLEJNOŚĆ: Intro ×2 → Zwrotka 1 → Zwrotka 2 → Refren → Zwrotka 1 → Zwrotka 2 → Refren → Instrumental ×2 → Bridge ×2 (i jeszcze raz) → Refren ×3.

HARMONIA: B (I, dom), F# (V, napięcie), G#m (vi, dom smutniejszy), D#m7 (iii, miękki łącznik), C#sus (ii bez tercji — zawieszony, „otwarty").
• Refren to klasyka: I – V – ii – vi – V/3 – I. F#/A# to F# z A# w basie: bas idzie schodkami G# → A# → B i ląduje w domu na „Tato" i „inny".
• Zwrotka B → D#m7 → C#sus kręci się wokół domu i nie ląduje — jak spokojny oddech.
• Bridge: C# → D#m7 → B → F#. C#-dur nie należy do H-dur (tam jest C#m) — to „pożyczony" akord, dominanta do F#. Dlatego bridge brzmi jaśniej i bardziej do przodu.
• Appka może podpowiadać inną tonację, bo zwrotka kończy się na C#sus, a bridge na C#. Dom tej piosenki to jednak B.`},
];

/* Piosenki startowe — dodaj raz (nie wracają, jeśli je usuniesz). Dopisuje je też do tablicy songs. */
async function seedSongs(songs){
  const done = prefs.get('songs.seedIds',[]);
  for(const seed of SEED_SONGS){
    if(done.includes(seed.id)) continue;
    if(!songs.find(x=>x.id===seed.id)){ const s={...seed}; await DB.putSong(s); songs.unshift(s); }
    done.push(seed.id);
  }
  prefs.set('songs.seedIds',done);
  // piosenka startowa dodana wcześniej bez tekstu — dopisz tekst raz (reszty nie ruszamy)
  const withLyrics = prefs.get('songs.seedLyrics',[]);
  for(const seed of SEED_SONGS){
    if(!seed.lyrics || withLyrics.includes(seed.id)) continue;
    const s = songs.find(x=>x.id===seed.id);
    if(s && !(s.lyrics||'').trim()){ s.lyrics = seed.lyrics; await DB.putSong(s); }
    withLyrics.push(seed.id);
  }
  prefs.set('songs.seedLyrics',withLyrics);
  return songs;
}

const ViewPiosenki = {
  title:'Piosenki',
  async render(root, sub){
    root.append(
      h('header',{style:'margin-bottom:22px'},
        h('p',{class:'kicker'},'Twoje utwory'),
        h('h1',null,'Piosenki ', h('em',null,'rozebrane na części')),
        h('p',{class:'lead'},'Tekst z akordami nad słowami. Appka pokaże rolę każdego akordu w tonacji, zagra je i pomoże zgadnąć tonację. Wszystko zapisuje się w tej przeglądarce.')));

    let songs;
    try{ songs = await DB.allSongs(); }
    catch(e){
      root.append(h('div',{class:'card'},h('p',null,'Ta przeglądarka nie pozwala zapisywać danych (IndexedDB). Otwórz appkę w Chrome, Edge albo Firefox. Jeśli otwierasz plik bezpośrednio z dysku w Safari — uruchom ją przez start (patrz README).')));
      return;
    }
    await seedSongs(songs);

    const list = h('div',{class:'song-list'});
    const main = h('div');
    root.append(h('div',{class:'songs-layout'}, h('div',null,
      h('div',{class:'row',style:'margin-bottom:10px'},
        h('button',{class:'btn primary',onclick:newSong},'+ Nowa piosenka'),
        h('a',{class:'btn ghost',href:'#setlista'},'Setlista →')),
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
      const s={id:uid(), title:'Nowa piosenka', artist:'', key:'C', bpm:90, beats:4, chords:'', lyrics:'', notes:''};
      await DB.putSong(s); songs.unshift(s); currentId=s.id; drawList(); drawSong(true);
    }
    async function exportAll(){
      const all = await DB.allSongs();
      const blob = new Blob([JSON.stringify({app:'harmonia',version:1,exported:new Date().toISOString(),songs:all},null,2)],{type:'application/json'});
      const a=h('a',{href:URL.createObjectURL(blob),download:'harmonia-piosenki-'+new Date().toISOString().slice(0,10)+'.json'});
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(a.href), 1000);
    }
    async function importAll(e){
      const f=e.target.files[0]; if(!f) return;
      try{
        const data = JSON.parse(await f.text());
        const arr = Array.isArray(data)?data:data.songs;
        let n=0;
        if(!Array.isArray(arr)) throw new Error('brak listy piosenek');
        for(const raw of arr){ const s=sanitizeSong(raw); if(s){ await DB.putSong(s); n++; } }
        songs = await DB.allSongs(); drawList(); drawSong();
        alert(`Wczytano piosenek: ${n}.`);
      }catch(err){ alert('To nie wygląda na plik kopii z tej appki.'); }
      e.target.value='';
    }

    let saveT=null, saveFor=null;   // opóźniony zapis i piosenka, której dotyczy
    function drawSong(focusTitle){
      stopSeq();
      main.innerHTML='';
      const s = songs.find(x=>x.id===currentId);
      if(!s){ main.append(h('div',{class:'empty'},'Wybierz piosenkę z listy albo dodaj nową.')); return; }
      // opóźniony zapis; jeśli czeka zapis innej piosenki — zapisz go od razu, żeby nie przepadł
      const save = ()=>{
        if(saveFor && saveFor!==s) DB.putSong(saveFor);
        clearTimeout(saveT); saveFor=s;
        saveT=setTimeout(()=>{ saveFor=null; DB.putSong(s); drawList(); },400);
      };

      /* --- pola --- */
      const fTitle = h('input',{value:s.title||'',placeholder:'Tytuł','aria-label':'Tytuł',style:'font-family:Fraunces,serif;font-size:1.5rem;font-weight:600;padding:8px 12px'});
      const fArtist = h('input',{value:s.artist||'',placeholder:'Wykonawca (opcjonalnie)'});
      const fKey = h('select',null, ...SONG_KEYS.map(k=>h('option',{value:k.v,selected:k.v===s.key},k.l)));
      const fBpm = h('input',{type:'number',min:40,max:200,value:s.bpm||90});
      const fBeats = h('select',null, ...[1,2,3,4,8].map(n=>h('option',{value:n,selected:(s.beats||4)==n}, n+' '+(n===1?'uderzenie':n<5?'uderzenia':'uderzeń'))));
      const fLyrics = h('textarea',{spellcheck:'false',style:'min-height:150px',
        placeholder:'[Zwrotka]\n[C]Wlazł kotek na [G7]płotek i mruga,\nładna to [C]piosenka nie[G7]długa.'}, s.lyrics||'');

      fTitle.oninput=()=>{ s.title=fTitle.value; save(); };
      fArtist.oninput=()=>{ s.artist=fArtist.value; save(); };
      fKey.onchange=()=>{ s.key=fKey.value; save(); drawSheet(); drawLyrics(); };
      fBpm.oninput=()=>{ s.bpm=+fBpm.value||90; save(); };
      fBeats.onchange=()=>{ s.beats=+fBeats.value; save(); };
      fLyrics.oninput=()=>{ s.lyrics=fLyrics.value; save(); drawLyrics(); if(!(s.chords||'').trim()) drawSheet(); };
      fLyrics.style.minHeight = Math.min(700, 120 + (s.lyrics||'').split('\n').length*22)+'px';

      /* --- arkusz z akordami --- */
      // bez osobnej listy akordów — bierzemy je po kolei z tekstu
      const chordText = ()=> (s.chords||'').trim() ? s.chords : lyricsChords(s.lyrics).map(c=>c.text).join(' ');
      const sheet = h('div',{class:'song-sheet'});
      const analysis = h('div',{class:'hint',style:'margin-top:10px'});
      const playAll = h('button',{class:'btn primary'},'▶ Zagraj akordy');
      playAll.onclick=()=>{
        if(playAll.dataset.on){ stopSeq(); return; }
        const items=[];
        sheet.querySelectorAll('.chord-chip').forEach(el=>{ const c=parseChord(el.dataset.c); if(c) items.push({pcs:c.pcs,bassPc:c.bassPc,el}); });
        if(!items.length) return;
        playAll.dataset.on='1'; playAll.textContent='■ Stop';
        playChordSeq(items, (60/(s.bpm||90))*(s.beats||4), ()=>{ delete playAll.dataset.on; playAll.textContent='▶ Zagraj akordy'; }, {loop:loopPref(), beats:s.beats||4, click:clickPref(), countIn:clickPref()?(s.beats||4):0});
      };
      function drawSheet(){
        sheet.innerHTML='';
        const lines = parseSongText(chordText());
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
        if(!lines.length) sheet.append(h('div',{class:'empty'},'Akordy pojawią się tu z tekstu piosenki.'));
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
            use.onclick=()=>{ s.key=g.v; fKey.value=g.v; save(); drawSheet(); drawLyrics(); };
            analysis.append(h('div',{style:'margin-top:6px'},`Podpowiedź: akordy najlepiej pasują do tonacji `, h('b',null,keyNameLabel(g.v)), ` (${g.fit}/${all.length} akordów w gamie).`, use));
          }
        }
        if(junk.length) analysis.append(h('div',{style:'margin-top:6px'},'Nie rozpoznano: '+junk.join(', ')+' — pisz akordy jak C, Am, F#m, Bb7, G/B.'));
      }

      /* --- tekst z akordami nad słowami --- */
      const lyrBox = h('div',{class:'lyr'});
      const playLyr = h('button',{class:'btn primary'},'▶ Zagraj z tekstu');
      playLyr.onclick=()=>{
        if(playLyr.dataset.on){ stopSeq(); return; }
        const items=[];
        lyrBox.querySelectorAll('.lyr-ch[data-c]').forEach(el=>{ const c=parseChord(el.dataset.c); if(c) items.push({pcs:c.pcs,bassPc:c.bassPc,el}); });
        if(!items.length) return;
        playLyr.dataset.on='1'; playLyr.textContent='■ Stop';
        playChordSeq(items, (60/(s.bpm||90))*(s.beats||4), ()=>{ delete playLyr.dataset.on; playLyr.textContent='▶ Zagraj z tekstu'; },
          {loop:loopPref(), beats:s.beats||4, click:clickPref()});
      };
      function transponujTekst(n){
        if(!s.lyrics) return;
        s.lyrics = transposeLyrics(s.lyrics, n);
        fLyrics.value = s.lyrics; save(); drawLyrics(); if(!(s.chords||'').trim()) drawSheet();
      }
      function drawLyrics(){
        lyrBox.innerHTML='';
        const linie = parseLyrics(s.lyrics);
        if(!s.lyrics || !s.lyrics.trim()){
          lyrBox.append(h('div',{class:'empty'},'Tu wklej tekst piosenki. Akordy wpisz w nawiasach kwadratowych dokładnie tam, gdzie mają zabrzmieć — appka pokaże je nad sylabami.'));
          return;
        }
        lyricsInto(lyrBox, linie, s.key);
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
          h('div',{class:'sechead'}, h('h2',null,'Akordy'), h('div',{class:'row'}, playAll, loopToggle(), clickToggle(), h('a',{class:'btn',href:'#druk/song/'+s.id},'🖨 Drukuj'), h('button',{class:'btn',title:'Pokaż drzewo i koło dla akordów tej piosenki',onclick:()=>{ const toks=parseSongText(chordText()).flatMap(l=>l.tokens.filter(t=>t.chord).map(t=>t.chord.text)); prefs.set('przejscia.seq',toks); prefs.set('przejscia.start',s.key); location.hash='#przejscia'; }},'🌳 Drzewo przejść'))),
          h('div',{class:'card'}, sheet, analysis)),
        h('section',{style:'margin-top:18px'},
          h('div',{class:'sechead'}, h('h2',null,'Tekst z akordami'),
            h('div',{class:'row'}, playLyr, loopToggle(),
              h('button',{class:'btn small ghost',title:'Cały tekst pół tonu niżej',onclick:()=>transponujTekst(-1)},'♭ −½'),
              h('button',{class:'btn small ghost',title:'Cały tekst pół tonu wyżej',onclick:()=>transponujTekst(1)},'♯ +½'))),
          h('div',{class:'card'}, lyrBox),
          h('details',{style:'margin-top:12px'},
            h('summary',{class:'hint',style:'cursor:pointer'},'Edytuj tekst'),
            fLyrics,
            h('div',{class:'hint',style:'margin-top:6px'},'Akord w nawiasie kwadratowym staje nad następną sylabą: ',
              h('span',{class:'mono'},'[C]Wlazł kotek na [G7]płotek'),'. Linia z samym ',
              h('span',{class:'mono'},'[Zwrotka]'),' to nagłówek części. Reszta linii zostaje zwykłym tekstem.'))),
        h('div',{class:'row',style:'margin-top:22px'},
          h('button',{class:'btn danger',onclick:async()=>{ if(!confirm(`Usunąć „${s.title}"? Tego nie da się cofnąć.`)) return; if(saveFor===s){ clearTimeout(saveT); saveFor=null; } await DB.delSong(s.id); songs=songs.filter(x=>x.id!==s.id); currentId=songs[0]&&songs[0].id; drawList(); drawSong(); }},'Usuń piosenkę'))
      );
      drawSheet(); drawLyrics();
      if(focusTitle){ fTitle.focus(); fTitle.select(); }
    }

    drawList(); drawSong();
  }
};
