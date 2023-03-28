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

  log("get(): Requesting " + url);
  //log("get(): tryProxy = " + tryProxy);
  //log("get(): directURLFailed = " + directURLFailed);
  //log("get(): PROXY_URL = " + PROXY_URL);
  //log("get(): showAjaxError = " + showAjaxError);

  let msg = "| Requesting " + link(url.replace("&param","&amp;param"));
  $('#requests').html(msg).show();
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
