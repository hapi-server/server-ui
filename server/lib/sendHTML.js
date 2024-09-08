const fs = require('fs')

const log = require('log')

const setHeaders = require('./setHeaders.js')
const handleError = require('./handleError.js')

module.exports = sendHTML

function sendHTML (req, res, next, htmlFile, appLogDir) {
  log.debug(` Reading ${htmlFile}`)
  fs.readFile(htmlFile, 'utf8', (err, html) => {
    if (err) {
      log.error(err, false, 'errors', appLogDir)
      handleError(err, req, res, next)
      return
    }
    log.debug(` Read ${htmlFile}`)
    if (!html) {
      const err = new Error(`Error reading ${htmlFile}`)
      log.error(err, false, 'errors', appLogDir)
      handleError(err, req, res, next)
      return
    }
    setHeaders(res)
    res.send(html)
  })
}
