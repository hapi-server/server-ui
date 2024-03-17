function main() {

  window["HAPIUI"]["qsInitial"] = query.qsInitial();

  // Unbind all event listeners.
  $("*").unbind();

  // Set window.onerror event.
  util.catchAppErrors();

  // Create <details> element for UI test links.
  tests();

  // Initialize tooltips.
  tooltips();

  // Bind events to changes in checkbox state.
  checkboxes();

  // Bind events to changes in the hash part of the URL
  hash.hashchange();

  // Remove hash when reset clicked
  $('#clear').show().on('click', function () {
    window.location = window.location.pathname;
  });

  // Set up main dropdowns. When server dropdown is set, the default text
  // is -HAPI Servers- and the function servers() is called when there is 
  // interaction. On hover over the text entry area, "Enter text to narrow
  // list" is shown as a tooltip. On hover over the expand key on right,
  // "Show full list" is shown as a tooltip.
  let dfuncs = [servers, datasets, parameters, starttime, stoptime, returntype, format, style];
  dropdowns(dfuncs, "#dropdowns");

}

// Determine selected value for a dropdown from hash.
function selected(name) {

  // When dropdown value is selected, URL should be up-to-date.
  // Use value in URL.
  if (location.hash !== "") {
    let qs = query.parseQueryString();
    if (qs[name]) {
      return qs[name];
    }
  }
  return "";
}

function about(url, HAPI) {

  $("#aboutRequestWarning").empty().hide();
  $("#aboutRequestURL").empty().hide();
  $("#aboutRequestTiming").empty().hide();

  if (parseFloat(HAPI) < 3.0) {
    return;
  }

  // Called after /catalog request if /catalog response has HAPI >= 3.0. 
  let defaultOptions = {
    "dataType": "json",
    "requestURLElement": "#aboutRequestURL",
    "timeout": window["HAPIUI"]["options"]["metadataTimeout"],
    "timer": {
      "element": "#aboutRequestTiming"
    }
  };
  url = url + "/about";
  let getOptions = {url: url, ...defaultOptions};
  get(getOptions, (err, json) => {
    if (!err) {
      process(json);
      return;
    }
    $("#aboutRequestWarning").html(err).show();
    setTimeout(() => $("#aboutRequestWarning").empty().hide(), 5000);
    util.log("about(): Problem with /about response from " + url);
  });

  function process(json) {
    html.showJSONOnClick("about", url, "#serverinfo");
    if (typeof json["contact"] === "string") {
      // Default is to show what is in all.txt. This updates based on info
      // in /about response.
      let newContact = "Server contact: " + html.mailtoLink(null, json["contact"], url);
      $('#servercontact').html(newContact);
    }
    if (typeof json["citation"] === "string") {
      if (json["citation"].trim().startsWith("http")) {
        let citation = html.aLink(json["citation"], "Server citation");
        $('#serverinfo > ul').append("<li>" + citation + "</li>");
      } else {
        $('#serverinfo > ul').append(`<li>Server Citation: ${json["citation"]}"</li>`);
      }
    }
  }
}

