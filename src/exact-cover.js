const { range, rangeFilled, zip } = require('./ol/ol').ol;
const bitset = require('./ol/ol').bitset;

const rowIsOk = (cover, row) => zip(cover, row, (a, b) => (b === 1 ? a != 1 : true)).every((x) => !!x);

const exactCover = (() => {
  const solve = (conditions) => {
    const solutions = [];
    const solv = (conditions, cover, res) => {
      // console.log('AAALEVEL', 'COVER', cover.join(''), res);
      if (cover.every((x) => x === 1)) {
        // console.log('solution found', res);
        solutions.push(res);
        return;
      }
      conditions.forEach((condition, idx) => {
        if (rowIsOk(cover, condition)) {
          const newCover = zip(cover, condition, (a, b) => a + b);
          solv(
            conditions.filter((_, i) => i > idx),
            newCover,
            [...res, [...condition]],
          );
        }
      }, []);
    };

    solv(conditions, rangeFilled(conditions[0].length), []);
    return solutions.map((solution) => solution.map((sol) => conditions.findIndex((condition) => condition.join('') === sol.join(''))));
  };

  return {
    solve,
  };
})();

if (typeof module !== 'undefined') module.exports = exactCover;

const conditions = [
  [1, 0, 0, 0],
  [0, 1, 1, 0],
  [1, 0, 0, 1],
  [0, 0, 1, 1],
  [0, 1, 0, 0],
  [0, 0, 1, 0],
];
console.log('AA', exactCover.solve(conditions));

console.log(
  'BBB',
  exactCover.solve([
    [0, 0, 1, 0, 1, 1, 0],
    [1, 0, 0, 1, 0, 0, 1],
    [0, 1, 1, 0, 0, 1, 0],
    [1, 0, 0, 1, 0, 0, 0],
    [0, 1, 0, 0, 0, 0, 1],
    [0, 0, 0, 1, 1, 0, 1],
    [0, 0, 0, 1, 1, 0, 1],
  ]),
);
