let path = require('path');
let getFiles = require('./getFiles.js');

let testURL = "https://hapi-server.org/all.txt";
let testFile = path.join(__dirname, "getFilesTest.js");

let inputArrays = [
          [testURL + "x"],
          [testURL],
          [testURL,testURL],
          [testFile],
          [testFile + "x"],
          [testFile,testFile],
          [testURL,testFile]
];

run(inputArrays);

function checkResults(results) {
  console.log(results);
}

function run(inputArrays) {

  function finished(results,idx) {
    if (!finished.results) {
      finished.results = [];
      finished.nCompleted = 0;
    }
    finished.nCompleted += 1;
    finished.results[idx] = results;
    if (finished.nCompleted === inputArrays.length) {
      checkResults(finished.results);
    }
  }

  for (let [idx, files] of Object.entries(inputArrays)) {
    getFiles(files,
      (err, obj) => {
        if (err) {
          console.error(err);
          process.exit(1);
        }
        finished(obj,idx);
    });
  }
}