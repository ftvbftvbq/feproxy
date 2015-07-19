var http = require('http');
var url = require('url');
var config = require('./config');

/**
 * 命令行配置项
 *
 * @inner
 * @type {Object}
 */
var cli = {};

/**
 * 命令描述信息
 *
 * @type {string}
 */
cli.description = 'any proxy';

/**
 * 模块命令行运行入口
 *
 * @param {Array.<string>} args
 * @param {Object.<string, *>} opts
 */
cli.main = function( args, opts ) {
    var mngr = require('./manage/app');
    var proxy = require('./proxy/index');

    var svr = http.createServer(function(req, res) {
        if (/^http:\/\//i.test(req.url)) {
            // http proxy
            proxy.onHttp.apply(proxy, arguments);
        } else {
            // http mngr page
            mngr.apply(null, arguments);
        }
    });

    // https proxy
    svr.on('connect', proxy.onConnect);

    // inpect
    svr.on('upgrade', require('./inspect/inspect').onUpgrade);

    svr.listen(config.port, function() {
        console.log('Proxy service on %s', config.port);
        console.log('Manage page on http://127.0.0.1:%s', config.port);
        console.log('Inpect page on http://127.0.0.1:%s/inpect', config.port);
    });
};

module.exports = cli;

