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
        "mustache": {
            exports: "Mustache"
        }
    },
    paths: {
        "jquery": "libs/jquery",
        "underscore": "libs/underscore",
        "backbone": "libs/backbone",
        "mustache": "libs/mustache"
    }

});

//Initialize the quadrants app.
require(["quadrants"], function(Q){
    Q.initialize();
});
