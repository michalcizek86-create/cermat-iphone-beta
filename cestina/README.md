# CERMAT Čeština

Samostatná aplikace pro přípravu žáků 9. tříd na přijímací zkoušku z českého jazyka a literatury. Používá tmavý vzhled a stejné styly jako matematická edice.

Balík obsahuje 33 řádných a náhradních termínů a 7 ilustračních testů z oficiálního archivu CERMAT pro čtyřleté obory. Každé zadání má vlastní testový sešit, klíč a 30 očíslovaných úloh. Přehled zdrojů a dostupnosti je v IMPORT_REPORT.json a data/catalogue.json.

## Spuštění na počítači

1. Rozbal ZIP do samostatné složky.
2. V této složce spusť příkaz `python -m http.server 8000` (případně `python3 -m http.server 8000`).
3. Otevři [http://localhost:8000/](http://localhost:8000/).

Aplikace běží z webového serveru bez sestavení a bez registrace. Soubory otevřené přímo z disku nemají přístup ke stejným funkcím prohlížeče.

## GitHub Pages

CERMAT dovoluje zveřejnit odkazy na své materiály. Veřejné zpřístupnění kopií zadání a klíčů se řídí jeho [pravidly pro využívání obsahu](https://prijimacky.cermat.gov.cz/files/files/CZVV_pravidla-vyuziti-webstrankyp.pdf). Tento balík obsahuje originály a je připravený pro místní studium nebo nasazení s příslušným oprávněním.

1. Vytvoř nový repozitář, například `cermat-cestina`. V GitHub Desktop použij **File → New repository** a otevři jeho složku přes **Repository → Show in Explorer**.
2. Přesuň do něj rozbalený obsah ZIPu. Soubor `index.html`, manifest, service worker, `.nojekyll` a složky `data`, `official`, `shared`, `vendor`, `assets` a `icons` mají být přímo v kořeni repozitáře.
3. V GitHub Desktop potvrď změny tlačítkem **Commit to main** a nahraj je přes **Publish repository** nebo **Push origin**.
4. Na GitHubu otevři **Settings → Pages**. Vyber **Deploy from a branch**, větev **main**, složku **/(root)** a stiskni **Save**.
5. Po dokončení nasazení použij odkaz z **Settings → Pages**. U repozitáře `cermat-cestina` má obvykle tvar `https://UZIVATEL.github.io/cermat-cestina/`.

GitHub Pages rozbalené soubory obsluhuje přímo. Aktualizaci nahraješ jako nový commit ve stejném repozitáři. Po změně souborů aplikace spusť `python tools/package.py`, aby se přepočítala verze offline souborů. [Návod GitHubu k Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## iPhone a offline

1. Otevři stránku v Safari. V nabídce **Sdílet** zvol **Přidat na plochu** a potvrď. Je-li v nabídce volba **Otevřít jako webovou aplikaci**, nech ji zapnutou.
2. Otevři aplikaci z nové ikony alespoň jednou s připojením. Otevřená zadání se ukládají průběžně.
3. V **Nastavení → Offline archiv** můžeš stáhnout všechna zadání, klíče a dostupná komentovaná řešení najednou. Počkej na hlášení „Celý archiv je připravený offline“.
4. Pokusy a poznámky zůstávají v úložišti daného prohlížeče nebo instalace. Pro přesun použij **Záloha a přenos dat**.

## Práce se zadáním

- Roky se rozbalují na skutečně dostupné termíny. Řádné, náhradní a ilustrační sady mají samostatný průběh i výsledky.
- **Uložit a odejít** zachová odpovědi i poznámky. Přehled nedokončených pokusů je na hlavní stránce a v historii.
- Ve zkoušce se zobrazuje originální stránka PDF a pod ní odpovědi k úlohám. **Přejít na úlohu** přeskočí na její stránku.
- Pro poznámky vyber nástroj a táhni myší, prstem nebo Apple Pencil. Poznámku vložíš klepnutím do papíru. Pro běžné posouvání stránky zvol **Posouvání**. Tlačítka **Zpět** a **Znovu** pracují s právě označovanou stránkou.
- Uzavřené úlohy se hodnotí podle klíče, včetně částečných bodů a pravidel pro seřazení textu. Otevřené úlohy s odpovědí čekají na kontrolu. Ve výsledku porovnej zápis s klíčem a vyber počet bodů podle jeho pravidel. Klíče mohou uvádět jen příklady platných odpovědí.
- Časomíra používá cvičný limit 60 minut a při odchodu z testu se pozastaví. Po vypršení můžeš pokračovat.
- Náhodný mix a procvičování podle témat používají odkazy na původní úlohy. Výběr témat je pomůcka aplikace. Úloha si zachovává původní číslo, stránku, výchozí text a klíč.

## Zdrojová data a budoucí integrace

- `data/subject-cz.json` má verzi schématu, předmět `cz`, původní termíny a stabilní ID úloh. Obsahuje odkaz na nezměněný testový sešit, jeho kontrolní součet, číslo úlohy, stránky zadání a klíče i body.
- `shared/design-system.css` je převzatý vzhled matematické edice. `app.css` doplňuje zobrazení českých zadání.
- `shared/ui.js`, `shared/paper.js`, `shared/annotations.js` a `shared/scoring.js` oddělují společné ovládání testu, originální stránky a vyhodnocení.
- Pokusy v IndexedDB mají pole `subject`, `profileId`, `questionIds`, `answers`, `papers` a `result`. Česká edice ukládá ID s prefixem `cz:`. Vrstva poznámek používá souřadnice v původním rozměru stránky PDF.
- `tools/download_official.py` a `tools/import_official.py` reprodukují import z uvedených zdrojů. Potřebují Python a PyMuPDF. `python tools/verify_data.py` ověří integritu připravené databáze. `python tools/package.py CERMAT_Cestina_GitHub_Pages.zip` připraví distribuční ZIP.
- PDF.js je součástí balíku v `vendor`, včetně licence. Jeho soubory se načítají lokálně.

## Ověření vydání

Kontrola databáze ověřila 40 sad po 30 úlohách, jejich bodování a kontrolní součty všech přiložených PDF. V prohlížeči Chrome byl ověřen běh v podadresáři, rozložení na šířce telefonu, zahájení a obnovení pokusu po načtení stránky, poznámky při změně přiblížení, výsledky a generování podle tématu i náhodného mixu. Po stažení archivu se podařilo otevřít dosud neotevřené zadání bez běžícího serveru. Instalace na fyzický iPhone a použití Apple Pencil se z tohoto prostředí neověřovaly.

Zadání a klíče pocházejí z [oficiálního archivu CERMAT](https://prijimacky.cermat.gov.cz/menu/testova-zadani-k-procvicovani/testova-zadani-v-pdf/ctyrlete-obory-cesky-jazyk-a-literatura.html). Portrét Josefa Jungmanna namaloval Antonín Machek v roce 1833. Zmenšená reprodukce používá snímek od [Ablakok / Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Anton%C3%ADn_Machek_-_Portrait_of_Josef_Jungmann.jpg) pod licencí [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Zajímavosti mají jednotlivé zdroje v data/facts.json.
