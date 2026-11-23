# Matematika a čeština

Kořenový `index.html` spojuje obě původní aplikace pomocí malého přepínače v jejich hlavičce. `matematika.html` zachovává původní matematickou aplikaci, `cestina/` obsahuje původní českou edici. Původní karty, rozvržení, otázky, hodnoticí pravidla, fakta i portréty zůstávají zachované. Společná barevnost je světlá s modrými akcenty.

Každý předmět používá své původní úložiště a vlastní identifikátory pokusů. Přepínač neklonuje otázky ani neslučuje výsledky. Rozpracovaný test se při změně předmětu uloží a jeho čas se pozastaví. Volba předmětu se pamatuje v zařízení.

Původní matematická data uložená na této adrese zůstávají dostupná. Data české aplikace z jiné domény je nutné přenést její původní funkcí **Záloha**; prohlížeče nepovolují číst úložiště jiné domény.

PWA používá jeden kořenový manifest a service worker. Soubory mají relativní cesty pro GitHub Pages ve složce repozitáře. Matematické podklady se ukládají do základní offline mezipaměti. Celý český archiv originálních PDF lze stáhnout v nastavení české edice; otevřené dokumenty se ukládají průběžně.

Veřejné soubory neobsahují soukromé pracovní testy, předvyplněný pokrok ani vývojářské importéry. Místní vývojářská edice je dodávána samostatně.

Před integrací byla zachována větev `backup/before-subject-merge-20261123`; původní český a soukromý vývojářský ZIP byly ponechány beze změny.

Ověřeno v Chromium 153 a WebKit 26.5: přepínání, migrace rozepsaného matematického testu, oddělené odpovědi a poznámky, obnova po načtení, pauza neaktivního časovače a původní hodnocení. Rozvržení kontrolováno na 320×568, 375×667, 390×844, 430×932, 568×320, 844×390, 768×1024, 1024×768, 1280×800, 1440×900 a 1920×1080. V Chromium také ověřeny oba náhodné mixy, tematické procvičování, stažení 110 českých PDF, otevření obou předmětů bez sítě a soukromý matematický import.

Fyzický iPhone, Android, instalace na plochu a hardwarový stylus nebyly v tomto prostředí otestovány.
