var http = require('http');
var fs = require('fs');
var mime = require('mime-types');
var _ = require('underscore');
var AbstractHandler = require('./abstractHandler');

var Handler = function() {
    AbstractHandler.apply(this, arguments);
};

var proto = Handler.prototype;

proto.get = function() {
    var me = this;
    var dist = me.dist;
    var path = dist.ext.replace(/^\/?/, '/').replace(/\?.*$/, '');
    var response;
    if (path && fs.existsSync(path)) {
        var stats = fs.statSync(path);
        response = fs.createReadStream(path);
        response.headers = {
            'Content-Type': mime.lookup(path),
            'Content-Length': stats.size
        };
    } else {
        response = {
            statusCode: 404
        };
    }
    me.emit('response', response);
};

proto.__proto__ = AbstractHandler.prototype;

module.exports = Handler;

