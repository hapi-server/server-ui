function plot(selectedParameter, cb) {

  // TODO: Check plotserver is known.

  let plotserver = selected('format');
  let format = selected('style');

  let plotServer = window["HAPIUI"]["options"]['hapiplot'];

  if (/^[a-z].*?:http/.test(plotserver)) {
    plotServer = plotserver.split(plotserver + ":")[1];
    plotserver = plotserver.split(":")[0];
  } else if (/^http/.test(plotserver)) {
    // If bare URL, assume hapiplot server
    plotserver = "hapiplot";
    plotServer = window["HAPIUI"]["options"]['hapiplot'];
  } else {
    if (plotserver === "") {
      plotserver = "hapiplot";
      plotServer = window["HAPIUI"]["options"]['hapiplot'];
    }
    if (plotserver === 'hapiplot') {
      plotServer = window["HAPIUI"]["options"]['hapiplot'];
    }
    if (plotserver === 'autoplot') {
      plotServer = window["HAPIUI"]["options"]['autoplot'];
    }
    if (plotserver === 'cdaweb') {
      plotserver = 'cdaweb';
      plotServer = window["HAPIUI"]["options"]['cdawebplot'];
    }
  }

  let parentElementId = `plot-details-${selectedParameter}-${plotserver}`;

  util.log("plot(): plotserver = " + plotserver + ", plotServer = " + plotServer);

  let hapiServer = servers.info[selected('server')]['url'];
  if (!hapiServer.startsWith("http")) {
    hapiServer = location.origin + location.pathname + hapiServer;
  }

  function isLocalURL(url) {
    let urlObj = new URL(url);
    return urlObj.host.startsWith("localhost") || urlObj.host.startsWith("127");
  }

  let url = "";

  if (plotserver === 'cdaweb') {
    let start = util.doy2ymd(selected('start'));
    let stop = util.doy2ymd(selected('stop'));
    start = dayjs(start).toISOString().replace(/:|-/g,"").replace(/\.[0-9].*Z/,"Z");
    stop = dayjs(stop).toISOString().replace(/:|-/g,"").replace(/\.[0-9].*Z/,"Z");
    let xurl = `${plotServer}/${selected('dataset')}/data/${start},${stop}/${selectedParameter}?format=${format}`;

    if (Object.keys(parameters.info)[0] === selectedParameter) {
      let msg = 'Plotting only time parameter is not supported by CDAWeb plot server.';
      prepDOM();
      finalizeDOM(msg, xurl);
      return;
    }
    if (selectedParameter === '') {
      let msg = 'Plotting all parameters using CDAWeb not yet supported by this interface.';
      prepDOM();
      finalizeDOM(msg, xurl);
      return;
    }

    util.log("plot(): Requesting " + xurl);

    let timerOptions = {'element': `#${parentElementId} #imageRequestTiming`};
    let timerId = timer(url, timerOptions);
    if (timerId === null) {
      util.log("plot.setImage(): Returning because image already being set with url = " + url);
      util.log("plot.setImage(): Check for redundant requests.");
      return;
    }

    $.ajax(
      {
        type: "GET",
        url: xurl,
        async: true,
        dataType: "xml",
        cache: false, // Response is to a temp file, so don't cache as temp file may change.
        success: function (xml, textStatus, jqXHR) {
          timer(timerId, "stop");
          let msg = $(xml).find('Error').text();
          if (msg) {
            finalizeDOM(msg, xurl);
          }
          util.log("plot(): Received " + xurl);
          url = $(xml).find('Name').text();
          util.log("plot(): Referenced URL: " + url);
          if (format === 'pdf') {
            // Proxy is required b/c of iframe restrictions in headers.
            let proxyURL = window["HAPIUI"]["options"]["proxy"];
            url = proxyURL + encodeURIComponent(url);
            util.log(`plot(): Using proxy for PDF: ${url}`)
          }
          setImage(url);
        },
        error: function (xhr, textStatus, errorThrown) {
          timer(timerId, "stop");
          finalizeDOM(errorThrown, xurl);
        }
      });
  }

  if (plotserver === 'hapiplot') {
    url = plotServer + "?"
        + "server=" + hapiServer
        + "&dataset=" + selected('dataset')
        + "&parameters=" + selectedParameter
        + "&start=" + selected('start')
        + "&stop=" + selected('stop')
        + "&format=" + format
        + "&usecache=" + $("#useimagecache").prop('checked')
        + "&usedatacache=" + $("#usedatacache").prop('checked');
    setImage(url);
  }

  if (plotserver === 'autoplot') {
    url = "vap+hapi:" + hapiServer + "?id=";
    url = url + `${selected('dataset')}&parameters=${selectedParameter}&timerange=${selected('start')}/${selected('stop')}`;
    url = plotServer + "?url=" + encodeURIComponent(url);

    if (format === 'svg') {
      format = "image/svg+xml";
    }
    if (format === 'pdf') {
      format = "application/pdf";
    }

    let width = $("#infodiv").width()-15;
    let height = Math.round(width*3./7.)
    let config = {
      "format": format,
      "width": width,
      "height": height,
      "font": "sans-18",            // What are options?
      "autolayout": true,
      "column": "6.5em,100%-2.5em", // Left gap, right gap
      "row": "3em,100%-3em",        // Top gap, bottom gap
      "process": "",                // histogram, magnitude(fft)
      "renderType": "",             // spectrogram, series, scatter, stairSteps, fill_to_zero
      "symbolSize": "",
      "color": "#0000ff",
      "fillColor": "#aaaaff",
      "foregroundColor": "#000000",
      "backgroundColor": "#ffffff"
    }
    let configa = [];
    for (let [key, val] of Object.entries(config)) {
      configa.push(key + "=" + encodeURIComponent(val));
    }
    url = url + "&" + configa.join("&");
    setImage(url);
  }

  function setImage(url) {

    function finished(err) {
      if (err) {
        util.log("plot.setImage(): Image load error: ");
        console.error(err);
      } else {
        util.log("plot.setImage(): Image loaded: " + url);
      }
      timer(timerId, "stop");
      finalizeDOM(err, url);
      if (cb) cb(err, url);
    }

    util.log("plot.setImage(): Request to set image with url = " + url);

    let timerOptions = {'element': `#${parentElementId} #imageRequestTiming`};
    let timerId = timer(url, timerOptions);
    if (timerId === null) {
      util.log("plot.setImage(): Returning because image already being set with url = " + url);
      util.log("plot.setImage(): Check for redundant requests.");
      return;
    }

    if (plot.warningShown === undefined) {
      if (isLocalURL(hapiServer) && !isLocalURL(plotServer) && plotserver !== 'cdaweb') {
        let msg = `Data server hostname is local (${new URL(hapiServer).host}) and `;
        msg += `plot server hostname is not local (${new URL(plotServer).host}). `;
        msg += "Plot requests may fail.";
        let warningEl = `#${parentElementId} #plotRequestWarning`;
        $(warningEl).empty().hide();
        $(warningEl).html(msg).show();
        setTimeout(() => $(warningEl).empty().hide(), 2000);
        plot.warningShown = true;
      }
    }

    prepDOM();

    if (format !== 'pdf') {

      // Because we use an id based on parameter, name, calling script can
      // request an image with an invalid URL such that plot server returns a 502.
      // In this case, image for bad URL is set, but then another request for valid URL
      // may overwrite. As a result, the .error will not be triggered for the
      // bad URL and the timer will continue to run. Would need to have parentElementId
      // to include a hash of the URL to prevent this. 
      util.log("plot.setImage(): Setting image with url = " + url);
      $(`#${parentElementId} #image`).append(`<img></img>`);
      $(`#${parentElementId} img`)
        .attr('src', url)
        .load(() => {
          finished();
        }).error((err) => {
          $(`#${parentElementId} img`).remove();
          // https://stackoverflow.com/questions/41958664/catch-an-image-specific-error-in-javascript
          // Would need to use an AJAX call get the actual error. The error
          // shows up in console, but does not seem to be available here.
          finished("Could not set image.");
        });

      if (format === 'svg') {
        $(`#${parentElementId} img`).width($("#infodiv").width());
      }

    } else {
      let w = $("#infodiv").width();
      // TODO: Determine aspect ratio based on request params.
      let h = w/2.1;
      // TODO: Image inside iframe will be zoomed when browser content
      // is zoomed. Undo this zoom? Use this to determine zoom:
      // https://codepen.io/reinis/pen/RooGOE ?

      // Note that we can't catch error if iframe fails to load.
      // See technique in BiEdit.
      $(`#${parentElementId} #image`).append(`<iframe width='${w}' height='${h}'></iframe>`);
      $(`#${parentElementId} iframe`)
        .attr('frameborder', 0)
        .attr('scrolling', 'no')
        .attr('src', url)
        .attr('src', url + '#view=Fit&toolbar=0&scrollbar=0')
        .load(() => {
          finished();
        });
      }

  }

  function prepDOM() {
    $(`#${parentElementId} #plotRequestError`).empty().hide();
    let clone = $('#plot-details').clone().prop('id',parentElementId);

    // Remove existing element (will exist if plot of png and then plot of svg selected)
    $(`#${parentElementId}`).remove();

    // Append new details element containing plot.
    $('#plot-details').after(clone);

    let summary = $(`#${parentElementId} #plot-summary`).html();
    $(`#${parentElementId} #plot-summary`).html(`${summary} of <code>${selectedParameter}</code> using <code>${plotserver}</code> plot server.`);
  }

  function finalizeDOM(err, url) {

    $('#output details').attr('open',false);
    $(`#${parentElementId}`).show().attr('open',true)

    if (err) {
      let msg = `Error when requesting ${html.aLink(url,'image')}: ${err}`;
      $(`#${parentElementId} #plotRequestError`).html(msg).show();
      return;
    }

    //html.scrollIntoView(`${parentElementId}`);

    html.downloadLink(url, 'plot', `#${parentElementId} #plot-downloadlink`);

    let format = selected('style');
    let plotserver = selected('plotserver');
    if (/png|svg/.test(format) && plotserver !== 'cdaweb') {
      url = url.replace(`format=${format}`, 'format=gallery');
      let galleryHTML = "&nbsp;|&nbsp;"
                      + "<span>View more in gallery:&nbsp;" 
                      + html.aLink(url + "&mode=thumb", "&#9638;&nbsp;Thumbnails", true)
                      + "&nbsp;|&nbsp;"
                      + html.aLink(url, "&#9707;&nbsp;Filmstrip", true)
                      + "</span>";

      $(`#${parentElementId} #plot-downloadlink`).append(galleryHTML).show();
    }
  }
}
