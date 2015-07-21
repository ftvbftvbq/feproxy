var _ = require('underscore');
var frame = require('./frame');

var methods = {
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
    'default': function() {
        return {
            result: false
        };
    }
};

_.extend(
    methods, 
    require('./network/methods').methods,
    require('./console/methods').methods
);

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

exports.methods = methods;

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

