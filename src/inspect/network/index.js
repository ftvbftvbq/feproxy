var stream = require('stream');
var zlib = require('zlib');
var jschardet = require('jschardet');
var iconv = require('iconv-lite');
var utils = require('../../utils');
var url = require('../../url');
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
exports.onResponse = function(req, res, s, cb) {
    if (!req._inspect) {
        return cb(s);
    }

    var inspect = req._inspect;

    inspect.emit('response', {
        url: req.url,
        status: res.statusCode,
        statusText: res.statusMessage,
        headers: utils.wrapHeaders(res.headers),
        headersText: utils.headersText(res.headers),
        mimeType: utils.headerContentType(res.headers).mimeType,
        requestHeaders: utils.wrapHeaders(req.headers),
        requestHeadersText: utils.headersText(req.headers),
        remoteIPAddress: req.dist.hostname,
        remotePort: req.dist.port
    });

    var ext = res.ext,
        readable = s && s.readable,
        isText = utils.isText(ext.mimeType), // 是否是文本
        needInject = ext.mimeType.indexOf('html') !== -1; // 是否需要注入

    if (!readable) {
        cb(s);
        inspect.emit('finish', {
            dataLength: 0,
            encodedDataLength: 0
        });
        return;
    }

    // TODO open it
    needInject = false;

    if (needInject) {
        onResponseTextInject(req, res, s, cb);
    } else if (isText) {
        onResponseText(req, res, s, cb);
    } else {
        onResponseBinary(req, res, s, cb);
    }
};

function onResponseText(req, res, s, cb) {
    cb(s);
    s.pipe(rawLen(req._inspect))
        .pipe(unzip(res.ext))
        .pipe(progress(req._inspect))
        .pipe(charset(res.ext))
        .once('charset', function(charset) {
            this.pipe(iconv.decodeStream(charset))
                .pipe(responseBodyText(req._inspect))
                .pipe(passWrite())
        });
}

function onResponseTextInject(req, res, s, cb) {
    s.pipe(rawLen(req._inspect))
        .pipe(unzip(res.ext))
        .pipe(progress(req._inspect))
        .pipe(charset(res.ext))
        .once('charset', function(charset) {
            var modified = this.pipe(iconv.decodeStream(charset))
                .pipe(inject())
                .pipe(responseBodyText(req._inspect))
                .pipe(iconv.encodeStream(charset));
            // 不再zip等
            utils.deleteHeader(res.headers, 'content-encoding');
            res.ext.contentEncoding = '';
            cb(modified, true);
        });
}

function onResponseBinary(req, res, s, cb) {
    cb(s);
    s.pipe(rawLen(req._inspect))
        .pipe(unzip(res.ext))
        .pipe(progress(req._inspect))
        .pipe(responseBody(req._inspect))
        .pipe(passWrite())
}

function rawLen(inspect) {
    var len = 0;
    return new stream.Transform({
        transform: function(chunk, encoding, done) {
            len += chunk.length;
            done(null, chunk);
        },
        flush: function(done) {
            inspect.encodedDataLength = len;
            done();
        }
    });
}

function progress(inspect) {
    return new stream.Transform({
        transform: function(chunk, encoding, done) {
            inspect.emit('data', {
                dataLength: chunk.length
            });
            done(null, chunk);
        }
    });
}

function unzip(ext) {
    if (ext.contentEncoding) {
        if (ext.contentEncoding.indexOf('gzip') !== -1) {
            return zlib.createGunzip();
        } else if (ext.contentEncoding.indexOf('deflate') !== -1) {
            return zlib.createInflate()
        } else {
            var msg = 'unsupported content-encoding: ' + ext.contentEncoding;
            console.log(msg);
            return passMessage(msg);
        }
    } else {
        return new stream.PassThrough();
    }
}

function charset(ext) {
    var charset = null;
    return new stream.Transform({
        transform: function(chunk, encoding, done) {
            if (!charset) {
                charset = ext.charset || jschardet.detect(chunk).encoding 
                    || 'utf-8';
                this.emit('charset', charset);
            }
            done(null, chunk);
        }
    });
}

function responseBody(inspect) {
    var buff = new Buffer(0);
    return new stream.Transform({
        transform: function(chunk, encoding, done) {
            if (buff) {
                buff = Buffer.concat([buff, chunk]);
                if (buff.length > MAX_RESPONSE) {
                    buff = null;
                }
            }
            done(null, chunk);
        },
        flush: function(done) {
            inspect.emit('finish', {
                encodedDataLength: inspect.encodedDataLength
            });
            inspect.setResponseBody({
                base64: true,
                body: buff.toString('base64')
            });
            done();
        }
    });
}

function responseBodyText(inspect) {
    var str = '';
    return new stream.Transform({
        objectMode: true,
        transform: function(chunk, encoding, done) {
            if (str !== null) {
                str += chunk;
                if (str.length > MAX_RESPONSE) {
                    str = null;
                }
            }
            done(null, chunk);
        },
        flush: function(done) {
            inspect.emit('finish', {
                encodedDataLength: inspect.encodedDataLength
            });
            inspect.setResponseBody({
                base64: false,
                body: str
            });
            done();
        }
    });
}

function passMessage(str) {
    return new stream.Transform({
        transform: function(chunk, encoding, done) {
            done(null, new Buffer(0));
        },
        flush: function(done) {
            this.push(str || '');
            done();
        }
    });
}

function passWrite() {
    return new stream.PassThrough({
            objectMode: true
        })
        .on('data', new Function())
        .on('end', new Function());
}

function inject() {
    var injected = false,
        cfg = {
            url: url()
        },
        str = '<script>var $$feproxy=' + JSON.stringify(cfg) + ';</script>\n'
            + '<script src="' + url('devtools/client.js') + '"></script>';
    return new stream.Transform({
        objectMode: true,
        transform: function(chunk, encoding, done) {
            if (!injected && chunk) {
                chunk = chunk.replace(
                    /(<script)/, 
                    str + '\n$1'
                );
                injected = true;
            }
            done(null, chunk);
        }
    });
}

