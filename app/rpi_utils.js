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
        // simply echo them :)
        if (process.env.UNIT_TESTS_ENABLED) {
            cmd = "echo -n " + cmd;
        }

        log.info("Running command: " + cmd);
        exec(cmd, function(error, stdout, stderr) {
            callback(error, stdout);
        });
    },

    /*****************************************************************************\
    Enable / Disable start this service on boot
    \*****************************************************************************/
    _enable_start_on_boot = function(enabled, callback) {
        log.info("enable_start_on_boot - " + enabled);

        async.series([
            function check_boot_script(next_step) {
                log.info("Dirname: " + __dirname);
                next_step();
            },
            function update_script(next_step) {
                log.info("Update script...");
                next_step();
            },
        ], callback);
    },

    /*****************************************************************************\
    Reboot the pi
    \*****************************************************************************/
    _restart_pi = function(callback) {
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

        restart_pi: _restart_pi,
        shutdown_pi: _shutdown_pi,

    };

}
