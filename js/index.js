// Catch and report uncaught errors.
window.onerror = function (message, fileName, lineNumber) {
  fileName = fileName.replace(window.location,"");
  status(`${fileName}#L${lineNumber} <code>${message}</code>`,'error');
}

let qsInitial = parseQueryString();

function main(OPTIONS) {

  tooltips();

  // Bind events to changes in checkbox state.
  checkboxes(OPTIONS);

  // Bind events to changes in the hash part of the URL
  hashchange();

  // Remove hash when clear clicked
  $('#clear').show().on('click', function () {
    window.location = window.location.pathname;
  });

  // Set up main drop-downs. When server drop-down is set, the default text
  // is -HAPI Servers- and the function servers() is called when there is 
  // interaction. On hover over the text entry area, "Enter text to narrow
  // list" is shown as a tooltip. On hover over the expand key on right,
  // "Show full list" is shown as a tooltip. 
  dropdowns(
      ["server","dataset","parameters","start","stop","return","format","type","style"],
      [servers,datasets,parameters,starttime,stoptime,returntype,format,type,style],
      "#dropdowns");
}

// Determine selected value for a drop-down.
function selected(name) {

  clearInterval(get.interval);

  // When drop-down value is selected, URL should be up-to-date.
  // Use value in URL.
  if (location.hash !== "") {
    let qs = parseQueryString();
    if (qs[name]) {
      return qs[name];
    }
  }
  if (name === 'plotserver') {
    return $('#plotserver').val();
  }
  return "";
}

// Create a HTML link.
function link(url, text) {
  if (!url) {
    //console.error("Invalid link URL.");
    //return;
  }
  if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("//") && !url.startsWith("mailto")) {
      //url = "//" + url;
  }
  urls = url.replace(selected("server") + "/hapi/", "");
  if (arguments.length > 1) {
    return "<a target='_blank' title='" 
            + url.replace("&param","&amp;param") + "' href='" 
            + url + "'>" 
            + text + "</a>";
  } else {
    return "<a target='_blank' title='" 
            + url.replace("&param","&amp;param") + "' href='" 
            + url + "'>" 
            + urls.replace("&param","&amp;param") + "</a>";
  }
}

// Create a mailto link.
function mailtoLink(name, addr, subj) {
  if (!name) name = "";
  if (name.trim() !== "") name = name + " ";
  return name + "&lt;" + link("mailto:" + addr + "?subject=" + subj, addr) + "&gt;"
}

// Create a "Download X" link.
function downloadlink(url, what, showElapsed) {

    $("#downloadlink")
      .empty()
      .append(
          "<span>" 
          + link(url, "Download " + what) 
          + "</span>")
      .show();
    $("#downloadlink > span > a").css('font-weight', 'bold');
}

function showJSONOnClick(id, url, listID) {

  if (!listID) listID = '#' + id + "info";

  let idjson = id + "json";
  let showLink = `<a id="${idjson}" title='${url}'>HAPI JSON for ${id}</a>`;
  $(listID + ' > ul').append('<li>' + showLink + '</li>');

  $("#" + idjson).off("click", "**");
  function setClick() {
    $("#" + idjson).click(() => {
      window.scrollTo(0, 0);
      get({"url": url}, (err, data) => {
        showText(JSON.stringify(JSON.parse(data), null, 4),'','json')
      });
    });
  }

  setClick();
  // Used to need (function(url) {setClick(url)})(url). Why no longer needed?

}

