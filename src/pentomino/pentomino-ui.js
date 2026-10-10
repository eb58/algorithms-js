(() => {
   const board = document.querySelector('#board')
   const legend = document.querySelector('#legend')
   const statusLabel = document.querySelector('#status-label')
   const solveHint = document.querySelector('#solve-hint')
   const solveTime = document.querySelector('#solve-time')
   const statsList = document.querySelector('#stats-list')
   const shuffleButton = document.querySelector('#shuffle-button')
   const sizeButtons = [...document.querySelectorAll('.button--size')]
   const PIECE_NAMES = { f: 'F', i: 'I', l: 'L', n: 'N', p: 'P', t: 'T', u: 'U', v: 'V', w: 'W', x: 'X', y: 'Y', z: 'Z' }
   const state = { dimr: 6, dimc: 10 }

   const shuffle = (arr) => {
      const a = [...arr]
      for (let i = a.length - 1; i > 0; i--) {
         const j = Math.floor(Math.random() * (i + 1))
         ;[a[i], a[j]] = [a[j], a[i]]
      }
      return a
   }

   // re-orders the DLX rows before solving so repeated calls surface a different first solution
   const randomDlxSolve = (problem) => {
      const order = shuffle(problem.map((_, index) => index))
      const shuffled = order.map((index) => problem[index])
      const solutions = dlx_solve(shuffled, 1)
      return solutions.map((solution) => solution.map((row) => order[row]))
   }

   const renderLegend = () => {
      legend.innerHTML = Object.keys(PIECE_NAMES).map((symbol) =>
         `<span><i class="legend-dot" style="--dot-color:var(--p-${symbol})"></i>${PIECE_NAMES[symbol]}</span>`
      ).join('')
   }

   const renderBoard = (grid) => {
      board.style.setProperty('--cols', state.dimc)
      board.style.setProperty('--rows', state.dimr)
      board.innerHTML = grid.flat().map((symbol, index) =>
         `<div class="cell" style="--cell-color:var(--p-${symbol});--delay:${index * 5}ms" aria-label="Feld ${PIECE_NAMES[symbol] ?? symbol}">${PIECE_NAMES[symbol] ?? symbol}</div>`
      ).join('')
   }

   const renderStats = ({ rows, columns, ms }) => {
      statsList.innerHTML = [
         ['Format', `${state.dimr} × ${state.dimc}`],
         ['Zeilen in der Matrix', rows],
         ['Spalten in der Matrix', columns],
         ['Lösung gefunden in', `${ms} ms`]
      ].map(([label, value]) => `<div class="history-item"><span>${label}</span><strong>${value}</strong></div>`).join('')
   }

   const setStatus = (label, hint) => {
      statusLabel.textContent = label
      if (hint) solveHint.textContent = hint
   }

   const solveAndRender = () => {
      setStatus('Löse …')
      let rows = 0
      let columns = 0
      const countingDlxSolve = (problem) => {
         rows = problem.length
         columns = problem[0]?.length ?? 0
         return randomDlxSolve(problem)
      }
      const t0 = performance.now()
      const [grid] = pentomino().solve(state.dimr, state.dimc, countingDlxSolve)
      const ms = Math.round((performance.now() - t0) * 10) / 10
      renderBoard(grid)
      renderStats({ rows, columns, ms })
      solveTime.textContent = ms
      setStatus('Gelöst', 'Jede Farbe ist eine der zwölf Pentomino-Formen. Würfle für eine andere Lösung.')
   }

   sizeButtons.forEach((button) => button.addEventListener('click', () => {
      sizeButtons.forEach((other) => other.classList.toggle('button--size-active', other === button))
      state.dimr = Number(button.dataset.dimr)
      state.dimc = Number(button.dataset.dimc)
      solveAndRender()
   }))
   shuffleButton.addEventListener('click', solveAndRender)

   renderLegend()
   solveAndRender()
})()
