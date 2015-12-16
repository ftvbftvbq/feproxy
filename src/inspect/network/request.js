var EventEmitter = require('events').EventEmitter
var _ = require('underscore');
var frame = require('../frame');
var timestamp = require('../timestamp');

/**
 * @constructor
 * @param {Array<Socket>} sockets
 */
var Request = function(sockets) {
    this.sockets = sockets || [];
    this.id = ++Request.id;
    this.frameId = frame.id;
    this.loaderId = frame.loaderId;
    this.requestId = this.id + '.27'; 
    this.on('send', this.onSend.bind(this));
    this.on('response', this.onResponse.bind(this));
    this.on('data', this.onData.bind(this));
    this.on('finish', this.onFinish.bind(this));
    this.on('error', this.onError.bind(this));
};

Request.id = 0;

var proto = Request.prototype;

proto.__proto__ = EventEmitter.prototype;

/**
 * @param {Object} request
 *  {
 *
 *  }
 */
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

function getResourceType(contentType) {
    if (contentType && contentType.match) {
        if (contentType.match('text/css')) {
            return 'Stylesheet';
        }
        if (contentType.match('text/html')) {
            return 'Document';
        }
        if (contentType.match('/(x-)?javascript')) {
            return 'Script';
        }
        if (contentType.match('image/')) {
            return 'Image';
        }
        if (contentType.match('video/')) {
            return 'Media';
        }
        if (contentType.match('font/') || contentType.match('/(x-font-)?woff')) {
            return 'Font';
        }
        if (contentType.match('/(json|xml)')) {
            return 'XHR';
        }
    }

    return 'Other';
}

/**
 * @param {Object} res
 *  {
 *
 *  }
 */
proto.onResponse = function(res) {
    res = res || {};
    this.send('Network.responseReceived', {
        type: getResourceType(res.mimeType),
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
    this.send('Network.loadingFinished', {
        dataLength: data.dataLength,
        encodedDataLength: data.encodedDataLength
    });
    // 清除sockets 释放内存
    this.sockets = null;
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

