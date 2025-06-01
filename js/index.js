function main () {
  window.HAPIUI.qsInitial = query.qsInitial()
  util.log(`main(): Initial query string: ${window.HAPIUI.qsInitial}`)

  // Unbind all event listeners.
  $('*').unbind()

  // Set window.onerror event.
  util.catchAppErrors()

  // Create <details> element for UI test links.
  tests()

  // Bind events to changes in options.
  options()

  // Bind events to changes in the hash part of the URL
  hash.hashchange()

  // Remove hash when reset clicked
  $('#clear').show().on('click', function () {
    window.location = window.location.pathname
  })

  // Set up main dropdowns. When server dropdown is set, the default text
  // is -Servers- and the function servers() is called when there is
  // interaction.
  const dfuncs = [servers, datasets, parameters, starttime, stoptime, returntype, format, style]
  dropdowns(dfuncs, '#dropdowns')
}

// Determine selected value for a dropdown from hash.
function selected (name) {
  // When dropdown value is selected, URL should be up-to-date.
  // Use value in URL.
  if (location.hash !== '') {
    const qs = query.parseQueryString()
    if (qs[name]) {
      return qs[name]
    }
  }
  return ''
}

function about (url, HAPI) {
  if (about[url] === undefined) {
    about[url] = false // Flag to indicate if /about has been requested for this URL.
  }
  $('#appWarning').empty().hide()
  $('#aboutRequestURL').empty().hide()
  $('#aboutRequestTiming').empty().hide()

  if (parseFloat(HAPI) < 3.0) {
    return
  }

  // Called after /catalog request if /catalog response has HAPI >= 3.0.
  const defaultOptions = {
    dataType: 'json',
    requestURLElement: '#aboutRequestURL',
    timeout: window.HAPIUI.options.metadataTimeout,
    timer: {
      element: '#aboutRequestTiming'
    }
  }
  url = url + '/about'
  const getOptions = { url, ...defaultOptions }
  get(getOptions, (err, json) => {
    if (!err) {
      process(json)
      return
    }
    util.log('about(): Problem with /about response from ' + url)
    if (!about[url]) {
      //$('#appWarning').html(err).show()
      //setTimeout(() => $('#appWarning').empty().hide(), 2000)
    } else {
      util.log('about(): Not displaying warning again. /about already requested for this URL.')
    }
  })

  function process (json) {
    html.showJSONOnClick('about', url, '#serverinfo')
    if (typeof json.contact === 'string') {
      // Default is to show what is in all.txt. This updates based on info
      // in /about response.
      const newContact = 'Server contact: ' + html.mailtoLink(null, json.contact, url)
      $('#servercontact').html(newContact)
    }
    if (typeof json.citation === 'string') {
      if (json.citation.trim().startsWith('http')) {
        const citation = html.aLink(json.citation, 'Server citation')
        $('#serverinfo > ul').append('<li>' + citation + '</li>')
      } else {
        $('#serverinfo > ul').append(`<li>Server Citation: ${json.citation}"</li>`)
      }
    }
  }
}

