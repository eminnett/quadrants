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
        }
    },
    paths: {
        "jquery": "libs/jquery",
        "underscore": "libs/underscore",
        "backbone": "libs/backbone",
        "handlebars": "libs/handlebars"
    }

});

//Initialize the quadrants app.
require(["helpers/handlebars", "quadrants"], function(handlebarsHelpers, Q){
    handlebarsHelpers();
    Q.initialize();
});
