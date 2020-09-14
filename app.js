const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');

const config = {
    incomingPort: null,
    outgoingPort: null,
    outgoingHost: 'localhost',
    root: '.'
};

function parseConfig(args) {
    let keys = ['incomingPort', 'outgoingPort', 'outgoingHost', 'root'];
    args.forEach(function (arg, index) {
        var key = keys[index];
        config[key] = arg;
    });
}

let args = process.argv.slice(2);
parseConfig(args);

if (!config.incomingPort) {
    console.error('missing incoming port');
    process.exit(1);
}
if (!config.outgoingPort) {
    console.error('missing outgoing port');
    process.exit(1);
}

http.createServer(function (req, res) {
    let files = searchPath(req);
    let result = readFirstExisting(files);
    if (result !== null) {
        let file = result.file;
        let contents = result.contents;

        //set content type
        console.log('serving', file);
        return res.end(contents);
    }

    let proxyReq = proxy(req, res);
    console.log('proxying to', proxyReq.method, proxyReq.path);
}).listen(config.incomingPort, function () {
    console.log('listening on port', config.incomingPort);
    console.log('proxying to', config.outgoingHost + ':' + config.outgoingPort);
    console.log('serving directory', config.root);
});

function searchPath(req) {
    let urlPath = url.parse(req.url).pathname;
    let filePath = path.join(config.root, urlPath);

    return [
        filePath,
        path.join(filePath, 'index')
    ];
}

function readFirstExisting(files) {
    for (let index in files) {
        let file = files[index];
        try {
            let contents = fs.readFileSync(file, 'utf-8');
            return {file: file, contents: contents};
        } catch (ignored) {
        }
    }
    return null;
}

function proxy(req, res) {
    let method = req.method;
    let url = req.url;
    let headers = req.headers;

    let options = {
        hostname: config.outgoingHost,
        port: config.outgoingPort,
        path: url,
        method: method,
        headers: headers
    };

    let proxyReq = http.request(options, function (proxyRes) {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
    }).on('error', function (err) {
        console.error('failed proxying to', proxyReq.method, proxyReq.path);
        res.statusCode = 502;
        res.end();
    });

    req.pipe(proxyReq);
    return proxyReq;
}
