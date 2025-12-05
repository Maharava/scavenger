// gamedata/food.js
// Food and consumable items

const FOOD_DATA = [
    // Prepared Foods
    {
        "id": "RICE_PATTY",
        "name": "Rice Patty",
        "char": "*",
        "colour": "#e0e0e0",
        "solid": false,
        "weight": 50,
        "slots": 0.5,
        "script": "pickupItem",
        "scriptArgs": {
            "effect": "RESTORE_HUNGER",
            "value": 15
        }
    },

    // Raw Produce (from Hydroponics)
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

    // Medical Consumables
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
            "effect": "HEAL_BODYPART_MENU",
            "value": 5
        }
    }
];
