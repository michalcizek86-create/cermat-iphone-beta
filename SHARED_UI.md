# Jednotné rozhraní obou předmětů

Matematika a čeština nyní používají stejný základní styl, sešitový styl, responzivní pravidla, písma a pohybovou vrstvu. Výchozím vzhledem zůstává původní bílá matematická aplikace.

`subjects/ui.js` obsahuje společné prezentační komponenty pro hlavičku, úvod, rozložení stránky, zajímavost, ročník, termín, náhodný mix, tematickou kartu, přehled pokroku a nadpis procvičování. Oba předměty je skutečně používají; předávají jim vlastní obsah a původní akce. Změna komponenty nebo společných stylů se projeví v obou předmětech.

Původní matematický základ CSS byl přesunut z HTML do sdíleného souboru `styles/platform-base.140eb2cf598f.css` a zůstává beze změny. Původní český soubor `cestina/shared/design-system.css` je zachovaný, ale již se nenačítá jako druhý systém vzhledu. `cestina/app.css` ponechává pouze potřebné úpravy českého pracovního papíru a odpovědí; rozdílné mezery a velikosti společných ovládacích prvků byly odstraněny.

Čeština používá stejný úvodní panel a sloupcové rozložení jako matematika. Literární poznámky a Josef Jungmann nahrazují matematický vzor a Komenského uvnitř stejných komponent. Zajímavosti, zdroje, přehled pokroku, archivní poznámky, záloha a offline archiv jsou zachované. Ročníky mají stejný kompaktní řádek, nejnovější je zpočátku otevřený. Přehled českých témat používá stejné karty; původní sestavení testu z více oblastí zůstává dostupné vlastním tlačítkem.

Otázky, klíče, metadata zadání, tematické zařazení, algoritmy výběru, bodování, časomíry, ukládání a souřadnice poznámek zůstávají původní. Není potřeba migrace ani reset úložiště. Stávající matematické moduly jsou ponechány; nové verze mění pouze prezentační funkce. Soukromá edice zachovává Import, Nový test, editor, pracovní kopie a vývojářské nástroje češtiny. Ve veřejných souborech nejsou soukromé nástroje ani vyplněné pokusy.

Automatické porovnání v Chromium 153 a WebKit 26.5 ověřuje shodná písma, velikosti, barvy, rámečky, vnitřní odsazení, rozestupy a šířky společných komponent při 320×568, 375×667, 390×844, 430×932, 568×320, 844×390, 768×1024, 1024×768, 1280×800, 1440×900 a 1920×1080. Desktopové a mobilní snímky byly porovnány pro oba předměty.

Regresní kontroly ověřují spouštění zadání, původní hodnocení, vlastní rozpracované pokusy obou předmětů, přepínání, poznámky, obnovení po načtení, náhodné mixy, témata, výběr napříč českými oblastmi, soukromý import, offline otevření a animace včetně omezeného pohybu. Simulovaný dotyk a tlakový stylus se kontrolují v původních souřadnicích papíru.

Skutečné telefony, instalace na zařízení, hardwarový stylus a FPS na fyzickém zařízení nebyly v tomto prostředí dostupné. Rozdílné počty témat, texty, dostupné termíny, výsledky a typy odpovědí představují obsah jednotlivých předmětů.

Žádný původní soubor nebyl odstraněn. Před úpravami byly zaznamenány kontrolní součty obou projektů a zachována původní soukromá edice i větev `backup/before-shared-subject-ui`.
