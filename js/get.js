function get (options, cb) {
  const proxyURL = window.HAPIUI.options.proxy

  let specURL = 'https://github.com/hapi-server/data-specification/blob/master'
  specURL += '/hapi-dev/HAPI-data-access-spec-dev.md#5-cross-origin-resource-sharing'

  options = JSON.parse(JSON.stringify(options))

  let url = options.url

  util.log('get(): Called with options: ' + JSON.stringify(options))

  options.tryProxy = options.tryProxy || true
  options.directURLFailed = options.directURLFailed || false
  options.dataType = options.dataType || 'text'
  options.timeout = options.timeout || window.HAPIUI.options.metadataTimeout || 20000
  options.chunk = options.chunk || false

  options.timer = options.timer || {}

  util.log('get(): Given options and defaults: ' + JSON.stringify(options))

  if (!url.startsWith('http')) {
    // Requests to main server are relative paths and should not need a proxy.
    // So if they fail, don't try proxy.
    options.tryProxy = false
  }

  const urlo = url
  if (options.tryProxy && proxyURL && options.directURLFailed) {
    url = proxyURL + encodeURIComponent(url)
  }

  // Store client-side cache of response.
  if (typeof (get.cache) === 'undefined') {
    get.cache = {}
  }

  if (get.cache[urlo]) {
    util.log(`get(): Client-side cache hit for ${urlo}`)
    if (typeof get.cache[urlo] === 'object') {
      // Deep copy to avoid modifying cache.
      cb(false, JSON.parse(JSON.stringify(get.cache[urlo])))
    } else {
      cb(false, get.cache[urlo])
    }
    return
  }

  util.log('get(): Requesting ' + url)
  if (options.requestURLElement) {
    $(options.requestURLElement).html('Requesting: ' + html.aLink(url))
  }
  const timerID = timer(url, options.timer)
  if (timerID === null) {
    console.log(`get(): Returning because active request for url = ${url}`)
    console.log('get(): Check for redundant requests. Placing request in callback queue for active request.')
    get.callBackQueue = get.callBackQueue || {}
    get.callBackQueue[url] = get.callBackQueue[url] || []
    get.callBackQueue[url].push(cb)
    return
  }

  if (options.chunk === true) {
    getChunks()
  } else {
    getAll()
  }

  function getAll () {
    $.ajax({
      type: 'GET',
      url,
      async: true,
      dataType: options.dataType,
      timeout: options.timeout,
      success: function (data, textStatus, jqXHR) {
        const contentType = jqXHR.getResponseHeader('content-type')
        const dataLength = jqXHR.responseText.length
        let nRecords = -1

        util.log('get(): Received ' + url)
        util.log(`get(): options.dataType: ${options.dataType}; response content-type: ${contentType}`)
        timer(timerID, 'stop')
        if (options.requestURLElement) {
          $(options.requestURLElement).html('Received: ' + html.aLink(url))
        }

        if (options.dataType === 'json') {
          if (!contentType || contentType.startsWith('application/json') === false) {
            if (typeof data !== 'object') {
              let msg = `Error: ${html.aLink(url)} returned content-type = '${contentType}'`
              msg += ' but expected \'application/json\'. Attempt to parse as JSON failed.'
              errorHandler(msg)
              return
            }
          }
          if (!data) {
            const msg = `Error: ${url} returned no data.`
            errorHandler(msg)
            return
          }
          if (data.status && parseInt(data.status.code) !== 1200) {
            const msg = `Error: ${url} returned HAPI status code != 1200`
            errorHandler(msg)
            return
          }
          if (typeof (data.data) === 'object') {
            if (data.data !== undefined) {
              nRecords = data.data.length
            } else {
              nRecords = data.length
            }
          }
        }

        if (options.dataType === 'text' && typeof (data) === 'string') {
          // TODO: Remove header
          nRecords = (data.match(/\n/g) || []).length
        }

        // Cache response.
        if (typeof data === 'object') {
          // Deep copy to avoid modifying cache.
          get.cache[urlo] = JSON.parse(JSON.stringify(data))
        } else {
          get.cache[urlo] = data
        }

        if (get.callBackQueue && get.callBackQueue[url]) {
          while (get.callBackQueue[url].length > 0) {
            console.log('get(): Calling back from queue for ' + url)
            const cbq = get.callBackQueue[url].shift()
            cbq(null, get.cache[urlo], dataLength, nRecords)
          }
        }

        if (cb) {
          cb(null, data, dataLength, nRecords)
        }
      },
      error: function (xhr, textStatus, errorThrown) {
        util.log('get(): Error for ' + url)
        timer(timerID, 'stop')
        errorHandler(xhr)
      }
    })
  }

  function getChunks () {
    // https://gist.github.com/jfsiii/034152ecfa908cf66178
    fetch(url)
      .then(processChunkedResponse)
      .then((result) => {
        util.log('get(): Fetch of chunks complete.')
        $(options.requestURLElement).html('Received: ' + html.aLink(url))
        timer(timerID, 'stop')
      })
      .catch((e) => {
        util.log('get(): Fetch catch() error for ' + url)
        util.log(e)
        errorHandler(e)
        timer(timerID, 'stop')
      })

    function processChunkedResponse (response) {
      if (response.status !== 200) {
        const err = new Error(`get(): Fetch of chunks failed with HTTP status code = ${response.status}`)
        errorHandler(err)
        return
      }
      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      let nRecords = 0
      let dataLength = 0

      return readChunk()

      function readChunk () {
        return reader.read().then(appendChunks)
      }

      function appendChunks (result) {
        const text = decoder.decode(result.value)// || new Uint8Array, {stream: !result.done});
        util.log(`get(): Got chunk of ${text.length} bytes`)
        nRecords += (text.match(/\n/g) || []).length
        dataLength = dataLength + new Blob([text]).size
        $('#data').append(text)
        if (result.done) {
          util.log('get(): Received all chunks for ' + url)
          if (cb) cb(null, null, dataLength, nRecords)
        } else {
          return readChunk()
        }
      }
    }
  }

  function errorHandler (xhr, textStatus, errorThrown) {
    if (get.callBackQueue && get.callBackQueue[url]) {
      const len = get.callBackQueue[url].length
      console.error(`get(): Deleting callback queue of length ${len} for ${url}.`)
      delete get.callBackQueue[url]
    }

    if (options.tryProxy && options.directURLFailed == false && proxyURL) {
      const opts = { ...options, directURLFailed: true, tryProxy: false }
      util.log('get(): Attempting to proxy retrieve ' + url)
      get(opts, cb)
    } else {
      if (options.directURLFailed === true && proxyURL) {
        const urlHead = url.replace('proxy?url=', 'proxy?head=true&url=')
        $.ajax({
          type: 'GET',
          url: urlHead,
          async: true,
          timeout: options.timeout,
          dataType: options.dataType,
          success: (head, textStatus, jqXHR) => {
            const msgo = `<br>Direct request of ${html.aLink(urlo)} failed.`
            let msg = msgo + `<br><br>Proxy request of ${html.aLink(url)} failed.`
            msg = msg + `<br><br>Another proxy <code>HEAD</code> request for the first URL found a HTTP status code = <code>${head.status}<code>`
            if (head.status !== 200) {
              cb(msg, null)
              return
            }
            msg = msg + '<br>This is unexpected. Try again?'
            cb(msg, null)
          },
          error: function (xhr, textStatus, errorThrown) {
            const msgx = 'Failed to retrieve' +
                        '<br><br>' + html.aLink(urlo) +
                        '<br>and<br>' + html.aLink(url) +
                        '<br>and<br>' + html.aLink(urlHead)
            cb(msgx, null)
          }
        })
      } else {
        // xhr will be AJAX xhr or fetch Error.
        const emsg = xhr.statusText || xhr.responseText || xhr.message
        const msg =
                  'Error encountered when attempting to retrieve ' +
                  html.aLink(url) +
                  '<br><br>Error: <pre>' + emsg + '</pre>'
        cb(msg, null)
      }
    }
  }
}
