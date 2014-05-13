/*
    Routes file which pairs our server"s HTTP handlers
    to the ReSTy interface we provide...
*/
module.exports = function(app, handlers) {
    app.get(                     "/",          handlers.view.home );
    
    app.get("/api/list_albums", handlers.api.albums.list_albums);
    app.get("/api/take_picture/album/:album_name", handlers.api.albums.take_picture);
    app.get("/api/list_images/album/:album_name", handlers.api.albums.list_images);

    app.delete("/api/album/:album_name/image/:image_name", handlers.api.albums.delete_image);

    
    
    app.get(                     "*",          handlers.view.error );
    // NO MORE ROUTES HERE... add them before the 404 page!
};

