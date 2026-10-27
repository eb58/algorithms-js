# Sudoku Lens

Lokale Browser-App zum Erkennen und Lösen eines gedruckten oder auf einem Bildschirm angezeigten Sudokus.

## Start

Öffne `index.html` direkt in einem modernen Browser. Die App benötigt keine Internetverbindung: Erkennung, Schriften und alle Module liegen lokal, das Foto wird ausschließlich im Browser verarbeitet und nicht hochgeladen.

Für den Query-Parameter `fixture` (siehe unten) muss die App über einen lokalen Webserver ausgeliefert werden, zum Beispiel:

```bash
npx serve .
```

Rufe anschließend den angezeigten Pfad `/src/sudoku/web-app/` auf.

## Bedienung

1. Mit „Bild auswählen“ ein vorhandenes Bild wählen. Auf Geräten mit Touch-Bedienung wird zusätzlich „Foto aufnehmen“ angezeigt, um die Kamera zu öffnen (abhängig vom Browser). Alternativ ein Bild in den Eingabebereich ziehen. Das Sudokuraster wird automatisch gesucht und gelesen; danach zeigt die App nur noch den aufrecht gedrehten Bildausschnitt mit dem markierten Sudoku.
2. Ist das erkannte Rätsel eindeutig lösbar, löst die App es sofort: Die ergänzten Zahlen erscheinen blau und perspektivisch passend in den leeren Zellen des Fotos. Unsicher erkannte Vorgaben sind im Foto orange eingekreist; dann bleibt auch das erkannte Sudoku zur Kontrolle sichtbar, denn eine falsch gelesene Vorgabe kann zu einer falschen Lösung führen.
3. Mussten widersprüchliche Ziffern verworfen werden, fehlen zu viele Zahlen oder ist das Rätsel nicht eindeutig lösbar, erscheint neben dem Foto das erkannte Sudoku zur Kontrolle: orange markierte beziehungsweise falsch erkannte Zahlen korrigieren und mit „Sudoku lösen“ lösen. Wird danach eine Zahl korrigiert, verschwindet die Lösung wieder. Hat das Raster mehrere Lösungen, fehlen meist erkannte Zahlen; die App zeigt dann die ersten beiden Möglichkeiten zum Vergleichen an. Wird kein Raster gefunden oder liegt der Rahmen daneben, ein neues, geraderes Foto aufnehmen.

Bei einem Erkennungsproblem speichert die App das Originalfoto als `sudoku-problem-<Dateiname>` im Download-Ordner, damit es später als Fixture dienen kann. Als Problem gilt: kein Raster gefunden, Erkennung fehlgeschlagen, unsichere oder widersprüchliche Ziffern, zu wenige Zahlen oder keine eindeutige Lösung. Jedes Foto wird höchstens einmal gespeichert; per `fixture` geladene Fotos nie. Das Foto verlässt dabei das Gerät nicht. Mobile Browser fragen beim Herunterladen eventuell nach.

Eine neue Aufnahme leert das bisherige Ergebnis. „Nächstes Foto“ verwirft das aktuelle Foto samt noch laufender Ladevorgänge und öffnet gleich die Kamera (Touch-Geräte) beziehungsweise die Dateiauswahl. Wird während der Erkennung ein neues Foto gewählt oder eine Zahl bearbeitet, darf der überholte Vorgang das aktuelle Ergebnis nicht überschreiben.

Für gute Ergebnisse sollte das Rätsel scharf, gleichmäßig beleuchtet und ohne handschriftliche Einträge fotografiert werden. Perspektivische Verzerrung und Drehung werden ausgeglichen, auch wenn das Foto quer oder auf dem Kopf gespeichert wurde (typisch beim flachen Fotografieren eines liegenden Blatts).

Akzeptiert werden Bilddateien bis 20 MB und ab einer Auflösung von 300 × 300 Pixeln. Fotos mit mehr als 24 Megapixeln werden vor der Erkennung verkleinert.

## Aufbau

| Datei                                 | Aufgabe                                                                       |
| ------------------------------------- | ----------------------------------------------------------------------------- |
| `index.html`, `styles.css`            | Oberfläche                                                                    |
| `app.js`                              | Bedienung: Foto laden, Rahmen anzeigen, Ergebnis anzeigen (einziger DOM-Code) |
| `scanner.js`                          | Bilderkennung ohne DOM und ohne OCR-Bibliothek                                |
| `digit-templates.js`                  | Ziffernvorlagen für `scanner.js` (erzeugt)                                    |
| `sudoku.js`                           | Lösungen zählen und OCR-Konflikte bereinigen                                  |
| `../sudoku5.js`, `../sudokuUtils.js`  | gemeinsamer Solver und Eingabevalidierung                                     |
| `tools/build-digit-templates.js`      | erzeugt `digit-templates.js`                                                  |
| `favicon.svg`, `apple-touch-icon.png` | Icon für Browser-Tab und Home-Bildschirm                                      |
| `tools/build-icons.js`                | erzeugt `apple-touch-icon.png` aus `favicon.svg`                              |

`scanner.js` arbeitet nur mit RGBA-Pixeldaten (`{ data, width, height }`) und läuft deshalb unverändert im Browser und in Node.js:

