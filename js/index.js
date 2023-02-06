if (false) {
  // TODO: Catch and report uncaught errors.
  window.onerror = function (message, filename, linenumber) {
    $('#xstatus.append').message();
  }
}

var qs = parseQueryString();

function log(msg) {
  if (!$('#console').is(":checked")) return;
  log(msg);
}

function main() {

  $('#plotserver').val(PLOTSERVER);
  $('#selections').append("<p><span style='font-size:80%;background-color:yellow'>" + devNote + "</span></p>");

  $('#plotserver').change(function (){
    if (qs["return"] && qs["return"] === "image" && qs["format"]) {
      log("plotserver changed. Triggering select event on #format drop-down.");
      $("#format").val("").data("autocomplete")._trigger("select",null,{item:""});
      $("#format").val(qs["format"]).data("autocomplete")._trigger("select",null,{item:qs["format"]});
    }
  })

  // Configure tooltips
  // https://github.com/iamceege/tooltipster/issues/558#issuecomment-221627061
  $('.tooltip').tooltipster({theme: 'tooltipster-noir'})
  $('body')
    .on('mouseenter','.tooltip:not(.tooltipstered)', 
      function () {
        $(this)
          .tooltipster({theme: 'tooltipster-noir'})
          .tooltipster('show');
      });

  // Bind events to changes in checkbox state.
  checkboxes();

  // Bind events to changes in the hash part of the URL
  hashchange();

  // Remove hash when clear clicked
  $('#clear').show().on('click', function () {window.location = window.location.pathname;});

  // Set up main drop-downs. When server drop-down is set, the default text is -HAPI Servers-
  // and the function servers() is called when there is interaction. On hover over the text 
  // entry area, "Enter text to narrow list" is shown as a tooltip. On hover over the expand
  // key on right, "Show full list" is shown as a tooltip. 
  dropdowns(
      ["server","dataset","parameters","start","stop","return","format","type","style"],
      ["HAPI Servers","Datasets","Parameters","Start","Stop","Return","Format","Type","Style"],
      [servers,datasets,parameters,starttime,stoptime,returntype,format,type,style],
      [["Enter text to narrow list","Show full list"],[],[],[],[],[],[],[],[]],
      "#dropdowns");

  //Set up examples drop-down.
  //dropdowns(["examples"],["Other Examples"],[examples],[],"#examples");
}

function hapi2to3(url) {
  if (datasets.json.HAPI.substr(0,1) == "2") {
    url.replace("/info?id=","/info?dataset=");
    url.replace("/time.min=","/start=");
    url.replace("/time.max=","/stop=");
  }
  return url;
}

function server_list_in_hash() {
  var qs = parseQueryString();
  if (!qs['server']) {
    return "";
  }
  if (qs['server'].startsWith('http://') || qs['server'].startsWith('https://')) {
    log("Server given in hash: " + qs['server']);
    return qs['server'].split(",").join("\n");                  
  } else {
    return ""
  }
}

