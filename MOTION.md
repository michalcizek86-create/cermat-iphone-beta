# Pohyb a odezva rozhraní

Matematika i čeština používají časování ze souboru `subjects/motion.css`. Stejné hodnoty čte přepínač předmětů v hlavním okně i `subjects/motion.js` uvnitř obou předmětů.

| Interakce | Délka |
| --- | --- |
| Stisk a uvolnění tlačítka | 70 až 200 ms |
| Mobilní nabídka a dialog | 340 ms |
| Rozbalení ročníku, otočení šipky a odkrytí termínů | 380 ms |
| Přepnutí předmětu nebo stránky | 390 ms |
| Úvodní nadpis a výsledek testu | 460 ms |
| Změna ukazatele pokroku | 540 ms |

Při přepnutí předmětu naváže modrý indikátor na svoji současnou polohu. Viditelný obsah se ztlumí a další předmět se přisune o 12 px. Opětovné přepnutí během přechodu obrátí probíhající pohyb. U ročníku se současně otáčí šipka, odkrývají termíny a posouvají okolní řádky.

Na nové stránce se postupně objeví nejvýše čtyři viditelné prvky s odstupem 40 ms. Při přechodu na Můj pokrok začne animace cílové sekce po příchodu do výřezu. Ukazatel naváže na naposledy zobrazenou hodnotu i po překreslení stránky. Text výsledku a hodnoty pro čtečku jsou dostupné hned.

Krátká modrá linka pod stavem uložení se objeví po úspěšném zápisu odpovědi nebo poznámky. Při otevření rozepsaného pokusu se na místě stavového řádku krátce zobrazí „Pokračuješ v testu“. Chyba ukládání má přednost.

Při vstupu do testu se objeví jeho název. Papír a vrstva kreseb zůstávají v souřadnicích zadání. Začátek tahu nebo zadávání odpovědi ukončí probíhající přechod. Systémové omezení pohybu vypíná efekty i plynulé posouvání k úloze. Změna nastavení platí i na otevřené stránce.

Dialog si ponechává nativní ovládání klávesnicí a formulář odevzdá výsledek při potvrzení. Ve WebKitu může zavřený dialog po dobu přechodu zůstat viditelný jako neaktivní plocha. Vstup v té době přijímá stránka pod ním a při opětovném otevření lze dialog ihned ovládat.

Pro připojení rozhraní doučování lze použít nativní `dialog` nebo prvek s atributem `popover`. Atribut `data-motion="message"` patří na obal nově vložené zprávy. Text může postupně přibývat uvnitř stejného prvku. Zprávy načtené z historie tento atribut nepotřebují. Samotný tutor zatím není součástí tohoto vydání.

Odkazy na skripty, styly pohybu a oba předměty obsahují otisk jejich obsahu. Instalovaná aplikace při aktualizaci připraví nové podklady v samostatné mezipaměti. Po opětovném otevření lze pokračovat v uloženém pokusu i bez připojení.
