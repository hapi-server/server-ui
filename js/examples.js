function examples(server, cb) {

  if (!cb) cb = () => {};

  let url = "";
  if (Array.isArray(server)) {
    createAll(server, cb);
    return;
  } else {
    url = "examples/" + server + ".json";
  }

  get({"url": url}, (err, linkJSON) => {
    if (err) {
      // If no examples for given server.
      util.log("examples(): No example file " + url)
      autoCreateLinkJSON(server, cb);
      return;
    }
    createLinkHTML(JSON.parse(linkJSON), server, cb);
  });

  function createAll(servers, cb) {
    for (let serverLine of servers) {
      let serverName = serverLine.split(",")[2].trim();
      let serverID = serverLine.split(",")[2].trim();
      examples(serverID, (html) => finished(serverName, html));
    }
    function finished(serverName, html) {
      if (finished.N === undefined) {
        finished.html = "";
        finished.N = 0;
      }
      finished.N++;
      finished.html = finished.html + `<b>${serverName}</b>\n${html}`;
      if (finished.N == server.length) {
        cb(finished.html);
      }
    }
  }


  function autoCreateLinkJSON(cb, server) {

    let serverURL = servers.info[server]['url'];
    util.log("examples(): Auto-creating examples for " + serverURL);

    let linkObj = {};
    let catalogURL = servers.info[selected('server')]['url'];

    get({"url": catalogURL + "/catalog"}, (err, catalogJSON) => {

      let catalogObj = JSON.parse(catalogJSON);
      linkObj["dataset"] = catalogObj["catalog"][0]["id"];

      let version = catalogObj["catalog"]['HAPI'];
      let url = catalogURL + "/info?id=" + linkObj["dataset"];
      get({"url": util.hapi2to3(url, version)}, (err, infoJSON) => {

        infoObj = JSON.parse(infoJSON);
        linkObj["parameters"] = infoObj["parameters"][0]["name"];

        if (linkObj["parameters"]["sampleStartDate"]) {
          linkObj["start"] = infoObj["parameters"]["sampleStartDate"];
          linkObj["stop"] = infoObj["parameters"]["sampleStartDate"];
        } else {
          linkObj["start"] = infoObj["startDate"]
          linkObj["stop"] = util.defaultStop(infoObj);
        }
        createLinkHTML(linkObj, cb);
      });
    });
  }

  function createLinkHTML(linkObj, server, cb) {

    let hrefo = [
                  "#server=" + server,
                  "dataset=" + linkObj['dataset'],
                  "parameters=" + linkObj['parameters'],
                  "start=" + linkObj['start'],
                  "stop=" + linkObj['stop']
                ].join("&");

    let options = [
                    {
                      "label": "Show plot",
                      "args": "return=image&format=svg"
                    },
                    {
                      "label": "List data",
                      "args": "return=data&format=csv"
                    },
                    {
                      "label": "Show script options",
                      "args": "return=script"
                    }
                  ];

    let linkHTML = "";
    for (option of options) {
      let linkText = option['label'];
      postText = ` for parameter <code>${linkObj['parameters']}</code> `;
      postText += `of <code>${linkObj['dataset']}</code> dataset`;
      let href = hrefo + "&" + option['args'];
      linkHTML = linkHTML + `\n  <li><a href="${href}">${linkText}</a>${postText}</li>`;
    }

    linkHTML = "<ul>" + linkHTML + "\n</ul>\n\n";
    cb(linkHTML);
  }
}
