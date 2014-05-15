/*
    Routes file which pairs our server"s HTTP handlers
    to the ReSTy interface we provide...
*/
module.exports = function(app, handlers) {
    app.get("/", handlers.view.app);

    // Album Routes
    app.get("/api/list_albums", handlers.api.albums.list_albums);
    app.get("/api/list_images/album/:album_name", handlers.api.albums.list_images);
    app.delete("/api/album/:album_name/image/:image_name", handlers.api.albums.delete_image);
    
    // Camera Routes
	app.get("/api/take_picture/album/:album_name", handlers.api.camera.take_picture);
    app.post("/api/settings", handlers.api.camera.save_settings);
    app.get("/api/settings", handlers.api.camera.get_settings);
    app.get("/api/default_settings", handlers.api.camera.get_default_settings);
    
    app.get("*", handlers.view.error);
    // NO MORE ROUTES HERE... add them before the 404 page!
};

