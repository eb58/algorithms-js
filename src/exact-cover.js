const { range, rangeFilled, zip, add } = require('./ol/ol').ol;
const bitset = require('./ol/ol').bitset;

const noConflict = (cover, cond) => zip(cover, cond, add).every((x) => x <= 1);

const solve = (constraints, count = 1000000) => {
  const YYYY = range(184)
    .map(() => '1')
    .join('');
  const solutions = [];

  console.log(
    'CONSTRAINTS',
    constraints.length,
    constraints[0].length,
    // constraints.filter((c) => c.filter((x) => x === 1).length != 6),
  );

  const solv = (cover, constraints, res) => {
    if (solutions.length >= count) return;
    // if (constraints.length === 0) return;

    // if (cover.join('').startsWith(YYYY)) {
    //   console.log('COVER so far...', cover.join(''), constraints.length, constraints.map((c) => c.join('')).slice(0, 5));
    // }

    if (cover.every((x) => x === 1)) {
      // console.log('AAAA', cover);
      solutions.push(res);
      return;
    }

    const firstIndexZero = cover.findIndex((v) => v === 0);
    const newConstraints = constraints
      .filter((constraint) => constraint[firstIndexZero] === 1) // conditions, that fill first zero item in cover
      .filter((constraint) => noConflict(cover, constraint)); // conditions, that do not conflict with cover

    newConstraints.forEach((constraint) => {
      const newCover = zip(cover, constraint, add);
      const x = constraints.filter((c) => c.join('') !== constraint.join('') && noConflict(newCover, c));
      return solv(newCover, x, [...res, [...constraint]]);
    });
  };

  solv(rangeFilled(constraints[0].length), constraints, []);
  // console.log('BBB', constraints);
  const res = solutions.map((solution) => solution.map((sol) => constraints.findIndex((c) => c.join('') === sol.join(''))));
  // console.log('CCC', res);
  return res;
};

if (typeof module !== 'undefined') module.exports = solve;
