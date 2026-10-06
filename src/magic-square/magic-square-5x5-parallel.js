// Counts 5x5 magic squares on all cores. The search space splits into independent
// (center, top left) subspaces; worker threads pull them from a shared queue one by one,
// so uneven subspace sizes still keep every core busy. Small top left values have by far
// the most squares and are handed out first.
const { Worker, parentPort, workerData } = require('node:worker_threads')
const os = require('node:os')
const { magic5x5Solver } = require('./magic-square-5x5')

if (workerData && workerData.magic5x5Worker) {
  parentPort.on('message', (task) => parentPort.postMessage({ ...task, count: magic5x5Solver(task) }))
}

const oneTo25 = Array.from({ length: 25 }, (_, index) => index + 1)

/**
 * @param {object} [options]
 * @param {number[]} [options.centers] center values to count (default 1..25)
 * @param {number[]} [options.topLefts] top left values to count (default 1..25)
 * @param {number} [options.threads] number of worker threads (default: all cores)
 * @param {boolean} [options.symmetry] count center c only once if 26-c is requested too (default true)
 * @param {(result: {center: number, topLeft: number, count: number}) => void} [options.onResult]
 *   called per counted subspace; mirrored centers are not reported here
 * @returns {Promise<{total: number, byCenter: Record<number, number>}>}
 */
const magic5x5CountParallel = ({ centers = oneTo25, topLefts = oneTo25, threads = os.availableParallelism(), symmetry = true, onResult } = {}) => {
  // Replacing every number x by 26-x maps magic squares with center c one-to-one onto those
  // with center 26-c (and classes onto classes), so both centers have the same count.
  // Only valid when all top left values are counted: the map turns the smallest corner into the largest.
  const mirrorAll = symmetry && topLefts.length === 25
  const mirrored = mirrorAll ? centers.filter((center) => center > 13 && centers.includes(26 - center)) : []
  const counted = centers.filter((center) => !mirrored.includes(center))

  const tasks = []
  for (const topLeft of [...topLefts].sort((left, right) => left - right))
    for (const center of counted) if (center !== topLeft) tasks.push({ center, topLeft })

  const byCenter = Object.fromEntries(centers.map((center) => [center, 0]))
  let next = 0
  let open = tasks.length
  const finish = () => {
    for (const center of mirrored) byCenter[center] = byCenter[26 - center]
    return { total: Object.values(byCenter).reduce((sum, count) => sum + count, 0), byCenter }
  }

  return new Promise((resolve, reject) => {
    if (open === 0) return resolve(finish())
    const workers = Array.from({ length: Math.min(threads, tasks.length) }, () => {
      const worker = new Worker(__filename, { workerData: { magic5x5Worker: true } })
      worker.on('error', (error) => {
        workers.forEach((other) => other.terminate())
        reject(error)
      })
      worker.on('message', (result) => {
        byCenter[result.center] += result.count
        if (onResult) onResult(result)
        if (next < tasks.length) worker.postMessage(tasks[next++])
        if (--open === 0) {
          workers.forEach((other) => other.terminate())
          resolve(finish())
        }
      })
      return worker
    })
    workers.forEach((worker) => worker.postMessage(tasks[next++]))
  })
}

module.exports = { magic5x5CountParallel }
