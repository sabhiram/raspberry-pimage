var
    async   = require("async"),
    _       = require("underscore")._,
    exec    = require("child_process").exec,
    fs      = require("fs"),
    path    = require("path"),
    request = require("request");

module.exports = function(log, settings_file) {
    /******************************************************************************\
    Define module globals / constants. Some of these are / can be exposed to the
    person including the module.
    \******************************************************************************/
    var
        _settings_file = settings_file,
        _settings = null,
        _ERRORS = {
            UNKNOWN_ERROR:  { id: 0, name: "UNKNOWN_ERROR" },
        },
        _DEFAULT_SETTINGS = {
            general: {
                show_help: true,
            },
            preview: {
                fullscreen: false,
                nopreview: false,
            },
            camera: {
                vstab: false,
                hflip: false,
                vflip: false,
            }
        };

    /******************************************************************************\
    Helper functions
    \******************************************************************************/
    function flush_settings_file(callback) {
        fs.writeFile(_settings_file, JSON.stringify(_settings, null, 4), "utf-8", callback);
    }
    function load_settings_file(callback) {
        fs.readFile(_settings_file, "utf-8", function(error, data) {
            if(error) {
                log.warn("Unable to load settings file for RPI Camera");
                log.info("Using default settings...");
                _settings = _DEFAULT_SETTINGS;
                flush_settings_file(callback);
            } else {
                _settings = JSON.parse(data);
                callback();
            }
        });
    }

    /******************************************************************************\
    Define external interfaces
    \******************************************************************************/
    var
        /***
         *  Initialize the rpi_camera, called once explicitly
         *  by whoever requires this
        ***/
        _init = function(callback) {
            load_settings_file(function(error) {
                if(error) {
                    log.error("Unable to init rpi-camera!");
                } else {
                    log.info("RPI Camera Online...");
                    log.info("Using " + _settings_file + " for settings");
                }
                callback(error);
            });
        },

        _take_picture = function(image_path, options, callback) {
            var cmd = "raspistill -t 1 -n -rot 180 -o \"" + image_path + "\"";
            log.info("About to take pic:");
            log.info(options)
            log.info(cmd);
            exec(cmd, function(error, stderr, stdout) {
                callback();
            });
        },

        __LAST_VARIABLE__ = 0;
    return {
        settings_file:  _settings_file,
        ERRORS:         _ERRORS,

        init:           _init,

        // Update settings

        // Camera interfaces
        take_picture:   _take_picture,
    };
};