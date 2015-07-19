var _ = require('underscore');
var pool = require('./pool');
var frame = require('./frame');

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
    'Page.getResourceContent': function(data) {
        return {
            base64Encoded: false,
            content: 'no content'
        };
    },
    'Page.getResourceTree': function() {
        return {
            "frameTree": {
                "frame": frame,
                "resources": []
            }
        };
    },
    'Network.enable': function() {
        return {
            result: true
        };
    },
    'default': function() {
        return {
            result: false
        };
    }
};


var notifies = {
    "Runtime.executionContextCreated": function() {
        return {
            "context": {
                "id": frame._id,
                "name": "",
                "origin": "",
                "frameId": frame.id,
                "isPageContext": true
            }
        }
    }
};

exports.method = function(socket, data) {
    var method = data.method;
    var handler = methods[method] || methods.default;
    var result = handler(data);
    socket.send(JSON.stringify({
        id: data.id,
        result: result || {}
    }));
};

exports.notify = function(socket, method) {
    var handler = notifies[method];
    if (!handler) {
        console.log('notify no handler: ' + method);
        return;
    }
    var params = handler();
    socket.send(JSON.stringify({
        method: method,
        params: params
    }));
};


