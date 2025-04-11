# Oneliners

```text
Schläft ein Lied in allen Dingen,
die da träumen fort und oft
und die Welt hebt an zu singen
triffst du nur das Zauberwort
```

## Vorwort

Bereits Generationen von Programmierern fragen sich: Was ist die richtige Größe für eine Funktion. Früher, als man noch Terminals verwendete, sagte man oft: Nicht größer als eine Bildschirmseite, das waren dann - je nach Terminal - ca. 40 Zeilen. Die Breite war damals natürlich auch beschränkt und umfasste meist 80 Zeichen pro Zeile. Heute ist eine beliebte Antwort: Eine Funktion soll nur genau eine Aufgabe erledigen.

Dieser Auffassung stimme ich zu. Ich tendiere sogar zu der Auffassung eine Funktion sollte möglichst nur eine Zeile umfassen. Kann ich ein Problem in Funktionen als Oneliner zerlegen, dann habe ich das Problem in der Regel gut durchdrungen und ist auch für den Leser leicht zu verstehen.

Darüber hinaus bin ich der Auffassung, dass Oneliner eine Kunstform sind, in der kompakt Ideen ausgedrückt werden. Das ist vergleichbar mit Lyrik, die ebenfalls mit wenigen Worten auskommt um große Ideen und Gefühle auszudrücken. Ich hoffe bei meinen Programmierkollegen gelegentlich Glücksgefühle auszulösen, wenn sie eine Lösung als besonders elegant empfinden.

Ich möchte vor Extremismus warnen: Wie immer kann man alles übertreiben und ich bin bestimmt gelegentlich beim Ausloten der Möglichkeiten der Versuchung erlegen etwas besonders prägnant auszudrücken.


Funktionieren reicht nicht!

### Warum Javascript

Warum habe ich die Sprache Javascript gewählt? Sicher hat Javascript eine ganze Reihe von Defiziten. Aber wenn man sich auf die guten Teile beschränkt (->Crockford, Javscript The Good Parts), dann kann man damit sehr kompakten und eleganten Code schreiben. Insbesondere moderne Features dieser Sprache führen zu einigen Vereinfachungen, die wir in unserem Code intensiv verwenden. Seien Sie darauf gefasst!

#### Arrow-Funktionen

Viel eleganter ist doch

```Javascript
const sum = (x, y) => x + y;
```

statt

```Javascript
function sum(x, y){ 
    return x + y;
}
```

Insbesondere in der Verwendung als Lambdas führt das oft zu einer prägnanteren Formulierung.

```javascript
const sum = (xs) => xs.reduce( (x, y) => x + y, 0);
```

statt

```javascript
function sum(xs){ return xs.reduce( function(x, y){ return x + y}, 0);}
```

#### map, reduce, filter, some, every

#### forEach is a code smell

Meist lässt sich das durch map oder reduce ersetzen. forEach ist nur erlaubt, wenn Seiteneffekte ausdrücklich erwünscht sind. In Berechnungen und Aufbereitung von Daten hat das nichts verloren.

#### Spreading-Operator

#### Funktionale Programmierung, kein State

Vorteile: gut zu testen, gut zu verstehen

#### Closures

timer als Beispiel

#### Array & Object literals

Java hat da echt ein Problem.
Gut geeignet für Tests, für Konstanten

#### functions as first class citizens

#### var ist a code smell - use const

In der Tat ist es in der der regel ein Codesmell, wenn man eine Variable nach der initialisierung noch einmal ändern muss. Codesmell heißt nicht verboten, sondern "think twice".
Außnahme ist zum Beispiel for( let i= 0; i++; i<100), dafür gibt es aber auch Ersatz mit for( i in [1,2,3]) oder map, reduce, forEach ( aber -> forEach is a code smell).

### seal objects

```javascript
const CONSTS = Object.seal({
    COLORS: { background: red, font: green},
    SOMEVALUES: ['small', 'medium', 'large'],
})
    
```

#### Oneliner in shell

```console
fgrep foo.txt | grep bar | wc-l
```




### Warum nicht Typescript

Typen blähen den Code auf.
Die vorgestellten Algorithmen sind in der Regel generisch, also auf verschiedenen Datentypen verwendbar. Typescript im Businessumfeld absolut zwingend.

### Oneliner können auch mehrere Zeilen umfassen

Zeilenumbrüche für bessere Lesbarkeit
Zwischenergebnisse in consts speichern

### Was ist kein Oneliner

Keine Bibliotheken außer javascript, node.js oder Browser-Apis

<div style="page-break-after: always; visibility: hidden"></div>

## Quicksort

Als eine erste Kostprobe möchte ich einen Oneliner für Quicksort vorstellen:

```javascript
qsort = (a) => a.length <= 1  ? a : [
    ...qsort(a.filter((n) => n < a[0])), // kleiner a[0]
    ...a.filter((n) => n === a[0]),      // gleich  a[0]
    ...qsort(a.filter((n) => n > a[0]))  // größer  a[0]
]
```

