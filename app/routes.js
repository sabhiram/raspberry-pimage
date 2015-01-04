/*****************************************************************************\
Routes file which pairs our server"s HTTP handlers
to the ReSTy interface we provide...
\*****************************************************************************/
module.exports = function(app, handlers) {

    // Application Entrypoint
    app.get(   "/",                                                handlers.view.app);

    // Album Routes
    app.get(   "/api/albums/list",                                 handlers.api.albums.list_albums);
    app.get(   "/api/albums/list_images/:album_name",              handlers.api.albums.list_images);
    app.delete("/api/albums/delete_image/:album_name/:image_name", handlers.api.albums.delete_image);

    // Camera Routes
	app.get(   "/api/camera/take_picture/album/:album_name",       handlers.api.camera.take_picture);
    app.get(   "/api/camera/default_settings",                     handlers.api.camera.get_default_settings);
    app.get(   "/api/camera/settings",                             handlers.api.camera.get_settings);
    app.post(  "/api/camera/settings",                             handlers.api.camera.save_settings);

    // RPI Utils
    app.post(  "/api/utils/restart",                               handlers.api.utils.restart);
    app.post(  "/api/utils/shutdown",                              handlers.api.utils.shutdown);

    // 404 Page
    app.get(   "*",                                                handlers.view.error);
    // NO MORE ROUTES HERE... add them before the 404 page!
};

