# static proxy

Simple node server for serving static content

## Usage

    node app.js <port> <proxy-port> [proxy-host] [root-dir]

## Features

* A single file
* No dependencies outside the standard libary
* If the URL matches a directory, the special file `index` is served
