function get(options, cb) {

  log("get(): Options:")
  log(options);

  var url = options.url;

  var tryProxy = options.tryProxy || true;
  if (!url.startsWith("http")) {
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

  log("get(): Requesting " + url);
  //log("get(): tryProxy = " + tryProxy);
  //log("get(): directURLFailed = " + directURLFailed);
  //log("get(): PROXY_URL = " + PROXY_URL);
  //log("get(): showAjaxError = " + showAjaxError);

  let msg = "| Requesting " + link(url.replace("&param","&amp;param"));
  $('#requests').html(msg);

  if (options.chunk) {
    //getAll();
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
          $("#requests").html("| Received: " + link(url.replace("&param","&amp;param")));
          get.cache[urlo] = data; // Cache response.
          cb(false, data);
        },
        error: function (xhr, textStatus, errorThrown) {
          timer(timerId);
          if (tryProxy && directURLFailed == false && PROXY_URL) {
            var opts = {
                          url: url,
                          directURLFailed: true,
                          tryProxy: false,
                          showAjaxError: true
                        };
            log("get(): Attempting to proxy retrieve " + url);
            $("#requests").html("Failed: " + link(url.replace("&param","&amp;param")));
            get(opts, cb);
          } else {
            if (showAjaxError) {
              var message = "";
              if (directURLFailed && PROXY_URL) {
                message = "Failed to retrieve\n<a href='" + urlo + "'>" + urlo + "</a>\nand\n<a href='" + url + "'>"
                          + url + "</a>\n\nThe first URL failure may be due to the server not supporting <a href='https://github.com/hapi-server/data-specification/blob/master/hapi-dev/HAPI-data-access-spec-dev.md#5-cross-origin-resource-sharing'>CORS headers</a>. The second URL failure is usually a result of a server issue.";
              } else {
                message = "Failed to retrieve " + url;
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
        cb(err);
        return;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let result = await reader.read();
      let length = 0;
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
        log("get(): Appending " + length + " bytes to #data");
        $("#data").append(text);
        result = await reader.read();
      }
      cb(null);
      timer(timerId);
    }
  }

  function ajaxerror(url, message, xhr) {
    let errmsg = xhr.statusText || xhr.responseText;
    $('#xstatus').show().html(
        "<div class='error'>Error encountered when attempting to retrieve "
        + "<a target='_blank' href='" + url + "'>"
        + url.replace("&para","&#38;para") + "</a>"
        + ".<br><br>Message: <pre>" + message + "</pre>"
        + "<pre>" + errmsg + "</pre>"
        + "<p>The Javascript debugger console may have a more descriptive error message.</p></div>");
    // Determining if CORS is cause of error is difficult:
    // https://stackoverflow.com/q/19325314
    console.error(errmsg)
    console.error(xhr);
  }

}
