var
    async   = require("async"),
    _       = require("underscore")._,
    exec    = require("child_process").exec,
    fs      = require("fs"),
    path    = require("path"),
    request = require("request"),
    util    = require("util");

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
                show_help:          true,
                enable_autosave:    false,
            },
            preview: {
                fullscreen:         false,
                nopreview:          false,
                opacity:            255,
            },
            camera: {
                sharpness:          0,       
                contrast:           0,     
                brightness:         50,         
                saturation:         0,         
                ISO:                100, 
                vstab:              false,
                ev:                 0,
                hflip:              false,
                vflip:              false,
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

        _save_settings = function(settings, callback) {
            // TODO: This needs to be a update, then a copy.
            // For the time being it is assumed that NO partial
            // setting will be set this way. Settings is assumed
            // to contain *every* setting expected...
            _settings = settings;
            flush_settings_file(callback);
        },
        _get_settings_sync = function() {
            return _settings;
        }

        __LAST_VARIABLE__ = 0;
    return {
        settings_file:  _settings_file,
        ERRORS:         _ERRORS,

        init:           _init,

        // Update settings
        save_settings:  _save_settings,
        get_settings_sync: _get_settings_sync,

        // Camera interfaces
        take_picture:   _take_picture,
    };
};