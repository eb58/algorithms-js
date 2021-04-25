const solveEightQueens = require('../src/eight-queens-puzzle');

test('eight-queens-puzzle', () => {
    expect(solveEightQueens(4).length).toEqual(2); 
    expect(solveEightQueens(5).length).toEqual(10); 
    expect(solveEightQueens(8).length).toEqual(92); 
    expect(solveEightQueens(9).length).toEqual(352); 
    expect(solveEightQueens(10).length).toEqual(724); 
    expect(solveEightQueens(11).length).toEqual(2680); 
    expect(solveEightQueens(12).length).toEqual(14200); 
    expect(solveEightQueens(13).length).toEqual(73712); 
    // expect(solveEightQueens(14).length).toEqual(365596); 
});
