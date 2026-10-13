# Sudoku Lens

Lokale Browser-App zum Erkennen und Lösen eines gedruckten oder auf einem Bildschirm angezeigten Sudokus.

## Start

Öffne `index.html` direkt in einem modernen Browser. Die App benötigt keine Internetverbindung: Erkennung, Schriften und alle Module liegen lokal, das Foto wird ausschließlich im Browser verarbeitet und nicht hochgeladen.

Für den Query-Parameter `fixture` (siehe unten) muss die App über einen lokalen Webserver ausgeliefert werden, zum Beispiel:

```bash
npx serve .
```

Rufe anschließend den angezeigten Pfad `/src/sudoku-app/` auf.

## Bedienung

1. Foto aufnehmen oder auswählen. Das Sudokuraster wird automatisch gesucht, mit einem Rahmen markiert, und die erkannten Zahlen erscheinen sofort im Sudoku.
2. Liegt der Rahmen daneben, die vier Ecken auf die Ecken des äußeren Gitters ziehen. In der Nähe eines erkannten Gitters rastet der Rahmen beim Loslassen ein, und die Zahlen werden neu erkannt.
3. Orange markierte beziehungsweise falsch erkannte Zahlen korrigieren.
4. Das Sudoku lösen. Hat das Raster mehrere Lösungen, fehlen meist erkannte Zahlen; die App löst es dann nicht.

Für gute Ergebnisse sollte das Rätsel scharf, gleichmäßig beleuchtet und ohne handschriftliche Einträge fotografiert werden. Perspektivische Verzerrung und Drehung werden ausgeglichen, auch wenn das Foto quer oder auf dem Kopf gespeichert wurde (typisch beim flachen Fotografieren eines liegenden Blatts).

Akzeptiert werden Bilddateien bis 20 MB und ab einer Auflösung von 300 × 300 Pixeln. Fotos mit mehr als 24 Megapixeln werden vor der Erkennung verkleinert.

## Aufbau

| Datei                                 | Aufgabe                                                                     |
| ------------------------------------- | --------------------------------------------------------------------------- |
| `index.html`, `styles.css`            | Oberfläche                                                                  |
| `app.js`                              | Bedienung: Foto laden, Rahmen ziehen, Ergebnis anzeigen (einziger DOM-Code) |
| `scanner.js`                          | Bilderkennung ohne DOM und ohne OCR-Bibliothek                              |
| `digit-templates.js`                  | Ziffernvorlagen für `scanner.js` (erzeugt)                                  |
| `sudoku.js`                           | Prüfen, Lösen, Lösungen zählen, OCR-Konflikte bereinigen                    |
| `tools/build-digit-templates.js`      | erzeugt `digit-templates.js`                                                |
| `favicon.svg`, `apple-touch-icon.png` | Icon für Browser-Tab und Home-Bildschirm                                    |
| `tools/build-icons.js`                | erzeugt `apple-touch-icon.png` aus `favicon.svg`                            |

`scanner.js` arbeitet nur mit RGBA-Pixeldaten (`{ data, width, height }`) und läuft deshalb unverändert im Browser und in Node.js:

1. `findGrid(image)` sucht das größte regelmäßige 9×9-Gitter und liefert seine vier Ecken sowie ein perspektivisch entzerrtes Graustufenraster.
2. `snapCorners(image, corners)` lässt von Hand gesetzte Ecken auf ein erkanntes Gitter einrasten, das höchstens drei Viertel einer Zellbreite entfernt liegt.
3. `warpCorners(image, corners)` entzerrt das Raster zu beliebigen Ecken.
4. `recognizeDigits(board)` schneidet die 81 Zellen aus und vergleicht jede Ziffer mit den Vorlagen. Dabei werden alle vier Ausrichtungen probiert; es gewinnt die, deren Ziffern am besten passen.
5. `gridToString(grid)` gibt das Raster als 81-stelligen String aus (`.` für leere Felder).

`scanSudoku(image)` fasst Rastersuche und Ziffernerkennung zusammen. Im Browser muss `digit-templates.js` vor `scanner.js` geladen werden.

Die Vorlagen werden mit `node src/sudoku-app/tools/build-digit-templates.js` aus 18 Systemschriften mit Normalziffern erzeugt (u. a. Arial, Verdana, Segoe UI, Franklin Gothic, Bahnschrift, Roboto, Cambria, Palatino, Impact, teils auch fett); dafür werden `sharp` und diese Schriften benötigt. Fehlt eine Schrift, bricht das Skript ab, statt stillschweigend eine Ersatzschrift zu verwenden.

## Tests und Fixtures

Die Tests unter `test/sudoku-app/` lesen jedes Foto aus `fixtures/` ein und prüfen die gesamte Kette: Bild einlesen, Raster erkennen, Ziffern erkennen, Sudoku als String ausgeben und lösen. Außerdem prüfen sie das Einrasten ungenau gesetzter Ecken. Die Fotos sind auf 1600 Pixel Kantenlänge verkleinert und ohne Metadaten gespeichert; auf den Zeitungsfotos sind Kontaktdaten von Privatpersonen unkenntlich gemacht, der übrige Bildinhalt bleibt als Störfaktor für die Rastersuche erhalten.

Ein Fixture kann ohne Dateidialog über den Query-Parameter `fixture` in die App geladen werden:

```text
http://localhost:3000/src/sudoku-app/?fixture=PXL_20261013_131613617.jpg
```

Der Dateiname darf nur Buchstaben, Ziffern, Punkt, Unterstrich und Bindestrich enthalten. Die Verarbeitung bleibt identisch zum normalen Foto-Upload.
