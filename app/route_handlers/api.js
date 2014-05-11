var
    _       = require("underscore")._,
    path    = require("path");

/***
 *  RPI API Handler. This is only done in a single file since this
 *  is a very simple project... if this required a more heavy handed
 *  approach (manage albums, folders, images etc directly), then
 *  this *should* be split out into various handlers.
***/
module.exports = function(log, gallery, rpi_camera) {



    return {

        // Album related APIs
        albums: {

            // List all albums in the gallery
            list_albums: function(request, response) {
                log.info("GET /api/albums/list");
                gallery.list_albums(function(error, albums) {
                    response.send(albums);
                    response.end();
                });
            },

            // Take a pic
            take_picture: function(request, response) {
                log.info("GET /api/albums/:album_name/take_picture");
                var
                    album_name = request.params.album_name,
                    album_path = path.join(gallery.gallery_dir, album_name),
                    image_name = "image" + Math.floor(Math.random()*100+1) + ".jpg",
                    image_path = path.join(album_path, image_name),
                    options    = {};

                rpi_camera.take_picture(image_path, options, function(error) {
                    if(error) {
                        log.error(error);
                        response.send(error);
                    } else {
                        log.info("take_picture - about to list images " + album_name);
                        gallery.list_images_in_album(
                            album_name,
                            function(error, images) {
                                log.info(images);
                                response.send(images);
                                response.end();
                            }
                        );
                    }
                });
            },
        },

        // Image related APIs
        image: {

            // List all images in an album
            // GET /api/image/list_images/:album_name
            list_images: function(request, response) {
                log.info("GET /api/image/list/:album_name");
                gallery.list_images_in_album(
                    request.params.album_name, 
                    function(error, images) {
                        response.send(images);
                        response.end();
                    }
                );
            }
        },


        // Other APIs
    };

};


