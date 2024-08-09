const snakeModel = (w, h, len) => {
  const feedX = (x, f) => f(x);
  const range = n => [...Array(n).keys()];

  const initial = () => snake.slice(0,length-1);
  const head = () => snake[0];
  const last = () => snake[snake.length - 1];
  const rest = () => snake.slice(1);
  const hasBorderCollision = () => !smath.pointInRect(snake[0], smath.rect(0, 0, w, h));
  const hasCollisionPoint = (p) => rest().some(q => smath.sqrdist(p, q) === 0);
  const hasSelfCollision = () => hasCollisionPoint(head())
  const hasCollision = () => hasBorderCollision() || hasSelfCollision();
  const hasEatenFruit = () => smath.sqrdist(snake[0], fruit) === 0;
  const rndPoint = () => smath.randomPointInRect(smath.rect(1, 1, w - 1, h - 1));
  const generateFruit = () => feedX(rndPoint(), (p) => hasCollisionPoint(p) ? generateFruit() : p);
  const doFeed = (n) => { feed += n; fruit = generateFruit() };

  const p = smath.randomPointInRect(smath.rect(w / 4, 2, w - len, h - 2));
  let snake = range(len).map(v => smath.point(v + p.x, p.y));
  let fruit = generateFruit();
  let feed = 0;

  const updateSnake = (vec) => {
    const oldLast = last();
    const newhead = smath.point(head().x + vec.dx, head().y + vec.dy);
    snake = [newhead, ...(feed === 0 ? initial() :snake)];
    feed = Math.max(0, feed - 1);
    return oldLast;
  }

  return {
    doFeed,
    updateSnake,
    hasCollision,
    hasEatenFruit,
    head,
    last,
    arr: () => snake,
    fruit: () => fruit,
  };
};
