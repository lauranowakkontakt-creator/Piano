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


/* Piosenki Laury — akordy z angielskich wersji,
   tekst po polsku z akordami nad słowami. */
const SEED_SONGS = [
{ id:'seed-blizej', title:'Bliżej (Closer)', artist:'Bethel Music · tł. Winnica Worship', key:'E', bpm:70, beats:4,
  chords:`[Intro] A B C#m B | A B C#m B
[Zwrotka] C#m B E A | C#m B E A
[Refren] E B C#m A E | B C#m A
[Interludium] F#m E A | F#m E A
[Bridge] A E B C#m | A E B C#m`,
  lyrics:`[Intro — 2×]
[A] [B] [C#m] [B]

[Zwrotka]
[C#m]Twa miłość zdobyła [B]mnie
I całe me [E]serce, całe me [A]serce
[C#m]Dziś to, czego pragnę, to [B]być
Z Tobą na [E]zawsze, z Tobą na [A]zawsze

[Refren 1]
[E]Przyciągnij mnie do [B]siebie
Zabierz trochę [C#m]głębiej
Pragnę poznać [A]Cię
Poznać serce [E]Twe

Wiem, miłość Twa jest [B]słodsza,
Niż miłość tego [C#m]świata
Pragnę poznać [A]Cię
Poznać serce Twe

[Interludium — 2×]
[F#m] [E] [A]

[Bridge]
[A]Ooo [E]ooo,
[B]Jak wielka jest Twa [C#m]miłość
[A]Ooo [E]ooo,
[B]Cudowna [C#m]miłość

[Refren 2]
[E]Przyciągnij mnie do [B]siebie
Zabierz trochę [C#m]głębiej
Pragnę poznać [A]Cię
Poznać serce [E]Twe

Twa miłość jest [B]silniejsza,
Niż wszystko, z czym się [C#m]zmagam
Pragnę poznać [A]Cię
Poznać serce [E]Twe`,
  notes:`Tekst: tłumaczenie Winnica Worship (oryginał: Bethel Music). Akordy przeniesione z angielskiej wersji — każdy stoi nad tym słowem, nad którym był w oryginale.
Tonacja E-dur · 4/4 · ok. 70 BPM.

KOLEJNOŚĆ: Intro ×2 → Zwrotka → Refren 1 → Interludium ×2 → Bridge (×2 lub więcej) → Refren 2.

HARMONIA: E (I, dom), A (IV, ruch), B (V, napięcie), C#m (vi, dom smutniejszy), F#m (ii, ruch).
• Zwrotka startuje od C#m, nie od E — dlatego brzmi tęsknie. E pojawia się dopiero w połowie linii.
• Zwrotka: C#m → B → E → A — vi, V, I, IV.
• Refren: E → B → C#m → A — klasyczne I–V–vi–IV.
• Interludium F#m → E → A: ii – I – IV, spokojny ruch wokół domu.

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
{ id:'seed-surrender', title:'Ulegam (I Surrender)', artist:'Hillsong Worship · tł. Winnica Worship', key:'F', bpm:77, beats:4,
  chords:`[Intro] Dm F C Bb
[Zwrotka 1] Dm F C Bb | Dm F C Bb
[Tag] Dm
[Interludium] Dm F C Bb
[Zwrotka 2] Dm F C Bb | Dm F C Bb
[Refren] Dm F Gm Bb
[Interludium 2] Bb F C | Gm Dm C
[Bridge] Bb F C Gm Dm C | Bb F C Gm Dm C`,
  lyrics:`[Intro — każdy akord 2 takty]
[Dm] [F] [C] [Bb]

[Zwrotka 1]
[Dm]Jestem tu, na moich [F]kolanach znów.
Poddaję [C]się, poddaję [Bb]się.
[Dm]Szukam Cię, Ty wciąż [F]przyciągasz mnie,
Tak pragnę [C]Cię, tak pragnę [Bb]Cię

[Tag]
Ja [Dm]ulegam

[Interludium — każdy akord 2 takty]
[Dm] [F] [C] [Bb]

[Zwrotka 2]
[Dm]Obmyj mnie w łasce i [F]w prawdzie Twej,
Ciebie dziś [C]chcę
Ciebie dziś [Bb]chcę

[Dm]Wpadam w ramiona Twe
Gdy płaczę [F]słyszysz mnie
Więc do mnie [C]mów
Ty do mnie [Bb]mów

[Refren]
Ja [Dm]ulegam
Ja [F]ulegam
Chcę bardziej [Gm]poznać Cię
Chcę bardziej [Bb]poznać Cię

[Interludium 2]
[Bb] [F] [C] [C] [Gm] [Dm] [C] [C]

[Bridge]
Jak [Bb]gwałtowny [F]wiatr
Duchu [C]we mnie wiej,
Poprowadź [Gm]tak, poprowadź [Dm]tak, jak [C]chcesz

Jak [Bb]potężny [F]sztorm
Obudź [C]duszę mą
Używaj [Gm]tak, używaj [Dm]tak, jak [C]chcesz`,
  notes:`Tekst: tłumaczenie Winnica Worship (oryginał: Hillsong Worship). Akordy z angielskiej wersji, przeniesione nad odpowiednie słowa.
Tonacja F-dur (oryginalna wg WorshipTogether), choć piosenka zaczyna się i kręci wokół Dm · 4/4 · 77 BPM.

KOLEJNOŚĆ: Intro → Zwrotka 1 → Tag „Ja ulegam" → Interludium → Zwrotka 2 → Refren → Interludium 2 → Bridge (×2 lub więcej) → Refren.

HARMONIA: F (I, dom), C (V, napięcie), B♭ (IV, ruch), Dm (vi, dom smutniejszy), Gm (ii, ruch).
• Zwrotka to jedna pętla: Dm → F → C → B♭, każdy akord po 2 takty — vi – I – V – IV.
• Start od Dm, nie od F — dlatego całość brzmi jak modlitwa na kolanach, a nie jak hymn. Appka może podpowiadać d-moll; dom to jednak F.
• Refren: Dm → F → Gm → B♭. Gm zamiast C to nowy kolor — tu tekst mówi „chcę bardziej poznać Cię".
• Bridge: B♭ → F → C → Gm → Dm → C. Startuje z B♭ i idzie w górę jak wiatr; kończy na C, więc chce się go powtarzać.
• W pliku z akordami pierwsza linia bridge'u miała B♭m — w drugiej połowie jest B♭, więc tu też jest B♭. Jeśli w nagraniu słychać molowy, zmień.

EMOCJE W GŁOSIE (plan):
• Zwrotki — cicho, blisko, prawie mówione. Dużo powietrza.
• „Ja ulegam" — miękko, z oddechem przed słowem.
• Bridge — rośnie: „Jak gwałtowny wiatr" pełnym głosem, „Poprowadź tak" na podparciu, potem wyciszenie do refrenu.`},
{ id:'seed-famous-for', title:'Wierzę Ci (Famous For)', artist:'Tauren Wells · tł. Winnica Worship', key:'Bb', bpm:86, beats:4,
  chords:`[Zwrotka 1] Eb Gm F | Eb Gm F | Eb Bb F Eb | Eb Gm F | Eb Gm F | Eb Bb F Eb
[Refren] Eb | F | Gm | F/A | Eb | F | Gm | F/A
[Tag] Eb Gm F | Eb Gm F
[Zwrotka 2] Eb Gm F | Bb/D Eb Gm F | Bb/D Eb Gm F | Eb Gm F
[Bridge] Gm | Bb Eb | Bb F | Gm | Bb Eb | Bb | F`,
  lyrics:`[Zwrotka 1]
Nie [Eb]boję się, [Gm]bo [F]wierzę Ci
Nie [Eb]wątpię, [Gm]bo wciąż [F]widzę, że
Wier[Eb]nością [Bb]swą jak [F]tarczą ciągle [Eb]mnie chronisz

Na[Eb]dzieję [Gm]mam w [F]Imieniu Twym
A w [Eb]łasce [Gm]Twej jest [F]moja moc
Wier[Eb]nością [Bb]swą jak [F]tarczą ciągle [Eb]mnie chronisz

[Refren]
Przeprowadź [Eb]przez wody
Przeprowadź [F]przez ogień
Zrób to, z [Gm]czego znamy Cię
To, [F/A]z czego znamy Cię

Ożyw [Eb]suche kości
Ucisz [F]głos niewiary
Zrób to, z [Gm]czego znamy Cię
To, [F/A]z czego znamy Cię

[Tag]
[Eb]Wierzę [Gm]Ci, [F]Jezu
Tak [Eb]wierzę [Gm]Ci, [F]Jezu

[Zwrotka 2]
Mi[Eb]łością [Gm]swą [F]wypełnij mnie
[Bb/D]A Twoja [Eb]moc niech [Gm]objawia [F]się
[Bb/D]Duchu [Eb]przyjdź, na[Gm]pełniaj [F]nas
Ciągle [Eb]na [Gm]nowo [F](O Panie nasz)

[Bridge — 2×]
Mój [Gm]niezmierzony Bóg
[Bb]Hojny w do[Eb]broci swej
Ty [Bb]wciąż zachwycasz [F]mnie

Twe [Gm]Imię mocą jest
[Bb]Wiem, nie za[Eb]chwiejesz się
Nic [Bb]nie zatrzyma Cię
Wszystko [F]możliwe w Tobie jest`,
  notes:`Tekst: tłumaczenie Winnica Worship (oryginał: Tauren Wells „Famous For (I Believe)"). Akordy z angielskiej wersji, przeniesione nad odpowiednie słowa.
Tonacja B-dur (w appce Bb, oryginalna wg WorshipTogether) · 4/4 · 86 BPM.

KOLEJNOŚĆ: Zwrotka 1 → Refren → Tag → Zwrotka 2 → Refren → Tag → Bridge ×2 → Refren → Tag.

HARMONIA: B♭ (I, dom), E♭ (IV, ruch), F (V, napięcie), Gm (vi, dom smutniejszy).
• Zwrotka kręci się wokół E♭ → Gm → F i prawie nie dotyka domu — B♭ pojawia się tylko na „wiernością swą". Stąd uczucie czekania.
• Refren idzie w górę: E♭ → F → Gm, a potem F/A — F z A w basie. Bas wspina się E♭ → F → G → A i prowadzi z powrotem do E♭.
• Bb/D w zwrotce 2 to B♭ z D w basie: bas idzie D → E♭, miękkie wejście w każdą linię.
• Bridge: Gm → B♭ → E♭ → B♭ → F. Polski tekst ma w pierwszej części 3 linie, w drugiej 4 — akordy idą tak samo, rozkładasz je na słowa.
• W zwrotce 1 akordy (także na WorshipTogether) mają samo „B" — w zwrotce 2 w tym samym miejscu jest Bb, a H-dur nie pasuje do tonacji, więc tu też jest Bb.

EMOCJE W GŁOSIE (plan):
• Zwrotki — spokojna pewność, nie strach: mówione, ciepłe.
• Refren — odwaga: „Przeprowadź przez wody" pełnym głosem, fraza rośnie do „znamy Cię".
• Tag „Wierzę Ci, Jezu" — prosto i szczerze, drugi raz mocniej.
• Bridge — narasta przy każdym powtórzeniu, kulminacja na „Wszystko możliwe w Tobie jest".`},
{ id:'seed-widze-zwyciestwo', title:'Widzę zwycięstwo', artist:'Michał Król, Melania Król', key:'A', bpm:61, beats:4,
  chords:`[Zwrotka] D A F#m E | D A F#m E
[Refren] D A F#m E | D A F#m E
[Bridge] F#m E/G# A | A Bm A | Bm A E/G#`,
  lyrics:`[Zwrotka 1]
Kiedy świat się [D]chwieje [A]
Ty dajesz [F#m]pewny grunt
Trzymasz [E]mocno
Zawsze ze mną [D]jesteś [A]
Gdy nad[F#m]ciąga wróg
Nie od[E]chodzisz

[Zwrotka 2]
Ty stoisz [D]przy mnie [A]
I zamieniasz [F#m]mój lęk
W chęć [E]do walki
Dajesz mi [D]siłę [A]
Twoje Słowo [F#m]to miecz
Wiara [E]tarczą jest

[Refren]
[D]Widzę zwycięstwo gdy wi[A]dzę krzyż
[F#m]Ty nie przegrałeś nigdy [E]żadnej z bitw
[D]Bez względu na to co wy[A]darzy się
Wiem, że ni[F#m]gdy nie zawie[E]dziesz mnie

[D]Odwieczny plan wyko[A]nałeś już
[F#m]Ten z którym walczę jest [E]u Twoich stóp
[D]To Twoje imię moją [A]siłą jest
Wiem, że ni[F#m]gdy nie zawie[E]dziesz mnie

[Zwrotka 3]
Wiem, że jesteś [D]wierny [A]
Każde z [F#m]Twoich słów
Się [E]wypełni
Nigdy się nie [D]zmienisz [A]
Wczoraj, [F#m]jutro i dziś
Jesteś [E]Bogiem

[Zwrotka 4]
Ty możesz [D]wszystko [A]
Nie zapo[F#m]mnę, że
Jesteś [E]dobry
I znasz moją [D]przyszłość [A]
Będę [F#m]wierzyć Ci
Nie [E]poddam się

[Bridge]
[F#m]Obietnice spełniają się
[E/G#]w Tobie
[A]Ostateczne
[A]Zwycięstwo jest Twoje
[Bm]Sło[A]wo
Wyko[Bm]na[A]ło [E/G#]się`,
  notes:`Tekst i akordy: Michał Król, Melania Król (michalkrol.com.pl).
Tonacja A-dur · 4/4 · 61 BPM.

W PDF akordy były tylko nad zwrotką 1, pierwszą połową refrenu i bridge'em. Zwrotki 2–4 i druga połowa refrenu mają ten sam układ linijek, więc akordy są przeniesione w te same miejsca — sprawdź z nagraniem.
W bridge'u w PDF jest „E/G#m" — to E z G# w basie (E/G#), tak jest wpisane.

HARMONIA: A (I, dom), D (IV, ruch), E (V, napięcie), F#m (vi, dom smutniejszy), Bm (ii, ruch).
• Zwrotka i refren to ta sama pętla: D → A → F#m → E — IV – I – vi – V. Start od D, nie od A, więc fraza zawsze „podnosi się" do domu.
• Każda linia kończy się na E (V) — napięcie, które ciągnie do następnej linii.
• Bridge: F#m → E/G# → A — bas idzie schodkami w górę F# → G# → A, jak wspinanie się do „Ostateczne zwycięstwo".
• „Słowo wykonało się": Bm → A dwa razy, potem E/G# — zawieszenie przed powrotem do refrenu.

EMOCJE W GŁOSIE (plan):
• Zwrotki — spokojna pewność, ciepło, bez forsowania.
• Refren — zwycięsko, ale nie krzykiem: „Widzę zwycięstwo" na pełnym oddechu.
• Bridge — rośnie od „Obietnice" do „Ostateczne zwycięstwo", „Słowo wykonało się" szeroko i powoli.`},
{ id:'seed-nothing-else', title:'Nic innego (Nothing Else)', artist:'Cody Carnes · tł. Winnica Worship', key:'C', bpm:68, beats:4,
  chords:`[Intro] Dm7add4 F C Csus C | Dm7add4 Fmaj7 C Csus C
[Refren] Dm7add4 F2 C | Dm7add4 F2 C Csus C | Dm7add4 F2 C | Dm7add4 F2 C
[Zwrotka] F2 | C/E | F2 | C Csus C
[Bridge] Dm7add4 F2 Am7 Gsus4
[Koniec] Gsus4`,
  lyrics:`[Intro]
[Dm7add4] [F] [C] [Csus] [C]
[Dm7add4] [Fmaj7] [C] [Csus] [C]

[Refren]
Jestem tutaj z [Dm7add4]Tobą [F2]
Chce przebywać [C]nisko u Twych stóp
Czuję, że to [Dm7add4]święty mo[F2]ment
Już zawsze chcę [C]tu [Csus]być [C]

Nie jestem tu dla [Dm7add4]darów [F2]
Jezu nic nie [C]jesteś dłużny mi
Bardziej niż [Dm7add4]to co mi możesz [F2]dać
Chcę ciebie [C]mieć

[Zwrotka 1]
Prze[F2]praszam, że tak wiele udawałem
Prze[C/E]praszam, że śpiewałem inną pieśń
Weź mnie [F2]tam, na sam początek
Otwieram swoje serce [C]znów [Csus] [C]

[Zwrotka 2]
Prze[F2]praszam, za moje własne, wielkie plany
Prze[C/E]praszam, zapomniałem, że wystarczysz
Weź mnie [F2]tam, na sam początek
Otwieram swoje serce [C]znów [Csus] [C]

[Refren]
Jestem tutaj z [Dm7add4]Tobą [F2]
Chce przebywać [C]nisko u Twych stóp
Czuję, że to [Dm7add4]święty mo[F2]ment
Już zawsze chcę [C]tu [Csus]być [C]

Nie jestem tu dla [Dm7add4]darów [F2]
Jezu nic nie [C]jesteś dłużny mi
Bardziej niż [Dm7add4]to co mi możesz [F2]dać
Chcę ciebie [C]mieć [Csus] [C]

[Bridge — 3×]
Ja Ciebie [Dm7add4]chcę
Ciebie [F2]chcę
[Am7]Ciebie chcę
Nic innego [Gsus4]już

[Koniec]
[Gsus4]`,
  notes:`Tekst: tłumaczenie Winnica Worship (oryginał: Cody Carnes). Akordy z angielskiej wersji (WorshipTogether), przeniesione nad odpowiednie słowa.
Tonacja C-dur · 4/4 · 68 BPM.

KOLEJNOŚĆ: Intro → Refren → Zwrotka 1 → Zwrotka 2 → Refren → Bridge ×3 → akord końcowy Gsus4.

ZAPIS AKORDÓW: w oryginale jest Dm7(4) i G(4). Tu są jako Dm7add4 (Dm7 z dodaną kwartą: D F A C + G) i Gsus4 (G bez tercji: G C D) — te same dźwięki, zapis, który appka rozpoznaje.

HARMONIA: C (I, dom), F (IV, ruch), Dm (ii, ruch), Am (vi, dom smutniejszy), G (V, napięcie).
• Refren: Dm7add4 → F2 → C — ii – IV – I. Bez dominanty G, więc wraca do domu miękko, bez „pchania".
• Dm7add4 i F2 mają wspólne dźwięki (F, A, C, a do tego G) — dlatego przejście jest prawie niesłyszalne, jak jedno długie brzmienie.
• Csus → C: zawieszenie i rozwiązanie na „być" i „znów" — mały oddech na końcu frazy.
• Zwrotka: F2 → C/E — bas schodzi F → E, jak przeprosiny, bez nacisku.
• Bridge: Dm7add4 → F2 → Am7 → Gsus4. Kończy na Gsus4 i nie wraca do C — piosenka zostaje otwarta.

EMOCJE W GŁOSIE (plan):
• Refren — intymnie, cicho, jak rozmowa sam na sam.
• Zwrotki — szczerze, z pokorą, prawie mówione.
• Bridge — za każdym razem trochę mocniej; „Nic innego już" na końcu znowu cicho.`},
{ id:'seed-i-belong', title:'Należę do Jezusa (I Belong To Jesus)', artist:'Bethel Music · tł. Winnica Worship', key:'A', bpm:67, beats:4,
  chords:`[Intro] D A/C# E | D A/C# E
[Zwrotka] D A/C# E | D A/C# E | D F#m E | D A/C# E
[Refren] A A/C# D | E F#m D A | A A/C# D | E F#m D A
[Przejście] D A E | D F#m E
[Bridge 1] D | A E | D F#m E | D | F#m E | D F#m E
[Bridge 2] Bm | F#m E | D F#m E | Bm | F#m E A/C# | D F#m E
[Tag] F#m | D A
[Spontaniczny] F#m D | A`,
  lyrics:`[Intro]
[D] [A/C#] [E] [D] [A/C#] [E]

[Zwrotka 1]
Gdy strach mnie [D]ogarnie, [A/C#]nie wycofam [E]się
Nawet w do[D]linie, wy[A/C#]starczysz mi Ty [E]sam
Gdy grunt się za[D]trzęsie, [F#m]będę pewnie [E]stać
[D]Wystarczysz [A/C#]mi Ty [E]sam

[Refren]
Ojcze w [A]niebie, [A/C#]Ty jesteś [D]ze mną
[E]Strach już nie po[F#m]kona mnie, [D]należę do [A]Jezusa
Już nie jestem [A]sam, [A/C#]Ty mnie nie o[D]puścisz
[E]Strach już nie po[F#m]kona mnie, [D]należę do [A]Jezusa

[Zwrotka 2]
Gdy przyjdzie [D]presja, [A]nie wycofam [E]się
Nawet w trud[D]nościach, wy[A]starczysz mi Ty [E]sam
W obliczu [D]pytań, [F#m]nie zachwieję [E]się
[D]Wystarczysz [A/C#]mi Ty [E]sam

[Refren]
Ojcze w [A]niebie, [A/C#]Ty jesteś [D]ze mną
[E]Strach już nie po[F#m]kona mnie, [D]należę do [A]Jezusa
Już nie jestem [A]sam, [A/C#]Ty mnie nie o[D]puścisz
[E]Strach już nie po[F#m]kona mnie, [D]należę do [A]Jezusa

[Przejście]
[D] [A] [E] [D] [F#m] [E]

[Bridge 1]
W czasie [D]sztormu, w czasie deszczu
W czasie [A]burzy, w czasie [E]lęku
Byłeś [D]ze mną, zawsze [F#m]stałeś obok [E]mnie
W [D]moim bólu i ciemności
Gdy u[F#m]padnę w mej [E]słabości
Będziesz [D]ze mną, zawsze [F#m]staniesz obok [E]mnie

[Bridge 2]
Mój [Bm]Pasterzu, mój Obrońco
Ty się [F#m]troszczysz i [E]podnosisz
W każdym [D]czasie jesteś [F#m]zawsze blisko [E]mnie
Jesteś [Bm]dobry, jesteś wierny
Moja [F#m]miłość, moja [E]przyszłość [A/C#]
W każdym [D]czasie jesteś [F#m]zawsze blisko [E]mnie

[Tag — 8×]
Strach już nie po[F#m]kona mnie
[D]Należę do [A]Jezusa

[Spontaniczny refren]
Choćbym nawet [F#m]szedł przez dolinę [D]cienia śmierci i łez
Zła się [A]nie ulęknę`,
  notes:`Tekst: tłumaczenie Winnica Worship (oryginał: Bethel Music, The McClures). Akordy z angielskiej wersji (WorshipTogether), przeniesione nad odpowiednie słowa.
Tonacja A-dur · 4/4 · 67 BPM, wolno.

KOLEJNOŚĆ: Intro → Zwrotka 1 → Refren → Zwrotka 2 → Refren → Przejście → Bridge 1 → Bridge 2 → Refren → Bridge 2 → Refren → Tag ×8 → Spontaniczny refren → Bridge 2 → Refren.

Po angielsku w przejściu śpiewa się „Oh I belong, I belong" — polskie tłumaczenie tej części nie ma, więc są same akordy.
W refrenie jedna polska linijka to dwie angielskie, dlatego na linię przypadają 3–4 akordy.

HARMONIA: A (I, dom), D (IV, ruch), E (V, napięcie), F#m (vi, dom smutniejszy), Bm (ii, ruch).
• A/C# to A z C# w basie. W zwrotce bas idzie D → C# → E: zwrotka startuje od D i nie ląduje w domu — dom przychodzi dopiero w refrenie.
• Refren: A → A/C# → D — bas wspina się A → C# → D, jak podnoszenie głowy. Potem E → F#m → D → A: każda linia kończy się w domu, na „Jezusa".
• Bridge 1 i 2 kończą każdą frazę na E (V) — napięcie, które ciągnie do następnej linii i do refrenu.
• Bridge 2 startuje od Bm (ii) — nowy, ciemniejszy kolor po bridge'u 1.

EMOCJE W GŁOSIE (plan):
• Zwrotki — spokojnie, cicho, z pewnością, że nie ma się czego bać.
• Refren — ciepło i pewnie, „należę do Jezusa" jak wyznanie.
• Bridge 1 → Bridge 2 — narasta; Bridge 2 pełnym głosem.
• Tag — zaczyna się cicho i rośnie z każdym powtórzeniem.`},
{ id:'seed-house-of-prayer', title:'Dom modlitwy (House of Prayer)', artist:'Eddie James · tł. Winnica Worship', key:'Am', bpm:72, beats:4,
  chords:`[Zwrotka] Am G/A Fmaj9 G2 | Am G/A Fmaj9 G2
[Refren] Am7 | Fmaj9 | Dm7 | Am G/B Fmaj9 G2
[Bridge] Am | Fmaj9 | Dm7 | Am G/B Fmaj9 G2`,
  lyrics:`[Zwrotka 1 — 2×]
[Am]Chcę na [G/A]zawsze [Fmaj9]już
Domem modli[G2]twy być

[Tag]
[Am]Szukam [G/A]Twarzy [Fmaj9]Twej
Twarzy [G2]Twej

[Zwrotka 2]
[Am]Tak, Ty [G/A]naucz [Fmaj9]mnie
Naucz jak [G2]modlić się
Jak modlić się

[Refren]
[Am7]Niech ogień twój nie gaśnie na ołtarzu mym
[Fmaj9]Niech ogień twój nie gaśnie na ołtarzu mym
[Dm7]Niech ogień twój nie gaśnie na ołtarzu mym
[Am]Chcę [G/B]domem [Fmaj9]modlitwy być [G2]

[Bridge]
[Am]Dzień i noc
Noc i dzień
[Fmaj9]Dzień i noc
Noc i dzień
[Dm7]Dzień i noc
Noc i dzień
[Am]Ogniu [G/B]modli[Fmaj9]twy płoń [G2]`,
  notes:`Tekst: tłumaczenie Winnica Worship (oryginał: Eddie James). Akordy z angielskiej wersji (Ultimate Guitar), przeniesione nad odpowiednie słowa.
Tonacja a-moll (równoległa do C-dur) · 4/4 · 72 BPM.
Bicie: ↓ ↓↑ ↓↑ ↓↑ (1, 2 i, 3 i, 4 i) — akcent na 1.

KOLEJNOŚĆ (jak w polskim PDF): Zwrotka 1 ×2 → Tag → Zwrotka 2 → Refren → Bridge. W praktyce części powtarza się swobodnie.

DO SPRAWDZENIA Z NAGRANIEM:
• Tag „Szukam Twarzy Twej" i Zwrotka 2 „Tak, Ty naucz mnie" nie mają akordów w angielskiej wersji, którą mam — dostały pętlę zwrotki (Am → G/A → Fmaj9 → G2).
• W refrenie i bridge'u pierwsza linia po angielsku jest śpiewana 3× (na Am7, Fmaj9, Dm7), więc po polsku też jest 3×.

HARMONIA: Am (i, dom), G (VII), F (VI), Dm (iv). W C-dur to vi, V, IV, ii.
• Zwrotka: Am → G/A → Fmaj9 → G2. G/A to G z A w basie — bas stoi na A, a akord nad nim się zmienia. Brzmi jak zawieszenie, modlitwa w miejscu.
• Fmaj9 i G2 to miękkie, „otwarte" akordy z dodanymi nutami (nona, sekunda) — brzmią jasno, nie ciężko.
• Refren: Am7 → Fmaj9 → Dm7, po jednej linii każdy — bas schodzi A → F → D. Potem Am → G/B → Fmaj9 → G2: bas A → B, i schodzi do F.
• Kończy się na G2, nie na Am — dlatego chce się wracać od początku.

EMOCJE W GŁOSIE (plan):
• Zwrotki — cicho, prosto, jak szept modlitwy.
• Refren — z każdym powtórzeniem linii trochę mocniej.
• Bridge „Dzień i noc" — rytmicznie, coraz pełniej; „Ogniu modlitwy płoń" szeroko.`},
{ id:'seed-no-one', title:'Kto jest jak Ty (No One)', artist:'Elevation Worship feat. Chandler Moore · tł. Winnica Worship', key:'D', bpm:70, beats:4,
  chords:`[Intro] A/D D A/G G | A/D D A/G G
[Zwrotka 1] D A | G | D | A G
[Zwrotka 2] Bm | G | D/F# | A G
[Refren] D A G | D A G | Bm | A | D/F# G | D A/C# G/B | G
[Bridge] A/D D A/D G/D A/D | G/D D
[Refrain] A | D | A G/B | D | G | D/F# Bm | A G | D`,
  lyrics:`[Intro]
[A/D] [D] [A/G] [G] [A/D] [D] [A/G] [G]

[Zwrotka 1]
[D]Jah[A]we
[G]Jahwe
[D]Święte Imię Twe
[A]W bojaźni uwiel[G]biamy Cię

[Zwrotka 2]
[Bm]Jahwe
[G]Jahwe
[D/F#]Święte Imię Twe
[A]Majestat Twój za[G]chwyca mnie

[Refren]
Czy jest ktoś, kto [D]może [A]Ci do[G]równać?
Czy jest ktoś, kto [D]może [A]Ci do[G]równać?
Jesteś [Bm]niezastąpiony
[A]Jesteś najwyższy
[D/F#]Niedoścignio[G]ny
Jahwe, nikt nie [D]może [A/C#]Ci do[G/B]równać
Kto [G]mógłby być jak Ty?

[Tag]
Kto [G]mógłby być jak Ty?

[Instrumental]
[A/D] [D] [A/G] [G] [A/D] [D] [A/G] [G]

[Bridge 1]
[A/D]Kto nas pro[D]wadzi do [A/D]miejsca wol[G/D]ności? [A/D]
Nasz Bóg, [G/D]nasz Bóg, nasz [D]Bóg
[A/D]Kto leczy [D]wszystkie [A/D]nasze cho[G/D]roby? [A/D]
Nasz Bóg, [G/D]nasz Bóg, nasz [D]Bóg
[A/D]Kto może [D]chodzić, [A/D]chodzić po [G/D]wodzie? [A/D]
Nasz Bóg, [G/D]nasz Bóg, nasz [D]Bóg
[A/D]Kto z mocą [D]zsyła, [A/D]zsyła swój [G/D]ogień? [A/D]
Nasz Bóg, [G/D]nasz Bóg, nasz [D]Bóg

[Bridge 2]
[A/D]Kto wygra [D]bitwę z [A/D]największym go[G/D]liatem? [A/D]
Nasz Bóg, [G/D]nasz Bóg, nasz [D]Bóg
[A/D]Kto może [D]lwom za[A/D]mykać [G/D]paszcze? [A/D]
Nasz Bóg, [G/D]nasz Bóg, nasz [D]Bóg
[A/D]Kto może [D]przyjąć [A/D]najwyższą [G/D]chwałę? [A/D]
Nasz Bóg, [G/D]nasz Bóg, nasz [D]Bóg
[A/D]Kto może [D]przyjąć [A/D]najwyższą [G/D]chwałę? [A/D]
Nasz Bóg, [G/D]nasz Bóg, nasz [D]Bóg

[Refrain 1]
Kto jest [A]jak Ty?
Kto jest jak [D]Ty?
Kto jest [A]jak [G/B]Ty?
Kto jest jak [D]Ty?
Nie ma [G]innego
Nie ma [D/F#]inne[Bm]go
Kto jest [A]jak [G]Ty?
Kto jest jak [D]Ty?

[Refrain 2]
Miłość [A]duszy mej
Miłość duszy [D]mej
Miłość [A]duszy [G/B]mej
Miłość duszy [D]mej
Nie ma [G]innego
Nie ma [D/F#]inne[Bm]go
Kto jest [A]jak [G]Ty?
Kto jest jak [D]Ty?

[Tag 1]
Wiem nie ma [A]nikogo ta[G]kiego, jak [D]Jezus

[Tag 2]
[A/D]Kto uz[D]drawia [A/D]jak [G/D]Jezus? [A/D]
O, [G/D]nikt jak [D]Jezus
[A/D]Kto [D]chroni [A/D]jak [G/D]Jezus? [A/D]
O, [G/D]nikt jak [D]Jezus
[A/D]Kto się [D]troszczy [A/D]jak [G/D]Jezus? [A/D]
O, [G/D]nikt jak [D]Jezus
[A/D]Kto [D]kocha [A/D]jak [G/D]Jezus? [A/D]
O, [G/D]nikt jak [D]Jezus
[A/D]Kto o [D]mnie zadba [A/D]tak jak [G/D]Jezus? [A/D]`,
  notes:`Tekst: tłumaczenie Winnica Worship (oryginał: Elevation Worship feat. Chandler Moore). Akordy z angielskiej wersji (Ultimate Guitar), przeniesione nad odpowiednie słowa.
Tonacja D-dur · 4/4 · tempo nie było podane — 70 BPM to szacunek, sprawdź z nagraniem.

KOLEJNOŚĆ: Intro → Zwrotka 1 + 2 → Instrumental → Zwrotka 1 + 2 → Refren → Instrumental → Zwrotka 1 + 2 → Refren → Instrumental → Bridge 1 → Bridge 2 → Refrain 1 → Refrain 2 → Tagi.
Po angielsku każda zwrotka to obie połowy (D… i Bm…), po polsku są to osobno Zwrotka 1 i Zwrotka 2.

DO SPRAWDZENIA Z NAGRANIEM:
• Tagu 1 i Tagu 2 („Kto uzdrawia jak Jezus?") nie ma w angielskich akordach. Tag 2 to pytanie–odpowiedź jak bridge, więc ma akordy bridge'u (A/D D A/D G/D | G/D D). Tag 1 ma koniec refrainu (A G D).
• Tag „Kto mógłby być jak Ty?" dostał G, jak ostatnia linia refrenu.

HARMONIA: D (I, dom), G (IV, ruch), A (V, napięcie), Bm (vi, dom smutniejszy).
• Intro i instrumental: A/D → D → A/G → G. Bas stoi na D, potem na G, a akordy nad nim się zmieniają — jak dwa długie oddechy.
• Bridge: cały na basie D (A/D, D, G/D) — bas „pedał" się nie rusza, a napięcie rośnie z każdym pytaniem. „Nasz Bóg" ląduje na D, w domu.
• Refren: D → A → G, potem schodzenie basu D → C# → B w „Jahwe, nikt nie może Ci dorównać" (D, A/C#, G/B).
• Refrain: A → D, A → G/B → D, G → D/F# → Bm — bas idzie G → F# → B, a całość krąży wokół domu.

EMOCJE W GŁOSIE (plan):
• Zwrotki „Jahwe" — cicho, z szacunkiem, długie samogłoski.
• Refren — rośnie do „Niedościgniony", szeroko na „Kto mógłby być jak Ty?".
• Bridge — pytania pewnie, odpowiedź „Nasz Bóg" jak okrzyk; Bridge 2 mocniej niż 1.
• Refrain „Miłość duszy mej" — ciepło, prawie szeptem, potem znów rośnie.`},
{ id:'seed-his-name', title:'Jego imię Jezus (His Name Is Jesus)', artist:'Jeremy Riddle · tł. Winnica Worship', key:'Em', bpm:70, beats:4,
  chords:`[Intro] Em Em Em Em
[Zwrotka] Em G | Am | C D
[Refren] Em | G | Am | C D
[Interludium] Em G Am C D
[Bridge] Em | G | Am | C D
[Outro] Em | G | Am | C D Em`,
  lyrics:`[Intro]
[Em] [Em] [Em] [Em]

[Zwrotka 1]
[Em]Tylko On ma zbawienia [G]moc
Tylko On przezwyciężył [Am]śmierć
Tylko On godzien [C]chwały [D]jest

[Zwrotka 2]
[Em]Nikt i nic nie zatrzyma [G]Go
Tylko w Nim pełnia życia [Am]jest
Jego krew zmyła każdy [C]grzech [D]

[Refren]
Jego imię [Em]Jezus
Jego imię [G]Jezus
Panów Pan i [Am]Królów Król
Dorad[C]ca nasz, po[D]tężny Bóg

[Zwrotka 3]
[Em]Cały świat wielbi Króla [G]chwał
Kłania się widząc Jego [Am]tron
Ziemia drży słysząc Jego [C]głos [D]

[Zwrotka 4]
[Em]Przyjdzie dzień, gdy ujrzymy [G]Go
Zabrzmi dźwięk, każdy odda [Am]hołd
I wyzna, że Jezus Panem [C]jest [D]

[Refren — 2×]
Jego imię [Em]Jezus
Jego imię [G]Jezus
Panów Pan i [Am]Królów Król
Dorad[C]ca nasz, po[D]tężny Bóg

[Interludium]
[Em] [G] [Am] [C] [D]

[Bridge]
On [Em]prowadzi nas
Wszechmogący Bóg
To [G]pokoju Pan
Wszechmogący Bóg
Wspa[Am]niały Król
Światłem świata On
Po[C]tężny [D]Bóg

[Tag]
[Em]Wielbimy Cię
[G]Składamy życie swe
[Am]Śpiewamy
[C]Wywyż[D]szamy [Em]`,
  notes:`Tekst: tłumaczenie Winnica Worship (oryginał: Jeremy Riddle). Akordy z angielskiej wersji (Ultimate Guitar), przeniesione nad odpowiadające polskie słowa.
Tonacja e-moll (równoległa do G-dur) · 4/4 · tempo nie było podane — 70 BPM to szacunek, sprawdź z nagraniem.

KOLEJNOŚĆ: Intro → Zwrotka 1 → Zwrotka 2 → Refren → Zwrotka 3 → Zwrotka 4 → Refren ×2 → Interludium → Bridge → Refren ×2 → Tag / Outro.

DO SPRAWDZENIA Z NAGRANIEM:
• W zwrotkach akordy są na końcach linijek, tak jak w angielskiej wersji (G, Am, C → D na ostatnim słowie).
• W polskim bridge'u jest 7 linijek, jak w angielskim — każdy akord stoi nad tą samą linijką co po angielsku.
• Tagu („Wielbimy Cię") nie ma w angielskich akordach. Dostał pętlę refrenu i outro (Em → G → Am → C → D → Em).

HARMONIA: Em (i, dom), G (III — jasny „brat" e-moll), Am (iv), C (VI), D (VII). W G-dur to vi, I, ii, IV, V.
• Cała piosenka to jedna pętla: Em → G → Am → C → D. Bas idzie w górę E → G → A → C → D — jak wznoszenie się.
• D na końcu każdej części (VII) ciągnie z powrotem do Em — dlatego pętla się nie kończy.
• Zwrotki trzymają Em długo — spokojne wyliczanie, kim jest Jezus.

EMOCJE W GŁOSIE (plan):
• Zwrotki — pewnie i spokojnie, jak wyznanie wiary.
• Refren — „Jego imię Jezus" pełnym głosem, rośnie do „potężny Bóg".
• Bridge — wyliczanie imion coraz mocniej, kulminacja na „Potężny Bóg".
• Tag — ciszej, uwielbienie.`},
{ id:'seed-holy-forever', title:'Święty na zawsze (Holy Forever)', artist:'Chris Tomlin · tł. Winnica Worship', key:'Db', bpm:72, beats:4,
  chords:`[Intro] Gb Bbm Absus | Db/F | Bbm Absus
[Zwrotka] Db | Gb Db | Bbm Ab(add4) Gb2 | Db | Gb Db | Bbm Ab(add4) Gb2
[Przedrefren] Gb2 Bbm | Ab(add4) | Bbm Gb2 | Gb2 Bbm | Ab(add4) | Bbm Ebm7
[Refren] Gb2 Bbm Ab(add4) | Db/F Bbm | Ebm7 Ab(add4) | Db Dbsus Db
[Refren cz. 2] Db/F Gb2 Bbm Ab(add4) | Db/F Bbm | Ebm7 Ab(add4) | Db Dbsus Db`,
  lyrics:`[Intro]
[Gb] [Bbm] [Absus] [Db/F] [Bbm] [Absus]

[Zwrotka 1]
Dziś [Db]wszystkie pokolenia
[Gb]Stają w uwiel[Db]bieniu
Śpie[Bbm]wając Baran[Ab(add4)]kowi chwały [Gb2]pieśń
I [Db]Ci którzy odeszli
I [Gb]Ci, którzy u[Db]wierzą
Zaś[Bbm]piewają Baran[Ab(add4)]kowi chwały [Gb2]pieśń

[Przedrefren]
I[Gb2]mię Twe jest najwyższe [Bbm]
I[Ab(add4)]mię Twe jest potężne
I[Bbm]mię Twe ponad wszystko [Gb2]jest
I[Gb2]mię Twe ponad trony [Bbm]
I[Ab(add4)]mię Twe ponad władze
I[Bbm]mię Twe ponad wszystko [Ebm7]jest

[Refren]
Chór aniołów [Gb2]brzmi - [Bbm]Świę[Ab(add4)]ty
Wszystko wielbi [Db/F]Cię - Świę[Bbm]ty
Wywyższony [Ebm7]Pan - Świę[Ab(add4)]ty
Święty na [Db]zawsze [Dbsus] [Db]

[Zwrotka 2]
[Db]Jeśli uwierzyłeś
Że [Gb]On wykupił [Db]Cię
[Bbm]Śpiewaj Baran[Ab(add4)]kowi chwały [Gb2]pieśń
[Db]Jeśli jesteś wolny
I [Gb]nosisz Jego [Db]imię
[Bbm]Śpiewaj Baran[Ab(add4)]kowi chwały [Gb2]pieśń
Śpie[Bbm]wajmy Baran[Ab(add4)]kowi chwały [Gb2]pieśń

[Refren]
Chór aniołów [Gb2]brzmi - [Bbm]Świę[Ab(add4)]ty
Wszystko wielbi [Db/F]Cię - Świę[Bbm]ty
Wywyższony [Ebm7]Pan - Świę[Ab(add4)]ty
Święty na [Db]zawsze [Dbsus] [Db]

[Refren cz. 2 (w PDF: Bridge)]
Śpiewa [Db/F]Kościół [Gb2]Twój - [Bbm]Świę[Ab(add4)]ty
To dla Króla [Db/F]chwał - Świę[Bbm]ty
Wywyższony [Ebm7]Pan - Świę[Ab(add4)]ty
Święty na [Db]zawsze [Dbsus] [Db]`,
  notes:`Tekst: tłumaczenie Winnica Worship (oryginał: Chris Tomlin — Brian Johnson, Chris Tomlin, Jason Ingram, Jenn Johnson, Phil Wickham). Akordy z angielskiej wersji (WorshipTogether), przeniesione nad odpowiadające polskie sylaby.
Tonacja D♭-dur (w appce Db) · 4/4 · 72 BPM, wolno.

KOLEJNOŚĆ: Intro → Zwrotka 1 → Przedrefren → Refren (pierwsza połowa) → Zwrotka 2 → Refren + Refren cz. 2 → Przedrefren ×2 → Refren + Refren cz. 2 → Tag („Wywyższony Pan - Święty / Święty na zawsze").

JAK DOPASOWANE:
• Zwrotki: polskie linijki mają tyle sylab co angielskie, więc akordy są na tych samych sylabach (np. „Śpie-[Bbm]wając Baran-[Ab]kowi chwały [Gb2]pieśń" = „To [Bbm]sing the song of a-[Ab]ges to the [Gb2]Lamb").
• „Święty" = „Ho-ly": akord na „Świę" i na „ty", tak jak na „Ho" i „ly".
• To, co w polskim PDF jest „Bridge" („Śpiewa Kościół Twój"), to po angielsku druga połowa refrenu („Hear Your people sing").
• Przedrefren: przed refrenem kończy się na Ebm7 (wersja 1). Za drugim razem, gdy idzie dwa razy z rzędu, pierwszy raz kończy się na Gb2.

ZAPIS AKORDÓW: Ab(add4) to A♭ z dodaną kwartą (D♭), Gb2 to G♭ z sekundą — miękkie, „otwarte" brzmienia.

HARMONIA: Db (I, dom), Gb (IV, ruch), Ab (V, napięcie), Bbm (vi, dom smutniejszy), Ebm7 (ii, ruch).
• Zwrotka: Db → Gb → Db, potem Bbm → Ab → Gb — schodzenie vi – V – IV, jak pokłon.
• Przedrefren krąży Gb → Bbm → Ab i nie wraca do domu — buduje oczekiwanie; Ebm7 na końcu otwiera drzwi do refrenu.
• Refren: Db/F to Db z F w basie — bas idzie F → G♭ i w górę. „Święty na zawsze" ląduje w domu, Dbsus → Db to ostatni oddech.

EMOCJE W GŁOSIE (plan):
• Zwrotki — spokojnie, szeroko, jak opowieść o pokoleniach.
• Przedrefren — narasta z każdą linijką „Imię Twe".
• Refren — „Święty" długo i pełnym głosem; „Święty na zawsze" miękko w dół.`},
{ id:'seed-used-to-this', title:'Codziennie więcej chcę (Used To This)', artist:'Elevation Worship & Maverick City Music · tł. Winnica Worship', key:'C', bpm:70, beats:4,
  chords:`[Intro] C Em7 Am7 Fsus2
[Zwrotka] C Em | Am | F C | Em | Am G | F
[Przedrefren] C G | Dm F | C G | Dm F
[Przejście] C Em Am F Dm
[Refren] C | Em Am | G F | Fm
[Interludium] C Em Am G F Fm | C Em Am G F Fm
[Bridge 1] C G | Dm C/E | F | C G | Dm C/E | F
[Bridge 2] C | G | Dm C/E | F
[Outro] C Em Am G F Fm | C Em Am G F Fm C`,
  lyrics:`[Intro]
[C] [Em7] [Am7] [Fsus2]

[Zwrotka 1]
[C](Gdy) jesteś [Em]tu
Czas stoi w [Am]miejscu
Nic nie jest [F]ważne tak jak [C]Ty
Jestem [Em]tu
Nic mnie nie [Am]go[G]ni
Już [F]nie muszę spieszyć się

[Przedrefren]
[C]Wieczność z Tobą jest jak [G]chwila
Już nie liczę minut
[Dm]Pragnę [F]Ciebie
[C]Szukam Twojej obec[G]ności
Duchu przyjdź w swej mocy
[Dm]Pragnę [F]Ciebie

[Przejście]
[C] [Em] [Am] [F] [Dm]

[Zwrotka 2]
[C]Wybacz [Em]mi
Ciągłe sta[Am]rania
By nieza[F]leżnie od Ciebie [C]żyć
Bliskość [Em]Twa
Była mi [Am]obca
Te[G]raz już [F]nie puszczę Cię

[Refren]
[C]Pragnę Ciebie
[Em]Tylko [Am]Ciebie
Nikt nie [G]dorówna [F]Ci
Kto jest jak [Fm]Ty?

[Interludium — 2×]
[C] [Em] [Am] [G] [F] [Fm]

[Bridge 1]
[C]Jeśli to [G]przedsmak nieba
[Dm]Codziennie więcej [C/E]chcę
[F]Codziennie więcej chcę

[C]Zapach Twej [G]obecności
[Dm]Codziennie więcej [C/E]chcę
[F]Codziennie więcej chcę

[Bridge 2]
[C]Codziennie więcej chcę
[G]Codziennie więcej chcę
[Dm]Codziennie więcej [C/E]chcę
[F]Codziennie więcej chcę

[Outro — 4×, na końcu C]
[C] [Em] [Am] [G] [F] [Fm]`,
  notes:`Tekst: tłumaczenie Winnica Worship (oryginał: Elevation Worship & Maverick City Music). Akordy z angielskiej wersji (Ultimate Guitar), przeniesione nad odpowiadające polskie linijki i sylaby.
Tonacja C-dur · 4/4 · tempo nie było podane — 70 BPM to szacunek, sprawdź z nagraniem.

KOLEJNOŚĆ: Intro → Zwrotka 1 → Przedrefren → Przejście → Zwrotka 2 → Przedrefren → Refren → Interludium ×2 → Bridge 1 → Bridge 2 → Przedrefren → Refren ×2 → Outro ×4.

JAK DOPASOWANE:
• Akordy idą za melodią, nie za znaczeniem. W zwrotce 1 polskie linijki są w innej kolejności niż angielskie („(Gdy) jesteś tu" to „Whenever I'm with You", a stoi tam, gdzie „Time stands still") — akordy są tam, gdzie wypadają w melodii: C → Em, Am, F → C, Em, Am → G, F.
• „I just want [F]You" = „Pragnę [F]Ciebie" — F na ostatnim słowie.
• „Nothing com[G]pares to [F]You" = „Nikt nie [G]dorówna [F]Ci" — G na trzeciej sylabie, F na ostatniej.
• Bridge 2 po angielsku to 4× „I could get used to this" (C, G, Dm → C/E, F). W polskim PDF tej części nie ma osobno — to 4× „Codziennie więcej chcę".

HARMONIA: C (I, dom), F (IV, ruch), G (V, napięcie), Am (vi), Em (iii), Dm (ii).
• Fm to „pożyczony" akord z c-moll (iv molowe). F → Fm: zmienia się jedna nuta (A → A♭) — robi się nagle tęskno i miękko. To serce tej piosenki: „Kto jest jak [Fm]Ty?".
• C/E w bridge'u to C z E w basie: bas idzie D → E → F, schodkami w górę.
• Zwrotka i interludium: C → Em → Am — bas schodzi C → B → A, spokojnie, bez pośpiechu („nic mnie nie goni").

EMOCJE W GŁOSIE (plan):
• Zwrotki — spokojnie, bez pośpiechu, jak rozmowa.
• Przedrefren — tęsknota rośnie, „Pragnę Ciebie" ciepło.
• Refren — prosto i szczerze, „Kto jest jak Ty?" miękko na Fm.
• Bridge — narasta z każdym „Codziennie więcej chcę"; Bridge 2 najpełniej.`},
{ id:'seed-more-i-seek', title:'Im więcej szukam (The More I Seek You)', artist:'Kari Jobe · tł. Winnica Worship', key:'F#', bpm:68, beats:4,
  chords:`[Zwrotka] F# C# | D#m B | F# C# | D#m B
[Refren] F# | C# | D#m | B | F# | C# | D#m | B
[Bridge] F# C# | D#m B`,
  lyrics:`[Zwrotka]
[F#]Im więcej [C#]szukam, [D#m]tym bardziej [B]znajdę
[F#]Im bardziej [C#]znajdę, [D#m]tym bardziej [B]kocham

[Refren]
[F#]Chcę siedzieć u Twoich stóp
[C#]Z kielicha Twego chcę pić
[D#m]Rytm serca Twojego czuć, [B]Twoją miłość
[F#]Głęboka tak jest, [C#]niż mogę bardziej znieść
[D#m]Rozpływam się w niej, [B]w Twym pokoju

[Bridge]
[F#]To co chcę, to [C#]zawsze być przy Tobie,
[D#m]Słyszeć Cię, Twój [B]Panie słodki głos`,
  notes:`Tekst: tłumaczenie Winnica Worship (oryginał: Kari Jobe). Akordy z angielskiej wersji (Ultimate Guitar), przeniesione nad odpowiadające polskie sylaby.
Tonacja Fis-dur (w appce F#) · 4/4 · tempo nie było podane — 68 BPM to szacunek, sprawdź z nagraniem.
Na Ultimate Guitar jest dopisek, że na nagraniu piosenka może brzmieć w innej tonacji — jeśli nie pasuje do głosu albo nagrania, przenieś ją przyciskami ♭/♯.

KOLEJNOŚĆ: Zwrotka (×2 lub więcej) → Refren → Zwrotka → Refren → Bridge → Refren.

JAK DOPASOWANE:
• Zwrotka: jedna polska linijka to dwie angielskie („The more I [C#]seek You / The more I [B]find You"), więc są w niej po dwa akordy z każdej angielskiej linijki: „[F#]Im więcej [C#]szukam, [D#m]tym bardziej [B]znajdę".
• Refren: polskich linijek jest 5, angielskich 8. Sylaby się zgadzają: „Rytm serca Twojego czuć, Twoją miłość" (7 + 4) śpiewa się w miejscu „Lay back against You and breathe / Feel Your heart beat" (7 + 4), więc D#m i B są tam, gdzie zaczynają się te dwie części. Tak samo „Głęboka tak jest, niż mogę bardziej znieść" (5 + 6) = „This love is so deep / It's more than I can stand" (F#, C#).
• Bridge: tej części nie ma w angielskich akordach. Dostał tę samą pętlę F# → C# → D#m → B — sprawdź z nagraniem.

HARMONIA: F# (I, dom), C# (V, napięcie), D#m (vi, dom smutniejszy), B (IV, ruch).
• Cała piosenka to jedna pętla I – V – vi – IV, tylko akordy zmieniają się raz na linijkę albo dwa razy.
• Na fortepianie F#-dur leży prawie cały na czarnych klawiszach — wygodnie dla ręki, choć wygląda strasznie w nutach.

EMOCJE W GŁOSIE (plan):
• Zwrotka — cicho i prosto, jak modlitwa powtarzana w kółko.
• Refren — intymnie; „Głęboka tak jest" trochę mocniej, „Rozpływam się" znów miękko.
• Bridge — tęsknie, „słodki głos" długo i delikatnie.`},
];

/* Zmiany w piosenkach startowych, które ktoś ma już zapisane. Ruszają tylko to, co było
   z piosenki startowej — akordy wpisane samodzielnie zostają. */
// zdania z notatek „Bliżej”, które mówiły o basie E/G# i B/D#
const BLIZEJ_NOTE_FIX = [
  ['B i B/D# (V, napięcie)',
   'B (V, napięcie)'],
  ['E pojawia się dopiero jako E/G#.',
   'E pojawia się dopiero w połowie linii.'],
  ['• Bas w zwrotce idzie schodkami: C# → B → G# → A.',
   '• Zwrotka: C#m → B → E → A — vi, V, I, IV.'],
  ['• B/D# w refrenie: bas schodzi E → D# → C# — miękkie zejście, prawie jak westchnienie.',
   '• Refren: E → B → C#m → A — klasyczne I–V–vi–IV.'],
  ['• Interludium F#m → E/G# → A: bas w górę F# → G# → A, jak wchodzenie coraz bliżej.',
   '• Interludium F#m → E → A: ii – I – IV, spokojny ruch wokół domu.'],
];
const SEED_FIXES = [
{ id:'blizej-bez-basow', song:'seed-blizej',
  apply(s){
    const akord = (t, z, na) => String(t||'').split('['+z+']').join('['+na+']');
    s.lyrics = akord(akord(s.lyrics,'E/G#','E'),'B/D#','B');
    s.chords = String(s.chords||'').replace(/(^|\s)E\/G#(?=\s|$)/g,'$1E').replace(/(^|\s)B\/D#(?=\s|$)/g,'$1B');
    s.notes = BLIZEJ_NOTE_FIX.reduce((n,[z,na])=>n.split(z).join(na), String(s.notes||''));
  }},
];

/* Dawne piosenki startowe, które mają zniknąć także z zapisanych piosenek. */
const SEED_REMOVED = ['seed-kotek', 'seed-widze-dom'];

/* O ile półtonów przenieść akordy przy zmianie tonacji z → na (najkrótsza droga, −5…+6).
   Równoległa dur/moll (E-dur → cis-moll) to te same akordy: 0. */
function przesuniecieTonacji(z, na){
  if(!z || !na || z===na || majorOfKey(z)===majorOfKey(na)) return 0;
  const pc = k => PC[String(k).replace(/m$/,'')];
  let d = ((pc(na) - pc(z)) % 12 + 12) % 12;
  return d > 6 ? d - 12 : d;
}
/* Lista akordów „[Zwrotka] C G | Am” przeniesiona o n półtonów — etykiety i kreski zostają. */
function transposeSongText(text, n){
  return String(text||'').split('\n').map(line=>{
    const lm = line.match(/^(\s*\[[^\]]+\]\s*)?(.*)$/);
    return (lm[1]||'') + lm[2].split(/(\s+)/).map(t => t.trim() && parseChord(t) ? transposeChord(t, n) : t).join('');
  }).join('\n');
}

/* Piosenki bazowe (startowe) można zmieniać, a potem wrócić do oryginału.
   Porównujemy tylko to, co da się zmienić w zakładce. */
const SEED_POLA = ['title', 'artist', 'key', 'bpm', 'beats', 'lyrics'];
const seedOf = s => s && SEED_SONGS.find(x => x.id === s.id) || null;
function seedZmieniona(s){
  const seed = seedOf(s);
  return !!seed && SEED_POLA.some(k => String(s[k] ?? '') !== String(seed[k] ?? ''));
}
/* Wpisuje do piosenki oryginał z SEED_SONGS (razem z akordami i notatkami). */
function seedPrzywroc(s){
  const seed = seedOf(s);
  if(!seed) return false;
  for(const k of [...SEED_POLA, 'chords', 'notes']) s[k] = seed[k] ?? '';
  return true;
}

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
  // poprawki piosenek startowych, które są już zapisane — każda raz
  const fixes = prefs.get('songs.seedFixes',[]);
  for(const f of SEED_FIXES){
    if(fixes.includes(f.id)) continue;
    const s = songs.find(x=>x.id===f.song);
    if(s){ f.apply(s); await DB.putSong(s); }
    fixes.push(f.id);
  }
  prefs.set('songs.seedFixes',fixes);
  // dawne piosenki startowe — usuń raz
  const usuniete = prefs.get('songs.seedRemoved',[]);
  for(const id of SEED_REMOVED){
    if(usuniete.includes(id)) continue;
    if(songs.some(x=>x.id===id)){ await DB.delSong(id); songs.splice(songs.findIndex(x=>x.id===id),1); }
    usuniete.push(id);
  }
  prefs.set('songs.seedRemoved',usuniete);
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
        const baza = seedOf(s) ? (seedZmieniona(s) ? 'bazowa · zmieniona' : 'bazowa') : '';
        const b=h('button',{class:'item','aria-current':String(s.id===currentId)}, s.title||'(bez tytułu)', h('small',null,[s.artist,keyNameLabel(s.key),baza].filter(Boolean).join(' · ')));
        b.onclick=()=>{ currentId=s.id; history.replaceState(null,'','#piosenki/'+s.id); drawList(); drawSong(); };
        list.appendChild(b);
      });
      // usunięte piosenki bazowe da się przywrócić jednym kliknięciem
      const brak = SEED_SONGS.filter(x=>!songs.some(s=>s.id===x.id));
      if(brak.length) list.append(h('button',{class:'btn small ghost',title:'Dodaj z powrotem: '+brak.map(x=>x.title).join(', '),
        onclick:async()=>{ for(const x of brak){ const n={...x}; await DB.putSong(n); songs.push(n); } drawList(); }},
        '↺ Przywróć usunięte bazowe ('+brak.length+')'));
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
        drawBaza();
      };

      /* --- piosenka bazowa: oznaczenie i powrót do oryginału --- */
      const bazaBox = h('div',{class:'baza'});
      function drawBaza(pytaj){
        bazaBox.innerHTML='';
        if(!seedOf(s)){ bazaBox.hidden=true; return; }
        bazaBox.hidden=false;
        const zmieniona = seedZmieniona(s);
        bazaBox.append(h('span',null, zmieniona ? 'bazowa · zmieniona' : 'bazowa'));
        if(!zmieniona) return;
        if(!pytaj){
          bazaBox.append(h('button',{type:'button',class:'baza-link',onclick:()=>drawBaza(true)},'przywróć oryginał'));
          return;
        }
        bazaBox.append(h('span',null,'— Twoje zmiany przepadną.'),
          h('button',{type:'button',class:'baza-link mocny',onclick:async()=>{
            if(saveFor===s){ clearTimeout(saveT); saveFor=null; }
            seedPrzywroc(s); await DB.putSong(s); drawList(); drawSong();
          }},'Tak, przywróć'),
          h('button',{type:'button',class:'baza-link',onclick:()=>drawBaza(false)},'anuluj'));
      }

      /* --- pola --- */
      const fTitle = h('input',{value:s.title||'',placeholder:'Tytuł','aria-label':'Tytuł',style:'font-family:Fraunces,serif;font-size:1.5rem;font-weight:600;padding:8px 12px'});
      const fArtist = h('input',{value:s.artist||'',placeholder:'Wykonawca (opcjonalnie)'});
      const fKey = h('select',null, ...SONG_KEYS.map(k=>h('option',{value:k.v,selected:k.v===s.key},k.l)));
      const fBpm = h('input',{type:'number',min:40,max:200,value:s.bpm||90});
      const fBeats = h('select',null, ...[1,2,3,4,8].map(n=>h('option',{value:n,selected:(s.beats||4)==n}, n+' '+(n===1?'uderzenie':n<5?'uderzenia':'uderzeń'))));
      const fLyrics = h('textarea',{spellcheck:'false',style:'min-height:150px',
        placeholder:'[Zwrotka]\n[C]Tu wpisz tekst [G7]piosenki,\na akord stoi [Am]nad sylabą.'}, s.lyrics||'');

      fTitle.oninput=()=>{ s.title=fTitle.value; save(); };
      fArtist.oninput=()=>{ s.artist=fArtist.value; save(); };
      // nowa tonacja przenosi akordy tekstu (C → D: wszystko o cały ton w górę);
      // równoległa dur/moll (E-dur ↔ cis-moll) to te same akordy, więc tylko zmienia nazwę
      fKey.onchange=()=>{
        const n = przesuniecieTonacji(s.key, fKey.value);
        s.key = fKey.value;
        if(n) przeniesAkordy(n);
        save(); drawSheet(); drawLyrics();
      };
      fBpm.oninput=()=>{ s.bpm=+fBpm.value||90; save(); };
      fBeats.onchange=()=>{ s.beats=+fBeats.value; save(); };
      fLyrics.oninput=()=>{ s.lyrics=fLyrics.value; save(); drawLyrics(); drawSheet(); };
      fLyrics.style.minHeight = Math.min(700, 120 + (s.lyrics||'').split('\n').length*22)+'px';

      /* --- arkusz z akordami --- */
      // akordy bierzemy z tekstu (to on jest edytowany i przenoszony); stara lista tylko, gdy tekst jest bez akordów
      const chordText = ()=> lyricsChordSheet(s.lyrics) || s.chords || '';
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
            line.append(h('span',{class:'chord-chip '+f.fn,'data-c':c.text,title:FN_NAME[f.fn]+(f.rn?' · '+f.rn:'')}, fmt(c.text), f.rn?h('span',{class:'deg'},f.rn):null));
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
        drawSklad(all);
        if(junk.length) analysis.append(h('div',{style:'margin-top:6px'},'Nie rozpoznano: '+junk.join(', ')+' — pisz akordy jak C, Am, F#m, Bb7, G/B.'));
      }

      /* --- z jakich dźwięków są akordy tej piosenki --- */
      const sklad = h('div',{class:'sklad'});
      function drawSklad(all){
        sklad.innerHTML='';
        const widziane = new Set();
        const lista = all.filter(c=>!widziane.has(c.text) && widziane.add(c.text));
        if(!lista.length){ sklad.hidden=true; return; }
        sklad.hidden=false;
        sklad.append(h('h3',null,'Z czego są akordy'),
          h('dl',null, ...lista.flatMap(c=>{
            const {notes, bas} = chordNotes(c);
            return [h('dt',null,fmt(c.text)),
              h('dd',null, notes.join(' · '), bas && c.bassPc!==c.rootPc ? h('span',{class:'faint'},'  bas '+bas) : null)];
          })));
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
      function przeniesAkordy(n){
        s.lyrics = transposeLyrics(s.lyrics||'', n);
        s.chords = transposeSongText(s.chords||'', n);
        fLyrics.value = s.lyrics;
      }
      // ♭ / ♯ przenoszą tekst i razem z nim tonację
      function transponujTekst(n){
        przeniesAkordy(n);
        s.key = transposeKey(s.key, n); fKey.value = s.key;
        save(); drawLyrics(); drawSheet();
      }
      function drawLyrics(){
        lyrBox.innerHTML='';
        const linie = parseLyrics(s.lyrics);
        if(!s.lyrics || !s.lyrics.trim()){
          lyrBox.append(h('div',{class:'empty'},'Tu wklej tekst piosenki. Akordy wpisz w nawiasach kwadratowych dokładnie tam, gdzie mają zabrzmieć — appka pokaże je nad sylabami.'));
          return;
        }
        lyricsInto(lyrBox, linie, s.key, {graj:false});
      }

      drawBaza();
      main.append(
        bazaBox,
        h('div',{class:'card'},
          fTitle,
          h('div',{class:'grid2'},
            h('div',null,h('label',{class:'f'},'Wykonawca'),fArtist),
            h('div',null,h('label',{class:'f'},'Tonacja'),fKey,h('p',{class:'faint',style:'margin:4px 0 0;font-size:.8rem'},'Zmiana tonacji przenosi akordy w tekście.'))),
          h('div',{class:'grid2'},
            h('div',null,h('label',{class:'f'},'Tempo (uderzeń na minutę)'),fBpm),
            h('div',null,h('label',{class:'f'},'Jeden akord trwa'),fBeats))),
        h('section',{style:'margin-top:18px'},
          h('div',{class:'sechead'}, h('h2',null,'Akordy'), h('div',{class:'row'}, playAll, loopToggle(), clickToggle(), h('a',{class:'btn',href:'#druk/song/'+s.id},'🖨 Drukuj'))),
          h('div',{class:'card'}, sheet, analysis, sklad)),
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
              h('span',{class:'mono'},'[C]Tu wpisz tekst [G7]piosenki'),'. Linia z samym ',
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