// Monitor hash for changes via text entry in address bar.
function hashchange() {

  // Update drop-downs when URL is changed manually.
  log("hashchange(): Binding hashchange.");
  $(window).hashchange.byurledit = true;

  $(window).bind("hashchange", function() {

    $('#xstatus').empty();
    // Need to figure out what parameter was changed and then
    // remove all parameters after that. Otherwise user could
    // change the server and the parameter list will not be
    // updated.
    log("hashchange(): Hash change; by url edit = "
                + $(window).hashchange.byurledit);
    var qs = parseQueryString();

    let Nchanged = 0;
    for (var id in qs) {
      log("hashchange(): Value in query string = " + qs[id]);
      var val = $('#' + id).parent().parent().attr('value');
      log("hashchange(): Drop-down value  = " + val);
      if (qs[id] !== val) {
        Nchanged = Nchanged + 1;
        log('hashchange(): Query string value differs from that in ' + id + " dropdown.");
      } else {
        log('hashchange(): Query string value same as that in ' + id + " dropdown.");           
      }
    }

    if (Nchanged > 1) {
      log('hashchange(): More than one query string value changed. Resetting app.');
      $(window).unbind("hashchange");
      location.reload();
      return;
    } else {                        
      log('hashchange(): No query string value changed.');
    }

    if ($(window).hashchange.byurledit) {
      log("hashchange(): Hash change made by manual edit of one parameter.");
      log("hashchange(): Last hash: " + location.hash);

      for (var id in qs) {
        log("hashchange(): Setting " + id + " drop-down to " + qs[id] + " and triggering change.");
        // This does not work in jquery-ui 1.12.1
        if (id == 'servers' && !servers.ids.includes(qs[id]) && !server_list_in_hash()) {
          $('#xstatus').append("<span style='background-color:yellow'>Server with id=" + qs[id] + " is not available from this interface.</span>");
          $(window).hashchange.byurledit = false;
          setTimeout(() => {
            window.location.hash = "";
            $(window).hashchange.byurledit = true;
          },2000);
          break;
        }
        $("#" + id).val(qs[id])
            .data("autocomplete")
            ._trigger("select",null,{item:qs[id]});
      }
    }                   
    $(window).hashchange.byurledit = true;
  }); 
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

  log("get(): Requesting " + url);
  //log("get(): tryProxy = " + tryProxy);
  //log("get(): directURLFailed = " + directURLFailed);
  //log("get(): PROXY_URL = " + PROXY_URL);
  //log("get(): showAjaxError = " + showAjaxError);

  if (directURLFailed == false) {
    $("#loading").empty();
  }
  let msg = "Requesting " + link(url.replace("&param","&amp;param")) + " ";
  $("#loading").append(msg).show();

  // Append ● every 0.5 s
  main.getDots = setInterval(() => $("#loading").append("●"), 500);

  $.ajax({
      type: "GET",
      url: url,
      async: true,
      dataType: "text",
      success: function (data, textStatus, jqXHR) {
        clearInterval(main.getDots);
        if ($("#showrequests").prop('checked')) {
            $("#loading").append("Done.");
        } else {
            $("#loading").empty();
        }
        get.cache[urlo] = data; // Cache response.
        cb(false, data);
      },
      error: function (xhr, textStatus, errorThrown) {
        if (tryProxy && directURLFailed == false && PROXY_URL) {
          var opts = {
                        url: url,
                        directURLFailed: true,
                        tryProxy: false,
                        showAjaxError: true
                      };
          log("get(): Attempting to proxy retrieve " + url);
          clearInterval(main.getDots);
          if ($("#showrequests").prop('checked')) {
            $("#loading").append("Failed.<br/>");
          } else {
            $("#loading").empty();
          }
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
          clearInterval(main.getDots);
          $("#loading").empty();
          cb("Error", null);
        }
      }
  });
}

// Determine selected value for a drop-down.    
function selected(name) {

  clearInterval(main.getDots);

  // When drop-down value is selected, URL should be up-to-date.
  // Use value in URL.
  if (location.hash !== "") {
    var qs = parseQueryString();
    if (qs[name]) {
      return qs[name];
    }
  }
  return $("span[name='"+name+"']").attr('value');
}

// Create a HTML link.
function link(url, text) {

    if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("//") && !url.startsWith("mailto")) {
        //url = "//" + url;
    }
    if (arguments.length > 1) {
      return "<a target='_blank' title='" 
              + url + "' href='" 
              + url + "'>" 
              + text + "</a>";
    } else {
      return "<a target='_blank' title='" 
              + url + "' href='" 
              + url + "'>" 
              + url + "</a>";
    }
}

function downloadlink(url, what, showdots) {

    $("#downloadlink")
      .empty()
      .append(
          "<span>" 
          + link(url, "Download " + what) 
          + "</span>")
      .show();
    $("#downloadlink > span > a")
      .css('font-weight', 'bold');
    
    downloadlink.start = (new Date()).getTime();
    if (showdots) {
      $("#loading")
          .text("Requesting " + what + " ")
      let interval = setInterval( 
                          () => {
                              let elapsed =  ((new Date()).getTime() - downloadlink.start);
                              $("#loading").html("Requesting " + what + ". Elapsed time: " + elapsed + " ms");    
                          }, 500);
      return interval;
    }
}

