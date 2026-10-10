const snakeGame = (width, height) => {
  const model = snakeModel(width, height, 5)
  const view = snakeView(width, height)
  const ui = {
    score: document.querySelector('#score'),
    highScore: document.querySelector('#high-score'),
    level: document.querySelector('#level'),
    start: document.querySelector('#start-screen'),
    pause: document.querySelector('#pause-screen'),
    gameOver: document.querySelector('#game-over-screen'),
    finalScore: document.querySelector('#final-score'),
    recordMessage: document.querySelector('#record-message'),
    soundButton: document.querySelector('#sound-button')
  }
  let direction = { dx: -1, dy: 0 },
    nextDirection = direction,
    state = 'ready',
    score = 0,
    level = 1,
    lastStep = 0,
    soundEnabled = true,
    audioContext
  let highScore = Number(localStorage.getItem('neon-snake-high-score') || 0)
  const speed = () => Math.max(64, 150 - (level - 1) * 9)
  const format = (value) => String(value).padStart(3, '0')
  const setScreen = (active) => ['start', 'pause', 'gameOver'].forEach((name) => ui[name].classList.toggle('active', name === active))
  const updateStats = () => {
    ui.score.textContent = format(score)
    ui.highScore.textContent = format(highScore)
    ui.level.textContent = String(level).padStart(2, '0')
  }
  const beep = (frequency, duration = 0.08) => {
    if (!soundEnabled) return
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator(),
      gain = audioContext.createGain()
    oscillator.type = 'square'
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(0.035, audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration)
    oscillator.connect(gain).connect(audioContext.destination)
    oscillator.start()
    oscillator.stop(audioContext.currentTime + duration)
  }
  const start = () => {
    model.reset()
    direction = { dx: -1, dy: 0 }
    nextDirection = direction
    score = 0
    level = 1
    lastStep = performance.now()
    state = 'playing'
    setScreen(null)
    updateStats()
    beep(420, 0.06)
  }
  const togglePause = () => {
    if (state === 'ready' || state === 'over') return
    state = state === 'paused' ? 'playing' : 'paused'
    if (state === 'playing') lastStep = performance.now()
    setScreen(state === 'paused' ? 'pause' : null)
    beep(state === 'paused' ? 260 : 390, 0.05)
  }
  const turn = (vector) => {
    if (state === 'ready') start()
    if (state !== 'playing') return
    const reverse = direction.dx + vector.dx === 0 && direction.dy + vector.dy === 0
    if (!reverse) nextDirection = vector
  }
  const endGame = () => {
    state = 'over'
    const newRecord = score > highScore
    if (newRecord) {
      highScore = score
      localStorage.setItem('neon-snake-high-score', highScore)
    }
    ui.finalScore.textContent = score
    ui.recordMessage.textContent = newRecord ? 'Neuer Rekord. Stark gespielt.' : `Rekord: ${highScore} Punkte`
    updateStats()
    setScreen('gameOver')
    beep(110, 0.3)
  }
  const step = () => {
    direction = nextDirection
    model.updateSnake(direction)
    if (model.hasCollision()) {
      endGame()
      return
    }
    if (model.hasEatenFruit()) {
      view.burst(model.fruit())
      model.doFeed(2)
      score += 10
      level = Math.floor(score / 50) + 1
      beep(540 + level * 30)
      updateStats()
    }
  }
  const loop = (time) => {
    if (state === 'playing' && time - lastStep >= speed()) {
      step()
      lastStep = time
    }
    view.render(model, { hit: state === 'over' })
    requestAnimationFrame(loop)
  }
  const directions = {
    ArrowLeft: { dx: -1, dy: 0 },
    KeyA: { dx: -1, dy: 0 },
    ArrowUp: { dx: 0, dy: -1 },
    KeyW: { dx: 0, dy: -1 },
    ArrowRight: { dx: 1, dy: 0 },
    KeyD: { dx: 1, dy: 0 },
    ArrowDown: { dx: 0, dy: 1 },
    KeyS: { dx: 0, dy: 1 }
  }
  const bindControls = () => {
    document.addEventListener('keydown', (event) => {
      if (directions[event.code]) {
        event.preventDefault()
        turn(directions[event.code])
      }
      if (event.code === 'Space') {
        event.preventDefault()
        togglePause()
      }
      if (event.code === 'Enter' && (state === 'ready' || state === 'over')) start()
    })
    document.querySelector('#start-button').addEventListener('click', start)
    document.querySelector('#restart-button').addEventListener('click', start)
    document.querySelector('#resume-button').addEventListener('click', togglePause)
    document.querySelector('#pause-button').addEventListener('click', togglePause)
    document.querySelectorAll('[data-direction]').forEach((button) =>
      button.addEventListener('click', () => {
        const map = { left: directions.ArrowLeft, up: directions.ArrowUp, right: directions.ArrowRight, down: directions.ArrowDown }
        turn(map[button.dataset.direction])
      })
    )
    ui.soundButton.addEventListener('click', () => {
      soundEnabled = !soundEnabled
      ui.soundButton.setAttribute('aria-pressed', soundEnabled)
      ui.soundButton.innerHTML = `<span>${soundEnabled ? '◉' : '○'}</span> Sound ${soundEnabled ? 'an' : 'aus'}`
      if (soundEnabled) beep(440, 0.05)
    })
    let touchStart
    const surface = document.querySelector('#canvas-wrap')
    surface.addEventListener('pointerdown', (event) => {
      touchStart = { x: event.clientX, y: event.clientY }
    })
    surface.addEventListener('pointerup', (event) => {
      if (!touchStart) return
      const dx = event.clientX - touchStart.x,
        dy = event.clientY - touchStart.y
      if (Math.max(Math.abs(dx), Math.abs(dy)) > 24) turn(Math.abs(dx) > Math.abs(dy) ? { dx: Math.sign(dx), dy: 0 } : { dx: 0, dy: Math.sign(dy) })
      touchStart = null
    })
  }
  const play = () => {
    bindControls()
    updateStats()
    view.render(model)
    requestAnimationFrame(loop)
  }
  return { play, start, togglePause }
}
