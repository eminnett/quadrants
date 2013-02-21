//Configure Require with shims and vendor script paths.
require.config({
    shim: {
        "underscore": {
            exports: '_'
        },
        "backbone": {
            deps: ["jquery", "underscore"],
            exports: "Backbone"
        },
        "handlebars": {
            exports: "Handlebars"
        },
        // Hammer provides a wrapper for touch events.
        // This is a jQuery plugin that integrates
        // Hammer.js into jQuery's event model.
        "jquery.hammer": {
            deps: ["jquery", "hammer"],
            exports: "jQuery.hammer"
        }
    },
    paths: {
        "jquery": "libs/jquery",
        "underscore": "libs/underscore",
        "backbone": "libs/backbone",
        "handlebars": "libs/handlebars",
        "hammer": "libs/hammer",
        "jquery.hammer": "libs/jquery.specialevent.hammer"
    }

});

//Initialize the quadrants app.
require(["helpers/handlebars", "quadrants"], function(handlebarsHelpers, Q){
    handlebarsHelpers();
    Q.initialize();
});
