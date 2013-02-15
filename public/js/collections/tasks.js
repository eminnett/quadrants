define(['models/task'], function(TaskModel ){
    var TasksCollection = Backbone.Collection.extend({
        url: "/tasks",
        model: TaskModel,
        initialize: function(){
            this.fetch();
        }
    });

    return TasksCollection;
});