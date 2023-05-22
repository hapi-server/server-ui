function examples(server, cb) {

  let url = "examples/default.json";
  if (server) {
    url = "examples/" + server + ".json";
  }

  get({"url": url}, getcb);

  function getcb(err, json) {

    if (err) {
      return; // If no examples for given server.
    } 

    json = JSON.parse(json);
    let linkHTML = "";

    if (json["links"]) {
      for (let link of json["links"]) {
        linkHTML += `\n<li><a href="${link['url']}">${link['label']}</a></li>`
      }
    } else {
      let hrefo = [
                    "#server=" + selected('server'),
                    "dataset=" + json['dataset'],
                    "parameters=" + json['parameters'],
                    "start=" + json['start'],
                    "stop=" + json['stop']
                  ];
      hrefo = hrefo.join("&");
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
        label += ` parameter <code>${json['parameters']}</code> `;
        label += `of <code>${json['dataset']}</code> dataset`
        let href = hrefo + "&" + option['args'];        
        linkHTML = linkHTML + `\n<li><a href="${href}">${label}</a></li>`
      }
    }

    linkHTML = "<ul>" + linkHTML + "</ul>";
    cb(linkHTML);
  }
}