// Handle servers drop-down.
function servers(cb) {

  servers.onselect = function () {

    log('servers.onselect(): Called.');

    $('#overviewinfo').hide();
    $('#output').hide();
    $('#serverinfo').nextAll().hide();

    let url = servers.info[selected('server')]['url'];
    if (!url.startsWith("http")) {
      url = window.location.origin + window.location.pathname + url;
    }
    let text = "Server URL";
    $('#serverinfo ul').empty();
    $('#serverinfo ul')
      .append('<li>Server URL: <code>' + link(url) + '</code></li>');
    let email = servers.info[selected('server')]['contactEmail'];
    if (servers.info[selected('server')]['contactName'] !== "") {
        $('#serverinfo ul').append(
          '<li>Server Contact: ' 
          + servers.info[selected('server')]['contactName'] 
          + " &lt;"
          + link("mailto:" + email + "?subject=" + url,email)
          + "&gt;"
          + '</li>');
    }
    $('#serverinfo').show();
  };

  log('servers(): Called.');

  let SERVER_LIST_HASH = server_list_in_hash();
  if (SERVER_LIST_HASH !== "") {
    log('servers(): Server list given in hash as URL.')
    process(SERVER_LIST_HASH);
  } else {
    get({url: SERVER_LIST, showAjaxError: false}, function (err, res) {

      if (err) {
        log("Did not find " 
            + SERVER_LIST + ".\n"
            + "Trying fall-back of " + SERVER_LIST_FALLBACK);
        var warning = 'Did not find ' 
                      + SERVER_LIST + ". Will use " 
                      + SERVER_LIST_FALLBACK
        $('#xstatus')
          .append("<span style='background-color:yellow'>" + warning + "</span>");
        SERVER_LIST = SERVER_LIST_FALLBACK;
        get({url: SERVER_LIST}, function (err, res) {
          if (!err) {
            process(res);
          }   
        });
        return;                 
      }

      process(res);           

    });
  }

  function process(res) {

    servers.ids = [];

    res = res.replace(/,$/,"").split("\n");
    // Remove empty lines
    res = res.filter(x => x !== ""); 
    let list = [];
    let info = {};
    let selectedServer = selected("server");
    let found = false;
    for (let i = 0; i < res.length; i++) {

      if (res[i].substring(0,1) === "#") {
        continue;
      }
      let id, name;
      let selectedServer = selected('server');

      if (res[i].split(",").length == 1) {
        // Only URL given. Will occur with SERVER_LIST_HASH given.
        id = res[i].split(',')[0].trim()
        name = id;
        info[id] = {};
        info[id]['url'] = id;
        info[id]['contactName'] = "";
        info[id]['contactEmail'] = "";
        info[id]['contactName'] = "";
      } else {
        id = res[i].split(',')[2].trim();
        name = res[i].split(',')[1].trim();
        info[id] = {};
        info[id]['url'] = res[i].split(',')[0].trim();
        info[id]['contactName'] = res[i].split(',')[3].trim();
        info[id]['contactEmail'] = res[i].split(',')[4].trim();
        if (info[id]['contactName'] == info[id]['contactEmail']) {
          info[id]['contactName'] = '';
        }
      }

      servers.ids.push(id);
      if (id == selectedServer) {
        found = true;
      }
      if (qs['server'] === id) {
        log("servers(): server value for " 
            + id + " found in hash. Will select it.")
      }
      list.push({
          "label": name,
          "value": id, 
          "selected": qs['server'] === id
      });
    }

    if (selectedServer && found == false && !server_list_in_hash()) {
      $('#xstatus')
        .append("<span style='background-color:yellow'>Server with id=" + selectedServer + " is not available from this interface.</span>");
      $(window).hashchange.byurledit = false;
      setTimeout(() => {
        window.location.hash = "";
        $(window).hashchange.byurledit = true;
      },2000);
    }

    // Move TestData servers to end of list and possibly remove based on checkbox.
    let listCopy = list.slice(); // Shallow copy.
    let len = list.length;
    for (i = 0; i < len; i++) {
      if (list[i]["label"].startsWith("TestData") ||
          list[i]["label"].startsWith("URLWatcher")) {
        let tmp = list[i];
        delete list[i];
        if ($('#showtestdatalink').prop('checked')) {
          list.push(tmp);
        }
      }
    }
    list = list.filter(function( element ) {
      return element !== undefined;
    });
    if (list.length == 0) {
      log("All server names start with {TestData,URLWatcher} and 'show TestData servers' option unchecked. Ignoring option so at least one server in server drop-down list.");
      list = listCopy;
    }
    $('#overviewul')
      .append('<li>' + (list.length) + " servers available.</li>");

    log(list);
    servers.info = info;
    cb(list);

  }
}

