const { rangeFilled } = require('../ol').ol;

// Does the row put a 1 into a column that is already covered?
const conflicts = (cover, values) => values.some((v, i) => v === 1 && cover[i] === 1);

// Lexicographic order of two solutions (arrays of row numbers).
const compareSolutions = (a, b) => {
  for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return a[i] - b[i];
  return a.length - b.length;
};

// Algorithm X on a 0/1 matrix. Returns the solutions as sorted lists of row numbers, in
// lexicographic order (the first maxsolutions found, if there are more).
const solve = (constraints, maxsolutions = 1000000) => {
  // an empty matrix has nothing to cover: the empty selection is the only solution
  const width = constraints.length > 0 ? constraints[0].length : 0;
  constraints = constraints.map((row, idx) => ({ rowNr: idx, values: row }));
  const solutions = [];

  // constraints: exactly the rows that still fit next to cover
  const solv = (cover, constraints, res) => {
    if (solutions.length >= maxsolutions) return;
    if (cover.every((x) => x === 1)) {
      solutions.push(res);
      return;
    }

    // the uncovered column with the fewest fitting rows; none at all means a dead end
    let column = -1;
    let fewest = Infinity;
    cover.forEach((covered, i) => {
      if (covered) return;
      const candidates = constraints.filter((c) => c.values[i] === 1).length;
      if (candidates < fewest) {
        fewest = candidates;
        column = i;
      }
    });
    if (fewest === 0) return;

    constraints
      .filter((c) => c.values[column] === 1)
      .forEach((constraint) => {
        const newCover = cover.map((x, i) => x | constraint.values[i]);
        // the chosen row conflicts with newCover itself, so it drops out here as well
        const stillFitting = constraints.filter((c) => !conflicts(newCover, c.values));
        solv(newCover, stillFitting, [...res, constraint.rowNr]);
      });
  };

  solv(rangeFilled(width), constraints, []);
  return solutions.map((solution) => [...solution].sort((a, b) => a - b)).sort(compareSolutions);
};

if (typeof module !== 'undefined') module.exports = solve;
