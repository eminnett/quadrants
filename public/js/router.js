define(["backbone"], function(Backbone) {
    var AppRouter = Backbone.Router.extend({
        routes: {
            'tasks/toggle-filter/:type': 'filterTasks',
            'task/new': 'newTask',
            'task/edit/:id': 'editTask',
            '*route': 'unhandledRoute'
        }
    });

    return AppRouter;
});
