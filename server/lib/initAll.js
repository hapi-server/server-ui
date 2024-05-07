const path = require('path')

const log = require('log')

const getFiles = require('./getFiles.js')

const init404 = require('./init404.js')
const handleError = require('./handleError.js')
const setHeaders = require('./setHeaders.js')

module.exports = initAll
function initAll (app, opts) {
  log.debug('Log directory: ' + log.logDir)
  const appLogDir = path.join(log.logDir, 'ui-app')
  const uiProxyLogDir = path.join(log.logDir, 'ui-proxy')
  log.debug(`App log directory: '${appLogDir}'`)
  log.debug(`Server log directory: '${uiProxyLogDir}'`)

  const allFiles = checkInput(opts.allFiles ? opts.allFiles : [], 'allFiles')
  const allArray = checkInput(opts.allArray ? opts.allArray : [], 'allArray')
  log.debug(`allFiles: ${JSON.stringify(allFiles)}`)
  log.debug(`allArray: ${JSON.stringify(allArray)}`)

  if (allFiles.length === 0 && allArray.length === 0) {
    const err = new TypeError('At least one of allFiles and allArray must be non-empty.')
    console.error(err)
    process.exit(1)
  }

  app.get('/all.txt', function (req, res) {
    res.on('finish', () => log.request(req, 'requests', uiProxyLogDir))
    log.info('Request for /')
    setHeaders(res)

    if (allFiles.length === 0) {
      log.debug(`allFiles is empty. Using allArray: ${allArray.join(';')}`)
      res.send(allArray.join('\n'))
      return
    }

    log.debug(` Reading ${allFiles.join(' \n')}`)
    getFiles(allFiles,
      (err, results) => {
        if (err) {
          log.error(err, false, 'errors', uiProxyLogDir)
          res.status(500).send('Error reading files needed to generate response.')
          return
        }
        processFileResponses(results, (err, all) => {
          if (err) {
            log.error(err, false, 'errors', uiProxyLogDir)
            res.status(500).send('Error reading files needed to generate response.')
            return
          }
          all += allArray.join('\n')
          // Remove duplicates.
          all = [...new Set(all.split('\n'))]
          // Remove comments
          // all = all.filter((line) => !line.startsWith("#")).join("\n");
          log.debug(' Sending all.txt using allFiles and allArray.')
          res.send(all.join('\n'))
        })
      })
  })

  if (opts.handleNotFound === undefined || opts.handleNotFound === true) {
    init404(app, setHeaders)
  }

  // Must be last: https://stackoverflow.com/a/72680240
  app.use((err, req, res, next) => {
    handleError(err, req, res, next)
    log.error(err, false, 'errors', appLogDir)
  })

  function checkInput (array, name) {
    if (array && !Array.isArray(array)) {
      const msg = `${name} must be an array.`
      log.error(msg, true, 'errors-ui', appLogDir)
    }
    return array
  }

  function processFileResponses (results, cb) {
    if (!processFileResponses.allLast) {
      processFileResponses.allLast = {}
    }

    const allArray = []
    let noSuccess = true
    try {
      for (const [file, result] of Object.entries(results)) {
        if (result.error) {
          log.warn(` Error reading ${file}:\n  ${result.error}.`)
          if (processFileResponses.allLast[file] !== undefined) {
            noSuccess = false
            log.warn(` Using last successful response for ${file}.`)
            const lastDate = processFileResponses.allLast[file].date
            const allObj = {
              comment: `From cache of ${file} on ${lastDate}`,
              date: lastDate,
              data: processFileResponses.allLast[file].data
            }
            allArray.push(allObj)
          } else {
            log.warn(` No last successful response for ${file}.`)
          }
        } else {
          noSuccess = false
          log.info(` Read ${file}.`)
          const allObj = {
            comment: `From ${file} on ${new Date().toISOString()}`,
            date: new Date().toISOString(),
            data: result.data.toString().trim()
          }
          allArray.push(allObj)
          processFileResponses.allLast[file] = allObj
        }
      }
      if (noSuccess) {
        cb('No successful reads.', null)
        return
      }

      let allText = ''
      for (const allObj of allArray) {
        allText += '# ' + allObj.comment + '\n' + allObj.data + '\n'
      }
      cb(null, allText)
    } catch (err) {
      cb(err, null)
    }
  }
}
