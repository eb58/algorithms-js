const snakeModel = (width, height, length = 5) => {
  let snake
  let fruit
  let pendingGrowth
  const samePoint = (a, b) => a.x === b.x && a.y === b.y
  const isOnSnake = (point, includeHead = true) => snake.slice(includeHead ? 0 : 1).some((part) => samePoint(part, point))
  const generateFruit = () => {
    const freeCells = []
    for (let y = 0; y < height; y += 1)
      for (let x = 0; x < width; x += 1) {
        if (!isOnSnake({ x, y })) freeCells.push({ x, y })
      }
    return freeCells.length ? freeCells[Math.floor(Math.random() * freeCells.length)] : null
  }
  const reset = () => {
    const startX = Math.floor(width / 2)
    const startY = Math.floor(height / 2)
    snake = Array.from({ length }, (_, index) => ({ x: startX + index, y: startY }))
    pendingGrowth = 0
    fruit = generateFruit()
  }
  const updateSnake = (vector) => {
    const oldTail = snake[snake.length - 1]
    snake.unshift({ x: snake[0].x + vector.dx, y: snake[0].y + vector.dy })
    if (pendingGrowth > 0) pendingGrowth -= 1
    else snake.pop()
    return oldTail
  }
  const hasCollision = () => {
    const head = snake[0]
    return head.x < 0 || head.x >= width || head.y < 0 || head.y >= height || isOnSnake(head, false)
  }
  const hasEatenFruit = () => fruit && samePoint(snake[0], fruit)
  const doFeed = (amount = 1) => {
    pendingGrowth += amount
    fruit = generateFruit()
  }
  reset()
  return {
    reset,
    doFeed,
    updateSnake,
    hasCollision,
    hasEatenFruit,
    head: () => snake[0],
    last: () => snake[snake.length - 1],
    arr: () => snake,
    fruit: () => fruit
  }
}
