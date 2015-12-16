/**
 * 响应体储存池, 供chrome后续获取
 */
var EventEmitter = require('events').EventEmitter

var pool = new EventEmitter();

// linkedMap FIFO
pool._data = {};
pool._dataList = [];

// 最大数目
pool.maxLen = 500;

/**
 * get pool item
 * @param {string} requestId 
 * @return {Object} Request
 */
pool.get = function(requestId) {
    return pool._data[requestId] || null;
};

/**
 * save item
 * @param {Object} Request
 */
pool.save = function(req) {
    pool._dataList.push(req);
    pool._data[req.requestId] = req;
    // pop
    while (pool._dataList.length > pool.maxLen) {
        var item = pool._dataList.shift();
        pool._data[item.requestId] && delete pool._data[item.requestId];
    }
};

module.exports = pool;

