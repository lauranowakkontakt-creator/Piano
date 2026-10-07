# Harmonia 🎹

Osobista appka do nauki harmonii, czytania nut i grania na pianinie.

## Jak uruchomić

**Kliknij dwa razy `index.html`**. Otworzy się w przeglądarce (najlepiej Chrome, Edge albo Firefox) i gotowe.
Nic nie trzeba instalować, działa też bez internetu (bez internetu tylko czcionki będą inne).

> Safari czasem nie zapisuje danych z plików otwieranych z dysku. Jeśli piosenki się nie zapisują,
> użyj Chrome'a albo uruchom w terminalu w tym folderze: `python3 -m http.server 8000`
> i wejdź na http://localhost:8000

### Strona w internecie

Appka jest też pod adresem **https://lauranowakkontakt-creator.github.io/Piano/** — aktualizuje się sama po każdej zmianie w `main`.
Za pierwszym razem trzeba raz włączyć: w repozytorium **Settings → Pages → Source: GitHub Actions**.
Dane (piosenki, nagrania) na stronie są osobne od tych w pliku otwieranym z dysku — przenosisz je Kopią zapasową.

## Zakładki

| Zakładka | Co tam jest |
|---|---|
| **Dziś** | Ekran startowy: seria dni w tym tygodniu, dzisiejszy cel z Treningu i duży przycisk „Zacznij trening dnia”, lekcja Teorii, do której wracasz, ostatnio grana piosenka i szybkie wejścia do grania. |
| **Teoria** | 10 krótkich lekcji od zera: klawiatura → gama → akordy → cyfry rzymskie → tonika / subdominanta / dominanta → kadencje → przewroty → zmiana gamy → moll → plan ćwiczeń. Każda lekcja ma przykłady do posłuchania, zadanie przy pianinie i quiz. |
| **Gamy** | Pierwszy prototyp (akordy.html) z klawiaturą: kliknij akord, a zobaczysz, które klawisze nacisnąć. |
| **Nuty** | 6 lekcji czytania nut (pięciolinia, oba klucze, rytm, znaki, akordy) + trener „Jaka to nuta?”, który częściej pokazuje nuty, z którymi masz problem. |
| **Trening** | Codzienna runda mieszanych zadań: akord i interwał ze słuchu, który to stopień, rola akordu, co dalej, złóż akord na klawiaturze, który przewrót. Appka liczy serię dni, pokazuje postęp i — przez system powtórek z odstępami — wraca częściej do tego, co Ci nie wychodzi. Klawisze: **1–4** odpowiedź, **spacja** powtarza dźwięk, **Enter** dalej. |
| **Klawisze** | Żywe pianino. Grasz myszką, klawiaturą komputera albo prawdziwym pianinem przez **MIDI** — appka na bieżąco nazywa akord, który trzymasz (z przewrotem, basem po ukośniku i rolą w wybranej tonacji) i mówi, do jakich gam pasuje. Niżej gamy z **palcowaniem** obu rąk i ćwiczenie „zagraj gamę w górę i w dół". |
| **Piosenki** | Twoje utwory: **tekst z akordami nad słowami**, tonacja i tempo. Akordy appka bierze z tekstu. Tekst da się zagrać i przetransponować o pół tonu — słowa zostają na miejscu. Na start są „Widzę dom”, „Bliżej (Closer)” i „Wtulę się (Lean Back)” (te dwie z polskim tekstem i akordami) oraz „Wlazł kotek na płotek” (pokazuje, jak zapisywać tekst). Appka koloruje rolę każdego akordu, gra akordy i podpowiada tonację. |
| **Setlista** | Wybierasz piosenki i układasz je w kolejności (strzałki ↑ ↓). Każda gra w swojej tonacji albo w wybranej innej — przycisk „dopasuj do poprzedniej” przenosi ją tak, żeby przejście nie było potrzebne. Gdy następna piosenka jest w innej tonacji, appka podaje **akordy przejścia** do wyboru (gładko przez wspólny akord, ii–V, po kole kwintowym albo szybko przez dominantę) i może je zagrać. **Graj setlistę** pokazuje duży tekst z akordami (przeniesionymi do wybranej tonacji), przejście do następnej i przyciski Poprzednia / Następna — działają też strzałki ← → i pedał do przewracania stron (PageUp / PageDown). |
| **Głos** | Rozgrzewka z akompaniamentem, który sam przechodzi pół tonu wyżej i z powrotem. Są tu ćwiczenia emisyjne (rozluźniające, głowowe, wąskie, szerokie, dykcyjne), ćwiczenia na emocje w głosie, nagrywanie się i mapa emocji Twoich piosenek. |
| **Pętla** | Wybierasz akordy z bazy (12 dźwięków × dur, moll, 7, maj7, m7, sus, °, +) albo jedną z **ponad 40 gotowych pętli** w kategoriach: na start, pop, uwielbienie, rzewne, jazz i blues, klasyka i kolędy. Do tego **styl akompaniamentu** — ten sam akord jako pompa, arpeggio, walc, ballada 6/8, bas Albertiego, synkopa albo mocne oktawy; appka pisze, co robi która ręka. Układa akordy w koło, pokazuje przewroty i palce, które zostają, i gra w kółko z metronomem. Spacja = start/stop. |
| **Przejścia** | Układasz własne akordy. Appka pokazuje drzewo i koło kwintowe z Twoją drogą po gamach. Akord, który nie pasuje, świeci na czerwono, a pod nim jest podpowiedź, jak do niego przejść (do wstawienia jednym kliknięciem). |
| **Wizualizacja** | Drzewo ruchów (kliknij akord, a zaświecą się ścieżki, dokąd może iść dalej) i koło kwintowe. Świecące węzły na czarnym tle. |
| **Druk** | Ściągawki A4 do postawienia na pianinie: jedna strona na gamę + ściąga ogólna. Każdą piosenkę też da się wydrukować. „Zapisz jako PDF” jest w oknie drukowania. |
| **Źródła** | Strony i kanały do dalszej nauki, także po polsku. |

