var
    // Node Modules
    _       = require("underscore")._,
    async   = require("async"),
    util    = require("util"),
    path    = require("path"),
    exec    = require("child_process").exec,

    // Custom Modules
    log   = require("./logger")();

module.exports = function() {

    var
    /*****************************************************************************\
    Run a system command on the pi
    \*****************************************************************************/
    _run_system_cmd = function(cmd, callback) {
        // Dont actually run the commands if we are testing,
        // simply return back the cmd to the callback w/ no error
        /* istanbul ignore else */
        if (process.env.UNIT_TESTS_ENABLED) {
            callback(null, cmd);
        } else {
            log.info("Running command: " + cmd);
            exec(cmd, function(error, stdout, stderr) {
                callback(error, stdout);
            });
        }
    },

    /*****************************************************************************\
    Enable / Disable start this service on boot
    \*****************************************************************************/
    _enable_start_on_boot = function(enabled, callback) {
        log.info("enable_start_on_boot - TODO");
        callback(null, "TODO");
    },

    /*****************************************************************************\
    Reboot the pi
    \*****************************************************************************/
    _reboot_pi = function(callback) {
        log.info("Rebooting the pi");
        _run_system_cmd("shutdown -r now", callback);
    },

    _shutdown_pi = function(callback) {
        log.info("Shutdown the pi");
        _run_system_cmd("shutdown -t now", callback);
    };

    /*****************************************************************************\
    Return public interfaces
    \*****************************************************************************/
    return {

        run_system_cmd: _run_system_cmd,

        enable_start_on_boot: _enable_start_on_boot,

        reboot_pi: _reboot_pi,
        shutdown_pi: _shutdown_pi,

    };

}