// Servers dropdown
function servers(cb) {

  util.log('servers(): Called.');

  let defaultOptions = {
    "requestURLElement": "#allRequestURL",
    "timeout": window["HAPIUI"]["options"]["allTimeout"],
    "timer": {
      "element": "#allRequestTiming"
    }
  };

  let serverList = window["HAPIUI"]["options"]["serverList"];
  let serverListFallback = window["HAPIUI"]["options"]["serverListFallback"];
  $("#allRequestError").empty().hide();
  $("#allRequestWarning").empty().hide();

  let getOptions = {url: serverList, ...defaultOptions};
  get(getOptions, function (err, text) {
    if (!err) {
      process(text, serverList);
      return;
    }
    util.log(serverList + " not found.\n" + "Trying fall-back of " + serverListFallback);
    let warning = serverList + " not found. Will try " + serverListFallback;
    $("#allRequestWarning").html(warning).show();
    get({url: serverListFallback, ...defaultOptions}, function (err, alltxt) {
      if (!err) {
        setTimeout( () => $("#allRequestWarning").empty().hide(), 2000);
        process(alltxt, serverList);
        return;
      }
      let msg = `Unable to load a server list. Tried ${serverList} and ${serverListFallback}`;
      $("#allRequestError").html(msg).show();
    });
  });

  servers.label = "Servers";
  servers.id = "server";
  //servers.tooltips = ["Enter text to search any list"];
  servers.clearFollowing = true;

  servers.onselect = function () {

    util.log('servers.onselect(): Called.');

    let selectedServer = selected('server');
    if (!servers.info[selectedServer]) {
      // This will occur if HAPI URL is entered into server dropdown.
      servers.info[selectedServer] = {"url": selectedServer};
    }

    let url = servers.info[selectedServer]['url'];
    if (!url.startsWith("http")) {
      url = window.location.origin + window.location.pathname + url;
    }

    $('#output').hide();
    $('#output json').empty();
    $('#output script').empty();
    $('#output data').empty();
    $('#output image').empty();
    $('#overviewinfo').hide();
    $('#serverinfo').nextAll().hide();
    $('#serverinfo > ul').empty();

    let contactEmail = servers.info[selected('server')]['contactEmail'] || "";
    let contactName = servers.info[selected('server')]['contactName'] || "";
    let li1 = '<li>Server URL: <code>' + html.aLink(url) + '</code></li>';
    $('#serverinfo > ul').append(li1);
    if (contactEmail && contactName) {
      let mailtoLink = html.mailtoLink(contactName, contactEmail, url);
      let li2 = `<li id="servercontact">Server Contact: ${mailtoLink}</li>`;
      $('#serverinfo > ul').append(li2);
    }

    $('#serverinfo').show();

    showSingleServerExamples();
  };

  function showSingleServerExamples() {
    $('#all-example-details-body > div').hide();
    $(`#${util.validHTMLID(selected('server'))}-examples`).show();
  }

  function process(alltxt, serverListURL) {
    let SERVER_URL_HASH = serverIsURL();
    if (SERVER_URL_HASH !== "") {
      alltxt = alltxt + "\n" + `${SERVER_URL_HASH},${SERVER_URL_HASH},${SERVER_URL_HASH}`;
    }

    if (!alltxt) {
      $("#allRequestError").html(`Problem with the server list response from ${html.aLink(serverListURL)}.`).show();
      return;
    }
    if (alltxt.trim().length === 0) {
      $("#allRequestError").html(`Server list from ${html.aLink(serverListURL)} is empty.`).show();
      return;
    }
    let info = parseAllTxt(alltxt);
    if (!info) {
      $("#allRequestError").html(`Server list from ${html.aLink(serverListURL)} is empty.`).show();
      return;
    }

    let selectedServer = selected("server");
    //let qs = query.parseQueryString();
    //window["HAPIUI"]["qsInitial"]['server'] === id

    servers.ids = [];
    let found = false;
    let list = [];
    for (let id of Object.keys(info)) {

      servers.ids.push(id);
      if (id === selectedServer) {
        found = true;
      }

      if (window["HAPIUI"]["qsInitial"]['server'] === id) {
        util.log("servers.process(): Server value for " + id + " found in hash. Setting as selected in dropdown.")
      }
      list.push({
          "label": info[id]['name'],
          "value": id, 
          "selected": window["HAPIUI"]["qsInitial"]['server'] === id
      });
    }

    if (selectedServer && found == false) {
      // Will occur if user typed a server name in dropdown and it is not in list
      serverNotFound(selectedServer);
      return;
    }

    //if (serverIsURL() === "") {
    if (serverIsURL() === "" && $('#showexamplequeries').prop('checked')) {
      // This can cause a request to be made to the a URL that is already in
      // flight, which get() throws and error for.
      $("#all-example-details-body").empty();
      examples(info, function (html) {
        if (!html) return;
        $("#all-example-details-body").append(html).show();
        if (selected('server')) {
          showSingleServerExamples();
        }
      });
    }

    // Move TestData servers to end of list and possibly remove based on checkbox.
    list = modifyServerList(list, found);
    $('#nServers').text(list.length);
    util.log("servers.process(): Server list:");
    util.log(list);

    if (list.length === 0) {
      $("#allRequestError").html(`Problem parsing server list from ${html.aLink(serverListURL)}.`).show();
      return;
    }
    servers.info = info;
    delete window["HAPIUI"]["qsInitial"]['server'];
    cb(list);
  }

  function modifyServerList(list, found) {
    let listCopy = list.slice(); // Shallow copy.
    let listLength = list.length;
    for (let i = 0; i < listLength; i++) {
      if (list[i]["label"].startsWith("TestData") ||
          list[i]["label"].startsWith("URLWatcher")) {
        let tmp = list[i];
        delete list[i];
        if ($('#showtestdatalink').prop('checked') || found == true) {
          // Append to end
          list.push(tmp);
        }
      }
    }
    list = list.filter(function( element ) {
      // Remove undefined elements due to deletion above.
      return element !== undefined;
    });
    if (list.length === 0) {
      let msg = "All server names start with {TestData,URLWatcher} and ";
      msg += "'show TestData servers' option unchecked. "
      msg += "Ignoring option so at least one server in server dropdown list.";
      util.log(msg);
      list = listCopy;
    }
    return list;
  }

  function reset(msg) {
    console.error(msg);
    alert(msg);
    window.location.hash = "";
    main();
  }

  function serverNotFound(selectedServer) {
    let msg = `Server '${selectedServer}' is not available from this interface or URL is invalid.`;
    reset(msg);
  }

  function serverIsURL() {
    let qs = query.parseQueryString();
    if (!qs['server']) {
      return "";
    }
    if (qs['server'].startsWith('http://') || qs['server'].startsWith('https://')) {
      return qs['server'].split(",").join("\n");
    } else {
      return "";
    }
  }

}

