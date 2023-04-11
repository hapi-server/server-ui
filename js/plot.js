function plot(method, set) {

  // TODO: Check method is known.

  let selectedParameters = selected('parameters');

  let plotserver = parseQueryString()['plotserver'];
  if (!plotserver) {
    plotserver = $('#plotserver').val();
  }

  if (!method && !/^http/.test(plotserver)) {
    method = plotserver;
  }
  if (method) {
    // Override what is in URL or text box.
    if (method.trim() === 'hapiplot') {
      plotserver = OPTIONS['hapiplot'];
    }
    if (method.trim() === 'autoplot') {
      plotserver = OPTIONS['autoplot'];
    }
  }
  if (/^[a-z].*?:http/.test(plotserver)) {
    method = plotserver.split(":")[0];
    plotserver = plotserver.split(":")[1];
  }

  let SERVER = servers.info[selected('server')]['url'];
  if (!SERVER.startsWith("http")) {
      SERVER = location.origin + location.pathname + SERVER;
  }

  let url = "";
  if (method === 'native') {
    if (selected('server') === 'CDAWeb') {
      xurl = "https://cdaweb.gsfc.nasa.gov/WS/cdasr/1/dataviews/sp_phys/datasets";
      let start = doy2ymd(selected('start'));
      let stop = doy2ymd(selected('stop'));
      start = dayjs(start).toISOString().replace(/:|-/g,"").replace(/\.[0-9].*Z/,"Z");
      stop = dayjs(stop).toISOString().replace(/:|-/g,"").replace(/\.[0-9].*Z/,"Z");
      xurl = `${xurl}/${selected('dataset')}/data/${start},${stop}/${selectedParameters}?format=${selected('format')}`;
      $.ajax(
        {
          type: "GET",
          url: xurl,
          async: true,
          dataType: "xml",
          success: function (xml, textStatus, jqXHR) {
            url = $(xml).find('Name').text();
            if (selected('format').match(/pdf/)) {
              console.log(PROXY_URL + url)
              setImage(PROXY_URL + encodeURIComponent(url));
            } else {
              setImage(url);
            }
          },
          error: function (xhr, textStatus, errorThrown) {
            //console.log(xhr);
          }
        });
    }
  }

  if (method === 'hapiplot') {
    url = plotserver + "?"
        + "server=" + SERVER
        + "&dataset=" + selected('dataset')
        + "&parameters=" + selectedParameters
        + "&start=" + selected('start')
        + "&stop=" + selected('stop')
        + "&format=" + selected('format')
        + "&usecache=" + $("#useimagecache").prop('checked')
        + "&usedatacache=" + $("#usedatacache").prop('checked');
    setImage(url);
  }

  if (method === 'autoplot') {
    url = "vap+hapi:" + SERVER + "?id=";
    url = url + `${selected('dataset')}&parameters=Time,${selectedParameters}&timerange=${selected('start')}/${selected('stop')}`;
    url = plotserver + "?url=" + encodeURIComponent(url);

    let format = "image/png";
    if (selected('format') === 'svg') {
      format = "image/svg+xml";
    }
    if (selected('format') === 'pdf') {
      format = "application/pdf";
    }

    let width = $("#infodiv").width()-15;
    let height = Math.round(width*3./7.)
    let config = {
      "format": format,
      "width": width,
      "height": height,
      "font": "sans-18",         // What are options?
      "autolayout": true,       
      "column": "6.5em,100%-2.5em", // Left gap, right gap
      "row": "3em,100%-3em",     // Top gap, bottom gap
      "process": "",    // histogram, magnitude(fft)
      "renderType": "", // spectogram, series, scatter, stairSteps, fill_to_zero
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

  return url;

  function setImage(url) {

    if (set === false) {return;}

    let timerId = timer();
    downloadlink(url, selected('format'));

    if (selected('format').match(/png|svg/)) {

      $("#image")
          .empty()
          .show()
          .append("<img></img>")
          .find('img')
          .attr('src',url)
          .load(() => {
            timer(timerId);
          }).error(() => {
            timer(timerId);
          });

      if (selected('format').match(/svg/)) {
        $("#image > img").width($("#infodiv").width());
      }

    }

    if (selected('format').match(/pdf/)) {

      let w = $("#infodiv").width();
      // TODO: Determine aspect ratio based on request params.
      let h = w/2.1; 

      if (0) {
        let object = `<object
                        id="pdf-object"
                        data="${url}"
                        type="application/pdf"
                        width="${w}"
                        height="${h}"
                      </object>`

        $("#image")
            .empty()
            .append(object)
            .show();
      }

      // TODO: Image inside iframe will be zoomed when browser content
      // is zoomed. Undo this zoom? Use this to determine zoom:
      // https://codepen.io/reinis/pen/RooGOE.
      $("#image")
          .empty()
          .append(`<iframe width='${w}' height='${h}'></iframe>`)
          .find('iframe')
          .load(() => timer(timerId))
          .attr('frameborder',0)
          .attr('scrolling','no')
          .attr('src',url)
          .attr('src',url+'#view=Fit&toolbar=0&scrollbar=0')
          .parent()
          .show();
    }

  }
}
