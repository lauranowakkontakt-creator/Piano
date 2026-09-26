# Jak budować stronę internetową — zasady programowania

Ogólne zasady tworzenia stron i aplikacji webowych. Obowiązują niezależnie od frameworka; przykłady są w czystym HTML/CSS/JS, bo to podstawa, na której stoi wszystko inne.

---

## 1. Kolejność pracy

Zanim powstanie pierwsza linijka kodu:

1. **Zrozum cel.** Kto używa strony, na jakim urządzeniu, co ma zrobić w 10 sekund po wejściu. Jedno zdanie, zanim zaczniesz.
2. **Przeczytaj istniejący kod.** Struktura katalogów, konwencje nazw, istniejące tokeny CSS, funkcje pomocnicze. Nowy kod ma wyglądać, jakby napisała go ta sama osoba.
3. **Zaplanuj najmniejszą działającą wersję.** Najpierw treść i struktura (HTML), potem wygląd (CSS), na końcu zachowanie (JS). Strona powinna mieć sens nawet wtedy, gdy JS się nie załaduje — tam, gdzie to możliwe.
4. **Buduj małymi krokami i sprawdzaj każdy.** Odśwież, kliknij, sprawdź konsolę. Mały krok, który działa, jest lepszy niż duży, który „prawie działa”.
5. **Sprawdź przed oddaniem** — lista kontrolna na końcu tego pliku.

---

## 2. Zasady ogólne

| Zasada | Co znaczy w praktyce |
| --- | --- |
| **KISS** — prosto | Najprostsze rozwiązanie, które działa. Natywny `<dialog>` zamiast biblioteki modali. `<details>` zamiast ręcznego akordeonu. |
| **YAGNI** — nie na zapas | Nie dodawaj opcji, konfiguracji ani abstrakcji „bo kiedyś się przyda”. Dodasz, kiedy będą potrzebne. |
| **DRY** — bez powtórzeń | Ta sama logika w 3 miejscach → funkcja. Ale dwa podobne fragmenty to jeszcze nie powód do abstrakcji; zła abstrakcja jest gorsza niż powtórzenie. |
| **Jedna odpowiedzialność** | Funkcja robi jedną rzecz, plik dotyczy jednego tematu. `renderSongList()` nie zapisuje do bazy. |
| **Rozdziel dane, logikę i widok** | Obliczenia (np. teoria muzyki) nie dotykają DOM. Widok tylko wyświetla wynik. Łatwiej to testować i zmieniać. |
| **Czytelność ponad spryt** | Kod czyta się 10× częściej niż pisze. Jasne nazwy, krótkie funkcje, bez „magicznych” jednolinijkowców. |
| **Spójność** | Trzymaj się konwencji projektu, nawet jeśli wolisz inną. Dwa style w jednym projekcie to gorsze niż jeden „gorszy”. |
| **Najmniejsza zmiana** | Poprawiając błąd, nie przepisuj przy okazji połowy pliku. Refaktor to osobny krok. |

---

## 3. Struktura projektu

```
index.html          punkt wejścia
css/style.css       style (albo kilka plików wg sekcji)
js/                 logika
  app.js            start aplikacji, router
  <temat>.js        moduły tematyczne (dane, audio, zapis…)
  views/            widoki — po jednym pliku na ekran/zakładkę
vendor/             zewnętrzne biblioteki (z licencją obok)
docs/               opis wymagań, notatki
```

- Nazwy plików i folderów: małe litery, bez spacji i polskich znaków (`piosenki.js`, nie `Piosenki Nowe.js`).
- Zewnętrzne biblioteki zawsze z licencją i konkretną wersją. Nie linkuj „latest” z CDN w produkcji.
- README mówi, jak uruchomić projekt i gdzie co jest.

---

## 4. HTML — struktura i znaczenie

- **Semantyczne znaczniki**: `header`, `nav`, `main`, `section`, `article`, `aside`, `footer`, `button`, `a`. Nie `div` do wszystkiego.
- **`<button>` do akcji, `<a href>` do nawigacji.** Klikalny `div` nie działa z klawiatury ani czytnikiem ekranu.
- **Jeden `<h1>` na stronę**, nagłówki po kolei (`h2` → `h3`), bez przeskakiwania poziomów dla wyglądu.
- **Każde pole formularza ma `<label>`.** Placeholder to nie etykieta.
- **Obrazy**: `alt` opisujący treść (albo `alt=""` dla dekoracji), `width`/`height`, żeby strona nie skakała, `loading="lazy"` poniżej pierwszego ekranu.
- **Podstawowy `<head>`**:

