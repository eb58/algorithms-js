const { feedX, randomElem } = require('../ol/ol').ol;

const qsort = (a) => (a.length <= 1 ? a : [...qsort(a.filter((n) => n < a[0])), ...a.filter((n) => n === a[0]), ...qsort(a.filter((n) => n > a[0]))]);

const qsort1 = (xs, cmp) => {
  const lt = (xs, a) => xs.filter((x) => cmp(x, a) < 0);
  const eq = (xs, a) => xs.filter((x) => cmp(x, a) === 0);
  const gt = (xs, a) => xs.filter((x) => cmp(x, a) > 0);
  const qs = (xs) => feedX(randomElem(xs), (piv) => (xs.length <= 1 ? xs : [...qs(lt(xs, piv)), ...eq(xs, piv), ...qs(gt(xs, piv))]));
  return qs(xs);
};

const qsort2 = (xs, cmp) => {
  const partition = (xs, piv) => xs.reduce((res, n) => (res[cmp(n, piv) + 1].push(n), res), [[], [], []]);
  const qs = (xs) => feedX(partition(xs, randomElem(xs)), (p) => (xs.length <= 1 ? xs : [...qs(p[0]), ...p[1], ...qs(p[2])]));
  return qs(xs);
};

module.exports = [qsort1, qsort2];
