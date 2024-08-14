const range = n => [...Array(n).keys()];
const clone = o => JSON.parse(JSON.stringify(o));

const hanoi1 = (n) => {
   const h = (n, l, c, r) => {
      if (n === 0) return              // nothing to do
      h(n - 1, l, r, c);               // move top n-1 element of left to center via right
      r.push(l.pop());                 // move from left to right tower
      result.push(clone({ l, c, r })); // keep track
      h(n - 1, c, l, r);               // move top n-1 element of center to right via left
   }

   const tower = { l: range(n).reverse().map(x => x + 1), c: [], r: [] }; // { l:[1,...,n], c:[], r:[]} 
   const result = [clone(tower)];
   h(n, tower.l, tower.c, tower.r);
   return result;
};

const hanoi2 = (() => {
   initial = (xs) => xs.slice(0, - 1);
   last = (xs) => xs[xs.length - 1];
   const h = (n, l, c, r) => n === 0 ? [] : [...h(n - 1, l, r, c), [l, r], ...h(n - 1, c, l, r)]

   moveTo = (m, from, to) => ({ ...clone(m), ...{ [to]: [...m[to], last(m[from])], [from]: initial(m[from]) } });
   return (n) => h(n, 'l', 'c', 'r').reduce(
      (res, move, idx) => [...res, moveTo(res[idx], move[0], move[1])],
      [{ l: range(n).reverse().map(x => x + 1), c: [], r: [] }] // -> { l:[1,...,n], c:[], r:[] }
   );
})()

const hanoi = hanoi2