function about(url) {

  url = url + "/about";
  get({url: url, showAjaxError: false}, (err, body) => {
    if (err) {
      util.log("about(): No /about response or problem with response.");
      return;
    }
    process(err, body);
  });

  function process(body) {

    let bodyObj;
    try {
      bodyObj = JSON.parse(body);
    } catch {
      util.log("about.process(): /about response not JSON parseable.");
      return;
    }

    if (bodyObj["contact"]) {
      // Default is to show what is in all.txt. This updates based on info
      // in /about response.
      let newContact = "Server contact: " + mailtoLink(null, bodyObj["contact"], url);
      $('#servercontact').html(newContact);
    }
    if (bodyObj["citation"]) {
      if (bodyObj["citation"].trim().startsWith("http")) {
        let citation = link(bodyObj["citation"], "Server citation");
        $('#serverinfo > ul').append("<li>" + citation + "</li>");
      } else {
        $('#serverinfo > ul').append(`<li>Server Citation: ${bodyObj["citation"]}"</li>`);
      }
    }
    if (bodyObj["contact"]) {
      showJSONOnClick("about", url, "#serverinfo");
    }
  }
}

// Servers drop-down callback
function servers(cb) {

  servers.label = "Servers";
  servers.tooltips = ["Enter text to search","Show full list"];

  servers.onselect = function () {

    util.log('servers.onselect(): Called.');

    let SERVER_LIST_HASH = server_list_in_hash();
    if (SERVER_LIST_HASH !== "") {
      util.log('servers(): Server list given in hash as URL.')
      //process(SERVER_LIST_HASH);
      //return;
    }

    let selectedServer = selected('server');
    if (!servers.info[selectedServer]) {
      // If user typed server=X and X not is server list
      serverNotFound(selectedServer);
      return;
    }

    let url = servers.info[selectedServer]['url'];
    if (!url.startsWith("http")) {
      url = window.location.origin + window.location.pathname + url;
    }

    $('#output').hide();
    $('#overviewinfo').hide();
    $('#serverinfo').nextAll().hide();
    $('#serverinfo > ul').empty();

    let contactEmail = servers.info[selected('server')]['contactEmail'];
    let contactName = servers.info[selected('server')]['contactName'] || "";
    let li1 = '<li>Server URL: <code>' + link(url) + '</code></li>';
    let li2 = '<li id="servercontact">Server Contact: ' 
            + mailtoLink(contactName, contactEmail, url) + '</li>';

    $('#serverinfo > ul').append(li1);
    $('#serverinfo > ul').append(li2);
    $('#serverinfo').show();

    about(url);

    examples(selected('server'), url, (html) => {
      let id = "#server-example-details-body";
      if (!html) {$("#server-example-details").hide()}
      $(id).empty();
      $(id).html(html);
      $("#server-example-details").show().prop('open',true);
    });

  };

  util.log('servers(): Called.');

  let SERVER_LIST_HASH = server_list_in_hash();
  if (SERVER_LIST_HASH !== "") {
    util.log('servers(): Server list given in hash as URL.')
    process(SERVER_LIST_HASH);
  } else {
    get({url: SERVER_LIST, showAjaxError: false}, function (err, text) {
      if (!err) {
        process(text);
      } else {
        util.log("Did not find " + SERVER_LIST + ".\n"
            + "Trying fall-back of " + SERVER_LIST_FALLBACK);
        let warning = 'Did not find ' 
                      + SERVER_LIST + ". Will use " 
                      + SERVER_LIST_FALLBACK;
        status(warning,'warning');
        SERVER_LIST = SERVER_LIST_FALLBACK;
        get({url: SERVER_LIST}, function (err, text) {
          if (!err) {
            process(text);
          }
        });
      }
    });
  }

  function process(alltxt) {

    servers.ids = [];
    // Split and remove empty lines
    allarr = alltxt.split("\n").filter(x => x !== "");

    $("#all-example-details-body").empty().show();

    if (server_list_in_hash() === "") {
      examples(allarr, null, function (html) {
        $("#all-example-details-body").append(html).show();
      });
    }

    let list = [];
    let info = {};
    let found = false;

    for (let i = 0; i < allarr.length; i++) {

      if (allarr[i].substring(0,1) === "#") {
        continue;
      }

      let id, name;
      if (allarr[i].split(",").length == 1) {
        // Only URL given. Will occur with SERVER_LIST_HASH given.
        id = allarr[i].split(',')[0].trim()
        name = id;
        info[id] = {};
        info[id]['url'] = id;
        info[id]['contactName'] = "";
        info[id]['contactEmail'] = "";
        info[id]['contactName'] = "";
      } else {
        let line = allarr[i].split(',');
        for (let col in line) {
          line[col] = line[col].trim();
        }
        id = line[2];
        if (!id) {
          console.error('No id found in ' + allarr[i]);
          continue;
        }
        name = line[1] || id;
        info[id] = {};
        info[id]['url'] = line[0];
        info[id]['contactName'] = line[3] || '';
        info[id]['contactEmail'] = line[4] || '';
        if (info[id]['contactName'] == info[id]['contactEmail']) {
          info[id]['contactName'] = '';
        }
      }
      let selectedServer = selected("server");
      servers.ids.push(id);
      if (id === selectedServer) {
        found = true;
      }

      let qs = parseQueryString();
      if (qs['server'] === id) {
        util.log("servers(): server value for " + id + " found in hash. Selecting it.")
      }
      list.push({
          "label": name,
          "value": id, 
          "selected": qs['server'] === id
      });
    }

    let selectedServer = selected('server');
    if (selectedServer && found == false && !server_list_in_hash()) {
      serverNotFound(selectedServer);
      return;
    }

    // Move TestData servers to end of list and possibly remove based on checkbox.
    let listCopy = list.slice(); // Shallow copy.
    let len = list.length;
    for (i = 0; i < len; i++) {
      if (list[i]["label"].startsWith("TestData") ||
          list[i]["label"].startsWith("URLWatcher")) {
        let tmp = list[i];
        delete list[i];
        if ($('#showtestdatalink').prop('checked') || found == true) {
          list.push(tmp);
        }
      }
    }
    list = list.filter(function( element ) {
      return element !== undefined;
    });
    if (list.length == 0) {
      let msg = "All server names start with {TestData,URLWatcher} and ";
      msg += "'show TestData servers' option unchecked. "
      msg += "Ignoring option so at least one server in server drop-down list.";
      util.log(msg);
      list = listCopy;
    }

    $('#overviewul').prepend('<li>' + (list.length) + " servers available.</li>");
    util.log("Dataset list:");
    util.log(list);
    servers.info = info;
    cb(list);
  }

  function serverNotFound(selectedServer) {
    let msg = `Server with id=${selectedServer} is not available from this interface.`;
    alert(msg);
    window.location.hash = "";
    location.reload();
  }

  function server_list_in_hash() {
    var qs = parseQueryString();
    if (!qs['server']) {
      return "";
    }
    if (qs['server'].startsWith('http://') || qs['server'].startsWith('https://')) {
      util.log("Server given in hash: " + qs['server']);
      return qs['server'].split(",").join("\n");
    } else {
      return "";
    }
  }

}

