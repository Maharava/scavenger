// gamedata/items.js
// General items (seeds, containers, recipe ingredients, etc.)

const ITEM_DATA = [
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

    // Ship Resources
    {
        "id": "WATER_CANISTER",
        "name": "Sealed Water Canister",
        "char": "◙",
        "colour": "#00bfff",
        "solid": false,
        "weight": 2000,
        "slots": 1.0,
        "itemType": "resource",
        "script": "pickupItem",
        "scriptArgs": {}
    }

    // Future items can be added here:
    // - Fuel canisters
    // - Recipe ingredients
    // - Consumable resources
];
