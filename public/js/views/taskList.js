define([
    "backbone",
    "mustache",
    "libs/text!templates/taskList.html"
], function(Backbone, Mustache, taskListTemplate){

    var template = Mustache.compile( taskListTemplate ),
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
                this.hiddenOrders = [];
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
                
                if(!_.isUndefined(index) &&
                    (_.isUndefined(options.shiftTasks) || options.shiftTasks)) {
                        this.shiftFrom(order, this.UP);
                }
                
                task.model.set("order", order);
                this.taskList.append(task.$el);
                this.tasks[task.cid] = task;
                
                if(_.isUndefined(options.arrangeTasks) || options.arrangeTasks)
                    this.arrangeTasks();

                return this;
            },
            remove: function(task, withSpace){
                var order = task.model.get("order");
                
                if(_.isUndefined(this.tasks[task.cid]))
                    return this;

                delete this.tasks[task.cid];
                this.shiftFrom(order, this.DOWN);
                
                if(withSpace)
                    this.makeSpaceAt(order);
                else
                    this.arrangeTasks();

                return this;
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
                    return this;
                } else {
                    for(i; i < indices.length; i++){
                        if(indices[i] !== i){
                            shiftDirection = (i < indices[i]) ? this.DOWN : this.UP;
                            this.fixOrder(this.shiftFrom(i,shiftDirection));
                            return this;
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
                return this;
            },
            removeSpace: function(){
                if(_.isUndefined(this.space))
                    return this;
                this.space = undefined;
                this.arrangeTasks();

                return this;
            },
            arrangeTasks: function(){
                _.each(this.tasks, this.positionTask);
                return this;
            },
            positionTask: function(task){
                var order = task.model.get("order"),
                    numHiddenBellow = _.sortedIndex(this.hiddenOrders, order),
                    visIdx = order - numHiddenBellow,
                    index = (_.isUndefined(this.space) || this.space > visIdx) ? visIdx : visIdx + 1,
                    position = index * (this.taskHeight + this.spacing);
                //task.$el.animate({"top": position}); //animation is buggy
                task.$el.css({"top": position + "px"});
            },
            filterTasks: function(filters){
                var hidden = this.hiddenOrders = [];
                
                if( filters.length === 0 ){
                    this.taskList.find(".task.is-hidden").removeClass("is-hidden");
                } else {
                    _.each(this.tasks, function(task){
                        var taskArchived = task.model.get("archived"),
                            noArchiveFilter = _.intersection(filters, ["archived", "unarchived"]).length === 0,
                            isFiltered = noArchiveFilter ||
                                (_.contains(filters, "archived") && taskArchived) ||
                                (_.contains(filters, "unarchived") && !taskArchived);

                        if((filters.length > 1 || noArchiveFilter) && isFiltered){
                            isFiltered = _.contains(filters, task.model.get("status")) ||
                                (_.contains(filters, "critical") && task.model.get("critical"));
                        }

                        if(isFiltered){
                            task.$el.removeClass("is-hidden");
                        } else {
                            task.$el.addClass("is-hidden");
                            hidden.push(task.model.get("order"));
                        }
                    });
                    this.hiddenOrders = hidden.sort();
                }

                this.arrangeTasks();
                return this;
            },
            sortTasks: function(type){

            },
            // ToDo: Refactor this to use a single server request.
            saveTasks: function(){
                _.each(this.tasks, function(task){
                    task.model.save();
                });
                return this;
            }
        });

    return TaskListView;
});