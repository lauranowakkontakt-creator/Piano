/* Zakładka „Źródła" — gdzie uczyć się dalej */
const SOURCES = [
  {group:'Teoria i ćwiczenia', items:[
    {name:'musictheory.net', url:'https://www.musictheory.net/lessons', lang:'EN', desc:'Krótkie, obrazkowe lekcje od zera + ćwiczenia (czytanie nut, akordy, interwały). Najlepsze uzupełnienie tej appki.'},
    {name:'teoria.com', url:'https://www.teoria.com', lang:'EN', desc:'Teoria z ćwiczeniami słuchowymi: rozpoznawanie akordów, interwałów, dyktanda.'},
    {name:'Hooktheory', url:'https://www.hooktheory.com/theorytab', lang:'EN', desc:'Baza tysięcy piosenek rozpisanych na cyfry rzymskie i funkcje. Zobacz, jak znane utwory używają I–V–vi–IV.'},
  ]},
  {group:'Po polsku', items:[
    {name:'Szkoła Pianina (YouTube)', url:'https://www.youtube.com/szkolapianina', lang:'PL', desc:'Gra akordami, improwizacja, czytanie nut i technika — dla osób, które nie wiedzą, od czego zacząć.'},
    {name:'Szkoła Pianina — strona', url:'https://szkolapianina.pl/', lang:'PL', desc:'Kursy i materiały do gry na pianinie od podstaw.'},
    {name:'Rafał Piwowarczuk', url:'https://rafalpiwowarczuk.pl/', lang:'PL', desc:'„Świadoma gra na pianinie" — akcent na rozumienie harmonii, nie tylko granie z nut.'},
    {name:'MuzyczneLekcje.pl', url:'https://muzycznelekcje.pl/nauka-gry-na-pianinie-od-podstaw/', lang:'PL', desc:'Artykuły i kursy łączące teorię z praktyką.'},
  ]},
  {group:'Harmonia na YouTube', items:[
    {name:'Signals Music Studio', url:'https://www.youtube.com/@SignalsMusicStudio', lang:'EN', desc:'Przystępnie o akordach, progresjach i „dlaczego to brzmi dobrze".'},
    {name:'David Bennett Piano', url:'https://www.youtube.com/@DavidBennettPiano', lang:'EN', desc:'Analizy znanych piosenek przy pianinie — świetne po lekcjach 5–9.'},
  ]},
  {group:'Nuty i programy', items:[
    {name:'MuseScore', url:'https://musescore.org', lang:'PL/EN', desc:'Darmowy program do pisania nut (jest po polsku). Możesz w nim zapisać swoje melodie.'},
    {name:'MuseScore.com', url:'https://musescore.com', lang:'EN', desc:'Ogromna biblioteka nut, także uproszczonych aranżacji popularnych piosenek.'},
  ]},
];

const ViewZrodla = {
  title:'Źródła',
  render(root){
    root.append(
      h('header',{style:'margin-bottom:22px'},
        h('p',{class:'kicker'},'gdzie dalej'),
        h('h1',null,'Źródła do ', h('em',null,'nauki')),
        h('p',{class:'lead'},'Sprawdzone miejsca, żeby pogłębić to, co jest w appce. Linki otwierają się w nowej karcie.')));
    SOURCES.forEach(g=>{
      const grid = h('div',{class:'links'});
      g.items.forEach(it=>grid.append(h('a',{class:'card',href:it.url,target:'_blank',rel:'noopener'},
        h('b',null,it.name), h('span',{class:'tag'},it.lang), h('span',{class:'u'},it.url.replace(/^https?:\/\//,'').replace(/\/$/,'')), h('p',null,it.desc))));
      root.append(h('section',null, h('h2',null,g.group), grid));
    });
    root.append(h('div',{class:'box tip',style:'margin-top:28px'}, h('p',null,'Jak korzystać: po każdej lekcji z zakładki Teoria obejrzyj jeden film na ten sam temat. Inne wytłumaczenie tego samego = mocniejsze zrozumienie.')));
  }
};
