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
  }
}
