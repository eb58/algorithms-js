solution1 = (N, reservations) => {

  const arr = reservations.split(' ');

  const range = n => [...Array(n).keys()];
  const makeRow = r => "ABCDEFGHIK".split('').map(ch => arr.includes((r + 1) + ch) ? 'X' : ch).join(''); // Mache ein X an alle belegten Sitze
  const possibleInRow = r => r.includes('ABC') + (r.includes('DEF') || r.includes('EFG')) + r.includes('HIK');

  return range(N)
          .map(makeRow)
          .reduce((acc, r) => acc + possibleInRow(r), 0);
}


solution2 = (nRows, reservations) => {
  const range = n => [...Array(n).keys()]
  const containsOneCharOf = (s1, s) => s.split('').reduce((acc, o) => acc || s1.indexOf(o) >= 0, false)
  const containsAllCharOf = (s1, s) => s.split('').reduce((acc, o) => acc && s1.indexOf(o) >= 0, true)

  return 3 * nRows - reservations.split(' ')
          .map(o => ({row: o.slice(0, -1), ch: o.slice(-1)})) // "17C" -> {row:"17", ch:"C"}
          .reduce((acc, o) => (acc[o.row] += o.ch, acc), range(nRows).map(() => ''))
          .reduce((acc, o) => acc + containsOneCharOf(o, 'ABC') + (containsOneCharOf(o, 'EF') || containsAllCharOf(o, 'DG')) + containsOneCharOf(o, 'HIK'), 0)
}

// TESTS
const test = sol =>
  sol(1, '') === 3
          && sol(1, '1A 1B 1D') === 2
          && sol(1, '1A 1B 1E') === 1
          && sol(2, '1A 1B 1D') === 5
          && sol(2, '1A 1B 2D') === 5
          && sol(12, '1A 1B 2D') === 35
          && sol(12, '1A 1B 2D 2E') === 34
          && sol(12, '1A 1B 2D 2E 2F') === 34
test(solution1);
test(solution2);

