export function createLatestRequestGuard() {
  let current = 0

  const start = (snapshot) => {
    const sequence = ++current
    const isCurrent = (latestSnapshot = snapshot) => sequence === current && latestSnapshot === snapshot
    const runIfCurrent = (latestSnapshot, effect) => {
      if (!isCurrent(latestSnapshot)) return false
      effect()
      return true
    }

    return {
      sequence,
      snapshot,
      isCurrent,
      commit: runIfCurrent,
      finish: runIfCurrent,
    }
  }

  return {
    start,
    get current() {
      return current
    },
  }
}
