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
        rpi_camera = require("../app/rpi_camera")(log, "test_settings.json");


    //
    // Setup
    //
    before(function(done) {
        // make the test gallery dir...
        rpi_camera.init(function(error) {
            // Call init again to validate settings file loads correctly
            rpi_camera.init(function(error) {
                fs.existsSync("test_settings.json").should.be.true;
                done(error);
            });
        });
    });


    //
    // Cleanup
    //
    after(function(done) {
        rm_rf("test_settings.json", function(error) {
            fs.existsSync("test_settings.json").should.be.false;
            done();
        });
    });


    //
    // Tests
    //
    it("Initial test, validate rpi_camera init", function(next_test) {
        rpi_camera.should.not.eql(null);
        next_test();
    });

    describe("Validate option string builder", function() {

        it("Build simple options", function(next_test) {
            var result = rpi_camera.get_cmd_from_options({"a": true, "b": 100, "c": "hello"});
            result.should.containEql("--a");
            result.should.containEql("--b 100");
            result.should.containEql("--c hello");
            next_test();
        });

        it("Build simple options - negative boolean", function(next_test) {
            var result = rpi_camera.get_cmd_from_options({"a": false, "b": 100, "c": "hello"});
            result.should.not.containEql("--a");
            result.should.containEql("--b 100");
            result.should.containEql("--c hello");
            next_test();
        });

        it("Validate settings", function(next_test) {
            var settings = rpi_camera.get_settings_sync();
            var default_settings = rpi_camera.get_default_settings_sync();
            settings.should.eql(default_settings);
            next_test();
        });

        it("Save settings", function(next_test) {
            var settings = rpi_camera.get_settings_sync();
            settings["foobar"] = "1234";
            rpi_camera.save_settings(settings, function(error) {
                var new_settings = rpi_camera.get_settings_sync(),
                    cmd_line     = rpi_camera.get_cmd_from_options(new_settings);
                cmd_line.should.containEql("--foobar 1234");
                next_test(error);
            });
        });

    });
});
