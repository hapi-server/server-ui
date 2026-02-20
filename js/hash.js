const hash = {

  selected: function(name) {
    // Determine selected value for a dropdown from hash.
    // When dropdown value is selected, URL should be up-to-date.
    // Use value in URL.
    if (location.hash !== '') {
      const qs = query.parseQueryString()
      if (qs[name]) {
        return qs[name]
      }
    }
    return ''
  },

  update: function (qs) {
    const hashCurrent = decodeURIComponent($.param(qs))
    util.log(`hash.update(): Modifying hash from\n  ${window.location.hash}\nto\n  ${hashCurrent}.`)

    // This will prevent hashchange event callback from calling hash._handleHashChange().
    // We need to do it this way to force hash._handleHashChange() to be called immediately.
    $(window).hashchange.byurledit = false
    window.location.hash = hashCurrent // This will trigger the hashchange event.
    util.postHashChange(window.location.hash)
    hash._handleHashChange()
  },

  bind: function () {
    // Update dropdowns when URL is changed by editing URL.

    util.log('hash.bind(): Binding hashchange.')
    $(window).hashchange.byurledit = true

    $(window).unbind('hashchange')
    $(window).bind('hashchange', function (event) {
      // Monitor hash for changes via text entry in address bar.
      if ($(window).hashchange.byurledit == true) {
        util.log('hash.bind.hashchange(): byurledit = true. Calling hash._handleHashChange.')
        hash._handleHashChange(event)
      } else {
        util.log('hash.bind.hashchange(): byurledit = false. Ignoring hashchange event.')
        $(window).hashchange.byurledit = true
      }
    })
  },

  _handleHashChange: function (event) {
    let msg = `window.location.hash = '${window.location.hash}'.`
    util.log(`hash._handleHashChange.hashchange(): \n  ${msg}`)
    msg = `     window.lastHash = '${window.lastHash}'.`
    util.log(`hash._handleHashChange.hashchange(): \n  ${msg}`)

    if (window.location.hash === window.lastHash) {
      // hashchange seems to be triggered when clicking an element with an onclick tag.
      util.log('hash._handleHashChange.hashchange(): Hash did not change.')
      return
    } else {
      window.lastHash = window.location.hash
    }

    if (event && window.location.hash.startsWith('#?')) {
      // This is needed for testing.
      event.preventDefault()
      window.location.hash = window.lastHash
      return
      // This will occur if a link such as "?server=..." is clicked.
      // Such links are used in testing. The hash is modified to be valid
      // and we assume* the API query has an equivalent fragment query.
      // *TODO: This won't always be the case.
      util.log("hash._handleHashChange.hashchange(): Click resulted in hash to start with '#?':")
      util.log('hash._handleHashChange.hashchange():   ' + window.location.hash)
      util.log("hash._handleHashChange.hashchange(): Assuming server query has equivalent UI query and setting above hash after removing '?'.")
      event.preventDefault()
      location.hash = window.location.hash.replace('#?', '#')
      return
    }

    if ($(window).hashchange.byurledit) {
      util.log('hash._handleHashChange.hashchange(): byurledit = true. Calling main().')
      main()
      return
    }

    // Need to figure out what parameter was changed and then
    // remove all parameters after that. Otherwise user could
    // change the server and the parameter list will not be
    // updated.
    const qs = query.parseQueryString()
    const inputs = {}
    $('#dropdowns input').each((idx, el) => {
      if (el.value !== el.label) { inputs[el.id] = el.value }
    })

    util.log('hash._handleHashChange.hashchange(): Query string:')
    util.log(qs)
    util.log('hash._handleHashChange.hashchange(): Dropdown:')
    util.log(inputs)

    const changed = {}
    util.log('hash._handleHashChange.hashchange(): Comparing existing dropdown values to query string values.')
    for (const id in inputs) {
      util.log(' Value in query string = ' + qs[id] + '. Value in dropdown = ' + inputs[id])
      if (qs[id] !== inputs[id]) {
        // changed[id] = true;
      }
    }

    util.log('hash._handleHashChange.hashchange(): Comparing existing query string values to dropdown values.')
    for (const id in qs) {
      util.log('  Value in query string = ' + qs[id] + '. Value in dropdown = ' + inputs[id])
      if (qs[id] !== inputs[id]) {
        changed[id] = true
      }
    }

    const nChanged = Object.keys(changed).length

    if (nChanged > 1 || 'server' in changed) {
      if (nChanged > 1) {
        util.log(`hash._handleHashChange.hashchange(): More than one query string differs from dropdown. Resetting app. byurledit = ${$(window).hashchange.byurledit}`)
      } else {
        util.log('hash._handleHashChange.hashchange(): Server changed. Resetting app.')
      }
      main()
      return
    } else if (nChanged === 1) {
      util.log(`hash._handleHashChange.hashchange(): One query string differs from dropdown. byurledit = ${$(window).hashchange.byurledit}`)
    } else {
      util.log(`hash._handleHashChange.hashchange(): No query string differs from dropdown. byurledit = ${$(window).hashchange.byurledit}`)
    }

    if (nChanged > 0 && $(window).hashchange.byurledit) {
      util.log('hash._handleHashChange.hashchange(): Hash change made by manual edit of one non-server parameter.')
      util.log('hash._handleHashChange.hashchange(): Current hash: ' + location.hash)

      for (const id in changed) {
        util.log('hash._handleHashChange.hashchange(): Setting ' + id + ' dropdown to ' + qs[id] + ' and triggering change.')
        $('#' + id).val(qs[id])
          .data('autocomplete')
          ._trigger('select', null, { item: qs[id] })
      }
    }
    $(window).hashchange.byurledit = true
  }
}
