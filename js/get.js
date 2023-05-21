function get(options, cb) {

  let specURL = 'https://github.com/hapi-server/data-specification/blob/master';
  specURL += '/hapi-dev/HAPI-data-access-spec-dev.md#5-cross-origin-resource-sharing';

  log("get(): Options:")
  log(options);
  options = JSON.parse(JSON.stringify(options));
  var url = options.url;

  // Simulate error.
  //if (url.match(/cdaweb/)) url = url + "x";

  var tryProxy = options.tryProxy || true;
  if (!url.startsWith("http")) {
    // Requests to main server are relative paths and should not need a proxy.
    // So if they fail, don't try proxy.
    tryProxy = false;
  }                   

  var showAjaxError = options.showAjaxError || false;
  var directURLFailed = options.directURLFailed || false;

  var urlo = url;
  if (tryProxy && PROXY_URL && directURLFailed) {
    url = PROXY_URL + encodeURIComponent(url);
  }

  // Client-side cache of response.
  if (typeof(get.cache) === "undefined") {
    get.cache = {};
  }

  if (get.cache[urlo]) {
    log("get(): Client-side cache hit.");
    cb(false, get.cache[urlo]);
    return;
  }

  let timerId;
  timerId = timer();
  window.timerId = timerId;

  url = url;

  log("get(): Requesting " + url);
  //log("get(): tryProxy = " + tryProxy);
  //log("get(): directURLFailed = " + directURLFailed);
  //log("get(): PROXY_URL = " + PROXY_URL);
  //log("get(): showAjaxError = " + showAjaxError);

  let msg = "Requesting " + link(url);
  $('#requests').html(msg);
  if ($('#showrequests').attr('checked')) {
    $('#requests').show();
  }

  if (options.chunk) {
    getChunks();
  } else {
    getAll();
  }

  function getAll() {
    $.ajax({
        type: "GET",
        url: url,
        async: true,
        dataType: "text",
        success: function (data, textStatus, jqXHR) {
          timer(timerId);
          log("get(): Got " + url);
          $("#requests").html("Received: " + link(url.replace("&param","&amp;param")));
          if ($('#showrequests').attr('checked')) {
            $("#requests").show();
          }
          get.cache[urlo] = data; // Cache response.
          cb(false, data);
        },
        error: function (xhr, textStatus, errorThrown) {
          timer(timerId);
          if (xhr.status !== 200) {            
            //timer(timerId);
            //ajaxerror(url, `<a href='${urlo}'>${urlo}</a> returned status code <code>${xhr.status}</code>`, xhr);
            //cb("Error"  , null);
            //return;
          }
          if (tryProxy && directURLFailed == false && PROXY_URL) {
            var opts = {
                          url: url,
                          directURLFailed: true,
                          tryProxy: false,
                          showAjaxError: true
                        };
            log("get(): Attempting to proxy retrieve " + url);
            get(opts, cb);
          } else {
            if (showAjaxError) {
              var message = "";
              if (directURLFailed && PROXY_URL) {
                message = `Failed to retrieve<br><br><a href='${urlo}'>${urlo}</a>`
                        + "<br>and<br>"
                        + `<a href='${url}'>${url}</a>`
                        + "<br><br>"
                        + "The first URL failure <i>may</i> be due to the server not supporting "
                        + `<a href='${specURL}'>CORS headers</a>. `
                        + "The second URL failure is usually a result of a server issue.";
              } else {
                message = `Failed to retrieve '${url}'`;
              }
              ajaxerror(url, message, xhr);
            }
            cb("Error", null);
          }
        }
    });
  }

  function getChunks() {

    // https://gist.github.com/jfsiii/034152ecfa908cf66178
    run();
    async function run() {
      let response;
      try {
        response = await fetch(url);
      } catch (e) {
        console.log(e);
        timer(timerId);
        return;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let result = await reader.read();
      let length = 0;
      let nrecords = 0;
      let c = false;
      while (!result.done) {

        length = length + result.value.length;
        if (c === false && length > 3000000) {
          c = confirm('Large data response. Continue? (Uncheck Options > Show data to suppress display of data in browser.)');
          if (c === false) {
            break;
          }
        }
        const text = decoder.decode(result.value);

        nrecords += (text.match(/\n/g) || []).length;
        $("#data").append(text);
        result = await reader.read();
      }
      timer(timerId);
      if (cb) cb(null, length, nrecords);
    }
  }

  function ajaxerror(url, message, xhr) {
    let errmsg = xhr.statusText || xhr.responseText;
    $('#xstatus').show().html(
        "<div class='error'>Error encountered when attempting to retrieve "
        + "<a target='_blank' href='" + url + "'>"
        + url.replace("&para","&#38;para") + "</a>"
        + "<br><br>Error: <pre>" + errmsg + "</pre>"
        + "Message:<br><br>" + message
        + "<p>The Javascript debugger console may have a more descriptive error message.</p></div>");
    // Determining if CORS is cause of error is difficult:
    // https://stackoverflow.com/q/19325314
    console.error(errmsg)
    console.error(xhr);
  }

}
