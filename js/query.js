const query = {}

query.parseQueryString = function () {
  // http://paulgueller.com/2011/04/26/parse-the-querystring-with-jquery/
  const nvpair = {}
  const qs = window.location.hash.replace('#', '')
  if (qs.length == 0) {
    return {}
  }
  const pairs = qs.split('&')
  $.each(pairs, function (i, v) {
    const pair = v.split('=')
    nvpair[pair[0]] = decodeURIComponent(pair[1].replace(/\+/g, ' '))
  })
  return nvpair
}

query.qsInitial = function () {
  util.log('qsInitial(): Called.')
  const qs = query.parseQueryString()

  if (qs.parameters === '' && window.HAPIUI.options.allowAllParameters === true) {
    // If parameters= is in URL, internally use *all*.
    qs.parameters = '*all*'
  }

  // Allow for server, dataset, and return to be given in URL and return=....
  if (qs.server && qs.dataset && qs.return !== undefined) {
    if (qs.parameters === undefined) {
      qs.parameters = '*all*'
    }
  }
  return qs
}

query.chooseDefault = function (qsValue, values) {
  if (qsValue) {
    let found = false
    for (let i = 0; i < values.length; i++) {
      if (qsValue === values[i].value) {
        values[i].selected = true
        found = true
        break
      }
    }
    if (found === true) {
      return values
    }
  }
  // Select first value by default.
  values[0].selected = true
  return values
}
