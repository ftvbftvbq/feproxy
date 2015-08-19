
var config = require('./config');

module.exports = function(path) {
    path = path || '';
    return 'http://feproxy.com:' + config.port + '/' + path.replace(/^\//, '');
};

