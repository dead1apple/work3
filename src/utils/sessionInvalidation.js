let sessionInvalidationHandler = null

export const setSessionInvalidationHandler = (handler) => {
  sessionInvalidationHandler = typeof handler === 'function' ? handler : null

  return () => {
    if (sessionInvalidationHandler === handler) sessionInvalidationHandler = null
  }
}

export const notifySessionInvalidated = () => {
  sessionInvalidationHandler?.()
}