// Datasets drop-down callback
function datasets(cb) {

  datasets.label = "Datasets";

  datasets.onselect = function () {
    util.log('datasets.onselect(): Called.');

    $('#output').hide();
    $('#datasetinfo').nextAll().hide();

    $('#datasetinfo ul').empty();
    $('#datasetinfo').show();
  };

  util.log('datasets(): Called.');

  let url = servers.info[selected('server')]['url'] + "/catalog";
  get({url: url, showAjaxError: true}, function (err, res) {
    if (!err) process(res);
  });

  function process(res) {

    res = $.parseJSON(res);
    datasets.json = res;
    res = res.catalog;

    // Show number of datasets
    let nDatasets = '<li>' + (res.length) + ' dataset' + util.plural(res) + '</li>';
    $('#serverinfo > ul').append(nDatasets);

    // TODO: Get list of watched servers from OPTIONS["urlwatcher"] and don't
    // show if server not in list.
    let watcherLink = OPTIONS["urlwatcher"] + '#category='+ selected('server');
    let serverTests = '<li id="statuslink" style="display:none">'
                    + link(watcherLink, "View server response tests")
                    + '</li>'
    $('#serverinfo ul').append(serverTests);
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
      if (qsInitial['dataset'] === res[i]['id']) {
        util.log("datasets(): dataset value for " 
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
                  "selected": qsInitial['dataset'] === res[i]['id']
      });
    }
    datasets.info = info;
    cb(list);
  }
}

