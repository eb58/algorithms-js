(() => {
   const board = document.querySelector('#board')
   const playButton = document.querySelector('#play-button')
   const playLabel = document.querySelector('#play-label')
   const playIcon = document.querySelector('#play-icon')
   const stepBack = document.querySelector('#step-back')
   const stepForward = document.querySelector('#step-forward')
   const resetButton = document.querySelector('#reset-button')
   const manualButton = document.querySelector('#manual-button')
   const discRange = document.querySelector('#disc-range')
   const discOutput = document.querySelector('#disc-output')
   const speedRange = document.querySelector('#speed-range')
   const speedOutput = document.querySelector('#speed-output')
   const moveCount = document.querySelector('#move-count')
   const optimalCount = document.querySelector('#optimal-count')
   const progressBar = document.querySelector('#progress-bar')
   const progressGlow = document.querySelector('#progress-glow')
   const statusLabel = document.querySelector('#status-label')
   const moveHint = document.querySelector('#move-hint')
   const historyList = document.querySelector('#history-list')
   const names = ['Quelle', 'Hilfsstab', 'Ziel']
   const keys = ['l', 'c', 'r']
   const state = { n: 5, step: 0, speed: 1, playing: false, manual: false, selected: null, timer: null, model: towers(5), manualMoves: [], arrival: null }

   const solution = () => hanoi2(state.n)
   const totalMoves = () => 2 ** state.n - 1
   const moveBetween = (before, after) => keys.reduce((move, key, index) => {
      const delta = after[key].length - before[key].length
      return delta < 0 ? { ...move, from: index } : delta > 0 ? { ...move, to: index } : move
   }, { from: 0, to: 0 })
   const currentSolution = () => solution()
   const currentModel = () => state.manual ? state.model : currentSolution()[state.step]
   const currentMove = () => state.manual || state.step === 0 ? null : moveBetween(currentSolution()[state.step - 1], currentModel())
   const formatMove = (move) => move ? `${names[move.from]} → ${names[move.to]}` : 'Noch kein Zug'
   const setStatus = (label, hint = 'Drücke Start, um den ersten Zug zu sehen.') => {
      statusLabel.textContent = label
      moveHint.textContent = hint
   }
   const setPlaying = (playing) => {
      state.playing = playing
      playLabel.textContent = playing ? 'Pause' : state.step === totalMoves() ? 'Nochmal' : 'Start'
      playIcon.className = `button__icon ${playing ? 'button__icon--pause' : 'button__icon--play'}`
      if (playing) scheduleNext()
      else clearTimeout(state.timer)
   }
   const renderHistory = () => {
      const moves = state.manual ? state.manualMoves.slice(-3).reverse() : currentSolution().slice(1, state.step + 1).map((model, index) => moveBetween(currentSolution()[index], model)).slice(-3).reverse()
      historyList.innerHTML = moves.length ? moves.map((move, index) => `<div class="history-item"><span class="history-item__index">${String((state.manual ? state.manualMoves.length : state.step) - index).padStart(2, '0')}</span><span>${names[move.from]}<span class="history-item__arrow">→</span>${names[move.to]}</span></div>`).join('') : '<span class="history-empty">Die nächsten Entscheidungen erscheinen hier.</span>'
   }
   const renderBoard = () => {
      const model = currentModel()
      const arrival = state.arrival
      board.innerHTML = keys.map((key, index) => `<button class="tower${state.selected === index ? ' tower--selected' : ''}" data-tower="${index}" type="button" aria-label="${names[index]}: ${model[key].length} Scheiben"><span class="tower__stack">${model[key].map((disk, diskIndex) => `<span class="disk disk--${disk}${arrival?.to === index && diskIndex === model[key].length - 1 ? ' disk--arriving' : ''}" style="width:${28 + disk / state.n * 66}%" aria-label="Scheibe ${disk}"></span>`).join('')}</span><span class="tower__label"><b>0${index + 1}</b>${names[index]}</span></button>`).join('')
      state.arrival = null
      board.querySelectorAll('[data-tower]').forEach((tower) => tower.addEventListener('click', () => handleTowerClick(Number(tower.dataset.tower))))
   }
   const render = () => {
      const progress = Math.min(state.step / totalMoves() * 100, 100)
      const move = currentMove()
      moveCount.textContent = state.step
      optimalCount.textContent = totalMoves()
      discOutput.textContent = state.n
      progressBar.style.width = `${progress}%`
      progressGlow.style.width = `${progress}%`
      renderBoard()
      renderHistory()
      if (!state.manual && state.step === totalMoves()) setStatus('Aufbau vollendet', 'Alle Scheiben sind am Ziel. Eine saubere Lösung.')
      else if (state.manual) setStatus(state.selected === null ? 'Manueller Modus' : 'Quelle gewählt', state.selected === null ? 'Wähle einen Turm, dann das Ziel.' : 'Wähle jetzt den Zielstab.')
      else if (move) setStatus(state.playing ? 'Algorithmus arbeitet' : 'Pausiert', `${formatMove(move)} · Schritt ${state.step}`)
      else if (state.playing) setStatus('Algorithmus arbeitet', 'Der erste Zug wird vorbereitet …')
      else setStatus('Bereit zum Start')
   }
   const advance = (direction = 1) => {
      if (state.manual) return
      const nextStep = Math.max(0, Math.min(totalMoves(), state.step + direction))
      if (nextStep === state.step) return
      const transition = direction > 0
         ? moveBetween(currentSolution()[state.step], currentSolution()[nextStep])
         : moveBetween(currentSolution()[nextStep], currentSolution()[state.step])
      state.step = nextStep
      state.arrival = { to: transition.to }
      render()
      if (state.step === totalMoves()) setPlaying(false)
      else if (state.playing) scheduleNext()
   }
   const scheduleNext = () => {
      clearTimeout(state.timer)
      if (!state.playing) return
      state.timer = setTimeout(() => advance(1), 920 / state.speed)
   }
   const reset = () => {
      setPlaying(false)
      state.step = 0
      state.selected = null
      state.manual = false
      state.model = towers(state.n)
      state.manualMoves = []
      state.arrival = null
      manualButton.classList.remove('button--manual-active')
      manualButton.innerHTML = '<span class="manual-icon">⌘</span> Manuell spielen'
      render()
   }
   const validManualMove = (from, to) => {
      const model = currentModel()
      const source = model[keys[from]]
      const target = model[keys[to]]
      return source.length && (!target.length || source.at(-1) < target.at(-1))
   }
   const handleTowerClick = (index) => {
      if (!state.manual || state.playing) return
      if (state.selected === null) {
         if (currentModel()[keys[index]].length) state.selected = index
      } else if (state.selected === index) state.selected = null
      else if (validManualMove(state.selected, index)) {
         const model = currentModel()
         const next = model[keys[state.selected]].at(-1)
         const customState = { ...model, [keys[state.selected]]: model[keys[state.selected]].slice(0, -1), [keys[index]]: [...model[keys[index]], next] }
         state.model = customState
         state.step += 1
         state.manualMoves.push({ from: state.selected, to: index })
         state.arrival = { to: index }
         state.selected = null
      } else state.selected = index
      render()
   }
   playButton.addEventListener('click', () => {
      if (state.manual) return
      if (state.step === totalMoves()) state.step = 0
      setPlaying(!state.playing)
      render()
   })
   stepBack.addEventListener('click', () => { setPlaying(false); advance(-1) })
   stepForward.addEventListener('click', () => { setPlaying(false); advance(1) })
   resetButton.addEventListener('click', reset)
   manualButton.addEventListener('click', () => {
      setPlaying(false)
      if (!state.manual) {
         state.model = currentModel()
         state.manualMoves = []
         state.manual = true
      } else {
         state.manual = false
         state.step = 0
         state.model = towers(state.n)
         state.manualMoves = []
      }
      state.selected = null
      manualButton.classList.toggle('button--manual-active', state.manual)
      manualButton.innerHTML = state.manual ? '<span class="manual-icon">×</span> Auto-Modus' : '<span class="manual-icon">⌘</span> Manuell spielen'
      render()
   })
   discRange.addEventListener('input', () => {
      state.n = Number(discRange.value)
      reset()
   })
   speedRange.addEventListener('input', () => {
      state.speed = Number(speedRange.value)
      speedOutput.textContent = `${state.speed}×`
      if (state.playing) scheduleNext()
   })
   render()
})()
