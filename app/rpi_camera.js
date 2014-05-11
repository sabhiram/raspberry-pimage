var
    async   = require("async"),
    _       = require("underscore")._,
    exec    = require("child_process").exec,
    fs      = require("fs"),
    path    = require("path"),
    request = require("request");

module.exports = function(log, storage_dir) {
    var
        _storage_dir = storage_dir,
        _ERRORS = {
            UNKNOWN_ERROR:  { id: 0, name: "UNKNOWN_ERROR" },
        },

        /***
         *  Initialize the rpi_camear, called once explicitly
         *  by whoever requires this
        ***/
        _init = function() {
            if(!fs.existsSync(_storage_dir)) {
                fs.mkdirSync(_storage_dir);
            }
        },

        _take_picture = function(image_path, options, callback) {
            var cmd = "raspistill -t 0 -n -o \"" + image_path + "\"";
            // var cmd = "curl http://upload.wikimedia.org/wikipedia/commons/0/09/Polar_Bear_-_Alaska.jpg -o \"" + image_path + "\"";
            log.info("About to take pic:");
            log.info(cmd);
            exec(cmd, function(error, stderr, stdout) {
                callback(error);
            });
        },

        __LAST_VARIABLE__ = 0;
    return {
        storage_dir:    _storage_dir,
        ERRORS:         _ERRORS,

        init:           _init,

        // Camera interfaces
        take_picture:   _take_picture,
    };
};