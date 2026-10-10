const snakeView = (width, height) => {
  const canvas = document.querySelector('#game')
  const ctx = canvas.getContext('2d')
  const cell = canvas.width / width
  let particles = []
  const roundedRect = (x, y, size, radius) => {
    ctx.beginPath()
    ctx.roundRect(x, y, size, size, radius)
  }
  const drawGrid = () => {
    ctx.fillStyle = '#07110f'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = 'rgba(184, 255, 223, .055)'
    ctx.lineWidth = 1
    for (let x = 0; x <= width; x += 1) {
      ctx.beginPath()
      ctx.moveTo(x * cell, 0)
      ctx.lineTo(x * cell, canvas.height)
      ctx.stroke()
    }
    for (let y = 0; y <= height; y += 1) {
      ctx.beginPath()
      ctx.moveTo(0, y * cell)
      ctx.lineTo(canvas.width, y * cell)
      ctx.stroke()
    }
  }
  const drawFruit = (fruit, time) => {
    if (!fruit) return
    const x = fruit.x * cell + cell / 2,
      y = fruit.y * cell + cell / 2,
      pulse = 1 + Math.sin(time / 130) * 0.12
    ctx.save()
    ctx.shadowColor = '#ff5b54'
    ctx.shadowBlur = 22
    ctx.fillStyle = '#ff5b54'
    ctx.beginPath()
    ctx.arc(x, y, cell * 0.27 * pulse, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,.8)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(x - cell * 0.07, y - cell * 0.07, cell * 0.08, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }
  const drawSnake = (parts, hit) =>
    parts.forEach((part, index) => {
      const inset = index === 0 ? 2.5 : 4,
        x = part.x * cell + inset,
        y = part.y * cell + inset,
        size = cell - inset * 2
      ctx.save()
      ctx.fillStyle = hit && index === 0 ? '#ff5b54' : index === 0 ? '#c8ff34' : `rgba(40, 248, 180, ${Math.max(0.34, 1 - index * 0.035)})`
      ctx.shadowColor = ctx.fillStyle
      ctx.shadowBlur = index < 5 ? 12 : 3
      roundedRect(x, y, size, Math.min(6, size / 3))
      ctx.fill()
      if (index === 0) {
        ctx.fillStyle = '#07110f'
        ctx.fillRect(x + size * 0.62, y + size * 0.2, 2.4, 2.4)
        ctx.fillRect(x + size * 0.62, y + size * 0.68, 2.4, 2.4)
      }
      ctx.restore()
    })
  const drawParticles = () => {
    particles = particles.filter((particle) => particle.life > 0)
    particles.forEach((particle) => {
      particle.x += particle.dx
      particle.y += particle.dy
      particle.life -= 0.035
      ctx.fillStyle = `rgba(255, 91, 84, ${particle.life})`
      ctx.fillRect(particle.x, particle.y, 3, 3)
    })
  }
  const burst = (point) => {
    const originX = point.x * cell + cell / 2,
      originY = point.y * cell + cell / 2
    particles.push(
      ...Array.from({ length: 18 }, (_, index) => {
        const angle = (Math.PI * 2 * index) / 18,
          speed = 1 + Math.random() * 2.5
        return { x: originX, y: originY, dx: Math.cos(angle) * speed, dy: Math.sin(angle) * speed, life: 1 }
      })
    )
  }
  const render = (model, options = {}) => {
    drawGrid()
    drawFruit(model.fruit(), performance.now())
    drawSnake(model.arr(), options.hit)
    drawParticles()
  }
  return { render, burst }
}
