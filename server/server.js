checkNodeJSVersion();
const path = require('path');

const app = require('express')();

const initUI    = require('./lib/initUI.js');
const initProxy = require('./lib/initProxy.js');

let argv = require('yargs')
  .strict()
  .help()
  .option('file', {
    'description': 'Catalog configuration file or file pattern',
    'type': 'string',
    'default': require("path").normalize(path.join(__dirname, "..", "metadata", "TestData2.0.json")),
    'alias': 'f'
  })
  .option('port', {
    'description': 'Server port',
    'default': 8000,
    'type': 'number',
    'alias': 'p'
  })
  .option('loglevel', {
    'description': 'info or debug',
    'default': 'info',
    'type': 'string'
  })
  .option('debug', {
    'description': "set loglevel to 'debug'",
    'default': false,
    'type': 'boolean'
  })
  .option('logdir', {
    'description': 'Log directory',
    'default': path.normalize(path.join(__dirname, "..", "log")),
    'type': 'string',
    'alias': 'l'
  })
  .option('proxy-whitelist', {
    'description': 'Allow proxying of servers in this file (so one can use server=http://... in address bar of server-ui).',
    'default': '',
    'type': 'string'
  })
  .option('verifier', {
    'description': 'Verifier server URL on landing page (__VERIFIER__ in html is replaced with this value)',
    'default': 'http://hapi-server.org/verify/',
    'type': 'string'
  })
  .option('plotserver', {
    'description': 'Plot server URL on landing page (__PLOTSERVER__ in html is replaced with this value)',
    'default': 'http://hapi-server.org/plot/',
    'type': 'string'
  })
  .argv;

let log = require("log");
log["logDir"]   = argv["logdir"];
log["logLevel"] = argv["debug"] ? "debug": log["logLevel"];
log.debug("logDir: " + log["logDir"]);
log.debug("logLevel: " + log["logLevel"]);

const indexHTMLFile = path.normalize(path.join(__dirname, "..", "index.htm"));
log.debug("indexHTMLFile: " + indexHTMLFile);

// URLs and names of files that contain lists of HAPI servers to expose in the web UI
// and responses to /all.txt, which is read by index.html.
const allFile = path.normalize(path.join(__dirname, "..", "all.txt"));
log.debug("allFile: " + allFile);

// Allow proxy of files and URLs that that start with the URLs in these files.
// The proxy is used by the client to get data from servers that do not have
// CORS enabled.
let whiteListFiles = [allFile];
if (argv["proxy-whitelist"]) {
  whiteListFiles = [allFile, argv.proxyWhitelist];
}
log.debug(`whiteListFiles: ${JSON.stringify(allFile)}`);

const initProxyOpts = {
  "allowOpenProxy": false,
  "handleNotFound": false
};

const initUIOpts = {
  indexHTMLFile: indexHTMLFile,
  verifier: argv["verifier"],
  plotServer: argv["plotserver"],
  proxyServer: "proxy?url=",
  allFile: allFile
};

initProxy(app, whiteListFiles, initProxyOpts, (err) => {

  if (err) {
    let msg = "Error initializing proxy. Error message:\n" + err.stack;
    console.error(`${msg}\nExiting with signal 1.`);
    process.exit(1);
  }

  initUI(app, initUIOpts);

  app.listen(argv.port, () => {
    console.log(`Server running at http://localhost:${argv.port}`);
    console.log("  Endpoints:");
    console.log("    / => " + indexHTMLFile);
    console.log("    /api");
    console.log("    /proxy?url=URL");
    console.log("    /hashchange?hash=HASH");
    console.log("    /error?hash=HASH&message=MESSAGE");
    console.log("    /all.txt");
  });
});

process.on('uncaughtException', function(err) {
  console.error(""); // Newline
  if (err.code === 'EADDRINUSE') {
    console.error("Port " + argv.port + " already in use.");
  } else {
    console.log(err);
  }
  console.error("Exiting with signal 1.");
  process.exit(1);
});

function checkNodeJSVersion() {
  // https://stackoverflow.com/questions/29349684/how-can-i-specify-the-required-node-js-version-in-package-json
  const semver = require('semver');
  const versionConstraint = require("../package.json").engines.node;
  if (!semver.satisfies(process.version, versionConstraint)) {
    let msg = `Error: Node.js semantic version constraint '${versionConstraint}' `
            + `not satisfied. node.js -v returns ${process.version}. `
            + "Consider installing https://github.com/creationix/nvm"
            + ` and then 'nvm install VERSION', where VERSION satisfies constraint.\n`;
    console.log(msg);
    process.exit(1);
  }
}
