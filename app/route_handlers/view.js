module.exports = function(log_settings) {

    var log = require("./logger")(log_settings);

    return {

        app: function(request, response) {
            response.render("index", {});
        },

        error: function(request, response) {
            log.warn("404 page invoked due to some error!");
            log.warn(request.url + " attempted and failed...");
            response.send(404, "Umm, this is an error page... what the heck are you looking for?");
        }
    };

};
