const PORT = process.argv.length > 2 ? process.argv[2] : 8000;
const fs   = require('fs');

const superagent = require('superagent');
const express    = require('express');
const app        = express();

// Whitelist array. If URL to be proxied starts with any of these
// URLs, it will be proxied. For example,
// serverlistURLs = ["http://server1.com/hapi", "http://server2.com/path/hapi"]
// If empty, all requests will be proxied.
let serverlistURLs = []; 

let indexFile = __dirname + "/../index.htm";
app.get('/', function (req,res) {
  let html = fs.readFileSync(indexFile, "utf8").toString()
  res.send(html);
});

// Serve static files in ./css and ./js dirs
app.use("/css", express.static(__dirname + '/../css'));
app.use("/js", express.static(__dirname + '/../js'));
app.use("/scripts", express.static(__dirname + '/../scripts'));

let streamChunks = true;

app.get('/proxy', function (req, res) {

  console.log("Proxying " + req.query.url);
  let url = decodeURI(req.query.url);

  var allowProxy = false;
  if (serverlistURLs.length > 0) {
    for (i in serverlistURLs) {
      if (url.startsWith(serverlistURLs[i])) {
        allowProxy = true;
        break;
      }
    }
  } else {
    allowProxy = true;    
  }

  if (allowProxy == false) {
    res.status(407).send("URL not in whitelist.");
    return;
  }

  // CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if (streamChunks === true) {
    superagent
      .get(url)
      .buffer()
      .parse((proxy_res, callback) => {
        proxy_res.on('data', chunk => {
         res.write(chunk)
        })
        proxy_res.on('end', () => {
          res.end();
        })
        proxy_res.on('error', (err) => {
          console.log(err);
          res.status(501).send("");
          return;
        })
      })
      .end(function() {}); // end is required otherwise hangs.

    return;
  }

  // Only handles text and does not stream.
  superagent.get(url).end(function (err, res_proxy) {
    res.set(res_proxy.headers);
    res.send(res_proxy.text);
  });
});

if (serverlistURLs.length == 0) {
  console.log("**Warning: Running open proxy. To prevent this, edit serverlistURLs array in proxy.js.**");
}

app.listen(PORT, function () {
  console.log("Listening on port " + PORT);
});
