const { reshape, rotate90, transpose } = require('../src/ol').matrix;
const pentonimo = require('../src/pentomino/pentomino');

const prep = (s,dimc) => reshape(s.trim().replaceAll(' ', '').replaceAll('\n', '').split(''), dimc);
const filledBoards = {
  '4x15': prep(`
        l l x n n n i i i i i f v v v
        l x x x p n n w w z f f f t v
        l u x u p p w w y z z z f t v
        l u u u p p w y y y y z t t t`, 15),
  '6x10': prep(`
        n w w y y y y p p p
        n n w w y u u u p p
        l n t w x u f u z z
        l n t x x x f f z v
        l t t t x f f z z v
        l l i i i i i v v v`, 10),
};

test('symbols', () => {
  // symbols = ['f', 'i', 'l', 'n', 'p', 't', 'u', 'v', 'w', 'x', 'y', 'z']
  const filledBoard = filledBoards['4x15'];
  const pento = pentonimo(filledBoard);
  expect(pento.internals.SYMBOLS).toEqual(['f', 'i', 'l', 'n', 'p', 't', 'u', 'v', 'w', 'x', 'y', 'z']);
});

xtest('extract 6x10', () => {
  const filledBoard = filledBoards['6x10']
  const pento = pentonimo(filledBoard);  
  const extract = pento.internals.extract;
  const extr = (c) => extract(filledBoard, c);
  
  // symbols = ['f', 'i', 'l', 'n', 'p', 't', 'u', 'v', 'w', 'x', 'y', 'z']
  expect(extr('f')).toEqual([[' ',' ','f'],['f','f','f'],[' ','f',' ']]);
  expect(extr('i')).toEqual([['i'], ['i'], ['i'], ['i'], ['i']]);
  expect(extr('l')).toEqual([['l','l','l','l'],[' ',' ',' ','l']]);
  expect(extr('n')).toEqual([['n','n',' ',' '],[' ','n','n','n']]);
  expect(extr('p')).toEqual([['p',' '],['p','p'],['p','p']]);
  expect(extr('t')).toEqual([[' ',' ','t' ],['t','t','t'],[' ',' ','t']]);
  expect(extr('u')).toEqual([['u','u'],['u',' '],['u','u']]);
  expect(extr('v')).toEqual([[' ',' ','v'],[' ',' ','v'],['v','v','v']]);
  expect(extr('w')).toEqual([['w',' ',' '],['w','w',' '],[' ','w','w']]);
  expect(extr('x')).toEqual([[' ', 'x', ' '],['x', 'x', 'x'],[' ', 'x', ' ']]);
  expect(extr('y')).toEqual([['y',' '],['y','y'],['y',' '],['y',' ']]);
  expect(extr('z')).toEqual([[' ',' ','z '],['z','z','z'],['z',' ',' ']]);
});

test('extract 4x15', () => { 
  const filledBoard = filledBoards['4x15'];
  const pento = pentonimo(filledBoard)
  const extract = pento.internals.extract
  const extr = (c) => extract(filledBoard, c)

  expect(extr('f')).toEqual([[' ','f',' '],['f','f',' '],[' ','f','f']]);
  expect(extr('i')).toEqual([['i'], ['i'], ['i'], ['i'], ['i']]);
  expect(extr('l')).toEqual([['l','l','l','l'],['l',' ',' ',' ']]);
  expect(extr('n')).toEqual([['n',' '],['n',' '],['n','n'],[' ','n']]);
  expect(extr('p')).toEqual([['p','p','p'],[' ','p','p']]);
  expect(extr('t')).toEqual([[' ',' ','t'],['t','t','t'],[' ',' ','t']]);
  expect(extr('u')).toEqual([['u','u'],[' ','u'],['u','u']]);
  expect(extr('v')).toEqual([['v',' ',' '],['v',' ',' '],['v','v','v']]);
  expect(extr('w')).toEqual([[' ','w','w'],['w','w',' '],['w',' ',' ']]);
  expect(extr('x')).toEqual([[' ', 'x', ' '],['x', 'x', 'x'],[' ', 'x', ' ']]);
  expect(extr('y')).toEqual([[' ','y'],['y','y'],[' ','y'],[' ', 'y']]);
  expect(extr('z')).toEqual([['z','z',' '],[' ','z',' '],[' ','z','z']]);
});

test('generateTiles 6x10', () => {
  const pento = pentonimo(filledBoards['6x10']);
  const res = Object.entries(pento.internals.generateAllTiles()).map(([key, value]) => key + ':' + value.length);
  expect(res).toEqual(['f:64', 'i:56', 'l:248', 'n:248', 'p:304', 't:128', 'u:152', 'v:128', 'w:128', 'x:32', 'y:248', 'z:128']);
});

const boardToString = (b) => b.flat().join('');

test('solve pentonimo 6 x 10', () => {
  const pento = pentonimo(filledBoards['6x10']);
  const solutions = pento.solve();
  expect(solutions.length).toBe(2339);
  expect(solutions.findIndex((s) => boardToString(s) === 'llxiiiiiwwlxxxvvvwwylfxuuuvwyylffutuvzzyffnntpppzynnntttppzz') >= 0).toBe(true);
  expect(solutions.findIndex((s) => boardToString(s) === 'llxtttyyyylxxxtppuyulfxwtppuuulffwwpzvvvffnnwwzzzvnnniiiiizv') >= 0).toBe(true);
  expect(solutions.findIndex((s) => boardToString(s) === 'uuxllllvvvuxxxwwltnvuuxwwtttnvppfwzzytnnppffzyyyynpffzziiiii') >= 0).toBe(true);
});

test('solve pentonimo 4 x 15', () => {
  const pento = pentonimo(filledBoards['4x15'], 4, 15);
  const solutions = pento.solve();
  expect(solutions.length).toBe(368);
});