## Wygląd

Trzy motywy kolorów do wyboru w menu **☰** (na telefonie: **Więcej**) → **Wygląd**:
**Kość słoniowa** (jasny, domyślny), **Nocna scena** (ciemny, na wieczór) i **Szałwia** (jasny, zielony).
Appka pamięta wybór. Kolory ról akordów (tonika — róż, subdominanta — morski, dominanta — bursztyn) są w każdym motywie te same.

## Na telefonie

Na dole ekranu jest pasek pod kciukiem: **Dziś, Nauka, Klawisze, Piosenki, Więcej**.
„Nauka” prowadzi do Teorii (świeci się też w Nutach i Treningu), a **Więcej** otwiera pełną listę zakładek z opisem i wybór motywu.

## Twoje dane

Piosenki i nagrania są zapisane **tylko w tej przeglądarce na tym komputerze**. Nie ma logowania ani chmury.
Teksty nowych piosenek wklejasz u siebie w zakładce Piosenki (albo wczytujesz z pliku `.json` przyciskiem „Wczytaj").

Rób co jakiś czas **Kopię zapasową** (przycisk w zakładce Piosenki). Pobiera plik `.json`, a przyciskiem „Wczytaj” przywracasz piosenki,
także na innym komputerze. Nagrań audio nie ma w kopii, bo trzymasz je jako osobne pliki.

## Jak wpisywać akordy

```
[Zwrotka] C G Am F | C G F F
[Refren] F G C Am
```

- akordy oddzielone spacją, `|` to kreska taktowa, `[Nazwa]` na początku linii to etykieta
- polskie **H** też działa (`H`, `Hm7`, `C/H`) — appka zapisuje je potem jako `B`, `Bm7`, `C/B`. Uwaga: samo `B` znaczy B (czyli polskie H), a B-dur to `Bb`
- rozumie: `C  Am  F#m  Bb  G7  Cmaj7  Cm7  C6  C9  C5  Bdim  B°  Bm7b5  Caug  Gsus4  C7sus4  D2  Cadd9  Gadd4  C/E`
- słowo, które nie jest akordem (np. `Every`), zostaje na szaro jako „nie rozpoznano" — appka go nie gra

## Jak wpisywać tekst piosenki

```
[Zwrotka]
[C]Wlazł kotek na [G7]płotek i mruga,
ładna to [C]piosenka nie[G7]długa.
```

- akord w nawiasie kwadratowym staje **nad następną sylabą** — dokładnie tam, gdzie ma zabrzmieć
- linia z samym `[Zwrotka]` albo `[Refren]` to nagłówek części (bo to nie są akordy)
- coś, co nie jest akordem, np. `[x2]`, zostaje zwykłym tekstem
- przyciski `♭ −½` i `♯ +½` przepisują akordy w całym tekście, a słów nie ruszają
- tekst drukuje się razem z chwytami: zakładka Piosenki → **🖨 Drukuj**

## Pianino przez kabel (MIDI)

Pianino cyfrowe podłączone kablem USB gra w zakładce **Klawisze**: klawisze zapalają się na ekranie, a appka
nazywa akord, który trzymasz (pedał też jest obsługiwany). To samo połączenie działa potem w **Treningu** —
ćwiczenie „zagraj akord" możesz po prostu zagrać, zamiast klikać myszką.

Działa w Chrome i Edge (Safari nie obsługuje Web MIDI). Bez pianina nic nie trzeba zmieniać: grasz myszką
albo klawiaturą komputera (`z s x d c v g b h n j m` to oktawa od C, `Shift` trzyma jak pedał).

## Dla programisty (Claude Code)

- Czysty HTML, CSS i JS, bez budowania. Skrypty ładowane po kolei w `index.html`.
- `js/theory.js` to logika teorii przeniesiona 1:1 z prototypu (`docs/akordy-prototyp.html`), plus parser akordów i funkcje w tonacji.
- `js/audio.js` to syntezator fortepianu na Web Audio (trzy rozstrojone struny, filtr, młoteczek, pogłos), `js/staff.js` rysuje nuty przez VexFlow 4.2.5 (`vendor/`, licencja MIT).
- `js/loop.js` to logika pętli (rodzaje akordów, relacje, prowadzenie głosów, układanie w pętlę), bez rysowania.
- Przycisk „🔁 w kółko” przy ▶ (Gamy, Piosenki, Przejścia, Wizualizacja) gra sekwencję w pętli. Planowanie dźwięku „z wyprzedzeniem” trzyma równe tempo.
- `js/db.js` to IndexedDB (piosenki i audio), a `prefs` w `js/ui.js` to localStorage na drobne ustawienia.
- `js/srs.js` to powtórki z odstępami (pudełka Leitnera, seria dni) — czysty stan JSON, bez DOM.
- `js/detect.js` rozpoznaje akord z granych dźwięków (odwrotność `parseChord`): wzór akordu, bas, przewrót, akordy bez kwinty.
- `js/fingering.js` to standardowe palcowania 12 gam durowych (obie ręce) plus logika ćwiczenia „zagraj gamę".
- `js/patterns.js` to style akompaniamentu: z chwytu i liczby uderzeń robi listę zdarzeń {dźwięki, kiedy, jak długo}; `playChordSeq` w `js/ui.js` umie je zagrać zamiast zwykłego uderzenia w akord.
- `js/nav.js` to menu „wszystkie zakładki" i przewijanie paska — opisy zakładek są tam w jednym miejscu.
- `scripts/wersja.js` dokleja `?v=<skrót treści>` do skryptów przy publikacji (workflow robi to na kopii, repo zostaje czyste).
- `js/lyrics.js` to parser tekstu z akordami w nawiasach (plus transpozycja samych akordów).
- `js/midi.js` to Web MIDI w dwóch warstwach: czysty `parseMidiMessage` i `HeldNotes` (z pedałem), a nad nimi `MidiIn`. `midiSubscribe` daje jedno połączenie z pianinem na całą appkę, więc zmiana zakładki go nie zrywa. Bez pianina wszystko działa jak wcześniej.
- `js/drills.js` to generatory zadań do Treningu: każde zadanie opisuje, co zagrać, a dźwięk odpala dopiero widok. Dzięki temu całą zawartość ćwiczeń sprawdzają testy w node.
- Widoki są w `js/views/*.js`, a router (`#zakladka/podstrona`) w `js/app.js`.
- Pełny opis wymagań: `docs/BRIEF.md`.

### Testy

Sama appka nie potrzebuje instalacji — `package.json` jest tylko do testów.

```
npm install                 # raz: Playwright (testy w przeglądarce)
npx playwright install chromium   # raz, jeśli nie masz jeszcze przeglądarki Playwrighta
npm test                    # testy logiki: teoria, parser akordów, tonacje, przejścia, dźwięk, trening
npm run test:e2e            # testy w prawdziwym Chromium: wszystkie zakładki, piosenki, kopia, przejścia, trener, trening, klawisze (z udawanym pianinem MIDI), druk, widok na telefonie
npm run check               # czy każdy skrypt z index.html istnieje i się parsuje
```

- `test/unit/` ładuje zwykłe skrypty appki do `node:vm` (jak w przeglądarce, bez modułów), więc testy sprawdzają dokładnie ten kod, który działa u Laury.
- `test/e2e/` otwiera `index.html` z dysku (jak dwuklik) i łapie każdy błąd JS na każdej zakładce.
- Pianina do testów MIDI nie trzeba: test podstawia `navigator.requestMIDIAccess` i wysyła komunikaty z poziomu strony.
- `test/helpers/load.js` ma też `loadWith({navigator}, …)`, gdy testowany kod potrzebuje czegoś z przeglądarki.
