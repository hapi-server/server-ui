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
  //console.log(cadenceString)
  //console.log(cadenceMillis)
  let startDate = meta.startDate
  if (startDate.length === 11 && startDate.endsWith('Z')) {
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

function normalizeTime (dateTime) {
  dateTime = dateTime.trim()
  if (dateTime.endsWith('Z')) {
    return dateTime.slice(0, -1)
  }
  return dateTime
}

function start (meta, requestedStart) {
  if (!requestedStart) {
    if (meta.sampleStartDate) {
      return meta.sampleStartDate
    } else {
      return meta.startDate
    }
  }

  const _start = normalizeTime(meta.startDate)
  const _requestedStart = normalizeTime(requestedStart)

  let _stop
  if (meta.sampleStopDate) {
    _stop = normalizeTime(meta.sampleStopDate)
  } else {
    _stop = normalizeTime(meta.stopDate)
  }

  const a = dayjs(_requestedStart).valueOf() >= dayjs(_start).valueOf()
  const b = dayjs(_requestedStart).valueOf() <= dayjs(_stop).valueOf()
  if (a && b) {
    return requestedStart
  }
  return meta.startDate
}
