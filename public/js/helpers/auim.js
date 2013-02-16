// The Abstract User Interaction Manager (AUIM) handles mouse and touch events 
// and converts the interaction into more meaningful events such as drag and swipe.
//
// ToDo: Implement double tap.
// ToDo: Implement long press.
define(["jquery", "underscore"], function($, _){

    var AUIM, AbstractUserInteractionManager;

    AUIM = AbstractUserInteractionManager = function(){
        this.props = {
                frameRate: 50,          // frames/second
                maxTapDuration: 50,     // miliseconds
                maxDTapInterval: 100    // miliseconds
            };

        this.initialize = function(){
            _.bindAll(this, "onMouseDown", "onMouseMove", "onMouseUp", "onInterval", "update");
            this.TAP = "auim_tap";
            this.DOUBLE_TAP = "auim_double_tap";
            this.LONG_PRESS = "auim_long_press";
            this.DRAG_START = "auim_drag_start";
            this.DRAG =  "auim_drag";
            this.DRAG_END = "auim_drag_end";
            this.reset();
            this.regListeners();
        };
        
        // Reset the interaction data to null states.
        this.reset = function(){
            this.dragStarted = false;
            this.timer = null;
            this.startTime = null;
            this.prevIntervalTime = null;
            this.mouse = {};
            this.step = {};
            this.interaction = {
                duration: 0,
                angle: null,
                direction: null,
                start: {},
                pos: {},
                distance:{},
                target: null
            };
        };
        
        this.regListeners = function(){
            $(document).on("mousedown", this.onMouseDown);
            $(document).on("mouseup", this.onMouseUp);
        };
        
        this.onMouseDown = function(e){
            $(document).on("mousemove", this.onMouseMove);
            this.start(e); //double tap will have to be taken into account.
        };
        
        this.onMouseUp = function(e){
            $(document).off("mousemove", this.onMouseMove);
            clearTimeout(this.timer);
            
            if(this.step === this.interaction.start && !this.dragStarted)
                this.trigger(this.TAP);
            else
                this.trigger(this.DRAG_END);

            this.reset();
        };
        
        // Record the mouse position.
        this.onMouseMove = function(e){
            this.mouse.x = e.pageX;
            this.mouse.y = e.pageY;
        };
        
        // Begin the interaction and initialize the interaction data.
        this.start = function(e){
            this.interaction.target = e.target;
            this.interaction.start.x = e.pageX;
            this.interaction.start.y = e.pageY;
            this.step = this.interaction.start;

            this.startTime = new Date().getTime();
            this.prevIntervalTime = this.startTime;
            this.timer = setTimeout(this.onInterval, 1000 / this.props.frameRate);
        };

        // Handle the frame interval.
        this.onInterval = function(){
            var now, newDelay;
            this.update();
            if(!_.isUndefined(this.interaction.angle)){
                 this.trigger(this.DRAG);
            }

            now = new Date().getTime(),
            newDelay = Math.max(10, 1000 / this.props.frameRate - (now - this.prevIntervalTime));
            this.timer = setTimeout(this.onInterval, newDelay);
        };

        // Update interaction data.
        this.update = function(){
            var deltaY = (this.mouse.y && this.step.y) ? this.mouse.y - this.step.y : 0,
                deltaX = (this.mouse.x && this.step.x) ? this.mouse.x - this.step.x : 0;
            this.interaction.duration = new Date().getTime() - this.startTime;
            if( _.any([deltaY, deltaX])) {
                var angle = this.interaction.angle = Math.atan2( deltaY, deltaX ) * 180 / Math.PI;
                if(angle > -135 && angle < -45 )
                    this.interaction.direction = "up";
                else if(angle > -45 && angle < 45)
                    this.interaction.direction = "right";
                else if(angle > 45 && angle < 135)
                    this.interaction.direction = "down";
                else
                    this.interaction.direction = "left";
                if(this.step === this.interaction.start && !this.dragStarted){
                    this.dragStarted = true;
                    this.trigger(this.DRAG_START);
                }
                this.step = _.clone(this.mouse);
            } else {
                this.interaction.angle = undefined;
                this.interaction.direction = undefined;
            }
            
            
            this.interaction.pos = this.mouse;
            this.interaction.distance = {
                x: this.mouse.x - this.interaction.start.x,
                y: this.mouse.y - this.interaction.start.y
            };
            
        };

        // Simple trigger event helper.
        this.trigger = function(type) {
            $(this.interaction.target).trigger({
                type: type,
                interaction: this.interaction
            }); 
        };
    };

    return AUIM;
});