// Datasets dropdown
function datasets(cb) {

  util.log('datasets(): Called.');

  datasets.id = "dataset";
  datasets.label = "Datasets";
  datasets.clearFollowing = true;
  datasets.onselect = function () {
    util.log('datasets.onselect(): Called.');

    util.log('datasets.onselect(): Hiding output.');
    $('#output').hide();
  };

  let url = servers.info[selected('server')]['url'] + "/catalog";
  let getOptions = {
    "url": url,
    "dataType": "json",
    "requestURLElement": "#catalogRequestURL",
    "timeout": window["HAPIUI"]["options"]["metadataTimeout"],
    "timer": {
      "element": "#catalogRequestTiming"
    }
  };

  $("#datasetsRequestError").empty().hide();
  get(getOptions, function (err, res) {
    if (!err) {
      process(res);
      return;
    }
    $("#datasetsRequestError").html(err).show();
  });

  function process(res) {

    about(servers.info[selected('server')]['url'], res["HAPI"]);

    $('#server-example-details').attr('open',false);

    datasets.json = res;
    res = res.catalog;

    // Show number of datasets
    let nDatasets = res.length + ' dataset' + util.plural(res) + ". ";
    $('#nDatasets').text(nDatasets);

    let getOptions = {
      "url": "https://hapi-server.org/urlwatcher/log/tests.json",
      "dataType": "json",
      "timeout": window["HAPIUI"]["options"]["metadataTimeout"],
      "requestURLElement": "#urlwatcherRequestURL",
      "timer": {
        "element": "#urlwatcherRequestTiming"
      }
    };

    $("#urlwatcherRequestError").empty().hide();
    get(getOptions, function (err, json) {
      if (err) {
        $("#urlwatcherRequestError").html(err).show();
        return;
      }
      if (json && json[selected('server')]) {
        let watcherLink = window["HAPIUI"]["options"]["urlwatcher"] + '#category=' + selected('server');
        let serverTests = '<li id="statuslink" style="display:none">'
                        + html.aLink(watcherLink, "View server response tests")
                        + '</li>'
        $('#serverinfo ul').append(serverTests);
        if ($("#showstatuslink").prop('checked')) {
          $('#statuslink').show();
        }
      }
    });

    let info = {};
    let list = [];
    for (let i = 0; i < res.length; i++) {
      info[res[i]['id']] = {};
      for (let key of Object.keys(res[i])) {
        info[res[i]['id']][key] = res[i][key];
      }
      if (window["HAPIUI"]["qsInitial"]['dataset'] === res[i]['id']) {
        util.log(`datasets(): dataset value for ${res[i]['id']} found in initial hash. Will select it.`)
      }
      list.push({
                  "label": res[i]['id'] || res[i]['title'],
                  "value": res[i]['id'], 
                  "selected": window["HAPIUI"]["qsInitial"]['dataset'] === res[i]['id']
      });
    }
    datasets.info = info;
    delete window["HAPIUI"]["qsInitial"]['dataset'];
    cb(list);
  }
}

