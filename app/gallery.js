var
    // Node modules
    async = require("async"),
    _     = require("underscore")._,
    exec  = require("child_process").exec,
    fs    = require("fs"),
    rm_rf = require("rimraf"),
    util  = require("util"),
    path  = require("path"),

    // Custom Modules
    log   = require("./logger")();

module.exports = function(gallery_dir) {
    /******************************************************************************\
    Define module globals / constants. Some of these are / can be exposed to the
    person including the module.
    \******************************************************************************/
    var
        _gallery_dir = gallery_dir,
        _ERRORS = {
            UNKNOWN_ERROR:                          { id: 0, name: "UNKNOWN_ERROR" },
            ALBUM_ALREADY_EXISTS:                   { id: 1, name: "ALBUM_ALREADY_EXISTS" },
            ALBUM_CREATION_FAILED:                  { id: 2, name: "ALBUM_CREATION_FAILED" },
            ALBUM_DOES_NOT_EXIST:                   { id: 3, name: "ALBUM_DOES_NOT_EXIST" },
            ALBUM_NOT_EMPTY:                        { id: 4, name: "ALBUM_NOT_EMPTY" },
            SOURCE_DOES_NOT_EXIST:                  { id: 5, name: "SOURCE_DOES_NOT_EXIST" },
            DESTINATION_ALREADY_EXISTS:             { id: 6, name: "DESTINATION_ALREADY_EXISTS" },
            IMAGE_ALREADY_EXISTS_IN_ALBUM:          { id: 7, name: "IMAGE_ALREADY_EXISTS_IN_ALBUM" },
            IMAGE_DOES_NOT_EXIST:                   { id: 8, name: "IMAGE_DOES_NOT_EXIST" },
        },
        _RE = {
            FILTERS: {
                VALID_IMAGE:        /\.(jpg|jpeg|png|gif|bmp)$/i,
                INVALID_ALBUM:      /^\.DS_Store/i
            }
        };

    /******************************************************************************\
    Helper functions to raise errors on certain frequent conditions
    \******************************************************************************/
    function raise_error_if_no_path(search_path, error, callback) {
        fs.exists(search_path, function(exists) {
            var e = null;
            if (!exists) {
                // console.log("RAISE ERROR " + error.name + ". " + search_path + " not found.");
                e = error;
            }
            callback(e);
        });
    }
    function raise_error_if_path(search_path, error, callback) {
        fs.exists(search_path, function(exists) {
            var e = null;
            if (exists) {
                // console.log("RAISE ERROR " + error.name + ". " + search_path + " found.");
                e = error;
            }
            callback(e);
        });
    }


    /******************************************************************************\
    Define external interfaces
    \******************************************************************************/
    var
        /******************************************************************************\
        Function:
            init

        Inputs:
            callback

        Description:
            Init the gallery, make the gallery folder if it does not exist. Eventually
            this should bubble some errors...
        \******************************************************************************/
        _init = function(callback) {
            fs.exists(_gallery_dir, function(exists) {
                if (!exists) {
                    fs.mkdir(_gallery_dir, callback);
                } else {
                    // Nothing to do, gallery exists
                    callback();
                }
            });
        },

        /******************************************************************************\
        Function:
            add_album

        Inputs:
            album_name          - the album to add to the gallery
            callback            - [error]

        Description:
            Adds a given album to the gallery, returns the following errors:
            * ALBUM_ALREADY_EXISTS
            * ALBUM_CREATION_FAILED
        \******************************************************************************/
        _add_album = function(album_name, callback) {
            var
                album_path = path.join(_gallery_dir, album_name);

            async.series([
                function check_folder_exists(next_step) {
                    raise_error_if_path(album_path, _ERRORS.ALBUM_ALREADY_EXISTS, next_step);
                },
                function create_folder_for_album(next_step) {
                    log.info("Making a new album at folder: " + album_path);
                    fs.mkdir(album_path, function(error) {
                        if (error) {
                            log.error("Gallery::Add Album - " + error);
                            error = _ERRORS.ALBUM_CREATION_FAILED;
                        }
                        next_step(error);
                    });
                }
            ], callback);
        },

        /******************************************************************************\
        Function:
            rename_album

        Inputs:
            old_album_name      - source name of source
            new_album_name      - destination name of album
            callback            - [error]

        Description:
            Renames a given album, raises the following errors:
            * SOURCE_DOES_NOT_EXIST
            * DESTINATION_ALREADY_EXISTS
        \******************************************************************************/
        _rename_album = function(old_album_name, new_album_name, callback) {
            var
                old_path = path.join(_gallery_dir, old_album_name),
                new_path = path.join(_gallery_dir, new_album_name);

            // Mmmm early exits
            if (old_album_name == new_album_name) callback();

            async.waterfall([
                function list_gallery_albums(next_step) {
                    fs.readdir(_gallery_dir, next_step);
                },
                function validate_album_edit(albums, next_step) {
                    var error = null;
                    if (!_.contains(albums, old_album_name)) {
                        error = _ERRORS.SOURCE_DOES_NOT_EXIST;
                    } else if (_.contains(albums, new_album_name)) {
                        error = _ERRORS.DESTINATION_ALREADY_EXISTS;
                    }
                    next_step(error);
                },
                function rename_album(next_step) {
                    fs.rename(old_path, new_path, next_step);
                }
            ], callback);
        },

        /******************************************************************************\
        Function:
            delete_album

        Inputs:
            album_name          - name of album we are trying to delete
            force_delete        - if set, non-empty albums will be nuked
            callback            - [error]

        Description:
            Deletes a given album. If force_delete is set, non-empty albums will
            be deleted. The errors raised could be:
            * ALBUM_DOES_NOT_EXIST
            * ALBUM_NOT_EMPTY
        \******************************************************************************/
        _delete_album = function(album_name, force_delete, callback) {
            var
                album_path = path.join(_gallery_dir, album_name);

            if (typeof(force_delete) == "function") {
                callback = force_delete;
                force_delete = false;
            }

            async.waterfall([
                function check_if_album_exists(next_step) {
                    raise_error_if_no_path(album_path, _ERRORS.ALBUM_DOES_NOT_EXIST, next_step);
                },
                function get_files_in_dir(next_step) {
                    fs.readdir(album_path, next_step);
                },
                function validate_deletion(files, next_step) {
                    if (files.length == 0) {
                        fs.rmdir(album_path, next_step);
                    } else if (force_delete == true) {
                        // Use rimraf (rm -rf) to delete the files
                        rm_rf(album_path, next_step);
                    } else {
                        next_step(_ERRORS.ALBUM_NOT_EMPTY);
                    }
                }
            ], callback);
        },

        /******************************************************************************\
        Function:
            list_albums

        Inputs:
            callback            - [error, album_list]

        Description:
            Returns a dictionary of albums in the gallery folder. Currently the error raised
            is the one propagated by fs.readdir. The return value looks like: [{id: _id, name: _name}]
        \******************************************************************************/
        _list_albums = function(callback) {
            // For now, I am being lazy and allowing this to just be a dumb read
            // of the gallery dir. This assumes that there are no other files and
            // crap in there. Would be easy to pass this via a filter if needed.
            // Ideally this is done once the system adds / removes files or albums
            // but that would involve setting up a fs.watch on the albums.
            fs.readdir(_gallery_dir, function(error, albums) {
                callback(
                    error,
                    _.map(
                        _.filter(
                            albums,
                            function(album, index) { return !album.match(_RE.FILTERS.INVALID_ALBUM); }
                        ),
                        function(album, index) {
                            return { id: index, name: album };
                        }
                    )
                );
            });
        },

        /******************************************************************************\
        Function:
            list_images_in_album

        Inputs:
            album_name          - name of the album
            callback            - [error, images]

        Description:
            Returns a filtered list of images info found in a given album in the "images"
            list. Raises the ALBUM_DOES_NOT_EXIST error if applicable.
        \******************************************************************************/
        _list_images_in_album = function(album_name, callback) {
            // See above comment in _list_albums - the same applies here
            var album_path = path.join(_gallery_dir, album_name);

            async.waterfall([
                function validate_album(next_step) {
                    raise_error_if_no_path(album_path, _ERRORS.ALBUM_DOES_NOT_EXIST, next_step);
                },
                function read_album_contents(next_step) {
                    fs.readdir(album_path, next_step);
                },
            ], function(error, files) {
                callback(
                    error,
                    _.map(
                        _.filter(
                            files,
                            function(each_file) {
                                return each_file.match(_RE.FILTERS.VALID_IMAGE);
                            }
                        ),
                        function(filtered_file, index) {
                            return {
                                id: index,
                                name: filtered_file,
                            };
                        }
                    )
                );
            });
        },

        /******************************************************************************\
        Function:
            copy_image_to_album

        Inputs:
            source_path         - path to source image, relative or explicit
            target_album        - album to copy to, must be valid album
            force_copy          - boolean, determines if the destination can be o/w
            callback            - [error]

        Description:
            Uses the linux cp utility to copy a file from any path to a given album. The
            callback is fired with the following erros when appropriate:
            * SOURCE_DOES_NOT_EXIST
            * ALBUM_DOES_NOT_EXIST
            * IMAGE_ALREADY_EXISTS_IN_ALBUM (ignored if force_copy is set)

            Internally, the child-process's exec function is used to execute the cp cmd.
        \******************************************************************************/
        _copy_image_to_album = function(source_path, target_album, force_copy, callback) {
            var
                target_dir  = path.join(_gallery_dir, target_album),
                target_name = path.basename(source_path),
                target_path = path.join(target_dir, target_name);

            if (typeof(force_copy) == "function" && typeof(callback) != "function") {
                callback = force_copy;
                force_copy = false;
            }

            // Normalize the path..
            source_path = path.resolve(source_path);

            async.waterfall([
                // TODO: This is generic to any file, limit to only images
                function validate_source_file(next_step) {
                    raise_error_if_no_path(source_path, _ERRORS.SOURCE_DOES_NOT_EXIST, next_step);
                },
                function validate_destination_album(next_step) {
                    raise_error_if_no_path(target_dir, _ERRORS.ALBUM_DOES_NOT_EXIST, next_step);
                },
                function check_destination_file(next_step) {
                    if (force_copy) {
                        next_step(null, "-f");
                    } else {
                        raise_error_if_path(target_path, _ERRORS.IMAGE_ALREADY_EXISTS_IN_ALBUM, next_step);
                    }
                },
                function copy_image(copy_options, next_step) {
                    if (typeof(copy_options) == "function") {
                        next_step = copy_options;
                        copy_options = "";
                    }
                    var cp_cmd = "cp " + copy_options + " \"" + source_path + "\" \"" + target_path + "\"";
                    exec(cp_cmd, function(error, stdout, stderr) {
                        // TODO: This error typically never gets fired, if it does:
                        //       add a test and re-enable the below 4 lines of code
                        // var cp_error = null;
                        // if (error) {
                        //     console.log("ERROR: " + error);
                        //     cp_error = _ERRORS.COPY_FILE_TO_ALBUM_FAILED;
                        // }
                        next_step(error);
                    });
                }
            ], callback);
        },

        /******************************************************************************\
        Function:
            delete_image

        Inputs:
            image_name          - name of image to delete
            target_album        - album to delete image in
            callback            - [error]

        Description:
            Delete the given image in the given album. Erros raised to the callback
            are the following:
            * ALBUM_DOES_NOT_EXIST
            * IMAGE_DOES_NOT_EXIST

            The deletion uses the fs.unlink method to delete the file, it is possible
            to change this to end up calling something like rm [-rf] etc...
        \******************************************************************************/
        _delete_image = function(image_name, target_album, callback) {
            var
                target_dir  = path.join(_gallery_dir, target_album),
                target_path = path.join(target_dir, image_name);

            async.series([
                function validate_destination_album(next_step) {
                    raise_error_if_no_path(target_dir, _ERRORS.ALBUM_DOES_NOT_EXIST, next_step);
                },
                function validate_destination_file(next_step) {
                    raise_error_if_no_path(target_path, _ERRORS.IMAGE_DOES_NOT_EXIST, next_step);
                },
                function remove_image(next_step) {
                    // TODO: SAFE UNLINK!!
                    fs.unlink(target_path, next_step);
                }
            ], callback);
        };

    /******************************************************************************\
        This is a neat little trick I saw somewhere (Need to find source), this
        allows the module to take in a set of inputs, and return a chosen set of
        interfaces to expose. I have chosen to define functions with an "_" when
        they are interface functions. The private ones are just defined as-is.
    \******************************************************************************/
    return {
        gallery_dir:                _gallery_dir,
        ERRORS:                     _ERRORS,

        init:                       _init,

        // Album management
        add_album:                  _add_album,
        rename_album:               _rename_album,
        delete_album:               _delete_album,

        // Album / image interactions
        list_albums:                _list_albums,
        list_images_in_album:       _list_images_in_album,
        copy_image_to_album:        _copy_image_to_album,

        // Image management
        delete_image:               _delete_image,

    };
};
