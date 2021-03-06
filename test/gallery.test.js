process.env.UNIT_TESTS_ENABLED = 1;

/******************************************************************************\
These are tests to validate the gallery module. Take note that some of
these tests are ordered and require them to be run in a certain order.
\******************************************************************************/
describe("Gallery Tests", function() {
    /******************************************************************************\
    GLOBALS
    \******************************************************************************/
    var
        rm_rf        = require("rimraf"),
        path         = require("path"),
        fs           = require("fs"),
        async        = require("async"),
        _            = require("underscore")._,
        request      = require("request"),

        log          = require("../app/logger")(),

        test_dir     = path.join(__dirname, "__TEMP_TEST_DIR__"),
        gallery      = require("../app/gallery")(test_dir),
        skip_cleanup = false;


    /******************************************************************************\
    SETUP
    \******************************************************************************/
    before(function(done) {
        // make the test gallery dir...
        gallery.init(function(error) {
            fs.existsSync(test_dir).should.be.true;
            done(error);
        });
    });


    /******************************************************************************\
    CLEANUP
    \******************************************************************************/
    after(function(done) {
        if (!skip_cleanup) {
            rm_rf(test_dir, function(error) {
                fs.existsSync(test_dir).should.be.false;
                done();
            });
        } else {
            done();
        }
    });

    /******************************************************************************\
    Basic test to validate non-null gallery init...
    \******************************************************************************/
    it("Initial test, validate gallery init", function(next_test) {
        gallery.should.not.eql(null);
        gallery.gallery_dir.should.match(test_dir);
        next_test();
    });

    it("Init on existing gallery should not do anything", function(next_test) {
        gallery.init(function(error) {
            fs.existsSync(test_dir).should.be.true;
            next_test();
        });
    });

    /******************************************************************************\
    Tests for adding an album to the gallery
    \******************************************************************************/
    describe("Add an album", function() {
        var
            test_album_name = "2013 Feb, Hawaii",
            test_album_path = path.join(test_dir, test_album_name);

        before(function(done) {
            done();
        });

        after(function(done) {
            // Since we are only adding an empty album, we only
            // need to remove the folder
            fs.rmdir(test_album_path, function(error) {
                fs.existsSync(test_album_path).should.not.be.true;
                done(error);
            });
        });

        it("Add valid album should make a folder", function(next_test) {
            gallery.add_album(test_album_name, function(error) {
                var album_exists = fs.existsSync(test_album_path);
                album_exists.should.be.true;
                next_test(error);
            });
        });

        it("Adding a bad album should fail", function(next_test) {
            gallery.add_album("a/b/c", function(error) {
                error.id.should.be.exactly(gallery.ERRORS.ALBUM_CREATION_FAILED.id);
                error.name.should.match(gallery.ERRORS.ALBUM_CREATION_FAILED.name);
                next_test();
            });
        });

        it("Adding the same album should fail", function(next_test) {
            gallery.add_album(test_album_name, function(error) {
                fs.existsSync(test_album_path).should.be.true;
                error.should.not.eql(null);
                error.id.should.be.exactly(gallery.ERRORS.ALBUM_ALREADY_EXISTS.id);
                error.name.should.match(gallery.ERRORS.ALBUM_ALREADY_EXISTS.name);
                next_test();
            });
        });
    });

    /******************************************************************************\
    Tests for deleting an album
    \******************************************************************************/
    describe("Remove an album", function() {
        var
            empty_album_name        = "2013 Feb, Hawaii",
            empty_album_path        = path.join(test_dir, empty_album_name),
            non_empty_album_name    = "2013 Mar, Tahoe",
            non_empty_album_path    = path.join(test_dir, non_empty_album_name);

        before(function(done) {
            // Create the albums and setup for testing...
            async.series([
                function(next_step) {
                    gallery.add_album(empty_album_name, next_step);
                },
                function(next_step) {
                    gallery.add_album(non_empty_album_name, next_step);
                },
                function(next_step) {
                    var dummy_file = path.join(non_empty_album_path, "dummy.png");
                    fs.writeFile(dummy_file, "DUMMY DATA", "utf-8", next_step);
                }
            ], done);
        });

        after(function(done) {
            done();
        });

        it("Remove an empty album should work", function(next_test) {
            gallery.delete_album(empty_album_name, function(error) {
                var album_exists = fs.existsSync(empty_album_path);
                album_exists.should.be.false;
                next_test(error);
            });
        });

        it("Remove a invalid album should fail", function(next_test) {
            gallery.delete_album("Invalid album, 2013", function(error) {
                error.id.should.be.exactly(gallery.ERRORS.ALBUM_DOES_NOT_EXIST.id);
                error.name.should.be.match(gallery.ERRORS.ALBUM_DOES_NOT_EXIST.name);
                next_test();
            });
        });

        it("Remove a non-empty album should fail", function(next_test) {
            gallery.delete_album(non_empty_album_name, false, function(error) {
                var album_exists = fs.existsSync(non_empty_album_path);
                album_exists.should.be.true;
                error.id.should.be.exactly(gallery.ERRORS.ALBUM_NOT_EMPTY.id);
                error.name.should.be.match(gallery.ERRORS.ALBUM_NOT_EMPTY.name);
                next_test();
            });
        });

        it("Remove a non-empty album should work if forced", function(next_test) {
            gallery.delete_album(non_empty_album_name, true, function(error) {
                var album_exists = fs.existsSync(non_empty_album_path);
                album_exists.should.be.false;
                next_test(error);
            });
        });
    });

    /******************************************************************************\
    Tests for renaming an album
    \******************************************************************************/
    describe("Rename an album", function() {
        var
            source_album_name = "2013 Feb, SOURCE",
            source_album_path = path.join(test_dir, source_album_name),
            dest_album_name   = "2013 Feb, DESTINATION",
            dest_album_path   = path.join(test_dir, dest_album_name);

        before(function(done) {
            async.series([
                function(next_step) {
                    gallery.add_album(source_album_name, next_step);
                },
                function(next_step) {
                    gallery.add_album("_DEST_", done);
                },
            ], done);
        });

        after(function(done) {
            // Since we are only adding an empty album, we only
            // need to remove the folder
            async.series([
                function(next_step) {
                    gallery.delete_album("_DEST_", true, next_step);
                },
                function(next_step) {
                    gallery.delete_album(dest_album_name, true, next_step);
                },
            ], done);
        });

        it("Edit an album which does not exist should fail", function(next_test) {
            gallery.rename_album("Album_Does_Not_Exist, 2012", "IMPOSSIBLE ALBUM, 2013", function(error) {
                error.id.should.be.exactly(gallery.ERRORS.SOURCE_DOES_NOT_EXIST.id);
                error.name.should.be.match(gallery.ERRORS.SOURCE_DOES_NOT_EXIST.name);
                next_test();
            });
        });

        it("Edit an album to a destination which exists should fail", function(next_test) {
            gallery.rename_album(source_album_name, "_DEST_", function(error) {
                error.id.should.be.exactly(gallery.ERRORS.DESTINATION_ALREADY_EXISTS.id);
                error.name.should.be.match(gallery.ERRORS.DESTINATION_ALREADY_EXISTS.name);
                next_test();
            });
        });

        it("Valid edit should work", function(next_test) {
            gallery.rename_album(source_album_name, dest_album_name, function(error) {
                fs.existsSync(dest_album_path).should.be.true;
                fs.existsSync(source_album_path).should.be.false;
                next_test(error);
            });
        });
    });

    /******************************************************************************\
    Tests for listing the albums in the gallery
    \******************************************************************************/
    it("List albums in the gallery", function(next_test) {
        var
            albums = ["A", "B", "C", "D", "E"],
            idx = 0;

        async.until(
            // Condition
            function() {
                return idx >= albums.length;
            },
            // Body
            function(iterate) {
                var album = albums[idx];
                idx += 1;
                gallery.add_album(album, iterate);
            },
            function(error) {
                gallery.list_albums(function(error, returned_albums) {
                    var ret_album_names = _.map(returned_albums, function(album) {
                        return album.name;
                    });
                    _.contains(ret_album_names, "A").should.be.true;
                    _.contains(ret_album_names, "B").should.be.true;
                    _.contains(ret_album_names, "C").should.be.true;
                    _.contains(ret_album_names, "D").should.be.true;
                    _.contains(ret_album_names, "E").should.be.true;

                    next_test(error);
                });
            }
        );
    });

    /******************************************************************************\
    Tests for Images
    \******************************************************************************/
    describe("Image related tests", function() {
        var
            base_path       = path.join(".", "test", "fixtures"),
            source0         = "moon image.jpeg",
            source0_path    = path.join(base_path, source0),
            source1         = "polar bear.jpeg",
            source1_path    = path.join(base_path, source1),
            source2         = "pup pups.jpeg",
            source2_path    = path.join(base_path, source2),
            source3         = "Some flower.jpg",
            source3_path    = path.join(base_path, source3),
            bad_source      = "invalidfile.png",
            bad_album       = "INVALID_ALBUM";

        before(function(done) {
            // Add a couple of albums for testing
            // adding images etc
            async.series([
                function(next_step) {
                    gallery.add_album("IMAGES_0", next_step);
                },
                function(next_step) {
                    gallery.add_album("IMAGES 1", next_step);
                },
            ], done);
        });

        after(function(done) {
            async.series([
                function(next_step) {
                    gallery.delete_album("IMAGES_0", true, next_step);
                },
                function(next_step) {
                    gallery.delete_album("IMAGES 1", true, next_step);
                },
            ], done);
        });

        /******************************************************************************\
        Copy images to an album
        \******************************************************************************/
        describe("Copy images from path -> album", function() {

            it("Copy image from path to valid album", function(next_test) {
                gallery.copy_image_to_album(source0_path, "IMAGES_0", function(error) {
                    var target_path = path.join(gallery.gallery_dir, "IMAGES_0", source0);
                    fs.existsSync(target_path).should.be.true;
                    next_test(error);
                });
            });

            it("Copy same image from path to same album", function(next_test) {
                gallery.copy_image_to_album(source0_path, "IMAGES_0", function(error) {
                    var target_path = path.join(gallery.gallery_dir, "IMAGES_0", source0);
                    fs.existsSync(target_path).should.be.true;
                    error.id.should.be.exactly(gallery.ERRORS.IMAGE_ALREADY_EXISTS_IN_ALBUM.id);
                    error.name.should.match(gallery.ERRORS.IMAGE_ALREADY_EXISTS_IN_ALBUM.name);
                    next_test();
                });
            });

            it("Force copy same image from path to same album", function(next_test) {
                gallery.copy_image_to_album(source0_path, "IMAGES_0", true, function(error) {
                    var target_path = path.join(gallery.gallery_dir, "IMAGES_0", source0);
                    fs.existsSync(target_path).should.be.true;
                    next_test(error);
                });
            });

            it("Copy image to an invalid album", function(next_test) {
                gallery.copy_image_to_album(source1_path, bad_album, function(error) {
                    error.id.should.be.exactly(gallery.ERRORS.ALBUM_DOES_NOT_EXIST.id);
                    error.name.should.match(gallery.ERRORS.ALBUM_DOES_NOT_EXIST.name);
                    next_test();
                });
            });

            it("Copy invalid image to an album", function(next_test) {
                gallery.copy_image_to_album(bad_source, "IMAGES 1", function(error) {
                    error.id.should.be.exactly(gallery.ERRORS.SOURCE_DOES_NOT_EXIST.id);
                    error.name.should.match(gallery.ERRORS.SOURCE_DOES_NOT_EXIST.name);
                    next_test();
                });
            });

            it("Copy multiple images to album [1/3]", function(next_test) {
                async.waterfall([
                    function(next_step) {
                        gallery.copy_image_to_album(source0_path, "IMAGES_0", true, next_step);
                    },
                    function(next_step) {
                        gallery.copy_image_to_album(source1_path, "IMAGES_0", true, next_step);
                    },
                    function(next_step) {
                        gallery.copy_image_to_album(source2_path, "IMAGES_0", true, next_step);
                    },
                    function(next_step) {
                        gallery.copy_image_to_album(source3_path, "IMAGES_0", true, next_step);
                    },
                    function(next_step) {
                        var album_base_path = path.join(gallery.gallery_dir, "IMAGES_0");
                        fs.readdir(album_base_path, next_step);
                    },
                ], function(error, files_in_album) {
                    _.contains(files_in_album, source0).should.be.true;
                    _.contains(files_in_album, source1).should.be.true;
                    _.contains(files_in_album, source2).should.be.true;
                    _.contains(files_in_album, source3).should.be.true;
                    next_test(error);
                });
            });

            it("List images in an album [2/3]", function(next_test) {
                // From the previous test case, we should have 4 images in the album. List them
                gallery.list_images_in_album("IMAGES_0", function(error, images) {
                    images.length.should.be.exactly(4);
                    var image_names = _.map(images, function(image) { return image.name; });
                    _.contains(image_names, source0).should.be.true;
                    _.contains(image_names, source1).should.be.true;
                    _.contains(image_names, source2).should.be.true;
                    _.contains(image_names, source3).should.be.true;
                    next_test(error);
                });
            });

            it("List images in invalid album", function(next_test) {
                gallery.list_images_in_album(bad_album, function(error, images) {
                    error.id.should.be.exactly(gallery.ERRORS.ALBUM_DOES_NOT_EXIST.id);
                    error.name.should.match(gallery.ERRORS.ALBUM_DOES_NOT_EXIST.name);
                    next_test();
                });
            });

            xit("Validate non images showing up in list images", function(next_test) {
                next_test();
            });
            xit("Validate copying images - filter etc", function(next_test) {
                next_test();
            });

        }); /* End Copy images tests */

        /******************************************************************************\
        NOTE: The Delete tests rely on the fact that source0,1,2,3 live in the
              "IMAGES_0" album. Reorder with care!
        \******************************************************************************/
        describe("Delete images in album", function() {

            it("Delete valid image from gallery", function(next_test) {
                gallery.delete_image(source0, "IMAGES_0", function(error) {
                    var target_path = path.join(gallery.gallery_dir, "IMAGES_0", source0);
                    fs.existsSync(target_path).should.be.false;
                    next_test(error);
                });
            });

            it("Delete invalid image from gallery", function(next_test) {
                gallery.delete_image(bad_source, "IMAGES_0", function(error) {
                    error.id.should.be.exactly(gallery.ERRORS.IMAGE_DOES_NOT_EXIST.id);
                    error.name.should.match(gallery.ERRORS.IMAGE_DOES_NOT_EXIST.name);
                    next_test();
                });
            });

            it("Delete image from invalid gallery", function(next_test) {
                gallery.delete_image(source0, bad_album, function(error) {
                    error.id.should.be.exactly(gallery.ERRORS.ALBUM_DOES_NOT_EXIST.id);
                    error.name.should.match(gallery.ERRORS.ALBUM_DOES_NOT_EXIST.name);
                    next_test();
                });
            });
        }); /* End tests for "Delete images in album" */

    }); /* End Image related tests */

}); /* End Gallery tests */
