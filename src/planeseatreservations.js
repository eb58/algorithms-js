// You have a plane with N rows and seats ABC DEFG HIK for every row
// And you have given a String with reservations i.e. '1A 1B 1D 2B 11F'
// Compute number of remaining triples of adjacent seats.
const { ol } = require('./ol')

const range = (n) => [...new Array(n).keys()]
const { feedX } = ol

const solution1 = (N, reservationsAsString) => feedX(reservationsAsString.split(' '), reservations => {
  const makeRow = (r) =>
    'ABCDEFGHIK'
      .split('')
      .map((c) => (reservations.includes(r + c) ? 'X' : c))
      .join('') // Mache ein X an alle belegten Sitze
  const countPossibleInRow = (r) => r.includes('ABC') + (r.includes('DEF') || r.includes('EFG')) + r.includes('HIK')
  return range(N).map(x => x + 1)
    .map((r) => makeRow(r))
    .reduce((sum, r) => sum + countPossibleInRow(r), 0)
})

const solution2 = (N, reservationsAsString) => feedX(reservationsAsString.split(' '), reservations => {
  const check = (triple, r) => triple.split('').every((c) => !reservations.includes(r + c))
  const countTriplesInRow = (r) => check('ABC', r) + (check('DEF', r) || check('EFG', r)) + check('HIK', r)
  return range(N).reduce((sum, r) => sum + countTriplesInRow(r + 1), 0)
})

// Seat groups of a row: a row has at most one triple per group (DEF and EFG overlap, so only one of them fits).
const tripleGroups = [['ABC'], ['DEF', 'EFG'], ['HIK']]

const solution3 = (N, reservationsAsString) => {
  const taken = new Set(reservationsAsString.split(' '))
  const isFree = (row, triple) => [...triple].every((seat) => !taken.has(row + seat))
  const countInRow = (row) => tripleGroups.filter((triples) => triples.some((triple) => isFree(row, triple))).length
  return range(N).reduce((sum, i) => sum + countInRow(i + 1), 0)
}

if (typeof module !== 'undefined' && module.exports) module.exports = { solution1, solution2, solution3 }
