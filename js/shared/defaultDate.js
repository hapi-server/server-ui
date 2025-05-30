const defaultDate = { stop, startOK, stopOK, validTimeString }

if (typeof module !== 'undefined') {
  module.exports = defaultDate
}

if (typeof dayjs === 'undefined') {
  dayjs = require('dayjs')
  const duration = require('dayjs/plugin/duration')
  dayjs.extend(duration)
}

function normalizeTime (dateTime) {
  //alert(`'${dateTime}'`)
  dateTime = dateTime.trim()
  if (dateTime.endsWith('Z')) {
    return dateTime.slice(0, -1)
  }
  return dateTime
}

function validTimeString (dateTime) {
  if (typeof dateTime !== 'string') {
    return false
  }
  const tmp = dateTime.replace('Z', '')
  return dayjs(util.doy2ymd(tmp)).isValid()
}

function startOK (meta, requestedStart) {
  if (!validTimeString(requestedStart)) {
    return false
  }
  const _stop = normalizeTime(meta.stopDate)
  const _start = normalizeTime(meta.startDate)
  const _requestedStart = normalizeTime(requestedStart)
  const a = dayjs(_requestedStart).valueOf() >= dayjs(_start).valueOf()
  const b = dayjs(_requestedStart).valueOf() <= dayjs(_stop).valueOf()
  if (a && b) {
    return requestedStart
  }
  return false
}

function stopOK (meta, requestedStop) {
  if (!validTimeString(requestedStop)) {
    return false
  }
  const _stop = normalizeTime(meta.stopDate)
  const _start = normalizeTime(meta.startDate)
  const _requestedStop = normalizeTime(requestedStop)
  const a = dayjs(_requestedStop).valueOf() >= dayjs(_start).valueOf()
  const b = dayjs(_requestedStop).valueOf() <= dayjs(_stop).valueOf()
  if (a && b) {
    return requestedStop
  }
  return false
}

function stop (meta) {

  if (meta.sampleStopDate) {
    return meta.sampleStopDate
  }

  const cadenceString = meta.cadence || 'PT1M'
  const cadenceMillis = dayjs.duration(cadenceString).$ms
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
