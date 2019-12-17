Array.prototype.without = function (n) {
    return this.filter(x => x !== n);
};

Array.prototype.withoutIndex = function (n) {
    return this.filter((_, idx) => idx !== n);
};

perm1 = x => {
    const res = [];
    const p = (head, tail) => tail.length ? tail.map((n, i) => p([n, ...head], tail.withoutIndex(i))) : res.push(head);
    p([], x);
    return res;
};

perm2 = x => x.length < 2 ? [x] : x.reduce((a, n, i) => [...a, ...perm2(x.withoutIndex(i)).map(y => [x[i], ...y])], []);


perm3 = x => x.length < 2 ? [x] : perm3(x.slice(1)).reduce((a, y) => x.reduce((acc, _, i) => (acc.push([...y.slice(0, i), x[0], ...y.slice(i)]), acc), a), []);

permWithFilter = f => {
    const perm = xs => xs.length < 2
                ? [xs]
                : xs.reduce((a, n, i) => [...a, ...perm(xs.without(n)).map(y => [...y, xs[i]]).filter(f)], []);
    return perm;
};


module.exports = {
    perm1,
    perm2,
    perm3,
    permWithFilter
};
