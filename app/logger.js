// winston - https://github.com/flatiron/winston
//     An amazingly flexible logger for NodeJS, allows the user
//     to define transport mechanisims to route logs to arbitary
//     recievers
var winston = require("winston"),
    path    = require("path");

// There is actually an issue when using more than one type of each transport
// with winston. This can be worked around by overloading the "name" field in
// the transport object (since that is what the code uses to identify unique
// tansports). However, this causes some pretty silly things to happen w.r.t.
// the wrong messages ending up in the wrong logfile. Therefore, I am using only
// the default master logfile. You can read more about this here:
// http://stackoverflow.com/questions/10045891/multiple-log-files-with-winston

// TODO: Tests for this logger wrapper (maybe ship this as its own module?)
/*****************************************************************************\
Custom App Logger

`logs_path` points at the folder in which the `master.log` and the
`exceptions.log` files will be written to. The `debug_options` parameter is
specified as follows:

debug_options = {
    // This enables the debug logging vs regular winston logging
    unit_tests_enabeld: false

    // Set this to `true` if you want errors to cause the test to fail
    // by raising an error. Default value is `false`
    abort_on_error: false,

    // Set this to `true` to log `error` messages
    log_errors: false,

    // Set this to `true` to log `info` messages
    log_info: false,

    // Set this to `true` to log all messages
    log_all: false,
}
\*****************************************************************************/
module.exports = function(logs_path, debug_options) {
    if (typeof(debug_options) != "object") {
        debug_options = {}
    }

    if (debug_options["unit_tests_enabeld"]) {

        // If the unit tests are enabled, then we just return our custom log interface
        // this allows us to assert on errors, log wierd messages when debugging etc
        var
            _log = function(s) {
                if (debug_options["log_all"]) { console.log(s); }
            },
            _info = function(s) {
                if (debug_options["log_info"]) { console.log(s); }
            },
            _error = function(s) {
                if (debug_options["log_errors"]) { console.log(s); }
                if (debug_options["abort_on_error"]) { assert(false); }
            };
        return {
            log:    _log,
            info:   _info,
            error:  _error,
        };

    } else {

        // If the unit tests are not enabled - reuturn a default winston logger
        return new (winston.Logger)({
            transports: [
                // Route all messages to the console
                new winston.transports.Console({ colorize: "true" }),

                // Route all messages to the global logs file
                new winston.transports.File({ filename: path.join(logs_path, "master.log"), json: false }),
            ],
            exceptionHandlers: [
                // Log exceptions to the exception file
                new winston.transports.File({ filename: path.join(logs_path, "exceptions.log"), json: false }),
            ],
            exitOnError: false
        });
    }
};
