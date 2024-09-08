const superagent = require('superagent')
const path = require('path')

const log = require('log')

const init404 = require('./init404.js')
const handleError = require('./handleError.js')
const setHeaders = require('./setHeaders.js')

const getFiles = require('./getFiles.js')
const parseAllTxt = require('../../js/shared/parseAllTxt.js')

module.exports = initProxy
function initProxy (app, whiteListFiles, opts, cb) {
  log.debug('whiteListFiles: ' + whiteListFiles)
  const allowOpenProxy = opts.allowOpenProxy || false

  log.debug('Log directory: ' + log.logDir)
  const appLogDir = path.join(log.logDir, 'ui-app')
  const uiProxyLogDir = path.join(log.logDir, 'ui-proxy')
  log.debug(`App log directory: '${appLogDir}'`)
  log.debug(`Server log directory: '${uiProxyLogDir}'`)

  if (!whiteListFiles) {
    whiteListFiles = []
  }
  if (typeof (whiteListFiles) === 'string') {
    whiteListFiles = [whiteListFiles]
  }
  if (!Array.isArray(whiteListFiles)) {
    log.error('whiteListFiles must be an array of strings.', false, 'errors', appLogDir)
    cb('whiteListFiles must be an array of strings.', null)
    return
  }
  if (whiteListFiles.length === 0) {
    if (allowOpenProxy === true) {
      log.warn('whiteList = []. Running open proxy at endpoint /proxy.')
    } else {
      cb(new TypeError('whiteList = []. Exiting because allowOpenProxy is false.'), null)
      return
    }
  }

  prepWhiteList(whiteListFiles, (err, whiteListArray) => {
    if (err) {
      cb(err, null)
      return
    }

    log.info('Allowing proxy of URLs that start with')
    for (const url of whiteListArray) {
      log.info('  ' + url)
    }

    app.get('/proxy', function (req, res) {
      res.on('finish', () => log.request(req, 'requests', uiProxyLogDir))

      if (!req.query.url) {
        log.debug('No proxy URL given. Rejecting with HTTP 400.')
        res.status(400).end('url=... required.')
        return
      }

      const url = decodeURI(req.query.url)
      const head = req.query.head === 'true'

      log.info(`Request for /proxy: ${url}`)

      let allowProxy = false
      if (whiteListArray.length > 0) {
        for (const i in whiteListArray) {
          if (url.length >= whiteListArray[i].length && url.startsWith(whiteListArray[i])) {
            log.info('Allowing proxy of ' + url + ' because it starts with ' + whiteListArray[i] + '.')
            allowProxy = true
            break
          }
        }
      } else {
        allowProxy = true
      }

      res.removeHeader('X-Powered-By')

      if (isValidUrl === false) {
        log.debug('Rejecting proxy of ' + url + ' with HTTP 400.')
        res.status(400).end()
        return
      }

      if (allowProxy === false) {
        log.debug('Rejecting proxy of ' + url + ' with HTTP 407.')
        res.status(407).end()
        return
      }

      setHeaders(res, true)

      if (head === true) {
        superagent
          .get(url) // Would prefer to do HEAD, but see https://github.com/ladjs/superagent/issues/669
          .ok(res => true) // https://stackoverflow.com/a/47367531
          .then((pres) => {
            pres.headers.status = pres.statusCode
            res.send(JSON.stringify(pres.headers, null, 2))
          })
          .catch(err => {
            log.error(err.message, false, 'errors', appLogDir)
            res.status(501).send('')
          })
        return
      }

      superagent
        .get(url)
        .buffer()
        .parse((pres, cb) => {
          console.log(pres.headers)
          if (pres.statusCode !== 200) {
            res.status(pres.statusCode).end()
            return
          }

          // Keep only content-type. If there was content-encoding = gzip,
          // it was already decompressed by superagent and content-encoding and
          // content-length will be wrong.
          res.set({ 'content-type': pres.headers['content-type'] })

          pres.on('data', chunk => {
            console.log('chunk', chunk.toString())
            res.write(chunk)
          })
          pres.on('end', () => {
            res.end()
          })
          pres.on('error', (err) => {
            log.error(err.message, false, 'errors', appLogDir)
            res.status(501).send('')
          })
        })
        .end(function () {}) // end is required otherwise hangs.
    })

    if (opts.handleNotFound === undefined || opts.handleNotFound === true) {
      init404(app, setHeaders)
    }

    // Must be last: https://stackoverflow.com/a/72680240
    app.use((err, req, res, next) => {
      handleError(err, req, res, next)
      log.error(err, false, 'errors', appLogDir)
    })

    cb(null)
  })

  function prepWhiteList (whiteListFiles, cb) {
    getFiles(whiteListFiles, (err, results) => {
      if (err) {
        log.error(err.message, false, 'errors', uiProxyLogDir)
        cb(err, null)
      }
      const whiteLists = []
      for (const [file, result] of Object.entries(results)) {
        if (result.error !== null) {
          log.warn(`Warning: Error reading ${file}\n  ${result.error}`)
        }
        whiteLists.push(processFile(result))
      }
      // Flatten array of arrays and remove duplicates
      const whiteListUnique = [...new Set(whiteLists.flat())]
      if (whiteListUnique.length === 0) {
        const msg = `Error when building whitelist from\n  ${whiteListFiles.join('\n  ')}\nNo valid files or URLs found.`
        log.error(msg, false, 'errors', uiProxyLogDir)
        cb(msg, null)
        return
      }
      cb(null, whiteListUnique)
    })

    function processFile (result) {
      if (result.error !== null) {
        return []
      }
      try {
        const whiteList = []
        const allObject = parseAllTxt(result.data.toString())
        for (const [serverID, serverAbout] of Object.entries(allObject)) {
          const url = serverAbout.url
          if (!url || !isValidUrl(url)) {
            continue
          }
          if (!url.endsWith('/hapi') || !url.endsWith('/hapi')) {
            // This will cause cdaweb.gsfc.nasa.gov/tmp to be dropped.
            // continue;
          }
          whiteList.push(url)
        }
        return whiteList
      } catch (e) {
        console.error(e)
        return []
      }
    }
  }
}

function isValidUrl (s) {
  // https://stackoverflow.com/a/55585593
  const URL = require('url').URL
  try {
    new URL(s)
    return true
  } catch (err) {
    return false
  }
}