// Servers dropdown
function servers (cb) {
  util.log('servers(): Called.')

  const defaultOptions = {
    requestURLElement: '#allRequestURL',
    timeout: window.HAPIUI.options.allTimeout,
    timer: {
      element: '#allRequestTiming'
    }
  }

  const serverList = window.HAPIUI.options.serverList
  const serverListFallback = window.HAPIUI.options.serverListFallback
  $('#allRequestError').empty().hide()
  $('#appWarning').empty().hide()

  const getOptions = { url: serverList, ...defaultOptions }
  get(getOptions, function (err, text) {
    if (!err) {
      process(text, serverList)
      return
    }
    util.log(serverList + ' not found.\n' + 'Trying fall-back of ' + serverListFallback)
    const warning = serverList + ' not found. Will try ' + serverListFallback
    $('#appWarning').html(warning).show()
    setTimeout(() => $('#appWarning').empty().hide(), 2000)
    get({ url: serverListFallback, ...defaultOptions }, function (err, alltxt) {
      if (!err) {
        process(alltxt, serverList)
        return
      }
      const msg = `Unable to load a server list. Tried ${serverList} and ${serverListFallback}`
      $('#allRequestError').html(msg).show()
    })
  })

  servers.label = 'Servers'
  servers.id = 'server'
  servers.clearFollowing = true

  servers.onselect = function () {
    util.log('servers.onselect(): Called.')

    const selectedServer = selected('server')

    let metaURL = window.HAPIUI.options.availabilities
    if (metaURL !== false) {
      metaURL = `${metaURL}/${selectedServer}/svg/${selectedServer}.html`
      get({ url: metaURL, tryProxy: false }, function (err, res) {
        if (err) {
          util.log(`servers.onselect(): Could not fetch ${metaURL}. Not showing availability details.`)
          $('#time-range-details').hide()
          return
        }
        $('#time-range-details').show()
        $('#time-range-details  summary .selected-server').html(selected('server') + '&nbsp;')
        $('#time-range-details summary a').attr('href', metaURL)
        $('#iframe').attr('src', metaURL)
        $('#iframe').css('height', '50vh')
      })
    }

    if (!servers.info[selectedServer]) {
      // This will occur if HAPI URL is entered into server dropdown.
      servers.info[selectedServer] = { url: selectedServer }
    }

    let url = servers.info[selectedServer].url
    if (!url.startsWith('http')) {
      url = window.location.origin + window.location.pathname + url
    }

    $('#output').hide()
    $('#output json').empty()
    $('#output script').empty()
    $('#output data').empty()
    $('#output image').empty()
    $('#overviewinfo').hide()
    $('#serverinfo').nextAll().hide()
    $('#serverinfo > ul').empty()

    const contactEmail = servers.info[selected('server')].contactEmail || ''
    const contactName = servers.info[selected('server')].contactName || ''
    const li1 = '<li>Server URL: <code>' + html.aLink(url) + '</code></li>'
    $('#serverinfo > ul').append(li1)
    if (contactEmail && contactName) {
      const mailtoLink = html.mailtoLink(contactName, contactEmail, url)
      const li2 = `<li id="servercontact">Server Contact: ${mailtoLink}</li>`
      $('#serverinfo > ul').append(li2)
    }

    $('#serverinfo').show()

    showSingleServerExamples()
  }

  function showSingleServerExamples () {
    $('#all-example-details-body > div').hide()
    $('#all-example-details summary .selected-server').html(selected('server') + '&nbsp;')
    $(`#${util.validHTMLID(selected('server'))}-examples b`).hide()
    $(`#${util.validHTMLID(selected('server'))}-examples`).show()
  }

  function process (alltxt, serverListURL) {
    const SERVER_URL_HASH = serverIsURL()
    if (SERVER_URL_HASH !== '') {
      alltxt = alltxt + '\n' + `${SERVER_URL_HASH},${SERVER_URL_HASH},${SERVER_URL_HASH}`
    }

    if (!alltxt) {
      $('#allRequestError').html(`Problem with the server list response from ${html.aLink(serverListURL)}.`).show()
      return
    }
    if (alltxt.trim().length === 0) {
      $('#allRequestError').html(`Server list from ${html.aLink(serverListURL)} is empty.`).show()
      return
    }
    const info = parseAllTxt(alltxt)
    if (!info) {
      $('#allRequestError').html(`Server list from ${html.aLink(serverListURL)} is empty.`).show()
      return
    }

    const selectedServer = selected('server')
    // let qs = query.parseQueryString();
    // window["HAPIUI"]["qsInitial"]['server'] === id

    servers.ids = []
    let found = false
    let list = []
    for (const id of Object.keys(info)) {
      servers.ids.push(id)
      if (id === selectedServer) {
        found = true
      }

      if (window.HAPIUI.qsInitial.server === id) {
        util.log('servers.process(): Server value for ' + id + ' found in hash. Setting as selected in dropdown.')
      }
      list.push({
        label: info[id].name,
        value: id,
        selected: window.HAPIUI.qsInitial.server === id
      })
    }

    if (selectedServer && found === false) {
      // Will occur if user typed a server name in dropdown and it is not in list
      serverNotFound(selectedServer)
      return
    }

    if ($('#showexamplequeries').prop('checked')) {
      $('#all-example-details-body').empty()
      examples(info, function (html) {
        if (!html) return
        $('#all-example-details-body').append(html).show()
        if (selected('server')) {
          showSingleServerExamples()
        }
      })
    }

    // Move TestData servers to end of list and possibly remove based on checkbox.
    list = modifyServerList(list, found);
    $('#nServers').text(list.length);
    $('#serversInfo').show()
    util.log("servers.process(): Server list:");
    util.log(list);

    if (list.length === 0) {
      $('#allRequestError').html(`Problem parsing server list from ${html.aLink(serverListURL)}.`).show()
      return
    }
    servers.info = info
    delete window.HAPIUI.qsInitial.server
    cb(list)
  }

  function modifyServerList (list, found) {
    const listCopy = list.slice() // Shallow copy.
    const listLength = list.length
    for (let i = 0; i < listLength; i++) {
      if (list[i].label.startsWith('TestData') ||
          list[i].label.startsWith('URLWatcher')) {
        const tmp = list[i]
        delete list[i]
        if ($('#showtestdatalink').prop('checked') || found == true) {
          // Append to end
          list.push(tmp)
        }
      }
    }
    list = list.filter(function (element) {
      // Remove undefined elements due to deletion above.
      return element !== undefined
    })
    if (list.length === 0) {
      let msg = 'All server names start with {TestData,URLWatcher} and '
      msg += "'show TestData servers' option unchecked. "
      msg += 'Ignoring option so at least one server in server dropdown list.'
      util.log(msg)
      list = listCopy
    }
    return list
  }

  function reset (msg) {
    console.error(msg)
    alert(msg)
    window.location.hash = ''
    main()
  }

  function serverNotFound (selectedServer) {
    const msg = `Server '${selectedServer}' is not available from this interface or URL is invalid.`
    reset(msg)
  }

  function serverIsURL () {
    const qs = query.parseQueryString()
    if (!qs.server) {
      return ''
    }
    if (qs.server.startsWith('http://') || qs.server.startsWith('https://')) {
      return qs.server.split(',').join('\n')
    } else {
      return ''
    }
  }
}

