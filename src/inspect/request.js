var EventEmitter = require('events').EventEmitter
var zlib = require('zlib');
var jschardet = require('jschardet');
var iconv = require('iconv-lite');

var _ = require('underscore');
var frame = require('./frame');
var timestamp = require('./timestamp');
var utils = require('../utils');

var MAX_POST = 1024 * 1024 * 2;
var MAX_RESPONSE = 1024 * 1024 * 2;

var Request = function(sockets, req) {
    if (sockets.length === undefined) {
        sockets = [ sockets ];
    }
    this.sockets = sockets;
    this.req = req;
    this.id = ++Request.id;
    this.frameId = frame.id;
    this.loaderId = frame.loaderId;
    this.requestId = this.id + '.27'; 
    this.on('send', this.onSend.bind(this));
    this.on('response', this.onResponse.bind(this));
    this.on('data', this.onData.bind(this));
    this.on('finish', this.onFinish.bind(this));
    this.on('error', this.onError.bind(this));

    this.request();
};

Request.id = 0;

var proto = Request.prototype;

proto.__proto__ = EventEmitter.prototype;

proto.request = function() {
    var req = this.req;
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
            sendData.postData = postChunk && postChunk.toString() || null;
            this.emit('send', sendData);
        });
    } else {
        this.emit('send', sendData);
    }
};

proto.response = function(res) {
    var me = this;
    var req = me.req;
    var data = {
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
    };
    // head
    me.emit('response', data);

    if (res.readable) {
        var bodyChunk = new Buffer(0);
        res.on('data', function(chunk) {
            if (!bodyChunk 
                || bodyChunk.length + chunk.length > MAX_RESPONSE
            ) {
                bodyChunk = null;
            } else {
                bodyChunk = Buffer.concat([bodyChunk, chunk]);
            }
            me.emit('data', {
                dataLength: chunk.length,
                encodedDataLength: chunk.length
            });
        });
        res.on('end', function() {
            decodeResponseData(res, bodyChunk, function(result) {
                me.setResponseBody({
                    base64: result.base64,
                    body: result.body
                });
                me.emit('finish', {
                    dataLength: result.decoded.length,
                    encodedDataLength: bodyChunk.length
                });
            });
        });
    } else {
        me.emit('finish', {
            dataLength: 0,
            encodedDataLength: 0
        });
    }
    // clear data
    me.req = null;
    me.res = null;
};

/**
 * decode response
 * http 模块会自动处理chunked
 */
function decodeResponseData(res, chunk, cb) {
    var ext = res.ext;
    switch (ext.contentEncoding) {
        case 'gzip':
            zlib.gunzip(chunk, decodeBodyBack);
            break;
        case 'deflate':
            zlib.inflate(chunk, decodeBodyBack);
            break;
        case 'sdch':
        default: 
            decodeBodyBack(null, chunk);
            break;
    }

    function decodeBodyBack(err, decodedChunk) {
        if (err) {
            console.log('decode err: ' + err);
        }
        decodedChunk = err ? null : decodedChunk;

        var result = {
            decoded: decodedChunk, 
            base64: false,
            body: ''
        };

        if (decodedChunk) {
            if (utils.isText(ext.mimeType)) {
                // get charset
                var charset = ext.charset 
                    || jschardet.detect(decodedChunk).encoding || 'utf-8';
                result.base64 = false;
                result.body = iconv.decode(decodedChunk, charset).toString();
            } else {
                result.base64 = true;
                result.body = decodedChunk.toString('base64');
            }
        }

        cb(result);
    }
}

proto.onSend = function(request) {
    request = request || {};
    this.send('Network.requestWillBeSent', {
        documentURL: frame.url,
        request: {
            url: request.url,
            method: request.method || 'GET',
            headers: request.headers || {},
            postData: request.postData || ''
        },
        wallTime: +new Date() / 1000,
        initiator: {
            type: 'other'
        },
        type: 'Other'
    });
};

proto.onResponse = function(res) {
    res = res || {};
    this.send('Network.responseReceived', {
        type: res.mimeType.indexOf('image') !== -1 ? 'Image' : 'Other',
        response: {
            url: res.url,
            status: res.status,
            statusText: res.statusText,
            headers: res.headers,
            headersText: res.headersText,
            mimeType: res.mimeType,
            connectionReused: false,
            connectionId: -1,
            encodedDataLength: -1,
            fromDiskCache: false,
            fromServiceWorker: false,
            timing: {
                requestTime: timestamp(),
                proxyStart: -1,
                proxyEnd: -1,
                dnsStart: -1,
                dnsEnd: -1,
                connectStart: 0,
                connectEnd: 0,
                sslStart: 0,
                sslEnd: 0,
                workerStart: -1,
                sendStart: 0,
                sendEnd: 0,
                receiveHeadersEnd: 0
            },
            requestHeaders: res.requestHeaders,
            requestHeadersText: res.requestHeadersText,
            remoteIPAddress: res.remoteIPAddress,
            remotePort: res.remotePort,
            protocol: res.protocol || 'http/1.1'
        }
    });
};

proto.onData = function(data) {
    this.send('Network.dataReceived', {
        dataLength: data.dataLength,
        encodedDataLength: data.encodedDataLength
    });
};

proto.onFinish = function(data) {
    this.send('Network.dataReceived', {
        dataLength: data.dataLength - data.encodedDataLength,
        encodedDataLength: 1
    });
    this.send('Network.loadingFinished', {
        dataLength: data.dataLength,
        encodedDataLength: data.encodedDataLength
    });
};

proto.onError = function() {

};

proto.setResponseBody = function(responseBody) {
    this.responseBody = responseBody;
};

proto.getResponseBody = function() {
    return this.responseBody;
};

proto.send = function(method, params) {
    params = _.extend({
        frameId: this.frameId,
        loaderId: this.loaderId,
        timestamp: timestamp(),
        requestId: this.requestId,
    }, params || {});
    this.sockets.forEach(function(item) {
        try {
            item.send(JSON.stringify({
                method: method,
                params: params
            }));
        } catch (ex) {
            console.log(ex);
        }
    });
};

module.exports = Request;

