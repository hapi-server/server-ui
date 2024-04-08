const path = require('path')
const log = require('log')

module.exports = init404
function init404 (app, setHeaders) {
  const serverLogDir = path.join(log.logDir, 'ui-server')

  log.info('Setting up 404 handler.')
  app.get('/*', function (req, res) {
    res.on('finish', () => log.request(req, 'requests', serverLogDir))
    // If no other route is matched, return 404.
    if (setHeaders) setHeaders(res, false)
    log.debug('GET 404 ' + req.originalUrl)
    res.status(404).send('Not found')
  })
}
