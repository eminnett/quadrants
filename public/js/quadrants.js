// The core Quadrants application object.
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
], function ($, _, Backbone, Router, InteractionManager, TasksCollection,
        EditTaskView, TaskListView, TaskView, dragHelper) {
    "use strict";
        // Functions
    var initialize, instantiateTaskLists, regJQListeners, regRouterListeners,
        regCollectionListeners, regEditTaskListeners, regTaskListeners,
        navigateToInitialRoute, filterTasks, sortTasks, populateEditView,
        createNewTask, onSave, onDelete, onTaskDragStart, onTaskDrag, onTaskDrop,
        // Properties
        router, interactionManager, tasksCollection, editTaskView, taskLists, taskViews;

    initialize = function () {
        router = new Router();
        interactionManager = new InteractionManager();
        tasksCollection = new TasksCollection();
        editTaskView = new EditTaskView();
        taskViews = {};

        interactionManager.initialize();

        instantiateTaskLists();
        regJQListeners();
        regRouterListeners();
        regCollectionListeners();
        regEditTaskListeners();

        $("body").append(editTaskView.$el);
        Backbone.history.start({pushState: true, root: '/'});

        navigateToInitialRoute();
    };

    // Creates a task list for each quadrant and inserts the html.
    instantiateTaskLists = function () {
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
    };

    regJQListeners = function () {
        $("body").on("click", ".backbone-action", function (e) {
            e.preventDefault();
            router.navigate('/', {trigger: true});
            router.navigate($(this).attr("href"), {trigger: true});
        });

        $("body").on("click", ".button.add", function (e) {
            e.preventDefault();
            router.navigate('task/new', {trigger: true});
        });
    };

    regRouterListeners = function () {
        router.on('route:filterTasks', filterTasks);
        router.on('route:sortTasks', sortTasks);
        router.on('route:newTask', populateEditView);

        // router.on('route:unhandledRoute', function (route) {
        //     if (route !== '/' && route.length > 0) {
        //         // console.log("'" + route + "' is not a recognized request.");
        //     }
        // });
    };

    regCollectionListeners = function () {
        tasksCollection.on('reset', function (e) {
            _.each(e.models, function (model) {
                var taskList,
                    taskView = new TaskView({model: model}),
                    order = model.get("order"),
                    priority = parseInt(model.get("priority"), 10),
                    insertOptions = {shiftTasks: !_.isUndefined(order), arrangeTasks: false};
                regTaskListeners(taskView);
                taskViews[model.cid] = taskView;
                interactionManager.registerView(taskView);
                taskList = _.where(taskLists, {priority: priority})[0];
                taskList.view.insert(taskView, order, insertOptions);
            });
            _.each(taskLists, function (taskList) {
                taskList.view.fixOrder();
            });
        });
    };

    regEditTaskListeners = function () {
        editTaskView.on(editTaskView.NEW_TASK, createNewTask);
        editTaskView.on(editTaskView.CANCEL_EDIT, onSave);
        editTaskView.on(editTaskView.SAVE_TASK, onSave);
        editTaskView.on(editTaskView.DELETE_TASK, onDelete);
    };

    regTaskListeners = function (taskView) {
        taskView.on(interactionManager.TAP, function (e) {
            populateEditView(e.view.model);
        });
        taskView.on(interactionManager.DRAG_START, onTaskDragStart);
        taskView.on(interactionManager.DRAG, onTaskDrag);
        taskView.on(interactionManager.DROP, onTaskDrop);
        taskView.on(taskView.DELETE, onDelete);
    };

    // If the app loads with a requested route passed from
    // Sinatra, the router will navigate to the route.
    navigateToInitialRoute = function () {
        var initialRoute = $.trim($("#route").attr("data-route"));
        if (initialRoute.length > 0 && initialRoute !== '/') {
            router.navigate('/' + $("#route").attr("data-route"));
        }
    };

    // Handles the filtering of tasks based on status, criticality
    // and archived state.
    filterTasks = function (type) {
        var selectedFilterIcons,
            selectedFilters = [],
            filterIcons = $(".filter .status-icon"),
            targetFilter = filterIcons.filter("." + type);
        targetFilter.toggleClass("is-selected");

        if (type === "archived") {
            filterIcons.filter(".unarchived").removeClass("is-selected");
        } else if (type === "unarchived") {
            filterIcons.filter(".archived").removeClass("is-selected");
        }

        selectedFilterIcons = filterIcons.filter(".is-selected");

        selectedFilterIcons.each(function (i, filterIcon) {
            selectedFilters.push($(filterIcon).attr("data-filter"));
        });

        _.each(taskLists, function (taskList) {
            taskList.view.filterTasks(selectedFilters);
        });
    };

    // Handles the sorting of tasks by status or alphabetically.
    //
    // ToDo: Sort by date once date support has been added.
    sortTasks = function (type) {
        _.each(taskLists, function (taskList) {
            taskList.view.sortTasks(type);
        });
    };

    populateEditView = function (task) {
        if (!_.isUndefined(task)) {
            interactionManager.resetInteraction(taskViews[task.cid], {silent: true});
        }
        editTaskView.render(task);
    };

    createNewTask = function (e) {
        var taskView = new TaskView({model: e.model});
        tasksCollection.add(e.model);
        taskViews[e.model.cid] = taskView;
        interactionManager.registerView(taskView);
        regTaskListeners(taskView);
    };

    // Handle saving a task.
    onSave = function (e) {
        var task = e.model,
            quadrant = parseInt(task.get("priority"), 10),
            taskView = taskViews[task.cid];
        $(".quadrant").eq(quadrant).find(".task-list").prepend(taskView.$el);
    };

    // Handle deleting a task.
    onDelete = function (e) {
        var task = e.model,
            taskView = taskViews[task.cid];
        interactionManager.unregisterView(taskView);
        delete taskViews[task.cid];
        taskView.remove();
        task.destroy({url: task.url + "/" + task.id});
    };

    // Handle starting to drag a task.
    onTaskDragStart = function (e) {
        var taskView = e.view,
            priority = parseInt(taskView.model.get("priority"), 10),
            taskList = _.where(taskLists, {priority: priority})[0];
        taskList.view.remove(taskView, true);
    };

    // Handle dragging a task.
    onTaskDrag = function (e) {
        function handleQuadrantClass(targetQuadrant) {
            if (!targetQuadrant.hasClass("drop-target")) {
                $(".quadrant.drop-target").removeClass("drop-target");
                targetQuadrant.addClass("drop-target");
            }
        }

        function resetTaskListSpaces(priority) {
            _.each(taskLists, function (taskList) {
                if (_.isUndefined(priority) || priority !== taskList.priority) {
                    taskList.view.removeSpace();
                }
            });
        }

        var targetQuadrant, priority, taskList,
            dTaskBoundary, taskHeight,
            taskView = e.view;

        //if (taskView.$el.hasClass("is-dragging")) { //class not working as expected yet
        targetQuadrant = dragHelper.getQuadrantAtPoint(e.pos.x, e.pos.y);
        if (targetQuadrant.length > 0) {
            priority = parseInt(targetQuadrant.attr("data-priority"), 10);
            dTaskBoundary = dragHelper.getBoundary(taskView.$el);
            taskHeight = dTaskBoundary.bottom - dTaskBoundary.top;
            taskList = _.where(taskLists, {priority: priority})[0];

            handleQuadrantClass(targetQuadrant);

            _.each(taskList.view.tasks, function (iterTask) {
                var tTaskBoundary = dragHelper.getBoundary(iterTask.$el);
                if (dragHelper.boundariesIntersect(dTaskBoundary, tTaskBoundary)) {
                    if (dTaskBoundary.top < tTaskBoundary.top) {
                        taskList.view.makeSpaceAt(iterTask.model.get("order"));
                    } else {
                        taskList.view.makeSpaceAt(iterTask.model.get("order") + 1);
                    }
                }
            });
            resetTaskListSpaces(priority);
        } else {
            resetTaskListSpaces();
            $(".quadrant.drop-target").removeClass("drop-target");
        }
        //}
    };

    // Handle dropping a task into a new quadrant.
    onTaskDrop = function (e) {
        var priority, dropTarget,
            task = e.view.model,
            dropElement = document.elementFromPoint(e.pos.x, e.pos.y),
            targetQuadrant = $(dropElement).parents(".quadrant");

        if (targetQuadrant.length > 0) {
            priority = parseInt(targetQuadrant.attr("data-priority"), 10);
            dropTarget = _.where(taskLists, {priority: priority})[0].view;
            targetQuadrant.removeClass("drop-target");
            task.set("priority", priority);
            if (priority !== 0) {
                task.set("critical", false);
            }
        } else {
            dropTarget = _.where(taskLists, {priority: task.get("priority")})[0].view;
        }
        dropTarget.insert(e.view, dropTarget.space, {arrangeTasks: false});
        dropTarget.removeSpace();
        dropTarget.saveTasks();
    };

    // Initialize is the only public method.
    return {
        initialize: initialize
    };
});