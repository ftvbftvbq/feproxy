var _ = require('underscore');
var EventEmitter = require('events').EventEmitter

var pool = new EventEmitter();

pool.data = {};
pool.dataList = [];
pool.maxLen = 100;

pool.get = function(requestId) {
    return pool.data[requestId] || null;
};

pool.save = function(req) {
    pool.dataList.push(req);
    pool.data[req.requestId] = req;
    // pop
    while (pool.dataList.length > pool.maxLen) {
        var item = pool.dataList.shift();
        pool.data[item.requestId] && delete pool.data[item.requestId];
    }
};

module.exports = pool;

