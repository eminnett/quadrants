define([], function(){
    var publicProps = {
            getQuadrantAtPoint: getQuadrantAtPoint,
            getTaskAtPoint: getTaskAtPoint,
            getBoundary: getBoundary
        };

    function getQuadrantAtPoint(x, y) {
        var offset, boundary,
            quadrant = $();
        $(".quadrant").each(function(){
            boundary = getBoundary($(this));
            if( isInsideBoundaries(boundary, x, y) ) {
                quadrant = $(this);
                return false; //break
            }
        });
        return quadrant;
    }

    function getTaskAtPoint(quadrant, x, y) {
        var offset, boundary,
            task = $();
        quadrant.find(".task").each(function(){
            boundary = getBoundary($(this));
            if( isInsideBoundaries(boundary, x, y) ) {
                task = $(this);
                return false; //break
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

    function isInsideBoundaries(boundary, x, y) {
        return boundary.left < x && x < boundary.right &&
                boundary.top < y && y < boundary.bottom;
    }

    return publicProps;
});