/* global expect */

const _ = require('underscore');
const perms = require('../src/algorithms/perm');
const fac = require('../src/algorithms/fac');

perms.forEach(perm => test('testset ' + perm.name, () => {
    const res = JSON.stringify(perm("ABC".split('')).map(x => x.join('')).sort());
    const expected = JSON.stringify(["ABC", "ACB", "BAC", "BCA", "CAB", "CBA"]);
    expect(res).toEqual(expected);
  }));

perms.forEach(perm => test('testset ' + perm.name, () => {
    const res = JSON.stringify(perm("ABB".split('')).map(x => x.join('')).sort());
    const expected = JSON.stringify(["ABB", "ABB", "BAB", "BAB", "BBA", "BBA"]);
    expect(res).toEqual(expected);
  }));

perms.forEach(perm => test('testset ' + perm.name, () => {
    expect(perm(_.range(0)).length).toEqual(fac(0));
    expect(perm(_.range(1)).length).toEqual(fac(1));
    expect(perm(_.range(2)).length).toEqual(fac(2));
    expect(perm(_.range(3)).length).toEqual(fac(3));
  }));

perms.forEach(perm => test('testset ' + perm.name, () =>
    expect(perm(_.range(1, 10)).length).toEqual(fac(9))
  ));

