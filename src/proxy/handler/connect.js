var net = require('net');
var _ = require('underscore');
var AbstractHandler = require('./abstractHandler');

var Handler = function() {
    AbstractHandler.apply(this, arguments);
};

var proto = Handler.prototype;

proto.get = function() {
    var me = this;
    var dist = me.dist;
    var req = me.req;
    
    var res = net.connect(dist.port, dist.hostname, function() {
        req.socket.write([
            'HTTP/1.1 200 Connection established',
            'Proxy-Connection: close',
            '\r\n'
        ].join('\r\n'));
        req.socket.pipe(res);
        res.pipe(req.socket);
    });
    this.listenError(res);
};

/**
 * 取消inpect
 */
proto.inpectable = false;

proto.__proto__ = AbstractHandler.prototype;

module.exports = Handler;