// Handle datasets drop-down.
function datasets(cb) {

  datasets.onselect = function () {
    log('datasets.onselect(): Called.');

    $('#output').hide();
    $('#datasetinfo').nextAll().hide();

    $('#datasetinfo ul').empty();
    $('#datasetinfo').show();
  };

  log('datasets(): Called.');

  let url = servers.info[selected('server')]['url'] + "/catalog";
  get({url: url, showAjaxError: true}, function (err, res) {
    if (err) {
      return;
    }
    process(res);
  });

  function process(res) {
    res = $.parseJSON(res);
    datasets.json = res;
    res = res.catalog;
    // Show number of datasets
    let plural = res.length > 1 ? "s" : "";
    $('#serverinfo ul')
      .append('<li>' + (res.length) + ' dataset' + plural + '</li>');
    $('#serverinfo ul').append('<li id="statuslink" style="display:none"><a target="_blank" href="' + URLWATCHER + '#category='+ selected('server') +'">View server response tests.</a></li>');
    if ($("#showstatuslink").prop('checked')) {
      $('#statuslink').show();
    }

    let info = {};
    let list = [];
    for (var i = 0; i < res.length; i++) {
      info[res[i]['id']] = {};
      for (key of Object.keys(res[i])) {
        info[res[i]['id']][key] = res[i][key];
      }
      if (qs['dataset'] === res[i]['id']) {
        log("datasets(): dataset value for " 
            + res[i]['id'] 
            + " found in hash. Will select it.")
      }
      var title = res[i]['id'];
      if (res[i]['title']) {
        title = "<code style='font-size:80%'>[" + res[i]['id'] + "]</code> " + res[i]['title'];
      }
      list.push({
                  "label": title,
                  "value": res[i]['id'], 
                  "selected": qs['dataset'] === res[i]['id']
      });
    }
    datasets.info = info;
    cb(list);
  }
}

