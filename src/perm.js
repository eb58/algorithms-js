Array.prototype.without = function (n) {
  return this.filter((x) => x !== n)
}
Array.prototype.withoutIndex = function (n) {
  return this.filter((_, idx) => idx !== n)
}

perms1 = (xs) => [[xs[0]]]
perms2 = (xs) => [
  [xs[0], xs[1]],
  [xs[1], xs[0]],
]
perms3 = (xs) => [
  [xs[0], xs[1], xs[2]],
  [xs[0], xs[2], xs[1]],
  [xs[1], xs[0], xs[2]],
  [xs[1], xs[2], xs[0]],
  [xs[2], xs[0], xs[1]],
  [xs[2], xs[1], xs[0]],
]

perms4 = (xs) => [
  [xs[0], xs[1], xs[2], xs[3]],
  [xs[1], xs[0], xs[2], xs[3]],
  [xs[1], xs[2], xs[0], xs[3]],
  [xs[1], xs[2], xs[3], xs[0]],
  [xs[0], xs[2], xs[1], xs[3]],
  [xs[2], xs[0], xs[1], xs[3]],
  [xs[2], xs[1], xs[0], xs[3]],
  [xs[2], xs[1], xs[3], xs[0]],
  [xs[0], xs[2], xs[3], xs[1]],
  [xs[2], xs[0], xs[3], xs[1]],
  [xs[2], xs[3], xs[0], xs[1]],
  [xs[2], xs[3], xs[1], xs[0]],
  [xs[0], xs[1], xs[3], xs[2]],
  [xs[1], xs[0], xs[3], xs[2]],
  [xs[1], xs[3], xs[0], xs[2]],
  [xs[1], xs[3], xs[2], xs[0]],
  [xs[0], xs[3], xs[1], xs[2]],
  [xs[3], xs[0], xs[1], xs[2]],
  [xs[3], xs[1], xs[0], xs[2]],
  [xs[3], xs[1], xs[2], xs[0]],
  [xs[0], xs[3], xs[2], xs[1]],
  [xs[3], xs[0], xs[2], xs[1]],
  [xs[3], xs[2], xs[0], xs[1]],
  [xs[3], xs[2], xs[1], xs[0]],
]

permX = (xs) => {
  // Heaps algorithm --- https://en.wikipedia.org/wiki/Heap%27s_algorithm
  const len = xs.length
  const result = [xs.slice()]
  const c = Array(len).fill(0)
  let i = 1
  while (i < len) {
    if (c[i] < i) {
      const k = i % 2 && c[i]
      const p = xs[i]
      xs[i] = xs[k]
      xs[k] = p
      ++c[i]
      i = 1
      result.push(xs.slice())
    } else {
      c[i++] = 0
    }
  }
  return result
}

perm1 = (x) => {
  const res = []
  const p = (head, tail) => (tail.length ? tail.map((n, i) => p([n, ...head], tail.withoutIndex(i))) : res.push(head))
  p([], x)
  return res
}

perm2a = (xs) => (xs.length < 2 ? [xs] : xs.reduce((a, x, i) => [...a, ...perm2a(xs.withoutIndex(i)).map((y) => [x, ...y])], []))
perm2b = (xs) => (xs.length < 2 ? [xs] : xs.flatMap((x, i) => perm2b(xs.withoutIndex(i)).map((ys) => [x, ...ys])))

perm3a = (xs) =>
  xs.length < 2
    ? [xs]
    : perm3a(xs.slice(1)).reduce(
        (a, ys) => xs.reduce((acc, _, i) => (acc.push([...ys.slice(0, i), xs[0], ...ys.slice(i)]), acc), a),
        []
      )
perm3b = (xs) =>
  xs.length < 2 ? [xs] : perm3b(xs.slice(1)).flatMap((ys) => xs.map((x, i) => [...ys.slice(0, i), xs[0], ...ys.slice(i)]))
// perm3c = xs => (xs.length < 2 ? [xs] : perm3c(xs.slice(1)).reduce((a, ys) => a.concat(xs.map((x, i) => [...ys.slice(0, i), xs[0], ...ys.slice(i)])), [])); sehr langsam!!

perm4 = (xs) =>
  xs.length === 4
    ? perms4(xs)
    : xs.length === 3
    ? perms3(xs)
    : xs.length === 2
    ? perms2(xs)
    : xs.length === 1
    ? perms1(xs)
    : permX(xs)

permWithFilter = (f) => {
  const perm = (xs) =>
    xs.length < 2
      ? [xs]
      : xs.reduce(
          (a, n, i) => [
            ...a,
            ...perm(xs.without(n))
              .map((y) => [...y, xs[i]])
              .filter(f),
          ],
          []
        )
  return perm
}

perm6 = (() => {
  const range = (n) => [...Array(n).keys()]
  const cache = []
  return (xs) => {
    const len = xs.length
    if (!cache[len]) {
      cache[len] = perm4(range(len))
    }
    const mapping = xs.reduce((acc, x, i) => ((acc[i] = x), acc), {})
    return cache[len].map((ys) => ys.map((y) => mapping[y]))
  }
})()

module.exports = {
  perm1,
  perm2a,
  perm2b,
  perm3a,
  perm3b,
  perm4,
  perm6,
  permWithFilter,
}