// Parameters dropdown
function parameters(cb) {

  util.log('parameters(): Called.');

  let url = servers.info[selected('server')]['url'] + "/info?id=" + selected('dataset');
  url = util.hapi2to3(url);

  let getOptions = {
    "url": url,
    "dataType": "json",
    "timeout": window["HAPIUI"]["options"]["metadataTimeout"],
    "requestURLElement": "#parametersRequestURL",
    "timer": {
      "element": "#parametersRequestTiming"
    }
  };

  $("#parametersRequestError").empty().hide();
  get(getOptions, function (err, res) {
    if (err) {
      $("#parametersRequestError").html(err).show();
      return;
    }
    process(res, url);
  });

  parameters.id = "parameters";
  parameters.label = "Parameters";
  parameters.allowEmptyValue = true;
  parameters.selectMultiple = true;
  parameters.clearFollowing = false;

  parameters.clearfollowing = () => {
    if (selected('format')) {
      util.log("parameters.clearfollowing(): 'format' is selected. Updating #output.");
      output();
    }
    return false;
  }

  parameters.onselect = function () {

    util.log('parameters.onselect(): Called.');

    if (selected('format')) {
      util.log("parameters.onselect(): 'format' is selected. Updating #output.");
      output();
    } else {
      util.log("parameters.onselect(): 'format' is not selected. Hiding #output.");
      $('#output').hide();
    }

    util.log("parameters.onselect(): Hiding info blocks after #parameterinfo.");
    $('#parameterinfo').nextAll().hide();
    util.log("parameters.onselect(): Emptying <ul> in #parameterinfo.");
    $('#parameterinfo ul').empty();

    if (window["HAPIUI"]["options"]["allowAllParameters"] === true) {
      if (selected('parameters') === '') {
        // Loop through all parameters and create bulleted list.
        //return;
      }
    }

    util.log(`parameters.onselect(): selected('parameters') = '${selected('parameters')}'.`);
    let meta = parameters.info[selected('parameters')];
    let url = servers.info[selected('server')]['url'] 
            + "/info?id=" + selected('dataset') 
            + "&parameters=" + selected('parameters');
    url = util.hapi2to3(url);

    if (meta) {
      $('#parameterinfo ul').append(`<li>id: <code>${selected('parameters')}</code></li>`);
      for (let key of Object.keys(meta)) {
        if (key !== "bins") {
          $('#parameterinfo ul').append(`<li>${key}: ${JSON.stringify(meta[key])}</li>`);
        }
      }

      html.showJSONOnClick("parameter", url, "#parameterinfo");
      $('#parameterinfo').show();
    }

  }

  function process(res, url) {

    util.log('datasets.onselect(): Hiding info blocks after #datasetinfo.');
    $('#datasetinfo').nextAll().hide();

    util.log('datasets.onselect(): Emptying #datasetinfo <ul>.');
    $('#datasetinfo ul').empty();

    util.log('datasets.onselect(): Showing #datasetinfo.');
    $('#datasetinfo').show();

    $('#datasetinfo ul').append(`<li>id: <code>${selected('dataset')}</code></li>`);

    let description = res['description']
    if (description && /\\n/.test(description)) {
      // Preserve formatting in description.
      description = "<pre>" + description.replace("\\n", "<br/>") + "</pre>";
    }
    if (description) {
      $('#datasetinfo ul').append('<li>Description: ' + description + '</li>');
    }

    // Show number of parameters
    $('#nParameters').html(`<code>${res.parameters.length}</code> parameter${util.plural(res.parameters)}.`);
    $('#datasetinfo ul').append(`<li>Start: <code>${res['startDate']}</code></li>`);
    $('#datasetinfo ul').append(`<li>Stop: <code>${res['stopDate']}</code></li>`);

    let cadence = res['cadence'];
    if (cadence) {
      cadence = `Cadence: ${util.ISODuration2Words(cadence)} (<code>${cadence}</code>)`;
    } else {
      cadence = "not specified"
    }
    $('#datasetinfo ul').append(`<li>${cadence}</li>`);

    if (res['resourceURL']) {
        $('#datasetinfo ul')
          .append('<li>' 
                + html.aLink(res['resourceURL'], "Dataset documentation or metadata") 
                + '</li>');
    }
    if (res['contact']) {
        $('#datasetinfo ul')
          .append('<li>Dataset contact: ' + res['contact'] + '</li>');
    }

    html.showJSONOnClick("dataset", url, "#datasetinfo");

    let surl = servers.info[selected('server')]['url'];
    if (!surl.startsWith("http")) {
        surl = window.location.origin + window.location.pathname + surl;
    }
    let vurl = window["HAPIUI"]["options"]["verifier"]
             + '?url=' + surl
             + '&id=' + datasets.info[selected('dataset')]['id'];

    vurl = util.hapi2to3(vurl);

    let link = `<a target="_blank" href="${vurl}">Check this dataset using the HAPI Verifier</a>`;
    let warning = "";
    if (new URL(surl).hostname.startsWith("localhost") === true) {
      if (new URL(vurl).hostname.startsWith("localhost") === false) {
        warning = "<br>(Server URL host name is <code>localhost</code> and verifier URL host name is not <code>localhost</code>. Verifier links may not work.)";
      }
    }
    let li = `<li id="verifierlink" style="display:none">${link} ${warning}</li>`;
    $('#datasetinfo ul').append(li);
    if ($("#showverifierlink").prop('checked')) {
      $('#verifierlink').show();
    }

    datasets.info[selected('dataset')]['info'] = res;

    res = res.parameters;
    console.log(res)
    let info = {};
    let list = [];
    for (let k = 0; k < res.length; k++) {
      info[res[k]['name']] = {};
      for (let key of Object.keys(res[k])) {
        info[res[k]['name']][key] = res[k][key];
      }
      let selectParameter = false;
      let urlParameters = window["HAPIUI"]["qsInitial"]['parameters'];
      if (urlParameters && urlParameters.split(",").includes(res[k]['name'])) {
        selectParameter = true;
        util.log(`parameters(): parameter value for '${res[k]['name']}' found in hash. Will select it.`)
      }

      let label = res[k]['label'] || "";
      if (Array.isArray(res[k]['label'])) {
        label = res[k]['label'].join(", ");
      }
      label = res[k]['description'] || label;

      list.push({
          "label": label,
          "value": res[k]['name'],
          "selected": selectParameter,
          "title": res[k]['description'] || ""
      });
    }
    console.log(list);

    if (window["HAPIUI"]["options"]["allowAllParameters"] === true) {
      list.unshift({
                      "label": "All parameters",
                      "value": "",
                      "selected": window["HAPIUI"]["qsInitial"]['parameters'] === "*all*"
                  });
    }

    datasets.info[selected('dataset')]['info']['parameters'] = info;
    parameters.info = info;
    parameters.list = list;

    delete window["HAPIUI"]["qsInitial"]['parameters'];
    cb(list);
  }
}

