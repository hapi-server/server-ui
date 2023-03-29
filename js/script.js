function script() {

  let cclass = '';
  let ext = '';
  if (selected('format') === 'python') {
    cclass = 'python';
    ext = 'py';
  }
  if (selected('format') === 'javascript') {
    cclass = 'javascript';
    ext = 'html';
  }
  if (selected('format') === 'matlab') {
    cclass = 'matlab';
    ext = 'm';
  }
  if (selected('format') === 'autoplot') {
    cclass = 'python';
    ext = 'jy';
  }
  if (selected('format') === 'idl') {
    cclass = 'matlab';
    ext = 'pro';
  }
  if (selected('format') === 'curl') {
    cclass = 'curl';
    ext = 'sh';
  }
  if (selected('format') === 'wget') {
    cclass = 'wget';
    ext = 'sh';
  }

  $.ajax({
      type: "GET",
      url: "scripts/" + selected('format') + "." + ext,
      async: true,
      dataType: "text",
      success: function (data, textStatus, jqXHR) {
        process_(data);
      }
  });

  function process_(sText) {

    let email = servers.info[selected('server')]['contactEmail']
    sText = sText.replace(/CONTACT/gm,email);

    let selectedParameters = selected('parameters');

    function isDoubleByte(str) {
      // https://stackoverflow.com/a/148613
      for (var i = 0, n = str.length; i < n; i++) {
          if (str.charCodeAt( i ) > 255) { return true; }
      }
      return false;
    }

    let unicodeNote = " contains Unicode UTF-8. See https://github.com/hapi-server/client-matlab/blob/master/README.md#notes.";
    let unicodeNoteDataset = "";
    let unicodeNoteParameters = "";
    if (isDoubleByte(selected('dataset'))) {
        unicodeNoteDataset = "Dataset name" + unicodeNote;
    }
    if (isDoubleByte(selectedParameters)) {
        unicodeNoteParameters = "One or more parameters" + unicodeNote;
    }
    sText = sText.replace(/UNICODE_NOTE_DATASET/gm,unicodeNoteDataset);
    sText = sText.replace(/UNICODE_NOTE_PARAMETERS/gm,unicodeNoteParameters);

    let server = servers.info[selected('server')]['url']
    if (!server.startsWith("http")) {
      server = location.protocol + '//' + location.host + location.pathname + server;
    }
    sText = sText.replace(/SERVER/gm,server);
    sText = sText.replace(/DATASET/gm,selected('dataset'));
    sText = sText.replace(/PARAMETERS/gm,selectedParameters);

    let startDate = datasets.info[selected('dataset')]['info']['startDate'];
    let stopDate = datasets.info[selected('dataset')]['info']['stopDate'];
    sText = sText.replace(/STARTMIN/gm,startDate);
    sText = sText.replace(/STOPMAX/gm,stopDate);

    sText = sText.replace(/START/gm,selected('start'));
    sText = sText.replace(/STOP/gm,selected('stop'));

    let timename = parameters.list[0]['value'];
    sText = sText.replace(/TIMENAME/gm,timename);

    let p = parameters.list.slice(0); // copy 
    
    p.forEach((el,i) => {p[i] = el.value});
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
    showText(sText,cclass,ext);
  }
}