// You have a plane with N rows and seats ABC DEFG HIK for every row
// And you have given a String with reservations i.e. '1A 1B 1D 2B 11F'
// Compute number of remaining triples of adjacent seats.
const range = (n) => [...Array(n).keys()]

const solution1 = (N, reservations) => {
  const makeRow = (r) =>
    'ABCDEFGHIK'
      .split('')
      .map((c) => (reservations.includes(r + c) ? 'X' : c))
      .join('') // Mache ein X an alle belegten Sitze
  const countPossibleInRow = (r) => r.includes('ABC') + (r.includes('DEF') || r.includes('EFG')) + r.includes('HIK')
  return range(N).map(x=>x+1)
    .map((r) => makeRow(r))
    .reduce((sum, r) => sum + countPossibleInRow(r), 0)
}

const solution2 = (N, reservations) => {
  const check = (triple, r) => triple.split('').every((c) => !reservations.includes(r + c))
  const countTriplesInRow = (r) => check('ABC', r) + (check('DEF', r) || check('EFG', r)) + check('HIK', r)
  return range(N).map(x=>x+1).reduce((sum, r) => sum + countTriplesInRow(r), 0)
}

const adjustSol = (f) => (N, reservationsAsString) => f(N, reservationsAsString.split(' '))

const test = (sol) =>
  sol(1, '') === 3 &&
  sol(1, '1A 1B 1D') === 2 &&
  sol(1, '1A 1B 1E') === 1 &&
  sol(2, '1A 1B 1D') === 5 &&
  sol(2, '1A 1B 2D') === 5 &&
  sol(12, '1A 1B 2D') === 35 &&
  sol(12, '1A 1B 2D 2E') === 34 &&
  sol(12, '1A 1B 2D 2E 2F') === 34 &&
  sol(12, '11A 11B 2D 2E 2F') === 34

test(adjustSol(solution1)) && test(adjustSol(solution2))
