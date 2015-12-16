
var map = {
    http: require('./http'),
    // http proxy
    proxy: require('./proxy'),
    // https
    connect: require('./connect'),
    // https proxy
    proxyConnect: require('./proxyConnect'),
    // only send a http status code
    status: require('./status'),
    // map a file
    file: require('./file'),
    // not support 
    notsupport: require('./notsupport')
};

exports.createHandler = function(req, res) {
    var protocol = req.dist.protocol.replace(':', '');
    var Handler = map[protocol] || map.notsupport;
    return new Handler(req, res);
};

