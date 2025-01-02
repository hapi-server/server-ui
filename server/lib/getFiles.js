let fs
if (typeof exports !== 'undefined') {
  fs = require('fs')
  module.exports = getFiles
}

function getFiles (files, options, cb) {
  const debug = false
  let log = function () {}
  if (debug === true) {
    log = console.log
  }

  if (!cb && typeof options === 'function') {
    cb = options
    options = {}
  }

  log(`getFiles(): files = ${files.toString()}`)

  if (typeof exports !== 'undefined') {
    fetch = require('node-fetch-native')
  }

  let returnArray = true
  if (typeof (files) === 'string') {
    returnArray = false
    files = [files]
  }

  if (files.length === 0) {
    const err = new Error('No files to read.')
    cb(err, null)
    return
  }

  if (!cb && options) {
    cb = options
    options = {}
  }

  for (const [i, file] of Object.entries(files)) {
    if (typeof file !== 'string') {
      const err = new TypeError("Array elements of 'files' must strings. Element " + i + ' is a ' + typeof (file) + '.')
      cb(err, null)
    }
    getFile(file, cb)
  }

  function finished (err, file, data, metadata, status) {
    if (finished.nCompleted === undefined) {
      finished.nCompleted = 0
      finished.results = {}
    }

    finished.results[file] = {}
    finished.nCompleted = finished.nCompleted + 1
    finished.results[file].error = err
    finished.results[file].data = data
    finished.results[file].metadata = metadata
    finished.results[file].status = status

    if (finished.nCompleted === files.length) {
      if (cb) {
        try {
          if (returnArray === false) {
            cb(null, finished.results[file])
          } else {
            cb(null, finished.results)
          }
        } catch (e) {
          console.error(e)
          throw e
        }
      }
    }
  }

  function getFile (file) {
    let isFile = false
    if (fs !== undefined) {
      if (fs.existsSync(file)) {
        isFile = true
      }
    }

    if (file.startsWith('http') || !isFile) {
      log(`Fetching: ${file}`)

      const body = null
      let headers = null
      let status = -1
      let fetchFinished = false
      let contentType = null
      const textMimeTypes = ['json', 'text', 'xml']

      fetch(file)
        .then(function (res) {
          if (res.status) {
            status = res.status
          }
          if (res.headers) {
            headers = res.headers
            if (headers.get('content-type')) {
              contentType = headers.get('content-type')
            }
            log(`fetch.then: content-type = ${contentType}`)
          }

          let isTextMimeType = false
          if (contentType) {
            for (const textMimeType of textMimeTypes) {
              if (contentType.includes(textMimeType)) {
                isTextMimeType = true
                break
              }
            }
          }
          if (isTextMimeType === true) {
            log('fetch.then: returning res.text()')
            return res.text()
          } else {
            log('fetch.then: returning res.arrayBuffer()')
            return res.arrayBuffer()
          }
        })
        .then(function (body) {
          if (status === 200) {
            finished(null, file, body, headers, status)
          } else {
            finished('Non-200 HTTP status', file, body, headers, status)
          }
        })
        .catch(function (err) {
          log(err)
          if (fetchFinished === true) {
            log('fetch.catch1: Finished was already called.')
            return
          }
          fetchFinished = true
          log(`fetch.catch1: Status = ${status} for ${file}`)
          log('fetch.catch1: Calling finished from fetch.catch1')
          if (status === -1) {
            err = new Error('Could not read or fetch ' + file + '. ')
          }
          finished(err, file, body, headers, status)
        })
        .catch(function (err) {
          log('Second catch in fetch')
          log(err)
          console.error(err)
          cb(err, null)
        })
    } else {
      log('Reading ' + file + '.')
      fs.readFile(file, function (err, data) {
        if (err) {
          log('Could not read ' + file)
          finished(err, file, null, null, 404)
        } else {
          fs.stat(file, function (err, metadata) {
            if (err) {
              log('Could not read metadata for ' + file)
              finished(err, file, data, null, 200)
            } else {
              log('Read ' + file + '.')
              finished(null, file, data, metadata, 200)
            }
          })
        }
      })
    }
  }
}
