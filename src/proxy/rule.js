var _ = require('underscore');
var dns = require('dns');
var url = require('url');
var config = require('../config');
var utils = require('../utils');

/**
 * apply for http
 * @param {Object} req
 * @param {function(Object)} cb
 */
exports.apply = function(req, cb) {
    var hrefInfo = url.parse(req.url);
    var dist = {};

    // advance
    config.advance.forEach(function(item) {
        var match = hrefInfo.href.match(item.match);
        if (match) {
            if (item.target) {
                dist.href = item.target.replace(/\$(\d+)/g, function(text) {
                    var i = +RegExp.$1;
                    return match[i] !== undefined ? match[1] : text;
                });
            }
            if (item.ip) {
                var tmp = item.ip.split(/:/);
                dist.hostname = tmp[0];
                dist.port = +tmp[1] || 80;
            }
        }
    });

    if (!dist.href) {
        // rule
        config.rule.forEach(function(item) {
            var match = hrefInfo.href.match(item.match);
            if (match) {
                dist.href = item.target.replace(/\$(\d+)/g, function(text) {
                    var i = +RegExp.$1;
                    return match[i] !== undefined ? match[1] : text;
                });
            }
        });
    }

    if (!dist.hostname) {
        // host
        config.host.forEach(function(item) {
            if (hrefInfo.hostname === item.host) {
                var tmp = item.ip.split(/:/);
                dist.hostname = tmp[0];
                dist.port = +tmp[1] || 80;
            }
        });
    }

    dist.href = dist.href || hrefInfo.href;
    var match = dist.href.match(/^(\w*:)\/\/(.*)/);
    dist.protocol = match ? match[1].toLowerCase() : '';
    dist.ext = match ? match[2] : null;

    if (dist.protocol === 'http:') {
        var distHrefInfo = url.parse(dist.href);
        _.extend(dist, distHrefInfo, {
            hostname: dist.hostname || distHrefInfo.hostname,
            port: dist.port || distHrefInfo.port || 80
        });
    } else {
        // file status ...
        _.extend(dist, {
            hostname: '127.0.0.1',
            port: -1
        });
    }
    dist.host = dist.hostname + ':' + dist.port;

    dist.toString = distToString;

    function back() {
        cb && cb(dist);
    };

    // sub proxy
    if (dist.protocol === 'http:') {
        proxy(null, dist.hostname, function(result) {
            if (result) {
                dist.protocol = 'proxy:';
                dist.proxy = result;
            }
            back();
        });
    } else {
        back();
    }
};

/**
 * apply for https connect
 * @param {Object} req
 * @param {string} req.url
 *      'www.baidu.com:443'
 * @param {function(Object)} cb
 */
exports.applyConnect = function(req, cb) {
    var match = req.url.match(/([^:]+)(:(\d+))?/);
    var dist = {
        href: req.url,
        protocol: 'connect',
        hostname: match && match[1],
        port: +(match && match[3]) || 443
    };

    dist.toString = distToString;

    function back() {
        cb && cb(dist);
    };

    proxy(null, dist.hostname, function(result) {
        if (result) {
            dist.protocol = 'proxyConnect:';
            dist.proxy = result;
        }
        back();
    });
};

/**
 * proxy
 * @param {?string} href
 * @param {string} hostname
 * @param {function(?Object)} cb
 */
function proxy(href, hostname, cb) {
    href = href || 'http://' + hostname + '/';
    // apply sub proxy
    if (config.proxyEnable && config.proxyType === 'pac') {
        config.proxyPacFun(href, hostname, function(err, result) {
            var proxy = null;
            if (!err && result && result.toUpperCase() !== 'DIRECT') {
                var match = result.match(/^\w*\s+([^:]*):(\d+)/);
                if (match) {
                    proxy = {
                        hostname: match[1],
                        port: +match[2]
                    };
                }
            }
            cb(proxy);
        });
    } else {
        cb(null);
    }
}

function distToString() {
    var str = '';
    if (this.proxy) {
        str = 'proxy://' + this.proxy.hostname + ':' + this.proxy.port;
    } else {
        str = this.href;
    }
    return str;
}

