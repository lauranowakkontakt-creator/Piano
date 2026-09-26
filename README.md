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
| **Teoria** | 10 krótkich lekcji od zera: klawiatura → gama → akordy → cyfry rzymskie → tonika / subdominanta / dominanta → kadencje → przewroty → zmiana gamy → moll → plan ćwiczeń. Każda lekcja ma przykłady do posłuchania, zadanie przy pianinie i quiz. |
| **Gamy** | Pierwszy prototyp (akordy.html) z klawiaturą: kliknij akord, a zobaczysz, które klawisze nacisnąć. |
| **Nuty** | 6 lekcji czytania nut (pięciolinia, oba klucze, rytm, znaki, akordy) + trener „Jaka to nuta?”, który częściej pokazuje nuty, z którymi masz problem. |
| **Piosenki** | Twoje utwory: akordy, tonacja, notatki, nagranie audio (można je zwolnić) i PDF z tekstem. Na start są „Widzę dom” i „Bliżej”. Appka koloruje rolę każdego akordu, gra akordy i podpowiada tonację. |
| **Głos** | Rozgrzewka z akompaniamentem, który sam przechodzi pół tonu wyżej i z powrotem. Są tu ćwiczenia emisyjne (rozluźniające, głowowe, wąskie, szerokie, dykcyjne), ćwiczenia na emocje w głosie, nagrywanie się i mapa emocji Twoich piosenek. |
| **Pętla** | Wybierasz akordy z bazy (12 dźwięków × dur, moll, 7, maj7, m7, sus, °, +) albo gotową pętlę. Appka układa je w koło (kolor = rodzaj akordu), pokazuje, jak trzymać ręce (przewroty, palce, które zostają), podpowiada, co pasuje dalej, i gra w kółko z metronomem i odliczaniem. Spacja = start/stop. |
| **Przejścia** | Układasz własne akordy. Appka pokazuje drzewo i koło kwintowe z Twoją drogą po gamach. Akord, który nie pasuje, świeci na czerwono, a pod nim jest podpowiedź, jak do niego przejść (do wstawienia jednym kliknięciem). |
| **Wizualizacja** | Drzewo ruchów (kliknij akord, a zaświecą się ścieżki, dokąd może iść dalej) i koło kwintowe. Świecące węzły na czarnym tle. |
| **Druk** | Ściągawki A4 do postawienia na pianinie: jedna strona na gamę + ściąga ogólna. Każdą piosenkę też da się wydrukować. „Zapisz jako PDF” jest w oknie drukowania. |
| **Źródła** | Strony i kanały do dalszej nauki, także po polsku. |

## Twoje dane

Piosenki i nagrania są zapisane **tylko w tej przeglądarce na tym komputerze**. Nie ma logowania ani chmury.
Rób co jakiś czas **Kopię zapasową** (przycisk w zakładce Piosenki). Pobiera plik `.json`, a przyciskiem „Wczytaj” przywracasz piosenki,
także na innym komputerze. Nagrań audio nie ma w kopii, bo trzymasz je jako osobne pliki.

## Jak wpisywać akordy

```
[Zwrotka] C G Am F | C G F F
[Refren] F G C Am
```

- akordy oddzielone spacją, `|` to kreska taktowa, `[Nazwa]` na początku linii to etykieta
- rozumie: `C  Am  F#m  Bb  G7  Cmaj7  Cm7  C6  C9  C5  Bdim  B°  Bm7b5  Caug  Gsus4  C7sus4  D2  Cadd9  Gadd4  C/E`
- słowo, które nie jest akordem (np. `Every`), zostaje na szaro jako „nie rozpoznano" — appka go nie gra

## Dla programisty (Claude Code)

- Czysty HTML, CSS i JS, bez budowania. Skrypty ładowane po kolei w `index.html`.
- `js/theory.js` to logika teorii przeniesiona 1:1 z prototypu (`docs/akordy-prototyp.html`), plus parser akordów i funkcje w tonacji.
- `js/audio.js` gra prawdziwy fortepian: nagrania Salamander Grand Piano (`vendor/piano-samples.js`, CC BY 3.0, Alexander Holm) co trzy półtony, wbudowane w plik JS, żeby działały też z dysku bez internetu. Zanim się wczytają, gra zapasowy syntezator. `js/staff.js` rysuje nuty przez VexFlow 4.2.5 (`vendor/`, licencja MIT).
- `js/loop.js` to logika pętli (rodzaje akordów, relacje, prowadzenie głosów, układanie w pętlę), bez rysowania.
- Przycisk „🔁 w kółko” przy ▶ (Gamy, Piosenki, Przejścia, Wizualizacja) gra sekwencję w pętli. Planowanie dźwięku „z wyprzedzeniem” trzyma równe tempo.
- `js/db.js` to IndexedDB (piosenki i audio), a `prefs` w `js/ui.js` to localStorage na drobne ustawienia.
- Widoki są w `js/views/*.js`, a router (`#zakladka/podstrona`) w `js/app.js`.
- Pełny opis wymagań: `docs/BRIEF.md`.

### Testy

Sama appka nie potrzebuje instalacji — `package.json` jest tylko do testów.

```
npm install                 # raz: Playwright (testy w przeglądarce)
npx playwright install chromium   # raz, jeśli nie masz jeszcze przeglądarki Playwrighta
npm test                    # testy logiki: teoria, parser akordów, tonacje, przejścia, dźwięk
npm run test:e2e            # testy w prawdziwym Chromium: wszystkie zakładki, piosenki, kopia, przejścia, trener, druk
npm run check               # czy każdy skrypt z index.html istnieje i się parsuje
```

- `test/unit/` ładuje zwykłe skrypty appki do `node:vm` (jak w przeglądarce, bez modułów), więc testy sprawdzają dokładnie ten kod, który działa u Laury.
- `test/e2e/` otwiera `index.html` z dysku (jak dwuklik) i łapie każdy błąd JS na każdej zakładce.
