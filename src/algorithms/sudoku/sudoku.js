const feedX = (x, f) => f(x);
const range = (n) => [...Array(n).keys()];
const row = (x) => x % 9;
const col = (x) => Math.floor(x / 9);
const block = (x) => Math.floor(col(x) / 3) * 3 + Math.floor(row(x) / 3);
const inSameCommectionSet = (x, y) => row(x) === row(y) || col(x) === col(y) || block(x) === block(y);
const connectionSet = (x) => range(9 * 9).reduce((acc, y) => inSameCommectionSet(x, y) ? [...acc, y] : acc, []);
const connectionSets = range(9 * 9).map(connectionSet);
const candidates = (fld, n) => range(9).map(x => x + 1).filter(x => !connectionSets[n].some(y => fld[y] === x));
const set = (fld, idx, c) => { const cpy = [...fld]; cpy[idx] = c; return cpy; }
const solve = (fld) => feedX(
    fld.findIndex(x => x === 0),
    (idx) => idx < 0 ? (res = fld) : candidates(fld, idx).forEach(c => solve(set(fld, idx, c)))
)

const fld = '.914.7..8.74.3.....8..2.9...2..4...6...2..5..8..5....1.37.1..5241...93..6.8......'.split('').map(x => x === '.' ? 0 : Number(x));

solve(fld)
console.log(res);