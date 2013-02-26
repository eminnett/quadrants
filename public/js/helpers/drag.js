define([], function(){
    var publicProps = {
            getQuadrantAtPoint: getQuadrantAtPoint,
            getTaskAtPoint: getTaskAtPoint,
            getBoundary: getBoundary,
            boundariesIntersect: boundariesIntersect
        };

    function getQuadrantAtPoint(x, y) {
        var offset, boundary,
            quadrant = $();
        $(".quadrant").each(function(){
            boundary = getBoundary($(this));
            if( isInsideBoundary(boundary, x, y) ) {
                quadrant = $(this);
                return false;
            }
        });
        return quadrant;
    }

    function getTaskAtPoint(quadrant, x, y) {
        var offset, boundary,
            task = $();
        quadrant.find(".task").each(function(){
            boundary = getBoundary($(this));
            if( isInsideBoundary(boundary, x, y) ) {
                task = $(this);
                return false;
            }
        });
        return task;
    }

    function getBoundary(element) {
        var offset = element.offset();
        return {
            left: offset.left,
            right: offset.left + element.width(),
            top: offset.top,
            bottom: offset.top + element.height()
        };
    }

    function boundariesIntersect(b1, b2) {
        var o = overlap(b1, b2);
        return o.x > 0 && o.y > 0;
    }

    function overlap(b1, b2) {
        return {
            x: (b1.left < b2.left) ? b1.right - b2.left : b2.right - b1.left,
            y: (b1.top < b2.top) ? b1.bottom - b2.top : b2.bottom - b1.top
        };
    }

    function isInsideBoundary(b, x, y) {
        return b.left < x && x < b.right && b.top < y && y < b.bottom;
    }

    return publicProps;
});