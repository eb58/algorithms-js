// Enumerates all 5x5 magic squares (numbers 1..25, magic sum 65) in normal form:
// the top left corner is the smallest corner and top right < bottom left. Every square
// has exactly 8 distinct rotations/reflections, so this counts each class exactly once
// (275,305,224 squares in total).
//
// Layout: cell r*5+c, variables a0..a24, center a12 = c.
// A 5x5 magic square has 14 degrees of freedom. The cells are chosen in an order where
// every new line immediately forces one more cell, so each choice is checked right away:
//   center, main diagonal (a0, a6, a18 -> a24), anti-diagonal (a4, a8, a16 -> a20),
//   row 1 (a5, a7 -> a9), col 0 (a15 -> a10), row 3 + col 4 (a17 -> a19, a14),
//   row 2 (a11 -> a13), col 1 (a1 -> a21), col 3 + row 0 + col 2 (a3 -> a23, a2, a22).
// Row 2 and col 2 are never checked in full: with all 25 numbers distinct the total is 325,
// so the last row/column sum follows from the other four.
//
// Free numbers are a 25-bit mask (number x = bit x-1). Instead of trying every free value and
// then testing the forced partner, each loop only visits candidates whose partners are free:
// {x : s-x free} is the bit-reversed mask shifted by s-26, {x : x+d free} a plain shift.

const ALL = (1 << 25) - 1
const REV13 = new Int32Array(1 << 13)
for (let x = 0; x < 1 << 13; x++) for (let k = 0; k < 13; k++) if (x & (1 << k)) REV13[x] |= 1 << (12 - k)

// number v -> number 26-v
const reverse = (mask) => (REV13[mask & 0x1fff] << 12) | (REV13[mask >>> 13] >>> 1)
// {x : s - x in mask}
const minus = (mask, s) => {
  const d = s - 26
  if (d >= 0) return d < 25 ? (reverse(mask) << d) & ALL : 0
  return d > -25 ? reverse(mask) >>> -d : 0
}
// {x : x + d in mask}
const plus = (mask, d) => (d >= 0 ? (d < 25 ? mask >>> d : 0) : d > -25 ? (mask << -d) & ALL : 0)
const bit = (x) => ((x - 1) >>> 0 < 25 ? 1 << (x - 1) : 0)
const lowest = (mask) => 32 - Math.clz32(mask & -mask)

/**
 * @param {object} [options]
 * @param {number} [options.center] only squares with this center value
 * @param {number} [options.topLeft] only squares with this top left value
 * @param {(square: number[]) => void} [options.visit] called with every square (a fresh array)
 * @returns {number} number of squares found
 */
const magic5x5Solver = ({ center, topLeft, visit } = {}) => {
  let count = 0
  for (let c = center || 1; c <= (center || 25); c++) {
    const A0 = ALL ^ bit(c)
    for (let r0 = topLeft ? A0 & bit(topLeft) : A0; r0; r0 &= r0 - 1) {
      const a0 = lowest(r0)
      const A1 = A0 ^ bit(a0)
      const above0 = A1 & ~((1 << a0) - 1) // a0 is the smallest corner
      // main diagonal
      for (let r6 = A1; r6; r6 &= r6 - 1) {
        const a6 = lowest(r6)
        const A2 = A1 ^ bit(a6)
        const s24 = 65 - a0 - a6 - c
        for (let r18 = A2 & minus(A2 & above0, s24); r18; r18 &= r18 - 1) {
          const a18 = lowest(r18)
          const a24 = s24 - a18
          if (a24 === a18) continue
          const A4 = A2 ^ bit(a18) ^ bit(a24)
          // anti-diagonal, a0 < a4 < a20
          for (let r4 = A4 & above0; r4; r4 &= r4 - 1) {
            const a4 = lowest(r4)
            const A5 = A4 ^ bit(a4)
            const above4 = A5 & ~((1 << a4) - 1)
            for (let r8 = A5; r8; r8 &= r8 - 1) {
              const a8 = lowest(r8)
              const A6 = A5 ^ bit(a8)
              const s20 = 65 - a4 - a8 - c
              for (let r16 = A6 & minus(A6 & above4, s20); r16; r16 &= r16 - 1) {
                const a16 = lowest(r16)
                const a20 = s20 - a16
                if (a20 === a16) continue
                const A8 = A6 ^ bit(a16) ^ bit(a20)
                // row 1
                for (let r5 = A8; r5; r5 &= r5 - 1) {
                  const a5 = lowest(r5)
                  const A9 = A8 ^ bit(a5)
                  const s9 = 65 - a5 - a6 - a8
                  for (let r7 = A9 & minus(A9, s9); r7; r7 &= r7 - 1) {
                    const a7 = lowest(r7)
                    const a9 = s9 - a7
                    if (a9 === a7) continue
                    const A11 = A9 ^ bit(a7) ^ bit(a9)
                    // col 0
                    const s10 = 65 - a0 - a5 - a20
                    for (let r15 = A11 & minus(A11, s10); r15; r15 &= r15 - 1) {
                      const a15 = lowest(r15)
                      const a10 = s10 - a15
                      if (a10 === a15) continue
                      const A13 = A11 ^ bit(a15) ^ bit(a10)
                      // row 3 forces a19 = s19 - a17, col 4 then a14 = a17 + d14
                      const s19 = 65 - a15 - a16 - a18
                      const d14 = 65 - a4 - a9 - a24 - s19
                      for (let r17 = A13 & minus(A13, s19) & plus(A13, d14); r17; r17 &= r17 - 1) {
                        const a17 = lowest(r17)
                        const a19 = s19 - a17
                        const a14 = a17 + d14
                        const b17 = bit(a17), b19 = bit(a19), b14 = bit(a14)
                        if (b17 === b19 || b17 === b14 || b19 === b14) continue
                        const A16 = A13 ^ b17 ^ b19 ^ b14
                        // row 2
                        const s13 = 65 - a10 - c - a14
                        for (let r11 = A16 & minus(A16, s13); r11; r11 &= r11 - 1) {
                          const a11 = lowest(r11)
                          const a13 = s13 - a11
                          if (a13 === a11) continue
                          const A18 = A16 ^ bit(a11) ^ bit(a13)
                          // col 1
                          const s21 = 65 - a6 - a11 - a16
                          for (let r1 = A18 & minus(A18, s21); r1; r1 &= r1 - 1) {
                            const a1 = lowest(r1)
                            const a21 = s21 - a1
                            if (a21 === a1) continue
                            const A20 = A18 ^ bit(a1) ^ bit(a21)
                            // col 3 forces a23 = s23 - a3, row 0 a2 = s2 - a3, col 2 a22 = a3 + d22
                            const s23 = 65 - a8 - a13 - a18
                            const s2 = 65 - a0 - a1 - a4
                            const d22 = 65 - s2 - a7 - c - a17
                            for (let r3 = A20 & minus(A20, s23) & minus(A20, s2) & plus(A20, d22); r3; r3 &= r3 - 1) {
                              const a3 = lowest(r3)
                              const a23 = s23 - a3, a2 = s2 - a3, a22 = a3 + d22
                              // the last four numbers, all distinct
                              if ((bit(a3) | bit(a23) | bit(a2) | bit(a22)) !== A20) continue
                              count++
                              if (visit) visit([a0, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, c, a13, a14, a15, a16, a17, a18, a19, a20, a21, a22, a23, a24])
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  return count
}

module.exports = { magic5x5Solver }
