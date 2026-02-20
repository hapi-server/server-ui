function timer (id, timingOptions) {
  // This code does not catch error that will occur if two timers are created
  // with the same id. This should occur with a probability of less than
  // 1 in 40^8 ~= 6e12 due to the use of util.uniqueId(8), which adds a random
  // string of length 8 to the requested id. ("should" assuming perfectly random
  // number generator. "Less than 1 in 40^8" because equal to requires two timers
  // to be active with same id.)

  function timerSettings (given) {
    return {
      element: given.element || '#timing',
      updateInterval: given.updateInterval || window.HAPIUI.options.timingUpdateInterval
    }
  }

  if (timer[id] && timingOptions === 'stop') {
    // Timer was started. Stop timer and return.
    timer[id].stopped = true
    const timingElement = timer[id].timingOptions.element
    util.log(`timer(): Stopping timer with interval id ${timer[id].interval} for element '${timingElement}' with id = '${id}'.`)
    clearInterval(timer[id].interval)
    if (timingElement) {
      util.log("timer(): Writing final time in element '" + timingElement + "' with id = '" + id + "'.")
      const elapsed = ((new Date()).getTime() - timer[id].timeStart)
      $(timingElement).html(`(${elapsed} ms)`)
    }
    util.log('timer(): Deleting timer with id = ' + id + "'.")
    delete timer[id]
    return
  }

  if (timer[id]) {
    util.log("timer(): Timer with id = '" + id + "' already exists and is not stopped. Returning null.")
    return null
  }

  timingOptions = timerSettings(timingOptions)

  // id is random string of length 8 followed by a comma followed by the given id.
  // This is to avoid collisions with other timers which use a URL as an id.
  // id = util.uniqueId(8) + "," + id;

  timer[id] = {
    timeStart: (new Date()).getTime(),
    timingOptions,
    stopped: false
  }

  const timingElement = timingOptions.element
  const updateInterval = timingOptions.updateInterval

  timer[id].interval =
          setInterval(
            () => {
              let elapsed = ((new Date()).getTime() - timer[id].timeStart)
              // Round.
              elapsed = (updateInterval / 10) * parseInt(elapsed / (updateInterval / 10))
              if (timingElement) {
                util.log(`timer(): Timer id: ${timer[id].interval}. Updating timing element '${timingElement} with id = '${id}'.`)
                $(timingElement).html(`(${elapsed} ms)`)
              }
            },
            updateInterval)
  util.log(`timer(): Activated timer. Timer id: ${timer[id].interval}. Element: ${timingElement} with id = '${id}'.`)
  return id
}
