/*
    Routes file which pairs our server"s HTTP handlers
    to the ReSTy interface we provide...
*/
module.exports = function(app, handlers) {
    app.get(                     "/",          handlers.view.home );
    app.get(                     "*",          handlers.view.error );
    // NO MORE ROUTES HERE... add them before the 404 page!
};

