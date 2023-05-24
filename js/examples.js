function examples(server, cb) {

  let url = "examples/default.json";
  if (server) {
    url = "examples/" + server + ".json";
  }

  get({"url": url}, (err, linkJSON) => {
    if (err) {
      // If no examples for given server.
      util.log("examples(): No example file " + url)
      autoCreateLinkJSON(cb);
      return; 
    } 
    createLinkHTML(JSON.parse(linkJSON), cb);    
  });

  function autoCreateLinkJSON(cb) {

    let serverURL = servers.info[selected('server')]['url'];
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

  function createLinkHTML(linkObj, cb) {

    let linkHTML = "";
    if (linkObj["links"]) {
      for (let link of linkObj["links"]) {
        linkHTML += `\n<li><a href="${link['url']}">${link['label']}</a></li>`
      }
      linkHTML = "<ul>\n" + linkHTML + "\n</ul>";
      cb(linkHTML);
      return;
    }

    let hrefo = [
                  "#server=" + selected('server'),
                  "dataset=" + linkObj['dataset'],
                  "parameters=" + linkObj['parameters'],
                  "start=" + linkObj['start'],
                  "stop=" + linkObj['stop']
                ].join("&");

    let options = [
                    {
                      "label": "Plot", 
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

    for (option of options) {
      let label = option['label'];
      label += ` parameter <code>${linkObj['parameters']}</code> `;
      label += `of <code>${linkObj['dataset']}</code> dataset`
      let href = hrefo + "&" + option['args'];        
      linkHTML = linkHTML + `\n<li><a href="${href}">${label}</a></li>`
    }

    linkHTML = "<ul>\n" + linkHTML + "\n</ul>";
    cb(linkHTML);
  }
}
