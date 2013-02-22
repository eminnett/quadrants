define([
    "backbone",
    "libs/text!templates/task.html"
], function(Backbone, taskTemplate){

    var template = Handlebars.compile( taskTemplate ),
        TaskView = Backbone.View.extend({
            DELETE: "task_delete",
            className: "task",
            events: {
                "click .status-icon": "handleStatusChange",
                "click .action": "handleAction"
            },
            initialize: function(){
                // These two properties are useed by the InteractionManger.
                this.exclusiveInteraction = true;
                this.canTap = true;
                this.canDrag = true;
                this.canSwipe = true;

                this.swipe = { swiping: false, swiped: false };
                this.drag = { dragging: false };
                _.bindAll(this, "render", "handleStatusChange", "handleAction");
                this.model.on("change", this.render);
                this.render();
                return this;
            },
            render: function(){
                this.$el.html( template( { id: this.model.id, task:this.model.toJSON() }) );
                return this;
            },
            // Returns the swiping element. Used by the InteractionManager.
            getSwipeEl: function() {
                return this.$(".top-layer");
            },
            // Returns the swiping thresholds. Used by the InteractionManager.
            getSwipeThreshold: function() {
                return {
                    left: this.getSwipeLeftDistance() / 2,
                    right: this.getSwipeRightDistance() / 2
                };
            },
            // Returns the swipe left distance. Used by the InteractionManager.
            getSwipeLeftDistance: function() {
                return this.$(".actions").outerWidth();
            },
            // Returns the swipe right distance. Used by the InteractionManager.
            getSwipeRightDistance: function() {
                return this.$(".status-options").outerWidth();
            },
            // Handles a status change. This can only happen when
            // the task is swipped to the right.
            handleStatusChange: function(e){
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
                
                if( target.hasClass("critical")){
                    this.onResetSwipe = function(){
                        this.onResetSwipe = null;
                        this.model.set("critical", target.hasClass("is-selected"));
                        this.model.save();
                    };
                } else {
                    this.onResetSwipe = function(){
                        this.onResetSwipe = null;
                        this.model.set("status", target.attr("data-value"));
                        this.model.save();
                    };
                }
                //this.resetSwipe(); // How will this work?
                return this;
            },
            // Handles a change in archive state or deletion. This can
            // only happen when the task is swipped to the left.
            handleAction: function(e){
                var target = $(e.target);
                if(target.hasClass("delete")){
                    this.onResetSwipe = function(){
                        this.onResetSwipe = null;
                        this.trigger(this.DELETE, {model: this.model});
                    };
                } else {
                    target.toggleClass("unarchive").toggleClass("archive");
                    this.onResetSwipe = function(){
                        this.onResetSwipe = null;
                        this.model.set("archived", target.hasClass("unarchive"));
                        this.model.save();
                    };
                }
                //this.resetSwipe(); // How will this work?
            }
        });

    return TaskView;
});