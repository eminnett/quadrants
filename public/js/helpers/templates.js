define([
    "mustache",
    "libs/text!templates/iconButton.html",
    "libs/text!templates/task.html",
    "libs/text!templates/selectOption.html",
    "libs/text!templates/editTask.html"
], function(Mustache, iconButtonTmpl, taskTmpl, selectOptionTmpl, editTaskTmpl){
    var statuses = ["none", "pending", "started", "complete"],
        iconButtonTemplate = Mustache.compile( iconButtonTmpl ),
        taskTemplate = Mustache.compile( taskTmpl ),
        selectOptionTemplate = Mustache.compile( selectOptionTmpl ),
        editTaskTemplate = Mustache.compile( editTaskTmpl );

    function populateTaskTemplate(model){
        var statusMarkup, actionsMarkup,
            statusOptionsMarkup = '',
            archivedClass = (model.get("archived")) ? "unarchive" : "archive";

        statusMarkup = iconButtonFactory({value: model.get("status"), isSelected: true});
        
        if(model.get("critical")) {
            statusMarkup += iconButtonFactory({value: "critical", isSelected: true});
        }

        _.each(statuses, function(value){
            statusOptionsMarkup += iconButtonFactory({
                value: value,
                isSelected: model.get("status") === value,
                isExclusive: true,
                isInteractive: true
            });
        });

        if(model.get("priority") === 0){
            statusOptionsMarkup += iconButtonFactory({
                value: "critical",
                isSelected: model.get("critical"),
                isInteractive: true
            });
        }

        actionsMarkup = iconButtonFactory({value: archivedClass, isInteractive: true});
        actionsMarkup += iconButtonFactory({value: "delete", isInteractive: true});

        return taskTemplate({
            id: model.id,
            task: model.toJSON(),
            statusMarkup: statusMarkup,
            statusOptionsMarkup: statusOptionsMarkup,
            actionsMarkup: actionsMarkup
        });
    }

    function populateEditTaskTemplate(isNew, model){
        var saveButtonMarkup, archiveButtonMarkup, deleteButtonMarkup,
            selectOptionsMarkup = '',
            statusOptionsMarkup = '',
            title = (isNew) ? "New task": "Edit Task",
            selectOptions = [
                {priority: 0, label: "Urgent and Important"},
                {priority: 1, label: "Not Urgent but Important"},
                {priority: 2, label: "Urgent but Not Important"},
                {priority: 3, label: "Neither Urgent nor Important"}
            ];

        _.each(statuses, function(value){
            statusOptionsMarkup += iconButtonFactory({
                value: value,
                isSelected: model.get("status") === value,
                isExclusive: true,
                isInteractive: true,
                hasLabel: true
            });
        });

        statusOptionsMarkup += iconButtonFactory({
            value: "critical",
            isSelected: model.get("critical"),
            isHidden: model.get("priority") !== 0,
            isInteractive: true,
            hasLabel: true
        });

        _.each(selectOptions, function(option){
            selectOptionsMarkup += selectOptionTemplate({
                value: option.priority,
                selected: option.priority === model.get("priority"),
                label: option.label
            });
        });

        saveButtonMarkup = iconButtonFactory({
            value: "save",
            isInteractive: true,
            hasLabel: true
        });
        archiveButtonMarkup = iconButtonFactory({
            value: (model.get("archived")) ? "unarchive" : "archive",
            isInteractive: true,
            hasLabel: true
        });
        deleteButtonMarkup = iconButtonFactory({
            value: (isNew) ? "cancel" : "delete",
            isInteractive: true,
            hasLabel: true
        });

        return editTaskTemplate({
            title: title,
            task: model.toJSON(),
            statusOptionsMarkup: statusOptionsMarkup,
            selectOptionsMarkup: selectOptionsMarkup,
            saveButtonMarkup: saveButtonMarkup,
            archiveButtonMarkup: archiveButtonMarkup,
            deleteButtonMarkup: deleteButtonMarkup
        });
    }

    //options properties: value, hasLabel, isInteractive, isExclusive, isSelected, isHidden
    function iconButtonFactory(options){
        function toTitleCase(str) {
            return str.replace(/\w\S*/g, function(txt){
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            });
        }
        var type, label,
            states = '';

        if(_.contains(statuses, options.value) || options.value === "critical") {
            type = "status-icon";
        } else {
            type = "action button";
        }

        if(options.isInteractive){states += "is-interactive ";}
        if(options.isExclusive){states += "is-exclusive ";}
        if(options.isSelected){states += "is-selected ";}
        if(options.isHidden){states += "is-hidden ";}
        if(options.hasLabel){
            states += "has-label ";
            if(options.value === "none"){
                label = "No status";
            } else {
                label = toTitleCase(options.value);
            }
        }

        return iconButtonTemplate({
            type: type,
            value: options.value,
            states: states,
            label: label
        });
    }

    return {
        populateTaskTemplate: populateTaskTemplate,
        populateEditTaskTemplate: populateEditTaskTemplate
    };
});