Zugegeben, diese Zeile ist etwas länger als 80 Zeichen (und wir haben sie zur besseren Lesbarkeit sogar umgebrochen) und der Algorithmus ist nicht perfekt, aber darum kümmern wir uns später. Außerdem ist eine Bedingung eines klasssischen Sortieralgorithmus, nämlich die Sortierung in-place durchzuführen nicht erfüllt. Das ignorieren wir hier, denn

 1) Speicherplatz ist heute kein Problem mehr!
 2) Kein Mensch nutzt einen eigen Sortierungalgorithmus. Dafür haben wir die a.toSorted(). Es gilt die Eleganz der Algorithmus zu genießen!
  
Die Idee des Algorithmus ist einfach: Zerlege das zu sortierende Array in drei Teile: Die Elemente, die kleiner, gleich oder größer als ein beliebiges Element sind; hier das erste, nämlich a[0]. Dann füge die drei Teile, sortiert mit qsort (Rekursion!), wieder zusammen. Man beachte: Der mittlere Teil ist trivialerweise sortiert.

Beim Lesen gewinnt man sZutrauen in die Korrektheit des Algorthmus. Man vergleiche das mit einer Implementierung mit Indizes (siehe ???). Wer sich jemals damit abgequält hat weiß was ich meine.

Die obige Implementierung hat ein gravierendes Problem für sortierte Listen: Kleiner als a[0] ist kein Element. Unser 'Divide and Conquer' geht entschieden schief. Wir spalten immer nur die Element gleich a[0] ab. Das ist in seiner Laufzeit ein linearer Algorithmus. Abhilfe kommt, indem wir statt dem Element a[0] ein zufälliges Element aus der Liste als Pivotelement auswählen.

```javascript
const randomElem = (xs) => xs[Math.floor(Math.random() * xs.length)];
  
const qsort = (a) => {
    const pivot = randomElem(a);
    return a.length <= 1 ? a : [
    ...qsort(a.filter((x) => x < pivot)), // kleiner pivot
    ... a.filter((x) => x === pivot),     // gleich pivot
    ...qsort(a.filter((x) => x > pivot)), // größer pivot
 ]};
```

Wir müssen hier pivot im Vorhinein berechnen, denn wir benötigen ihn an 3 Stellen. Ich möchte eine kleine Technik vorstellen, mit dem wir vermeiden können diese Zwischenvariable zu verwenden. Betrachten wir die Funktion feedX. Die macht genau das, das der Name sagt, Sie füttert, den Wert x in die Funktions f.

```javascript
const feedX = (x, f) => f(x);
const randomElem = (xs) => xs[Math.floor(Math.random() * xs.length)];

const qsort = (a) => feedX(randomElem(a), pivot => a.length <= 1 ? a : [
  ...qsort(a.filter((x) => x < pivot)), // kleiner pivot
  ...a.filter((x) => x === pivot),      // gleich pivot
  ...qsort(a.filter((x) => x > pivot)), // größer pivot
])
```

<div style="page-break-after: always; visibility: hidden"></div>

## Plane Seat Reservation

Mein früherer Arbeitgeber hat Bewerbern für einen Programmierjob gerne folgende Aufgabe gestellt, die auf einer Onlineplattform in einer gewissen Zeit gelöst werden musste:

```text
Es gibt ein Flugzeug mit N Sitzreihen und den Sitzen ABC DEFG HIK. 
Die Leerzeichen symbolisieren die Gänge durch die Sitzreihen.
Bestimme bei einer vorgegeben Belegung des Flugzeugs ( etwa) die Anzahl der noch verfügbaren Tripel von benachbarten Sitzen. 
```

Da wurden Lösungen geliefert die manchmal über 100 Zeilen enthielten. In Java braucht man, um sich heimisch zu fühlen, vermutlich ein PlaneSingleton und einen RowSeatManager. Meine Musterlösung sieht so aus:

```javascript
const feedX = (x, f) => f(x);
const range = (n) => [...Array(n).keys()] // -> [0,1,2,...,n]

const solution2 = (N, reservationsAsString) => feedX(reservationsAsString.split(' '), reservations => {
  const check = (triple, r) => triple.split('').every((c) => !reservations.includes(r + c))
  const countTriplesInRow = (r) => check('ABC', r) + (check('DEF', r) || check('EFG', r)) + check('HIK', r)
  return range(N).reduce((sum, r) => sum + countTriplesInRow(r + 1), 0)
})
```

```console
solution(1, '1A 1B 1D 2B 1F') // -> 2
```

Die Idee ist einfach: Gehe durch alle Sitzreihen (range(N)) und bestimme für jede Reihe einzeln die möglichen Triple (countTriplesInRow) und addiere über die Reihen.
Die Funktion range ist in meinen Augen essentiell, ich werde sie in vielen Beispielen immer wieder verwenden und ich lege dem ECMAScript Konsortium ans Herz diese Funktion in Javascript zu intergieren. (Man wird ja wünschen dürfen!). feedX kennen Sie ja schon: Wir verwenden feedX hier als einfachen Adaptor, um statt des Strings '1A 1B 1D 2B 1F' das Array  ['1A', '1B', '1D', '2B' '11F'] in den eigentlichen Algorithmus zu füttern.
