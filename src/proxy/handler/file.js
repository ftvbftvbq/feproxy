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
    function error() {
        response = {
            statusCode: 404
        };
        me.emit('response', response);
    }
    if (!path) {
        return error();
    }
    fs.stat(path, function(err, stats) {
        if (err) {
            return error();
        }
        response = fs.createReadStream(path);
        response.headers = {
            'Content-Type': mime.lookup(path),
            'Content-Length': stats.size
        };
        me.emit('response', response);
    });
};

proto.__proto__ = AbstractHandler.prototype;

module.exports = Handler;

