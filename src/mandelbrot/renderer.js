// WebGL2-Darstellung: Perturbationsrechnung in RG32F-Ziele (Vorschau mit reduzierter Auflösung, Vollbild in Streifen)
// und Einfärben auf den Bildschirm. Nach einem Kontextverlust (Mobilgeräte: App-Wechsel, Speicherdruck) wird alles neu
// angelegt; onRestore muss danach Orbit, Palette und Zielgröße neu setzen.
const createMandelbrotRenderer = (canvas, shaders, onRestore) => {
  const gl = canvas.getContext('webgl2', { antialias: false })
  if (!gl || !gl.getExtension('EXT_color_buffer_float')) throw new Error('WebGL2 mit EXT_color_buffer_float wird benötigt.')
  const ORBIT_WIDTH = 4096 // Zeilenbreite der Orbit-Textur, passend zu Z() im Rechen-Shader

  const program = (fs) => {
    const p = gl.createProgram()
    ;[
      [gl.VERTEX_SHADER, shaders.vertex],
      [gl.FRAGMENT_SHADER, fs]
    ].forEach(([type, src]) => {
      const s = gl.createShader(type)
      gl.shaderSource(s, src)
      gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s))
      gl.attachShader(p, s)
    })
    gl.linkProgram(p)
    const U = { p }
    for (let i = 0; i < gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i++) {
      const n = gl.getActiveUniform(p, i).name
      U[n.slice(2)] = gl.getUniformLocation(p, n)
    }
    return U
  }
  const texture = (unit, filter = gl.NEAREST, wrap = gl.CLAMP_TO_EDGE) => {
    const t = gl.createTexture()
    gl.activeTexture(gl.TEXTURE0 + unit)
    gl.bindTexture(gl.TEXTURE_2D, t)
    ;[
      [gl.TEXTURE_MIN_FILTER, filter],
      [gl.TEXTURE_MAG_FILTER, filter],
      [gl.TEXTURE_WRAP_S, wrap],
      [gl.TEXTURE_WRAP_T, wrap]
    ].forEach(([k, v]) => gl.texParameteri(gl.TEXTURE_2D, k, v))
    return t
  }
  const target = (unit, filter) => ({ unit, t: texture(unit, filter), f: gl.createFramebuffer() })
  const alloc = (tg, w, h, color = false) => {
    gl.activeTexture(gl.TEXTURE0 + tg.unit)
    color
      ? gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
      : gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG32F, w, h, 0, gl.RG, gl.FLOAT, null)
    gl.bindFramebuffer(gl.FRAMEBUFFER, tg.f)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tg.t, 0)
  }

  // Textureinheiten: 0 Orbit, 1 Vollbild, 2 Vorschau, 3 Palette, 4 und 5 abwechselnd aktuelles und voriges Bild, 6 BLA-Tabelle
  // Zwei Varianten des Rechen-Shaders, mit und ohne BLA in Phase 2; calc ist die von setView gewählte
  let calcs, calc, show, full, prev, hist
  const init = () => {
    gl.getExtension('EXT_color_buffer_float')
    calcs = [shaders.calc, shaders.calc.replace('#version 300 es', '#version 300 es\n#define BLA2')].map(program)
    ;[calc, show] = [calcs[0], program(shaders.show)]
    texture(0)
    texture(3, gl.LINEAR, gl.REPEAT)
    texture(6)
    calcs.forEach((c) => {
      gl.useProgram(c.p)
      gl.uniform1i(c.bla, 6)
    })
    ;[full, prev] = [target(1), target(2)]
    hist = [target(4, gl.LINEAR), target(5, gl.LINEAR)]
    gl.useProgram(show.p)
    ;[
      ['full', 1],
      ['prev', 2],
      ['pal', 3]
    ].forEach(([k, u]) => gl.uniform1i(show[k], u))
  }
  init()
  canvas.addEventListener('webglcontextlost', (e) => e.preventDefault())
  canvas.addEventListener('webglcontextrestored', () => {
    init()
    onRestore?.()
  })

  const resize = (w, h) => {
    alloc(full, w, h)
    alloc(prev, w, h)
    hist.forEach((tg) => alloc(tg, w, h, true))
  }
  const setPalette = (rgba) => {
    gl.activeTexture(gl.TEXTURE3)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, rgba.length / 4, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, rgba)
  }
  // Werte zeilenweise in eine RGBA32F-Textur der Breite ORBIT_WIDTH legen (texels Einträge zu je 4 Werten)
  const upload = (unit, data, texels) => {
    const h = Math.max(1, Math.ceil(texels / ORBIT_WIDTH)),
      rows = new Float32Array(ORBIT_WIDTH * h * 4)
    rows.set(data)
    gl.activeTexture(gl.TEXTURE0 + unit)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, ORBIT_WIDTH, h, 0, gl.RGBA, gl.FLOAT, rows)
  }
  const setOrbit = (data, len) => upload(0, data, len)
  // Tabelle aus MandelbrotBla.buildBla, null schaltet BLA ab; je Knoten zwei Texel, Stufen 1 bis 23
  const setBla = (bla) => {
    const n = bla ? Math.min(bla.levels, 23) : 0,
      off = new Int32Array(24),
      cnt = new Int32Array(24)
    for (let k = 1; k <= n; k++) [off[k], cnt[k]] = [bla.offset[k], bla.count[k]]
    upload(6, bla ? bla.data : [], bla ? 2 * bla.nodes : 0)
    calcs.forEach((c) => {
      gl.useProgram(c.p)
      gl.uniform1i(c.blaLevels, n)
      gl.uniform1f(c.blaMaxR, n ? bla.maxR : -1e30)
      gl.uniform1iv(c['blaOff[0]'], off)
      gl.uniform1iv(c['blaCnt[0]'], cnt)
    })
  }
  // off: Bildmitte minus Referenzpunkt als (Mantisse.xy, Exponent)
  // bla2 wählt die Shader-Variante mit BLA auch in Phase 2
  const setView = ({ ls, rot, off, refLen, maxIter, bla2 = false }) => {
    calc = calcs[bla2 ? 1 : 0]
    gl.useProgram(calc.p)
    gl.uniform2f(calc.scale, 2 ** (ls - Math.floor(ls)), Math.floor(ls))
    gl.uniform2f(calc.rot, Math.cos(rot), Math.sin(rot))
    gl.uniform3f(calc.off, ...off)
    gl.uniform1i(calc.refLen, refLen)
    gl.uniform1i(calc.maxIter, maxIter)
  }
  // Ohne y0/y1 das ganze Ziel, sonst nur die Zeilen y0 bis y1
  const compute = (name, w, h, y0, y1) => {
    gl.useProgram(calc.p)
    gl.bindFramebuffer(gl.FRAMEBUFFER, (name === 'full' ? full : prev).f)
    gl.viewport(0, 0, w, h)
    gl.uniform2f(calc.res, w, h)
    y1 === undefined ? gl.disable(gl.SCISSOR_TEST) : (gl.enable(gl.SCISSOR_TEST), gl.scissor(0, y0, w, y1 - y0))
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }
  // band: fertig gerechnete Zeilen im Vollbild, ps: Maßstab der Vorschau, inside: RGB in [0,1], light im Bogenmaß,
  // blend/hrot/hoff: Einmischen des vorigen Bildes (siehe MandelbrotView.reprojection)
  const display = (w, h, u) => {
    const [cur, last] = hist.reverse()
    gl.bindFramebuffer(gl.FRAMEBUFFER, cur.f)
    gl.disable(gl.SCISSOR_TEST)
    gl.viewport(0, 0, w, h)
    gl.useProgram(show.p)
    gl.uniform2f(show.band, ...u.band)
    gl.uniform1f(show.ps, u.ps)
    gl.uniform2i(show.psize, Math.ceil(w * u.ps), Math.ceil(h * u.ps))
    gl.uniform2i(show.fsize, w, h)
    gl.uniform1i(show.map, u.map)
    gl.uniform1i(show.angle, u.angle)
    ;['dens', 'phase', 'relief', 'height', 'light', 'gloss'].forEach((k) => gl.uniform1f(show[k], u[k]))
    gl.uniform3f(show.inside, ...u.inside)
    gl.uniform1i(show.hist, last.unit)
    gl.uniform1f(show.blend, u.blend)
    gl.uniform2f(show.hrot, ...u.hrot)
    gl.uniform2f(show.hoff, ...u.hoff)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, cur.f)
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null)
    gl.blitFramebuffer(0, 0, w, h, 0, 0, w, h, gl.COLOR_BUFFER_BIT, gl.NEAREST)
  }

  return { isLost: () => gl.isContextLost(), resize, setPalette, setOrbit, setBla, setView, compute, display }
}
