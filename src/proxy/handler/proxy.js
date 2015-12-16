var net = require('net');
var http = require('http');
var _ = require('underscore');
var utils = require('../../utils');
var Class = utils.Class;
var AbstractHandler = require('./abstractHandler');

var Handler = function() {
    AbstractHandler.apply(this, arguments);
};

var proto = Handler.prototype;

proto.get = function() {
    var me = this;
    var dist = me.dist;
    var req = me.req;
    var client = http.request({
        hostname: dist.proxy.hostname,
        port: dist.proxy.port,
        path: dist.href,
        headers: getHeaders(req, dist),
        method: req.method
    }, function(res) {
        me.emit('response', res);
    });
    if (req.method === 'POST') {
        // write post body
        req.pipe(client);
    } else {
        client.end();
    }
    this.listenError(client);
};

function getHeaders(req, dist) {
    var headers = _.extend({}, req.headers);
    ['Connection', 'Proxy-Connection', 'Prxoy-Authenticate', 'Host',
        'Transfer-Encoding', 'Upgrade'].forEach(function(item) {
        headers[item] && delete headers[item];
        headers[item.toLowerCase()] && delete headers[item.toLowerCase()];
    });
    
    headers['Proxy-Connection'] = 'close';
    headers.Host = dist.hostname;
    return headers;
}

proto.__proto__ = AbstractHandler.prototype;

module.exports = Handler;

