define([
    "backbone",
    "libs/text!templates/taskList.html"
], function(Backbone, taskListTemplate){

    var template = Handlebars.compile( taskListTemplate ),
        TaskListView = Backbone.View.extend({
            UP: "shift_task_order_up",
            DOWN: "shift_task_order_down",
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
            insert: function(task, index, options){
                var order = (_.isUndefined(index)) ? _.keys(this.tasks).length : index;
                
                // shiftFrom needs to be supressable for the order to be persistent.
                // causes infinite loop!?
                // if(_.isUndefined(options) || options.shiftTasks ) {
                    if(!_.isUndefined(index))
                        this.shiftFrom(order, this.UP);
                // }
                
                task.model.set("order", order);
                this.taskList.append(task.$el);
                this.tasks[task.cid] = task;
                
                if(_.isUndefined(options) || options.arrangeTasks)
                    this.arrangeTasks();
            },
            remove: function(task, withSpace){
                var order = task.model.get("order");
                
                if(_.isUndefined(this.tasks[task.cid]))
                    return;

                delete this.tasks[task.cid];
                this.shiftFrom(order, this.DOWN);
                
                if(withSpace)
                    this.makeSpaceAt(order);
                else
                    this.arrangeTasks();
            },
            // Recursively ensures the order of tasks is
            // sequential and without gaps.
            fixOrder: function(indexList){
                var shiftDirection,
                    indices = indexList || [],
                    i = 0;

                if( indices.length === 0 ){
                    _.each(this.tasks, function(task){
                        indices.push(task.model.get("order"));
                    });
                }
                
                indices.sort();
    
                if( _.range(indices.length).toString() === indices.toString()) {
                    this.arrangeTasks();
                } else {
                    for(i; i < indices.length; i++){
                        if(indices[i] !== i){
                            shiftDirection = (i < indices[i]) ? this.DOWN : this.UP;
                            this.fixOrder(this.shiftFrom(i,shiftDirection));
                            return;
                        }
                    }
                }
            },
            shiftFrom: function(index, direction){
                var shiftUp = direction === this.UP,
                    indexList = [];
                _.each(this.tasks, function(task){
                    var order = task.model.get("order");
                    if( order > index || (order === index && shiftUp) ){
                        order = (shiftUp) ? order + 1 : order - 1;
                        task.model.set("order", order);
                    }
                    indexList.push(order);
                });
                return indexList;
            },
            makeSpaceAt: function(index){
                this.space = index;
                this.arrangeTasks();
            },
            removeSpace: function(){
                if(_.isUndefined(this.space))
                    return;
                this.space = undefined;
                this.arrangeTasks();
            },
            arrangeTasks: function(){
                _.each(this.tasks, this.positionTask);
            },
            positionTask: function(task){
                var order = task.model.get("order"),
                    index = (_.isUndefined(this.space) || this.space > order) ? order : order + 1;
                    position = index * (this.taskHeight + this.spacing);
                //task.$el.animate({"top": position}); //animation is buggy
                task.$el.css({"top": position + "px"});
            },
            // ToDo: Refactor this to use a single server request.
            saveTasks: function(){
                _.each(this.tasks, function(task){
                    task.model.save();
                });
            }
        });

    return TaskListView;
});