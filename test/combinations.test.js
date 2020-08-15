/* global  expect */
const range = n => [...Array(n).keys()];
const combs = require('../src/algorithms/combinations');
const combinations = Object.keys(combs).map(k => combs[k]);

combinations.forEach(comb => test('testset1 '+ comb.name,  () => {
    expect(comb(range(3), 2).length).toEqual(3);
    expect(comb(range(5), 2).length).toEqual(10);
    expect(comb(range(5), 3).length).toEqual(10);
    expect(comb(range(5), 4).length).toEqual(5);
    expect(comb(range(15), 4).length).toEqual(1365);
    expect(comb(range(15), 7).length).toEqual(6435);
    expect(comb(range(20), 4).length).toEqual(4845);
    expect(comb(range(20), 7).length).toEqual(77520);
    
    expect(JSON.stringify(comb([1, 2, 3, 4, 5], 4))).toEqual("[[1,2,3,4],[1,2,3,5],[1,2,4,5],[1,3,4,5],[2,3,4,5]]");
    expect(JSON.stringify(comb([1, 2, 3, 4, 5], 3))).toEqual("[[1,2,3],[1,2,4],[1,2,5],[1,3,4],[1,3,5],[1,4,5],[2,3,4],[2,3,5],[2,4,5],[3,4,5]]");
    expect(JSON.stringify(comb([1, 2, 3, 4, 5], 2))).toEqual("[[1,2],[1,3],[1,4],[1,5],[2,3],[2,4],[2,5],[3,4],[3,5],[4,5]]");
    expect(JSON.stringify(comb([1, 2, 3, 4, 5], 1))).toEqual("[[1],[2],[3],[4],[5]]");
    expect(JSON.stringify(comb([1, 2, 3, 4, 5], 5))).toEqual("[[1,2,3,4,5]]");
  })
);
