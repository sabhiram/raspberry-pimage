/*
    Routes file which pairs our server"s HTTP handlers
    to the ReSTy interface we provide...
*/
module.exports = function(app, handlers) {
    app.get(                     "/",          handlers.view.home );
    
    app.get("/api/albums/list", handlers.api.albums.list_albums);
    app.get("/api/albums/:album_name/take_picture", handlers.api.albums.take_picture);

    app.delete("/api/delete/album/:album_name/image/:image_name", handlers.api.albums.delete_image);

    app.get("/api/image/:album_name/list", handlers.api.albums.list_images);
    
    app.get(                     "*",          handlers.view.error );
    // NO MORE ROUTES HERE... add them before the 404 page!
};

