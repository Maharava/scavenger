// gamedata/interactables.js
const INTERACTABLE_DATA = [
    {
        "id": "TEST_BOX",
        "name": "Crate",
        "char": "X",
        "solid": true,
        "script": "openMenu",
        "scriptArgs": {
            "title": "Test Menu",
            "options": [
                { "label": "Yes", "action": "close_menu" },
                { "label": "No", "action": "close_menu" },
                { "label": "Exit", "action": "close_menu" }
            ]
        }
    },
    {
        "id": "DOOR_CLOSED",
        "name": "Door",
        "char": "D",
        "colour": "#a9f",
        "solid": true,
        "script": "openMenu",
        "scriptArgs": {
            "title": "Door",
            "options": [
                { "label": "Open", "action": "open_door" },
                { "label": "Cancel", "action": "close_menu" }
            ]
        }
    },
    {
        "id": "DOOR_OPEN",
        "name": "Open Doorway",
        "char": "o",
        "colour": "#a9f",
        "solid": false,
        "script": "openMenu",
        "scriptArgs": {
            "title": "Open Doorway",
            "options": [
                { "label": "Close", "action": "close_door" },
                { "label": "Cancel", "action": "close_menu" }
            ]
        }
    },
    {
        "id": "RICE_PATTY",
        "name": "Rice Patty",
        "char": "*",
        "colour": "#e0e0e0",
        "solid": false,
        "weight": 50,
        "script": "pickupItem",
        "scriptArgs": {
            "effect": "RESTORE_HUNGER",
            "value": 15
        }
    },
    {
        "id": "WORKBENCH",
        "name": "Workbench",
        "char": "W",
        "colour": "#963",
        "solid": true,
        "script": "openWorkbenchMenu",
        "scriptArgs": {}
    },
    {
        "id": "BED",
        "name": "Bed",
        "char": "b",
        "colour": "#8b4513",
        "solid": true,
        "script": "openSleepMenu",
        "scriptArgs": {}
    }
];
