Demos: [Basic](https://hapi-server.org/servers/TestData2.0/hapi) | [Advanced](http://hapi-server.org/servers)

# About

This repository contains

1. a basic [entry/overview/landing web page](https://github.com/hapi-server/data-specification/blob/master/hapi-dev/HAPI-data-access-spec-dev.md) template for a [HAPI server](http://hapi-server.org/) ([Demo](https://hapi-server.org/servers/TestData2.0/hapi)) and
2. code for a landing page with a advanced user interface for browsing servers and datasets, downloading data from your browser, generating \~10-line IDL/MATLAB/Python scripts to download data, and creating preview plots ([Demo](http://hapi-server.org/servers)).

# Installation/Use

To use the basic landing page with your HAPI server, download [single.htm](https://raw.githubusercontent.com/hapi-server/server-ui/master/single.htm) and fill in the placeholders prefixed by `__`, save as `index.htm` and place in the directory associated with responses to the URL that ends in `hapi/`.

To use the landing page with an advanced user interface,

```bash
git clone https://github.com/hapi-server/server-ui
```

or download and extract the [zip archive of the code](https://github.com/hapi-server/server-ui/archive/refs/heads/master.zip) (and replace `server-ui` with `server-ui-master` in the following).

Then copy the contents of `server-ui` into your root HAPI server directory. Or,

```
cd server-ui; python3 -m http.server
# or
cd server-ui; python2 -m SimpleHTTPServer
# or
cd server-ui; npm install; npm start
```

and open `http://localhost:8000/` in a web browser.

# Advanced UI Configuration

By default, the list of servers at `http://localhost:8000/` will be that in https://github.com/hapi-server/servers/blob/master/all_.txt.

To use your own list, rename `all_.txt` to `all.txt` and enter the URL of your HAPI server.

# Advanced UI Use

You can pass the URL of a server to create a menu for by passing it as a parameter in the hash. The following will cause the UI to show datasets in the SSCWeb HAPI server.

`http://hapi-server.org/servers-dev/#server=http://hapi-server.org/servers/SSCWeb/hapi`

Several servers may be listed, e.g.,

`http://hapi-server.org/servers-dev/#server=http://hapi-server.org/servers/SSCWeb/hapi,https://cdaweb.gsfc.nasa.gov/hapi`

Note that this will only work if the servers allow [CORS](https://github.com/hapi-server/data-specification/blob/master/hapi-dev/HAPI-data-access-spec-dev.md#5-cross-origin-resource-sharing).

# Proxy

If a server in `all.txt` or the `server` passed as a URL parameter does not allow [CORS](https://github.com/hapi-server/data-specification/blob/master/hapi-dev/HAPI-data-access-spec-dev.md#5-cross-origin-resource-sharing), you will need to use a proxy server to access resources from that server.

A very basic webserver with a proxy can be run on port `8000` using

```
npm install
npm run proxyserver
# or
npm install
node proxy/proxy.js 8000
```

See the comments in [`proxy/proxy.js`](https://github.com/hapi-server/server-ui/blob/master/proxy/proxy.js) to constrain URLs that can be proxied.

By default, if an request to `URL` fails, an attempt to retrieve it is made via the proxy request `/proxy?url=URL`. The URL for the proxy is set in the header of [`index.htm`](https://github.com/hapi-server/server-ui/blob/master/index.htm).

# Reporting issues

Please submit issues and feature requests to the [issue tracker](https://github.com/hapi-server/server-ui/issues).
