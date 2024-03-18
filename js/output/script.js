function script() {

  let cclass = ''; // Syntax highlight class
  let ext = '';    // Script filename extension

  if (selected('format').startsWith('python')) {
    cclass = 'python';
    ext = 'py';
  }
  if (selected('format').startsWith('javascript')) {
    cclass = 'javascript';
    ext = 'html';
  }
  if (selected('format').startsWith('matlab')) {
    cclass = 'matlab';
    ext = 'm';
  }
  if (selected('format') === 'autoplot') {
    cclass = 'python';
    ext = 'jy';
  }
  if (selected('format').startsWith('idl')) {
    cclass = '';
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

  let opts = {
    "server": servers.info[selected('server')]['url'],
    "dataset": selected('dataset'),
    "parametersList": Object.keys(parameters.info),
    "parametersSelected": selected('parameters'),
    "startDate": selected('start'),
    "stopDate": selected('stop'),
    "startDateMin": datasets.info[selected('dataset')]['info']['startDate'],
    "stopDateMax": datasets.info[selected('dataset')]['info']['stopDate'],
    "contactEmail": servers.info[selected('server')]['contactEmail']
  }

  $.ajax({
      type: "GET",
      url: "scripts/" + selected('format') + "." + ext,
      async: true,
      dataType: "text",
      success: function (data, textStatus, jqXHR) {
        let scriptText = createScript(data, opts);
        showText(scriptText,cclass,ext);
      }
  });

  function showText(sText,cclass,ext) {

    $('#scriptcopy > button').attr("data-clipboard-text",sText);
    $('#scriptcopy').show();

    var clipboard = new ClipboardJS('.btn');
    clipboard.on('success', function () {
        util.log('Copied script to clipboard.');
        $('#copied').tooltipster('open');
        setTimeout(() => $('#copied').tooltipster('close'), 800);
    });

    let type = "script";
    let fname = 'demo';
    if (ext === 'json') {
        type = 'json';
        fname = 'hapi';
    }

    let w = $("#infodiv").width()-15

    // Common browser bug: &param is interpreted as &para;m (¶m)
    if (!["wget","curl"].includes(selected('format'))) {
        sText = sText.replace('&param','&amp;param');
    }
    $('#script').addClass(cclass);
    $("#script").text(sText);

    $("#scripttext > pre").show();

    let blob = new Blob([sText], {type: 'octet/stream'});
    let scriptFile = window.URL.createObjectURL(blob);
    //let scriptFile = 'data:text/plain;base64;charset=utf-8,' + btoa(sText);

    //https://stackoverflow.com/a/30139435
    var el = document.createElement('a');
    el.setAttribute('href', scriptFile);
    el.setAttribute('download', fname + "." + ext);

    if (showText.scriptFile) {
      // https://developer.mozilla.org/en-US/docs/Web/API/URL/revokeObjectURL
      // Remove previous reference (frees memory)
      window.URL.revokeObjectURL(scriptFile);
    }
    showText.scriptFile = scriptFile;

    $("#downloadlink").empty().append(el).show();
    $("#downloadlink > a")
        .html('Download ' + type)
        .css('font-weight', 'bold');

    hljs.highlightBlock(document.getElementById("script"));

    //html.scrollIntoView('script-details');
    $('#output details').attr('open',false);
    $("#script-details").show().attr('open',true);

  }

}