1. `findGrid(image)` sucht das größte regelmäßige 9×9-Gitter und liefert seine vier Ecken sowie ein perspektivisch entzerrtes Graustufenraster. Ist kein Kandidat überzeugend, folgen weitere Suchdurchgänge: erst mit strengerem Schwellwert, dann in einem Graubild aus dem jeweils hellsten Farbkanal, in dem kräftige Farbflächen fast so hell wie Papier erscheinen. So lösen sich farbige Flächen, die am Gitter hängen, und ein umgebendes Rechteck, etwa ein abfotografierter Bildschirm, verdrängt das eigentliche Gitter nicht. Dunkle Farbflächen trennt das nicht ab. Hängt etwas am Außenrahmen, werden die Ecken nachjustiert: Ein Etikett an einer Ecke fällt beim robusten Anpassen gerader Rahmenseiten heraus, ein Schlagschatten entlang des Rahmens wird über die inneren Gitterlinien korrigiert.
2. `snapCorners(image, corners)` lässt ungenau gesetzte Ecken auf ein erkanntes Gitter einrasten, das höchstens drei Viertel einer Zellbreite entfernt liegt. Die App verwendet es derzeit nicht.
3. `warpCorners(image, corners)` entzerrt das Raster zu beliebigen Ecken.
   `cellTransforms(corners, rotation)` liefert umgekehrt die Lage jeder Zelle im Foto als affine Matrix (wie SVG `matrix()`), passend zur von `recognizeDigits` erkannten Drehung; damit trägt die App ergänzte Zahlen ins Foto ein. `gridToImage(corners, points)` bildet einzelne Rasterpunkte perspektivisch korrekt ins Foto ab, etwa für die Blocklinien der Markierung.
4. `recognizeDigits(board)` schneidet die 81 Zellen aus und vergleicht jede Ziffer mit den Vorlagen. Ein zweiter, empfindlicherer Durchgang ergänzt blasse Ziffern nur bei eindeutigen Vorlagentreffern. Dabei werden alle vier Ausrichtungen probiert; es gewinnt die, deren Ziffern am besten passen.
5. `gridToString(grid)` gibt das Raster als 81-stelligen String aus (`.` für leere Felder).

`scanSudoku(image)` fasst Rastersuche und Ziffernerkennung zusammen. Im Browser muss `digit-templates.js` vor `scanner.js` geladen werden.

Die Vorlagen werden mit `node src/sudoku/web-app/tools/build-digit-templates.js` aus 18 Systemschriften mit Normalziffern erzeugt (u. a. Arial, Verdana, Segoe UI, Franklin Gothic, Bahnschrift, Roboto, Cambria, Palatino, Impact, teils auch fett); dafür werden `sharp` und diese Schriften benötigt. Fehlt eine Schrift, bricht das Skript ab, statt stillschweigend eine Ersatzschrift zu verwenden.

## Tests und Fixtures

Die Tests unter `test/sudoku/web-app/` lesen jedes Foto aus `fixtures/` ein und prüfen die gesamte Kette: Bild einlesen, Raster erkennen, Ziffern erkennen, Sudoku als String ausgeben und lösen. Das Fixture mit zusätzlichen Diagonalregeln wird nur bis zur erkannten Eingabe geprüft, da der Solver diese Variante nicht unterstützt. Außerdem prüfen die Tests das Einrasten ungenau gesetzter Ecken. Die bisherigen Fotos sind auf 1600 Pixel Kantenlänge verkleinert und ohne Metadaten gespeichert; auf diesen Zeitungsfotos sind Kontaktdaten von Privatpersonen unkenntlich gemacht, der übrige Bildinhalt bleibt als Störfaktor für die Rastersuche erhalten. Die vier Kamerafotos vom 14. und 15.10.2026 sowie das Rätselheft-Foto vom 26.10.2026 werden zusätzlich in Originalauflösung (4032 Pixel Kantenlänge) mit Metadaten und in allen vier Ausrichtungen geprüft. Dazu kommt eine Serie aus der Hand vom 26.10.2026 mit 13 Aufnahmen desselben Rätsels, die nur ungedreht geprüft wird. Die Fotos `sudoku-problem-*.jpg` hat die App am 27.10.2026 als Problemfälle gespeichert: neun Aufnahmen desselben Rätselhefts mit einer farbigen Fläche am Gitter (nur ungedreht geprüft) und ein vom Bildschirm abfotografiertes Fixture (in allen vier Ausrichtungen). Beim Foto mit Bleistifteinträgen prüfen die Tests auch die Konfliktbereinigung wie in der App und die eindeutige Lösung.

Vier zusätzliche Internet-Fixtures prüfen sehr dünn besetzte Rätsel mit 17 beziehungsweise 18 Vorgaben, blasse innere Gitterlinien und ein angeschnittenes Zeitungsfoto mit Handschrift als Negativfall. Alle vier Ausrichtungen werden offline getestet.

Negativfälle liegen in `fixtures/negative/`: Fotos, in denen kein Raster erkannt werden darf, etwa weil das Sudoku angeschnitten ist. `negative-fixtures.test.js` prüft jedes Bild in diesem Ordner in allen vier Ausrichtungen; ein neuer Negativfall muss dort nur abgelegt werden. Derzeit sind das ein Foto aus der Serie vom 26.10.2026, links angeschnitten, und das Internet-Zeitungsfoto mit Handschrift. Quellen, Urheber, Bildlizenzen und Bearbeitungen stehen in [fixtures/SOURCES.md](fixtures/SOURCES.md); diese Bildlizenzen gelten unabhängig von der MIT-Lizenz des Projektcodes.

Ein Fixture kann ohne Dateidialog über den Query-Parameter `fixture` in die App geladen werden:

```text
http://localhost:3000/src/sudoku/web-app/?fixture=PXL_20261013_131613617.jpg
```

Der Dateiname darf nur Buchstaben, Ziffern, Punkt, Unterstrich und Bindestrich enthalten. Die Verarbeitung bleibt identisch zum normalen Foto-Upload.
