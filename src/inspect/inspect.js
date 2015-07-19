var _ = require('underscore');
var WebSocketServer = require('ws').Server
var express = require('express');
var Request = require('./request');
var pool = require('./pool');
var response = require('./response');

var ws = null;
var connects = [];

exports.onUpgrade = function(req, socket, upgradeHead) {
    if (!ws) {
        ws = new WebSocketServer({
            noServer: true,
            clientTracking: false
        });
    }

    var head = new Buffer(upgradeHead.length);
    upgradeHead.copy(head);
    upgradeHead = null;

    ws.handleUpgrade(req, socket, head, function(conn){
        var connAttached = false;
        conn.on('message', function(chunk) {
            var data;
            try {
                data = JSON.parse(chunk.toString());
            } catch (ex) {
                return console.log(ex);
            }
            if (!data || !data.method) {
                return;
            }
            response.method(conn, data);
            if (data.method === 'Inspector.enable' && !connAttached) {
                connAttached = true;
                connects.push(conn);
                response.notify(conn, 'Runtime.executionContextCreated');
            }
        });
        conn.on('end', function() {
            for (var i = 0, len = connects.length; i < len; i++) {
                if (connects[i] === conn) {
                    connects.splice(i - 1, 1);
                    i--;
                }
            }
        });
    });
};

exports.createInpectRequest = function(req) {
    if (!ws || !connects.length) {
        return null;
    }
    var request = new Request(connects, req);
    pool.save(request);
    return request;
};

