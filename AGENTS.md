# AGENTS.md

## Geltungsbereich und Kommunikation

- Diese Datei gilt für das gesamte Repository.
- Antworte auf Deutsch, sofern der Benutzer keine andere Sprache verlangt.
- Halte Textdateien in UTF-8 und verwende korrekt dargestellte deutsche Umlaute. Vermeide ungeprüfte Umcodierungen und Mojibake.
- Halte Änderungen klein, nachvollziehbar und auf die aktuelle Aufgabe begrenzt. Bewahre nicht zugehörige Änderungen im Arbeitsverzeichnis.

## Projektüberblick

- Das Repository enthält JavaScript-Implementierungen klassischer Algorithmen, kombinatorischer Rätsel und mathematischer Experimente.
- Node.js-Module liegen überwiegend unter `src/` und verwenden CommonJS (`require` und `module.exports`).
- Interaktive, buildfreie Browser-Demos liegen unter `src/`.
- Jest-Tests liegen unter `test/`, Benchmarks unter `bench/`.
- `src/sudoku/web-app/` erkennt Sudokus aus Fotos, lässt die Erkennung korrigieren und löst das Raster lokal im Browser. Die Bilderkennung kommt ohne OCR-Bibliothek und Netzwerkzugriff aus: `scanner.js` sucht und entzerrt das Raster, `digits.js` erkennt die Ziffern, `image-ops.js` enthält gemeinsame Bildoperationen; ihre Tests liegen unter `test/sudoku/web-app/` und verwenden die Fotos aus `src/sudoku/web-app/fixtures/`.
- `src/mandelbrot/` ist eine WebGL2-Demo (Perturbation mit BigInt-Referenzbahn). Rechenteile ohne DOM (`fixed-point.js`, `view.js`, `tour.js`, …) sind UMD-Module mit Jest-Tests; `render-video.js` steuert die App per DevTools-Protokoll in Headless-Chrome und rendert Touren als Video. Ein Draw-Call darf die GPU nicht länger als etwa 2 s belegen, sonst setzt Windows den Treiber zurück und der Browser sperrt danach WebGL: Neue Rechenpfade müssen das Iterationsbudget `ITER_BUDGET` in `view.js` einhalten. Schwere GPU-Messungen nur einzeln und nach Rückfrage ausführen.
- Die Mandelbrot-Shader beschleunigt eine bilineare Approximation (`bla.js`, Tabelle zur Referenzbahn). Es gibt zwei Varianten des Rechen-Shaders: mit `#define BLA2` auch in der Float-Phase, die die App nur in großer Tiefe wählt, weil schon vorhandener, aber übersprungener Code die heiße Schleife messbar bremst. Shader-Fallstricke unter WebGL2/ANGLE: kein `findLSB` (erst GLSL ES 3.10), `length()` und `dot()` unterlaufen in Float schon ab |x| < 2^-63. Performance-Aussagen nur aus abwechselnden, wiederholten Messläufen ableiten; einzelne Läufe streuen wegen wechselnder GPU-Takte stark.
- Voraussetzungen, Bedienung und verfügbare Befehle stehen in `README.md`; Details zur Foto-App stehen in `src/sudoku/web-app/README.md`.

## Implementierung

- Folge dem Stil und der Struktur der jeweils betroffenen Datei. Formatiere keine sachlich unbeteiligten Dateien großflächig.
- Bevorzuge in neuem JavaScript `const` und Arrow Functions. Verwende `let` nur bei tatsächlicher Neuzuweisung und einfache Anführungszeichen für Stringliterale.
- Verwende `globalThis` für plattformübergreifende globale Zugriffe; nutze `window` nur, wenn ausdrücklich das Browserfenster gemeint ist.
- Halte Lösungen nach dem KISS-Prinzip einfach, ohne Lesbarkeit, Fehlerbehandlung oder Sicherheit zu opfern.
- Trenne Fachlogik von DOM-, Datei- und Netzwerkzugriffen, damit sie isoliert getestet werden kann.
- Vermeide doppelte Konstanten und voneinander abweichende Berechnungen in mehreren Modulen. Vorhandene Solver und Hilfsfunktionen sollen wiederverwendet werden, wenn ihre Schnittstelle passt.
- Erhalte bestehende öffentliche Schnittstellen und Browser-Kompatibilität, sofern die Aufgabe keine bewusste Änderung verlangt.
- Verwende deutsche Begriffe für fachliche Konzepte, aber ändere vorhandene Bezeichner oder technische Schlüssel nicht allein zur sprachlichen Vereinheitlichung.
- Dokumentiere unvermeidbare Netzwerkabhängigkeiten. Bevorzuge lokale beziehungsweise vendorte Assets, wenn dadurch Offline-Nutzung oder Reproduzierbarkeit wesentlich verbessert wird.
- Behandle Bilder und andere Benutzereingaben als nicht vertrauenswürdig. Validiere Format, Größe und Werte, bevor sie verarbeitet werden.
- Lang laufende Berechnungen dürfen die Oberfläche nicht unnötig blockieren; zeige Fortschritt und Fehler sichtbar an.

## Tests und Prüfung

- Lies vor Änderungen die betroffenen Module, ihre Aufrufer und die zugehörigen Tests.
- Ergänze für neues oder geändertes Verhalten passende Tests im selben Arbeitsgang, soweit es sinnvoll automatisierbar ist. TDD ist willkommen.
- Führe vor Abschluss mindestens die betroffenen Tests aus. Für breitere Änderungen:

  ```powershell
  npm.cmd test
  ```

- Verwende unter Windows bevorzugt `npm.cmd` und `npx.cmd`, da PowerShell die zugehörigen `.ps1`-Wrapper blockieren kann.
- Prüfe geänderte JavaScript-Dateien bei Bedarf zusätzlich mit `node --check <datei>`.
- Jest führt Tests in `vm`-Kontexten aus. Dort sind Zugriffe auf globale Objekte wie `Math` in heißen Schleifen um ein Vielfaches langsamer als in reinem Node.js. Binde solche Funktionen in rechenintensiven Modulen lokal (`const { min, max } = Math`) und miss Performance mit den Skripten unter `bench/`, nicht mit Jest.
- Prüfe Formatierung gezielt mit Prettier; vermeide dabei reine Zeilenende-Änderungen an sachlich unbeteiligten Dateien.
- Prüfe UI-Änderungen zusätzlich im Browser und in relevanten responsiven Größen. Behaupte keine erfolgreiche visuelle oder OCR-Prüfung, wenn sie nicht tatsächlich durchgeführt wurde.
- Echte Foto- und OCR-Tests können langsam oder von externen Ressourcen abhängig sein. Nenne ausgelassene Prüfungen und den Grund.
- Aktualisiere `README.md`, wenn sich Voraussetzungen, Bedienung, Befehle, Architektur oder Ausgabeformate ändern.
- Ergänze dauerhaft relevantes Projektwissen in dieser Datei, statt es nur in einer Unterhaltung festzuhalten.

## Git und Arbeitsverzeichnis

- Prüfe vor und nach der Arbeit `git status --short` und unterscheide eigene Änderungen von bereits vorhandenen Änderungen.
- Committe, pushe, veröffentliche oder deploye nur auf ausdrücklichen Wunsch.
- Hänge keine Attribution-Zeilen oder Hinweise auf Codex an Commit-Messages oder PR-Beschreibungen an.
- Verwende keine destruktiven Git-Befehle und setze fremde Änderungen nicht zurück.
- Nimm keine generierten Coverage-Daten, Abhängigkeitsverzeichnisse oder andere große erzeugte Dateien in Commits auf.
