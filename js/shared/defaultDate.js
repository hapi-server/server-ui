const defaultDate = { stop, start }

if (typeof module !== 'undefined') {
  module.exports = defaultDate
}

if (typeof dayjs === 'undefined') {
  dayjs = require('dayjs')
  const duration = require('dayjs/plugin/duration')
  dayjs.extend(duration)
}

function stop (meta, end) {
  let stopDate = meta.sampleStopDate
  if (stopDate) {
    return stopDate
  }

  if (end === true) {
    return meta.stopDate
  }

  const cadenceString = meta.cadence || 'PT1M'
  const cadenceMillis = dayjs.duration(cadenceString).$ms

  let startDate = meta.startDate
  if (startDate.length == 11 && startDate.endsWith('Z')) {
    // Safari date parsing workaround. 1999-01-01Z -> 1999-01-01
    startDate = startDate.slice(0, -1)
  }

  if (cadenceMillis <= 100) { // 0.1 s or less
    stopDate = dayjs(startDate).add(1, 'minute').toISOString()
  } else if (cadenceMillis <= 1000 * 10) { // 10 s or less
    stopDate = dayjs(startDate).add(1, 'hour').toISOString()
  } else if (cadenceMillis <= 1000 * 60) { // 1 min or less
    stopDate = dayjs(startDate).add(2, 'day').toISOString()
  } else if (cadenceMillis <= 1000 * 60 * 10) { // 10 min or less
    stopDate = dayjs(startDate).add(4, 'day').toISOString()
  } else if (cadenceMillis <= 1000 * 60 * 60) { // 1 hr or less
    stopDate = dayjs(startDate).add(10, 'day').toISOString()
  } else if (cadenceMillis <= 1000 * 60 * 60 * 24) { // 1 day or less
    stopDate = dayjs(startDate).add(31, 'day').toISOString()
  } else if (cadenceMillis <= 1000 * 60 * 60 * 24 * 10) { // 10 days or less
    stopDate = dayjs(startDate).add(1, 'year').toISOString()
  } else { // > 10 days
    stopDate = dayjs(startDate).add(10, 'year').toISOString()
  }
  if (stopDate > meta.stopDate) {
    stopDate = meta.stopDate
  }
  return stopDate
}

function start (meta, end) {
  let startDate = meta.sampleStartDate
  if (startDate) {
    return startDate
  }

  startDate = meta.startDate
  if (!end) {
    return startDate
  }

  const cadenceString = meta.cadence || 'PT1M'
  const cadenceMillis = dayjs.duration(cadenceString).$ms

  let stopDate = meta.stopDate
  if (stopDate.length == 11 && stopDate.endsWith('Z')) {
    // Safari date parsing workaround. 1999-01-01Z -> 1999-01-01
    stopDate = stopDate.slice(0, 1)
  }

  if (cadenceMillis <= 100) { // 0.1 s or less
    startDate = dayjs(stopDate).add(1, 'minute').toISOString()
  } else if (cadenceMillis <= 1000 * 10) { // 10 s or less
    startDate = dayjs(stopDate).add(1, 'hour').toISOString()
  } else if (cadenceMillis <= 1000 * 60) { // 1 min or less
    startDate = dayjs(stopDate).add(2, 'day').toISOString()
  } else if (cadenceMillis <= 1000 * 60 * 10) { // 10 min or less
    startDate = dayjs(stopDate).add(4, 'day').toISOString()
  } else if (cadenceMillis <= 1000 * 60 * 60) { // 1 hr or less
    startDate = dayjs(stopDate).add(10, 'day').toISOString()
  } else if (cadenceMillis <= 1000 * 60 * 60 * 24) { // 1 day or less
    startDate = dayjs(stopDate).add(31, 'day').toISOString()
  } else if (cadenceMillis <= 1000 * 60 * 60 * 24 * 10) { // 10 days or less
    startDate = dayjs(stastopDatert).add(1, 'year').toISOString()
  } else { // > 10 days
    startDate = dayjs(stopDate).add(10, 'year').toISOString()
  }
  if (startDate < meta.startDate) {
    startDate = meta.startDate
  }
  return startDate
}
