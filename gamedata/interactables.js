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
    },
    {
        "id": "MEDKIT",
        "name": "Medkit",
        "char": "+",
        "colour": "#90ee90",
        "solid": false,
        "weight": 100,
        "slots": 0.1,
        "script": "pickupItem",
        "scriptArgs": {
            "effect": "HEAL_BODYPART_MENU", // New effect to open submenu
            "value": 5 // healing value
        }
    },
    // Seeds
    {
        "id": "LETTUCE_SEEDS",
        "name": "Lettuce Seeds",
        "char": ",",
        "colour": "#8f8",
        "solid": false,
        "weight": 10,
        "slots": 0.1,
        "itemType": "seed",
        "script": "pickupItem",
        "scriptArgs": {}
    },
    {
        "id": "RICE_SEEDS",
        "name": "Rice Seeds",
        "char": ",",
        "colour": "#e0e0e0",
        "solid": false,
        "weight": 10,
        "slots": 0.1,
        "itemType": "seed",
        "script": "pickupItem",
        "scriptArgs": {}
    },
    {
        "id": "STRAWBERRY_SEEDS",
        "name": "Strawberry Seeds",
        "char": ",",
        "colour": "#ff0000",
        "solid": false,
        "weight": 10,
        "slots": 0.1,
        "itemType": "seed",
        "script": "pickupItem",
        "scriptArgs": {}
    },
    {
        "id": "TOMATO_SEEDS",
        "name": "Tomato Seeds",
        "char": ",",
        "colour": "#ff6347",
        "solid": false,
        "weight": 10,
        "slots": 0.1,
        "itemType": "seed",
        "script": "pickupItem",
        "scriptArgs": {}
    },
    {
        "id": "SOYBEAN_SEEDS",
        "name": "Soybean Seeds",
        "char": ",",
        "colour": "#f5f5dc",
        "solid": false,
        "weight": 10,
        "slots": 0.1,
        "itemType": "seed",
        "script": "pickupItem",
        "scriptArgs": {}
    },
    // Produce
    {
        "id": "LETTUCE",
        "name": "Lettuce",
        "char": "%",
        "colour": "#8f8",
        "solid": false,
        "weight": 300,
        "slots": 0.25,
        "script": "pickupItem",
        "scriptArgs": {
            "effect": "RESTORE_HUNGER",
            "value": 1
        }
    },
    {
        "id": "RICE",
        "name": "Rice",
        "char": "%",
        "colour": "#e0e0e0",
        "solid": false,
        "weight": 200,
        "slots": 0.25,
        "script": "pickupItem",
        "scriptArgs": {
            "effect": "RESTORE_HUNGER",
            "value": 2
        }
    },
    {
        "id": "STRAWBERRY",
        "name": "Strawberry",
        "char": "%",
        "colour": "#ff0000",
        "solid": false,
        "weight": 100,
        "slots": 0.25,
        "script": "pickupItem",
        "scriptArgs": {
            "effect": "RESTORE_HUNGER",
            "value": 2
        }
    },
    {
        "id": "TOMATO",
        "name": "Tomato",
        "char": "%",
        "colour": "#ff6347",
        "solid": false,
        "weight": 150,
        "slots": 0.25,
        "script": "pickupItem",
        "scriptArgs": {
            "effect": "RESTORE_HUNGER",
            "value": 3
        }
    },
    {
        "id": "SOYBEANS",
        "name": "Soybeans",
        "char": "%",
        "colour": "#f5f5dc",
        "solid": false,
        "weight": 200,
        "slots": 0.25,
        "script": "pickupItem",
        "scriptArgs": {
            "effect": "RESTORE_HUNGER",
            "value": 2
        }
    },
    {
        "id": "HYDROPONICS_BAY",
        "name": "Hydroponics Bay",
        "char": "H",
        "colour": "#0f0",
        "solid": true,
        "script": "openHydroponicsMenu",
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
    }
];
