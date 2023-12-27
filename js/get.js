function get(options, cb) {

  $("#ajaxerror").hide().empty();

  let specURL = 'https://github.com/hapi-server/data-specification/blob/master';
  specURL += '/hapi-dev/HAPI-data-access-spec-dev.md#5-cross-origin-resource-sharing';

  options = JSON.parse(JSON.stringify(options));

  util.log("get(): Called with options: " + JSON.stringify(options));

  let showRequest = false;
  if ($('#showrequests').attr('checked')) {
    showRequest = true;
    if (options["showRequest"] !== undefined) {
      showRequest = options["showRequest"];
    }
  }

  let showTiming = false;
  if ($('#showtiming').attr('checked')) {
    showTiming = true;
    if (options["showTiming"] !== undefined) {
      showTiming = options["showTiming"];
    }
  }

  let url = options.url;

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
    util.log("get(): Client-side cache hit for " + urlo);
    cb(false, get.cache[urlo]);
    return;
  }

  let timerId = undefined;
  if (showTiming) {
    timerId = timer();
  }

  util.log("get(): Requesting " + url);
  if (timerId !== undefined) {
    util.log("get(): timerId = " + timerId);
  }

  //util.log("get(): tryProxy = " + tryProxy);
  //util.log("get(): directURLFailed = " + directURLFailed);
  //util.log("get(): PROXY_URL = " + PROXY_URL);
  //util.log("get(): showAjaxError = " + showAjaxError);

  if (showRequest) {
    let msg = "Requesting " + link(url);
    $('#requests').html(msg);
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
        dataType: options.dataType || "text",
        success: function (data, textStatus, jqXHR) {
          if (showTiming) {
            timer(timerId);
          }
          util.log("get(): Got " + url);
          if (showTiming) {
            util.log("get(): timerId = " + timerId);
          }
          if (showRequest) {
            $("#requests").html("Received: " + link(url.replace("&param","&amp;param")));
            $("#requests").show();
          }
          if (options.dataType === "json" && data["status"] && parseInt(data["status"]["code"]) !== 1200) {
            ajaxError(url, data["status"]["message"], jqXHR);
            cb(true, data);
            return;
          }
          get.cache[urlo] = data; // Cache response.
          cb(false, data);
        },
        error: function (xhr, textStatus, errorThrown) {
          util.log("get(): Error for " + url);
          if (showTiming) {
            util.log("get(): timerId = " + timerId);
            timer(timerId);
          }
          errorHandler(xhr, textStatus, errorThrown);
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
        util.log("get(): Error for " + url);
        util.log("get(): timerId = " + timerId);
        timer(timerId);
        errorHandler(e);
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

      util.log("get(): Got chunks for " + url);
      util.log("get(): timerId = " + timerId);
      timer(timerId);
      if (cb) cb(null, length, nrecords);
    }
  }

  function ajaxError(url, message, xhr) {

    let errmsg = xhr.statusText || xhr.responseText;
    let msg = 
      "Error encountered when attempting to retrieve "
      + "<a target='_blank' href='" + url + "'>"
      + url.replace("&para","&#38;para") + "</a>"
      + "<br><br>Error: <pre>" + errmsg + "</pre>"
      + "Message:<pre>" + message + "</pre>"
      + "The Javascript debugger console may have a more descriptive error message."
    $('#ajaxerror').html(msg).show();
    // Determining if CORS is cause of error is difficult:
    // https://stackoverflow.com/q/19325314
    console.error(errmsg)
    console.error(xhr);
  }

  function errorHandler(xhr, textStatus, errorThrown) {

    if (options.dataType === "json") {
      let responseJSON;
      try {responseJSON = JSON.parse(xhr.responseText);} catch (e) {}
      if (responseJSON && parseInt(responseJSON["status"]["code"]) !== 1200) {
        ajaxError(url, responseJSON["status"]["message"], xhr);
        cb(true, data);
        return;
      }
    }

    if (tryProxy && directURLFailed == false && PROXY_URL) {
      var opts = {
                    url: url,
                    directURLFailed: true,
                    tryProxy: false,
                    dataType: options.dataType || "text",
                    showTiming: options.showTiming || false,
                    showAjaxError: showAjaxError,
                    chunk: options.chunk || false
                  };
      util.log("get(): Attempting to proxy retrieve " + url);
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
        ajaxError(url, message, xhr);
      }
      cb("Error", null);
    }
  }
}