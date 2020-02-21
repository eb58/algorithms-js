Array.prototype.without = function(n) {
  return this.filter(x => x !== n);
};

Array.prototype.withoutIndex = function(n) {
  return this.filter((_, idx) => idx !== n);
};

perm1 = x => {
  const res = [];
  const p = (head, tail) => (tail.length ? tail.map((n, i) => p([n, ...head], tail.withoutIndex(i))) : res.push(head));
  p([], x);
  return res;
};

perm2a = xs => (xs.length < 2 ? [xs] : xs.reduce((a, x, i) => [...a, ...perm2a(xs.withoutIndex(i)).map(y => [x, ...y])], []));
perm2b = xs => (xs.length < 2 ? [xs] : xs.flatMap((x, i) => perm2b(xs.withoutIndex(i)).map(ys => [x, ...ys])));

perm3a = xs => (xs.length < 2 ? [xs] : perm3a(xs.slice(1)).reduce((a, ys) => xs.reduce((acc, _, i) => (acc.push([...ys.slice(0, i), xs[0], ...ys.slice(i)]), acc), a), []));
perm3b = xs => (xs.length < 2 ? [xs] : perm3b(xs.slice(1)).flatMap(ys => xs.map((x, i) => [...ys.slice(0, i), xs[0], ...ys.slice(i)])));
// perm3c = xs => (xs.length < 2 ? [xs] : perm3c(xs.slice(1)).reduce((a, ys) => a.concat(xs.map((x, i) => [...ys.slice(0, i), xs[0], ...ys.slice(i)])), [])); sehr langsam!!

perm4 = xs => {
  var length = xs.length,
    result = [xs.slice()],
    c = Array(length).fill(0),
    i = 1,
    k,
    p;

  while (i < length) {
    if (c[i] < i) {
      k = i % 2 && c[i];
      p = xs[i];
      xs[i] = xs[k];
      xs[k] = p;
      ++c[i];
      i = 1;
      result.push(xs.slice());
    } else {
      c[i] = 0;
      ++i;
    }
  }
  return result;
};

permWithFilter = f => {
  const perm = xs =>
    xs.length < 2
      ? [xs]
      : xs.reduce(
          (a, n, i) => [
            ...a,
            ...perm(xs.without(n))
              .map(y => [...y, xs[i]])
              .filter(f),
          ],
          []
        );
  return perm;
};

/*  doesnt work but interesting
 const rotations = ([l, ...ls], right=[]) =>  l ? [[l, ...ls, ...right], ...rotations(ls, [...right, l])] : []
 const perm5 = ([x, ...xs]) => x ? perm5(xs).flatMap(p => rotations([x, ...p])) : [[]]
 */

module.exports = {
  perm1,
  perm2a,
  perm2b,
  perm3a,
  perm3b,
  perm4,
  permWithFilter,
};
