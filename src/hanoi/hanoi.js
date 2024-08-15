// https://de.wikipedia.org/wiki/Türme_von_Hanoi or https://en.wikipedia.org/wiki/Tower_of_Hanoi
const range = n => [...Array(n).keys()];
const clone = o => JSON.parse(JSON.stringify(o));
const towers = (n) => ({ l: range(n).reverse().map(x => x + 1), c: [], r: [] }); // { l:[1,...,n], c:[], r:[]} 

const hanoi = (() => {

   // h calculates all moves in notation "from -> to"
   const h = (n, l, c, r) => n === 0 ? []  // nothing to do
      : [
         ...h(n - 1, l, r, c),             // move top n-1 elements of left to center via right
         { from: l, to: r },               // just keep track of move 
         ...h(n - 1, c, l, r)              // move top n-1 elements of center to right via left
      ]

   moveTo = (t, from, to) => ({
      ...t,
      [from]: t[from].slice(0, -1),           // take off top element of 'from'
      [to]: [...t[to], ...t[from].slice(-1)]  // and put it on top of 'to'
   });

   return (n) => h(n, 'l', 'c', 'r').reduce((res, move, idx) =>
      [...res, moveTo(res[idx], move.from, move.to)],
      [towers(n)]
   );
})()

