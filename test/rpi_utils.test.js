process.env.UNIT_TESTS_ENABLED = 1;

/*****************************************************************************\
Validate RPI Utility Module, see file: ../app/rpi_utils.js
\*****************************************************************************/
describe("RPI Utils Tests", function() {
    var
        log          = require("../app/logger")(),
        rpi_utils    = require("../app/rpi_utils")();

    before(function(done) {
        done();
    });

    after(function(done) {
        done();
    });

    it("shutdown_pi() test", function(next_test) {
        rpi_utils.shutdown_pi(function(error, result) {
            result.should.match("shutdown -t now");
            next_test(error);
        });
    });

    it("reboot_pi() test", function(next_test) {
        rpi_utils.reboot_pi(function(error, result) {
            result.should.match("shutdown -r now");
            next_test(error);
        });
    });

    it("enable_start_on_boot(true) test", function(next_test) {
        rpi_utils.enable_start_on_boot(false, function(error, result) {
            result.should.match("TODO");
            next_test(error);
        });
    });

    it("enable_start_on_boot(false) test", function(next_test) {
        rpi_utils.enable_start_on_boot(true, function(error, result) {
            result.should.match("TODO");
            next_test(error);
        });
    });

});
