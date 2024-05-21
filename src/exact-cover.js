const { f } = require('dlxlib');

const { range, rangeFilled, zip, add } = require('./ol/ol').ol;
const bitset = require('./ol/ol').bitset;

const noConflict = (cover, cond) => zip(cover, cond, add).every((x) => x <= 1);
const cmpCond = (c1, c2) => (c1.join('') < c2.join('') ? 1 : -1)

const solve = (conditions) => {
  // console.log(conditions);
  const solutions = [];

  // conditions = conditions.toSorted(cmpCond)

  console.log(conditions.map((c) => c.join('')));
  const solv = (cover, conditions, res) => {
    if (cover.every((x) => x === 1)) {
      solutions.push(res);
      return;
    }

    const firstIndexZero = cover.findIndex((v) => v === 0);
    let newConditions; 

    conditions
      .filter((condition) => condition[firstIndexZero] === 1) // conditions, that fill first zero item in cover
      .filter((condition) => noConflict(cover, condition)) // conditions, that do not conflict with cover
      .forEach((condition, idx) => {
        const newCover = zip(cover, condition, add);
        newConditions = conditions.filter((_, i) => i !== idx);
        return solv(newCover, newConditions, [...res, [...condition]]);
      });
  };

  solv(rangeFilled(conditions[0].length), conditions, []);
  const res = solutions.map((solution) => solution.map((sol) => conditions.findIndex((condition) => condition.join('') === sol.join(''))));
  console.log('AAA', res);
  return res;
};

if (typeof module !== 'undefined') module.exports = solve;
