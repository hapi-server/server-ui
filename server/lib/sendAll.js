const fs = require('fs')

const log = require('log')

const setHeaders = require('./setHeaders.js')
const handleError = require('./handleError.js')

module.exports = sendAll

function sendAll (req, res, next, appLogDir, allFile) {
  log.debug(` Reading ${allFile}`)
  fs.readFile(allFile, 'utf8', (err, data) => {
    if (err) {
      log.error(err, false, 'errors', appLogDir)
      err = new Error('Error reading all.txt')
      handleError(err, req, res, next)
      return
    }
    log.debug(` Read ${allFile}`)
    setHeaders(res)
    res.send(data)
  })
}
