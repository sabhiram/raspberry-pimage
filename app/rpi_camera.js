var
    async   = require("async"),
    _       = require("underscore")._,
    fs      = require("fs"),
    path    = require("path");

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

        __LAST_VARIABLE__ = 0;
    return {
        storage_dir:    _storage_dir,
        ERRORS:         _ERRORS,

        init:           _init,
    };
};