const time = {
  stop,
  startOK,
  stopOK,
  checkStartStop,
  trimTime,
  validTimeString,
  ISODuration2Words
}

if (typeof module !== 'undefined') {
  module.exports = time
}

if (typeof dayjs === 'undefined') {
  dayjs = require('dayjs')
  const duration = require('dayjs/plugin/duration')
  dayjs.extend(duration)
}

function trimTime (dateTime) {
  if (!dateTime) return dateTime
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
  // TODO: Use is.HAPITime in verifier-nodejs
  return true
}

function startOK (meta, requestedStart) {
  const _start = trimTime(meta.startDate)
  const _stop = trimTime(meta.stopDate)
  const _requestedStart = trimTime(requestedStart)
  const a = dayjs(_requestedStart).valueOf() >= dayjs(_start).valueOf()
  const b = dayjs(_requestedStart).valueOf() < dayjs(_stop).valueOf()
  return a && b
}

function stopOK (meta, requestedStop) {
  const _start = trimTime(meta.startDate)
  const _stop = trimTime(meta.stopDate)
  const _requestedStop = trimTime(requestedStop)
  const a = dayjs(_requestedStop).valueOf() <= dayjs(_stop).valueOf()
  const b = dayjs(_requestedStop).valueOf() > dayjs(_start).valueOf()
  return a && b
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

  let stopDate
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

function checkStartStop (which, start, stop) {
  if (start && stop) {
    util.log('time.checkStartStop(): starttime = ' + start)
    util.log('time.checkStartStop(): stoptime = ' + stop)
    const t = dayjs(trimTime(start)) < dayjs(trimTime(stop))
    util.log('time.checkStartStop(): requested start < requested stop ? ' + t)
    const msgo = 'time.checkStartStop(): ' + which + ' changed; '
    if (t === false) {
      util.log(msgo + 'requested start ≥ requested stop. Setting colors to red.')
      return false
    } else {
      util.log(msgo + 'requested start < requested stop. Setting colors to black.')
      return true
    }
  }
  return true
}

function ISODuration2Words (cadence) {
  return cadence
    .replace('PT', '')
    .replace('D', ' days, ')
    .replace('H', ' hours, ')
    .replace('M', ' minutes, ')
    .replace('S', ' seconds')
    .replace(/, $/, '')
    .replace('1 days', '1 day')
    .replace('1 hours', '1 hour')
    .replace('1 minutes', '1 minute')
    .replace('1 seconds', '1 second')
}

function doy2ymd (dateTime) {
  if (/^[0-9]{4}-[0-9]{3}/.test(dateTime)) {
    dateTime = dateTime.split('-')
    const startUnixMs = new Date(dateTime[0], 0, 1).getTime()
    let doy = dateTime[1].split('T')[0]
    let Z = ''
    if (doy.endsWith('Z')) {
      doy = doy.replace('Z', '')
      Z = 'Z'
    }
    let time = dateTime[1].split('T')[1]
    if (time) {
      time = 'T' + time
    } else {
      time = ''
    }
    const msOfYear = 86400 * 1000 * parseInt(doy - 1)
    const dateTimeMod = new Date(startUnixMs + msOfYear).toISOString().slice(0, 10) + time + Z
    return dateTimeMod
  }
  return dateTime
}
