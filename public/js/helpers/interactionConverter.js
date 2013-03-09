// The AInteractionConverter handles mouse and touch events and converts the
// interaction into more meaningful events such as drag and swipe.
//
// ToDo: Implement double tap.
// ToDo: Implement long press.
define(["jquery", "underscore"], function ($, _) {
    "use strict";

    var InteractionConverter;

    InteractionConverter = function () {
        var props, dragStarted, timer, startTime,
            prevIntervalTime, mouse, step, interaction,
            consts = {
                TAP: "ic_tap",
                DOUBLE_TAP: "ic_double_tap",
                LONG_PRESS: "ic_long_press",
                DRAG_START: "ic_drag_start",
                DRAG:  "ic_drag",
                DRAG_END: "ic_drag_end"
            };

        function initialize() {
            props = {
                frameRate: 50,          // frames/second
                maxTapDuration: 50,     // miliseconds
                maxDTapInterval: 100    // miliseconds
            };

            reset();
            regListeners();
        }

        // Reset the interaction data to null states.
        function reset() {
            dragStarted = false;
            timer = null;
            startTime = null;
            prevIntervalTime = null;
            mouse = {};
            step = {};
            interaction = {
                duration: 0,
                angle: null,
                direction: null,
                start: {},
                pos: {},
                distance: {},
                target: null
            };
        }

        function regListeners() {
            $(document).on("mousedown", onMouseDown);
            $(document).on("mouseup", onMouseUp);
        }

        function onMouseDown(e) {
            $(document).on("mousemove", onMouseMove);
            start(e); //double tap will have to be taken into account.
        }

        function onMouseUp() {
            $(document).off("mousemove", onMouseMove);
            clearTimeout(timer);

            if (step === interaction.start && !dragStarted) {
                trigger(consts.TAP);
            } else {
                trigger(consts.DRAG_END);
            }

            reset();
        }

        // Record the mouse position.
        function onMouseMove(e) {
            mouse.x = e.pageX;
            mouse.y = e.pageY;
        }

        // Begin the interaction and initialize the interaction data.
        function start(e) {
            interaction.target = e.target;
            interaction.start.x = e.pageX;
            interaction.start.y = e.pageY;
            step = interaction.start;

            startTime = new Date().getTime();
            prevIntervalTime = startTime;
            timer = setTimeout(onInterval, 1000 / props.frameRate);
        }

        // Handle the frame interval.
        function onInterval() {
            var now, newDelay;
            update();
            if (!_.isUndefined(interaction.angle)) {
                trigger(consts.DRAG);
            }

            now = new Date().getTime();
            newDelay = Math.max(30, 1000 / props.frameRate - (now - prevIntervalTime));
            timer = setTimeout(onInterval, newDelay);
        }

        // Update interaction data.
        function update() {
            var angle,
                deltaY = (mouse.y && step.y) ? mouse.y - step.y : 0,
                deltaX = (mouse.x && step.x) ? mouse.x - step.x : 0;
            interaction.duration = new Date().getTime() - startTime;
            if (_.any([deltaY, deltaX])) {
                angle = interaction.angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
                if (angle > -135 && angle < -45) {
                    interaction.direction = "up";
                } else if (angle > -45 && angle < 45) {
                    interaction.direction = "right";
                } else if (angle > 45 && angle < 135) {
                    interaction.direction = "down";
                } else {
                    interaction.direction = "left";
                }
                if (step === interaction.start && !dragStarted) {
                    dragStarted = true;
                    trigger(consts.DRAG_START);
                }
                step = _.clone(mouse);
            } else {
                interaction.angle = undefined;
                interaction.direction = undefined;
            }

            interaction.pos = mouse;
            interaction.distance = {
                x: mouse.x - interaction.start.x,
                y: mouse.y - interaction.start.y
            };

        }

        // Simple trigger event helper.
        function trigger(type) {
            $(interaction.target).trigger({
                type: type,
                interaction: interaction
            });
        }

        return _.extend(consts, {
            initialize: initialize
        });
    };

    return InteractionConverter;
});