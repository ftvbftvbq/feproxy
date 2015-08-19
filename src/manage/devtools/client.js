(function() {
    var $log = console.log;
    console.log = function(obj) {
        $log.apply(console, arguments);
        var img = new Image();
        img.src = $feproxy.url + 'consolelog?obj=' + JSON.stringify(obj);
    };
    
})();
