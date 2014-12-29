process.env.UNIT_TESTS_ENABLED = 1;

/*****************************************************************************\
Validates random RPI Helper tests, see source file: ../app/helpers.js
\*****************************************************************************/
describe("RPI Helper Tests", function() {
    var
        log     = require("../app/logger")(),
        helpers = require("../app/helpers");

    /*****************************************************************************\
    Validates the build_cmd_from_options() function
    \*****************************************************************************/
    describe("build_cmd_from_options Tests", function() {

        it("Build simple options", function(next_test) {
            var result = helpers.build_cmd_from_options({"a": true, "b": 100, "c": "hello"});
            result.should.containEql("--a");
            result.should.containEql("--b 100");
            result.should.containEql("--c hello");
            next_test();
        });

        it("Build simple options - negative boolean", function(next_test) {
            var result = helpers.build_cmd_from_options({"a": false, "b": 100, "c": "hello"});
            result.should.not.containEql("--a");
            result.should.containEql("--b 100");
            result.should.containEql("--c hello");
            next_test();
        });

    });

});
