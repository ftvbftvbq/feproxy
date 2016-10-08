var path = require('path');   
var http = require('http');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');

var router = require('./router');
var config = require('../config');

var app = express();

app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'html');
app.engine('html', require('ejs-mate'));

app.use(cookieParser(config.secret));
app.use(bodyParser.urlencoded({
    extended: true,
    limit: '50mb'
}));
app.use(bodyParser.json());

app.use(session({
    secret: 'XXXXXXAAAAAA',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 60 * 30 * 1000
    }
}));

app.use('/static', express.static(path.join(__dirname, 'static')));
app.use('/devtools', express.static(path.join(__dirname, 'devtools')));

app.use('/', router);

app.use('/inspect', function(req, res, next) {
    var myHost = req.headers['Host'] || req.headers['host'] 
        || '127.0.0.1:' + config.managePort;
    res.redirect(
        '/devtools/inspector.html?ws=' + myHost + '/ws'
    );
});

module.exports = app;

