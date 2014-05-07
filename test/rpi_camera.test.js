//
// Test group to validate the gallery functions
//
describe("RPI Camera Tests", function() {
    var
        rm_rf = require("rimraf"),
        path = require("path"),
        fs = require("fs"),
        async = require("async"),

        log = {
            log:    function(s) { /* do nothing */ },
            info:   function(s) { /* do nothing */ },
            error:  function(s) { console.log(s); assert(false); }
        },

        test_dir = "__TEMP_TEST_CAMERA_DIR__",
        rpi_camera = require("../app/rpi_camera")(log, test_dir);


    //
    // Setup
    //
    before(function(done) {
        // make the test gallery dir...
        rpi_camera.init();
        fs.existsSync(test_dir).should.be.true;
        done();
    });


    //
    // Cleanup
    //
    after(function(done) {
        rm_rf(test_dir, function(error) {
            fs.existsSync(test_dir).should.be.false;
            done();
        });
    });


    // 
    // Tests
    //
    it("Initial test, validate rpi_camera init", function(next_test) {
        rpi_camera.should.not.eql(null);
        rpi_camera.storage_dir.should.match(test_dir);
        next_test();
    });
});