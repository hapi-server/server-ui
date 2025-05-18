function plot (selectedParameter, cb) {
  // TODO: Check plotserver is known.

  let format = selected('style')

  let plotserver = selected('format')
  let plotServer = window.HAPIUI.options.hapiplot;
  [plotserver, plotServer] = _plotServer(plotserver, plotServer)

  let parentElementId = `plot-details-${selectedParameter}-${plotserver}`
  parentElementId = parentElementId.replace(/ /g, '')

  util.log('plot(): plotserver = ' + plotserver + ', plotServer = ' + plotServer)

  let hapiServer = servers.info[selected('server')].url
  if (!hapiServer.startsWith('http')) {
    hapiServer = location.origin + location.pathname + hapiServer
  }

  let url = ''

  if (plotserver.startsWith('hapiplot')) {
    url = plotServer + '?' +
        'server=' + hapiServer +
        '&dataset=' + selected('dataset') +
        '&parameters=' + selectedParameter +
        '&start=' + selected('start') +
        '&stop=' + selected('stop') +
        '&format=' + format +
        '&usecache=' + $('#useimagecache').prop('checked') +
        '&usedatacache=' + $('#usedatacache').prop('checked')
    if (plotserver === 'hapiplot') {
      _setImage(url)
    }

    if (plotserver === 'hapiplot-plotpager') {
      const height = 'height="512px"'
      const width = 'width=100%'
      const summary = $(`#${parentElementId} #plot-summary`).html()
      const html = `
        <details open>
          <summary>
            Plot pager of <code>${selectedParameter}</code> using <code>${plotserver}</code> plot server. 
            <a href="${url}" target="_blank" data-tooltip="Open in new tab">
              <img src="css/new-tab.svg" style="height: 0.75em">
            </a>
          </summary>
          <iframe src="${_plotPagerURL(url)}" ${width} ${height}></iframe>
        </details>`
      $('#output details').attr('open', false)
      $('#plot-details').after(html)
    }
  }

  if (plotserver === 'autoplot') {
    _autoplot()
  }

  if (plotserver === 'cdaweb') {
    _cdaweb()
  }

  function _setImage (url) {
    function finished (err) {
      if (err) {
        util.log('plot._setImage(): Image load error: ')
        console.error(err)
      } else {
        util.log('plot._setImage(): Image loaded: ' + url)
      }
      timer(timerId, 'stop')
      _finalizeDOM(err, url)
      if (cb) cb(err, url)
    }

    util.log('plot._setImage(): Request to set image with url = ' + url)

    const timerOptions = { element: `#${parentElementId} #imageRequestTiming` }
    const timerId = timer(url, timerOptions)
    if (timerId === null) {
      util.log('plot._setImage(): Returning because image already being set with url = ' + url)
      util.log('plot._setImage(): Check for redundant requests.')
      return
    }

    if (plot.warningShown === undefined) {
      if (_isLocalURL(hapiServer) && !_isLocalURL(plotServer) && plotserver !== 'cdaweb') {
        let msg = `Data server hostname is local (${new URL(hapiServer).host}) and `
        msg += `plot server hostname is not local (${new URL(plotServer).host}). `
        msg += 'Plot requests may fail.'
        const warningEl = `#${parentElementId} #plotRequestWarning`
        $(warningEl).empty().hide()
        $(warningEl).html(msg).show()
        setTimeout(() => $(warningEl).empty().hide(), 2000)
        plot.warningShown = true
      }
    }

    _prepDOM()

    if (format !== 'pdf') {
      // Because we use an id based on parameter, name, calling script can
      // request an image with an invalid URL such that plot server returns a 502.
      // In this case, image for bad URL is set, but then another request for valid URL
      // may overwrite. As a result, the .error will not be triggered for the
      // bad URL and the timer will continue to run. Would need to have parentElementId
      // to include a hash of the URL to prevent this.
      util.log('plot._setImage(): Setting image with url = ' + url)
      $(`#${parentElementId} #image`).append('<img></img>')
      $(`#${parentElementId} img`)
        .attr('src', url)
        .load(() => {
          finished()
        }).error(() => {
          $(`#${parentElementId} img`).remove()
          // https://stackoverflow.com/questions/41958664/catch-an-image-specific-error-in-javascript
          // Would need to use an AJAX call get the actual error. The error
          // shows up in console, but does not seem to be available here.
          finished('Could not set image.')
        })

      if (format === 'svg') {
        $(`#${parentElementId} img`).width($('#infodiv').width())
      }
    } else {
      const w = $('#infodiv').width()
      // TODO: Determine aspect ratio based on request params.
      const h = w / 2.1
      // TODO: Image inside iframe will be zoomed when browser content
      // is zoomed. Undo this zoom? Use this to determine zoom:
      // https://codepen.io/reinis/pen/RooGOE ?

      // Note that we can't catch error if iframe fails to load.
      // See technique in BiEdit.
      $(`#${parentElementId} #image`).append(`<iframe width='${w}' height='${h}'></iframe>`)
      $(`#${parentElementId} iframe`)
        .attr('frameborder', 0)
        .attr('scrolling', 'no')
        .attr('src', url)
        .attr('src', url + '#view=Fit&toolbar=0&scrollbar=0')
        .load(() => {
          finished()
        })
    }
  }

  function _prepDOM () {
    $(`#${parentElementId} #plotRequestError`).empty().hide()
    const clone = $('#plot-details').clone().prop('id', parentElementId)

    // Remove existing element (will exist if plot of png and then plot of
    // svg selected)
    $(`#${parentElementId}`).remove()

    // Append new details element containing plot.
    $('#plot-details').after(clone)

    const summary = $(`#${parentElementId} #plot-summary`).html()
    let html = `${summary} of <code>${selectedParameter}</code> `
    html += `using <code>${plotserver}</code> plot server.`
    $(`#${parentElementId} #plot-summary`).html(html)
  }

  function _finalizeDOM (err, url) {
    $('#output details').attr('open', false)
    $(`#${parentElementId}`).show().attr('open', true)
    if (err) {
      const msg = `Error when requesting ${html.aLink(url, 'image')}: ${err}`
      $(`#${parentElementId} #plotRequestError`).html(msg).show()
      return
    }

    // html.scrollIntoView(`${parentElementId}`);

    html.downloadLink(url, 'plot', `#${parentElementId} #plot-downloadlink`)

    const format = selected('style')
    const plotserver = selected('plotserver')
    if (/png|svg/.test(format) && plotserver !== 'cdaweb') {
      const galleryLink = html.aLink(_plotGalleryURL(url), '&#9638;&nbsp;Thumbnails', true)
      const pagerLink = html.aLink(_plotPagerURL(url), '&#9707;&nbsp;Plot pager', true)
      const galleryHTML = `&nbsp;|&nbsp;<span>View many plots: &nbsp;${pagerLink}&nbsp;|&nbsp;${galleryLink}</span>`
      $(`#${parentElementId} #plot-downloadlink`).append(galleryHTML).show()
    }
  }

  function _plotGalleryURL (url) {
    return url.replace(`format=${format}`, 'format=gallery&mode=thumb')
  }
  function _plotPagerURL (url) {
    return url.replace(`format=${format}`, 'format=gallery')
  }

  function _isLocalURL (url) {
    const urlObj = new URL(url)
    return urlObj.host.startsWith('localhost') || urlObj.host.startsWith('127')
  }

  function _plotServer (plotserver, plotServer) {
    if (/^[a-z].*?:http/.test(plotserver)) {
      plotServer = plotserver.split(plotserver + ':')[1]
      plotserver = plotserver.split(':')[0]
    } else if (/^http/.test(plotserver)) {
      // If bare URL, assume hapiplot server
      plotserver = 'hapiplot'
      plotServer = window.HAPIUI.options.hapiplot
    } else {
      if (plotserver === '') {
        plotserver = 'hapiplot'
        plotServer = window.HAPIUI.options.hapiplot
      }
      if (plotserver === 'hapiplot') {
        plotServer = window.HAPIUI.options.hapiplot
      }
      if (plotserver === 'autoplot') {
        plotServer = window.HAPIUI.options.autoplot
      }
      if (plotserver === 'cdaweb') {
        plotserver = 'cdaweb'
        plotServer = window.HAPIUI.options.cdawebplot
      }
    }
    return [plotserver, plotServer]
  }

  function _autoplot () {
    url = 'vap+hapi:' + hapiServer + '?id='
    url = url + `${selected('dataset')}&parameters=${selectedParameter}&timerange=${selected('start')}/${selected('stop')}`
    url = plotServer + '?url=' + encodeURIComponent(url)

    if (format === 'svg') {
      format = 'image/svg+xml'
    }
    if (format === 'pdf') {
      format = 'application/pdf'
    }

    const width = $('#infodiv').width() - 15
    const height = Math.round(width * 3.0 / 7.0)
    const config = {
      format,
      width,
      height,
      font: 'sans-18', // What are options?
      autolayout: true,
      column: '6.5em,100%-2.5em', // Left gap, right gap
      row: '3em,100%-3em', // Top gap, bottom gap
      process: '', // histogram, magnitude(fft)
      renderType: '', // spectrogram, series, scatter, stairSteps, fill_to_zero
      symbolSize: '',
      color: '#0000ff',
      fillColor: '#aaaaff',
      foregroundColor: '#000000',
      backgroundColor: '#ffffff'
    }
    const configa = []
    for (const [key, val] of Object.entries(config)) {
      configa.push(key + '=' + encodeURIComponent(val))
    }
    url = url + '&' + configa.join('&')
    _setImage(url)
  }

  function _cdaweb () {
    let start = util.doy2ymd(selected('start'))
    let stop = util.doy2ymd(selected('stop'))
    start = dayjs(start).toISOString().replace(/:|-/g, '').replace(/\.[0-9].*Z/, 'Z')
    stop = dayjs(stop).toISOString().replace(/:|-/g, '').replace(/\.[0-9].*Z/, 'Z')
    const xurl = `${plotServer}/${selected('dataset')}/data/${start},${stop}/${selectedParameter}?format=${format}`

    if (Object.keys(parameters.info)[0] === selectedParameter) {
      const msg = 'Plotting only time parameter is not supported by CDAWeb plot server.'
      _prepDOM()
      _finalizeDOM(msg, xurl)
      return
    }
    if (selectedParameter === '') {
      const msg = 'Plotting all parameters using CDAWeb not yet supported by this interface.'
      _prepDOM()
      _finalizeDOM(msg, xurl)
      return
    }

    util.log('plot(): Requesting ' + xurl)

    const timerOptions = { element: `#${parentElementId} #imageRequestTiming` }
    const timerId = timer(url, timerOptions)
    if (timerId === null) {
      util.log('plot._setImage(): Returning because image already being set with url = ' + url)
      util.log('plot._setImage(): Check for redundant requests.')
      return
    }

    $.ajax(
      {
        type: 'GET',
        url: xurl,
        async: true,
        dataType: 'xml',
        cache: false, // Response is to a temp file, so don't cache as temp file may change.
        success: function (xml, textStatus, jqXHR) {
          timer(timerId, 'stop')
          const msg = $(xml).find('Error').text()
          if (msg) {
            _prepDOM()
            _finalizeDOM(msg, xurl)
            return;
          }
          util.log('plot(): Received ' + xurl)
          url = $(xml).find('Name').text()
          if (!url) {
            _prepDOM()
            _finalizeDOM('No image URL in returned XML', xurl)
            return
          }
          util.log('plot(): Referenced URL: ' + url)
          if (format === 'pdf') {
            // Proxy is required b/c of iframe restrictions in headers.
            const proxyURL = window.HAPIUI.options.proxy
            url = proxyURL + encodeURIComponent(url)
            util.log(`plot(): Using proxy for PDF: ${url}`)
          }
          _setImage(url)
        },
        error: function (xhr, textStatus, errorThrown) {
          timer(timerId, 'stop')
          _finalizeDOM(errorThrown, xurl)
        }
      })
    }
}
