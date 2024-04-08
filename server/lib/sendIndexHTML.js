const fs = require('fs')

const log = require('log')

const setHeaders = require('./setHeaders.js')
const handleError = require('./handleError.js')

module.exports = sendHTML

function sendHTML (req, res, next, appLogDir, opts) {
  log.debug(` Reading ${opts.indexHTMLFile}`)
  fs.readFile(opts.indexHTMLFile, 'utf8', (err, html) => {
    if (err) {
      log.error(err, false, 'errors', appLogDir)
      handleError(err, req, res, next)
      return
    }
    log.debug(` Read ${opts.indexHTMLFile}`)
    if (!html) {
      const err = new Error(`Error reading ${opts.indexHTMLFile}`)
      log.error(err, false, 'errors', appLogDir)
      handleError(err, req, res, next)
      return
    }
    if (!html.trim().startsWith('<')) {
      const err = new Error(`${indexFile}.trim() does not start with '<'. File is not HTML.`)
      log.error(err, false, 'errors', appLogDir)
      handleError(err, req, res, next)
      return
    }

    if (opts.verifier) {
      log.debug(`  Replacing __VERIFIER__ with ${opts.verifier}`)
      html = html.replace(/__VERIFIER__/g, opts.verifier)
    }
    if (opts.plotServer) {
      log.debug(`  Replacing __PLOTSERVER__ with ${opts.plotServer}`)
      html = html.replace(/__PLOTSERVER__/g, opts.plotServer)
    }
    if (opts.proxyServer) {
      log.debug(`  Replacing __PROXYSERVER__ with ${opts.proxyServer}`)
      html = html.replace(/__PROXYSERVER__/g, opts.proxyServer)
    }
    log.debug('  Replacing __SERVER_LIST__ with all.txt')
    html = html.replace(/__SERVER_LIST__/g, 'all.txt')

    setHeaders(res)
    res.send(html)
  })
}
