# Cermat testy · Matematika pro 9. třídu

[Otevřít aplikaci](https://michalcizek86-create.github.io/cermat-iphone-beta/)

Žákovská verze obsahuje oficiální termíny, náhodný mix, procvičování podle témat a pracovní papír. Odpovědi, výsledky a kresby se ukládají v aktuálním profilu prohlížeče. Nový profil začíná bez rozepsaných testů a výsledků.

## iPhone a offline použití

1. Otevři aplikaci v Safari.
2. V nabídce **Sdílet** zvol **Přidat na plochu**.
3. Otevři aplikaci z nové ikony a v Nastavení vyčkej na **Offline připraveno**.

## Vydávání změn

GitHub Pages publikuje kořen větve `main` při každém pushi. Soubory v `js/` mají v názvu otisk obsahu. Při změně souborů aktualizuj jejich odkazy a případně uprav seznam `FILES` v `service-worker.js`. Před pushem spusť `python stamp-release.py`, aby se přepočítaly otisky offline souborů a označení verze.

Při aktualizaci aplikace použije uložené soubory se stejným obsahem. Nová verze je k dispozici po ověření všech souborů. Tlačítko **Načíst novou verzi** se objeví mimo otevřený test.

Do této větve patří pouze vydané soubory pro žáky. Vývojářská edice a zálohy se používají na místní adrese.
