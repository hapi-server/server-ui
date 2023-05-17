function showText(sText,cclass,ext) {

  $('#scriptcopy > button').attr("data-clipboard-text",sText);
  $('#scriptcopy').show();

  var clipboard = new ClipboardJS('.btn');
  clipboard.on('success', function () {
      log('Copied script to clipboard.');
      $('#copied').tooltipster('open');
      setTimeout(() => $('#copied').tooltipster('close'), 800);
  });

  let type = "script";
  let fname = 'demo';
  if (ext === 'json') {
      type = 'json';
      fname = 'hapi';
  }

  let h = '100%';
  if (type === 'json') {
      h = $(window).height()/2;
  }                   
  let w = $("#infodiv").width()-15
  $("#scripttext")
      .empty()
      .append("<pre class='text'></pre>")
      .show()
  
  // Common browser bug: &param is interpreted as &para;m: ¶m
  if (!["wget","curl"].includes(selected('format'))) {
      sText = sText.replace('&param','&amp;param');
  }
  $("#scripttext > pre").append("<code id='script' class='" + cclass + "'></code>");
  $("#script").text(sText);

  $("#scripttext > pre")
      .height(h)
      .show();

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

  document
      .querySelectorAll('pre code')
      .forEach((block) => {hljs.highlightBlock(block);});
  $("#output").show();
}
