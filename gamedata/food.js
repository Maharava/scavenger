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
        "tags": ["food_prepared"],
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
        "tags": ["food_raw", "agricultural"],
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
        "tags": ["food_raw", "agricultural"],
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
        "tags": ["food_raw", "agricultural"],
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
        "tags": ["food_raw", "agricultural"],
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
        "tags": ["food_raw", "agricultural"],
        "script": "pickupItem",
        "scriptArgs": {
            "effect": "RESTORE_HUNGER",
            "value": 2
        }
    },

    // Protein Sources (Loot Only)
    {
        "id": "PROTEIN_PASTE",
        "name": "Protein Paste",
        "char": "%",
        "colour": "#d2b48c",
        "solid": false,
        "weight": 200,
        "slots": 0.25,
        "tags": ["food_protein"],
        "script": "pickupItem",
        "scriptArgs": {
            "effect": "RESTORE_HUNGER",
            "value": 4
        }
    },
    {
        "id": "MEAT_CHUNK",
        "name": "Meat Chunk",
        "char": "%",
        "colour": "#8b4513",
        "solid": false,
        "weight": 400,
        "slots": 0.5,
        "tags": ["food_protein"],
        "script": "pickupItem",
        "scriptArgs": {
            "effect": "RESTORE_HUNGER",
            "value": 5
        }
    },
    {
        "id": "NUTRIENT_PASTE",
        "name": "Nutrient Paste",
        "char": "%",
        "colour": "#9acd32",
        "solid": false,
        "weight": 200,
        "slots": 0.25,
        "tags": ["food_protein"],
        "script": "pickupItem",
        "scriptArgs": {
            "effect": "RESTORE_HUNGER",
            "value": 3
        }
    },

    // Alien/Sci-Fi Produce (Loot Only)
    {
        "id": "VOIDBERRY",
        "name": "Voidberry",
        "char": "%",
        "colour": "#4b0082",
        "solid": false,
        "weight": 120,
        "slots": 0.25,
        "tags": ["food_alien", "nature"],
        "script": "pickupItem",
        "scriptArgs": {
            "effect": "RESTORE_HUNGER",
            "value": 2
        }
    },
    {
        "id": "LUMINROOT",
        "name": "Luminroot",
        "char": "%",
        "colour": "#87ceeb",
        "solid": false,
        "weight": 250,
        "slots": 0.25,
        "lightRadius": 6,
        "tags": ["food_alien", "nature", "bioluminescent"],
        "script": "pickupItem",
        "scriptArgs": {
            "effect": "RESTORE_HUNGER",
            "value": 3
        }
    },
    {
        "id": "CRYSTALFRUIT",
        "name": "Crystalfruit",
        "char": "%",
        "colour": "#e0ffff",
        "solid": false,
        "weight": 150,
        "slots": 0.25,
        "tags": ["food_alien", "nature"],
        "script": "pickupItem",
        "scriptArgs": {
            "effect": "RESTORE_HUNGER",
            "value": 2
        }
    },

    // Prepared Rations (Loot Only)
    {
        "id": "FREEZE_DRIED_RATIONS",
        "name": "Freeze-Dried Rations",
        "char": "*",
        "colour": "#D2B48C",
        "solid": false,
        "weight": 150,
        "slots": 0.25,
        "tags": ["food_prepared"],
        "script": "pickupItem",
        "scriptArgs": {
            "effect": "RESTORE_HUNGER",
            "value": 8
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
        "tags": ["medical_supplies"],
        "script": "pickupItem",
        "scriptArgs": {
            "effect": "HEAL_BODYPART_MENU",
            "value": 5
        }
    }
];
