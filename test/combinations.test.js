/* global  expect */
const combinations = require('../src/algorithms/combinations');

const combs = [combinations.comb1, combinations.comb2]

combs.forEach(comb => test('testset1 ' + comb.name, () => {
        expect(comb([1, 2, 3], 2).length).toEqual(3);
        expect(comb([1, 2, 3, 4, 5], 2).length).toEqual(10);
        expect(comb([1, 2, 3, 4, 5], 3).length).toEqual(10);
        expect(comb([1, 2, 3, 4, 5], 4).length).toEqual(5);
        expect(JSON.stringify(comb([1, 2, 3, 4, 5], 4))).toEqual("[[1,2,3,4],[1,2,3,5],[1,2,4,5],[1,3,4,5],[2,3,4,5]]");
        expect(JSON.stringify(comb([1, 2, 3, 4, 5], 3))).toEqual("[[1,2,3],[1,2,4],[1,2,5],[1,3,4],[1,3,5],[1,4,5],[2,3,4],[2,3,5],[2,4,5],[3,4,5]]");
        expect(JSON.stringify(comb([1, 2, 3, 4, 5], 2))).toEqual("[[1,2],[1,3],[1,4],[1,5],[2,3],[2,4],[2,5],[3,4],[3,5],[4,5]]");
        expect(JSON.stringify(comb([1, 2, 3, 4, 5], 1))).toEqual("[[1],[2],[3],[4],[5]]");
        expect(JSON.stringify(comb([1, 2, 3, 4, 5], 5))).toEqual("[[1,2,3,4,5]]");
    })
);
