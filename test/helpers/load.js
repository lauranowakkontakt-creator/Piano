/* Ładuje skrypty appki (zwykłe <script>, bez modułów) do osobnego kontekstu vm,
   tak jak przeglądarka: wszystkie deklaracje najwyższego poziomu są wspólne.
   Zwraca obiekt, z którego czytasz nazwy: const {parseChord} = load('js/theory.js'). */
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');

function load(...files){
  const ctx = vm.createContext({console, setTimeout, clearTimeout});
  for(const f of files){
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, {filename: f});
  }
  return new Proxy({}, {get: (_, name) => typeof name === 'string' ? vm.runInContext(name, ctx) : undefined});
}

// obiekty z innego kontekstu vm mają inne prototypy — do porównań zamieniamy je na zwykły JSON
const plain = x => x === undefined ? undefined : JSON.parse(JSON.stringify(x));

module.exports = {load, plain, ROOT};