// Handle parameters drop-down.         
function parameters(cb) {

  log('parameters(): Called.');

  parameters.clearfollowing = function () {
    if (selected('format')) {
      output();
      return false;
    } else {
      return true;
    }
  }   

  parameters.onselect = function () {

    log('parameters.onselect(): Called.');

    if (!selected('format')) {
        $('#output').hide();
    }
    $('#parameterinfo').nextAll().hide();
    $('#parameterinfo ul').empty();

    if (0) {
      if (selected('parameters') === '*all*') {
        alert('*all* selected');
        // Loop through all parameters and create bulleted list.
      }
    }

    let meta = parameters.info[selected('parameters')];
    let url = servers.info[selected('server')]['url'] 
              + "/info?id=" + selected('dataset') 
              + "&parameters=" + selected('parameters');

    url = hapi2to3(url);

    $('#parameterinfo ul')
      .append("<li>id: <code>" + selected('parameters') + "</code></li>");

    for (key of Object.keys(meta)) {
        if (key !== "bins") {
            $('#parameterinfo ul')
              .append('<li>' + key + ": " + JSON.stringify(meta[key]) + '</li>');
        }
    }

    $('#parameterinfo ul')
        .append('<li>' 
              + '<a id="parameterjson" title=' + url + '>'
              + 'HAPI JSON for parameter'
              + '</a>'
              + '</li>');


    $('#parameterjson').off("click", "**");
    (
        function(url) {
                        $('#parameterjson').click(() => 
                            {
                                window.scrollTo(0, 0);
                                get({"url": url}, (err, data) =>
                                  {
                                    showText(JSON.stringify(JSON.parse(data), null, 4),'','json')
                                  });
                                //output(url);
                            }
                        );
                }
    )(url)

    $('#parameterinfo').show();
  };

  let url = servers.info[selected('server')]['url'] + "/info?id=" + selected('dataset');
  url = hapi2to3(url);

  get({url: url, showAjaxError: true}, function (err, res) {
        if (err) {
          return;
        }
        process(res, url);
    }); 

  function process(res, url) {
    res = JSON.parse(res);//$.parseJSON(res);

    $('#datasetinfo ul')
        .append('<li>id: <code>' + selected('dataset') + '</code></li>');

    var description = res['description']
    if (description && /\\n/.test(description)) {
      // Preserve formatting in description.
      description = "<pre>" + description.replace("\\n", "<br/>") + "</pre>";
    }
    if (description) {
      $('#datasetinfo ul')
          .append('<li>Description: ' + description + '</li>');
    }

    // Show number of parameters
    $('#datasetinfo ul')
        .append(""
                + "<li>"
                + (res.parameters.length) 
                + " parameters</li>");

    $('#datasetinfo ul')
      .append('<li>Start: ' + res['startDate'] + '</li>');
    $('#datasetinfo ul')
      .append('<li>Stop: ' + res['stopDate'] + '</li>');


    let cadence = res['cadence'] || "not given";
    $('#datasetinfo ul')
      .append('<li>Cadence: ' 
              + cadence
                  .replace("PT","")
                  .replace("D"," days, ") 
                  .replace("H"," hours, ") 
                  .replace("M"," minutes, ") 
                  .replace("S"," seconds")
                  .replace(/, $/,"")
                  .replace("1 days", "1 day")
                  .replace("1 hours", "1 hour")
                  .replace("1 minutes", "1 minute")
                  .replace("1 seconds", "1 second")
              + '</li>');

    if (res['resourceURL']) {
        $('#datasetinfo ul')
          .append('<li>' 
                + link(res['resourceURL'], "Dataset documentation or metadata") 
                + '</li>');
    }
    if (res['contact']) {
        $('#datasetinfo ul')
          .append('<li>Dataset contact: ' + res['contact'] + '</li>');
    }


    $('#datasetinfo ul')
        .append('<li>' 
                + '<a id="datasetjson" title=' + url + '>'
                + 'HAPI JSON for dataset'
                + '</a>'
                + '</li>');

    $('#datasetjson').off("click", "**");
    (
        function(url) {
                log(url)
                        $('#datasetjson').click(() => 
                            {
                                window.scrollTo(0, 0);
                                get({"url": url}, (err, data) =>
                                  {
                                    showText(JSON.stringify(JSON.parse(data), null, 4),'','json')
                                  });
                                //output(url);
                            }
                        );
                }
    )(url)

    //(function(url) {$('#datasetjson').click(() => {log(url);output(url)})(url)

    let surl = servers.info[selected('server')]['url'];
    if (!surl.startsWith("http")) {
        surl = window.location.origin + window.location.pathname + surl;
    }
    let vurl = VERIFIER
              + '?url=' + surl
              + '&id=' + datasets.info[selected('dataset')]['id'];
    
    vurl = hapi2to3(vurl);

    $('#datasetinfo ul')
      .append('<li id="verifierlink" style="display:none"><a target="_blank" href=' + vurl + '>Check this dataset using the HAPI Verifier</a></li>');

    if ($("#showverifierlink").prop('checked')) {
      $('#verifierlink').show();
    }

    datasets.info[selected('dataset')]['info'] = res;

    res = res.parameters;

    let info = {};
    let list = [];
    for (var k = 0; k < res.length; k++) {
        info[res[k]['name']] = {};
        for (key of Object.keys(res[k])) {
          info[res[k]['name']][key] = res[k][key];
        }
        if (qs['parameters'] === res[k]['name']) {
          log("parameters(): parameter value for " 
              + name 
              + " found in hash. Will select it.")
        }
        list.push({
            "label": res[k]['label'],
            "value": res[k]['name'], 
            "selected": qs['parameters'] === res[k]['name'],
            "title": res[k]['description'] || ""
        });
    }

    if (0) {
      list.unshift({
                      "label": "*All*",
                      "value": "*all*",
                      "selected": qs['parameters'] === "*all*"
                  });
    }

    datasets.info[selected('dataset')]['info']['parameters'] = info;
    parameters.info = info;
    parameters.list = list;

    cb(list);
  }
}

