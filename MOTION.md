# Pohyb a odezva rozhraní

Sdílené soubory `subjects/motion.css` a `subjects/motion.js` doplňují původní obě aplikace. Nemění otázky, odpovědi, bodování, úložiště ani karty. `subjects/shell.js` a `subjects/bridge.js` propojují přepínač s krátkým přechodem mezi stále otevřenými předměty.

| Interakce | Délka |
| --- | --- |
| Výběr předmětu | 260 ms |
| Přechod obsahu mezi předměty | 190 ms |
| Ročník / tematický filtr | 250 ms |
| Mobilní nabídka | 190 ms |
| Vstup vybraných sekcí | 240 ms, odstup nejvýše 75 ms |
| Ukazatel pokroku | 300 ms |
| Uložení práce | 170 ms |

Animace reagují na systémové nastavení omezeného pohybu, včetně změny za běhu. Tuto volbu nemusí uživatel nastavovat zvlášť v aplikaci. Kliknutí, obsluha klávesnice, ukládání a spuštění testu nečekají na dokončení animace. Opakovaný výběr, změna velikosti okna nebo změna předmětu probíhající animaci bezpečně ukončí nebo obrátí.

Pracovní papír, SVG, souřadnice anotací a geometrické nástroje se neanimují. Při začátku tahu se přechodné efekty ukončí. Odezva hlavičky nesleduje změny ve stromu kreseb, takže tahy nevyvolávají opakované prohledávání celé stránky. Matematický vzor zůstává statický.

Převládají transformace a průhlednost. Pouze rozbalení a malý absolutně umístěný indikátor potřebují změnu rozměru. Nejsou přidané knihovny, trvalé animační smyčky, rozostřování ani dekorativní efekty na pozadí. Obě nová aktiva obsahuje původní offline sada.

Ověření v Chromium 153 a WebKit 26.5: pohyb indikátoru, přechod pouze přes průhlednost, přepínání bez načtení dokumentů, klávesnice, rychlé obracení přechodů, rozbalení/zavření ročníků, mobilní menu, změna velikosti za běhu a omezený pohyb. Při omezeném pohybu nebyla při spuštění ani přepnutí vytvořena žádná nová animace. Regresní kontroly zahrnovaly původní hodnocení, oba náhodné mixy, témata, ukládání, obnovu poznámek a offline otevření obou předmětů.

Rozvržení a základní funkce byly zkontrolovány na 11 velikostech od 320×568 po 1920×1080, včetně obou orientací. Automatické porovnání původní a nové verze potvrdilo stejné rozměry, polohy, typografii a barvy hlaviček, karet, úvodu, pokroku i témat při šířkách 390 a 1440 px. V Chromium byly navíc ověřeny simulované dotykové a tlakové stylusové tahy v obou předmětech a matematická úsečka, zpět/znovu a přiblížení.

Skutečný iPhone, Android, instalace na zařízení, hardwarový stylus a snímková frekvence na fyzickém zařízení nebyly dostupné k měření. Cílem je plynulý pohyb; dokumentace nezaručuje 60 FPS na libovolném zařízení.

Před úpravami byla zachována větev `backup/before-premium-motion` a kopie původního soukromého balíčku. Žádný původní projektový soubor nebyl odstraněn. Vývojářské importy zůstávají v samostatné místní edici.
