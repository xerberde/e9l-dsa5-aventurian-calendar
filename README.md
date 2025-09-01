# DSA Calendar - FoundryVTT Modul

Ein vollständiges Kalendersystem für "Das Schwarze Auge" (DSA) in FoundryVTT.

## Features

- **Vollständiges DSA-Kalendersystem** mit allen 12 Göttermonaten udn Namenlosen Taen
- **Design** im dunklen FoundryVTT-Stil
- **Dynamische Anzeige** von Mondphasen und Jahreszeiten
- **Flexible Navigation** mit Modifier-Keys
- **Weltweite Synchronisation** des Datums
- **Responsive Design** für verschiedene Bildschirmgrößen

## Installation

1. Lade das Modul herunter und entpacke es in deinen FoundryVTT `modules`-Ordner
2. Aktiviere das Modul in den Moduleinstellungen
3. Das Kalender-Overlay erscheint automatisch für Spielleiter

## Bedienung

### Navigation
- **Klick**: ±1 Tag
- **Shift + Klick**: ±1 Monat  
- **Strg + Klick**: ±1 Jahr

### Anzeige
- **Datum**: Im Format "Tag Monat, Jahr BF - Wochentag"
- **Jahreszeit**: Dynamisches Symbol (☀️🍂❄️🌸)
- **Mondphase**: Dynamisches Symbol (🌑🌒🌓🌔🌕🌖🌗🌘)

## DSA-Kalendersystem

Das Modul implementiert das vollständige DSA-Kalendersystem:

- **12 Monate** à 30 Tage (Göttermond)
- **5 Namenlose Tage** (dem Namenlosen geweiht)
- **7-Tage-Woche** mit durchlaufender Zählung
- **28-tägiger Mondzyklus** mit 8 Phasen
- **Feste Jahreszeitenanfänge**
- **Anzeige von Feiertagen an dem aktuellen Tag**
- **Anzeige von vergangen Events zurück bis 0 BF für den aktuellen Tag**
- **Events werden Rückwirkend 6 Monate nach dem aktuellen Tag angezeigt... Nachrichten dauern hat ein bisschen bis sie zum Helden kommen.**

## Technische Details

- **Kompatibilität**: FoundryVTT v12+
- **Weltdaten**: Das aktuelle Datum wird weltenweit gespeichert
- **Performance**: Schlanker Code ohne externe Abhängigkeiten


## Support

Bei Problemen oder Fragen erstelle bitte ein Issue im GitHub-Repository.

## Lizenz
Feiertage und Events aus Wiki Aventurica übernommen.

MIT License - Siehe LICENSE-Datei für Details.