function checktimes(which) {
  if (selected('start') && selected('stop')) {
    log("stoptime select event.")
    log("starttime = " + selected('start'))                 
    log("stoptime = " + selected('stop'))
    var t = dayjs(selected('start').replace("Z","")) 
            < dayjs(selected('stop').replace("Z",""));
    log("---> start < stop? " + t);
    if (t == false) {
      log(which + " changed; start >= stop. Setting color of " + which + " to red.");
      $('#' + which + 'list').css('color','red');
      return "Error";
    } else {
      log(which + " changed; start < stop. Setting color of " + which + " to black.");
      $('#' + which + 'list').css('color','black');
    }
  }
}

// Handle start time drop-down.
function starttime(cb) {

  log('starttime(): Called.');

  starttime.clearfollowing = function () {
    if (selected('return')) {
      output();
      return false;
    } else {
      return true;
    }
  }
  starttime.onselect = function () {
    return checktimes('start');
  };

  let meta = datasets.info[selected('dataset')]['info'];              
  let start = meta['sampleStartDate'];
  let stop = meta['sampleStopDate'];

  list = [{}];
  if (qs['start'] !== undefined) {
    list[0].label = qs['start'];
    list[0].value = qs['start'];
  } else if (start && stop) {
    list[0].label = start;
    list[0].value = start;
  } else {
    list[0].label = meta['startDate'];
    list[0].value = meta['startDate'];
  }
  cb(list);
}

// Handle stop time drop-down.          
function stoptime(cb) {

  log('stoptime(): Called.');

  stoptime.clearfollowing = function () {
    if (selected('return')) {
      output();
      return false;
    } else {
      return true;
    }
  }

  stoptime.onselect = function () {
    return checktimes('stop');
  };

  let meta = datasets.info[selected('dataset')]['info'];              
  let start = meta['sampleStartDate'];
  let stop = meta['sampleStopDate'];

  list = [{}];
  if (qs['stop'] !== undefined) {
    list[0].label = qs['stop'];
    list[0].value = qs['stop'];
    cb(list);
    return;
  }

  if (start && stop) {
    list[0].label = stop;
    list[0].value = stop;
    cb(list);
    return;
  }

  //alert('here')
  start = meta['startDate'];
  let cadenceString = meta['cadence'] || "PT1M";
  let cadenceMillis = dayjs.duration(cadenceString)['$ms'];

  if (cadenceMillis <= 100) { // 0.1 s or less
    stop = dayjs(start).add(1,'minute').toISOString();
  } else if (cadenceMillis <= 1000*10) { // 10 s or less
    stop = dayjs(start).add(1,'hour').toISOString();
  } else if (cadenceMillis <= 1000*60) { // 1 min or less
    stop = dayjs(start).add(2,'day').toISOString();
  } else if (cadenceMillis <= 1000*60*10) { // 10 min or less
    stop = dayjs(start).add(4,'day').toISOString();
  } else if (cadenceMillis <= 1000*60*60) { // 1 hr or less
    stop = dayjs(start).add(10,'day').toISOString();
  } else if (cadenceMillis <= 1000*60*60*24) { // 1 day or less
    stop = dayjs(start).add(31,'day').toISOString();
  } else if (cadenceMillis <= 1000*60*60*24*10) { // 10 days or less
    stop = dayjs(start).add(1,'year').toISOString();
  } else if  (cadenceMillis <= 1000*60*60*24*100) { // 100 days or less
    stop = dayjs(start).add(10,'year').toISOString();
  } else {
    stop = meta['stopDate'];
  }

  list[0].label = stop;
  list[0].value = stop;

  cb(list);
}

// Handle return drop-down.
function returntype(cb) {

  format.clearfollowing = function () {
    if (selected('return')) {
      output();
      return false;
    } else {
      return true;
    }
  }
  returntype.onselect = function () {};

  var values = 
              [
                  {label:"Data", value:"data"},
                  {label:"Image", value:"image"},
                  {label:"Script", value:"script"}
              ];
  for (var i = 0; i < values.length; i++) {
    if (qs['return'] === values[i]['value']) {
      values[i]['selected'] = true;
    }
  }
  cb(values);
}

