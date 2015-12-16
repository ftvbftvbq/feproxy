var AbstractHandler = require('./abstractHandler');

var Handler = function() {
    AbstractHandler.apply(this, arguments);
};

var proto = Handler.prototype;

proto.get = function() {
    this.emit('response', {
        statusCode: 501
    });
};

proto.__proto__ = AbstractHandler.prototype;

module.exports = Handler;

