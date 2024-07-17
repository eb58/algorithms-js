# Oneliners

```text
Schläft ein Lied in allen Dingen,
die da träumen fort und oft
und die Welt hebt an zu singen
triffst du nur das Zauberwort
```

## Vorwort

Bereits Generationen von Programmierern fragen sich: Was ist die richtige Größe für eine Funktion. Früher, als man noch Terminals verwendete, sagte man oft: Nicht größer als eine Bildschirmseite, das waren dann - je nach Terminal - ca. 40 Zeilen. Die Breite war damals natürlich auch beschränkt und umfasste meist 80 Zeichen pro Zeile. Heute ist eine beliebte Antwort: Eine Funktion soll nur genau eine Aufgabe erledigen.

Dieser Auffassung stimme ich zu. Ich tendiere sogar zu der extremen Auffassung eine Funktion sollte möglichst nur eine Zeile umfassen. Kann ich ein Problem in Funktionen als Oneliner zerlegen, dann habe ich es in der Regel gut durchdrungen und ist auch für den Leser leicht zu verstehen.

Darüber hinaus bin ich der Auffassung, dass Oneliner eine Kunstform sind, in der kompakt Ideen ausgedrückt werden. Das ist vergleichbar mit Lyrik, die ebenfalls mit wenigen Worten auskommt um große Ideen und Gefühle auszudrücken. Ich hoffe bei meinen Programmierkollegen gelegentlich Glücksgefühle auszulösen, wenn sie eine Lösung als besonders elegant empfinden.

Ich möchte vor Extremismus warnen: Wie immer kann man alles übertreiben und ich bin bestimmt gelegentlich beim Ausloten der Möglichkeiten der Versuchung erlegen.

### Warum Javascript

#### Heavy usage of modern Javascript

#### Lambdas

#### map, reduce, filter, some, every

#### forEach is a codesmell

#### Spreading-Operator

#### Funktionale Programmierung, kein State

#### Closures


Als eine erste Kostprobe möchte ich einen Oneliner für Quicksort vorstellen:

```javascript
qsort = (a) => a.length <= 1  ? a : [
    ...qsort(a.filter((n) => n < a[0])), // kleiner a[0]
    ...a.filter((n) => n === a[0]),      // gleich a[0]
    ...qsort(a.filter((n) => n > a[0]))  // größer a[0]
]
```

Zugegeben, diese Zeile ist etwas länger als 80 Zeichen (und wir haben sie zur besseren Lesbarkeit sogar umgebrochen) und der Algorithmus ist noch nicht perfekt, aber darum kümmern wir uns später (***siehe Quicksort - eine Fallstudie***). 

Die Idee des Algorithmus ist einfach: Zerlege das zu sortierende Array in drei Teile: Die Elemente, die kleiner, gleich oder größer als ein beliebiges Element sind; hier das erste, nämlich a[0]. Dann füge diese Teile sortiert mit qsort (Rekursion!) wieder zusammen. Man beachte: Der mittlere Teil ist bereits sortiert, hier ist kein Aufruf von qsort nötig!

Hier kann man beim Lesen Zutrauen in die Korrektheit des Algorthmus gewinnen. Man vergleiche das mit einer Implementierung mit Indizes (sie).

### Warum nicht Typescript

Typen blähen den Code auf.
Die vorgestellten Algorithmen sind in der Regel generisch, also auf verschiedenen Datentypen verwendbar. Typescript im Businessumfeld absolut zwingend.


### Was ist kein Oneliner

#### Keine Bibliotheken

