var fs = require('fs');
var jschardet = require('jschardet');
var iconv = require('iconv-lite');
var _ = require('underscore');
var pac = require('pac-resolver');
var utils = require('./utils');

var config = {};

var defaultConfig = {
    rc: (process.env.HOME || process.env.USERPROFILE) + '/.feproxyrc',
    port: 8100,
    projects: [],
    rule: [],
    host: [
        // 永久host
        {
            host: 'feproxy.com',
            ip: '127.0.0.1'
        }
    ],
    advance: [],
    proxyType: '',
    proxyPac: '',
    proxyPacFun: null
};

config.reload = function() {

    var rc = {};
    if (fs.existsSync(defaultConfig.rc)) {
        try {
            rc = JSON.parse(fs.readFileSync(defaultConfig.rc).toString());
        } catch (ex) {
            console.log(ex);
        }
        console.log('parse config from: ' + defaultConfig.rc);
    }

    _.extend(config, defaultConfig, rc, {
        rc: defaultConfig.rc
    });

    config.projects.forEach(function(item) {
        if (!item.enable) {
            return;
        }
        item.rule.forEach(function(o) {
            if (o.enable) {
                config.rule.push({
                    match: new RegExp(o.match),
                    target: o.target
                });
            }
        });
        item.host.forEach(function(o) {
            if (o.enable) {
                o.host.split(/\s+/).forEach(function(h) {
                    config.host.push({
                        host: h,
                        ip: o.ip
                    });
                });
            }
        });
        item.advance.forEach(function(o) {
            if (o.enable) {
                config.advance.push({
                    match: new RegExp(o.match),
                    target: o.target,
                    ip: o.ip
                });
            }
        });
    });

    if (config.proxyPac) {
        var base64 = new Buffer(config.proxyPac, 'base64');
        var text = iconv.decode(
            base64, jschardet.detect(base64).encoding || 'utf-8'
        ).toString();
        config.proxyPacFun = pac(text);
    }
};

config.reload();

module.exports = config;

