var zlib = require('zlib');
var jschardet = require('jschardet');
var iconv = require('iconv-lite');
var _ = require('underscore');

exports.deleteHeader = function(headers, name) {
    headers[name] && delete headers[name];
    headers[name.toLowerCase()] && delete headers[name.toLowerCase()];
};

exports.header = function(headers, name) {
    var v = [];
    for (var k in headers) {
        if (k.toLowerCase() === name.toLowerCase()) {
            v.push(headers[k]);
        }
    }
    return !v.length ? '' : (v.length === 1 ? v[0] : v.join(' '));
};

exports.wrapHeaders = function(headers) {
    var rt = {};
    for (var k in headers) {
        var item = headers[k];
        rt[k] = _.isArray(item) ? item.join('\n') : item + '';
    }
    return rt;
};

exports.headersText = function(headers) {
    var list = [];
    _.each(headers, function(item, k) {
        item = _.isArray(item) ? item : [item];
        item.forEach(function(str) {
            list.push(k + ': ' + str);
        });
    });
    return list.join('\r\n');
};

exports.headerContentType = function(headers) {
    var match = exports.header(headers, 'Content-Type').match(/([^;]*)/);
    return {
        mimeType: match && match[1] || ''
    };
};

exports.isText = function(mimeType) {
    var tmp = mimeType.split(/[\/-]+/);
    for (var i in tmp) {
        var item = tmp[i];
        if (_.contains(['text', 'javascript', 'json', 'xml', 'css'], item)) {
            return true;
        }
    }
    return false;
};

