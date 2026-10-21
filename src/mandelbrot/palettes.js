// Farbpaletten als Farbstopps und ihre Umrechnung in eine RGBA-Verlaufstextur.
;((root, factory) => {
  const api = factory()
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else root.MandelbrotPalettes = api
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  const PALETTES = {
    Klassisch: ['#000764', '#206bcb', '#edffff', '#ffaa00', '#000200'],
    Feuer: ['#000000', '#5a0000', '#c81e00', '#ff8c00', '#ffe066', '#ffffff', '#ff8c00', '#5a0000'],
    Ozean: ['#001219', '#005f73', '#0a9396', '#94d2bd', '#e9d8a6', '#0a9396'],
    Neon: ['#0b0033', '#ff00a0', '#00ffe1', '#fffb00'],
    Gold: ['#1a0f00', '#6b4300', '#d4a017', '#fff3c4', '#d4a017', '#6b4300'],
    Eis: ['#02010a', '#1b2a6b', '#4e8fd6', '#bfe6ff', '#ffffff', '#4e8fd6'],
    Wald: ['#0b1d0e', '#2d6a4f', '#95d5b2', '#f1faee', '#52b788', '#1b4332'],
    Abendrot: ['#120136', '#5b1865', '#b83b5e', '#f08a5d', '#f9ed69', '#b83b5e'],
    Regenbogen: ['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff'],
    Pastell: ['#fbc4ab', '#f8edeb', '#cdb4db', '#a2d2ff', '#bde0fe', '#ffc8dd'],
    Graustufen: ['#000000', '#ffffff'],
    Zufall: null
  }

  const randomPal = (random = Math.random) =>
    Array.from({ length: 6 }, (_, i) => `hsl(${(random() * 360) | 0},${(60 + random() * 40) | 0}%,${[12, 55, 88, 45, 70, 30][i]}%)`)

  // Zyklischer Verlauf durch die RGB-Stopps: der letzte Stopp geht wieder in den ersten über
  const paletteRamp = (stops, size = 1024) => {
    const n = stops.length,
      data = new Uint8Array(size * 4)
    for (let i = 0; i < size; i++) {
      const x = (i / size) * n,
        k = Math.floor(x),
        f = x - k,
        a = stops[k],
        b = stops[(k + 1) % n]
      for (let j = 0; j < 3; j++) data[4 * i + j] = a[j] + (b[j] - a[j]) * f
      data[4 * i + 3] = 255
    }
    return data
  }

  return { PALETTES, randomPal, paletteRamp }
})
