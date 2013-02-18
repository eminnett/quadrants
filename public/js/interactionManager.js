define(["jquery", "underscore", "helpers/interactionConverter"], function($, _, InteractionConverter){

    var ic, InteractionManager;

    InteractionManager = function(){
        var views = {};

        this.initialize = function(){
            ic = new InteractionConverter();
            ic.initialize();
            _.bindAll(this, "handleTap", "handleDragStart", "handleDrag", "handleDragEnd");
            this.TAP = "im_tapped";
            this.SWIPE_RESET = "im_swipe_reset";
            this.SWIPE_LEFT = "im_swipe_left";
            this.SWIPE_RIGHT = "im_swipe_right";
            this.DRAG = "im_drag";
            this.DROP = "im_drop";

            this.swipe = { swiping: false, swiped: false };
            this.drag = { dragging: false };
        };

        this.addView = function(view) {
            views[view.el] = view;
            if(view.canTap){
                view.$el.on(ic.TAP, this.handleTap);
                view.$el.on(ic.DOUBLE_TAP, this.handleDTap);
                view.$el.on(ic.LONG_PRESS, this.handleLongPress);
            }
            if(view.canDrag || view.canSwipe){
                view.$el.on(ic.DRAG_START, this.handleDragStart);
                view.$el.on(ic.DRAG, this.handleDrag);
                view.$el.on(ic.DRAG_END, this.handleDragEnd);
            }
        };

        this.removeView = function(view) {
            if(view.canTap){
                view.$el.off(ic.TAP, this.handleTap);
                view.$el.off(ic.DOUBLE_TAP, this.handleDTap);
                view.$el.off(ic.LONG_PRESS, this.handleLongPress);
            }
            if(view.canDrag || view.canSwipe){
                view.$el.off(ic.DRAG_START, this.handleDragStart);
                view.$el.off(ic.DRAG, this.handleDrag);
                view.$el.off(ic.DRAG_END, this.handleDragEnd);
            }
            delete views[view.el];
        };

        this.handleTap = function(e) {
            var view = views[e.currentTarget];
        };

        this.handleDTap = function(e) {
            var view = views[e.currentTarget];
        };

        this.handleLongPress = function(e) {
            var view = views[e.currentTarget];
        };

        this.handleDragStart = function(e) {
            var view = views[e.currentTarget];
            if(view.canSwipe) {
                this.swipe.threshold = view.getSwipeThreshold();
                this.swipe.elStart = { x: view.getSwipeEl().position().left };
            }
            if(view.canDrag) {
                this.drag.localMouseStart = {
                    x: e.interaction.start.x - view.$el.offset().left,
                    y: e.interaction.start.y - view.$el.offset().top
                };
            }
        };

        this.handleDrag = function(e) {
            var view = views[e.currentTarget];
            if(!this.drag.dragging) {
                if(view.canSwipe) {
                    if((Math.abs(e.interaction.angle) > 45 && Math.abs(e.interaction.angle) < 135 && this.isPreSwiping) ||
                        e.interaction.distance.y + this.drag.localMouseStart.y  < 0 ||
                        e.interaction.distance.y + this.drag.localMouseStart.y  > view.getSwipeEl().height()) {
                        this.isPreSwiping = false;
                        if(view.canDrag) {
                            this.initiateDrag(view);  
                        } else {
                            //handle the end of the swipe
                        }
                    } else {
                        this.isPreSwiping = true;
                        this.handlePreSwipe(e, view.getSwipeEl());
                    }
                } else if(view.canDrag) {
                    this.initiateDrag();
                }
            } else {
                this.drag.x = this.drag.start.x + e.interaction.distance.x;
                this.drag.y = this.drag.start.y + e.interaction.distance.y;

                view.$el.css({
                    "left": this.drag.x + "px",
                    "top": this.drag.y + "px"
                });
            }
        };

        // Handles the beginning of a drag interaction.
        this.initiateDrag = function(view){
            var offsetPos = view.$el.offset();
            if(this.swipe.swiped)
                this.resetSwipe();
            else
                this.resetSwipe({silent: true});
            this.drag.dragging = true;
            this.drag.start = {
                x: offsetPos.left,
                y: offsetPos.top
            };
            view.$el.css({
                "position": "absolute",
                "width": this.$el.width() + "px",
                "left": this.drag.start.x + "px",
                "top": this.drag.start.y + "px",
                "z-index": 1000
            });
            $("body").append(view.$el);
            view.trigger(this.DRAGGED, {view: view});
        };

        // Handles the drag_end event dispatch.
        this.handleDragEnd = function(e) {
            var view = views[e.currentTarget];
            if( this.drag.dragging )
                this.completeDrag(view);
            else {
                this.isPreSwiping = false;
                //this.determineSwipe(view);
            }
        };
        // Handles the completion of a drag interaction.
        this.completeDrag = function(view){
            view.$el.removeAttr("style");
            view.trigger(this.DROPPED, {
                view: view,
                pos: {
                    x: (this.drag.x + this.drag.localMouseStart.x),
                    y: (this.drag.y + this.drag.localMouseStart.y)
                }
            });
            this.drag = { dragging: false };
        };
        // Handles the dragging of the swipe element during a swipe interaction.
        this.handlePreSwipe = function(e, swipeEl){
            var newX, overSwipe, resistance,
                swipeDistance = this.swipe.elStart.x + e.interaction.distance.x;
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

            swipeEl.css({"left": newX + "px"});

            function resist(force, threshold){
                return force * ( 1 - 1 / (Math.abs(force) / threshold + 1));
            }
        };
    };

    return InteractionManager;
});