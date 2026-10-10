const withoutIndex = (xs, n) => xs.filter((_, idx) => idx !== n);

const perms1 = (xs) => [[xs[0]]];

const perms2 = (xs) => [
  [xs[0], xs[1]],
  [xs[1], xs[0]],
];

const perms3 = (xs) => [
  [xs[0], xs[1], xs[2]],
  [xs[0], xs[2], xs[1]],
  [xs[1], xs[0], xs[2]],
  [xs[1], xs[2], xs[0]],
  [xs[2], xs[0], xs[1]],
  [xs[2], xs[1], xs[0]],
];

const perms4 = (xs) => [
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
];

const permX = (input) => {
  // Heaps algorithm --- https://en.wikipedia.org/wiki/Heap%27s_algorithm
  const xs = input.slice(); // the algorithm swaps in place
  const len = xs.length;
  const result = [xs.slice()];
  const c = Array(len).fill(0);
  let i = 1;
  while (i < len) {
    if (c[i] < i) {
      const k = i % 2 && c[i];
      const p = xs[i];
      xs[i] = xs[k];
      xs[k] = p;
      ++c[i];
      i = 1;
      result.push(xs.slice());
    } else {
      c[i++] = 0;
    }
  }
  return result;
};

const perm1 = (x) => {
  const res = [];
  const p = (head, tail) => (tail.length ? tail.map((n, i) => p([n, ...head], withoutIndex(tail, i))) : res.push(head));
  p([], x);
  return res;
};

const perm2a = (xs) => (xs.length < 2 ? [xs.slice()] : xs.reduce((a, x, i) => [...a, ...perm2a(withoutIndex(xs, i)).map((y) => [x, ...y])], []));
const perm2b = (xs) => (xs.length < 2 ? [xs.slice()] : xs.flatMap((x, i) => perm2b(withoutIndex(xs, i)).map((ys) => [x, ...ys])));

const perm3a = (xs) =>
  xs.length < 2
    ? [xs.slice()]
    : perm3a(xs.slice(1)).reduce((a, ys) => xs.reduce((acc, _, i) => (acc.push([...ys.slice(0, i), xs[0], ...ys.slice(i)]), acc), a), []);
const perm3b = (xs) =>
  xs.length < 2 ? [xs.slice()] : perm3b(xs.slice(1)).flatMap((ys) => xs.map((x, i) => [...ys.slice(0, i), xs[0], ...ys.slice(i)]));

// Lookup tables up to 4 elements, Heaps algorithm beyond: the fastest variant.
const permFast = (xs) => {
  if (xs.length === 4) return perms4(xs);
  if (xs.length === 3) return perms3(xs);
  if (xs.length === 2) return perms2(xs);
  if (xs.length === 1) return perms1(xs);
  return permX(xs);
};

// Builds the permutations front to back and calls f on every prefix of length >= 2 before
// extending it, so a rejected prefix is never expanded. f gets the live prefix array and
// must not keep a reference to it. The unused elements are swapped to the back of rest, so each
// level only loops over what is left. The permutations do not come in lexicographic order.
const permWithFilter = (f) => (xs) => {
  const result = [];
  const rest = xs.slice(); // rest[0..k) is the prefix, rest[k..] the unused elements
  const prefix = [];
  const extend = (k) => {
    if (k === rest.length) {
      result.push(prefix.slice());
      return;
    }
    for (let i = k; i < rest.length; i++) {
      const chosen = rest[i];
      rest[i] = rest[k];
      rest[k] = chosen;
      prefix.push(chosen);
      if (k < 1 || f(prefix)) extend(k + 1);
      prefix.pop();
      rest[k] = rest[i];
      rest[i] = chosen;
    }
  };
  extend(0);
  return result;
};

// The permutations of the indices are computed once per length and then mapped onto the elements.
// They stay in memory, so only up to MAX_CACHED_LENGTH elements are cached (8! = 40320 permutations).
const permCached = (() => {
  const MAX_CACHED_LENGTH = 8;
  const range = (n) => [...Array(n).keys()];
  const cache = [];
  return (xs) => {
    const len = xs.length;
    if (len > MAX_CACHED_LENGTH) return permFast(xs);
    if (!cache[len]) cache[len] = permFast(range(len));
    return cache[len].map((ys) => ys.map((y) => xs[y]));
  };
})();

module.exports = {
  perm1,
  perm2a,
  perm2b,
  perm3a,
  perm3b,
  permFast,
  permCached,
  permWithFilter,
};