// Datasets dropdown
function datasets (cb) {
  util.log('datasets(): Called.')

  datasets.id = 'dataset'
  datasets.label = 'Datasets'
  datasets.clearFollowing = true
  datasets.onselect = function () {
    util.log('datasets.onselect(): Called.')

    util.log('datasets.onselect(): Emptying #datasetinfo <ul>.')
    $('#datasetinfo ul').empty()

    util.log('datasets.onselect(): Hiding output.')
    $('#output').hide()
  }

  const url = servers.info[selected('server')].url + '/catalog'
  const getOptions = {
    url,
    dataType: 'json',
    requestURLElement: '#catalogRequestURL',
    timeout: window.HAPIUI.options.metadataTimeout,
    timer: {
      element: '#catalogRequestTiming'
    }
  }

  util.log('datasets.onselect(): Hiding info blocks after #datasetinfo.')
  $('#datasetinfo').nextAll().hide()
  util.log('datasets.onselect(): Emptying #datasetinfo <ul>.')
  $('#datasetinfo ul').empty()

  $('#datasetsRequestError').empty().hide()
  get(getOptions, function (err, res) {
    if (!err) {
      process(res)
      return
    }
    $('#datasetsRequestError').html(err).show()
  })

  function process (res) {
    about(servers.info[selected('server')].url, res.HAPI)

    $('#server-example-details').attr('open', false)

    datasets.json = res
    res = res.catalog

    // Show number of datasets
    const nDatasets = res.length + ' dataset' + util.plural(res)
    $('#serverinfo ul').prepend('<li>' + nDatasets + '</li>')

    const getOptions = {
      url: 'https://hapi-server.org/urlwatcher/log/tests.json',
      dataType: 'json',
      timeout: window.HAPIUI.options.metadataTimeout,
      // "requestURLElement": "#urlwatcherRequestURL",
      timer: {
        // "element": "#urlwatcherRequestTiming"
      }
    }

    // $("#urlwatcherRequestError").empty().hide();
    get(getOptions, function (err, json) {
      if (err) {
        util.log(`datasets.process(): Failed to read ${getOptions.url}.`)
        //$("#urlwatcherRequestError").html(err).show()
      }
      if (json && json[selected('server')]) {
        const watcherLink = window.HAPIUI.options.urlwatcher + '#category=' + selected('server')
        const serverTests = '<li id="statuslink" style="display:none">' +
                        html.aLink(watcherLink, 'View server response tests') +
                        '</li>'
        $('#serverinfo ul').append(serverTests)
        if ($('#showstatuslink').prop('checked')) {
          $('#statuslink').show()
        }
      }
    })

    const info = {}
    const list = []
    for (let i = 0; i < res.length; i++) {
      info[res[i].id] = {}
      for (const key of Object.keys(res[i])) {
        info[res[i].id][key] = res[i][key]
      }
      if (window.HAPIUI.qsInitial.dataset === res[i].id) {
        util.log(`datasets(): dataset value for ${res[i].id} found in initial hash. Will select it.`)
      }
      list.push({
        label: res[i].id || res[i].title,
        value: res[i].id,
        selected: window.HAPIUI.qsInitial.dataset === res[i].id
      })
    }
    datasets.info = info
    delete window.HAPIUI.qsInitial.dataset
    cb(list)
  }
}

