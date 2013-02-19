// The core Quadrants application object.
//
// ToDo: Create a global event dispatcher in order to clean up event dispatching across the app.
// ToDo: Add date support.
// ToDo: Develop the ability to resize quadrants (this will be best combined with a responsive layout).
// ToDo: Add functionality to sort tasks manually (by dragging), by status, by date and alphabetically.
// ToDo: Refactor to use logicless templates.
// ToDo: Be able to handle page refresh from any URL.
// ToDo: Test.
define([
    "jquery",
    "underscore",
    "backbone",
    "handlebars",
    "router",
    "interactionManager",
    "collections/tasks",
    "views/editTask",
    "views/task"
], function($, _, Backbone, Handlebars, Router, InteractionManager, TasksCollection, EditTaskView, TaskView){
    var router, interactionManager, tasksCollection, editTaskView, taskViews, swipedTask, $cache;
    
    function initialize() {
        handlebarsHelpers();

        router = new Router();
        interactionManager = new InteractionManager();
        tasksCollection = new TasksCollection();
        editTaskView = new EditTaskView();
        taskViews = {};
        $cache = {};

        interactionManager.initialize();

        cacheElements();
        regJQListeners();
        regRouterListeners();
        regCollectionListeners();
        regEditTaskListeners();

        $("body").append(editTaskView.$el);
        Backbone.history.start({pushState: true, root: '/'});
    }

    // Defines helper blocks for Handlebars.
    function handlebarsHelpers(){
        //Tests equality.
        Handlebars.registerHelper("ifEqual", function(v1, v2, options) {
            if(v1 == v2) {
                return options.fn(this);
            }
            return options.inverse(this);
        });

        //Tests inequality.
        Handlebars.registerHelper("ifNotEqual", function(v1, v2, options) {
            if(v1 != v2) {
                return options.fn(this);
            }
            return options.inverse(this);
        });
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
                    quadrant = parseInt(model.get("priority"), 10);
                regTaskListeners(taskView);
                taskViews[model.cid] = taskView;
                interactionManager.addView(taskView);
                $(".quadrant").eq(quadrant).find(".task-list").prepend(taskView.$el);
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
        taskView.on(interactionManager.SWIPE_LEFT, onTaskSwipe);
        taskView.on(interactionManager.SWIPE_RIGHT, onTaskSwipe);
        taskView.on(interactionManager.SWIPE_RESET, onSwipeReset);
        taskView.on(interactionManager.DRAG, onTaskDrag);
        taskView.on(interactionManager.DROP, onTaskDrop);
        taskView.on(taskView.DELETE, onDelete);
    }

    // Handles the filtering of tasks based on status, criticality
    // and archived state.
    //
    // ToDo:    Refactor logic to better model the user's expectations
    //          for how the filter works. Consider creating a filter
    //          management object.
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
        openEditModal();
        // Immediately navigate back to root to minimize issues with LiveReload.
        router.navigate( "/", {trigger: false} );
    }

    function createNewTask(e) {
        var taskView = new TaskView({model: e.model});
        tasksCollection.add(e.model);
        taskViews[e.model.cid] = taskView;
        interactionManager.addView(taskView);
        regTaskListeners(taskView);
        $cache.tasks = $(".task");
    }

    // Handle saving a task.
    function onSave(e){
        var task = e.model,
            quadrant = parseInt(task.get("priority"), 10),
            taskView = taskViews[task.cid];
        $(".quadrant").eq(quadrant).find(".task-list").prepend(taskView.$el);
        closeEditModal();
    }

    // Handle deleting a task.
    function onDelete(e){
        var task = e.model,
            taskView = taskViews[task.cid];
        interactionManager.removeView(taskView);
        delete taskViews[task.cid];
        task.destroy({url: task.url+"/"+task.id});
        taskView.remove();
        closeEditModal();
        $cache.tasks = $(".task");
    }

    // Handle swiping a task.
    function onTaskSwipe(e) {
        var task = e.view;
        if( swipedTask && swipedTask !== taskViews[task.cid])
            interactionManager.resetInteraction(swipedTask, {silent: true});
        swipedTask = taskViews[task.cid];
    }

    // Handle resetting a swiped task.
    function onSwipeReset(e) {
        swipedTask = null;
    }

    // Reset an already swiped task when
    // another one is dragged.
    function onTaskDrag(e) {
        if( swipedTask )
            interactionManager.resetInteraction(swipedTask);
    }

    // Handle dropping a task into a new quadrant.
    function onTaskDrop(e) {
        var task = e.view.model,
            dropElement = document.elementFromPoint( e.pos.x, e.pos.y ),
            targetQuadrant = $(dropElement).parents(".quadrant"),
            dropTarget = targetQuadrant.find(".task-list"),
            priority = targetQuadrant.attr("data-priority");

        if(dropTarget.length > 0) {
            task.set("priority", priority);
            if( priority !== "0")
                task.set("critical", false);
            task.save();
        } else {
            targetQuadrant = $(".quadrant[data-priority='" + task.get("priority")+ "']");
            dropTarget = targetQuadrant.find(".task-list");
        }
        dropTarget.prepend(e.view.$el);
    }

    // Open the EditTask modal window.
    function openEditModal(){
        editTaskView.$el.removeClass("is-hidden").hide().fadeIn(function(){
            editTaskView.$el.css({"display": ""});
        });
    }

    // Close the EditTask modal window.
    function closeEditModal(){
        editTaskView.$el.fadeOut(function(){
            editTaskView.$el.addClass("is-hidden").css({"display": ""});
        });
    }

    // Initialize is the only public method.
    return {
        initialize: initialize
    };
});