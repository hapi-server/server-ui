const util = {

  log: function (msg) {
    if (!$('#showconsolemessages').is(':checked')) return
    console.log(msg)
  },

  plural: function (arr) {
    return arr.length > 1 ? 's' : ''
  },

  hapiVersion: function () {
    const version = datasets.json.HAPI || null
    return version.split('.')
  },

  hapi2to3: function (url, version) {
    if (!version) {
      version = datasets.json.HAPI || '2.0'
    }
    if (version.substr(0, 1) === '3') {
      url = url
        .replace('id=', 'dataset=')
        .replace('time.min=', 'start=')
        .replace('time.max=', 'stop=')
    }
    return url
  },

  bytesWithSIUnits: function (bytes) {
    // https://stackoverflow.com/a/28120564
    if (bytes === 0) { return '0 B' }
    const e = Math.floor(Math.log(bytes) / Math.log(1000))
    let precision = 0
    if (bytes >= 1000 && bytes < 1000000) {
      precision = 2
    }
    const number = (bytes / Math.pow(1000, e)).toFixed(precision)
    return `${number} ${' KMGTP'.charAt(e) + 'B'}`
  },

  uniqueId: function (len) {
    // Based on sempostma post at https://gist.github.com/6174/6062387
    // See also https://stackoverflow.com/a/26410127
    if (!len) len = 8
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'
    const nchars = chars.length
    let id = ''
    for (id = ''; id.length < len;) {
      id += chars[(Math.random() * nchars) | 0]
    }
    return id
  },

  uniqueElements: function (arr) {
    // Unique elements in array without sorting.
    // If sorting is desired, use [...new Set(possibles.filter(Boolean))]

    const seen = new Set()
    return arr.filter(item => {
      if (!seen.has(item)) {
        seen.add(item)
        return true
      }
      return false
    })
  },

  validHTMLID: function (s) {
    // Convert id to a hash if it contains disallowed characters for an HTML id.
    // Based on following link, "TestData2.0" should not need hashing, I find problems if "." is in id.
    // https://stackoverflow.com/questions/4247840/what-are-legal-characters-for-an-html-element-id
    if (s.match(new RegExp('[^(a-z)(A-Z)(0-9)_-]'))) {
      // https://stackoverflow.com/a/15710692
      return s.split('').reduce(function (a, b) {
        a = ((a << 5) - a) + b.charCodeAt(0)
        return a & a
      }, 0)
    }
    return s
  },

  postHashChange: function (hash) {
    util.log('util.postHashChange(): Posting /hashchange?hash=' + hash)
    const url = `hashchange?hash=${encodeURIComponent(hash)}`
    fetch(url).then((resp) => resp.text()).then(() => {}).catch(() => {})
  },

  postError: function (hash, fileName, lineNumber, message) {
    let url = `error?hash=${encodeURIComponent(hash)}`
    url += `&fileName=${encodeURIComponent(fileName.replace(/^#/, ''))}`
    url += `&lineNumber=${encodeURIComponent(lineNumber)}`
    url += `&message=${encodeURIComponent(message)}`
    fetch(url).then((resp) => resp.text()).then(() => {}).catch((e) => {})
  },

  catchAppErrors: function () {
    $('#appError').empty().hide()
    // Catch and report uncaught errors.
    window.onerror = function (message, fileName, lineNumber) {
      //console.trace()
      fileName = fileName.replace(window.location, '')
      let msg = ''
      // msg = "Error. Please post URL to the ";
      // msg += '<a href="https://github.com/hapi-server/server-ui/issues">Issue Tracker</a>.';
      const errorFile = window.location.origin + window.location.pathname
      fileName = fileName.replace(errorFile, '')
      msg += `Error Message: <code>${message}</code>.`
      msg += `<br>Error Location: <code>${fileName}#L${lineNumber}</code>`
      $('#appError').html(msg).show()
      util.postError(window.location.hash, fileName, lineNumber, message)
    }
  },

  timeDropdown: function (fn, cb) {
    let nameUpperCase
    let name = fn.name
    if (name === 'starttime') {
      name = 'start'
      nameUpperCase = 'Start'
    }
    if (name === 'stoptime') {
      name = 'stop'
      nameUpperCase = 'Stop'
    }

    util.log(`${name}time(): Called.`)

    fn.id = name
    fn.label = nameUpperCase
    fn.clearFollowing = false

    const storage = `server-ui-last-${name}s`

    const info = datasets.info[hash.selected('dataset')].info
    const allowed = `start ≥ ${info.startDate} and stop < ${info.stopDate}`

    fn.onselect = function () {
      util.log(`${name}time.onselect(): Called.`)
      util.log(`${name}time.onselect(): Reading server-ui-last-${name}s in localStorage.`)
      let lasts = localStorage.getItem(storage)
      lasts = JSON.parse(lasts)
      util.log(`${name}time.onselect(): ${storage} = ${JSON.stringify(lasts)}.`)
      if (!lasts) {
        util.log(`${name}time.onselect(): No ${storage} in localStorage. Setting = [].`)
        lasts = []
      }

      if (time.validTimeString(name, hash.selected(name)) === true) {
        if (hash.selected(name) in lasts) {
          util.log(`${name}time.onselect(): ${hash.selected(name)} is already in ${storage}. Not appending.`)
        } else {
          util.log(`${name}time.onselect(): Appending ${hash.selected(name)} to ${name}.lasts = ${JSON.stringify(name.lasts)}.`)
          lasts.push(hash.selected(name))
          util.log(`${name}time.onselect(): Writing ${storage} in localStorage.`)
          localStorage.setItem(storage, JSON.stringify(lasts))
        }
      } else {
        util.log(`${name}time(): ${hash.selected(name)} is not a valid time. Not appending to ${storage}.`)
      }
      checks()
    }

    function checks () {
      function setError (errorMessage, which) {
        if (!which) {
          which = ['start', 'stop']
        } else {
          which = [which]
        }
        for (const id of which) {
          $('#' + id + '-list')
            .css('color', 'red')
            .attr('data-tooltip-error', errorMessage)
        }
      }

      function unSetError (which) {
        if (!which) {
          which = ['start', 'stop']
        } else {
          which = [which]
        }
        for (const id of which) {
          $('#' + id + '-list')
            .css('color', 'black')
            .removeAttr('data-tooltip-error')
        }
      }

      unSetError()
      const valid = time.validTimeString(hash.selected(name))
      if (valid) {
        let msg = `${name}time(): ${hash.selected(name)} is a valid date/time string`
        util.log(`${msg}. Unsetting any errors on selected ${name}`)
        unSetError(name)
        const startStopOK = time.checkStartStop(name, hash.selected('start'), hash.selected('stop'))
        if (startStopOK === true) {
          msg = `${msg} and selected start < selected stop`
          util.log(`${msg}. Unsetting any errors on selected start and selected stop.`)
          unSetError()
          if (time[name + 'OK'](info, hash.selected(name))) {
            msg = `${msg} and selected ${name} is valid for this dataset`
            util.log(`${msg}. Unsetting any errors on selected ${name}.`)
            unSetError(name)
            if (hash.selected('format')) {
              util.log(`${name}time(): start/stop date/times passed validation. Updating #output.`)
              output() // Update output
            }
          } else {
            const emsg = `${hash.selected(name)} is not valid for this dataset. Allowed: ${allowed}`
            util.log(`${name}time(): ${emsg}. Setting error.`)
            setError(emsg, name)
            return false
          }
        } else {
          const emsg = 'Selected start ≥ selected stop'
          util.log(`${name}time(): ${emsg}. Setting error.`)
          setError(emsg)
          return false
        }
      } else {
        const emsg = `${hash.selected(name)} is not a valid date/time string.`
        util.log(`${name}time(): ${emsg}. Setting error.`)
        setError(emsg, name)
        return false
      }
      return true
    }

    util.log(`${name}time(): Reading ${storage} in localStorage.`)
    let lasts = localStorage.getItem(storage)
    lasts = JSON.parse(lasts)
    util.log(`${name}time(): Found ${storage} = ${lasts}.`)

    let defaultStop = null
    if (name === 'stop') {
      // Want second choice to be the default stop data, which is
      // computed if sampleStopDate is not given.
      defaultStop = time.stop(info)
    }
    const possibles = [
      window.HAPIUI.qsInitial[name] || '',
      defaultStop || '',
      info[`sample${nameUpperCase}Date`] || '',
      info[`${name}Date`] || '',
      ...lasts || ''
    ]

    util.log(`${name}time(): possible times to put in drop-down = ${JSON.stringify(possibles)}`)
    let uniques = util.uniqueElements(possibles).filter(item => item !== '')
    util.log(`${name}time(): uniques = ${JSON.stringify(uniques)}`)
    const list = []
    const uniques_a = []
    for (let i = 0; i < uniques.length; i++) {
      if (time[name + "OK"](info, uniques[i])) {
        // Only add to list if acceptable.
        uniques_a.push(uniques[i])
        util.log(`${name}time(): adding '${uniques[i]}' to list of times`)
        list.push({ label: uniques[i], value: uniques[i] })
      } else {
        util.log(`${name}time(): not adding '${uniques[i]}' to list of times`)
      }
    }

    util.log(`${name}time(): uniques_a = ${JSON.stringify(uniques_a)}`)
    if (window.HAPIUI.qsInitial[name] && !uniques_a.includes(window.HAPIUI.qsInitial[name])) {
      alert(`${name} = '${window.HAPIUI.qsInitial[name]}' is not a valid date/time string or not in range ${allowed}. Using default.`)
    }

    if (list.length === 0) {
      console.log(list)
      console.error(`${name}time(): No valid start time list could be generated. Likely there is an error in info.startDate and/or info.stopDate.`)
      if (name === 'start') {
        list.push({ label: info.startDate, value: info.startDate })
      } else {
        list.push({ label: defaultStop, value: defaultStop })
      }
    }

    util.log(`${name}time(): list = ${JSON.stringify(list)}`)
    util.log(`${name}time(): Setting selected time to ${list[0].value}`)
    list[0].selected = true
    delete window.HAPIUI.qsInitial[name]
    cb(list)
  }

}