// Start time dropdown
function starttime(cb) {

  // Because only one value is set in dropdown, it is automatically selected
  // and the next dropdown is called.
  util.log('starttime(): Called.');

  starttime.id = "start";
  starttime.label = "Start";
  starttime.clearFollowing = false;

  starttime.onselect = function () {
    util.log('starttime.onselect(): Called.');
    if (selected('format')) {
      if (util.checkTimes('start', selected('start'), selected('stop'))) {
        output(); // Update output
      }
    }
  };

  let qs = query.parseQueryString();
  let list = [{}];
  if (window["HAPIUI"]["qsInitial"]['server'] == qs['server'] 
      && window["HAPIUI"]["qsInitial"]['dataset'] == qs['dataset'] 
      && window["HAPIUI"]["qsInitial"]['start'] !== undefined) {
    list[0].label = window["HAPIUI"]["qsInitial"]['start'];
    list[0].value = window["HAPIUI"]["qsInitial"]['start'];
  } else {
    let meta = datasets.info[selected('dataset')]['info'];
    let start = defaultDate.start(meta);
    list[0].label = start;
    list[0].value = start;
  }
  delete window["HAPIUI"]["qsInitial"]['start'];
  cb(list);
}

// Stop time dropdown
function stoptime(cb) {

  // Because only one value is set in dropdown, it is automatically selected
  // and the next dropdown is called.
  util.log('stoptime(): Called.');

  stoptime.id = "stop";
  stoptime.label = "Stop";
  stoptime.clearFollowing = false;

  stoptime.onselect = function () {
    util.log('stoptime.onselect(): Called.');
    if (selected('format')) {
      if (util.checkTimes('stop', selected('start'), selected('stop'))) {
        output(); // Update output
      }
    }
  };

  let qs = query.parseQueryString();
  let list = [{}];
  if (window["HAPIUI"]["qsInitial"]['server'] === qs['server'] 
      && window["HAPIUI"]["qsInitial"]['dataset'] == qs['dataset'] 
      && window["HAPIUI"]["qsInitial"]['stop'] !== undefined) {
    list[0].label = window["HAPIUI"]["qsInitial"]['stop'];
    list[0].value = window["HAPIUI"]["qsInitial"]['stop'];
  } else {
    let meta = datasets.info[selected('dataset')]['info'];
    let stop = defaultDate.stop(meta);
    list[0].label = stop;
    list[0].value = stop;
  }
  delete window["HAPIUI"]["qsInitial"]['stop'];
  cb(list);
}

