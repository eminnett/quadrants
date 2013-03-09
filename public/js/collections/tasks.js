define(["backbone", "models/task"], function (Backbone, TaskModel) {
    "use strict";
    var TasksCollection = Backbone.Collection.extend({
        url: "/tasks",
        model: TaskModel,
        initialize: function () {
            this.fetch();
        }
    });

    return TasksCollection;
});