// Parameters dropdown
function parameters (cb) {
  util.log('parameters(): Called.')

  let url = servers.info[selected('server')].url + '/info?id=' + selected('dataset')
  if (selected('server') !== 'CSA') {
    url = util.hapi2to3(url)
  }

  parameters.id = 'parameters'
  parameters.label = 'Parameters'
  parameters.allowEmptyValue = true
  parameters.selectMultiple = true
  parameters.clearFollowing = false

  parameters.clearfollowing = () => {
    if (selected('format')) {
      util.log("parameters.clearfollowing(): 'format' is selected. Updating #output.")
      output()
    }
    return false
  }

  parameters.onselect = function () {
    util.log('parameters.onselect(): Called.')

    if (selected('format')) {
      util.log("parameters.onselect(): 'format' is selected. Updating #output.")
      output()
    } else {
      util.log("parameters.onselect(): 'format' is not selected. Hiding #output.")
      $('#output').hide()
    }

    util.log('parameters.onselect(): Hiding info blocks after #parameterinfo.')
    $('#parameterinfo').nextAll().hide()
    util.log('parameters.onselect(): Emptying <ul> in #parameterinfo.')
    $('#parameterinfo ul').empty()

    if (window.HAPIUI.options.allowAllParameters === true) {
      if (selected('parameters') === '') {
        // Loop through all parameters and create bulleted list.
        // return;
      }
    }

    util.log(`parameters.onselect(): selected('parameters') = '${selected('parameters')}'.`)
    const meta = parameters.info[selected('parameters')]
    let url = servers.info[selected('server')].url +
            '/info?id=' + selected('dataset') +
            '&parameters=' + selected('parameters')

    if (selected('server').id !== 'CSA') {
      url = util.hapi2to3(url)
    }

    if (meta) {
      $('#parameterinfo ul').append(`<li>id: <code>${selected('parameters')}</code></li>`)
      for (const key of Object.keys(meta)) {
        if (key !== 'bins') {
          $('#parameterinfo ul').append(`<li>${key}: ${JSON.stringify(meta[key])}</li>`)
        }
      }

      html.showJSONOnClick('parameter', url, '#parameterinfo')
    }
  }

  const getOptions = {
    url,
    dataType: 'json',
    timeout: window.HAPIUI.options.metadataTimeout,
    requestURLElement: '#parametersRequestURL',
    timer: {
      element: '#parametersRequestTiming'
    }
  }

  // N.B. Call to get() must go last because cb() function requires above to be set.
  $('#parametersRequestError').empty().hide()
  get(getOptions, function (err, res) {
    if (err) {
      $('#parametersRequestError').html(err).show()
      return
    }
    $('#datasetinfo').show()
    process(res, url)
  })

  function process (res, url) {
    $('#datasetinfo ul').append(`<li>id: <code>${selected('dataset')}</code></li>`)

    let description = res.description
    if (description && /\\n/.test(description)) {
      // Preserve formatting in description.
      description = '<pre>' + description.replace('\\n', '<br/>') + '</pre>'
    }
    if (description) {
      $('#datasetinfo ul').append('<li>Description: ' + description + '</li>')
    }

    // Show number of parameters
    $('#nParameters').html(`<code>${res.parameters.length}</code> parameter${util.plural(res.parameters)}.`)
    $('#datasetinfo ul').append(`<li>Start: <code>${res.startDate}</code></li>`)
    $('#datasetinfo ul').append(`<li>Stop: <code>${res.stopDate}</code></li>`)

    let cadence = res.cadence
    if (cadence) {
      cadence = `Cadence: ${time.ISODuration2Words(cadence)} (<code>${cadence}</code>)`
    } else {
      cadence = 'Cadence: not specified'
    }
    $('#datasetinfo ul').append(`<li>${cadence}</li>`)

    if (res.resourceURL) {
      $('#datasetinfo ul')
        .append('<li>' +
                html.aLink(res.resourceURL, 'Dataset documentation or metadata') +
                '</li>')
    }
    if (res.contact) {
      $('#datasetinfo ul')
        .append('<li>Dataset contact: ' + html.mailtoLink(null, res.contact, url) + '</li>')
    }

    html.showJSONOnClick('dataset', url, '#datasetinfo')

    let surl = servers.info[selected('server')].url
    if (!surl.startsWith('http')) {
      surl = window.location.origin + window.location.pathname + surl
    }
    let vurl = window.HAPIUI.options.verifier +
             '?url=' + surl +
             '&id=' + datasets.info[selected('dataset')].id

    if (selected('server').id !== 'CSA') {
      vurl = util.hapi2to3(vurl)
    }

    const link = `<a target="_blank" href="${vurl}">Check this dataset using the HAPI Verifier</a>`
    let warning = ''
    if (new URL(surl).hostname.startsWith('localhost') === true) {
      if (new URL(vurl).hostname.startsWith('localhost') === false) {
        warning = '<br>(Server URL host name is <code>localhost</code> and verifier URL host name is not <code>localhost</code>. Verifier links may not work.)'
      }
    }
    const li = `<li id="verifierlink" style="display:none">${link} ${warning}</li>`
    $('#datasetinfo ul').append(li)
    if ($('#showverifierlink').prop('checked')) {
      $('#verifierlink').show()
    }

    datasets.info[selected('dataset')].info = res

    res = res.parameters

    const info = {}
    const list = []
    for (let k = 0; k < res.length; k++) {
      info[res[k].name] = {}
      for (const key of Object.keys(res[k])) {
        info[res[k].name][key] = res[k][key]
      }
      let selectParameter = false
      const urlParameters = window.HAPIUI.qsInitial.parameters
      if (urlParameters && urlParameters.split(',').includes(res[k].name)) {
        selectParameter = true
        util.log(`parameters(): parameter value for '${res[k].name}' found in hash. Will select it.`)
      }

      let label = res[k].label || ''
      if (Array.isArray(res[k].label)) {
        label = res[k].label.join(', ')
      }
      label = res[k].description || label

      list.push({
        label,
        value: res[k].name,
        selected: selectParameter,
        title: res[k].description || ''
      })
    }

    if (window.HAPIUI.options.allowAllParameters === true) {
      list.unshift({
        label: 'All parameters',
        value: '',
        selected: window.HAPIUI.qsInitial.parameters === '*all*'
      })
    }

    datasets.info[selected('dataset')].info.parameters = info
    parameters.info = info
    parameters.list = list

    delete window.HAPIUI.qsInitial.parameters
    cb(list)
  }
}

