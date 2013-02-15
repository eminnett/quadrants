define([
    "backbone",
    "text!templates/task.html",
    "jquery.hammer"
], function(Backbone, taskTemplate){

    var template = Handlebars.compile( taskTemplate ),
        TaskView = Backbone.View.extend({
            TAPPED: "TASK_TAPPED",
            SWIPE_RESET: "SWIPE_RESET",
            SWIPED_LEFT: "SWIPED_LEFT",
            SWIPED_RIGHT: "SWIPED_RIGHT",
            DRAGGED: "TASK_DRAGGED",
            DROPPED: "TASK_DROPPED",
            DELETED: "TASK_DELETED",
            className: "task",
            events: {
                "click .status-icon": "handleStatusChange",
                "click .action": "handleAction"
            },
            initialize: function(){
                this.swipe = { swiping: false, swiped: false };
                this.drag = { dragging: false };
                _.bindAll(this, "render", "handleTap", "resetPosCSS",
                    "handleStatusChange", "handleAction", "handleDragStart",
                    "initiateDrag", "handleDrag", "handleDragEnd", "handleRelease");
                this.model.on("change", this.render);
                this.render();
                this.$el.on("tap", this.handleTap);
                this.$el.on("dragstart", this.handleDragStart);
                this.$el.on("drag", this.handleDrag);
                this.$el.on("dragend", this.handleDragEnd);
                this.$el.on("release", this.handleRelease);
            },
            render: function(){
                this.$el.html( template( { id: this.model.id, task:this.model.toJSON() }) );
                this.topLayer = this.$(".top-layer");
                return this;
            },
            handleTap: function() {
                this.trigger(this.TAPPED, {task: this.model});
            },
            // Determines the thresholds required to swipe. The start position of the
            // mouse and the starting position of the topLayer are stored
            handleDragStart: function(e){
                this.swipe.threshold = {
                    right: this.$(".status-options").outerWidth() / 2,
                    left: this.$(".actions").outerWidth() / 2
                };
                this.swipe.startX = this.topLayer.position().left;
                this.drag.mouseStartX = e.touches[0].x - this.topLayer.offset().left;
                this.drag.mouseStartY = e.touches[0].y - this.topLayer.offset().top;
            },
            // Handles the drag event dispatch and determines if the task should be
            // dragging or swiping. If the task is dragging, the position is updated.
            handleDrag: function(e){
                if(!this.drag.dragging) {
                    if((Math.abs(e.angle) > 45 && Math.abs(e.angle) < 135) ||
                        e.distanceY + this.drag.mouseStartY  < 0 ||
                        e.distanceY + this.drag.mouseStartY  > this.topLayer.height()) {
                        this.initiateDrag();
                    } else {
                        this.handlePreSwipe(e);
                    }
                } else {
                    this.drag.x = this.drag.startX + e.distanceX;
                    this.drag.y = this.drag.startY + e.distanceY;

                    this.$el.css({
                        "left": this.drag.x + "px",
                        "top": this.drag.y + "px"
                    });
                }
            },
            // Handles the beginning of a drag interaction.
            initiateDrag: function(){
                var offsetPos = this.$el.offset();
                if(this.swipe.swiped)
                    this.resetSwipe();
                else
                    this.resetSwipe({silent: true});
                this.drag.dragging = true;
                this.drag.startX = offsetPos.left;
                this.drag.startY = offsetPos.top;
                this.$el.css({
                    "position": "absolute",
                    "width": this.$el.width() + "px",
                    "left": this.drag.startX + "px",
                    "top": this.drag.startY + "px",
                    "z-index": 1000
                });
                $("body").append(this.$el);
                this.trigger(this.DRAGGED, {task: this.model});
            },
            // Handles the completion of a drag interaction.
            handleDragEnd: function(e){
                if(!this.drag.dragging)
                    return;

                this.$el.removeAttr("style");
                this.trigger(this.DROPPED, {
                    task: this.model,
                    pos: { x: (this.drag.x + this.drag.mouseStartX), y: (this.drag.y + this.drag.mouseStartY) }
                });
            },
            // Handles the release event dispatch. This is called afer both drag
            // and swipe interactions. If the task was being swiped. The approprite
            // swipe method is determined and called.
            handleRelease: function(e){
                if(this.drag.dragging) {
                    this.drag = { dragging: false };
                } else {
                    var layerPos = this.topLayer.position().left;
                    if( layerPos > 0) {
                        if( layerPos > this.swipe.threshold.right)
                            this.swipeRight();
                        else
                            this.resetSwipe();
                    } else {
                        if( layerPos < -this.swipe.threshold.left)
                            this.swipeLeft();
                        else
                            this.resetSwipe();
                    }
                }
            },
            // Hanldes the dragging of the topLayer during a swipe interaction.
            handlePreSwipe: function(e){
                var newX, overSwipe, resistance,
                    swipeDistance = this.swipe.startX + e.distanceX;
                if(swipeDistance > 0) {
                    overSwipe = Math.max(0, swipeDistance - this.swipe.threshold.right * 2);
                } else {
                    overSwipe = Math.max(0, -swipeDistance - this.swipe.threshold.left * 2);
                }

                if(swipeDistance > 0)
                    resistance = resist(overSwipe, 0.5 * this.swipe.threshold.right);
                else
                    resistance = -resist(overSwipe, 0.5 * this.swipe.threshold.left);

                newX = swipeDistance - resistance;

                this.topLayer.css({"left": newX + "px"});

                function resist(force, threshold){
                    return force * ( 1 - 1 / (Math.abs(force) / threshold + 1));
                }
            },
            // Completes a swipe to the left.
            swipeLeft: function(){
                var actionsWidth = this.$(".actions").outerWidth();
                this.swipe.swiped = this.SWIPED_LEFT;
                this.topLayer.animate({"left": (-actionsWidth)+"px"});
                this.trigger(this.SWIPED_LEFT, {task: this.model});
            },
            // Completes a swipe to the right.
            swipeRight: function(){
                var statusesWidth = this.$(".status-options").outerWidth();
                this.swipe.swiped = this.SWIPED_RIGHT;
                this.topLayer.animate({"left": (statusesWidth)+"px"});
                this.trigger(this.SWIPED_RIGHT, {task: this.model});
            },
            // Resets the swipe (and shakes it all about. No not really ;))
            resetSwipe: function(options){
                this.swipe.swiped = false;
                this.topLayer.animate({"left": 0}, this.resetPosCSS);
                if( _.isUndefined(options) || !options.silent)
                    this.trigger(this.SWIPE_RESET, {task: this.model});
            },
            // Used as a callback for resetSwipe.
            afterResetSwipe: function(){},
            // Resets the topLayer position after a swipe is reset.
            resetPosCSS: function(){
                this.topLayer.css({"left": ''});
                this.afterResetSwipe();
                this.afterResetSwipe = function(){};
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
                    this.afterResetSwipe = function(){
                        this.model.set("critical", target.hasClass("is-selected"));
                        this.model.save();
                    };
                } else {
                    this.afterResetSwipe = function(){
                        this.model.set("status", target.attr("data-value"));
                        this.model.save();
                    };
                }
                this.resetSwipe();
                return this;
            },
            // Handles a change in archive state or deletion. This can
            // only happen when the task is swipped to the left.
            handleAction: function(e){
                var target = $(e.target);
                if(target.hasClass("delete")){
                    this.afterResetSwipe = function(){this.trigger(this.DELETED, {task: this.model});};
                } else {
                    target.toggleClass("unarchive").toggleClass("archive");
                    this.afterResetSwipe = function(){
                        this.model.set("archived", target.hasClass("unarchive"));
                        this.model.save();
                    };
                }
                this.resetSwipe();
            }
        });

    return TaskView;
});