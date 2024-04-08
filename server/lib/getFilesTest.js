const path = require('path')
const getFiles = require('./getFiles.js')

const testURL = 'https://hapi-server.org/all.txt'
const testFile = path.join(__dirname, 'getFilesTest.js')

const inputArrays = [
  [testURL + 'x'],
  [testURL],
  [testURL, testURL],
  [testFile],
  [testFile + 'x'],
  [testFile, testFile],
  [testURL, testFile]
]

run(inputArrays)

function checkResults (results) {
  console.log(results)
}

function run (inputArrays) {
  function finished (results, idx) {
    if (!finished.results) {
      finished.results = []
      finished.nCompleted = 0
    }
    finished.nCompleted += 1
    finished.results[idx] = results
    if (finished.nCompleted === inputArrays.length) {
      checkResults(finished.results)
    }
  }

  for (const [idx, files] of Object.entries(inputArrays)) {
    getFiles(files,
      (err, obj) => {
        if (err) {
          console.error(err)
          process.exit(1)
        }
        finished(obj, idx)
      })
  }
}
