var
    // Node Modules
    _         = require("underscore")._,
    path      = require("path"),

    // Custom Modules
    log       = require("../logger")(),
    rpi_utils = require("../rpi_utils")();

/*****************************************************************************\
RPI API Handler. This is only done in a single file since this
is a very simple project... if this required a more heavy handed
approach (manage albums, folders, images etc directly), then
this *should* be split out into various handlers.
\*****************************************************************************/
module.exports = function(gallery, rpi_camera) {

    // Helper function to log errors and send success status to the
    // response based on any object the api wishes to pass back
    function log_error_send_success_with(success_obj, error, response) {
        if (error) {
            log.error(error);
            response.send({ status: "ERROR", error: error });
        } else {
            success_obj = success_obj || {};
            success_obj["status"] = "SUCCESS";
            response.send(success_obj);
        }
        response.end();
    }

    return {

        // Album related APIs
        albums: {

            // List all albums in the gallery
            list_albums: function(request, response) {
                log.info("GET /api/list_albums");
                gallery.list_albums(function(error, albums) {
                    log_error_send_success_with({
                        albums: albums
                    }, error, response);
                });
            },

            // List all images in an album
            // GET /api/image/list_images/:album_name
            list_images: function(request, response) {
                log.info("GET /api/list_images/:album_name");
                gallery.list_images_in_album(
                    request.params.album_name,
                    function(error, images) {
                        log_error_send_success_with({
                            images: images
                        }, error, response);
                    }
                );
            },

            delete_image: function(request, response) {
                log.info("DELETE /api/album/:album_name/image/:image_name");
                gallery.delete_image(request.params.image_name, request.params.album_name, function(error) {
                    log_error_send_success_with({}, error, response);
                });
            },
        },

        // Image related APIs
        camera: {

            take_picture: function(request, response) {
                log.info("GET /api/take_picture/album/:album_name");
                var
                    album_name = request.params.album_name,
                    album_path = path.join(gallery.gallery_dir, album_name),
                    image_name = "image" + Math.floor(Math.random()*100+1) + ".jpg",
                    image_path = path.join(album_path, image_name);

                rpi_camera.take_picture(image_path, function(error) {
                    log_error_send_success_with({
                        image_name: image_name
                    }, error, response);
                });
            },

            save_settings: function(request, response) {
                log.info("POST /api/settings");
                var settings = request.body;
                rpi_camera.save_settings(settings, function(error) {
                    log_error_send_success_with({}, error, response);
                });
            },

            // This does not need to call anything in the camera module, it
            // simply needs to fetch the camera's current settings which are
            // exposed via the rpi_camera.settings param.
            get_settings: function(request, response) {
                log.info("GET /api/settings");
                log_error_send_success_with({settings: rpi_camera.get_settings_sync()}, null, response);
            },

            // Same as above, but default settings
            get_default_settings: function(request, response) {
                log.info("GET /api/default_settings");
                log_error_send_success_with({default_settings: rpi_camera.get_default_settings_sync()}, null, response);
            },
        },

        // RPI Util APIs
        utils: {

            reboot: function(request, response) {
                log.info("POST /api/utils/reboot");
                rpi_utils.reboot_pi(function(error, stdout) {
                    response.send("OK");
                });
            },

            shutdown: function(request, response) {
                log.info("POST /api/utils/shutdown");
                rpi_utils.shutdown_pi(function(error, stdout) {
                    response.send("OK");
                });
            },
        },

        // Other APIs
    };

};
