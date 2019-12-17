const ol = {
    sqr: x => x * x,
    cube: x => x * x * x,
    abs: x => x > 0 ? x : -x,
    fac: x => x <= 1 ? 1 : x * ol.fac(x - 1),
    fib: x => x <= 2 ? 1 : ol.fib(x - 1) + ol.fib(x - 2),
    randomInRange: (min, max) => Math.random() * (max - min + 1) + min,
    randomInRangeInt: (min, max) => Math.floor(Math.random() * (max - min + 1) + min),

    // pred
    odd: x => x % 2 === 0,
    even: x => x % 2 === 0,
    inrange: (x, a, b) => a <= x && x <= b,
    // cmp
    cmp: (x, y) => (x === y) ? 0 ? x < y : -1 : +1,
    // date
    leapyear: x => x % 4 === 0 && x % 100 !== 0 || x % 400 === 0,
    // arrays
    range: n => [...Array(n).keys()],
    sum: xs => xs.reduce((acc, x) => acc + x, 0),
    without: (xs, x) => xs.filter(y => x !== y),
    withoutIndex: (xs, idx) => xs.filter((_, i) => i !== idx)

};

const num = x => {
    return {
        sqr: () => x * x,
        cube: () => x * x * x,
        abs: () => x > 0 ? x : -x,
        inrange: (a, b) => a <= x && x <= b,
    };
};

//state as natural enemy of one liners!
const memoize = fn => {
    let cache = {};
    return x => cache.x || (cache[x] = fn(x));
};

f = memoize(ol.fib);

module.exports = ol
