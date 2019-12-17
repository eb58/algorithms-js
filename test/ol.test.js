/* global expect */
const ol = require('../src/ol/ol');
test('testset fac', () => {
    expect(ol.fac(1)).toEqual(1);
    expect(ol.fac(2)).toEqual(2);
    expect(ol.fac(3)).toEqual(6);
    expect(ol.fac(4)).toEqual(24);
});

