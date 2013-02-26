// The core Quadrants application object.
//
// ToDo: Fix sorting while dragging bug.
// ToDo: Animate task position changes (buggy on first attempt);
// ToDo: Add functionality to sort by status, by date and alphabetically.
// ToDo: Cleanup and comment code.
// ToDo: Refactor to use logicless templates.
// ToDo: Be able to handle page refresh from any URL.
// ToDo: Create a global event dispatcher in order to clean up event dispatching across the app. (Is this needed?)
// ToDo: Add date support.
// ToDo: Create (or at least begin creating) a responsive layout.
// ToDo: Develop the ability to resize quadrants (this will be best combined with a responsive layout).
// ToDo: Test.
define([
    "jquery",
    "underscore",
    "backbone",
    "router",
    "managers/userInteraction",
    "collections/tasks",
    "views/editTask",
    "views/taskList",
    "views/task",
    "helpers/drag"
], function($, _, Backbone, Router, InteractionManager, TasksCollection, EditTaskView, TaskListView, TaskView, dragHelper){
    var router, interactionManager, taskListManager, tasksCollection,
        editTaskView, taskLists, taskViews, swipedTask, $cache;
    
    function initialize() {
        router = new Router();
        interactionManager = new InteractionManager();
        tasksCollection = new TasksCollection();
        editTaskView = new EditTaskView();
        taskViews = {};
        $cache = {};

        interactionManager.initialize();

        instantiateTaskLists();
        cacheElements();
        regJQListeners();
        regRouterListeners();
        regCollectionListeners();
        regEditTaskListeners();

        $("body").append(editTaskView.$el);
        Backbone.history.start({pushState: true, root: '/'});
    }

    // Creates a task list for each quadrant and inserts the html.
    function instantiateTaskLists() {
        var halfs = $(".half");
        taskLists = {
            topLeft: { priority: 0, view: new TaskListView() },
            topRight: { priority: 1, view: new TaskListView() },
            bottomLeft: { priority: 2, view: new TaskListView() },
            bottomRight: { priority: 3, view: new TaskListView() }
        };

        halfs.filter(".top").find(".quadrant.left").append(taskLists.topLeft.view.$el);
        halfs.filter(".top").find(".quadrant.right").append(taskLists.topRight.view.$el);
        halfs.filter(".bottom").find(".quadrant.left").append(taskLists.bottomLeft.view.$el);
        halfs.filter(".bottom").find(".quadrant.right").append(taskLists.bottomRight.view.$el);
    }

    // Caches jQuery objects for later use. Queries that
    // require updating are defined where appropriate.
    function cacheElements() {
        $cache.filters = $(".filter .status-icon");
    }

    function regJQListeners() {
        $("body").on("click", ".backbone-action", function(e){
            e.preventDefault();
            router.navigate( $(this).attr("href"), {trigger: true} );
        });

        $("body").on("click", ".button.add", function(e){
            e.preventDefault();
            router.navigate( 'task/new', {trigger: true} );
        });
    }

    function regRouterListeners() {
        router.on('route:filterTasks', filterTasks);
        router.on('route:newTask', populateEditView);

        router.on('route:unhandledRoute', function(route){
            console.log("'" + route + "' is not a recognized request.");
        });
    }

    function regCollectionListeners() {
        tasksCollection.on('reset', function(e){
            _.each(e.models, function(model){
                var taskView = new TaskView({model: model}),
                    priority = parseInt(model.get("priority"), 10);
                regTaskListeners(taskView);
                taskViews[model.cid] = taskView;
                interactionManager.registerView(taskView);
                _.where(taskLists, {priority: priority})[0].view.insert(taskView);
            });
            $cache.tasks = $(".task");
        });
    }

    function regEditTaskListeners() {
        editTaskView.on(editTaskView.NEW_TASK, createNewTask);
        editTaskView.on(editTaskView.CANCEL_EDIT, onSave);
        editTaskView.on(editTaskView.SAVE_TASK, onSave);
        editTaskView.on(editTaskView.DELETE_TASK, onDelete);
    }

    function regTaskListeners(taskView) {
        taskView.on(interactionManager.TAP, function(e){
            populateEditView(e.view.model);
        });
        taskView.on(interactionManager.DRAG_START, onTaskDragStart);
        taskView.on(interactionManager.DRAG, onTaskDrag);
        taskView.on(interactionManager.DROP, onTaskDrop);
        taskView.on(taskView.DELETE, onDelete);
    }

    // Handles the filtering of tasks based on status, criticality
    // and archived state.
    //
    // ToDo:    Refactor logic to better model the user's expectations
    //          for how the filter works. Move filtering in the TaskList view.
    function filterTasks(type) {
        var selectedFilters, targetTasks, nonTargetTasks,
            booleanFilters = ["critical", "archived", "unarchived"],
            targetFilter = $cache.filters.filter("." + type);
        targetFilter.toggleClass("is-selected");
        selectedFilters = $cache.filters.filter(".is-selected");

        if(_.contains(booleanFilters, type)) {
            if(type === "critical") {
                targetTasks = _.filter(tasksCollection.models, function(model){
                    return model.get(type);
                });
            } else {
                targetTasks = _.filter(tasksCollection.models, function(model){
                    if(type.indexOf("un") < 0)
                        return model.get("archived");
                    else
                        return !model.get("archived");
                });
            }
        } else {
            targetTasks = tasksCollection.where({status: type});
        }
        nonTargetTasks = _.reject(tasksCollection.models, function(model){
            return _.contains(targetTasks, model);
        });
        if(selectedFilters.length > 0) {
            if(selectedFilters.length === 1 && targetFilter.hasClass("is-selected")){
                _.each(nonTargetTasks, function(model){
                    taskViews[model.cid].$el.addClass("is-hidden");
                });
            } else {
                if(targetFilter.hasClass("is-selected")){
                    _.each(targetTasks, function(model){
                        taskViews[model.cid].$el.removeClass("is-hidden");
                    });
                } else {
                    _.each(targetTasks, function(model){
                        taskViews[model.cid].$el.addClass("is-hidden");
                    });
                }
            }
        } else {
            _.each(taskViews, function(view){
                view.$el.removeClass("is-hidden");
            });
        }

        // Immediately navigate back to root to minimize issues with LiveReload.
        router.navigate( "/", {trigger: false} );
    }

    function populateEditView(task) {
        if(!_.isUndefined(task))
            interactionManager.resetInteraction(taskViews[task.cid], {silent: true});
        editTaskView.render(task);
        // Immediately navigate back to root to minimize issues with LiveReload.
        router.navigate( "/", {trigger: false} );
    }

    function createNewTask(e) {
        var taskView = new TaskView({model: e.model});
        tasksCollection.add(e.model);
        taskViews[e.model.cid] = taskView;
        interactionManager.registerView(taskView);
        regTaskListeners(taskView);
        $cache.tasks = $(".task");
    }

    // Handle saving a task.
    function onSave(e){
        var task = e.model,
            quadrant = parseInt(task.get("priority"), 10),
            taskView = taskViews[task.cid];
        $(".quadrant").eq(quadrant).find(".task-list").prepend(taskView.$el);
    }

    // Handle deleting a task.
    function onDelete(e){
        var task = e.model,
            taskView = taskViews[task.cid];
        interactionManager.unregisterView(taskView);
        delete taskViews[task.cid];
        task.destroy({url: task.url+"/"+task.id});
        taskView.remove();
        $cache.tasks = $(".task");
    }

    // Handle starting to drag a task.
    function onTaskDragStart(e){
        var taskView = e.view,
            priority = parseInt(taskView.model.get("priority"), 10),
            taskList = _.where(taskLists, {priority: priority})[0];
        taskList.view.remove(taskView, true);
    }

    // Handle dragging a task.
    function onTaskDrag(e){
        var target, targetQuadrant, priority, taskList,
            dTaskboundary, taskHeight,
            taskView = e.view;
            
        //if (taskView.$el.hasClass("is-dragging")) { //class not working as expected yet
            targetQuadrant = dragHelper.getQuadrantAtPoint(e.pos.x, e.pos.y);
            if(targetQuadrant.length > 0) {
                if(!targetQuadrant.hasClass("drop-target")){
                    $(".quadrant.drop-target").removeClass("drop-target");
                    targetQuadrant.addClass("drop-target");
                }
                priority = parseInt(targetQuadrant.attr("data-priority"), 10);
                dTaskboundary = dragHelper.getBoundary(taskView.$el);
                taskHeight = dTaskboundary.bottom - dTaskboundary.top;
                taskList = _.where(taskLists, {priority: priority})[0];
                _.each(taskList.view.tasks, function(iterTask){
                    var tTaskBoundary = dragHelper.getBoundary(iterTask.$el);
                    if( dragHelper.boundariesIntersect(dTaskboundary, tTaskBoundary) ) {
                        if( dTaskboundary.top < tTaskBoundary.top ) {
                            taskList.view.makeSpaceAt(iterTask.model.get("order"));
                        } else {
                            taskList.view.makeSpaceAt(iterTask.model.get("order") + 1);
                        }
                    }
                });
                _.each(taskLists, function(taskList){
                    if(taskList.priority !== priority)
                        taskList.view.removeSpace();
                });
            } else {
                _.each(taskLists, function(taskList){
                    taskList.view.removeSpace();
                });
                $(".quadrant.drop-target").removeClass("drop-target");
            }
        //}
    }

    // Handle dropping a task into a new quadrant.
    function onTaskDrop(e) {
        var priority, dropTarget,
            task = e.view.model,
            dropElement = document.elementFromPoint( e.pos.x, e.pos.y ),
            targetQuadrant = $(dropElement).parents(".quadrant");
            
        if(targetQuadrant.length > 0) {
            priority = parseInt(targetQuadrant.attr("data-priority"), 10);
            dropTarget = _.where(taskLists, {priority: priority})[0].view;
            targetQuadrant.removeClass("drop-target");
            task.set("priority", priority);
            if( priority !== 0)
                task.set("critical", false);
            task.save();
        } else {
            dropTarget = _.where(taskLists, {priority: task.get("priority")})[0].view;
        }
        dropTarget.insert(e.view, dropTarget.space);
        dropTarget.removeSpace();
    }

    // Initialize is the only public method.
    return {
        initialize: initialize
    };
});