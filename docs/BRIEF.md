# Aplikacja do nauki harmonii i grania — brief dla Claude Code

Osobista appka Laury do nauki teorii muzyki i grania na pianinie. Ma wgrywać
własne piosenki, uczyć teorii od zera, pozwalać ćwiczyć gamy i akordy oraz
czytać nuty. Notacja anglosaska: **B, nie H**, krzyżyki/bemole jako ♯/♭.
Teksty i UI po polsku, prosto i po ludzku — appka ma uczyć kogoś, kto mówi
„nie umiem totalnie teorii".

## Co już jest (punkt startu)

Plik `akordy.html` — jeden plik, czysty HTML + Web Audio, zero zależności.
Działa i jest sprawdzony:

- wybór gamy: C, G, D, A, E, F, B♭, E♭
- 7 akordów gamy pogrupowanych według funkcji (tonika / subdominanta /
  dominanta), klik w akord = dźwięk
- gotowe progresje (I–IV–V–I, I–V–vi–IV, ii–V–I, doo-wop), przycisk gra całą
  sekwencję i podświetla akordy
- „mosty" między sąsiednimi gamami (wspólne akordy do płynnego przejścia)

Logika teorii w tym pliku (budowa akordów z gamy, funkcje, wspólne akordy) jest
poprawna. Przenieś ją 1:1 do nowej wersji, nie licz od nowa.

## Zakładki docelowe

1. **Teoria** — wytłumaczenie funkcji i zasad łączenia (treść niżej), krok po
   kroku, z możliwością klikania i słuchania przykładów.
2. **Gamy** — to co jest w prototypie `akordy.html`, przeniesione tu.
3. **Nuty** — nauka czytania nut od podstaw: pięciolinia, klucz wiolinowy i
   basowy, nazwy nut, wartości rytmiczne. Progresywnie, z ćwiczeniami. Do
   rysowania/renderowania nut użyj biblioteki (np. VexFlow albo
   OpenSheetMusicDisplay), nie rób tego ręcznie.
4. **Piosenki** — Laura wgrywa własne utwory (plik audio i/lub ręcznie wpisane
   akordy). Dla każdej piosenki: tonacja, lista akordów w kolejności, notatki.
   Ma móc odtworzyć akordy piosenki tym samym syntezatorem, oznaczyć funkcje
   każdego akordu (tonika/sub/dom w danej tonacji — użyj logiki z prototypu),
   i tworzyć własne progresje. Automatyczne wykrywanie akordów z audio jest
   trudne — na start wpisywanie ręczne, audio tylko do odsłuchu.
5. **Wizualizacja** — diagram jak na obrazkach referencyjnych Laury: drzewo
   akordów albo koło kwintowe z powiązaniami, świecące węzły na czarnym tle.
   Może być interaktywne (klik w węzeł = dźwięk). To osobna zakładka, ale w tej
   samej estetyce co reszta.
6. **Źródła** — zakładka z linkami do nauki (lista niżej).

## Treść do zakładki „Teoria" (można wgrać wprost)

**Trzy role akordów w gamie.** Każdy akord w gamie pełni jedną z trzech ról i to
ona mówi, dokąd akord „chce" iść:

- **Tonika** — dom, odpoczynek. To akordy I, vi, iii. Tu wszystko wraca i się
  uspokaja. W gamie C: C, Am, Em.
- **Subdominanta** — ruch od domu, lekkie oddalenie. Akordy IV, ii. W C: F, Dm.
- **Dominanta** — napięcie, które ciągnie z powrotem do domu. Akordy V, vii°.
  W C: G, B°.

**Jedna zasada, na której stoi reszta:** dom → ruch → napięcie → powrót
(**T → S → D → T**), i możesz kręcić to w kółko. Kiedy trzymasz się tej
kolejności, brzmi „poprawnie". Najmocniejszy moment to dominanta wracająca na
tonikę: G→C w gamie C, D→G w gamie G, A→D w gamie D.

**Przechodzenie między gamami.** Sąsiednie gamy (np. C, G, D) mają prawie te
same akordy. Żeby przejść z jednej do drugiej: zagraj akord wspólny dla obu
(most), a zaraz po nim dominantę nowej gamy — ona ustawia ucho w nowym miejscu.
Z C do G: wspólne C albo Am, potem D. Z G do D: wspólne G albo Em, potem A.

**Skąd biorą się akordy gamy.** Bierzesz nuty gamy i budujesz na każdym stopniu
trójdźwięk (co druga nuta gamy). W gamie durowej wychodzi zawsze ten sam wzór
jakości: I dur, ii moll, iii moll, IV dur, V dur, vi moll, vii° zmniejszony.

## Design

Trzymaj estetykę prototypu, bo Laurze się podoba:

- ciemne tło (prawie czarne, lekko granatowe), świecące kolorowe węzły
- **kolor = funkcja**: tonika róż (`#f472b6`), subdominanta morski
  (`#2dd4bf`), dominanta bursztyn (`#fbbf24`)
- typografia: Fraunces (nagłówki, ekspresyjny szeryf), Inter (interfejs),
  JetBrains Mono (nazwy nut i akordów)
- responsywnie, działa na telefonie, focus widoczny z klawiatury, szanuj
  `prefers-reduced-motion`

## Do zrobienia koniecznie

- **Druk / PDF ściągawek** — dla każdej gamy widok do wydrukowania: akordy z
  nutami i funkcjami plus 2–3 progresje, tak żeby dało się to trzymać przy
  pianinie i grać z kartki.
- zapis danych lokalnie (piosenki, notatki) — IndexedDB albo zapis do plików;
  bez logowania, wszystko u Laury na dysku.

## Tech (sugestia, decyzja po Twojej stronie)

Prototyp to goły HTML. Skoro dochodzi wgrywanie piosenek, zapis i renderowanie
nut, warto przejść na lokalną appkę: Vite + React, dane w IndexedDB, dźwięk
przez Web Audio (albo Tone.js), nuty przez VexFlow / OpenSheetMusicDisplay.
Ma się odpalać u Laury lokalnie, prosto. Nie komplikuj ponad to, co potrzebne.

## Źródła do zakładki „Źródła"

- musictheory.net — lekcje i ćwiczenia od zera, po angielsku, świetne
- teoria.com — teoria + ćwiczenia ze słuchu
- Hooktheory / Hookpad — progresje akordów i jak działają w piosenkach
- MuseScore — nuty i darmowy program do zapisu nutowego
- YouTube: „Signals Music Studio", „David Bennett Piano" — przystępnie o
  harmonii i akordach

(sprawdź aktualność i dopisz polskie kanały/strony, jeśli znajdziesz dobre)
