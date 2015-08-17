var Transform = require('stream').Transform;
var zlib = require('zlib');
var jschardet = require('jschardet');
var iconv = require('iconv-lite');
var utils = require('../../utils');
var inspectMain = require('../index');
var Request = require('./request');
var pool = require('./pool');

var MAX_POST = 1024 * 1024 * 2;
var MAX_RESPONSE = 1024 * 1024 * 2;

function createInpectRequest() {
    var connects = inspectMain.getConnects();
    if (!connects || !connects.length) {
        //return null;
    }
    var request = new Request(connects);
    pool.save(request);
    return request;
}

/**
 * send request
 */
exports.onSend = function(req) {
    req._inspect = createInpectRequest();
    if (!req._inspect) {
        return;
    }
    var inspect = req._inspect;
    var sendData = {
        url: req.url,
        method: req.method,
        headers: req.headers
    };
    if (req.method === 'POST') {
        var postChunk = new Buffer(0);
        // multipart
        if (utils.headerContentType(req.headers).mimeType 
                === 'multipart/form-data') {
            postChunk = null;
        }
        req.on('data', function(chunk) {
            if (!postChunk || postChunk.length + chunk.length > MAX_POST) {
                postChunk = null;
            } else {
                postChunk = Buffer.concat([postChunk, chunk]);
            }
        });
        req.on('end', function() {
            if (postChunk) {
                var charset = jschardet.detect(postChunk).encoding || 'utf-8';
                sendData.postData = iconv.decode(postChunk, charset).toString();
            }
            inspect.emit('send', sendData);
        });
    } else {
        inspect.emit('send', sendData);
    }
};

/**
 * response
 */
exports.onResponse = function(req, res, stream, cb) {
    if (!req._inspect) {
        return cb(stream);
    }

    var inspect = req._inspect;
    inspect.emit('response', {
        url: req.url,
        status: res.statusCode,
        statusText: res.statusMessage,
        headers: res.headers,
        headersText: utils.headersText(res.headers),
        mimeType: utils.headerContentType(res.headers).mimeType,
        requestHeaders: req.headers,
        requestHeadersText: utils.headersText(req.headers),
        remoteIPAddress: req.dist.hostname,
        remotePort: req.dist.port
    });

    var ext = res.ext;
    var readable = stream && stream.readable;
    var isText = utils.isText(ext.mimeType); // 是否是文本
    var needInject = ext.mimeType.indexOf('html') !== -1; // 是否需要注入
    needInject = false;

    if (!readable) {
        inspect.emit('finish', {
            dataLength: 0,
            encodedDataLength: 0
        });
        return cb(stream);
    }

    var unzipChunk = new Buffer(0);
    var charset;
    var rawLength = 0; // raw length

    if (!needInject) {
        // 如果不需注入, 不需要修改stream, 立刻回调
        // 但不return 下面还需要inpect
        cb(stream);
    }

    stream.on('data', function(chunk) {
        rawLength += chunk.length;
    });

    // unzip ...
    switch (ext.contentEncoding) {
        case 'gzip':
            stream = stream.pipe(zlib.createGunzip());
            break;
        case 'deflate':
            stream = stream.pipe(zlib.createInflate());
            break;
    }

    // collect chunk & data event
    stream.on('data', function(chunk) {
        if (!unzipChunk || unzipChunk.length + chunk.length > MAX_RESPONSE) {
            unzipChunk = null;
        } else {
            unzipChunk = Buffer.concat([unzipChunk, chunk]);
        }
        inspect.emit('data', {
            dataLength: chunk.length
        });
    });

    if (isText) {
        // decode stream
        stream.once('data', function(chunk) {
            // 获取编码
            charset = ext.charset || jschardet.detect(chunk).encoding 
                || 'utf-8';
            var iconvStream = iconv.decodeStream(charset);
            iconvStream.write(chunk);
            stream.pipe(iconvStream);
            stream = iconvStream;
            charsetNext();
        });
    } else {
        charsetNext();
    }
    
    function charsetNext() {
        // 注入
        if (needInject) {
            stream = injectStream(stream, ext);
        }

        // collect text
        var responseText = '';
        if (isText) {
            stream.on('data', function(text) {
                if (responseText !== null) {
                    responseText += text;
                }
                if (responseText.length > MAX_RESPONSE) {
                    responseText = null;
                }
            });
        }
        // 注入后重新编码
        if (needInject) {
            // encode
            stream = stream.pipe(iconv.encodeStream(charset));

            // zip
            switch (ext.contentEncoding) {
                case 'gzip':
                    stream = stream.pipe(zlib.createGzip());
                    break;
                case 'deflate':
                    stream = stream.pipe(zlib.createDeflate());
                    break;
            }
        }

        // end finish
        stream.on('end', function() {
            var responseBody = {};
            if (isText) {
                responseBody.base64 = false;
                responseBody.body = responseText;
            } else {
                responseBody.base64 = true;
                responseBody.body = unzipChunk.toString('base64');
            }
            inspect.setResponseBody(responseBody);
            inspect.emit('finish', {
                encodedDataLength: rawLength
            });
        });

        if (needInject) {
            // 剩余的回调
            cb(stream, true);
        }
    }
};

function injectStream(stream, ext) {
    var newStream = new Transform({
        writeableObjectMode: true,
        readableObjectMode: true,
        decodeStrings: false
    });
    var injected = false;
    newStream._transform = function(chunk, charset, done) {
        if (!injected && chunk) {
            chunk = chunk.replace(
                /(<script)/, 
                '<script src="http://127.0.0.1:8080/devtools/client.js"></script>$1'
            );
            injected = true;
        }
        this.push(chunk, charset);
        done(null);
    };
    stream.pipe(newStream);
    return newStream;
};

