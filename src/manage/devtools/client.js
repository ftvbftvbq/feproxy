(function() {
    var host = '127.0.0.1:8080';
    var $log = console.log;
    console.log = function(obj) {
        $log.apply(console, arguments);
        var img = new Image();
        img.src = 'http://' + host + '/consolelog?obj=' + JSON.stringify(obj);
    };
    
})();