// Parameters drop-down callback
function parameters(cb) {

  util.log('parameters(): Called.');

  parameters.label = "Parameters";

  parameters.clearfollowing = function () {
    if (selected('format')) {
      output();
      return false;
    } else {
      return true;
    }
  }

  parameters.onselect = function () {

    util.log('parameters.onselect(): Called.');

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

    url = util.hapi2to3(url);

    $('#parameterinfo ul')
      .append("<li>id: <code>" + selected('parameters') + "</code></li>");

    for (key of Object.keys(meta)) {
        if (key !== "bins") {
            $('#parameterinfo ul')
              .append('<li>' + key + ": " + JSON.stringify(meta[key]) + '</li>');
        }
    }

    showJSONOnClick("parameter", url);

    $('#parameterinfo').show();
  };

  let url = servers.info[selected('server')]['url'] + "/info?id=" + selected('dataset');
  url = util.hapi2to3(url);

  get({url: url, showAjaxError: true}, function (err, res) {
    if (!err) process(res, url);
  });

  function process(res, url) {
    res = JSON.parse(res);

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

    showJSONOnClick("dataset", url);

    let surl = servers.info[selected('server')]['url'];
    if (!surl.startsWith("http")) {
        surl = window.location.origin + window.location.pathname + surl;
    }
    let vurl = VERIFIER
              + '?url=' + surl
              + '&id=' + datasets.info[selected('dataset')]['id'];

    vurl = util.hapi2to3(vurl);

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
        if (qsInitial['parameters'] === res[k]['name']) {
          util.log("parameters(): parameter value for " 
              + res[k]['name'] 
              + " found in hash. Will select it.")
        }
        let label = res[k]['label'] || "";
        if (Array.isArray(res[k]['label'])) {
          label = res[k]['label'].join(", ");
        }
        let sdescription = res[k]['description'] || label;
        if (sdescription.length > 40) {
          sdescription = sdescription.slice(0, 40) + "...";
        }
        if (sdescription) {
          sdescription = ": " + sdescription;
        }
        list.push({
            "label": '<code>' + res[k]['name'] + '</code>' + sdescription,
            "value": res[k]['name'], 
            "selected": qsInitial['parameters'] === res[k]['name'],
            "title": res[k]['description'] || ""
        });
    }

    if (0) {
      list.unshift({
                      "label": "*All*",
                      "value": "*all*",
                      "selected": qsInitial['parameters'] === "*all*"
                  });
    }

    datasets.info[selected('dataset')]['info']['parameters'] = info;
    parameters.info = info;
    parameters.list = list;

    cb(list);
  }
}

// Start time drop-down callback
function starttime(cb) {

  util.log('starttime(): Called.');

  starttime.label = "Start";

  starttime.isvalid = function () {return checktimes('start')}

  starttime.clearfollowing = function () {
    util.log('starttime.clearfollowing(): Called.');
    if (selected('format')) {
      if (starttime.isvalid()) {
        output(); // Update output
      }
      return false;
    } else {
      return true;
    }
  }

  starttime.onselect = function () {
    util.log('starttime.onselect(): Called.');
    return checktimes('start');
  };

  let meta = datasets.info[selected('dataset')]['info'];
  let start = meta['sampleStartDate'];
  let stop = meta['sampleStopDate'];

  let qs = parseQueryString();
  list = [{}];
  if (qsInitial['server'] == qs['server'] 
      && qsInitial['dataset'] == qs['dataset'] 
      && qsInitial['start'] !== undefined) {
    list[0].label = qsInitial['start'];
    list[0].value = qsInitial['start'];
  } else if (start && stop) {
    list[0].label = start;
    list[0].value = start;
  } else {
    list[0].label = meta['startDate'];
    list[0].value = meta['startDate'];
  }
  cb(list);
}

