if (false) {
  // TODO: Catch and report uncaught errors.
  window.onerror = function (message, filename, linenumber) {
    $('#xstatus.append').message();
  }
}

var qsInitial = parseQueryString();

function main(OPTIONS) {

  $('#selections')
    .append("<p><span style='font-size:80%;background-color:yellow'>" 
            + OPTIONS["devNote"] 
            + "</span></p>");

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
      ["HAPI Servers","Datasets","Parameters","Start","Stop","Return","Format","Type","Style"],
      [servers,datasets,parameters,starttime,stoptime,returntype,format,type,style],
      [["Enter text to search","Show full list"],[],[],[],[],[],[],[],[]],
      "#dropdowns");

  //Set up examples drop-down.
  //dropdowns(["examples"],["Other Examples"],[examples],[],"#examples");
}

function log(msg) {
  if (!$('#console').is(":checked")) return;
  console.log(msg);
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
  return $("span[name='"+name+"']").attr('value');
}

function doy2ymd(dateTime) {

  if (/^[0-9]{4}-[0-9]{3}/.test(dateTime)) {
    dateTime = dateTime.split("-");
    let startUnixMs = new Date(dateTime[0],0,1).getTime();
    let doy = dateTime[1].split("T")[0];
    let Z = "";
    if (doy.endsWith("Z")) {
      doy = doy.replace("Z","");
      Z = "Z";
    }
    let time = dateTime[1].split("T")[1];
    if (time) {
      time = "T" + time;
    } else {
      time = "";
    }
    let msOfYear = 86400*1000*parseInt(doy-1);
    let dateTimeMod = new Date(startUnixMs+msOfYear).toISOString().slice(0,10) + time + Z;
    return dateTimeMod;
  }
  return dateTime;
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
            + url + "' href='" 
            + url + "'>" 
            + text + "</a>";
  } else {
    return "<a target='_blank' title='" 
            + url + "' href='" 
            + url + "'>" 
            + urls + "</a>";
  }
}

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

function timer(id) {

  if (id) {
    clearInterval(timer[id].interval);
    let elapsed = ((new Date()).getTime() - timer[id].time);
    $("#timing").text("Time: " + (elapsed) + " [ms]");
    return;
  }

  $('#timing').empty();
  $("#timing").text("Time:      ms");
  id = Math.random();
  timer[id] = {time: (new Date()).getTime()};
  timer[id].interval = 
          setInterval(
              () => {
                  let elapsed = ((new Date()).getTime() - timer[id].time);
                  $("#timing").text("Time: " + (elapsed) + "  ms");
              }, 500);
  return id;
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

      if (!err) {
        process(res);
      } else {
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
      }
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

      let qs = parseQueryString();
      if (qs['server'] === id) {
        log("servers(): server value for " + id + " found in hash. Selecting it.")
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
      }, 2000);
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
    if (!err) process(res);
  });

  function process(res) {

    res = $.parseJSON(res);
    datasets.json = res;
    res = res.catalog;
    // Show number of datasets
    let plural = res.length > 1 ? "s" : "";
    $('#serverinfo ul')
      .append('<li>' + (res.length) + ' dataset' + plural + '</li>');
    $('#serverinfo ul').append('<li id="statuslink" style="display:none"><a target="_blank" href="' + OPTIONS["urlwatcher"] + '#category='+ selected('server') +'">View server response tests.</a></li>');
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
                  "selected": qsInitial['dataset'] === res[i]['id']
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
    if (!err) process(res, url);
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
        if (qsInitial['parameters'] === res[k]['name']) {
          log("parameters(): parameter value for " 
              + name 
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

function checktimes(which) {
  if (selected('start') && selected('stop')) {
    log("stoptime select event.")
    log("starttime = " + selected('start'))                 
    log("stoptime = " + selected('stop'))
    var t = dayjs(doy2ymd(selected('start').replace("Z","")))
            < dayjs(doy2ymd(selected('stop').replace("Z","")));
    log("---> start < stop? " + t);
    if (t == false) {
      log(which + " changed; start >= stop. Setting color of " + which + " to red.");
      $('#' + which + 'list').css('color','red').attr('title','start ≥ stop').addClass('tooltip');
      return "Error";
    } else {
      log(which + " changed; start < stop. Setting color of " + which + " to black.");
      $('#' + which + 'list').css('color','black').removeClass('tooltip').attr('title','');
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
    if (qsInitial['return'] === values[i]['value']) {
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
    if (qsInitial['format'] === values[i]['value']) {
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
  if (selected("return").match("image")) {
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

  log('style(): Called.');

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
    if (qsInitial['style'] === values[i]['value']) {
      values[i]['selected'] = true;
    }
  }

  cb(values);
}

// Handle examples drop-down.
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

// Form URL and place it in DOM based on drop-down change.
function output(jsonURL) {

  log('output(): Called.');

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

    downloadlink(url, "data");

    if ($("#showdata").prop('checked') == false) {
      return;
    }

    get({url: url, showLink: true}, function (err, data) {
        $("#downloadlink")
            .append("<pre id='data' class='data'>" + data + "</pre>");
        $("#downloadlink > pre")
            .width($("#infodiv").width()-15)
            .height($(window).height()/2)
        $("#downloadlink").show();
    });
  }

  if (selected('return').match(/image/)) {

    let qs = parseQueryString();
    qs['plotserver'] = $('#plotserver').val();
    $(window).hashchange.byurledit = false;
    location.hash = decodeURIComponent($.param(qs));

    if (selected('format').match(/png|svg|pdf/)) {
      $('#output').show();
      plot();
    }

    if (selected('format').match(/gallery/)) {
      url = plot(null, false);
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
}
