define(["backbone"], function(Backbone) {
    var TaskModel = Backbone.Model.extend({
        url: "/task",
        defaults : {
            title: "Default Title",
            priority: 0,
            order: undefined,
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
        },
        validate: function(attributes){
            if(_.isString(attributes.priority))
                this.set("priority", parseInt(attributes.priority, 10));
        }
    });

    return TaskModel;

});