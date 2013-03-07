define(['models/task'], function(TaskModel ){
    var TaskListCollection = Backbone.Collection.extend({
        url: "/tasks",
        model: TaskModel,
        initialize: function(){
            
        }
    });

    return TaskListCollection;
});