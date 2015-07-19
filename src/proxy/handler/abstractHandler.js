var EventEmitter = require('events').EventEmitter
var Transform = require('stream').Transform;
var _ = require('underscore');
var inspect = require('../../inspect/inspect');
var utils = require('../../utils');

function AbstractHandler(req, res) {
    this.req = req;
    this.dist = req.dist;
    this.res = res;
    this.listenError(this.req);
    this.listenError(this.req.socket);
    this.listenError(this.res);
    this.on('response', this.response.bind(this));
    // 如果是post get方法中应立刻读取body 
    this.get();
    // chrome inspect
    if (this.inpectable !== false) {
        this.inspect = inspect.createInpectRequest(req);
    }
}

var proto = AbstractHandler.prototype;

proto.__proto__ = EventEmitter.prototype;

/**
 * 是否可以inspect
 */
proto.inpectable = true;

var statusCodeMap = {
    200: 'OK',
    404: 'Not Found',
    500: 'Internal Server Error',
    501: 'Not Implemented'
};

/**
 * common response
 */
proto.response = function(msg) {
    var newMsg;
    if (msg.readable) {
        newMsg = new Transform();
        newMsg._transform = function(chunk, charset, done) {
            done(null, chunk);
        };
        msg.pipe(newMsg);
    } else {
        newMsg = {};
    }

    var statusCode = msg.statusCode || 200;
    var statusMessage = msg.statusMessage || statusCodeMap[statusCode];
    _.extend(newMsg, {
        statusCode: statusCode,
        statusMessage: statusMessage,
        headers: getResponseHeaders(msg.headers),
        ext: getResponseExt(msg.headers)
    });

    this._response(newMsg);
};

proto._response = function(msg) {
    var res = this.res;
    // write head
    res.writeHead(msg.statusCode, msg.statusMessage, msg.headers);

    // if is a stream
    if (msg.readable) {
        msg.pipe(res);
    }

    if (this.inspect) {
        this.inspect.response(msg);
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

