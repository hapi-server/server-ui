util = {

  doy2ymd: function (dateTime) {

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
  },

  log: function (msg) {
    if (!$('#console').is(":checked")) return;
    console.log(msg);
  },

  plural: function(arr) {
    return arr.length > 1 ? "s" : ""
  },

  defaultStop: function (meta) {
    start = meta['startDate'];
    let cadenceString = meta['cadence'] || "PT1M";
    let cadenceMillis = dayjs.duration(cadenceString)['$ms'];
    if (start.length == 11 && start.endsWith("Z")) {
      // Safari date parsing workaround. 1999-01-01Z -> 1999-01-01
      start = start.slice(0,1);
    }
    let stop;
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
    return stop;
  },

  hapiVersion: function () {
    version = datasets.json.HAPI || null;
    return version.split(".");
  },

  hapi2to3: function (url, version) {
    if (!version) {
      version = datasets.json.HAPI || "2.0";
    }
    if (version.substr(0,1) == "2") {
      url.replace("/info?id=","/info?dataset=");
      url.replace("/time.min=","/start=");
      url.replace("/time.max=","/stop=");
    }
    return url;
  },

  sizeOf: function (bytes) {
    // https://stackoverflow.com/a/28120564
    if (bytes == 0) { return "0.00 B"; }
    var e = Math.floor(Math.log(bytes) / Math.log(1000));
    return (bytes/Math.pow(1000, e)).toFixed(2)+' '+' KMGTP'.charAt(e)+'B';
  }
}
