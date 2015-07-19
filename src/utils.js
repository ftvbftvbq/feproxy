var _ = require('underscore');

exports.header = function(headers, name) {
    var v = [];
    for (var k in headers) {
        if (k.toLowerCase() === name.toLowerCase()) {
            v.push(headers[k]);
        }
    }
    return !v.length ? '' : (v.length === 1 ? v[0] : v.join(' '));
};

exports.headersText = function(headers) {
    return _.map(headers, function(k, v) {
        return k + ': ' + v;
    }).join('\r\n')
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

