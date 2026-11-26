# Pohyb a odezva rozhraní

Matematika i čeština používají časování ze souboru `subjects/motion.css`. Stejné hodnoty čte přepínač předmětů v hlavním okně i `subjects/motion.js` uvnitř obou předmětů.

| Interakce | Délka |
| --- | --- |
| Stisk tlačítka, uložení práce | 150 ms |
| Ročník, rozepsané pokusy, mobilní nabídka, dialog, ukazatel pokroku | 300 ms |
| Přepnutí předmětu, otevření tématu nebo jiné stránky | 420 ms |
| Úvodní nadpis a výsledek testu | 520 ms |

U nové stránky postupně nastoupí nejvýše čtyři viditelné prvky s odstupem 32 ms. Tlačítka a formuláře přijímají vstup hned. Úspěšnost a výsledky zobrazují skutečné hodnoty už od prvního snímku.

Při rychlém přepnutí zpět se prolínání předmětů obrátí z aktuální polohy. Indikátor používá tlumenou pružinu s překmitem menším než jedno procento. Ročník si změří obě velikosti jednou. V podporovaných prohlížečích pak postupně odhaluje termíny a posouvá dotčené řádky transformací. Klávesnicí jde otevření i zavření obrátit stejně jako dotykem.

Při vstupu do testu se objeví jeho název. Papír a vrstva kreseb zůstávají v souřadnicích zadání. Začátek tahu nebo zadávání odpovědi ukončí probíhající přechod. Systémové omezení pohybu vypíná efekty i plynulé posouvání k úloze. Změna nastavení platí i na otevřené stránce.

Dialog si ponechává nativní ovládání klávesnicí a formulář odevzdá výsledek při potvrzení. Ve WebKitu může zavřený dialog po dobu přechodu zůstat viditelný jako neaktivní plocha. Vstup v té době přijímá stránka pod ním a při opětovném otevření lze dialog ihned ovládat.

Pro připojení rozhraní doučování lze použít nativní `dialog` nebo prvek s atributem `popover`. Atribut `data-motion="message"` patří na obal nově vložené zprávy. Text může postupně přibývat uvnitř stejného prvku. Zprávy načtené z historie tento atribut nepotřebují. Samotný tutor zatím není součástí tohoto vydání.

Při měření na lokálně načtené matematice se v Chromium 153 i WebKitu 26.5 sledovaly intervaly `requestAnimationFrame` při šířkách 390 a 1440 px. V Chromium byl medián 16,7 ms. V desktopovém WebKitu se proti předchozímu vydání 95. percentil otevření ročníku zkrátil ze 40 na 22 ms a zavření z 38 na 27 ms. První vykreslení papíru může zabrat více snímků. Měření proběhlo v automatizovaných prohlížečích na Linuxu. Fyzické telefony a displej se 120 Hz nebyly součástí měření.
