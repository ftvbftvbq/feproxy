var EventEmitter = require('events').EventEmitter
var _ = require('underscore');
var frame = require('../frame');
var timestamp = require('../timestamp');

var Request = function(sockets) {
    this.sockets = sockets;
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

