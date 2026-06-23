const changeDpi = require('../src/changedpi');

const pngHeader = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const jpgHeader = Buffer.from([0xff, 0xd8, 0xff]);
const dpi = 300;
const dpm = Math.trunc((dpi * 100) / 2.54);

test('jpg dpi header', () => {
  const data = Buffer.concat([jpgHeader, Buffer.alloc(20)]);
  const res = changeDpi(Buffer.from(data), dpi);

  expect(res[13]).toBe(1);
  expect(res.readUInt16BE(14)).toBe(dpi);
  expect(res.readUInt16BE(16)).toBe(dpi);
});

test('png inserts pHYs chunk', () => {
  const data = Buffer.concat([pngHeader, Buffer.from([0, 0, 0, 0]), Buffer.from([0x49, 0x44, 0x41, 0x54]), Buffer.alloc(8)]);
  const res = changeDpi(Buffer.from(data), dpi);

  expect(res.slice(0, 8)).toEqual(pngHeader);
  expect(res.readUInt32BE(8)).toBe(9);
  expect(res.slice(12, 16).toString('ascii')).toBe('pHYs');
  expect(res.readUInt32BE(16)).toBe(dpm);
  expect(res.readUInt32BE(20)).toBe(dpm);
  expect(res[24]).toBe(1);
  expect(res.indexOf(Buffer.from('IDAT'))).toBeGreaterThan(24);
});

test('png updates existing pHYs chunk', () => {
  const data = Buffer.concat([pngHeader, Buffer.from([0, 0, 0, 9]), Buffer.from('pHYs'), Buffer.alloc(13), Buffer.from([0, 0, 0, 0]), Buffer.from('IDAT'), Buffer.alloc(8)]);
  const inserted = changeDpi(Buffer.from(data), dpi);
  const nextDpi = 72;
  const updated = changeDpi(inserted, nextDpi);
  const nextDpm = Math.trunc((nextDpi * 100) / 2.54);

  expect(updated).toBe(inserted);
  expect(updated.readUInt32BE(16)).toBe(nextDpm);
  expect(updated.readUInt32BE(20)).toBe(nextDpm);
  expect(updated[24]).toBe(1);
});

test('unknown format passthrough', () => {
  const data = Buffer.from([1, 2, 3, 4]);
  const res = changeDpi(data, dpi);

  expect(res).toBe(data);
});
