/* Zakładka „Teoria" — kurs od zera.
   Zasady dydaktyczne: najpierw słyszysz, potem nazywasz; małe porcje;
   każda lekcja kończy się zadaniem przy pianinie i krótkim quizem
   (przypominanie z pamięci utrwala lepiej niż ponowne czytanie). */

const LESSONS = [
/* ------------------------------------------------------------ */
{ id:'klawiatura', title:'Klawiatura i 12 dźwięków',
  body(){ return `
<p class="kicker">lekcja 1 · ok. 10 minut</p>
<h2>Klawiatura to tylko 12 dźwięków, powtarzanych w kółko</h2>
<p>Popatrz na klawiaturę: czarne klawisze układają się w grupki po <b>dwa</b> i po <b>trzy</b>. To Twoja mapa. Cały wzór — 7 białych i 5 czarnych — powtarza się co <b>oktawę</b>, tylko wyżej albo niżej.</p>
<div data-widget="kbd-all"></div>
<div class="box tip"><p><b>C</b> to biały klawisz tuż <b>na lewo od dwóch czarnych</b>. Znajdziesz go wszędzie na klawiaturze. Od C idą białe: <span class="mono">C D E F G A B</span>, potem znowu C.</p></div>
<h3>Dlaczego B, a nie H?</h3>
<p>W polskiej szkole muzycznej ten dźwięk nazywa się H. W piosenkach, akordach z internetu i w appkach prawie zawsze zobaczysz <b>B</b> — więc tutaj używamy B. To ten sam klawisz.</p>
<h3>Czarne klawisze: krzyżyk ♯ i bemol ♭</h3>
<ul>
<li><b>♯ (krzyżyk)</b> = o jeden klawisz w <b>górę</b> (w prawo). C♯ to czarny klawisz zaraz nad C.</li>
<li><b>♭ (bemol)</b> = o jeden klawisz w <b>dół</b> (w lewo). D♭ to czarny klawisz zaraz pod D.</li>
<li>C♯ i D♭ to <b>ten sam klawisz</b>, tylko inna nazwa. Którą wybrać, zależy od gamy — dojdziemy do tego.</li>
</ul>
<h3>Półton i cały ton — miarka muzyki</h3>
<p><b>Półton</b> to krok na sąsiedni klawisz, <b>jakikolwiek</b> — biały czy czarny. <b>Cały ton</b> to dwa półtony. <button class="listen" data-notes="60 61">półton C → C♯</button> <button class="listen" data-notes="60 62">cały ton C → D</button></p>
<div class="box why"><p>Między <b>E i F</b> oraz między <b>B i C</b> nie ma czarnego klawisza. Dlatego E→F i B→C to <b>półtony</b>, choć to dwa białe klawisze. To jedyna „pułapka" klawiatury i zaraz się przyda przy gamach.</p></div>
<div class="box try"><p>Znajdź wszystkie C na swoim pianinie (lewy klawisz przed dwoma czarnymi). Potem zagraj od jednego C do następnego same białe klawisze. Właśnie zagrałaś gamę C-dur.</p></div>
`; },
  quiz:[
    {q:'Gdzie leży C?', opts:['na lewo od dwóch czarnych','na lewo od trzech czarnych','między dwoma czarnymi'], a:0, why:'Tak — lewy biały klawisz przed parą czarnych.'},
    {q:'Ile półtonów ma cały ton?', opts:['1','2','3'], a:1, why:'Cały ton = 2 półtony, np. C → D.'},
    {q:'E → F to…', opts:['cały ton','półton'], a:1, why:'Półton — nie ma między nimi czarnego klawisza.'},
    {q:'C♯ i D♭ to…', opts:['różne klawisze','ten sam klawisz'], a:1, why:'Ten sam klawisz, dwie nazwy.'},
  ]},

/* ------------------------------------------------------------ */
{ id:'gama', title:'Gama durowa — przepis',
  body(){ return `
<p class="kicker">lekcja 2 · ok. 10 minut</p>
<h2>Gama to 7 dźwięków wybranych według jednego przepisu</h2>
<p>Gama durowa to „wesoły", jasny zestaw 7 dźwięków. Przepis jest zawsze ten sam, od dowolnego klawisza:</p>
<p style="font-size:1.25rem" class="mono">cały · cały · <span class="t-c">pół</span> · cały · cały · cały · <span class="t-c">pół</span></p>
<p>Zapamiętaj rytmicznie: <b>„ca-ły ca-ły PÓŁ, ca-ły ca-ły ca-ły PÓŁ"</b>. <button class="listen" data-notes="60 62 64 65 67 69 71 72">posłuchaj gamy C-dur</button></p>
<p>W gamie C ten przepis wypada akurat na same białe klawisze (bo półtony E→F i B→C są dokładnie tam, gdzie trzeba). Wybierz inny dźwięk startowy i zobacz, co się stanie:</p>
<div data-widget="scale-builder"></div>
<div class="box why"><p>Gama G potrzebuje <b>F♯</b>, bo przepis na 7. kroku wymaga całego tonu E→F♯ i półtonu F♯→G. Dlatego każda gama (oprócz C) ma swoje czarne klawisze — to są <b>znaki przykluczowe</b>, które zobaczysz potem na początku nut.</p></div>
<h3>Stopnie gamy</h3>
<p>Dźwięki gamy numerujemy od 1 do 7. W C: C=1, D=2, E=3, F=4, G=5, A=6, B=7. Te numery to <b>stopnie</b>. Ważne są zwłaszcza: <b>1</b> (dom), <b>5</b> (najmocniejszy sąsiad domu) i <b>7</b> (dźwięk, który „ciągnie" do domu — posłuchaj, jak się urywa: <button class="listen" data-notes="60 62 64 65 67 69 71 -" data-dur="0.5">C…B</button> i jak ulgę daje powrót: <button class="listen" data-notes="71 72" data-step="0.5" data-dur="0.8">B → C</button>).</p>
<div class="box try"><p>Zagraj gamę G-dur: same białe od G do G, ale zamiast F naciśnij F♯. Potem gamę F-dur: białe od F, ale B zamień na B♭.</p></div>
`; },
  quiz:[
    {q:'Przepis gamy durowej to…', opts:['C C P C C C P','C P C C P C C','C C C P C C P'], a:0, why:'cały, cały, pół, cały, cały, cały, pół.'},
    {q:'Który czarny klawisz ma gama G-dur?', opts:['B♭','F♯','C♯'], a:1, why:'F♯ — jedyny krzyżyk w G-dur.'},
    {q:'Który stopień gamy „ciągnie" do domu?', opts:['3','5','7'], a:2, why:'7. stopień (w C to B) — jest pół tonu pod domem.'},
  ]},

/* ------------------------------------------------------------ */
{ id:'akordy', title:'Akord: dur, moll, zmniejszony',
  body(){ return `
<p class="kicker">lekcja 3 · ok. 12 minut</p>
<h2>Akord to trzy dźwięki grane razem — „co drugi"</h2>
<p>Najprostszy akord (<b>trójdźwięk</b>) budujesz tak: bierzesz dźwięk, pomijasz następny, bierzesz, pomijasz, bierzesz. Na białych: <span class="mono">C (d) E (f) G</span> → akord <b>C</b>. Palce 1–3–5 prawej ręki same to łapią.</p>
<p>Najniższy dźwięk to <b>podstawa</b> — od niej akord ma nazwę. Środkowy to <b>tercja</b>, górny to <b>kwinta</b>.</p>
<h3>Dur i moll — różnica jednego klawisza</h3>
<ul>
<li><b>Dur</b> (np. <span class="mono">C</span>): od podstawy 4 półtony w górę, potem 3. Brzmi jasno, stabilnie. <button class="listen" data-chords="C">C</button></li>
<li><b>Moll</b> (np. <span class="mono">Cm</span>): 3 półtony, potem 4. Środkowy dźwięk o <b>pół tonu niżej</b>. Brzmi ciemniej, smutniej. <button class="listen" data-chords="Cm">Cm</button></li>
<li><b>Zmniejszony</b> (np. <span class="mono">B°</span>): 3 + 3. Ciasny, niespokojny, chce się rozwiązać. <button class="listen" data-chords="Bdim">B°</button></li>
</ul>
<p>Porównaj pod rząd: <button class="listen" data-chords="C Cm C Cm" data-step="1">C · Cm · C · Cm</button></p>
<div data-widget="chord-builder"></div>
<div class="box tip"><p>W zapisie akordów: sama litera = dur (<b>A</b>), litera + „m" = moll (<b>Am</b>), „°" albo „dim" = zmniejszony. Cyfra 7 (np. <b>G7</b>) to dodatkowy czwarty dźwięk — przyprawa, funkcja się nie zmienia.</p></div>
<h3>Trening ucha: dur czy moll?</h3>
<p>Nie musisz od razu słyszeć różnicy — ucho uczy się przez powtórki. Rób to po kilka razy dziennie.</p>
<div data-widget="ear-majmin"></div>
<div class="box try"><p>Zagraj C (C-E-G), a potem przesuń tylko środkowy palec na czarny klawisz niżej (E♭). To Cm. To samo z G → Gm (B → B♭) i D → Dm (F♯ → F).</p></div>
`; },
  quiz:[
    {q:'Jakie dźwięki ma akord C?', opts:['C D E','C E G','C F A'], a:1, why:'C-E-G: co drugi biały od C.'},
    {q:'Czym różni się Am od A?', opts:['wyższym dźwiękiem górnym','środkowy dźwięk jest pół tonu niżej','innym basem'], a:1, why:'Moll = obniżona tercja (środek).'},
    {q:'„Em" oznacza…', opts:['E-dur','e-moll','E z basem m'], a:1, why:'m = moll.'},
  ]},

/* ------------------------------------------------------------ */
{ id:'stopnie', title:'Akordy gamy i cyfry rzymskie',
  body(){ return `
<p class="kicker">lekcja 4 · ok. 10 minut</p>
<h2>Na każdym dźwięku gamy stoi jeden akord</h2>
<p>Weź gamę i na każdym jej stopniu zbuduj trójdźwięk „co drugi", <b>używając tylko dźwięków tej gamy</b>. Wychodzi 7 akordów — i to są akordy, które „pasują" do tej gamy. W C (same białe):</p>
<div data-widget="degree-table"></div>
<p>I teraz magia: w <b>każdej</b> gamie durowej wychodzi <b>ten sam wzór</b>:</p>
<p class="mono" style="font-size:1.1rem">I dur · ii moll · iii moll · IV dur · V dur · vi moll · vii° zmniejszony</p>
<div class="box tip"><p><b>Cyfry rzymskie</b> to numery stopni. <b>Duże</b> (I, IV, V) = akord durowy, <b>małe</b> (ii, iii, vi) = molowy, ° = zmniejszony. Zapamiętaj trzy durowe: <b>1, 4, 5</b>. Reszta to moll (plus jeden zmniejszony na 7).</p></div>
<h3>Po co te cyfry?</h3>
<p>Bo działają w każdej gamie. „I–IV–V" to w C: <span class="mono">C F G</span>, w G: <span class="mono">G C D</span>, w D: <span class="mono">D G A</span>. Nauczysz się jednej progresji — umiesz ją w 12 tonacjach. Tak też muzycy mówią o piosenkach: „to jest I–V–vi–IV".</p>
<p><button class="listen" data-chords="C F G C">I–IV–V–I w C</button> <button class="listen" data-chords="G C D G">to samo w G</button> <button class="listen" data-chords="D G A D">i w D</button> — słyszysz? Ta sama „melodia harmonii", tylko wyżej.</p>
<div class="box try"><p>Wybierz w zakładce <a href="#gamy">Gamy</a> gamę G. Zagraj I, IV, V (G, C, D). Potem to samo w D (D, G, A). To te same ruchy ręki, przesunięte.</p></div>
`; },
  quiz:[
    {q:'Które stopnie dają akordy durowe?', opts:['I, IV, V','I, ii, iii','ii, iii, vi'], a:0, why:'1, 4, 5 — trzy „duże" cyfry.'},
    {q:'Jaki jest akord vi w C-dur?', opts:['A','Am','F'], a:1, why:'Na 6. stopniu (A) z białych: A-C-E = Am.'},
    {q:'Jaki jest akord V w G-dur?', opts:['D','C','Em'], a:0, why:'5. stopień gamy G to D, akord durowy.'},
  ]},

/* ------------------------------------------------------------ */
{ id:'role', title:'Trzy role: tonika, subdominanta, dominanta',
  body(){ return `
<p class="kicker">lekcja 5 · najważniejsza · ok. 15 minut</p>
<h2>Każdy akord w gamie ma jedną z trzech ról</h2>
<p>To jest serce całej harmonii. Rola mówi, <b>dokąd akord chce iść</b>. Pomyśl o tym jak o wyjściu z domu na spacer.</p>

<div class="card" style="border-color:var(--tonic-dim)">
<h3 class="t-c" style="margin-top:0">Tonika · dom, odpoczynek</h3>
<p>Akordy <b>I, vi, iii</b>. W C: <span class="mono t-c">C, Am, Em</span>. Tu muzyka się uspokaja, tu kończą się piosenki. Na tonice można stać i nic nie „wisi". <button class="listen" data-chords="C">C</button> <button class="listen" data-chords="Am">Am</button></p>
</div>
<div class="card" style="border-color:var(--sub-dim)">
<h3 class="s-c" style="margin-top:0">Subdominanta · ruch, wyjście z domu</h3>
<p>Akordy <b>IV, ii</b>. W C: <span class="mono s-c">F, Dm</span>. Oddalasz się od domu, ale bez nerwów — „coś się dzieje". <button class="listen" data-chords="C F" data-step="1">C → F</button></p>
</div>
<div class="card" style="border-color:var(--dom-dim)">
<h3 class="d-c" style="margin-top:0">Dominanta · napięcie, ciągnie do domu</h3>
<p>Akordy <b>V, vii°</b>. W C: <span class="mono d-c">G, B°</span>. Brzmi jak pytanie, na które ucho czeka z odpowiedzią. Posłuchaj, jak G zostaje „zawieszone": <button class="listen" data-chords="C F G" data-step="1">C → F → G …</button> i jaka ulga, kiedy wraca: <button class="listen" data-chords="C F G C" data-step="1">… → C</button></p>
</div>

<div class="box why">
<p><b>Czemu dominanta tak ciągnie?</b> Bo zawiera <b>7. stopień gamy</b> (w C to <b>B</b>), który leży pół tonu pod domem (C). Ucho słyszy ten półton jak niedomknięte drzwi — chce, żeby B weszło na C. <button class="listen" data-notes="71 72" data-step="0.6" data-dur="0.9">B → C</button> Dlatego G (G-<b>B</b>-D) i B° (<b>B</b>-D-F) grają rolę dominanty.</p>
<p><b>Czemu tonika to trzy akordy?</b> C (C-E-G), Am (A-<b>C-E</b>) i Em (E-<b>G</b>-B) dzielą ze sobą po dwa dźwięki. Brzmią „spokrewnione", więc Am może zastąpić C, gdy chcesz domu, ale smutniejszego. Tak samo F (F-<b>A-C</b>) i Dm (D-<b>F-A</b>) — dwie wersje subdominanty.</p>
</div>

<h3>Te same role w innych gamach</h3>
<div data-widget="roles-table"></div>
<div class="box tip"><p>Kolory w całej appce: <span class="t-c">róż = tonika</span>, <span class="s-c">morski = subdominanta</span>, <span class="d-c">bursztyn = dominanta</span>, szary = akord spoza gamy.</p></div>
<div class="box try"><p>Zagraj C, potem G i <b>zatrzymaj się</b>. Poczuj, jak coś Cię „ciągnie". Teraz zagraj C. To uczucie ulgi to cała tajemnica — kompozytorzy od 300 lat budują na nim piosenki.</p></div>
`; },
  quiz:[
    {q:'Który akord w C-dur to dominanta?', opts:['F','G','Am'], a:1, why:'G = V stopień, dominanta.', listen:()=>strike(parseChord('G').pcs)},
    {q:'Am w gamie C pełni rolę…', opts:['toniki','subdominanty','dominanty'], a:0, why:'vi = tonika (dzieli C i E z akordem C).'},
    {q:'Który dźwięk daje dominancie „ciągnięcie"?', opts:['1. stopień','5. stopień','7. stopień'], a:2, why:'7. stopień — pół tonu pod domem.'},
    {q:'Subdominanta w G-dur to…', opts:['C i Am','D i F♯°','G i Em'], a:0, why:'IV = C, ii = Am.'},
  ]},

/* ------------------------------------------------------------ */
{ id:'laczenie', title:'Jak łączyć akordy (kadencje)',
  body(){ return `
<p class="kicker">lekcja 6 · ok. 12 minut</p>
<h2>Jedna zasada: T → S → D → T</h2>
<p>Dom → ruch → napięcie → powrót. I możesz kręcić w kółko. Jeśli trzymasz się tej kolejności, zawsze brzmi „poprawnie". Na tym stoi większość muzyki pop, rock, folk i klasyki.</p>
<div class="flow" style="margin:14px 0"><span class="pill t">T · C Am Em</span><span class="arrow">→</span><span class="pill s">S · F Dm</span><span class="arrow">→</span><span class="pill d">D · G B°</span><span class="arrow">→</span><span class="pill t">T</span></div>
<p>Z każdej grupy wybierasz dowolny akord. Np. <button class="listen" data-chords="C Dm G C">C Dm G C</button> <button class="listen" data-chords="Am F G C">Am F G C</button> <button class="listen" data-chords="C F G Am">C F G Am</button> — wszystkie działają.</p>

<h3>Wolno też skracać i zawracać</h3>
<ul>
<li><b>T → D → T</b> — pominąć ruch: <button class="listen" data-chords="C G C">C G C</button></li>
<li><b>T → S → T</b> — wyjść i wrócić bez napięcia: <button class="listen" data-chords="C F C">C F C</button></li>
<li><b>D → S</b> brzmi „pod prąd" — trochę jak cofanie. Nie jest zakazane (rock tak lubi: <button class="listen" data-chords="C G F C">C G F C</button>), ale mniej domknięte.</li>
</ul>

<h3>Kadencje — sposoby kończenia zdania</h3>
<p>Kadencja to „interpunkcja" muzyki: jak kończysz frazę.</p>
<ul>
<li><b>Doskonała (kropka)</b>: V → I. Najmocniejsze zakończenie. <button class="listen" data-chords="F G C" data-step="1">F G C</button></li>
<li><b>Plagalna („amen")</b>: IV → I. Łagodne, kościelne. <button class="listen" data-chords="C F C" data-step="1">C F C</button></li>
<li><b>Półkadencja (pytajnik)</b>: kończysz na V. Zostawia napięcie — dobre na koniec zwrotki przed refrenem. <button class="listen" data-chords="C Am F G" data-step="1">C Am F G …</button></li>
<li><b>Zwodnicza (niespodzianka)</b>: V → vi zamiast V → I. Ucho czeka na dom, a dostaje jego smutną wersję. <button class="listen" data-chords="C F G Am" data-step="1">C F G Am</button></li>
</ul>
<div class="box tip"><p>Najmocniejszy moment w muzyce to dominanta wracająca na tonikę: <b>G→C</b> w C, <b>D→G</b> w G, <b>A→D</b> w D.</p></div>
<div class="box try"><p>Wymyśl własną 4-akordową pętlę: wybierz po jednym akordzie z T, S, D i zakończ na T. Zagraj ją 4 razy pod rząd. Potem zamień jeden akord na innego z tej samej grupy (np. F → Dm). Słyszysz, że dalej działa?</p></div>
`; },
  quiz:[
    {q:'Która kolejność brzmi najbardziej „poprawnie"?', opts:['T → D → S → T','T → S → D → T','D → T → S → D'], a:1, why:'Dom → ruch → napięcie → powrót.'},
    {q:'Kadencja doskonała to…', opts:['IV → I','V → I','V → vi'], a:1, why:'V → I, np. G → C.'},
    {q:'C F G Am kończy się kadencją…', opts:['doskonałą','zwodniczą','plagalną'], a:1, why:'V → vi zamiast V → I — zwodnicza.', listen:()=>playChordSeq(['C','F','G','Am'].map(t=>({pcs:parseChord(t).pcs})),0.9)},
  ]},

/* ------------------------------------------------------------ */
{ id:'przewroty', title:'Przewroty — gładkie przejścia ręki',
  body(){ return `
<p class="kicker">lekcja 7 · ok. 10 minut · bardzo praktyczne</p>
<h2>Nie musisz skakać całą ręką</h2>
<p>Akord C to dźwięki C, E, G — ale nie muszą być ułożone w tej kolejności. Możesz przestawić je tak, żeby na górze był inny dźwięk. To <b>przewroty</b>:</p>
<ul>
<li><b>Pozycja zasadnicza</b>: C-E-G <button class="listen" data-stack="60 64 67">posłuchaj</button></li>
<li><b>1. przewrót</b>: E-G-C (C poszło na górę) <button class="listen" data-stack="64 67 72">posłuchaj</button></li>
<li><b>2. przewrót</b>: G-C-E <button class="listen" data-stack="67 72 76">posłuchaj</button></li>
</ul>
<p>To wciąż akord C — ta sama rola, ten sam kolor. Ale ręka może zostać prawie w miejscu, kiedy zmieniasz akordy.</p>
<h3>C → F → G → C bez skakania</h3>
<p>Zamiast przesuwać całą rękę, zmieniaj tylko te palce, które muszą:</p>
<ul class="mono">
<li>C: C-E-G</li>
<li>F: C-F-A (2. przewrót — C zostaje!)</li>
<li>G: B-D-G (1. przewrót)</li>
<li>C: C-E-G</li>
</ul>
<p><button class="listen" data-notes="60 64 67" data-step="0.12" data-dur="1">C</button> <button class="listen" data-notes="60 65 69" data-step="0.12" data-dur="1">F</button> <button class="listen" data-notes="59 62 67" data-step="0.12" data-dur="1">G</button> <button class="listen" data-notes="60 64 67" data-step="0.12" data-dur="1">C</button></p>
<div class="box tip"><p>Zasada „najbliższej drogi": wspólne dźwięki zostają na miejscu, reszta rusza się o najmniejszy krok. Tak grają pianiści w piosenkach — lewa ręka gra podstawę (np. C, F, G), prawa przewroty blisko siebie.</p></div>
<h3>Zapis ukośnikowy</h3>
<p>Jeśli w akordach piosenki zobaczysz <b>C/E</b>, to znaczy: akord C, ale w basie (lewa ręka) gra <b>E</b>. <button class="listen" data-chords="C C/E F G">C C/E F G</button></p>
<div class="box try"><p>Zagraj pętlę C–Am–F–G prawą ręką tak, żeby kciuk prawie się nie ruszał: C-E-G → C-E-A → C-F-A → B-D-G. Lewa ręka gra same podstawy: C, A, F, G.</p></div>
`; },
  quiz:[
    {q:'E-G-C to…', opts:['akord Em','1. przewrót akordu C','akord G'], a:1, why:'Te same dźwięki co C, tylko C na górze.'},
    {q:'Co oznacza zapis F/A?', opts:['akord F z A w basie','akord F lub A','Fm'], a:0, why:'Ukośnik = który dźwięk gra bas.'},
  ]},

/* ------------------------------------------------------------ */
{ id:'modulacja', title:'Przechodzenie między gamami',
  body(){ return `
<p class="kicker">lekcja 8 · ok. 10 minut</p>
<h2>Sąsiednie gamy różnią się jednym dźwiękiem</h2>
<p>C-dur ma same białe. G-dur — to samo, tylko F zamienia się na F♯. D-dur — jeszcze C na C♯. Każdy krok o <b>kwintę w górę</b> (5 białych w górę: C→G→D→A…) dokłada jeden krzyżyk. Każdy krok w dół (C→F→B♭→E♭…) dokłada bemol. Ułożone w kółko to <b>koło kwintowe</b> — zobaczysz je w zakładce <a href="#wizualizacja">Wizualizacja</a>.</p>
<p>Bo różnią się tylko jednym dźwiękiem, sąsiednie gamy mają <b>aż 4 wspólne akordy</b>. C i G dzielą: <span class="mono">C, Em, G, Am</span>.</p>
<h3>Przepis na przejście</h3>
<ol>
<li>Graj w starej gamie.</li>
<li>Zagraj akord <b>wspólny</b> dla obu gam (most).</li>
<li>Zaraz po nim zagraj <b>dominantę nowej gamy</b> (V nowej gamy) — ona „ustawia ucho" w nowym miejscu.</li>
<li>Wyląduj na nowej tonice.</li>
</ol>
<p>Z C do G: <button class="listen" data-chords="C F C Am D G" data-step="0.9">C F C · Am · D · G</button> (Am = most, D = dominanta G).</p>
<p>Z G do D: <button class="listen" data-chords="G C G Em A D" data-step="0.9">G C G · Em · A · D</button></p>
<p>Z C do F (w dół): <button class="listen" data-chords="C G Am C7 F" data-step="0.9">C G Am · C7 · F</button> — tu C staje się dominantą F (dodanie B♭ w C7 to podpowiedź dla ucha).</p>
<div class="box tip"><p>Wszystkie mosty dla wybranej gamy są w zakładce <a href="#gamy">Gamy</a> na dole strony.</p></div>
<div class="box try"><p>Zagraj pętlę C–F–G–C dwa razy, potem most Am, potem D, i graj pętlę G–C–D–G. Właśnie zmodulowałaś — tak piosenki „podnoszą się" w ostatnim refrenie.</p></div>
`; },
  quiz:[
    {q:'Czym różni się G-dur od C-dur?', opts:['jednym dźwiękiem (F♯)','trzema dźwiękami','niczym'], a:0, why:'Tylko F → F♯.'},
    {q:'Żeby przejść z C do G, po moście grasz…', opts:['F','D (dominantę G)','Em'], a:1, why:'Dominanta nowej gamy ustawia ucho.'},
  ]},

/* ------------------------------------------------------------ */
{ id:'moll', title:'Tonacje molowe i jak rozpoznać tonację piosenki',
  body(){ return `
<p class="kicker">lekcja 9 · ok. 12 minut</p>
<h2>a-moll to C-dur, tylko z innym domem</h2>
<p>Zagraj same białe od A do A: <button class="listen" data-notes="57 59 60 62 64 65 67 69">gama a-moll</button>. Te same dźwięki co C-dur, ale brzmi smutniej — bo „domem" jest teraz A, a nie C. Takie pary gam nazywamy <b>równoległymi</b>: C-dur ↔ a-moll, G-dur ↔ e-moll, F-dur ↔ d-moll. Molowa leży zawsze na <b>6. stopniu</b> durowej (vi).</p>
<p>Akordy są te same, tylko w a-moll domem jest <b>Am</b>. Numeracja liczy się wtedy od A: <span class="mono">i = Am, iv = Dm, v = Em, VI = F, VII = G, III = C</span>.</p>
<div class="box why"><p><b>Sztuczka molowa:</b> w a-moll bardzo często gra się <b>E-dur</b> zamiast Em. Czemu? E-dur zawiera G♯ — dźwięk pół tonu pod A, który ciągnie do domu tak jak B do C w C-dur. Porównaj: <button class="listen" data-chords="Am Dm Em Am" data-step="0.9">Am Dm Em Am</button> i <button class="listen" data-chords="Am Dm E Am" data-step="0.9">Am Dm E Am</button> — z E-dur zakończenie jest dużo mocniejsze.</p></div>
<h3>Jak rozpoznać tonację piosenki</h3>
<ol>
<li>Spójrz na <b>ostatni akord</b> — piosenki prawie zawsze kończą się na tonice.</li>
<li>Spójrz na <b>pierwszy akord</b> refrenu albo zwrotki — często tonika.</li>
<li>Policz, który akord pojawia się <b>najczęściej</b> i na którym „odpoczywa" melodia.</li>
<li>Sprawdź, czy wszystkie akordy mieszczą się w jednej gamie (appka to pokaże w zakładce <a href="#piosenki">Piosenki</a> — akordy spoza gamy są szare).</li>
<li>Jeśli „dom" to akord molowy (np. Am), a reszta to akordy z C-dur — tonacja to <b>a-moll</b>.</li>
</ol>
<div class="box tip"><p>Piosenka ma akordy <span class="mono">Am F C G</span> i kończy się na Am? To a-moll. Ma <span class="mono">C G Am F</span> i kończy na C? C-dur. Te same akordy, inny dom.</p></div>
`; },
  quiz:[
    {q:'Równoległa molowa do G-dur to…', opts:['a-moll','e-moll','d-moll'], a:1, why:'6. stopień G-dur to E → e-moll.'},
    {q:'Piosenka: Dm B♭ F C, kończy na Dm. Tonacja?', opts:['F-dur','d-moll','C-dur'], a:1, why:'Akordy z F-dur, ale domem jest Dm → d-moll.'},
  ]},

/* ------------------------------------------------------------ */
{ id:'plan', title:'Jak ćwiczyć, żeby zostało w głowie',
  body(){ return `
<p class="kicker">lekcja 10 · plan na co dzień</p>
<h2>15 minut dziennie bije 2 godziny w weekend</h2>
<p>Mózg utrwala wiedzę, kiedy <b>wraca</b> do niej po przerwie i musi ją <b>wyciągnąć z pamięci</b> (a nie tylko przeczytać). Dlatego krótko, często, z przerwami i z ćwiczeniami, gdzie trzeba odpowiedzieć samej.</p>
<h3>Codzienna pętla (ok. 15 min)</h3>
<ol>
<li><b>3 min — nuty.</b> Trener „Jaka to nuta?" w zakładce <a href="#nuty/trener">Nuty</a>. Cel: bez liczenia linii.</li>
<li><b>3 min — ucho.</b> Dur czy moll (lekcja 3). Zamykasz oczy, zgadujesz.</li>
<li><b>5 min — progresja w 3 gamach.</b> Jedna progresja z <a href="#gamy">Gam</a> (np. I–V–vi–IV) w C, G i F. Lewa: podstawy, prawa: przewroty blisko siebie.</li>
<li><b>4 min — piosenka.</b> Coś z Twoich <a href="#piosenki">Piosenek</a>. Zanim zagrasz, nazwij rolę każdego akordu (T/S/D).</li>
</ol>
<h3>Plan na 4 tygodnie</h3>
<ul>
<li><b>Tydzień 1:</b> lekcje 1–3. Gama C, G, F. Akordy dur/moll z każdego białego klawisza.</li>
<li><b>Tydzień 2:</b> lekcje 4–5. Akordy gamy C, G, D, F na pamięć. Na każdy akord mów „dom / ruch / napięcie".</li>
<li><b>Tydzień 3:</b> lekcje 6–7. Kadencje i przewroty. Pierwsze 2 piosenki w appce.</li>
<li><b>Tydzień 4:</b> lekcje 8–9 + nuty (klucz basowy). Własna progresja z modulacją.</li>
</ul>
<div class="box tip"><p>Wracaj do quizów z wcześniejszych lekcji co kilka dni — nawet jeśli „już to umiesz". Właśnie wtedy wiedza przechodzi z „rozumiem" do „wiem bez myślenia".</p></div>
<div class="box try"><p>Wydrukuj ściągawkę gamy, w której ćwiczysz (<a href="#druk">Druk</a>), i postaw ją na pulpicie pianina.</p></div>
`; },
  quiz:[]},
];

