/*****************************************************************************\
    Application Requires the following modules
\*****************************************************************************/
var
    // Underscore.js - http://underscorejs.org/
    //     Utility module for NodeJS with awesome helpers for
    //     working with collections, lists, and higer order functions 
    _               = require("underscore")._,
    
    // Async - https://github.com/caolan/async
    //     Async utility module, very useful for things like avoiding
    //     excessively nested callbacks. Allows for easier control flow
    //     of async code
    async           = require("async"),
     
    // express - http://expressjs.com/
    //     A web framework for node, provides easy ways to manage 
    //     a web application"s routes, etc
    express         = require("express"),

    // Other commonly used NodeJS modules
    util            = require("util"),
    fs              = require("fs"),
    path            = require("path");


/*****************************************************************************\
    Application Globals
\*****************************************************************************/


var
    // TODO: Load args from file
    args = {
        port:               process.env.PORT || 1234,
        version:            "0.0.1",
        name:               "RaspberryPIMage",
        gallery_dir:        "app/public/gallery",
        camera_settings:    "camera_settings.json",
        admin_passcode:     "mrfseesall",
        logs_dir:           "logs",
    };

/*****************************************************************************\
    Setup Logging
\*****************************************************************************/
// Create logs folder if it does not exist
// The *only* reason this is using a *Sync call is due to the
// fact that this only occurs on server startup and can afford
// to be a blocking call. The last thing we want in our server
// a stupid blocking call causing our requests to get queued up.
// So again, only do this while initializing the server, matter
// of fact, I probably should remove this crap...
var _logs = path.join(__dirname, args.logs_dir);
if(!fs.existsSync(_logs)) {
    fs.mkdirSync(_logs);
}

var
    // Since we have a common logs folder for our logs, we can encapsulate
    // the loggers settings in a logger.js file, and pass the path to the
    // logs dir while requiring the logger module. This way all modules
    // can log to a consistent location.
    log =           require("./app/logger.js")(_logs),

    // Include our custom "gallery" interface and pass it to
    // the API
    gallery =       require("./app/gallery")(log, args.gallery_dir),
    rpi_camera =    require("./app/rpi_camera")(log, args.camera_settings),

    // Define API and View handlers
    handlers = {
        view:       require("./app/route_handlers/view")(log),
        api:        require("./app/route_handlers/api")(log, gallery, rpi_camera),
    },

    // Create an express app. Note this is using our custom
    // "app.config" module to bootstrap an express app
    app = require("./app/config/app.config")(express());

// Setup and start the server
async.series([
    function setup_gallery(next_step) {
        gallery.init(next_step);
    },
    function setup_camera(next_step) {
        rpi_camera.init(next_step);
    },
    function setup_app_routes(next_step) {
        require("./app/routes.js")(app, handlers);
        next_step();
    }
], function(error) {
    if(error) {
        log.error("Unable to start server. Aborting...");
    } else {
        app.listen(args.port);
        log.info("Server up at: " + new Date());
        log.info("... waiting on port: " + args.port);
    }
});

// This is done so that we can require, and test this app
module.exports = app;