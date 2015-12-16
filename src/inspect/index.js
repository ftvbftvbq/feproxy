var _ = require('underscore');
var WebSocketServer = require('ws').Server
var express = require('express');
var methods = require('./methods');

var ws = null;
var connects = [];

/**
 * on upgrade
 */
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

    // 使用websocket解析编码socket
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
            methods.method(conn, data);
            if (data.method === 'Inspector.enable' && !connAttached) {
                connAttached = true;
                connects.push(conn);
                methods.notify(conn, 'Runtime.executionContextCreated');
            }
        });
        conn.on('end', function() {
            // 从连接池删除
            for (var i = 0, len = connects.length; i < len; i++) {
                if (connects[i] === conn) {
                    connects.splice(i, 1);
                    i--;
                }
            }
        });
    });
};

/**
 * 获取当前的链接
 * @return {Array<Socket>} 
 */
exports.getConnects = function() {
    return ws && connects || [];
};