// Return dropdown
function returntype(cb) {

  returntype.id = "return";
  returntype.label = "Return";
  returntype.clearFollowing = true;

  returntype.onselect = function () {
    $(window).scrollTop(0);
  };

  let values = 
              [
                  {label:"Data", value:"data"},
                  {label:"Image", value:"image"},
                  {label:"Script", value:"script"}
              ];

  for (let i = 0; i < values.length; i++) {
    if (window["HAPIUI"]["qsInitial"]['return'] === values[i]['value']) {
      values[i]['selected'] = true;
    }
  }
  delete window["HAPIUI"]["qsInitial"]['return'];
  cb(values);
}

// Format dropdown
function format(cb) {

  util.log('format(): Called.');
  format.id = "format";
  format.clearFollowing = true;

  format.onselect = function () {
    $(window).scrollTop(0);
    if (selected("style") || selected("return") === 'script') {
      // Update output
      output();
    }
    // Keep state of following dropdown.
    //style.lastSelected = selected('style');
  };

  let values = [];
  if (selected("return").match("data")) {
    format.label = "Output Format";
    values = 
              [
                {label: "CSV", value: "csv"},
                {label: "JSON", value: "json"}
              ];
  }

  if (selected("return").match("image")) {
    format.label = "Plot Server";
    values =
        [
            {
                label: "hapiplot",
                value: "hapiplot"
            },
            {
              label: "Autoplot",
              value: "autoplot"
            }
      ];
    if (selected('server') === 'CDAWeb') {
      values.push({
        label: "CDAWeb",
        value: "cdaweb"
      });
    }
  }

  if (selected("return").match("script")) {
    format.label = "Language";
    values = _scriptList();
  }

  let autoOpen = false;
  if (values.length > 0) {
    let selectDefault = true;
    if (selected("return").match("script")) {
      if (window["HAPIUI"]["qsInitial"]['format'] === undefined) {
        autoOpen = true;
      }
      if (!selected('format') && !window["HAPIUI"]["qsInitial"]['format']) {
        selectDefault = false;
      }
    }
    if (selectDefault === true) {
      let queryParameterValue = window["HAPIUI"]["qsInitial"]['format'];
      values = query.chooseDefault(queryParameterValue, values);
    }
  }
  delete window["HAPIUI"]["qsInitial"]['format'];
  cb(values, autoOpen);
}

