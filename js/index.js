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
  hash.bind()

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

function clearErrors () {
  $('#allRequestError').empty().hide()
  $('#datasetsRequestError').empty().hide()
  $('#dataRequestError').empty().hide()
  $('#appWarning').empty().hide()
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
      html.aboutList(json, url)
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

}

// Servers dropdown
function servers (cb) {
  util.log('servers(): Called.')

  clearErrors()

  const defaultOptions = {
    requestURLElement: '#allRequestURL',
    timeout: window.HAPIUI.options.allTimeout,
    timer: {
      element: '#allRequestTiming'
    }
  }

  const serverList = window.HAPIUI.options.serverList
  const serverListFallback = window.HAPIUI.options.serverListFallback

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
    clearErrors()

    const selectedServer = hash.selected('server')

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
        $('#time-range-details  summary .selected-server').html(hash.selected('server') + '&nbsp;')
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

    html.serverList(servers.info[hash.selected('server')], url)

    $('#serverinfo').show()

    showSingleServerExamples()
  }

  function showSingleServerExamples () {
    $('#all-example-details-body > div').hide()
    $('#all-example-details summary .selected-server').html(hash.selected('server') + '&nbsp;')
    $(`#${util.validHTMLID(hash.selected('server'))}-examples b`).hide()
    $(`#${util.validHTMLID(hash.selected('server'))}-examples`).show()
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

    const selectedServer = hash.selected('server')

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
        if (hash.selected('server')) {
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
    clearErrors()

    util.log('datasets.onselect(): Emptying #datasetinfo <ul>.')
    $('#datasetinfo ul').empty()

    util.log('datasets.onselect(): Hiding output.')
    $('#output').hide()
  }

  const url = servers.info[hash.selected('server')].url + '/catalog'
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

  clearErrors()
  get(getOptions, function (err, res) {
    if (!err) {
      process(res)
      return
    }
    $('#datasetsRequestError').html(err).show()
  })

  function process (res) {
    about(servers.info[hash.selected('server')].url, res.HAPI)

    $('#server-example-details').attr('open', false)

    datasets.json = res
    res = res.catalog

    // Show number of datasets
    let nDatasets = res.length + ' dataset' + util.plural(res)
    nDatasets += ` from <code>${html.aLink(url, '/catalog')}</code> response`
    $('#nDatasets').html(nDatasets)

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
      if (json && json[hash.selected('server')]) {
        const watcherLink = window.HAPIUI.options.urlwatcher + '#category=' + hash.selected('server')
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

  let url = servers.info[hash.selected('server')].url + '/info?id=' + hash.selected('dataset')
  if (hash.selected('server') !== 'CSA') {
    url = util.hapi2to3(url)
  }

  parameters.id = 'parameters'
  parameters.label = 'Parameters'
  parameters.allowEmptyValue = true
  parameters.selectMultiple = true

  parameters.clearfollowing = () => {
    if (hash.selected('format')) {
      util.log("parameters.clearfollowing(): 'format' is selected. Updating #output.")
      output()
    }
    return false
  }

  parameters.onselect = function () {
    util.log('parameters.onselect(): Called.')
    clearErrors()

    if (hash.selected('format')) {
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
      if (hash.selected('parameters') === '') {
        // Loop through all parameters and create bulleted list.
        // return;
      }
    }

    util.log(`parameters.onselect(): hash.selected('parameters') = '${hash.selected('parameters')}'.`)
    const meta = parameters.info[hash.selected('parameters')]
    let url = servers.info[hash.selected('server')].url +
            '/info?id=' + hash.selected('dataset') +
            '&parameters=' + hash.selected('parameters')

    if (hash.selected('server').id !== 'CSA') {
      url = util.hapi2to3(url)
    }

    if (meta) {
      $('#parameterinfo ul').append(`<li>id: <code>${hash.selected('parameters')}</code></li>`)
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
  clearErrors()
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
    html.parametersList(res, url)

    if ($('#showverifierlink').prop('checked')) {
      $('#verifierlink').show()
    }

    datasets.info[hash.selected('dataset')].info = res

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

    datasets.info[hash.selected('dataset')].info.parameters = info
    parameters.info = info
    parameters.list = list

    delete window.HAPIUI.qsInitial.parameters
    cb(list)
  }
}

// Start time dropdown
function starttime (cb) {
  util.timeDropdown(starttime, cb)
}

// Stop time dropdown
function stoptime (cb) {
  util.timeDropdown(stoptime, cb)
}

// Return dropdown
function returntype (cb) {
  returntype.id = 'return'
  returntype.label = 'Return'
  returntype.clearFollowing = true

  returntype.onselect = function () {
    clearErrors()
    $('#output').prevAll('details').each(function () {
      $(this).attr('open', false)
    })
    $(window).scrollTop(0)
  }

  clearErrors()

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
    clearErrors()
    $(window).scrollTop(0)
    if (hash.selected('style') || hash.selected('return') === 'script') {
      // Update output
      output()
    }
    // Keep state of following dropdown.
    // style.lastSelected = hash.selected('style');
  }

  clearErrors()
  let values = []
  if (hash.selected('return').match('data')) {
    format.label = 'Output Format'
    values =
              [
                { label: 'CSV', value: 'csv' },
                { label: 'JSON', value: 'json' }
              ]
  }

  if (hash.selected('return').match('image')) {
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
    if (hash.selected('server') === 'CDAWeb') {
      values.push({
        label: 'CDAWeb',
        value: 'cdaweb'
      })
    }
  }

  if (hash.selected('return').match('script')) {
    format.label = 'Language'
    values = _scriptList()
  }

  let autoOpen = false
  if (values.length > 0) {
    let selectDefault = true
    if (hash.selected('return').match('script')) {
      if (window.HAPIUI.qsInitial.format === undefined) {
        autoOpen = true
      }
      if (!hash.selected('format') && !window.HAPIUI.qsInitial.format) {
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
    clearErrors()
    output()
  }

  let values = []
  if (hash.selected('return') === 'image') {
    values =
              [
                { label: 'SVG', value: 'svg' },
                { label: 'PNG', value: 'png' },
                { label: 'PDF', value: 'pdf' }
              ]

    if (hash.selected('server') === 'CDAWeb' && hash.selected('format') === 'cdaweb') {
      values =
                [
                  { label: 'GIF', value: 'gif' },
                  { label: 'PNG', value: 'png' },
                  { label: 'PDF', value: 'pdf' }
                ]
    }
  }

  if (hash.selected('return') === 'data') {
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
  clearErrors()
  delete window.HAPIUI.qsInitial.style
  cb(values)
}

// Place returntype response in DOM
function output () {
  util.log('output(): Called.')

  if (!hash.selected('return')) {
    util.log("output(): Warning: output called but 'return' not selected. Returning.")
    return
  }

  util.log('output(): Showing #output element.')
  $('#output').show()

  if (hash.selected('return').match(/script/)) {
    script()
  }

  if (hash.selected('return').match(/data/)) {
    data()
  }

  if (hash.selected('return').match(/image/)) {
    // $('#plotserver').trigger('change');

    let selectedParameters = hash.selected('parameters').trim()
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
