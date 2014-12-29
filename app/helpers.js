var
    // Node Modules
    async = require("async"),
    _     = require("underscore"),
    util  = require("util"),

    // Custom Modules
    log     = require("./logger")();

// Helper function which accepts a group of options and generats
// a command line string to be used with the likes of the RPI Camera
// utilities.
module.exports.build_cmd_from_options = function(options) {
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
};
