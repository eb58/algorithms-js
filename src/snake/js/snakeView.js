const snakeView = (w, h) => {
  const scale = 10;
  const COL = {
    background: '#aaa',
    backgroundFrame: '#000',
    snake: '#800',
    snakehead: '#ee0',
    snakehit: '#f00',
    fruit: '#0f0'
  };

  const createAttr = (fill, stroke, width) => ({ fill, stroke, 'stroke-width': width });

  const attrFrame = createAttr(COL.background, COL.backgroundFrame, 8);
  const attrBackground = createAttr(COL.background, COL.background, 3);
  const attrSnake = createAttr(COL.snake, COL.snake, 3);
  const attrSnakeHit = createAttr(COL.snakehit, COL.snakehit, 3);
  const attrFruit = createAttr(COL.fruit, COL.fruit, 3);

  const paper = Raphael(10, 10, w * scale, h * scale);
  paper.rect(0, 0, w * scale, h * scale).attr(attrFrame);

  const drawFruit = (snake) => paper.circle(snake.fruit().x * scale, snake.fruit().y * scale, 3).attr(attrFruit);
  const drawSnake = (snake) => snake.arr().map(v => paper.circle(v.x * scale, v.y * scale, 3).attr(attrSnake));

  const redrawSnake = (snake, last, hit) => {
    paper.circle(last.x * scale, last.y * scale, 4).attr(attrBackground); //whipe out last segment of snake
    paper.circle(snake.head().x * scale, snake.head().y * scale, 3).attr(hit ? attrSnakeHit : attrSnake);  // draw new head
  }

  return {
    drawSnake,
    redrawSnake,
    drawFruit
  };
};