// Handle format drop-down.
function format(cb) {

  log('format(): Called.');

  format.clearfollowing = function () {
    if (selected('type')) {
      output();
      return false;
    } else {
      return true;
    }
  }

  format.onselect = function () {
    $('#output').children().hide();

    if (selected("return") === "image" 
        || selected("return") === "script"
        || selected("format") === "json") {
        output();
    }
  };

  if (selected("return").match("data")) {
    var values = 
                [
                    {label:"CSV", value:"csv"},
                    {label:"JSON", value:"json"}
                ];
  }
  if (selected("return").match("image")) {
    var values =
                [
                    {label:"SVG",value:"svg"},
                    {label:"PNG",value:"png"},
                    {label:"PDF",value:"pdf"},
                    {label:"Gallery",value:"gallery"}
                ];
  }
  if (selected("return").match("script")) {
    var values =
                [
                    {label:"IDL",value:"idl"},
                    {label:"Javascript",value:"javascript"},
                    {label:"MATLAB",value:"matlab"},
                    {label:"Python",value:"python"},
                    {label:"Autoplot",value:"autoplot"},
                    {label:"curl",value:"curl"},
                    {label:"wget",value:"wget"}
                ];
  }

  for (var i = 0; i < values.length; i++) {
    if (qs['format'] === values[i]['value']) {
        values[i]['selected'] = true;
    }
  }
  cb(values);
}

// Handle type drop-down.
function type(cb) {

  log('type(): Called.');

  type.clearfollowing = function () {
    if (selected('style')) {
      output();
      return false;
    } else {
      return true;
    }
  }

  type.onselect = function () {};

  var values = [];
  if (false && selected("return").match("image")) {
      values = 
              [
                  {
                      label: "Time Series", 
                      value: "timeseries", 
                      selected: true
                  }
              ];
  }
  cb(values);
}

// Handle style drop-down.
function style(cb) {

  log('type(): Called.');

  style.onselect = function () {
    output();
  }

  var values = [];
  if (false && selected("return") === "image") {
    values = 
        [
            {label: "None/Black/Blue", value: "0", selected: true},
            {label: "Black/Yellow/Yellow", value: "1"},
            {label: "Sparkline", value: "2"}
        ];
  }

  if (selected("return") === "data") {
    var values = [];                        
    if (selected('format') == 'csv') {
      var values = 
          [
              {
                  label: "No Header",
                  value: "noheader",
                  selected: true
              },
              {label: "Header", value: "header"}
          ];
    }
  }
  for (var i = 0; i < values.length; i++) {
    if (qs['style'] === values[i]['value']) {
      values[i]['selected'] = true;
    }
  }
  cb(values);
}

// Examples drop-down.
function examples(cb) {

  log('examples(): Called.');

  examples.onselect = function () {
    vid = $("#examples0").attr('value');
    log("Example " + vid + " selected");

    // Find example corresponding to vid.
    for (var k = 0; k < examples.list.length; k++) {
        if (examples.list[k].value === vid) {
            break;
        }
    }
    $(window).unbind("hashchange");
    location.hash = examples.list[k].value;
    location.reload();
  };
  var list = examplelist(); // Function defined in examplelist.js.
  examples.list = list;
  cb(list);
}

