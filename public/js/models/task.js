define(["underscore", "backbone"], function(_, Backbone) {
    var TaskModel = Backbone.Model.extend({
        url: "/task",
        defaults : {
            title: "",
            priority: "0",
            order: "0",
            date: "",
            notes: "",
            status: "none",
            critical: false,
            archived: false
        },
        // Parses the OID string from MongoDB.
        parse: function(response){
            if(_.isString(response))
                response = JSON.parse(response);
            response.id = response._id.$oid;
            return response;
        }
    });

    return TaskModel;

});