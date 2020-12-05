const range = n => [...Array(n).keys()];

const solution = (N, reservations) => {
  const reservationsArr = reservations.split(' ');
  const makeRow = r => "ABCDEFGHIK".split('').map(ch => reservationsArr.includes((r + 1) + ch) ? 'X' : ch).join(''); // Mache ein X an alle belegten Sitze
  const possibleInRow = r => r.includes('ABC') + (r.includes('DEF') || r.includes('EFG')) + r.includes('HIK');
  return range(N).map(makeRow).reduce((acc, r) => acc + possibleInRow(r), 0);
}

// TESTS
const test = sol => sol(1, '') === 3
  && sol(1, '1A 1B 1D') === 2
  && sol(1, '1A 1B 1E') === 1
  && sol(2, '1A 1B 1D') === 5
  && sol(2, '1A 1B 2D') === 5
  && sol(12, '1A 1B 2D') === 35
  && sol(12, '1A 1B 2D 2E') === 34
  && sol(12, '1A 1B 2D 2E 2F') === 34

test(solution);


