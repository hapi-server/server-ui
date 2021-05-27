# About

This repository contains

1. a basic [entry/overview/landing web page](https://github.com/hapi-server/data-specification/blob/master/hapi-dev/HAPI-data-access-spec-dev.md) template for a [HAPI server](http://hapi-server.org/) and
2. code for a complex user interface for browsing servers and datasets, downloading data from your browser, generating \~10-line IDL/MATLAB/Python scripts to download data, and creating preview plots.

# Installation

To use 1. with your HAPI server, download [single.htm](https://raw.githubusercontent.com/hapi-server/server-ui/master/single.htm) and fill in the placeholders prefixed by `__`, save as `index.htm` and place in the directory associated with responses to the URL that ends in `hapi/`.

To use 2.,

First,

```bash
git clone https://github.com/hapi-server/server-ui
```

or download and extract the [zip archive of the code](https://github.com/hapi-server/server-nodejs/archive/master.zip).

```
cd server-ui; python3 -m http.server
# or
cd server-ui; python2 -m SimpleHTTPServer
# or
cd server-ui; npm install; npm start
```

and open `http://localhost:8000/` in a web browser.

# Configuration

By default, the list of servers at `http://localhost:8000/` will be that in https://github.com/hapi-server/servers/blob/master/all_.txt.

To use your own list, edit the URLs in `all_.txt`.

Alternatively, you can pass the URL of a server to create a menu for by passing it as a parameter in the hash. The following will cause the UI to show datasets in the SSCWeb HAPI server.

`http://hapi-server.org/servers-dev/#server=http://hapi-server.org/servers/SSCWeb/hapi`

# Proxy

If a server in `all.txt` or the `server` passed as a URL parameter does not allow [CORS](https://github.com/hapi-server/data-specification/blob/master/hapi-dev/HAPI-data-access-spec-dev.md#5-cross-origin-resource-sharing), you will need to create or use a proxy server to access resources from that server.

By default, if an request to `URL` fails, an attempt to retrieve it is made via the proxy request `/proxy?url=URL`. The URL for the proxy is set in the header of `index.htm`.

# Reporting issues

Please submit issues and feature requests to the [issue tracker](https://github.com/hapi-server/server-ui/issues).
