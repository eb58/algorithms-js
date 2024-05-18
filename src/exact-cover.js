const { range, rangeFilled, zip, add } = require('./ol/ol').ol;
const bitset = require('./ol/ol').bitset;

const conditionIsOk = (cover, cond) => zip(cover, cond, add).every((x) => x <= 1);

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
      if (conditionIsOk(cover, condition)) {
        const newCover = zip(cover, condition, add);
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

if (typeof module !== 'undefined') module.exports = solve;
