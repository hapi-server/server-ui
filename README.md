Demos: [Basic](https://hapi-server.org/servers/TestData2.0/hapi) | [Advanced](http://hapi-server.org/servers)

# About

This repository contains

1. a basic [entry/overview/landing web page](https://github.com/hapi-server/data-specification/blob/master/hapi-dev/HAPI-data-access-spec-dev.md) template for a [HAPI server](http://hapi-server.org/) ([Demo](https://hapi-server.org/servers/TestData2.0/hapi)) and
2. code for a landing page with a advanced user interface for browsing servers and datasets, downloading data from your browser, generating \~10-line IDL/MATLAB/Python scripts to download data, and creating preview plots ([Demo](http://hapi-server.org/servers)).

# Installation/Use

## Basic

To use the basic landing page with your HAPI server, download [single.htm](https://raw.githubusercontent.com/hapi-server/server-ui/master/single.htm) and fill in the placeholders prefixed by `__`, save as `index.htm` and place in the directory associated with responses to a URL that ends in `/hapi`.

## Advanced

To use the landing page with an advanced user interface,

```bash
git clone https://github.com/hapi-server/server-ui
```

Then, edit `all.txt` and configure your server so that responses to a URL that ends in `/hapi` are associated with the `sever-ui` directory.

Or, for testing, cd to the `server-ui` directory, edit `all.txt`, and execute

```
cd server-ui; python2 -m SimpleHTTPServer
# or
cd server-ui; python3 -m http.server
# or
cd server-ui; npm install; npm start
```

and open `http://localhost:8000/` in a web browser.

### UI Configuration

By default, the list of servers shown at `http://localhost:8000/` will be that in https://github.com/hapi-server/servers/blob/master/all_.txt.

To use your own list, rename `all_.txt` to `all.txt` and enter the URL of your HAPI server in `all.txt`.

### UI Use

You can pass the URL of a server to create a menu for by passing it as a parameter in the hash. The following will cause the UI to show datasets in the SSCWeb HAPI server.

`http://hapi-server.org/servers/#server=https://hapi-server.org/servers/SSCWeb/hapi`

Note that this will only work if the server(s) allow [CORS](https://github.com/hapi-server/data-specification/blob/master/hapi-dev/HAPI-data-access-spec-dev.md#5-cross-origin-resource-sharing) or the proxy server below is used.

# Proxy Server

If a server in `all.txt` or the `server` [passed as a URL parameter](ui-use) does not allow [CORS](https://github.com/hapi-server/data-specification/blob/master/hapi-dev/HAPI-data-access-spec-dev.md#5-cross-origin-resource-sharing), you will need to use a proxy server to access resources from that server.

A server with a proxy can be run on port `8000` using

```
npm install
npm run proxy-server --port 8000
# or, equivalently,
npm install
node server/server.js --port 8000
```

See the comments in [`server/server.js`](https://github.com/hapi-server/server-ui/blob/master/proxy/proxy.js) to constrain URLs that can be proxied.

By default, if an request to `URL` fails, an attempt to retrieve it is made via the proxy request `proxy?url=URL`. The URL for the proxy is set in the header of [`index.htm`](https://github.com/hapi-server/server-ui/blob/master/index.htm).

# Reporting issues

Please submit issues and feature requests to the [issue tracker](https://github.com/hapi-server/server-ui/issues).
