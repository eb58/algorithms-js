const { range, rangeFilled, zip, add } = require('./ol/ol').ol;
const bitset = require('./ol/ol').bitset;

const conditionIsOk = (cover, cond) => zip(cover, cond, add).every((x) => x <= 1);

const solve = (conditions) => {
  // console.log(conditions);
  const solutions = [];
  const solv = (conditions, cover, res) => {
    // console.log('AAALEVEL', 'COVER', cover.join(''), res);
    if (cover.every((x) => x === 1)) {
      // console.log('solution found', res);
      solutions.push(res);
      return;
    }

    conditions
      .filter((condition) => conditionIsOk(cover, condition))
      .forEach((condition, idx) =>
        solv(
          conditions.filter((_, i) => i > idx),
          zip(cover, condition, add),
          [...res, [...condition]],
        ),
      );
  };

  solv(conditions, rangeFilled(conditions[0].length), []);
  const res = solutions.map((solution) => solution.map((sol) => conditions.findIndex((condition) => condition.join('') === sol.join(''))));
  console.log('AAA', res);
  return res;
};

if (typeof module !== 'undefined') module.exports = solve;
