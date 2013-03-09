define(["backbone"], function (Backbone) {
    "use strict";
    var AppRouter = Backbone.Router.extend({
        routes: {
            'tasks/toggle-filter/:type': 'filterTasks',
            'tasks/sort/:type': 'sortTasks',
            'task/new': 'newTask',
            'task/edit/:id': 'editTask',
            '*route': 'unhandledRoute'
        }
    });

    return AppRouter;
});
