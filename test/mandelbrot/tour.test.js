const { viewOf, decimalOf, planFlight, tourFrames } = require('../../src/mandelbrot/tour')
const { fromDec } = require('../../src/mandelbrot/fixed-point')
const { fitLs } = require('../../src/mandelbrot/view')
const PLACES = require('../../src/mandelbrot/places')

const homeLs = fitLs(1080 / 1920)
const home = viewOf({ re: '-0.75', im: '0', z: homeLs })

describe('planFlight', () => {
  const plan = planFlight(home, PLACES[2], { dur: 12000, homeLs })

  test('beginnt an der Startansicht', () => {
    const v = plan.at(0)
    expect(v.ls).toBe(home.ls)
    expect(v.cx).toBe(home.cx)
    expect(v.cy).toBe(home.cy)
  })

  test('endet exakt am Ziel mit dessen Drehung und Iterationsfaktor', () => {
    const v = plan.at(plan.duration)
    expect(v.done).toBe(true)
    expect(v.ls).toBe(PLACES[2].z)
    expect(v.cx).toBe(fromDec(PLACES[2].re, v.P))
    expect(v.cy).toBe(fromDec(PLACES[2].im, v.P))
    expect(v.rot).toBeCloseTo(PLACES[2].r, 12)
    expect(v.m).toBe(plan.target.m)
    expect(plan.at(plan.duration - 1).done).toBe(false)
  })

  test('durchläuft herauszoomen, schwenken und hineinzoomen in dieser Reihenfolge', () => {
    const phases = Array.from({ length: 101 }, (_, i) => plan.at((i / 100) * plan.duration).phase)
    expect([...new Set(phases)]).toEqual(['pan', 'in'])
    const deep = viewOf(PLACES[0])
    const back = planFlight({ ...deep, m: 3 }, PLACES[1], { dur: 12000, homeLs })
    expect([...new Set(Array.from({ length: 101 }, (_, i) => back.at((i / 100) * back.duration).phase))]).toEqual(['out', 'pan', 'in'])
    expect(back.at(0).m).toBe(3)
  })

  test('ohne Ausrichtung endet der Flug ungedreht', () => {
    expect(planFlight(home, PLACES[2], { dur: 12000, homeLs, align: false }).at(Infinity).rot).toBe(0)
  })
})

describe('tourFrames', () => {
  test('liefert Flug- und Verweilbilder in der passenden Anzahl', () => {
    const fps = 10,
      places = PLACES.slice(0, 2)
    const frames = tourFrames(places, { start: home, fps, fly: 3000, hold: 1000, homeLs })
    const holds = frames.filter((f) => f.phase === 'hold')
    expect(holds).toHaveLength(20)
    expect(holds[0].place).toBe(places[0].name)
    expect(holds.at(-1).ls).toBe(places[1].z)
    // der zweite Flug beginnt dort, wo der erste geendet hat
    const second = frames.find((f) => f.place === places[1].name)
    expect(second.cx).toBe(holds[0].cx)
  })
})

describe('decimalOf', () => {
  test('überträgt den Mittelpunkt ohne Genauigkeitsverlust', () => {
    const v = viewOf(PLACES[8])
    const d = decimalOf(v)
    expect(fromDec(d.re, v.P)).toBe(v.cx)
    expect(fromDec(d.im, v.P)).toBe(v.cy)
  })
})
