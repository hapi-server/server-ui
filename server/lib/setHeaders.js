const packageJSON = require('../../package.json')

module.exports = setHeaders
function setHeaders (res, noCors) {
  res.header('X-Powered-By', packageJSON.repository.url + ' v' + packageJSON.version)
  if (noCors === false) {
    return
  }
  // CORS headers
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
}
