/* Ładuje skrypty appki (zwykłe <script>, bez modułów) do osobnego kontekstu vm,
   tak jak przeglądarka: wszystkie deklaracje najwyższego poziomu są wspólne.
   Zwraca obiekt, z którego czytasz nazwy: const {parseChord} = load('js/theory.js'). */
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');

function load(...files){
  return loadWith({}, ...files);
}
/* To samo, ale z podstawionymi globalami przeglądarki (np. navigator z MIDI).
   Kontekst vm ma własne globale, więc nie wystarczy ustawić ich w teście. */
function loadWith(globals, ...files){
  const ctx = vm.createContext({console, setTimeout, clearTimeout, ...globals});
  for(const f of files){
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, {filename: f});
  }
  return new Proxy({}, {
    get: (_, name) => typeof name === 'string' ? vm.runInContext(name, ctx) : undefined,
    set: (_, name, value) => { ctx[name] = value; return true; },
  });
}

// obiekty z innego kontekstu vm mają inne prototypy — do porównań zamieniamy je na zwykły JSON
const plain = x => x === undefined ? undefined : JSON.parse(JSON.stringify(x));

module.exports = {load, loadWith, plain, ROOT};
