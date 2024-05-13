const dlx_solve = require('../src/dlx');
const dlxlib = require('dlxlib'); 
const dancingLinks = require('dancing-links')   
const dlx = require('dlx');    

test('dlx problem1', () => {
    const problem = [
        [0, 0, 1, 0, 1, 1, 0],
        [1, 0, 0, 1, 0, 0, 1],
        [0, 1, 1, 0, 0, 1, 0],
        [1, 0, 0, 1, 0, 0, 0],
        [0, 1, 0, 0, 0, 0, 1],
        [0, 0, 0, 1, 1, 0, 1],
        [0, 0, 0, 1, 1, 0, 1],
    ];
    expect(dlx_solve(problem, 1).map(x => x.sort())).toEqual([[0, 3, 4]])
    expect(dlxlib.solve(problem).map(x => x.sort())).toEqual([[0, 3, 4]])
    expect(dlx.solve(problem).map(x => x.sort())).toEqual([[0, 3, 4]])
})

test('dlx problem2', () => {
    const  problem = [
        [1, 0, 0, 0],
        [0, 1, 1, 0],
        [1, 0, 0, 1],
        [0, 0, 1, 1],
        [0, 1, 0, 0],
        [0, 0, 1, 0]
    ];

    // console.log("AAA", dlx_solve(problem,3).map(x => x.sort()))
    // console.log("BBB", dlxlib.solve(problem).map(x => x.sort()))
    // console.log("CCC", dlx.solve(problem).map(x => x.sort()))
    // console.log("DDD", dancingLinks.findAll(problem.map(row => ({ row }))).map(x => x.map(o => o.index)).map(x => x.sort()))
    
    // expect(dlx_solve(problem, 3).map(x => x.sort())).toEqual([[0, 3, 4], [1, 2], [2, 4, 5]])
    expect(dlxlib.solve(problem).map(x => x.sort())).toEqual([[0, 3, 4], [1, 2], [2, 4, 5]])
    expect(dlx.solve(problem).map(x => x.sort())).toEqual([[0, 3, 4], [1, 2], [2, 4, 5]])
})


