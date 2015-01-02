var
    // Node Modules

    // Custom Modules
    log = require("../logger")();

module.exports = function() {

    return {

        app: function(request, response) {
            log.info("GET /")
            response.render("index", {});
        },

        error: function(request, response) {
            log.warn("404 page invoked due to some error!");
            log.warn(request.url + " attempted and failed...");
            response.send(404, "Umm, this is an error page... what the heck are you looking for?");
        },

    };

};
