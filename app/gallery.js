var
    async   = require("async"),
    _       = require("underscore")._,
    exec    = require("child_process").exec,
    fs      = require("fs"),
    rm_rf   = require("rimraf"),
    util    = require("util"),
    path    = require("path");

module.exports = function(log, gallery_dir) {
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
        };
    /***
     *  Some helper functions - maybe these will be moved out
    ***/
    function raise_error_if_no_path(search_path, error, callback) {
        fs.exists(search_path, function(exists) {
            var e = null;
            if(!exists) {
                // console.log("RAISE ERROR " + error.name + ". " + search_path + " not found.");
                e = error;
            }
            callback(e);
        });
    }
    function raise_error_if_path(search_path, error, callback) {
        fs.exists(search_path, function(exists) {
            var e = null;
            if(exists) {
                // console.log("RAISE ERROR " + error.name + ". " + search_path + " found.");
                e = error;
            }
            callback(e);
        });
    }


    /***
     *  Start defining our interface functions
    ***/
    var
        /***
         *  Initialize the gallery, called once explicitly
         *  by whoever requires this
        ***/
        _init = function() {
            if(!fs.existsSync(_gallery_dir)) {
                fs.mkdirSync(_gallery_dir);
            }
        },

        /***
         *  add_album takes in an album name, and
         *  creates an album in the gallery_dir.
         *  If an album already exists, it will return
         *  a suitable error.
        ***/
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
                        if(error) {
                            log.error("Gallery::Add Album - " + error);
                            error = _ERRORS.ALBUM_CREATION_FAILED;
                        }
                        next_step(error);
                    });
                }
            ], callback);
        },

        /***
         *  rename_album function which takes a given album name and 
         *  renames it to another (valid one).
        ***/
        _rename_album = function(old_album_name, new_album_name, callback) {
            var
                old_path = path.join(_gallery_dir, old_album_name),
                new_path = path.join(_gallery_dir, new_album_name);

            // Mmmm early exits
            if(old_album_name == new_album_name) callback();

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

        /***
         *  delete_album takes an album name and if the album is found
         *  deletes it (if empty or if force == true). 
        ***/
        _delete_album = function(album_name, force_delete, callback) {
            var
                album_path = path.join(_gallery_dir, album_name);

            if(typeof(force_delete) == "function") {
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
                    if(files.length == 0) {
                        fs.rmdir(album_path, next_step);
                    } else if(force_delete == true) {
                        // Use rimraf (rm -rf) to delete the files
                        rm_rf(album_path, next_step);
                    } else {
                        next_step(_ERRORS.ALBUM_NOT_EMPTY);
                    }
                }
            ], callback);
        },

        _copy_image_to_album = function(source_path, target_album, force_copy, callback) {
            var
                target_dir  = path.join(_gallery_dir, target_album),
                target_name = path.basename(source_path),
                target_path = path.join(target_dir, target_name);

            if(typeof(force_copy) == "function" && typeof(callback) != "function") {
                callback = force_copy;
                force_copy = false;
            }

            async.waterfall([
                // TODO: This is generic to any file, limit to only images
                function validate_source_file(next_step) {
                    raise_error_if_no_path(source_path, _ERRORS.SOURCE_DOES_NOT_EXIST, next_step);
                },
                function validate_destination_album(next_step) {
                    raise_error_if_no_path(target_dir, _ERRORS.ALBUM_DOES_NOT_EXIST, next_step);
                },
                function check_destination_file(next_step) {
                    if(force_copy) {
                        next_step(null, "-f");
                    } else {
                        raise_error_if_path(target_path, _ERRORS.IMAGE_ALREADY_EXISTS_IN_ALBUM, next_step);
                    }
                },
                function copy_image(copy_options, next_step) {
                    if(typeof(copy_options) == "function") {
                        next_step = copy_options;
                        copy_options = "";
                    }
                    var cp_cmd = "cp " + copy_options + " \"" + source_path + "\" \"" + target_path + "\"";
                    exec(cp_cmd, function(error, stdout, stderr) {
                        var cp_error = null;
                        if(error) {
                            cp_error = _ERRORS.COPY_FILE_TO_ALBUM_FAILED;
                        }
                        next_step(cp_error);
                    });
                }
            ], callback);
        },

        _delete_image = function(image_info, album_name, callback) {
            callback("TODO: delete_image");
        },

        __LAST_VARIABLE__ = 0;
    return {
        gallery_dir:                _gallery_dir,
        ERRORS:                     _ERRORS,

        init:                       _init,
        
        // Album management
        add_album:                  _add_album,
        rename_album:               _rename_album,
        delete_album:               _delete_album,

        // Image management
        copy_image_to_album:        _copy_image_to_album,
        delete_image:               _delete_image,

    };
};