```html
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Konkretny tytuł strony</title>
  <meta name="description" content="Jedno-dwa zdania o stronie.">
  <link rel="stylesheet" href="css/style.css">
</head>
```

- Nigdy `user-scalable=no` ani `maximum-scale=1` — blokują powiększanie (patrz mobile-native.md).

---

## 5. CSS — wygląd

- **Tokeny w `:root`** — kolory, odstępy, promienie, czcionki, krzywe animacji jako zmienne. Zmiana motywu = zmiana w jednym miejscu.

```css
:root {
  --bg: #0a0a10;
  --text: #f4f4f5;
  --accent: #2dd4bf;
  --space-1: 4px; --space-2: 8px; --space-3: 16px; --space-4: 24px;
  --radius: 12px;
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
}
```

- **Mobile-first**: style bazowe dla telefonu, `@media (min-width: …)` dla większych ekranów.
- **Układ: Flexbox (jeden wymiar) i Grid (dwa wymiary).** Bez `float` i pozycjonowania absolutnego do układania treści.
- **Jednostki**: `rem` dla tekstu, `%`/`fr`/`min()`/`clamp()` dla szerokości, `dvh` zamiast `100vh` na telefonach.
- **Niska specyficzność**: klasy, nie ID ani długie łańcuchy selektorów. `!important` tylko w wyjątkowych sytuacjach (np. style do druku).
- **Nazwy klas opisują rolę, nie wygląd**: `.song-card`, nie `.blue-box`.
- **Kontrast tekstu** min. 4.5:1 (duży tekst 3:1). Kolor nigdy nie jest jedyną informacją — dodaj tekst lub ikonę.
- **Widoczny focus**: nie usuwaj `outline` bez zamiennika. Użyj `:focus-visible`.
- **Druk**: `@media print` — ukryj nawigację, czarny tekst na białym, `break-inside: avoid` dla kart.
- Animacje: design.md i animate.md. Tylko `transform` i `opacity`, nigdy `transition: all`.

---

## 6. JavaScript — zachowanie

**Nazwy**
- Zmienne i funkcje po angielsku lub konsekwentnie po polsku — tak jak reszta projektu. `camelCase` dla zmiennych, `PascalCase` dla klas, `UPPER_CASE` dla stałych.
- Funkcje od czasownika: `loadSongs()`, `renderChord()`, `isMinor()`. Wartości logiczne jako pytanie: `isPlaying`, `hasAudio`.

**Funkcje**
- Krótkie, jedna rzecz. Jeśli potrzebujesz komentarza „teraz robimy X”, to X powinno być osobną funkcją.
- Wczesne `return` zamiast głębokich zagnieżdżeń `if`.
- Funkcje czyste (to samo wejście → to samo wyjście, bez efektów ubocznych) tam, gdzie się da — zwłaszcza obliczenia.

**Zmienne**
- `const` domyślnie, `let` gdy wartość się zmienia, nigdy `var`.
- Żadnych zmiennych globalnych „przy okazji”. Jeden obiekt/moduł na przestrzeń nazw.
- Bez magicznych liczb: `const SEMITONES_IN_OCTAVE = 12`.

**DOM**
- **Delegacja zdarzeń**: jeden listener na kontenerze zamiast setek na elementach listy.
- **Nie wstawiaj danych użytkownika przez `innerHTML`.** Użyj `textContent` albo funkcji escapującej. Tytuł piosenki z `<script>` w środku nie może się wykonać.
- Szukaj elementów raz i trzymaj referencję; nie wołaj `querySelector` w pętli animacji.
- Stan w jednym miejscu, widok generowany ze stanu. Nie czytaj stanu z DOM („czy ta klasa jest ustawiona?”).
- Sprzątaj po sobie: zatrzymuj timery, audio i listenery, gdy widok znika.

**Asynchroniczność i błędy**
- `async`/`await` zamiast zagnieżdżonych callbacków.
- Każda operacja, która może się nie udać (zapis, odczyt pliku, mikrofon, sieć), ma `try/catch` i **komunikat dla człowieka**, nie tylko `console.error`.
- Nie połykaj błędów pustym `catch {}`.

**Zależności**
- Najpierw sprawdź, czy przeglądarka nie robi tego natywnie (`<dialog>`, `Intl`, `fetch`, `structuredClone`, Web Audio).
- Biblioteka tylko, jeśli jest utrzymywana, mała i rozwiązuje prawdziwy problem.

---

## 7. Dane i zapis

- **localStorage**: drobne ustawienia (wybrana zakładka, motyw). Zawsze w `try/catch` — w trybie prywatnym może rzucić wyjątek.
- **IndexedDB**: większe dane i pliki (piosenki, nagrania audio).
- **Wersjonuj format danych** (`{ version: 2, songs: [...] }`) i miej migrację, zanim zmienisz strukturę.
- **Kopia zapasowa**: eksport do `.json` i import z walidacją. Zanim nadpiszesz dane użytkownika — zapytaj.
- Nigdy nie usuwaj danych użytkownika bez potwierdzenia.

