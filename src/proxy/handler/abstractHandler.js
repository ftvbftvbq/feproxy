var EventEmitter = require('events').EventEmitter
var _ = require('underscore');
var networkInspect = require('../../inspect/network');
var utils = require('../../utils');

function AbstractHandler(req, res) {
    this.req = req;
    this.dist = req.dist;
    this.res = res;
    this.listenError(this.req);
    this.listenError(this.req.socket);
    this.listenError(this.res);
    this.on('response', this.response.bind(this));
    // chrome inspect
    if (this.inpectable !== false) {
        networkInspect.onSend(req);
    }
    // 如果是post get方法中应立刻读取body 
    this.get();
}

var proto = AbstractHandler.prototype;

proto.__proto__ = EventEmitter.prototype;

/**
 * 是否可以inspect
 */
proto.inpectable = true;

var statusCodeMap = {
    200: 'OK',
    302: 'Moved Temporarily',
    404: 'Not Found',
    500: 'Internal Server Error',
    501: 'Not Implemented',
    unknown: 'Unknown'
};

/**
 * common response
 */
proto.response = function(msg) {
    var statusCode = msg.statusCode || 200;
    var statusMessage = msg.statusMessage 
        || statusCodeMap[statusCode] 
        || statusCodeMap.unknown;
    var headers = getResponseHeaders(msg.headers);
    var ext = getResponseExt(msg.headers);

    var res = this.res;

    if (this.inpectable) {
        networkInspect.onResponse(this.req, {
            statusCode: statusCode,
            statusMessage: statusMessage,
            headers: headers,
            ext: ext
        }, msg, function(stream, modifiedStream) {
            write(stream, modifiedStream);
        });
    } else {
        write(msg);
    }

    function write(stream, modifiedStream) {
        if (modifiedStream) {
            // 如果修改了响应, contentlength就失效了, 改为chunked传输
            if (utils.header(headers, 'content-length')) {
                utils.deleteHeader(headers, 'content-length');
                headers['transfer-encoding'] = 'chunked';
            }
        }

        // write head
        res.writeHead(statusCode, statusMessage, headers);

        // if is a stream
        if (stream && stream.readable) {
            stream.pipe(res);
        } else {
            res.end();
        }
    }
};

function getResponseHeaders(headers) {
    headers = _.extend({}, headers);
    var defaultHeaders = {
        'Cache-Control': 'max-age=0, must-revalidate',
        Date: new Date().toUTCString()
    };
    _.each(defaultHeaders, function(v, k) {
        if (!headers[k] && !headers[k.toLowerCase()]) {
            headers[k] =  v;
        }
    });
    
    _.extend(headers, {
        'Proxy-Connection': 'close'
    });

    return headers;
}

function getResponseExt(headers) {
    var charset = utils.header(headers, 'Content-Type')
        .match(/charset=([^;\s]*)/);
    return {
        contentEncoding: utils.header(headers, 'Content-Encoding') || '',
        mimeType: utils.header(headers, 'Content-Type').match(/[^;]*/)[0] || '',
        charset: charset && charset[1] || ''
    };
}

/**
 * @abstract
 */
proto.get = new Function();

/**
 * listen error
 */
proto.listenError = function(stream) {
    if (!this._listened) {
        this._listened= [];
    }
    this._listened.push(stream);
    stream.on('error', this._onListenedError.bind(this));
};

/**
 * on error
 */
proto._onListenedError = function(ex) {
    console.log('error: ' + ex);
    this._listened.forEach(function(item) {
        try {
            item.end && item.end();
        } catch (ex) {}
        try {
            item.close && item.close();
        } catch (ex) {}
    });
};

module.exports = AbstractHandler;

