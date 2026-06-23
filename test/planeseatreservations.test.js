const { solution1, solution2 } = require('../src/planeseatreservations');

const cases = [
  [1, '', 3],
  [1, '1A 1B 1D', 2],
  [1, '1A 1B 1E', 1],
  [2, '1A 1B 1D', 5],
  [2, '1A 1B 2D', 5],
  [12, '1A 1B 2D', 35],
  [12, '1A 1B 2D 2E', 34],
  [12, '1A 1B 2D 2E 2F', 34],
  [12, '11A 11B 2D 2E 2F', 34],
];

cases.forEach(([n, reservations, expected]) => {
  test(`solution1 ${n} ${reservations}`, () => {
    expect(solution1(n, reservations)).toBe(expected);
  });

  test(`solution2 ${n} ${reservations}`, () => {
    expect(solution2(n, reservations)).toBe(expected);
  });
});
