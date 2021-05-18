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

To use your own server, edit the file `all_.txt` so that it contains the URL of your server and rename this file to `all.txt`.

# Reporting issues

Please submit issues and feature requests to the [issue tracker](https://github.com/hapi-server/server-ui/issues).
