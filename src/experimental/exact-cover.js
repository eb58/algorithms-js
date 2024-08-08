const { range, rangeFilled, zip, add } = require('./ol').ol;
const bitset = require('./ol').bitset;

const noConflict = (cover, cond) => zip(cover, cond, add).every((x) => x <= 1);

const solve = (constraints, maxsolutions = 1000000) => {
  constraints = constraints.map((row, idx) => ({ rowNr: idx, values: row }));
  const solutions = [];
  // console.log('CONSTRAINTS',constraints.map((c) => ({ ...c, values: c.values.join('') })) );

  const solv = (cover, constraints, res) => {
    if (solutions.length >= maxsolutions) return;
    if (cover.every((x) => x === 1)) {
      // console.log('AAAA', cover);
      solutions.push(res);
      return;
    }

    if (constraints.length === 0) {
      return;
    }

    const firstIndexZero = cover.findIndex((v) => v === 0);
    const newConstraints = constraints
      .filter((c) => c.values[firstIndexZero] === 1) // conditions, that fill first zero item in cover
      .filter((constraint) => noConflict(cover, constraint.values)); // conditions, that do not conflict with cover

    newConstraints.forEach((constraint) => {
      const newCover = zip(cover, constraint.values, add);
      const x = constraints.filter((c) => c.values.join('') !== constraint.values.join('') && noConflict(newCover, c.values));
      return solv(newCover, x, [...res, constraint.rowNr]);
    });
  };

  solv(rangeFilled(constraints[0].values.length), constraints, []);
  // console.log('BBB', solutions);
  return solutions;
};

if (typeof module !== 'undefined') module.exports = solve;
