# algorithms-js

Eine Sammlung von Algorithmen, kombinatorischen Lösungsverfahren und interaktiven Visualisierungen in JavaScript. Das Repository dient als Experimentierfeld: Verschiedene Lösungsansätze lassen sich über Tests vergleichen, rechenintensive Varianten benchmarken und ausgewählte Algorithmen direkt im Browser beobachten.

## Enthaltene Themen

- **Kombinatorik:** Permutationen und Kombinationen
- **Sortierung:** Quicksort- und Mergesort-Varianten
- **Sudoku:** mehrere Solver mit Backtracking, Bitmasken, Constraint Propagation und Dancing Links
- **Exact Cover:** Algorithm X und eine speichereffiziente Dancing-Links-Implementierung (DLX)
- **Mathematische Rätsel:** Acht-Damen-Problem, magische Quadrate, magisches Hexagon, Pentominos und das dreidimensionale c't-Kastenpuzzle
- **Mathematik:** komplexe Ausdrücke, Vektorrechnung und Mandelbrot-Darstellung
- **Weitere Beispiele:** Türme von Hanoi, Barcode-Erkennung, Sitzplatzreservierung und Snake

## Voraussetzungen

- [Node.js](https://nodejs.org/) ab Version 20
- npm

## Installation

```bash
git clone <repository-url>
cd algorithms-js
npm install
```

Bei der Installation richtet das `prepare`-Skript den mitgelieferten Git-Pre-Commit-Hook ein. Er führt vor jedem Commit die Tests aus.

## Verwendung

### Tests

```bash
# komplette Testsuite
npm test

# Tests bei Änderungen automatisch erneut ausführen
npm run test:watch

# Coverage-Bericht erzeugen
npm run test:coverage
```

Die Tests liegen unter `test/` und dokumentieren zugleich die erwartete Verwendung der einzelnen Module.

### Kommandozeilenprogramme

```bash
npm run barcode
npm run magic-hexagon
npm run ct-puzzle
npm run ct-puzzle:dlx
```

### Benchmarks

```bash
npm run benchmark:magic-square
npm run benchmark:magic-square-5x5
npm run benchmark:sudoku
npm run benchmark:sudoku-scanner
```

Die Laufzeiten hängen von Node.js-Version, Hardware und Systemauslastung ab. Für aussagekräftige Vergleiche sollten Benchmarks deshalb mehrfach unter gleichen Bedingungen ausgeführt werden.

### Browser-Demos

Die folgenden HTML-Dateien können direkt im Browser geöffnet werden:

| Demo                 | Einstiegspunkt                               |
| -------------------- | -------------------------------------------- |
| Türme von Hanoi      | `src/hanoi/hanoi.html`                       |
| Pentomino-Puzzle     | `src/pentomino/pentomino.html`               |
| Mandelbrot Deep Zoom | `src/mandelbrot/mandelbrot.html`             |
| Neon Snake           | `src/snake/snake.html`                       |
| Kasten-Puzzle 3D     | `src/kasten-puzzle-3d/kasten-puzzle-3d.html` |
| Sudoku Lens          | `src/sudoku/web-app/index.html`              |

Alternativ können sie über einen beliebigen lokalen Webserver ausgeliefert werden. Das 3D-Puzzle lädt Three.js von einem CDN; einige Demos laden außerdem Webfonts und benötigen dafür eine Internetverbindung.

### Mandelbrot-Tour als Video

Live kann die Mandelbrot-Demo während einer Tour nur eine grobe Vorschau zeigen. Für ein Video rechnet `render-video.js` die Tour Bild für Bild in voller Auflösung: Es steuert die Browser-App in einem unsichtbaren Chrome auf der Grafikkarte, speichert jedes Bild als PNG und fügt die Folge mit [FFmpeg](https://ffmpeg.org/) zu einem MP4 zusammen.

Zusätzlich nötig sind Chrome oder Edge, FFmpeg (unter Windows z. B. `winget install --id Gyan.FFmpeg -e`) und Node.js ab Version 22. Abweichende Programmpfade lassen sich über `CHROME_PATH` und `FFMPEG_PATH` angeben.

```bash
# alle Orte, 1920×1080, 30 Bilder/s
npm run mandelbrot:video

# Auswahl, eigene Länge und Farben, doppelt überabgetastet gegen Treppenstufen
npm run mandelbrot:video -- --places "Seepferdchental,Nadel" --fly 15 --hold 2 --ss 2 --settings '{"pal":"Feuer"}'

# alle Optionen und Orte
npm run mandelbrot:video -- --help
```

Bilder und Video landen in `out/mandelbrot-video/<Größe>_<Bildrate>_<Kennung>/`; die Kennung ändert sich mit allen Optionen, die das Bild beeinflussen. Vorhandene Bilder werden übersprungen, sodass ein abgebrochener Lauf (Strg+C) beim nächsten Aufruf fortgesetzt wird. Die Rechenzeit hängt stark von Grafikkarte, Größe und Tiefe der Orte ab; tiefe Orte mit großen Innenflächen brauchen pro Bild ein Vielfaches.

## Beispiel: Sudoku lösen

Die Solver erwarten ein Array mit genau 81 Ganzzahlen. `0` steht für ein leeres Feld. Das Ergebnis ist ein neues, gelöstes Array oder `null`, wenn die Eingabe ungültig beziehungsweise nicht lösbar ist.

```js
const solveSudoku = require('./src/sudoku/sudokuDlx')

const puzzle = '53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79'
const grid = [...puzzle].map((value) => (value === '.' ? 0 : Number(value)))
const solution = solveSudoku(grid)

console.log(solution)
```

## Projektstruktur

```text
.
|-- src/                 Implementierungen und Browser-Demos
|   |-- complex/         Parser und Rechenoperationen für komplexe Zahlen
|   |-- ct-puzzle/       Solver für das dreidimensionale c't-Puzzle
|   |-- magic-square/    Solver für magische Quadrate
|   |-- sudoku/          verschiedene Sudoku-Strategien und Testdaten
|   `-- ...
|-- test/                Jest-Tests
|-- bench/               Performance-Vergleiche
`-- package.json         Skripte und Entwicklungsabhängigkeiten
```

Die Node.js-Module verwenden überwiegend CommonJS (`require`/`module.exports`). Einige Dateien sind zusätzlich so aufgebaut, dass sie ohne Bundler als klassische Skripte im Browser funktionieren.

## Entwicklung

Der Code wird mit [Prettier](https://prettier.io/) formatiert. Um alle unterstützten Dateien zu prüfen beziehungsweise zu formatieren:

```bash
npx prettier --check .
npx prettier --write .
```

Vor Änderungen empfiehlt sich ein Blick in die zugehörigen Tests. Für neue Algorithmen oder Varianten sollten passende Jest-Tests ergänzt werden.

## Lizenz

Dieses Projekt steht unter der [MIT-Lizenz](LICENSE).

Für die externen Sudoku-Testbilder gelten die in [fixtures/SOURCES.md](src/sudoku/web-app/fixtures/SOURCES.md) aufgeführten Bildlizenzen.
