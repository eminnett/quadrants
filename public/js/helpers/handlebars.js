// Defines helper blocks for Handlebars.
define(["handlebars"], function(Handlebars){
    return function(){
        //Tests equality.
        Handlebars.registerHelper("ifEqual", function(v1, v2, options) {
            if(v1 == v2) {
                return options.fn(this);
            }
            return options.inverse(this);
        });

        //Tests inequality.
        Handlebars.registerHelper("ifNotEqual", function(v1, v2, options) {
            if(v1 != v2) {
                return options.fn(this);
            }
            return options.inverse(this);
        });
    };
});