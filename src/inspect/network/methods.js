var pool = require('./pool');

var methods = {
    'Network.getResponseBody': function(data) {
        var poolItem = pool.get(data.params.requestId);
        if(poolItem) {
            return poolItem.getResponseBody();
        } else {
            return {
                base64Encoded: false,
                body: ''
            };
        }
    },
    'Network.enable': function() {
        return {
            result: true
        };
    }
};

exports.methods = methods;

