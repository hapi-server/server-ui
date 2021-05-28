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

app.get('/proxy', function (req, res) {
	console.log("Proxying " + req.query.url);

	let url = decodeURI(req.query.url);

	var allowProxy = false;
	if (serverlistURLs.length > 0) {
		for (i in serverlistURLs) {
			if (url.startsWith(serverlistURLs[i])) {
				proxyOK = true;
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

	superagent.get(url).end(function (err, res_proxy) {
		console.log("Proxied " + url);
		if (err) {
			console.log(err);
			res.status(501).send("");
			return;			
		}
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
