// The User Interaction Manager (UIM) handles mouse and touch events 
// and converts the interaction into more meaningful events such as 
// drag and swipe.
define(["jquery", "underscore"], function($, _){

    var UIM, UserInteractionManager;

    UIM = UserInteractionManager = function(){
        this.props = {
                frameRate: 50,          // frames/second
                maxTapDuration: 50,     // miliseconds
                maxDTapInterval: 100    // miliseconds
            };

        this.initialize = function(){
            _.bindAll(this, "onMouseDown", "onMouseMove", "onMouseUp", "onInterval", "update");
            this.TAP = "uim_tap";
            this.DOUBLE_TAP = "uim_double_tap";
            this.LONG_PRESS = "uim_long_press";
            this.DRAG_START = "uim_drag_start";
            this.DRAG =  "uim_drag";
            this.DRAG_END = "uim_drag_end";
            this.reset();
            this.regListeners();
        };
            
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
                this.dipatch(this.TAP);
            else
                this.dipatch(this.DRAG_END);

            this.reset();
        };
        
        this.onMouseMove = function(e){
            this.mouse.x = e.pageX;
            this.mouse.y = e.pageY;
        };
        
        this.start = function(e){
            this.interaction.target = e.target;
            this.interaction.start.x = e.pageX;
            this.interaction.start.y = e.pageY;
            this.step = this.interaction.start;

            this.startTime = new Date().getTime();
            this.prevIntervalTime = this.startTime;
            this.timer = setTimeout(this.onInterval, 1000 / this.props.frameRate);
        };

        this.onInterval = function(){
            var now, newDelay;
            this.update();
            if(!_.isUndefined(this.interaction.angle)){
                 this.dipatch(this.DRAG);
            }

            now = new Date().getTime(),
            newDelay = Math.max(10, 1000 / this.props.frameRate - (now - this.prevIntervalTime));
            this.timer = setTimeout(this.onInterval, newDelay);
        };

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
                    this.dipatch(this.DRAG_START);
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

        this.dipatch = function(type) {
            $(this.interaction.target).trigger({
                type: type,
                interaction: this.interaction
            }); 
        }
    };

    return UIM;
});