if (typeof module !== 'undefined') {
  module.exports = createScript;
}

function createScript(sText, opts) {

  sText = sText.replace(/CONTACT/gm,opts["contactEmail"]);

  function isDoubleByte(str) {
    // https://stackoverflow.com/a/148613
    for (let i = 0, n = str.length; i < n; i++) {
      if (str.charCodeAt(i) > 255) { return true; }
    }
    return false;
  }

  let unicodeNote = " contains Unicode UTF-8. See https://github.com/hapi-server/client-matlab/blob/master/README.md#notes.";
  let unicodeNoteDataset = "";
  let unicodeNoteParameters = "";
  if (isDoubleByte(opts["dataset"])) {
    unicodeNoteDataset = "Dataset name" + unicodeNote;
  }
  if (isDoubleByte(opts["parametersSelected"])) {
    unicodeNoteParameters = "One or more parameters" + unicodeNote;
  }
  sText = sText.replace(/UNICODE_NOTE_DATASET/gm,unicodeNoteDataset);
  sText = sText.replace(/UNICODE_NOTE_PARAMETERS/gm,unicodeNoteParameters);

  let server = opts["server"];
  if (!server.startsWith("http")) {
    server = location.protocol + '//' + location.host + location.pathname + server;
  }
  sText = sText.replace(/SERVER/gm,server);
  sText = sText.replace(/DATASET/gm,opts["dataset"]);
  sText = sText.replace(/PARAMETERS/gm,opts["parametersSelected"]);

  sText = sText.replace(/STARTMIN/gm,opts["startDateMin"]);
  sText = sText.replace(/STOPMAX/gm,opts["stopDateMax"]);

  sText = sText.replace(/START/gm,opts["startDate"]);
  sText = sText.replace(/STOP/gm,opts["stopDate"]);

  let p = opts["parametersList"];

  if (p.length == 1) {
      sText = sText.replace(/CSV_EXAMPLE/gm,'.');
  } else if (p.length == 2) {
      sText = sText.replace(/CSV_EXAMPLE/gm,
                              ", e.g., parameters='" 
                              + p.join(','));
  } else {
      sText = sText.replace(/CSV_EXAMPLE/gm,
                              ", e.g., parameters='" 
                              + p.slice(1,3).join(',') + "'");
  }
  return sText;
}
