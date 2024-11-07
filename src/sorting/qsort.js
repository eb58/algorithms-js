const { feedX, randomElem } = require('../ol').ol;

const qsort = (a, cmp) => a.length <= 1 ? a : [
  ...qsort(a.filter((n) => cmp(n, pivot) < 0), cmp),
  ...a.filter((n) => cmp(n, pivot) === 0),
  ...qsort(a.filter((n) => cmp(n, pivot) > 0), cmp)
];

const qsort1 = (a, cmp) => {
  const pivot = randomElem(a);
  return a.length <= 1 ? a : [
    ...qsort1(a.filter(x => cmp(x, pivot) < 0), cmp),
    ...a.filter((x) => cmp(x, pivot) === 0),
    ...qsort1(a.filter(x => cmp(x, pivot) > 0), cmp)
  ];
};

const qsort2 = (a, cmp) => feedX(randomElem(a), pivot => a.length <= 1 ? a : [
  ...qsort2(a.filter((x) => cmp(x, pivot) < 0), cmp),
  ...a.filter((x) => cmp(x, pivot) === 0),
  ...qsort2(a.filter((x) => cmp(x, pivot) > 0), cmp)
]);

const qsort3 = (xs, cmp) => {
  const partition = (xs, piv) => xs.reduce((res, n) => (res[cmp(n, piv) + 1].push(n), res), [[], [], []]);
  const qs = (xs) => feedX(partition(xs, randomElem(xs)), (p) => (xs.length <= 1 ? xs : [...qs(p[0]), ...p[1], ...qs(p[2])]));
  return qs(xs);
};

module.exports = [qsort1, qsort2, qsort3];
