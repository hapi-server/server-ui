const fs = require('fs')
const path = require('path')

const log = require('log')

const setHeaders = require('./setHeaders.js')
const handleError = require('./handleError.js')

const getFiles = require('./getFiles.js')
const createScript = require('../../js/shared/createScript.js')
const parseAllTxt = require('../../js/shared/parseAllTxt.js')
const defaultDate = require('../../js/shared/defaultDate.js')
const _scriptList = require('../../scripts/_scriptList.js')

module.exports = { file, options }

function file (req, res, next, appLogDir) {
  // http://localhost:8002/?server=TestData&dataset=dataset1&return=script

  list(req.query.format, (err, knownScripts, scriptFile) => {
    if (err) {
      log.error(err, false, 'errors', appLogDir)
      err = new Error('Error reading list of know scripts.')
      handleError(err, req, res, next)
      return
    }
    if (scriptFile === null) {
      let msg = 'Bad request. <code>format</code> must be one of\n'
      msg += `<pre>\n ${knownScripts.join('\n ')}\n</pre>`
      res.status(400).send(msg)
      return
    }

    log.debug('Getting https://hapi-server.org/all.txt')
    const allURL = 'https://hapi-server.org/all_.txt'
    getFiles(allURL, (err, result) => {
      if (err) {
        log.error(err, false, 'errors', appLogDir)
        err = new Error(`Error reading ${allURL}.`)
        handleError(err, req, res, next)
        return
      }

      log.debug('Got https://hapi-server.org/all_.txt')
      const allObj = parseAllTxt(result.data.toString())
      const serverObj = allObj[req.query.server]
      if (!serverObj) {
        res.status(400).send(`server with ID = '${req.query.server}' not found in ${allURL}`)
        return
      }

      // Should check here that dataset exists with a /catalog request.
      const infoURL = `${serverObj.url}/info?id=${req.query.dataset}`
      log.debug(`Getting ${infoURL}`)
      getFiles(infoURL, (err, result) => {
        log.debug(`Got ${infoURL}`)
        if (err) {
          log.error(err, false, 'errors', appLogDir)
          const msg = `Error reading ${infoURL}, which is needed to generate response.`
          err = new Error(msg)
          handleError(err, req, res, next)
          return
        }

        const infoResponse = JSON.parse(result.data.toString())
        const parametersList = []
        for (const parameter of infoResponse.parameters) {
          parametersList.push(parameter.name)
        }

        const opts = {
          server: serverObj.url,
          dataset: req.query.dataset,
          parametersList,
          parametersSelected: req.query.parameters || '',
          startDate: infoResponse.startDate,
          stopDate: defaultDate.stop(infoResponse),
          startDateMin: infoResponse.startDate,
          stopDateMax: infoResponse.stopDate,
          contactEmail: infoResponse.contactEmail
        }

        log.debug(`Reading ${scriptFile}`)
        fs.readFile(scriptFile, 'utf8',
          (err, scriptTemplate) => {
            if (err) {
              log.error(err, false, 'errors', appLogDir)
              err = new Error('Could not create script')
              handleError(err, req, res, next)
              return
            }
            log.debug(`Read ${scriptFile}`)
            setHeaders(res)
            res.header('Content-Type', 'text/plain; charset=utf-8')
            const script = createScript(scriptTemplate, opts)
            res.send(script)
          })
      })
    })
  })
}

function options (req, res, next, appLogDir) {
  setHeaders(res)
  res.header('Content-Type', 'application/json')
  res.send(JSON.stringify(_scriptList(), null, 2))
}

function list (requested, cb) {
  const knownScripts = []
  const scriptPath = path.join(__dirname, '..', '..', 'scripts')
  fs.readdir(scriptPath, (err, files) => {
    if (err) {
      cb(err, null)
      return
    }
    for (const file of files) {
      const fileBase = path.parse(file).name
      knownScripts.push(fileBase)
      if (requested === fileBase) {
        cb(null, null, path.join(scriptPath, file))
        return
      }
    }
    cb(null, knownScripts, null)
  })
}