/* ---------------- widżety interaktywne w lekcjach ---------------- */
const LessonWidgets = {
  'kbd-all'(el){
    const cap = h('div',{class:'cap'},'Kliknij klawisz, żeby usłyszeć i zobaczyć nazwę.');
    const hold = h('div');
    hold.appendChild(kbdSVG({from:48,to:71,labels:'all',onKey:(m,r)=>{
      playMidi(m); flashKey(r.ownerSVGElement,m);
      const pc=m%12; const s=PC_NAME_SHARP[pc], f=PC_NAME_FLAT[pc];
      cap.innerHTML = s===f ? `To jest <b>${s}</b>.` : `To jest <b>${fmt(s)}</b> albo inaczej <b>${fmt(f)}</b> — ten sam klawisz.`;
    }}));
    el.append(h('div',{class:'kbd-panel'},cap,hold));
  },
  'scale-builder'(el){
    const cap = h('div',{class:'cap'});
    const hold = h('div');
    const bar = h('div',{class:'row',style:'margin-bottom:10px'});
    const roots = ['C','G','D','A','E','F','Bb','Eb','Ab','Db','B','F#'];
    let cur='C';
    function show(k){
      cur=k;
      const pcs = majorScalePcs(PC[k]);
      const names = KEYS[k];
      const marks={}, nm={};
      let m = 60+PC[k]; if(PC[k]>6) m-=12;
      const midis=[];
      pcs.forEach((p,i)=>{ const mm = m + ((p-PC[k]+12)%12); marks[mm]= i===0?'t':'x'; nm[mm]=fmt(names[i]); midis.push(mm); });
      midis.push(m+12); marks[m+12]='t'; nm[m+12]=fmt(names[0]);
      const blacks = names.filter(n=>n.length>1);
      cap.innerHTML = `Gama <b>${keyLabel(k)}</b>: <b>${names.map(fmt).join(' ')}</b>` + (blacks.length? ` · czarne: <b>${blacks.map(fmt).join(', ')}</b>` : ' · same białe');
      hold.innerHTML=''; hold.appendChild(kbdSVG({from:48,to:83,marks,names:nm,onKey:(mm,r)=>{playMidi(mm);flashKey(r.ownerSVGElement,mm);}}));
      bar.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.k===k)));
      return midis;
    }
    roots.forEach(k=>{ const b=h('button',{class:'key','data-k':k},fmt(k)); b.onclick=()=>{ playSeq(show(k),0.28,0.45); }; bar.appendChild(b); });
    el.append(h('div',{class:'kbd-panel'},bar,cap,hold));
    show('C');
  },
  'chord-builder'(el){
    const cap = h('div',{class:'cap'});
    const hold = h('div');
    let root='C', q='';
    const roots = h('div',{class:'row',style:'margin-bottom:8px'});
    ['C','D','E','F','G','A','B','Bb','Eb','F#'].forEach(r=>{ const b=h('button',{class:'key','data-k':r},fmt(r)); b.onclick=()=>{root=r;draw(true);}; roots.appendChild(b); });
    const qs = h('div',{class:'seg',role:'group','aria-label':'Rodzaj akordu'});
    [['','dur'],['m','moll'],['dim','zmniejszony'],['7','z septymą (7)']].forEach(([v,l])=>{ const b=h('button',{'data-q':v},l); b.onclick=()=>{q=v;draw(true);}; qs.appendChild(b); });
    function draw(play){
      const c = parseChord(root+q);
      roots.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.k===root)));
      qs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.q===q)));
      const names = c.pcs.map((p,i)=>{
        // pisownia: bemolowa dla podstaw z b albo dla molowych tercji
        const flat = root.includes('b') || ((q==='m'||q==='dim'||q==='7') && i>0 && !root.includes('#'));
        return (flat?PC_NAME_FLAT:PC_NAME_SHARP)[p];
      });
      const fn = q==='' ? 't' : q==='m' ? 's' : 'd';
      const nm={}; const base=60+c.pcs[0];
      c.pcs.forEach((p,i)=>{ nm[base+((p-c.pcs[0]+12)%12)]=fmt(names[i]); });
      const label = q==='dim' ? root+'°' : root+q;
      const iv = c.pcs.slice(1).map((p,i)=>((p-c.pcs[i]+12)%12));
      cap.innerHTML = `<b>${fmt(label)}</b> = <b>${names.map(fmt).join(' – ')}</b> · odstępy: ${iv.join(' + ')} półtony`;
      hold.innerHTML=''; hold.appendChild(kbdSVG({from:60,to:83,marks:chordMarks(c.pcs,fn),names:nm,onKey:(m,r)=>{playMidi(m);flashKey(r.ownerSVGElement,m);}}));
      if(play) strike(c.pcs);
    }
    el.append(h('div',{class:'kbd-panel'},h('div',{class:'cap'},'Zbuduj akord: wybierz podstawę i rodzaj.'),roots,qs,h('div',{style:'height:10px'}),cap,hold));
    draw(false);
  },
  'ear-majmin'(el){
    let ans=null, ok=0, tot=0;
    const fb = h('div',{class:'fb muted',style:'margin-top:8px;min-height:1.4em'});
    const st = h('div',{class:'stats'});
    const upd=()=>{ st.innerHTML=`trafione: <b>${ok}</b> / <b>${tot}</b>`; };
    const newQ=()=>{
      const roots=['C','D','E','F','G','A','Bb','Eb'];
      const r=roots[Math.floor(Math.random()*roots.length)];
      ans = Math.random()<.5 ? '' : 'm';
      strike(parseChord(r+ans).pcs,1.4);
      fb.textContent='Słuchaj… dur czy moll?';
      el._r=r;
    };
    const guess=(g)=>{
      if(ans===null){ fb.textContent='Najpierw kliknij „Zagraj akord".'; return; }
      tot++;
      if(g===ans){ ok++; fb.innerHTML=`✓ Tak! To było <b>${fmt(el._r+ans)}</b>.`; }
      else { fb.innerHTML=`✗ To było <b>${fmt(el._r+ans)}</b> (${ans?'moll':'dur'}). Posłuchaj jeszcze raz przyciskiem „powtórz".`; }
      upd(); const a=ans; ans=null; el._last=a;
    };
    const again=()=>{ const a = ans!==null?ans:el._last; if(el._r!=null && a!=null) strike(parseChord(el._r+a).pcs,1.4); };
    el.append(h('div',{class:'card'},
      h('div',{class:'row'},
        h('button',{class:'btn primary',onclick:newQ},'▶ Zagraj akord'),
        h('button',{class:'btn',onclick:()=>guess('')},'Dur (jasny)'),
        h('button',{class:'btn',onclick:()=>guess('m')},'Moll (ciemny)'),
        h('button',{class:'btn ghost small',onclick:again},'↻ powtórz')),
      fb, st));
    upd();
  },
  'degree-table'(el){
    const chords = chordsFor('C');
    const nodes = h('div',{class:'nodes'});
    chords.forEach(ch=>{
      const q = ch.name.endsWith('°')?'zmniejszony':ch.name.endsWith('m')?'moll':'dur';
      const b = h('button',{class:'node '+ch.fn,html:`<div class="rn">${ch.rn} · ${q}</div><div class="name">${fmt(ch.name)}</div><div class="chipnotes">${ch.notes.map(n=>`<span>${fmt(n)}</span>`).join('')}</div>`});
      b.onclick=()=>{strike(ch.pcs);ring(b);};
      nodes.appendChild(b);
    });
    el.append(nodes);
  },
  'roles-table'(el){
    const tbl = h('div',{class:'card',style:'overflow-x:auto'});
    let html = '<table style="width:100%;border-collapse:collapse;font-size:.92rem"><tr><th style="text-align:left;padding:6px;color:var(--faint);font-weight:500">gama</th><th style="text-align:left;padding:6px" class="t-c">tonika (I vi iii)</th><th style="text-align:left;padding:6px" class="s-c">subdominanta (IV ii)</th><th style="text-align:left;padding:6px" class="d-c">dominanta (V vii°)</th></tr>';
    ORDER.forEach(k=>{
      const c=chordsFor(k);
      const g=(idx)=>idx.map(i=>`<button class="chord-chip ${c[i].fn}" data-c="${c[i].name}">${fmt(c[i].name)}</button>`).join(' ');
      html += `<tr style="border-top:1px solid var(--line)"><td style="padding:6px" class="mono">${fmt(k)}</td><td style="padding:6px">${g([0,5,2])}</td><td style="padding:6px">${g([3,1])}</td><td style="padding:6px">${g([4,6])}</td></tr>`;
    });
    tbl.innerHTML = html+'</table>';
    tbl.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{ const n=b.dataset.c.replace('°','dim'); strike(parseChord(n).pcs); ring(b,'lit'); });
    el.append(tbl);
  },
};

