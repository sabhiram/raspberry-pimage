// winston - https://github.com/flatiron/winston
//     An amazingly flexible logger for NodeJS, allows the user
//     to define transport mechanisims to route logs to arbitary
//     recievers
var winston     = require("winston"),
    path        = require("path"),
    _           = require("underscore")._;

// TODO: Load args from file, use nconf?
var args = {
    port:               process.env.PORT || 1234,
    version:            "1.0.0",
    name:               "RaspberryPIMage",
    gallery_dir:        "./app/public/gallery",
    camera_settings:    "camera_settings.json",
    admin_passcode:     "mrfseesall",
    logs_dir:           "./logs",
};


// There is actually an issue when using more than one type of each transport
// with winston. This can be worked around by overloading the "name" field in
// the transport object (since that is what the code uses to identify unique
// tansports). However, this causes some pretty silly things to happen w.r.t.
// the wrong messages ending up in the wrong logfile. Therefore, I am using only
// the default master logfile. You can read more about this here:
// http://stackoverflow.com/questions/10045891/multiple-log-files-with-winston

/*****************************************************************************\
Custom App Logger

`logs_path` points at the folder in which the `master.log` and the
`exceptions.log` files will be written to. The `debug_options` parameter is
specified as follows:
\*****************************************************************************/
var DEFAULT_DEBUG_OPTIONS = {
    // Set this to `true` if you want errors to cause the test to fail
    // by raising an error. Default value is `false`
    abort_on_error: false,

    // Set this to `true` to log `error` messages
    log_errors: false,

    // Set this to `true` to log `info` messages
    log_info: false,

    // Set this to `true` to log all messages
    log_all: false,
};

/*****************************************************************************\
The `debug_options` param below is expected to be `undefined` for all normal
cases of running the server. However when `UNIT_TEST_ENABLED` is set then
the `debug_options` are merged with the `DEFAULT_DEBUG_OPTIONS` which allows
for the tests to override logging on a per test basis
\*****************************************************************************/
module.exports = function(debug_options) {

    /* istanbul ignore else  */
    if (process.env.UNIT_TESTS_ENABLED) {

        if (typeof(debug_options) == "object") {
            debug_options = _.extend(DEFAULT_DEBUG_OPTIONS, debug_options);
        } else {
            debug_options = DEFAULT_DEBUG_OPTIONS;
        }

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
                new winston.transports.File({ filename: path.join(args.logs_dir, "master.log"), json: false }),
            ],
            exceptionHandlers: [
                // Log exceptions to the exception file
                new winston.transports.File({ filename: path.join(args.logs_dir, "exceptions.log"), json: false }),
            ],
            exitOnError: false
        });

    }

};