---

## 8. Dostępność (a11y)

- Wszystko da się obsłużyć **klawiaturą**: Tab, Enter, Spacja, Esc zamyka okna.
- Kolejność fokusu zgodna z kolejnością wizualną. Po otwarciu modala fokus wchodzi do środka, po zamknięciu wraca na przycisk.
- `aria-*` tylko gdy HTML nie wystarcza. Natywny element > rola ARIA.
- Ikony bez tekstu mają `aria-label`.
- Stan przełączników: `aria-pressed`, `aria-expanded`, `aria-current="page"` w nawigacji.
- `prefers-reduced-motion` — łagodniejsze animacje (animate.md, krok 7).
- Cele dotykowe min. 44×44 px.

---

## 9. Wydajność

- Szczegóły animacji: performance-cheatsheet.md.
- Skrypty na końcu `<body>` albo z `defer`. Nie blokuj pierwszego wyświetlenia.
- Obrazy w odpowiednim rozmiarze i formacie (WebP/AVIF), `loading="lazy"`.
- Czcionki: tylko potrzebne grubości, `display=swap`, `preconnect`.
- Długie listy: renderuj tylko widoczne elementy albo paginuj.
- Nie licz tego samego w każdej klatce — zapamiętaj wynik.
- Mierz, zanim optymalizujesz: DevTools → Performance / Lighthouse.

---

## 10. Bezpieczeństwo

- Dane od użytkownika i z plików traktuj jak niezaufane: escapuj przy wyświetlaniu, waliduj przy imporcie.
- Nie trzymaj haseł, kluczy API ani tokenów w kodzie frontendu ani w repozytorium.
- Linki zewnętrzne z `target="_blank"` → `rel="noopener noreferrer"`.
- Zewnętrzne skrypty tylko z zaufanych źródeł, najlepiej lokalna kopia w `vendor/`.
- Proś o uprawnienia (mikrofon, powiadomienia) dopiero wtedy, gdy użytkownik kliknie funkcję, która ich potrzebuje.

---

## 11. Telefon i różne przeglądarki

- Pełne zasady: mobile-native.md.
- Sprawdź w Chrome, Firefox i Safari. Safari (zwłaszcza iOS) najczęściej zachowuje się inaczej — np. audio startuje dopiero po geście użytkownika.
- Hover tylko za `@media (hover: hover) and (pointer: fine)`.
- Testuj na prawdziwym telefonie, nie tylko w emulacji DevTools.

---

## 12. Weryfikacja

- Po każdej zmianie: odśwież stronę, przeklikaj zmienioną funkcję, **konsola bez błędów**.
- Sprawdź przypadki brzegowe: pusta lista, bardzo długi tekst, polskie znaki, brak internetu, pierwsze uruchomienie bez danych.
- Sprawdź, czy nie zepsułaś innych zakładek/widoków, które korzystają z tego samego kodu.
- Jeśli projekt ma testy lub linter — uruchom je.
- Przy zmianach wizualnych zrób zrzut ekranu (np. Playwright) w szerokości telefonu i komputera.

---

## 13. Git

- Małe commity, każdy robi jedną rzecz i zostawia projekt w działającym stanie.
- Opis commita w trybie rozkazującym: „Dodaj eksport piosenek do JSON”, a pod spodem — dlaczego.
- Nie commituj plików tymczasowych, sekretów ani dużych plików binarnych (`.gitignore`).

---

## Lista kontrolna przed oddaniem

- [ ] Działa to, o co chodziło — sprawdzone w przeglądarce, nie tylko „na oko w kodzie”
- [ ] Konsola bez błędów i ostrzeżeń
- [ ] Kod pasuje stylem do reszty projektu, bez martwego i zakomentowanego kodu
- [ ] Brak `innerHTML` z danymi użytkownika, brak sekretów w kodzie
- [ ] Obsługa klawiaturą, widoczny focus, etykiety pól, kontrast
- [ ] Wygląda dobrze na telefonie (ok. 375 px) i na komputerze
- [ ] Animacje: tylko `transform`/`opacity`, `ease-out`, < 300 ms, `prefers-reduced-motion`
- [ ] Przypadki brzegowe: pusto, dużo, długo, błąd zapisu
- [ ] Dane użytkownika bezpieczne: nic nie ginie po aktualizacji
- [ ] README/docs zaktualizowane, jeśli zmieniło się uruchamianie lub struktura
