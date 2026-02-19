if (typeof module !== 'undefined') {
  module.exports = parseAllTxt
}

function parseAllTxt (alltxt) {
  if (!alltxt) {
    return null
  }

  const info = {}
  // Split and remove empty lines
  const allarr = alltxt.trim().split('\n').filter(x => x !== '')

  for (let i = 0; i < allarr.length; i++) {
    if (allarr[i].substring(0, 1) === '#') {
      continue
    }

    if (allarr[i].split(',').length == 1) {
      // Only URL given. Will occur with SERVER_LIST_HASH given.
      const id = allarr[i].trim().split(',')[0].trim()
      info[id] = {}
      info[id].url = id
      info[id].name = id
      info[id].contactName = ''
      info[id].contactEmail = ''
      info[id].contactName = ''
    } else {
      const line = allarr[i].trim().split(',')
      for (const col in line) {
        line[col] = line[col].trim()
      }
      const id = line[2]
      if (!id) {
        continue
      }
      info[id] = {}
      info[id].url = line[0]
      info[id].name = line[1] || id
      info[id].contactName = line[3] || ''
      info[id].contactEmail = line[4] || ''
    }
  }
  if (Object.keys(info).length === 0) {
    return null
  }
  return info
}