// Stop time drop-down callback
function stoptime(cb) {

  util.log('stoptime(): Called.');

  stoptime.label = "Stop";

  stoptime.isvalid = function () {return checktimes('stop')}

  stoptime.clearfollowing = function () {
    util.log('starttime.clearfollowing(): Called.');
    if (selected('format')) {
      if (stoptime.isvalid()) {
        output(); // Update output
      }
      return false;
    } else {
      return true;
    }
  }

  stoptime.onselect = function () {
    util.log('stoptime.onselect(): Called.');
    return checktimes('stop');
  };

  let meta = datasets.info[selected('dataset')]['info'];
  let start = meta['sampleStartDate'];
  let stop = meta['sampleStopDate'];

  let qs = parseQueryString();
  list = [{}];
  if (qsInitial['server'] == qs['server'] 
      && qsInitial['dataset'] == qs['dataset'] 
      && qsInitial['stop'] !== undefined) {
    list[0].label = qsInitial['stop'];
    list[0].value = qsInitial['stop'];
    cb(list);
    return;
  }

  if (start && stop) {
    list[0].label = stop;
    list[0].value = stop;
    cb(list);
    return;
  }

  stop = util.defaultStop(meta);

  list[0].label = stop;
  list[0].value = stop;

  cb(list);
}

function checktimes(which) {

  if (selected('start') && selected('stop')) {
    util.log("stoptime select event.")
    util.log("starttime = " + selected('start'))
    util.log("stoptime = " + selected('stop'))
    var t = dayjs(util.doy2ymd(selected('start').replace("Z","")))
          < dayjs(util.doy2ymd(selected('stop').replace("Z","")));
    util.log("---> start < stop? " + t);
    if (t == false) {
      util.log(which + " changed; start >= stop. Setting color of " + which + " to red.");
      $('#' + which + 'list').css('color','red').attr('title','start ≥ stop').addClass('tooltip');
      return false;
    } else {
      util.log(which + " changed; start < stop. Setting colors to black.");
      $('#startlist').css('color','black').removeClass('tooltip').attr('title','');
      $('#stoplist').css('color','black').removeClass('tooltip').attr('title','');
      return true;
    }
  }
  return true;
}

// Return drop-down callback
function returntype(cb) {

  format.clearfollowing = function () {
    if (selected('return')) {
      output();
      return false;
    } else {
      return true;
    }
  }

  returntype.label = "Return";

  returntype.onselect = function () {};

  var values = 
              [
                  {label:"Data", value:"data"},
                  {label:"Image", value:"image"},
                  {label:"Script", value:"script"}
              ];
  for (var i = 0; i < values.length; i++) {
    if (qsInitial['return'] === values[i]['value']) {
      values[i]['selected'] = true;
    }
  }
  cb(values);
}

// Format drop-down callback
function format(cb) {

  util.log('format(): Called.');

  format.label = "Format";

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
    if (selected("return") === "image"  || 
        selected("return") === "script" || 
        selected("format") === "json")
    {
        output();
    }
  };

  let values = [];
  if (selected("return").match("data")) {
    values = 
              [
                {label: "CSV", value: "csv"},
                {label: "JSON", value: "json"}
              ];
  }
  if (selected("return").match("image")) {
    values =
              [
                {label: "SVG", value: "svg"},
                {label: "PNG", value: "png"},
                {label: "PDF", value: "pdf"}
              ];
    if (selected('server') === 'CDAWeb' && selected('plotserver') === 'native') {
      values =
                [
                  {label: "GIF", value: "gif"},
                  {label: "PNG", value: "png"},
                  {label: "PDF", value: "pdf"}
                ];
    }

  }
  if (selected("return").match("script")) {
    values =
              [
                  {label: "IDL", value: "idl"},
                  {label: "IDL/SPEDAS", value:"idl-spedas"},
                  {label: "Javascript", value:"javascript"},
                  {label: "MATLAB", value:"matlab"},
                  {label: "Python", value:"python"},
                  {label: "Python/SPEDAS", value:"python-spedas"},
                  {label: "Python/Kamodo", value:"python-kamodo"},
                  {label: "Python/Kamodo-alt", value:"python-kamodo-alt"},
                  {label: "Autoplot", value: "autoplot"},
                  {label: "curl", value: "curl"},
                  {label: "wget", value: "wget"}
              ];
  }

  for (var i = 0; i < values.length; i++) {
    if (qsInitial['format'] === values[i]['value']) {
        values[i]['selected'] = true;
    }
  }
  cb(values, true);
}

