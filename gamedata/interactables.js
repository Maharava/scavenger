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
        "id": "STOVE",
        "name": "Stove",
        "char": "S",
        "colour": "#ff6600",
        "solid": true,
        "script": "openStoveMenu",
        "scriptArgs": {}
    },
    {
        "id": "HYDROPONICS_BAY",
        "name": "Hydroponics Bay",
        "char": "H",
        "colour": "#0f0",
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
    },
    {
        "id": "SHIP_CARGO",
        "name": "Ship Cargo Hold",
        "char": "C",
        "colour": "#a0a0a0",
        "solid": true,
        "script": "openShipCargoMenu",
        "scriptArgs": {}
    },
    {
        "id": "BRIDGE_CONSOLE",
        "name": "Bridge Console",
        "char": "B",
        "colour": "#00ffff",
        "solid": true,
        "script": "openBridgeConsole",
        "scriptArgs": {}
    },
    {
        "id": "RECYCLER",
        "name": "Recycler",
        "char": "R",
        "colour": "#708090",
        "solid": true,
        "script": "openRecyclerMenu",
        "scriptArgs": {}
    },
    {
        "id": "SHOWER",
        "name": "Shower",
        "char": "S",
        "colour": "#4dd0e1",
        "solid": true,
        "script": "openShowerMenu",
        "scriptArgs": {}
    },
    {
        "id": "WATER_RECYCLER",
        "name": "Water Recycler",
        "char": "W",
        "colour": "#00bcd4",
        "solid": true,
        "script": "examineWaterRecycler",
        "scriptArgs": {}
    },
    {
        "id": "LIFE_SUPPORT",
        "name": "Life Support System",
        "char": "L",
        "colour": "#4caf50",
        "solid": true,
        "script": "openLifeSupportMenu",
        "scriptArgs": {}
    },
    {
        "id": "AUTO_DOC",
        "name": "Auto-Doc",
        "char": "M",
        "colour": "#00ffff",
        "solid": true,
        "script": "openAutoDocMenu",
        "scriptArgs": {}
    },
    {
        "id": "REFINERY",
        "name": "Refinery",
        "char": "R",
        "colour": "#ff9800",
        "solid": true,
        "script": "openRefineryMenu",
        "scriptArgs": {}
    },
    {
        "id": "DROP_CHUTE",
        "name": "Drop Chute",
        "char": "D",
        "colour": "#9c27b0",
        "solid": false,
        "script": "openDropChuteMenu",
        "scriptArgs": {}
    }
];
