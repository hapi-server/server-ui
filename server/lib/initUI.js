const path = require('path')
const express = require('express')
const serveIndex = require('serve-index')

const log = require('log')

const init404 = require('./init404.js')
const setHeaders = require('./setHeaders.js')
const handleError = require('./handleError.js')

const sendAll = require('./sendAll.js')
const sendHTML = require('./sendHTML.js')
const sendScript = require('./sendScript.js')
const sendIndexHTML = require('./sendIndexHTML.js')

module.exports = initUI

/*
 * Initialize the UI.
 *
 * @param {Object} app - Express app.
 * @param {Object} opts - Options.
 * @param {string} opts.indexHTMLFile - Path to the index.html file.
 * @param {string} opts.verifier - The URL of a verifier server.
 * @param {string} opts.plotServer - The URL of a plot server .
 * @param {string} opts.allFile - Path to an all.txt file.
 * @param {Object} opts.log - Log object.
 * @param {string} opts.logDir - Path to the log directory.
 */
function initUI (app, opts) {
  log.debug(`Log directory: '${log.logDir}'`)
  const appLogDir = path.join(log.logDir, 'ui-app')
  const serverLogDir = path.join(log.logDir, 'ui-server')
  log.debug(`App log directory: '${appLogDir}'`)
  log.debug(`Server log directory: '${serverLogDir}'`)

  // Work-around of https://github.com/expressjs/serve-index/issues/90
  app.use(function (req, res, next) {
    if (req.headers.referer) {
      let pathNameReferer = new URL(req.headers.referer).pathname
      if (pathNameReferer.endsWith('/')) {
        pathNameReferer = pathNameReferer.slice(0, -1)
      }
      req.originalUrl = pathNameReferer + req.url
    }
    // If no referer in header, links will be wrong in dir listings if reverse
    // proxy is used to this app and root in reverse proxy is not / because
    // absolute are used in the hrefs.
    next()
  })

  // Serve static files staticFileDirs.
  const staticFileDirs = ['css', 'js', 'scripts', 'examples', 'log/ui-app']
  const baseDir = path.normalize(path.join(__dirname, '..', '..'))
  log.info('Setting static directory endpoints:')
  for (const dir of staticFileDirs) {
    const dirFull = path.join(baseDir, dir)
    log.info(` /${dir} => ${dirFull}`)
    app.use('/' + dir, express.static(dirFull, { setHeaders }), serveIndex(dirFull, { icons: true })
    )
  }

  if (opts.allFile) {
    log.info(`Setting /all.txt endpoint to serve ${opts.allFile}`)
    app.get('/all.txt', function (req, res, next) {
      res.on('finish', () => log.request(req, 'requests', serverLogDir))
      log.debug('Request for /all.txt')
      sendAll(req, res, next, appLogDir, opts.allFile)
    })
  }

  log.info('Setting /hashchange endpoint')
  app.get('/hashchange', function (req, res) {
    res.on('finish', () => log.request(req, 'requests', serverLogDir))
    const msg = `${req.query.hash}`
    log.debug(`Request for /hashchange: ${msg}`)
    log.write(msg, 'hashchange', appLogDir)
    res.end()
  })

  log.info('Setting /error endpoint')
  app.get('/error', function (req, res) {
    res.on('finish', () => log.request(req, 'requests', serverLogDir))
    const msg = `${req.query.hash} ` +
                `| ${req.query.fileName}L#${req.query.lineNumber} ` +
                `| '${req.query.message}'`
    log.debug(`Request for /error: ${msg}`)
    log.write(msg, 'errors', appLogDir)
    res.end()
  })

  app.get('/api', function (req, res, next) {
    res.on('finish', () => log.request(req, 'requests', serverLogDir))
    log.debug('Request for /api')
    sendHTML(req, res, next, path.join(__dirname, '..', 'api.html'), appLogDir)
  })

  log.info(`Setting / endpoint to serve ${path.normalize(opts.indexHTMLFile)}`)

  app.get('/$', function (req, res, next) {
    res.on('finish', () => log.request(req, 'requests', serverLogDir))
    log.debug('Request for /')

    if (Object.keys(req.query).length !== 0) {
      if (req.query.return === 'script-options') {
        sendScript.options(req, res, next, appLogDir)
      }
      if (req.query.server && req.query.dataset) {
        if (req.query.return === 'script' && req.query.format !== undefined) {
          sendScript.file(req, res, next, appLogDir, req.query.return)
        } else {
          const msg = '<code>format</code> query parameter is required.'
          res.status(400).send(msg)
          return
        }
      } else {
        const msg = '<code>server</code> and <code>dataset</code> query parameters are required.'
        res.status(400).send(msg)
        return
      }
    }

    if (Object.keys(req.query).length === 0) {
      sendIndexHTML(req, res, next, appLogDir, opts)
    }
  })

  if (opts.handleNotFound === undefined || opts.handleNotFound === true) {
    init404(app, setHeaders)
  }

  // Must be last: https://stackoverflow.com/a/72680240
  app.use((err, req, res, next) => {
    handleError(err, req, res, next)
    log.error(err, false, 'errors', appLogDir)
  })
}
