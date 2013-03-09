//Helper functions related to dragging.
define(["jquery"], function ($) {
    "use strict";

    // Returns the jQuery wrapper for a quadrant
    // element at a given set of coordiantes.
    function getQuadrantAtPoint(x, y) {
        var boundary,
            quadrant = $();
        $(".quadrant").each(function () {
            boundary = getBoundary($(this));
            if (isInsideBoundary(boundary, x, y)) {
                quadrant = $(this);
                return false;
            }
        });
        return quadrant;
    }

    // Returns the boundary of a jQuery element.
    function getBoundary(jQEl) {
        var offset = jQEl.offset();
        return {
            left: offset.left,
            right: offset.left + jQEl.width(),
            top: offset.top,
            bottom: offset.top + jQEl.height()
        };
    }

    // Determines if two boundaries intersect.
    function boundariesIntersect(b1, b2) {
        var o = overlap(b1, b2);
        return o.x > 0 && o.y > 0;
    }

    // Returns the amount of overlap between two
    // boundaries. Negative values imply no overlap.
    function overlap(b1, b2) {
        return {
            x: (b1.left < b2.left) ? b1.right - b2.left : b2.right - b1.left,
            y: (b1.top < b2.top) ? b1.bottom - b2.top : b2.bottom - b1.top
        };
    }

    // Determines if a set of coordiantes are inside a boundary.
    function isInsideBoundary(b, x, y) {
        return b.left < x && x < b.right && b.top < y && y < b.bottom;
    }

    return {
        getQuadrantAtPoint: getQuadrantAtPoint,
        getBoundary: getBoundary,
        boundariesIntersect: boundariesIntersect
    };
});