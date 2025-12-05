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
    },
    {
        "id": "HYDROPONICS_BAY",
        "name": "Hydroponics Bay",
        "solid": true,
        "producerType": "HYDROPONICS",
        "script": "openProducerMenu",
        "scriptArgs": {}
    },
    {
        "id": "WATER_TANK",
        "name": "Water Tank",
        "char": "W",
        "colour": "#4682b4",
        "solid": true,
        "script": "refillWaterTank",
        "scriptArgs": {}
    },
    {
        "id": "Airlock",
        "name": "Airlock",
        "char": "A",
        "colour": "#0ff",
        "solid": true,
        "script": "openExpeditionMenu",
        "scriptArgs": {}
    },
    {
        "id": "Airlock_Return",
        "name": "Airlock (Return to Ship)",
        "char": "A",
        "colour": "#0f0",
        "solid": true,
        "script": "returnToShip",
        "scriptArgs": {}
    }
];