// Start time dropdown
function starttime (cb) {
  timeDropdown(starttime, cb)
}
function stoptime (cb) {
  timeDropdown(stoptime, cb)
}

function timeDropdown (fn, cb) {
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

  const info = datasets.info[selected('dataset')].info
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

    if (time.validTimeString(name, selected(name)) === true) {
      if (selected(name) in lasts) {
        util.log(`${name}time.onselect(): ${selected(name)} is already in ${storage}. Not appending.`)
      } else {
        util.log(`${name}time.onselect(): Appending ${selected(name)} to ${name}.lasts = ${JSON.stringify(name.lasts)}.`)
        lasts.push(selected(name))
        util.log(`${name}time.onselect(): Writing ${storage} in localStorage.`)
        localStorage.setItem(storage, JSON.stringify(lasts))
      }
    } else {
      util.log(`${name}time(): ${selected(name)} is not a valid time. Not appending to ${storage}.`)
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
    const valid = time.validTimeString(selected(name))
    if (valid) {
      let msg = `${name}time(): ${selected(name)} is a valid date/time string`
      util.log(`${msg}. Unsetting any errors on selected ${name}`)
      unSetError(name)
      const startStopOK = time.checkStartStop(name, selected('start'), selected('stop'))
      if (startStopOK === true) {
        msg = `${msg} and selected start < selected stop`
        util.log(`${msg}. Unsetting any errors on selected start and selected stop.`)
        unSetError()
        if (time[name + 'OK'](info, selected(name))) {
          msg = `${msg} and selected ${name} is valid for this dataset`
          util.log(`${msg}. Unsetting any errors on selected ${name}.`)
          unSetError(name)
          if (selected('format')) {
            util.log(`${name}time(): start/stop date/times passed validation. Updating #output.`)
            output() // Update output
          }
        } else {
          const emsg = `${selected(name)} is not valid for this dataset. Allowed: ${allowed}`
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
      const emsg = `${selected(name)} is not a valid date/time string.`
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
    console.error(`${name}time(): No valid times could be generated. Likely there is an error in info.startDate and/or info.stopDate.`)
    if (name === 'start') {
      list.append({ label: info.startDate, value: info.startDate })
    } else {
      list.append({ label: defaultStop, value: defaultStop })
    }
  }

  util.log(`${name}time(): list = ${JSON.stringify(list)}`)
  util.log(`${name}time(): Setting selected time to ${list[0].value}`)
  list[0].selected = true
  delete window.HAPIUI.qsInitial[name]
  cb(list)
}

// Return dropdown
function returntype (cb) {
  returntype.id = 'return'
  returntype.label = 'Return'
  returntype.clearFollowing = true

  returntype.onselect = function () {
    $('#output').prevAll('details').each(function () {
      $(this).attr('open', false)
    })
    $(window).scrollTop(0)
  }

  const values =
              [
                { label: 'Data', value: 'data' },
                { label: 'Image', value: 'image' },
                { label: 'Script', value: 'script' }
              ]

  for (let i = 0; i < values.length; i++) {
    if (window.HAPIUI.qsInitial.return === values[i].value) {
      values[i].selected = true
    }
  }
  delete window.HAPIUI.qsInitial.return
  cb(values)
}

// Format dropdown
function format (cb) {
  util.log('format(): Called.')
  format.id = 'format'
  format.clearFollowing = true

  format.onselect = function () {
    $(window).scrollTop(0)
    if (selected('style') || selected('return') === 'script') {
      // Update output
      output()
    }
    // Keep state of following dropdown.
    // style.lastSelected = selected('style');
  }

  let values = []
  if (selected('return').match('data')) {
    format.label = 'Output Format'
    values =
              [
                { label: 'CSV', value: 'csv' },
                { label: 'JSON', value: 'json' }
              ]
  }

  if (selected('return').match('image')) {
    format.label = 'Plot Server'
    values =
        [
          {
            label: 'HAPI plot perver',
            value: 'hapiplot'
          },
          {
            label: 'Plot pager',
            value: 'hapiplot-plotpager'
          },
          {
            label: 'Autoplot plot perver',
            value: 'autoplot'
          }
        ]
    if (selected('server') === 'CDAWeb') {
      values.push({
        label: 'CDAWeb',
        value: 'cdaweb'
      })
    }
  }

  if (selected('return').match('script')) {
    format.label = 'Language'
    values = _scriptList()
  }

  let autoOpen = false
  if (values.length > 0) {
    let selectDefault = true
    if (selected('return').match('script')) {
      if (window.HAPIUI.qsInitial.format === undefined) {
        autoOpen = true
      }
      if (!selected('format') && !window.HAPIUI.qsInitial.format) {
        selectDefault = false
      }
    }
    if (selectDefault === true) {
      const queryParameterValue = window.HAPIUI.qsInitial.format
      values = query.chooseDefault(queryParameterValue, values)
    }
  }
  delete window.HAPIUI.qsInitial.format
  cb(values, autoOpen)
}

// Style dropdown
function style (cb) {
  util.log('style(): Called.')

  style.id = 'style'
  style.clearFollowing = false
  style.onselect = function () {
    output()
  }

  let values = []
  if (selected('return') === 'image') {
    values =
              [
                { label: 'SVG', value: 'svg' },
                { label: 'PNG', value: 'png' },
                { label: 'PDF', value: 'pdf' }
              ]

    if (selected('server') === 'CDAWeb' && selected('format') === 'cdaweb') {
      values =
                [
                  { label: 'GIF', value: 'gif' },
                  { label: 'PNG', value: 'png' },
                  { label: 'PDF', value: 'pdf' }
                ]
    }
  }

  if (selected('return') === 'data') {
    style.label = 'Header Options'
    style.label = 'Output header options'
    values =
        [
          {
            label: 'No Header',
            value: 'noheader'
          },
          {
            label: 'Header',
            value: 'header'
          }
        ]
  }

  if (values.length > 0) {
    const useDefault = window.HAPIUI.qsInitial.style
    for (let i = 0; i < values.length; i++) {
      // lastSelected was stored in style.lastSelected when format.onselect().
      // If lastSelected is in list, select it instead of using initial
      // query string value. TODO: This is hacky.
      // if (style.lastSelected === values[i]['value']) {
      //  useDefault = style.lastSelected;
      // }
    }
    values = query.chooseDefault(useDefault, values)
  }
  delete window.HAPIUI.qsInitial.style
  cb(values)
}

// Place returntype response in DOM
function output () {
  util.log('output(): Called.')

  if (!selected('return')) {
    util.log("output(): Warning: output called but 'return' not selected. Returning.")
    return
  }

  util.log('output(): Showing #output element.')
  $('#output').show()

  if (selected('return').match(/script/)) {
    script()
  }

  if (selected('return').match(/data/)) {
    data()
  }

  if (selected('return').match(/image/)) {
    // $('#plotserver').trigger('change');

    let selectedParameters = selected('parameters').trim()
    if (selectedParameters === '') {
      selectedParameters = Object.keys(parameters.info)
    } else {
      selectedParameters = selectedParameters.split(',')
    }

    for (const parameter of selectedParameters) {
      plot(parameter)
    }
  }
}
