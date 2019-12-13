const range = n => [...Array(n).keys()]

const comb1 = (xs, k) => {
    const r = [];
    const res = [];

    const run = (level, start) => {
        for (let i = start, len = xs.length - k + level + 1; i < len; i++) {
            res[level] = xs[i];

            if (level < k - 1) {
                run(level + 1, i + 1);
            } else {
                r.push(res.slice());
            }
        }
    };
    run(0, 0);
    return r;
};


/*
 
 comb( [1,2,3,4], 0 ) ->  [ ]
 comb( [1,2,3,4], 1 ) ->  [ [1], [2], [3], [4] ]
 comb( [1,2,3,4], 2 ) ->  [ [1,2], [1,3], [1,4], [2,3], [2,4], [3,4] ]
 comb( [1,2,3,4], 3 ) ->  [ [1,2,3], [1,2,4], [1,3,4], [2,3,4] ]
 comb( [1,2,3,4], 4 ) ->  [ [1,2,3,4] ]
 
 c( [1,2,3,4], 2 ) ->
 c([2,3,4],1).map(ys => [1,...ys]
 c([3,4],1).map(ys => [2,...ys]
 c([4],1).map(ys => [3,...ys]
 
 c( [1,2,3,4,5], 2 ) ->
 c([2,3,4,5],1).map(ys => [1,...ys]
 c([3,4,5],1).map(ys => [2,...ys]
 c([4,5],1).map(ys => [3,...ys]
 c([5],1).map(ys => [4,...ys]
 
 c( [1,2,3,4,5], 3 ) ->
 c([2,3,4,5],2).map(ys => [1,...ys]
 c([3,4,5],1).map(ys => [2,...ys]
 c([4,5],1).map(ys => [3,...ys]
 c([5],1).map(ys => [4,...ys]
 c([3,4,5],2).map(ys => [2,...ys]
 c([4,5],1).map(ys => [3,...ys]
 c([5],1).map(ys => [4,...ys]
 c([4,5],2).map(ys => [3,...ys]
 c([5],1).map(ys => [4,...ys]
 
 
 
 */
comb2 = (xs, k) => {
    if (k === 1)
        return xs.map(x => [x]);

    let res = [];
    for (let i = 0; i < xs.length - k + 1; i++) {
        res = [...res, ...comb2(xs.slice(i + 1), k - 1).map(ys => [xs[i], ...ys])];
    }
    return res;
};

tails = (xs,k) => range(xs.length-k+1).map(i => ({head: xs[i], tail: xs.slice(i + 1)}));
comb3 = (xs, k) => k === 1 ? xs.map(x => [x]): tails(xs,k).reduce((a, ys) => [...a, ...comb3(ys.tail, k - 1).map(zs => [ys.head, ...zs])], []);


module.exports = {
    comb1,
    comb2,
    comb3
};