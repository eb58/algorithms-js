const { rangeFilled, zip, add } = require('./ol/ol').ol;
const bitset = require('./ol/ol').bitset;

const noConflict = (cover, cond) => zip(cover, cond, add).every((x) => x <= 1);

const solve = (constraints, count = 1000000) => {
  const solutions = [];

  console.log("CONSTRAINTS", constraints.length, constraints[0].length);

  const solv = (cover, constraints, res) => {
    // console.log(
    //   cover.join(''),
    //   conditions.map((c) => c.join('')),
    // );
    if (solutions.length >= count) return;
    if (cover.every((x) => x === 1)) {
      // console.log( "AAAA", res )
      solutions.push(res);
      return;
    }

    const firstIndexZero = cover.findIndex((v) => v === 0);
    const newConstraints = constraints
      .filter((condition) => condition[firstIndexZero] === 1) // conditions, that fill first zero item in cover
      .filter((condition) => noConflict(cover, condition)); // conditions, that do not conflict with cover

    newConstraints.forEach((constraint, idx) => {
      const newCover = zip(cover, constraint, add);
      const newConstraints = constraints.filter((_, i) => idx != i);
      return solv(newCover, newConstraints, [...res, [...constraint]]);
    });
  };

  solv(rangeFilled(constraints[0].length), constraints, []);
  console.log('BBB');
  const res = solutions.map((solution) => solution.map((sol) => constraints.findIndex((c) => c.join('') === sol.join(''))));
  console.log('CCC', res);
  return res;
};

if (typeof module !== 'undefined') module.exports = solve;