// Style dropdown
function style(cb) {

  util.log('style(): Called.');

  style.id = "style";
  style.clearFollowing = false;
  style.onselect = function () {
    output();
  }

  let values = [];
  if (selected("return") === "image") {
    values =
              [
                {label: "SVG", value: "svg"},
                {label: "PNG", value: "png"},
                {label: "PDF", value: "pdf"}
              ];

    if (selected('server') === 'CDAWeb' && selected('format') === 'cdaweb') {
      values =
                [
                  {label: "GIF", value: "gif"},
                  {label: "PNG", value: "png"},
                  {label: "PDF", value: "pdf"}
                ];
    }
  }

  if (selected("return") === "data") {
    style.label = "Header Options";
    style.label = "Output header options";
    values =
        [
            {
                label: "No Header",
                value: "noheader"
            },
            {
              label: "Header",
              value: "header"
            }
        ];
  }

  if (values.length > 0) {
    let useDefault = window["HAPIUI"]["qsInitial"]['style'];
    for (let i = 0; i < values.length; i++) {
      // lastSelected was stored in style.lastSelected when format.onselect().
      // If lastSelected is in list, select it instead of using initial
      // query string value. TODO: This is hacky.
      //if (style.lastSelected === values[i]['value']) {
      //  useDefault = style.lastSelected;
      //}
    }
    values = query.chooseDefault(useDefault, values);
  }
  delete window["HAPIUI"]["qsInitial"]['style'];
  cb(values);
}

// Place returntype response in DOM
function output() {

  util.log('output(): Called.');

  if (!selected('return')) {
    util.log("output(): Warning: output called but 'return' not selected. Returning.")
    return;
  }

  util.log("output(): Showing #output element.")
  $('#output').show();

  if (selected('return').match(/script/)) {
    script();
  }

  if (selected('return').match(/data/)) {
    data();
  }

  if (selected('return').match(/image/)) {
    //$('#plotserver').trigger('change');

    let selectedParameters = selected('parameters').trim();
    if (selectedParameters === "") {
      selectedParameters = Object.keys(parameters.info);
    } else {
      selectedParameters = selectedParameters.split(",");
    }

    for (let parameter of selectedParameters) {
      plot(parameter);
    }
  }
}