// Form URL and place it in DOM based on drop-down state.
function output(jsonURL) {

  log('output(): Called.')

  let selectedParameters = selected('parameters');
  if (0) {
      if (selectedParameters === '*all*') {
          selectedParameters = "";
      }
  }

  if (jsonURL) {
    let interval = downloadlink(jsonURL, "json", true);
    $.ajax({
        type: "GET",
        url: jsonURL,
        async: true,
        dataType: "json",
        success: function (data, textStatus, jqXHR) {
            showText(JSON.stringify(data,null,4),'','json')
            clearInterval(interval);
            $("#loading").empty();
        },
        error: function (xhr, textStatus, errorThrown) {
            clearInterval(interval);
            $("#loading").empty();
            $('#downloadlink').empty();
            ajaxerror(jsonURL, "Failed to retrieve " + url, xhr);
        }
    });
    return;
  }

  if (!selected('return')) {
      return;
  }

  if (selected('return').match(/script/)) {
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

    script(cclass, selected('format') + "." + ext, 
        function (sText) {showText(sText,cclass,ext)})

  } else if (selected('return').match(/data/)) {

    parameterString = "&parameters=" + selectedParameters
    let url = servers.info[selected('server')]['url'] 
                + "/data?id=" + selected('dataset')
                + parameterString
                + "&time.min=" + selected('start')
                + "&time.max=" + selected('stop')

    url = hapi2to3(url);

    if (selected('format') === 'csv') {
      if (selected('style') === 'header') {
        url = url + "&include=header";
      }
    }
    if (selected('format') === 'json') {
      url = url + "&format=json";
    }

    $('#output').show();

    downloadlink(url, "data", false);

    if (!$("#showdata").prop('checked')) {
      return;
    }

    get({url: url}, function (err, data) {
        $("#downloadlink")
            .append("<pre id='data' class='data'>" + data + "</pre>");
        $("#downloadlink > pre")
            .width($("#infodiv").width()-15)
            .height($(window).height()/2)   
        $("#downloadlink").show();                  
    });

  } else if (selected('return').match(/image/)) {

    if (qs['plotserver']) {
        PLOTSERVER = qs['plotserver'];
    } else {
        PLOTSERVER = $('#plotserver').val();
    }
    let SERVER = servers.info[selected('server')]['url'];
    if (!SERVER.startsWith("http")) {
        SERVER = location.origin + location.pathname + SERVER;
    }
    url = PLOTSERVER
            + "?server=" + SERVER
            + "&id=" + selected('dataset')
            + "&parameters=" + selectedParameters
            + "&time.min=" + selected('start')
            + "&time.max=" + selected('stop')
            + "&format=" + selected('format')
            + "&usecache=" + $("#useimagecache").prop('checked')
            + "&usedatacache=" + $("#usedatacache").prop('checked')

    url = hapi2to3(url);

    APLOTSERVER = "https://jfaden.net/AutoplotServlet/SimpleServlet?url=";
    aurl = "vap+hapi:http://hapi-server.org/servers/SSCWeb/hapi?id=";
    aurl = aurl + `${selected('dataset')}&parameters=Time,${selectedParameters}&timerange=${selected('start')}/${selected('stop')}`;
    aurl = APLOTSERVER + encodeURIComponent(aurl);
    log(aurl)

    $('#output').show();

    if (selected('format').match(/png|svg/)) {

      main.imageDots = downloadlink(url,selected('format'),true);

      let width = $("#infodiv").width()-15;
      if (selected('format').match(/svg/)) {
          width = "100%";
      }
          
      $("#image")
          .empty()
          .append("<img></img>")
          .find('img')
          .attr('src',url)
          .parent()
          .show()
          .find('img')
          .width(width)
          .load( () => {
              clearInterval(main.imageDots);
              $("#loading").empty();
          }).error( () => {
              clearInterval(main.imageDots);
              $("#loading").empty();                              
          })
    }
    if (selected('format').match(/pdf/)) {

      let interval = downloadlink(url, 'pdf', true);

      $("#image")
          .empty()
          .append("<iframe></iframe>")
          .find('iframe')
          .attr('frameborder',0)
          .attr('scrolling','no')
          .attr('src',url)
          .width('0')
          .height('0')
          .parent()
          .show()

      $('#image > iframe')
        .load(function () {
          clearInterval(interval);
          $("#loading").empty();
          let w = $("#infodiv").width()-15
          $('#image > iframe')
              .width(w)
              .height(w*3/7+30) 
          // Defaut hapiplot is 7x3 image. Add 30 for PDF
          // controls.
      })
    }
    if (selected('format').match(/gallery/)) {
      $("#downloadlink")
          .empty()
          .append(
              "<span>" 
              + link(url, "View gallery", true) 
              + "</span>")
          .show();
      $("#downloadlink > span > a")
        .css('font-weight', 'bold');
    }
 
  }

  function script(lang,templateFile,cb) {

    $.ajax({
        type: "GET",
        url: "scripts/" + templateFile,
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
      if (0) {
        if (selectedParameters === '*all*') {
          selectedParameters = "";
        }
      }

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
      cb(sText);
    }
  }

}

function showText(sText,cclass,ext) {
  $('#scriptcopy > button')
      .attr("data-clipboard-text",sText)
  $('#scriptcopy').show()

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