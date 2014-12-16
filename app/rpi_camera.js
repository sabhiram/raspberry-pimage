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
    function flush_settings(callback) {
        fs.writeFile(_settings_file, JSON.stringify(_settings, null, 4), "utf-8", callback);
    }

    function load_settings(callback) {
        fs.readFile(_settings_file, "utf-8", function(error, data) {
            if(error) {
                log.info("Unable to load settings file for RPI Camera");
                log.info("Using default settings...");
                _settings = _DEFAULT_SETTINGS;
                flush_settings(callback);
            } else {
                _settings = JSON.parse(data);
                callback();
            }
        });
    }

    // Helper function which accepts a group of options and generats
    // a command line string to be used with the likes of the RPI Camera
    // utilities.
    function get_cmd_from_options(options) {
        var ret = 
            _.reduce(
                _.filter(
                    _.map(options, function(value, key) {
                        // Mapping step - return the appropriate arg strs for
                        // each of the options allowable. 
                        if(typeof(value)=="boolean") {
                            if(value) {
                                // Boolean which is enabled should be of the
                                // form "--key" (enable etc)
                                return "--" + key
                            } else {
                                // Boolean which is disabled, so this should 
                                // be filtered out at the next stage
                                return null;
                            }
                        } else {
                            // Normal key value map - expected format is
                            // "--key value"
                            return "--" + key + " " + value; 
                        }
                    }), function(item) {
                        // Filtering step - rejects all "null" items
                        return item;
                    }), function(cmd, item) {
                        // Reduce step - merge command line :)
                        if(cmd.length) {
                            return cmd + " " + item;
                        } else {
                            return item;
                        }
                    }, "");
        return ret;
    }

    // Helper function to run a given command line
    function run_command_line(cmd, callback) {
        log.info("Running cmd: " + cmd);
        exec(cmd, function(error, stderr, stdout) {
            callback();
        });
    }

    /******************************************************************************\
    Define external interfaces
    \******************************************************************************/
    // Initialize the rpi_camera, called once explicitly
    // by whoever requires this
    var _init = function(callback) {
        load_settings(function(error) {
            if(error) {
                log.error("Unable to init rpi-camera!");
            } else {
                log.info("RPI Camera Online...");
                log.info("Using " + _settings_file + " for settings");
            }
            callback(error);
        });
    },

    _take_picture = function(image_path, callback) {
        var
            options_str =
                get_cmd_from_options(_settings.preview) + " " +
                get_cmd_from_options(_settings.camera),
            cmd = "raspistill -t 1 -n -rot 180 "+options_str+" -o \"" + image_path + "\"";
        run_command_line(cmd, callback);
    },

    _save_settings = function(settings, callback) {
        // TODO: This needs to be a update, then a copy.
        // For the time being it is assumed that NO partial
        // setting will be set this way. Settings is assumed
        // to contain *every* setting expected...
        _settings = settings;
        flush_settings(callback);
    },

    _get_settings_sync = function() {
        return _settings;
    },
    
    _get_default_settings_sync = function() {
        return _DEFAULT_SETTINGS;
    };

    return {
        settings_file:              _settings_file,
        ERRORS:                     _ERRORS,

        init:                       _init,

        // Update settings
        save_settings:              _save_settings,
        get_settings_sync:          _get_settings_sync,
        get_default_settings_sync:  _get_default_settings_sync,

        // Camera interfaces
        take_picture:               _take_picture,
    };
};