define([
    "backbone",
    "models/task",
    "text!templates/editTask.html"
], function(Backbone, TaskModel, editTaskTemplate){

    var template = Handlebars.compile( editTaskTemplate ),
        EditTaskView = Backbone.View.extend({
            NEW_TASK: "NEW_TASK",
            SAVE_TASK: "SAVE_TASK",
            DELETE_TASK: "DELETE_TASK",
            CANCEL_EDIT: "CANCEL_EDIT",
            id: "edit-task-wrapper",
            events: {
                "change #edit-task-priority": "toggleCritical",
                "click .status-icon": "changeStatus",
                "click #save-task": "saveTask",
                "click #toggle-archive": "toggleArchive",
                "click #delete-task": "deleteTask",
                "click .mask": "cancelEdit"
            },
            render: function(task){
                var isNew = task === undefined;
                this.task = isNew ? new TaskModel() : task;
                this.$el.html( template( {isNew: isNew, task: this.task.toJSON()} ) );
                if( isNew )
                    this.trigger(this.NEW_TASK, {task: this.task});
                return this;
            },
            // Cancels the creation of a new task.
            cancelEdit: function(){
                this.trigger(this.CANCEL_EDIT, {task: this.task});
                return this;
            },
            toggleCritical: function(e){
                var target = $(e.target);
                if(target.val() === "0") {
                    this.$el.find(".status-icon.critical").removeClass("is-hidden");
                } else {
                    this.$el.find(".status-icon.critical").removeClass("is-selected").addClass("is-hidden");
                }
                
                return this;
            },
            changeStatus: function(e){
                var target = $(e.target);
                if(target.hasClass("is-selected") && target.hasClass("none"))
                    return this;

                if(target.hasClass("is-exclusive")){
                    if(target.hasClass("is-selected"))
                        target.siblings(".none").addClass("is-selected");
                    else
                        target.siblings(".is-selected.is-exclusive").removeClass("is-selected");
                }
                target.toggleClass("is-selected");
                
                return this;
            },
            // The modified properties of the task are submitted to the model on save. This allows
            // for the user to effectively cancel the changes by closing the task editor.
            saveTask: function(){
                this.task.set( this.getProps() );
                this.task.save();
                this.trigger(this.SAVE_TASK, {task: this.task});
                return this;
            },
            toggleArchive: function(){
                var archivalButton = this.$("#toggle-archive");
                archivalButton.toggleClass("unarchive").toggleClass("archive");
                if(archivalButton.hasClass("unarchive"))
                    archivalButton.text("Unarchive");
                else
                    archivalButton.text("Archive");
                return this;
            },
            deleteTask: function(){
                this.trigger(this.DELETE_TASK, {task: this.task});
                return this;
            },
            // Retrieves the task properties from the markup and sets null values to ''.
            getProps: function(){
                var props = {
                        "title": this.$("#edit-task-title").val(),
                        "priority": this.$("#edit-task-priority").val(),
                        "notes": this.$("#edit-task-notes").val(),
                        "status": this.$(".is-exclusive.is-selected").attr("data-value"),
                        "critical": this.$(".status-icon.critical").hasClass("is-selected"),
                        "archived": this.$("#toggle-archive").hasClass("unarchive")
                    };

                _.each(props, function(v, k){
                    if(!v) props[k] = '';
                });

                return props;
            }
        });

    return EditTaskView;
});