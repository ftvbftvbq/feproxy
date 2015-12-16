var rule = require('./rule');
var handlerFactory = require('./handler');

// http proxy
exports.onHttp = function(req, res) {
    rule.apply(req, function(dist) {
        req.dist = dist;
        response(req, res);
    });
};

// https
exports.onConnect = function(req, socket, head) {
    rule.applyConnect(req, function(dist) {
        req.dist = dist;
        response(req, socket);
    });
};

function response(req, res) {
    console.log(req.url + ' ' + req.dist.toString());
    var handler = handlerFactory.createHandler(req, res);
}

