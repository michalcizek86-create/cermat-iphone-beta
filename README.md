# CERMAT – instalace na iPhone přes GitHub Pages

Aplikace používá pouze tmavý režim. Platí i při světlém nastavení telefonu a při obnovení dřívější volby vzhledu; přepínač tématu byl odstraněn.

Tento balíček obsahuje aktuální aplikaci se všemi původními funkcemi, 41 testy, 988 záznamy úloh, procvičováním podle témat a pracovním papírem. Není potřeba nic sestavovat ani instalovat Node.js.

## 1. Nejdřív přenes dosavadní postup

1. V původní aplikaci otevři **Import** a použij **Stáhnout úplnou zálohu**. Zachová odpovědi, kresby, rozepsané pokusy, výsledky i vlastní testy.
2. Soubor se zálohou si ponech. Importuje se do aplikace; nenahrává se do GitHub repozitáře.
3. Po instalaci níže otevři aplikaci **z nové ikony na ploše**, vyber **Import → Načíst zálohu** a zvol uložený soubor.

Data jsou místní v prohlížeči. Nová adresa GitHub Pages nemůže sama přečíst úložiště původní adresy. Safari a aplikace na ploše mohou mít oddělená data, proto zálohu importuj až uvnitř nainstalované aplikace. Původní úložiště ani postup se tímto balíčkem nemaže nebo nepřepisuje.

## 2. Nahraj aplikaci na GitHub Pages

1. Rozbal ZIP. Do repozitáře nahraj **obsah rozbaleného balíčku**, nikoli ZIP jako jeden soubor.
2. Na stejné úrovni musí ležet `index.html`, `manifest.webmanifest`, `service-worker.js`, soubor `.nojekyll` a složka `icons`.
3. Na GitHubu otevři svůj repozitář → **Settings → Pages**.
4. Pod **Build and deployment / Source** vyber **Deploy from a branch**.
5. Vyber větev **main**, složku **/(root)** a klikni na **Save**. Pokud používáš jinou větev, zvol tu, do které jsi soubory nahrál.
6. Počkej na dokončení publikování. Otevři adresu zobrazenou přímo v nastavení Pages.

Běžná adresa má podobu `https://TVUJ-UCET.github.io/NAZEV-REPOZITARE/`. Žádnou adresu v souborech nepřepisuj: manifest, ikony i service worker používají relativní cesty a fungují i v podadresáři repozitáře. Můžeš publikovat také ze složky `/docs`, pokud do ní vložíš stejný obsah a vybereš ji jako zdroj Pages.

GitHub nepoužívá ZIP jako běžící web. Soubory je potřeba rozbalit. HTML je menší než limit 25 MiB pro nahrávání jednotlivých souborů webovým rozhraním GitHubu; celý balíček tvoří jen několik souborů.

## 3. Přidej aplikaci na plochu iPhonu

1. Otevři publikovanou adresu **v Safari**. Neotvírej jen místní HTML náhled v aplikaci Soubory.
2. Klepni na **Sdílet → Přidat na plochu**.
3. Pokud se nabídne **Otevřít jako webovou aplikaci**, nech tuto volbu zapnutou. Potvrď **Přidat**.
4. Otevři novou ikonu **Cermat** ještě s připojením k internetu.
5. V aplikaci otevři **Nastavení → Aplikace na iPhonu a offline** a počkej na **Offline připraveno**.
6. Načti svou úplnou zálohu podle bodu 1. Nyní můžeš vypnout internet a ověřit otevření testu.

Na telefonu se zobrazí vlastní tmavá ikona s matematickým monogramem M. Aplikace se spustí samostatně a rozložení respektuje výřez displeje i spodní indikátor plochy.

## Offline režim, ukládání a aktualizace

- `index.html` obsahuje veškerou aplikační logiku, otázky, původní diagramy, obrázky i portrét Komenského. Service worker uloží celý potřebný balíček. První spuštění z ikony na ploše musí proběhnout s internetem až do dokončení přípravy.
- Všechny obrázky úloh jsou vloženy s bezeztrátovou kompresí. U 553 podkladových obrázků byla ověřena shoda všech dekódovaných pixelů, bez změny rozměrů, popisků a rozložení zadání.
- Původní klíče místního úložiště a IndexedDB zůstávají zachované. Každý rozepsaný pokus dál ukládá vlastní odpovědi, anotace, čas a aktuální pracovní list.
- Service worker spravuje pouze offline soubory. Nemaže odpovědi, kresby, historii, vlastní testy ani databázi uloženého postupu.
- Nová verze se připraví na pozadí. Nevyvolá automatické načtení stránky uprostřed práce. Po uložení a opuštění testu ji můžeš použít tlačítkem **Použít připravenou aktualizaci** v Nastavení.
- Pokud se první stažení přeruší, nech internet zapnutý a v Nastavení zvol **Zkontrolovat offline podklady**.
- Ukládání i offline dostupnost závisejí na dostupném místě a zásadách iOS. Tlačítko **Požádat o trvalé úložiště** žádá prohlížeč o zvýšenou ochranu uložených dat; neznamená, že uživatel nemůže data ručně smazat. Pravidelná úplná záloha zůstává užitečná.
- Odkazy na externí oficiální PDF, historické prameny a další weby potřebují internet. Zadání a obrázky použité přímo v aplikaci jsou součástí offline balíčku.

## Obsah balíčku

- `index.html` – kompletní česká aplikace s vloženými otázkami a obrázky.
- `manifest.webmanifest` – název, ikony, samostatné zobrazení a relativní rozsah aplikace.
- `service-worker.js` – úplná offline sada a bezpečný přechod mezi verzemi.
- `icons/` – ikony 192 a 512 px, samostatná maskovatelná ikona, Apple Touch ikona 180 px, favicon 32 px a vektorový zdroj ikony.
- `.nojekyll` – přímé publikování statických souborů.
- `VERIFICATION.json` – provedené kontroly a přesná verze balíčku.
- `README.md` – tento návod.

## Ověření a omezení

Prošlo 38 regresních kontrol původní aplikace a 10 kontrol PWA balíčku. Porovnání databáze potvrdilo 41 testů a 988 nezměněných záznamů úloh. Prohlížeč ověřil načtení z podadresáře, úplné offline načtení při vypnutém testovacím serveru, obnovu odpovědi, kresby, pracovního listu a času a aktualizaci bez ztráty rozepsané práce. Mobilní rozměry 320 a 390 px a tablet 768 px se kontrolují bez vodorovného přetékání.

Fyzický iPhone ani skutečná instalace přes jeho nabídku Sdílet nebyly v testovacím prostředí dostupné. Balíček používá standardní PWA a iOS metadata; výsledky testů neznamenají ověření konkrétního zařízení. Deset úloh má i nadále záměrně jen obecnou kategorii geometrie, kterou lze v aplikaci upřesnit.

## Zdroje a původní materiály

- Nastavení GitHub Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- Přidání webové aplikace na iPhone: https://support.apple.com/guide/iphone/iphea86e5236/ios
- Místní úložiště a jeho trvalost: https://webkit.org/blog/14403/updates-to-storage-policy/
- Oddělení dat webové aplikace a prohlížeče: https://developer.apple.com/videos/play/wwdc2023/10120/
- Portrét: George Glover, 1642; frontispis vydání The Great Didactic of John Amos Comenius (1896), Wikimedia Commons, volné dílo: https://commons.wikimedia.org/wiki/File:Comenius_by_George_Glover.jpg

Původní zdroje CERMAT zůstávají uvedené u jednotlivých zadání. Vlastní ikona vychází z monogramu stávající aplikace.
