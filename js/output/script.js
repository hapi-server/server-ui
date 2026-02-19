function script () {
  // To add a script, need to modify:
  // - scripts/_scriptList.js
  // - index.htm (highlight.js)
  // - index.htm (hljs.getLanguage)
  // - index.htm (list of scripts in text)
  // - server-ui/js/output/script.js (this file)

  let cclass = '' // Syntax highlight class
  let ext = '' // Script filename extension

  if (hash.selected('format').startsWith('python')) {
    cclass = 'python'
    ext = 'py'
  }
  if (hash.selected('format').startsWith('julia')) {
    cclass = 'julia'
    ext = 'jl'
  }
  if (hash.selected('format').startsWith('javascript')) {
    cclass = 'javascript'
    ext = 'html'
  }
  if (hash.selected('format').startsWith('matlab')) {
    cclass = 'matlab'
    ext = 'm'
  }
  if (hash.selected('format') === 'autoplot') {
    cclass = 'python'
    ext = 'jy'
  }
  if (hash.selected('format').startsWith('idl')) {
    cclass = ''
    ext = 'pro'
  }
  if (hash.selected('format') === 'curl') {
    cclass = 'curl'
    ext = 'sh'
  }
  if (hash.selected('format') === 'wget') {
    cclass = 'wget'
    ext = 'sh'
  }

  const opts = {
    server: servers.info[hash.selected('server')].url,
    dataset: hash.selected('dataset'),
    parametersList: Object.keys(parameters.info),
    parametersSelected: hash.selected('parameters'),
    startDate: hash.selected('start'),
    stopDate: hash.selected('stop'),
    startDateMin: datasets.info[hash.selected('dataset')].info.startDate,
    stopDateMax: datasets.info[hash.selected('dataset')].info.stopDate,
    contactEmail: servers.info[hash.selected('server')].contactEmail
  }

  $.ajax({
    type: 'GET',
    url: 'scripts/' + hash.selected('format') + '.' + ext,
    async: true,
    dataType: 'text',
    success: function (data, textStatus, jqXHR) {
      const scriptText = createScript(data, opts)
      showText(scriptText, cclass, ext)
    }
  })

  function showText (sText, cclass, ext) {
    $('#scriptcopy > button').attr('data-clipboard-text', sText)
    $('#scriptcopy').show()

    const clipboard = new ClipboardJS('.btn')
    clipboard.on('success', function () {
      util.log('Copied script to clipboard.')
    })

    let type = 'script'
    let fname = 'demo'
    if (ext === 'json') {
      type = 'json'
      fname = 'hapi'
    }

    const w = $('#infodiv').width() - 15

    // Common browser bug: &param is interpreted as &para;m (¶m)
    if (!['wget', 'curl'].includes(hash.selected('format'))) {
      sText = sText.replace('&param', '&amp;param')
    }
    $('#script').addClass(cclass)
    $('#script').text(sText)

    $('#scripttext > pre').show()

    const blob = new Blob([sText], { type: 'octet/stream' })
    const scriptFile = window.URL.createObjectURL(blob)
    // let scriptFile = 'data:text/plain;base64;charset=utf-8,' + btoa(sText);

    // https://stackoverflow.com/a/30139435
    const el = document.createElement('a')
    el.setAttribute('href', scriptFile)
    el.setAttribute('download', fname + '.' + ext)

    if (showText.scriptFile) {
      // https://developer.mozilla.org/en-US/docs/Web/API/URL/revokeObjectURL
      // Remove previous reference (frees memory)
      window.URL.revokeObjectURL(scriptFile)
    }
    showText.scriptFile = scriptFile

    $('#downloadlink').empty().append(el).show()
    $('#downloadlink > a')
      .html('Download ' + type)
      .css('font-weight', 'bold')

    hljs.highlightBlock(document.getElementById('script'))

    // html.scrollIntoView('script-details');
    $('#output details').attr('open', false)
    $('#script-details').show().attr('open', true)
  }
}
