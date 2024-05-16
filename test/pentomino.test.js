// const { DancingLinkX } = require('@algorithm.ts/dlx'); // do not understand how this works
// const dlx = require('dlx'); // no solutions found in 5 min
// const dlxlib = require('dlxlib'); // ~30 sec
// const dlx_solve = require('../dlx'); // ~10.5 sec
const dancingLinks = require('dancing-links'); // ~9.5 sec

// const solve = problem => dlxlib.solve(problem); // ~30 sec
// const solve =  problem => dlx_solve(problem, 368 ); // ~10.5 sec
const dlxSolve = (problem) => dancingLinks.findAll(problem.map((row) => ({ row }))).map((x) => x.map((o) => o.index));

const { reshape } = require('../src/ol/ol').matrix;
const pentonimo = require('../src/pentomino/pentomino');

const prep = (s, dimc) => reshape(s.trim().replaceAll(' ', '').replaceAll('\n', '').split(''), dimc);
const filledBoards = {
  '4x15': prep(
    `
        l l x n n n i i i i i f v v v
        l x x x p n n w w z f f f t v
        l u x u p p w w y z z z f t v
        l u u u p p w y y y y z t t t`,
    15,
  ),
  '6x10': prep(
    `
        n w w y y y y p p p
        n n w w y u u u p p
        l n t w x u f u z z
        l n t x x x f f z v
        l t t t x f f z z v
        l l i i i i i v v v`,
    10,
  ),
};
 
test('symbols', () => {
  // symbols = ['f', 'i', 'l', 'n', 'p', 't', 'u', 'v', 'w', 'x', 'y', 'z']
  const filledBoard = filledBoards['4x15'];
  const pento = pentonimo(filledBoard);
  expect(pento.internals.SYMBOLS).toEqual(['f', 'i', 'l', 'n', 'p', 't', 'u', 'v', 'w', 'x', 'y', 'z']);
});

test('extract 6x10', () => {
  const filledBoard = filledBoards['6x10'];
  const pento = pentonimo(filledBoard);
  const extract = pento.internals.extract;
  const extr = (c) =>
    extract(filledBoard, c)
      .map((r) => r.join(''))
      .join('|');

  expect(extr('f')).toEqual('  f|fff| f ');
  expect(extr('i')).toEqual('i|i|i|i|i');
  expect(extr('l')).toEqual('llll|   l');
  expect(extr('n')).toEqual('nn  | nnn');
  expect(extr('p')).toEqual('p |pp|pp');
  expect(extr('t')).toEqual('  t|ttt|  t');
  expect(extr('u')).toEqual('uu|u |uu');
  expect(extr('v')).toEqual('  v|  v|vvv');
  expect(extr('w')).toEqual('w  |ww | ww');
  expect(extr('x')).toEqual(' x |xxx| x ');
  expect(extr('y')).toEqual('y |yy|y |y ');
  expect(extr('z')).toEqual('  z|zzz|z  ');
});

test('extract 4x15', () => {
  const filledBoard = filledBoards['4x15'];
  const pento = pentonimo(filledBoard);
  const extract = pento.internals.extract;
  const extr = (c) =>
    extract(filledBoard, c)
      .map((r) => r.join(''))
      .join('|');

  expect(extr('f')).toEqual(' f |ff | ff');
  expect(extr('i')).toEqual('i|i|i|i|i');
  expect(extr('l')).toEqual('llll|l   ');
  expect(extr('n')).toEqual('n |n |nn| n');
  expect(extr('p')).toEqual('ppp| pp');
  expect(extr('t')).toEqual('  t|ttt|  t');
  expect(extr('u')).toEqual('uu| u|uu');
  expect(extr('v')).toEqual('v  |v  |vvv');
  expect(extr('w')).toEqual(' ww|ww |w  ');
  expect(extr('x')).toEqual(' x |xxx| x ');
  expect(extr('y')).toEqual(' y|yy| y| y');
  expect(extr('z')).toEqual('zz | z | zz');
});

test('generateTiles 6x10', () => {
  const pento = pentonimo(filledBoards['6x10']);
  const res = Object.entries(pento.internals.generateAllTiles()).map(([key, value]) => key + ':' + value.length);
  expect(res).toEqual(['f:64', 'i:56', 'l:248', 'n:248', 'p:304', 't:128', 'u:152', 'v:128', 'w:128', 'x:32', 'y:248', 'z:128']);
});

const boardToString = (b) => b.flat().join('');

test('solve pentonimo 6 x 10', () => {
  const pento = pentonimo(filledBoards['6x10'],dlxSolve);
  const solutions = pento.solve();
  expect(solutions.length).toBe(2339);
  expect(solutions.findIndex((s) => boardToString(s) === 'llxiiiiiwwlxxxvvvwwylfxuuuvwyylffutuvzzyffnntpppzynnntttppzz') >= 0).toBe(true);
  expect(solutions.findIndex((s) => boardToString(s) === 'llxtttyyyylxxxtppuyulfxwtppuuulffwwpzvvvffnnwwzzzvnnniiiiizv') >= 0).toBe(true);
  expect(solutions.findIndex((s) => boardToString(s) === 'uuxllllvvvuxxxwwltnvuuxwwtttnvppfwzzytnnppffzyyyynpffzziiiii') >= 0).toBe(true);
});

test('solve pentonimo 4 x 15', () => {
  const pento = pentonimo(filledBoards['4x15'], dlxSolve);
  const solutions = pento.solve();
  expect(solutions.length).toBe(368);
});
