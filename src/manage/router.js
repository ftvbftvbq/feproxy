var fs = require('fs');
var express = require('express');
var config = require('../config');
var router = express.Router();

router.get('/', function(req, res, next) {
    console.log('root');
    res.redirect('index');
});

router.get('/consolelog', function(req, res, next) {
    console.log(req.query.obj);
    res.end();
});

router.get('/index', function(req, res, next) {
    res.render('index.html', {
        settings: {
            port: config.port,
            managePort: config.managePort,
            projects: config.projects,
            proxyEnable: config.proxyEnable,
            proxyType: config.proxyType,
            proxyPac: config.proxyPac
        }
    });
});

router.post('/save', function(req, res, next) {
    var data;
    try {
        data = JSON.parse(req.body.data || '');
    } catch (ex) {
        return res.send({
            ec: 1
        });
    }
    var dataStr = JSON.stringify(data);
    fs.writeFileSync(config.rc, dataStr);
    config.reload();
    res.send({
        ec: 0
    });
});

module.exports = router;