// Style drop-down callback.
function style(cb) {

  util.log('style(): Called.');

  style.label = "Style";
  style.onselect = function () {output()}

  var values = [];

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
              {
                label: "Header",
                value: "header"
              }
          ];
    }
  }

  for (var i = 0; i < values.length; i++) {
    if (qsInitial['style'] === values[i]['value']) {
      values[i]['selected'] = true;
    }
  }

  cb(values);
}

// Type drop-down callback
function type(cb) {

  util.log('type(): Called.');

  type.label = "Type";

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

// Form URL and place it in DOM based on drop-down change.
function output(jsonURL) {

  util.log('output(): Called.');

  let selectedParameters = selected('parameters');

  if (jsonURL) {
    get({url: url, showAjaxError: true}, function (data) {
      showText(JSON.stringify(data,null,4),'','json');
    })
    return;
  }

  if (!selected('return')) {return;}

  if (selected('return').match(/script/)) {
    script();
  }

  if (selected('return').match(/data/)) {

    let parameterString = "&parameters=" + selectedParameters

    let url = servers.info[selected('server')]['url'] 
                + "/data?id=" + selected('dataset')
                + parameterString
                + "&time.min=" + selected('start')
                + "&time.max=" + selected('stop')

    url = util.hapi2to3(url);

    if (selected('format') === 'csv') {
      if (selected('style') === 'header') {
        url = url + "&include=header";
      }
    }
    if (selected('format') === 'json') {
      url = url + "&format=json";
    }

    $('#output').show();

    downloadlink(url, "data");
    $("#downloadlink").show();

    if ($("#showdata").prop('checked') == false) {
      return;
    }

    $("#data").empty();
    util.log('Getting ' + url);
    get({url: url, chunk: true}, function(err, length, nrecords) {
      if (err) {
        console.error(err);
        return;
      }
      let msg = `<code id="records-and-size"> (${nrecords} records, `;
      msg += `${util.sizeOf(length)})</code>`;
      $("#downloadlink").append(msg);
      $("#data").width($("#infodiv").width()-15).height($(window).height()/2);
      if ($('#showdata').attr('checked')) {
        $("#data-details").show();
        $("#data").show();
      }
     });
  }

  if (selected('return').match(/image/)) {

    let qs = parseQueryString();
    qs['plotserver'] = $('#plotserver').val();
    $(window).hashchange.byurledit = false;
    location.hash = decodeURIComponent($.param(qs));

    $('#output').show();
    url = plot();
    downloadlink(url, selected("format"));
    if (/png|svg/.test(selected("format"))) {
      url = url.replace(`format=${selected("format")}`, 'format=gallery');
      let galleryHTML = "&nbsp;|&nbsp;"
                      + "<span>View more in gallery:&nbsp;" 
                      + link(url + "&mode=thumb", "&#9638;&nbsp;Thumbnails", true)
                      + "&nbsp;|&nbsp;"
                      + link(url, "&#9707;&nbsp;Filmstrip", true)
                      + "</span>";

      $("#downloadlink").append(galleryHTML).show();
    } 
  }
}
