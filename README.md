# Harmonia 🎹

Osobista appka do nauki harmonii, czytania nut i grania na pianinie.

## Jak uruchomić

**Kliknij dwa razy `index.html`**. Otworzy się w przeglądarce (najlepiej Chrome, Edge albo Firefox) i gotowe.
Nic nie trzeba instalować, działa też bez internetu (bez internetu tylko czcionki będą inne).

> Safari czasem nie zapisuje danych z plików otwieranych z dysku. Jeśli piosenki się nie zapisują,
> użyj Chrome'a albo uruchom w terminalu w tym folderze: `python3 -m http.server 8000`
> i wejdź na http://localhost:8000

## Zakładki

| Zakładka | Co tam jest |
|---|---|
| **Teoria** | 10 krótkich lekcji od zera: klawiatura → gama → akordy → cyfry rzymskie → tonika / subdominanta / dominanta → kadencje → przewroty → zmiana gamy → moll → plan ćwiczeń. Każda lekcja ma przykłady do posłuchania, zadanie przy pianinie i quiz. |
| **Gamy** | Pierwszy prototyp (akordy.html) z klawiaturą: kliknij akord, a zobaczysz, które klawisze nacisnąć. |
| **Nuty** | 6 lekcji czytania nut (pięciolinia, oba klucze, rytm, znaki, akordy) + trener „Jaka to nuta?”, który częściej pokazuje nuty, z którymi masz problem. |
| **Piosenki** | Twoje utwory: akordy, tonacja, notatki, nagranie audio (można je zwolnić) i PDF z tekstem. Na start są „Widzę dom” i „Bliżej”. Appka koloruje rolę każdego akordu, gra akordy i podpowiada tonację. |
| **Głos** | Rozgrzewka z akompaniamentem, który sam przechodzi pół tonu wyżej i z powrotem. Są tu ćwiczenia emisyjne (rozluźniające, głowowe, wąskie, szerokie, dykcyjne), ćwiczenia na emocje w głosie, nagrywanie się i mapa emocji Twoich piosenek. |
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
- rozumie: `C  Am  F#m  Bb  G7  Cmaj7  Bdim  B°  Gsus4  Cadd9  C/E`

## Dla programisty (Claude Code)

- Czysty HTML, CSS i JS, bez budowania. Skrypty ładowane po kolei w `index.html`.
- `js/theory.js` to logika teorii przeniesiona 1:1 z prototypu (`docs/akordy-prototyp.html`), plus parser akordów i funkcje w tonacji.
- `js/audio.js` to syntezator Web Audio z prototypu, `js/staff.js` rysuje nuty przez VexFlow 4.2.5 (`vendor/`, licencja MIT).
- `js/db.js` to IndexedDB (piosenki i audio), a `prefs` w `js/ui.js` to localStorage na drobne ustawienia.
- Widoki są w `js/views/*.js`, a router (`#zakladka/podstrona`) w `js/app.js`.
- Pełny opis wymagań: `docs/BRIEF.md`.
