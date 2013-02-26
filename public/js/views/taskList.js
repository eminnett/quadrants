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
                _.bindAll(this, "positionTask");
                this.tasks = {};
                this.spacing = 10;
                this.taskHeight = 50;
                this.space = undefined;
                this.render();
                return this;
            },
            render: function(){
                this.$el.html(template());
                this.taskList = this.$(".task-list");
                return this;
            },
            insert: function(task, index){
                var order = (!_.isUndefined(index)) ? index : _.keys(this.tasks).length;
                if(!_.isUndefined(index))
                    this.incrementFrom(index);
                task.model.set("order", order);
                this.taskList.append(task.$el);
                this.tasks[task.cid] = task;
                this.organiseTasks();
            },
            remove: function(task, withSpace){
                var order = task.model.get("order");
                if(_.isUndefined(this.tasks[task.cid]))
                    return;
                delete this.tasks[task.cid];
                this.decrementFrom(order);
                if(withSpace)
                    this.makeSpaceAt(order);
                else
                    this.organiseTasks();
            },
            incrementFrom: function(index){
                _.each(this.tasks, function(task){
                    var order = task.model.get("order");
                    if( order >= index )
                        task.model.set("order", order + 1);
                });
            },
            decrementFrom: function(index){
                _.each(this.tasks, function(task){
                    var order = task.model.get("order");
                    if( order > index )
                        task.model.set("order", order - 1);
                });
            },
            makeSpaceAt: function(index){
                this.space = index;
                this.organiseTasks();
            },
            removeSpace: function(){
                if(_.isUndefined(this.space))
                    return;
                this.space = undefined;
                this.organiseTasks();
            },
            organiseTasks: function(){
                _.each(this.tasks, this.positionTask);
            },
            positionTask: function(task){
                var order = task.model.get("order"),
                    index = (!_.isUndefined(this.space) && this.space <= order) ? order + 1 : order;
                    position = index * (this.taskHeight + this.spacing);
                //task.$el.animate({"top": position}); animation is buggy
                task.$el.css({"top": position + "px"});
            }
        });

    return TaskListView;
});