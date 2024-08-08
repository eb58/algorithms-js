const { feedX, randomElem } = require('../ol').ol;

const qsort = (a) => a.length <= 1 ? a : [
  ...qsort(a.filter((n) => n < a[0])),
  ...a.filter((n) => n === a[0]),
  ...qsort(a.filter((n) => n > a[0]))
];

const qsort1 = (a) => {
  const pivot = randomElem(a);
  return a.length <= 1 ? a : [
    ...qsort1(a.filter((x) => x < pivot)), // kleiner pivot
    ...a.filter((x) => x === pivot),       // gleich pivot
    ...qsort1(a.filter((x) => x > pivot)), // größer pivot
  ]
};

const qsort2 = (a) => feedX(randomElem(a), pivot => a.length <= 1 ? a : [
  ...qsort2(a.filter((x) => x < pivot)), // kleiner pivot
  ...a.filter((x) => x === pivot),       // gleich pivot
  ...qsort2(a.filter((x) => x > pivot)), // größer pivot
])

const qsort3 = (xs, cmp) => {
  const partition = (xs, piv) => xs.reduce((res, n) => (res[cmp(n, piv) + 1].push(n), res), [[], [], []]);
  const qs = (xs) => feedX(partition(xs, randomElem(xs)), (p) => (xs.length <= 1 ? xs : [...qs(p[0]), ...p[1], ...qs(p[2])]));
  return qs(xs);
};

module.exports = [qsort1, qsort2, qsort3];
