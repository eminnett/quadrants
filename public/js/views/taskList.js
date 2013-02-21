define([
    "backbone",
    "libs/text!templates/taskList.html"
], function(Backbone, taskListTemplate){

    var template = Handlebars.compile( taskListTemplate ),
        TaskListView = Backbone.View.extend({
            className: "task-list-wrapper",
            events: {
            },
            initialize: function(){
                this.render();
                return this;
            },
            render: function(){
                this.$el.html(template());
                return this;
            }
        });

    return TaskListView;
});