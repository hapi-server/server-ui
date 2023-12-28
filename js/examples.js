function examples(serverID, serverURL, cb) {

  if (!cb) cb = () => {};

  let url = "";
  if (Array.isArray(serverID)) {
    createAll(serverID, cb);
    return;
  } else {
    url = "examples/" + serverID + ".json";
  }

  get({"url": url, "showRequest": false, "showTiming": false, "dataType": "json"}, (err, linkJSON) => {
    if (err) {
      // If no examples for given server.
      util.log("examples(): No example file " + url)
      autoCreateLinkJSON(serverID, serverURL, cb);
      return;
    }
    createLinkHTML(linkJSON, serverID, cb);
  });

  function createAll(allArray, cb) {
    for (let serverLine of allArray) {
      let lineColumns =  serverLine.split(",");
      let serverURL = lineColumns[0].trim();
      let serverName = lineColumns[1].trim();
      let serverID = lineColumns[2].trim();
      //examples(serverID, serverURL, (html) => finished(serverName, html));
      examples(serverID, serverURL, (html) => cb(`<b>${serverName}</b>\n${html}`));
    }
  }

  function autoCreateLinkJSON(serverID, serverURL, cb) {

    util.log("examples(): Auto-creating examples for " + serverURL);
    let linkObj = {};
    get({"url": serverURL + "/catalog", "showRequest": false, "showTiming": false, "dataType": "json"}, (err, catalogObj) => {
      if (err) {
        util.log("examples(): Failed to get catalog for " + serverURL);
        return;
      }

      linkObj["dataset"] = catalogObj["catalog"][0]["id"];

      let version = catalogObj['HAPI'];
      let url = serverURL + "/info?id=" + linkObj["dataset"];
      get({"url": util.hapi2to3(url, version), "showRequest": false, "showTiming": false, "dataType": "json"}, (err, infoObj) => {
        if (err || !infoObj || !infoObj["parameters"]) {
          return;
        }
        linkObj["parameters"] = infoObj["parameters"][0]["name"];

        if (linkObj["parameters"]["sampleStartDate"]) {
          linkObj["start"] = infoObj["parameters"]["sampleStartDate"];
          linkObj["stop"] = infoObj["parameters"]["sampleStartDate"];
        } else {
          linkObj["start"] = infoObj["startDate"]
          linkObj["stop"] = util.defaultStop(infoObj);
        }
        createLinkHTML(linkObj, serverID, cb);
      });
    });
  }

  function createLinkHTML(linkObj, server, cb) {

    let hrefo = [
                  "#server=" + serverID,
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