const ViewTeoria = {
  title:'Teoria',
  render(root, sub){
    const done = prefs.get('teoria.done',{});
    let idx = Math.max(0, LESSONS.findIndex(l=>l.id===sub));
    if(!sub){ const last = prefs.get('teoria.last',null); const li=LESSONS.findIndex(l=>l.id===last); if(li>=0) idx=li; }

    const nav = h('nav',{class:'lesson-nav','aria-label':'Lekcje'});
    const main = h('article',{class:'lesson'});
    root.append(
      h('header',{style:'margin-bottom:26px'},
        h('p',{class:'kicker'},'teoria od zera, po ludzku'),
        h('h1',null,'Kurs ', h('em',null,'harmonii'),' w 10 krótkich lekcjach'),
        h('p',{class:'lead'},'Każda lekcja: posłuchaj → zrozum → zagraj przy pianinie → sprawdź się. Idź po kolei — każda buduje na poprzedniej. Klikaj wszystkie przyciski ▶.')),
      h('div',{class:'lesson-layout'}, nav, main));

    function drawNav(){
      nav.innerHTML='';
      LESSONS.forEach((l,i)=>{
        const b = h('button',{'aria-current':String(i===idx)}, h('span',{class:'n'},String(i+1)), l.title, done[l.id]?h('span',{class:'ck',title:'zaliczone'},'✓'):null);
        b.onclick=()=>{ location.hash='#teoria/'+l.id; };
        nav.appendChild(b);
      });
    }
    function drawLesson(){
      const l = LESSONS[idx];
      prefs.set('teoria.last', l.id);
      main.innerHTML = l.body();
      main.querySelectorAll('[data-widget]').forEach(w=>{ const f=LessonWidgets[w.dataset.widget]; if(f) f(w); });
      wireListens(main);
      if(l.quiz && l.quiz.length){
        main.appendChild(quizBox('Sprawdź się', l.quiz, ()=>{ done[l.id]=true; prefs.set('teoria.done',done); drawNav(); }));
      }else{
        const b=h('button',{class:'btn',style:'margin-top:18px'},'✓ Oznacz jako przeczytane');
        b.onclick=()=>{ done[l.id]=true; prefs.set('teoria.done',done); drawNav(); b.textContent='✓ Zaliczone'; };
        main.appendChild(b);
      }
      const prev = LESSONS[idx-1], next = LESSONS[idx+1];
      main.appendChild(h('div',{class:'lesson-foot'},
        prev ? h('a',{class:'btn',href:'#teoria/'+prev.id},'← '+prev.title) : h('span'),
        next ? h('a',{class:'btn primary',href:'#teoria/'+next.id},next.title+' →') : h('a',{class:'btn primary',href:'#nuty'},'Dalej: nauka nut →')));
      drawNav();
    }
    drawLesson();
  }
};
