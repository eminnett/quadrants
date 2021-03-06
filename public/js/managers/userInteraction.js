// The InteractionManager handles the tap, drag, and swipe events and
// encapsulates the logic for those events.
define([
    "jquery",
    "underscore",
    "helpers/interactionConverter"
], function ($, _, InteractionConverter) {
    "use strict";

    function InteractionManager() {
        // Functions
        var initialize, registerView, unregisterView, resetInteraction, resetExclusive,
            handleTap, handleDTap, handleLongPress, handleDragStart, handleDrag,
            initiateDrag, handleDragEnd, completeDrag, handlePreSwipe, determineSwipe,
            swipeLeft, swipeRight, resetSwipe, removeStates, attempt,
        // Properties
            ic, swipe, drag, isPreSwiping, exclusiveView,
            consts = {
                TAP: "im_tap",
                DOUBLE_TAP: "im_double_tap",
                LONG_PRESS: "im_long_press",
                SWIPE_RESET: "im_swipe_reset",
                SWIPE_LEFT: "im_swipe_left",
                SWIPE_RIGHT: "im_swipe_right",
                DRAG_START: "im_drag_start",
                DRAG: "im_drag",
                DROP: "im_drop"
            };

        initialize = function () {
            ic = new InteractionConverter();
            ic.initialize();

            swipe = { swiping: false, swiped: false };
            drag = { dragging: false };
        };

        registerView = function (view) {
            if (view.canTap) {
                view.$el.on(ic.TAP, {view: view}, handleTap);
                view.$el.on(ic.DOUBLE_TAP, {view: view}, handleDTap);
                view.$el.on(ic.LONG_PRESS, {view: view}, handleLongPress);
            }
            if (view.canDrag || view.canSwipe) {
                view.$el.on(ic.DRAG_START, {view: view}, handleDragStart);
                view.$el.on(ic.DRAG, {view: view}, handleDrag);
                view.$el.on(ic.DRAG_END, {view: view}, handleDragEnd);
            }
        };

        unregisterView = function (view) {
            if (view.canTap) {
                view.$el.off(ic.TAP, handleTap);
                view.$el.off(ic.DOUBLE_TAP, handleDTap);
                view.$el.off(ic.LONG_PRESS, handleLongPress);
            }
            if (view.canDrag || view.canSwipe) {
                view.$el.off(ic.DRAG_START, handleDragStart);
                view.$el.off(ic.DRAG, handleDrag);
                view.$el.off(ic.DRAG_END, handleDragEnd);
            }
        };

        resetInteraction = function (view, options) {
            if (view.canSwipe) {
                resetSwipe(view, options);
            }
        };

        resetExclusive = function (view) {
            if (view === exclusiveView) {
                return;
            }

            if (!_.isUndefined(exclusiveView)) {
                resetInteraction(exclusiveView);
            }

            exclusiveView = (view.exclusiveInteraction) ? view : undefined;
        };

        handleTap = function (e) {
            var view = e.data.view;
            resetExclusive(view);
            attempt(view, "onTap");
            view.trigger(consts.TAP, {view: view});
        };

        handleDTap = function (e) {
            var view = e.data.view;
            resetExclusive(view);
            attempt(view, "onDoubleTap");
            view.trigger(consts.DOUBLE_TAP, {view: view});
        };

        handleLongPress = function (e) {
            var view = e.data.view;
            resetExclusive(view);
            attempt(view, "onLongPress");
            view.trigger(consts.LONG_PRESS, {view: view});
        };

        handleDragStart = function (e) {
            var view = e.data.view;
            if (view.canSwipe) {
                view.$el.addClass("is-swiping");
                swipe.threshold = view.getSwipeThreshold();
                swipe.elStart = { x: view.getSwipeEl().position().left };
            }
            if (view.canDrag) {
                drag.localMouseStart = {
                    x: e.interaction.start.x - view.$el.offset().left,
                    y: e.interaction.start.y - view.$el.offset().top
                };
            }
        };

        handleDrag = function (e) {
            var view = e.data.view,
                relativeMouseY = e.interaction.distance.y + drag.localMouseStart.y;
            if (!drag.dragging) {
                if (view.canSwipe) {
                    if ((Math.abs(e.interaction.angle) > 45 &&
                            Math.abs(e.interaction.angle) < 135 && !isPreSwiping) ||
                            relativeMouseY  < 0 || relativeMouseY  > view.getSwipeEl().height()) {
                        isPreSwiping = false;
                        if (view.canDrag) {
                            initiateDrag(view);
                        } else {
                            determineSwipe(view);
                        }
                    } else {
                        isPreSwiping = true;
                        handlePreSwipe(e, view.getSwipeEl());
                    }
                } else if (view.canDrag) {
                    initiateDrag(view);
                }
            } else {
                drag.x = drag.start.x + e.interaction.distance.x;
                drag.y = drag.start.y + e.interaction.distance.y;

                view.$el.css({
                    "left": drag.x + "px",
                    "top": drag.y + "px"
                });
                view.trigger(consts.DRAG, {
                    view: view,
                    pos: {
                        x: (drag.x + drag.localMouseStart.x),
                        y: (drag.y + drag.localMouseStart.y)
                    }
                });
            }
        };

        // Handles the beginning of a drag interaction.
        initiateDrag = function (view) {
            var offsetPos = view.$el.offset();
            resetExclusive(view);
            if (swipe.swiped) {
                resetSwipe(view);
            } else {
                resetSwipe(view, {silent: true});
            }
            drag.dragging = true;
            drag.start = {
                x: offsetPos.left,
                y: offsetPos.top
            };
            view.$el.removeClass("is-swiping").addClass("is-dragging");
            view.$el.css({
                "position": "absolute",
                "width": view.$el.width() + "px",
                "left": drag.start.x + "px",
                "top": drag.start.y + "px",
                "z-index": 1000
            });
            $("body").append(view.$el);
            view.trigger(consts.DRAG_START, {view: view});
        };

        // Handles the drag_end event dispatch.
        handleDragEnd = function (e) {
            var view = e.data.view;
            if (drag.dragging) {
                completeDrag(view);
            } else {
                isPreSwiping = false;
                determineSwipe(view);
            }
        };
        // Handles the completion of a drag interaction.
        completeDrag = function (view) {
            removeStates(view);
            view.$el.removeAttr("style");
            view.trigger(consts.DROP, {
                view: view,
                pos: {
                    x: (drag.x + drag.localMouseStart.x),
                    y: (drag.y + drag.localMouseStart.y)
                }
            });
            drag = { dragging: false };
        };
        // Handles the dragging of the swipe element during a swipe interaction.
        handlePreSwipe = function (e, swipeEl) {
            function resist(force, threshold) {
                return force * (1 - 1 / (Math.abs(force) / threshold + 1));
            }

            var newX, overSwipe, resistance,
                swipeDistance = swipe.elStart.x + e.interaction.distance.x;
            if (swipeDistance > 0) {
                overSwipe = Math.max(0, swipeDistance - swipe.threshold.right * 2);
            } else {
                overSwipe = Math.max(0, -swipeDistance - swipe.threshold.left * 2);
            }

            if (swipeDistance > 0) {
                resistance = resist(overSwipe, 0.5 * swipe.threshold.right);
            } else {
                resistance = -resist(overSwipe, 0.5 * swipe.threshold.left);
            }

            newX = swipeDistance - resistance;

            swipeEl.css({"left": newX + "px"});
        };
        determineSwipe = function (view) {
            var layerPos = view.getSwipeEl().position().left;
            resetExclusive(view);
            if (layerPos > 0) {
                if (layerPos > swipe.threshold.right) {
                    swipeRight(view);
                } else {
                    resetSwipe(view);
                }
            } else {
                if (layerPos < -swipe.threshold.left) {
                    swipeLeft(view);
                } else {
                    resetSwipe(view);
                }
            }
        };
        // Completes a swipe to the left.
        swipeLeft = function (view) {
            swipe.swiped = true;
            view.getSwipeEl().animate(
                {"left": (-view.getSwipeLeftDistance()) + "px"},
                function () { removeStates(view); }
            );
            attempt(view, "onSwipeLeft");
            view.trigger(consts.SWIPE_LEFT, {view: view});
        };
        // Completes a swipe to the right.
        swipeRight = function (view) {
            swipe.swiped = true;
            view.getSwipeEl().animate(
                {"left": view.getSwipeRightDistance() + "px"},
                function () { removeStates(view); }
            );
            attempt(view, "onSwipeRight");
            view.trigger(consts.SWIPE_RIGHT, {view: view});
        };
        // Resets the swipe (and shakes it all about. No not really ;))
        resetSwipe = function (view, options) {
            view.getSwipeEl().animate({"left": 0}, function () {
                removeStates(view);
                swipe.swiped = false;
                view.getSwipeEl().css({"left": ''});
            });
            attempt(view, "onResetSwipe");
            if (_.isUndefined(options) || !options.silent) {
                view.trigger(consts.SWIPE_RESET, {view: view});
            }
        };

        removeStates = function (view) {
            view.$el.removeClass("is-dragging").removeClass("is-swiping");
        };

        attempt = function () {
            var view = Array.prototype.shift.call(arguments),
                method = Array.prototype.shift.call(arguments);
            if (_.isFunction(view[method])) {
                view[method](arguments);
            }
        };

        return _.extend(consts, {
            initialize: initialize,
            registerView: registerView,
            unregisterView: unregisterView,
            resetInteraction: resetInteraction
        });
    }

    return InteractionManager;
});