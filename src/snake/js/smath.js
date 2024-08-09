var smath = {
  sqr: x => x * x,
  sqrdist: (p, q) => smath.sqr(p.x - q.x) + smath.sqr(p.y - q.y),
  dist: (p, q) => Math.sqrt(smath.sqrdist(p, q)),
  point: (x, y) => ({x, y}),
  rect: (x, y, w, h) => ({x, y, w, h}),
  pointInRect: (p, r) => r.x < p.x && p.x < r.w && r.y < p.y && p.y < r.h,
  randomVal: (min,max) => Math.floor(min  + Math.random() * max ),
  randomPointInRect: rect => smath.point(smath.randomVal(rect.x + 1, rect.w - rect.x - 1),smath.randomVal(rect.y + 1, rect.h - rect.y - 1) ),
};