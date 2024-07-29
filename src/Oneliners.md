# Oneliners

```text
Schläft ein Lied in allen Dingen,
die da träumen fort und oft
und die Welt hebt an zu singen
triffst du nur das Zauberwort
```

## Vorwort

Bereits Generationen von Programmierern fragen sich: Was ist die richtige Größe für eine Funktion. Früher, als man noch Terminals verwendete, sagte man oft: Nicht größer als eine Bildschirmseite, das waren dann - je nach Terminal - ca. 40 Zeilen. Die Breite war damals natürlich auch beschränkt und umfasste meist 80 Zeichen pro Zeile. Heute ist eine beliebte Antwort: Eine Funktion soll nur genau eine Aufgabe erledigen.

Dieser Auffassung stimme ich zu. Ich tendiere sogar zu der Auffassung eine Funktion sollte möglichst nur eine Zeile umfassen. Kann ich ein Problem in Funktionen als Oneliner zerlegen, dann habe ich es in der Regel gut durchdrungen und ist auch für den Leser leicht zu verstehen.

Darüber hinaus bin ich der Auffassung, dass Oneliner eine Kunstform sind, in der kompakt Ideen ausgedrückt werden. Das ist vergleichbar mit Lyrik, die ebenfalls mit wenigen Worten auskommt um große Ideen und Gefühle auszudrücken. Ich hoffe bei meinen Programmierkollegen gelegentlich Glücksgefühle auszulösen, wenn sie eine Lösung als besonders elegant empfinden.

Ich möchte vor Extremismus warnen: Wie immer kann man alles übertreiben und ich bin bestimmt gelegentlich beim Ausloten der Möglichkeiten der Versuchung erlegen.

### Warum Javascript

Warum habe ich die Sprache Javascript gewählt? Sicher hat Javascript eine ganze Reihe von Defiziten, aber wenn man sich auf die guten Teile beschränkt (->Crockford, Javscript The Good Parts), dann kann man damit sehr kompakten und eleganten Code schreiben. Insbesondere moderne Features dieser Sprache führen zu einigen Vereinfachungen, die wir in unserem Code intensiv verwenden. Seien sie darauf gefasst!

#### Arrowfunktion

Wieviel eleganter ist doch

```Javascript
const sum = (x, y) => x + y;
```

statt

```Javascript
function sum(x, y){ 
    return x + y;
}
```

Insbesondere in der Verwendung als Lambas führt das oft zu einer prägnanteren Formulierung.

```javascript
const sum = (xs) => xs.reduce( (x, y) => x + y, 0);
```

statt

```javascript
function sum(xs){
    return xs.reduce( function(x, y)( return x + y), 0);
}
```

#### map, reduce, filter, some, every

#### forEach is a codesmell

#### Spreading-Operator

#### Funktionale Programmierung, kein State

#### Closures

Als eine erste Kostprobe möchte ich einen Oneliner für Quicksort vorstellen:

```javascript
qsort = (a) => a.length <= 1  ? a : [
    ...qsort(a.filter((n) => n < a[0])), // kleiner a[0]
    ...a.filter((n) => n === a[0]),      // gleich  a[0]
    ...qsort(a.filter((n) => n > a[0]))  // größer  a[0]
]
```

Zugegeben, diese Zeile ist etwas länger als 80 Zeichen (und wir haben sie zur besseren Lesbarkeit sogar umgebrochen) und der Algorithmus ist nicht perfekt, aber darum kümmern wir uns später (***siehe Kapitel Quicksort - eine Fallstudie***).

Die Idee des Algorithmus ist einfach: Zerlege das zu sortierende Array in drei Teile: Die Elemente, die kleiner, gleich oder größer als ein beliebiges Element sind; hier das erste, nämlich a[0]. Dann füge diese Teile sortiert mit qsort (Rekursion!) wieder zusammen. Man beachte: Der mittlere Teil ist bereits sortiert, hier ist kein Aufruf von qsort nötig!

Hier kann man beim Lesen Zutrauen in die Korrektheit des Algorthmus gewinnen. Man vergleiche das mit einer Implementierung mit Indizes (siehe ).

### Warum nicht Typescript

Typen blähen den Code auf.
Die vorgestellten Algorithmen sind in der Regel generisch, also auf verschiedenen Datentypen verwendbar. Typescript im Businessumfeld absolut zwingend.

### Was ist kein Oneliner

#### Keine Bibliotheken

<div style="page-break-after: always; visibility: hidden"></div>

## PlaneSeatreservation

Mein früherer Arbeitgeber hat Bewerbern für einen Programmierjob gerne folgende Aufgabe gestellt, die auf einer Onlineplattform in einer gewissen Zeit gelöst werden musste:

```text
Es gibt ein Flugzeug mit N Sitzreihen und den Sitzen ABC DEFG HIK. Die Leerzeichen symbolisieren den Gang.
Bestimme bei einer vorgegeben Belegung des Flugzeugs ( etwa '1A 1B 1D 2B 11F') die Anzahl der noch verfügbaren Tripel von benachbarten Sitzen. 

```

```
const range = (n) => [...Array(n).keys()]

const solution = (N, reservations) => {
  const check = (triple, r) => triple.split('').every((c) => !reservations.includes(r + 1 + c))
  const countTriplesInRow = (r) => check('ABC', r) + (check('DEF', r) || check('EFG', r)) + check('HIK', r)
  return range(N).reduce((sum, r) => sum + countTriplesInRow(r), 0)
}

```

```console
solution(1, '1A 1B 1D') // -> 2
```
