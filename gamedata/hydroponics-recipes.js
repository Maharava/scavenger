// gamedata/hydroponics-recipes.js
// Recipes for hydroponics producer type

// Initialize PRODUCER_RECIPES if it doesn't exist (allows multiple recipe files to be loaded)
if (typeof PRODUCER_RECIPES === 'undefined') {
    var PRODUCER_RECIPES = {};
}

PRODUCER_RECIPES['HYDROPONICS'] = [
        {
            id: 'LETTUCE_RECIPE',
            inputItemId: 'LETTUCE_SEEDS',
            processingTime: 2.5 * 24 * 60, // 2.5 days in minutes
            outputs: [
                { itemId: 'LETTUCE', quantityMin: 2, quantityMax: 3, chance: 1.0 },
                { itemId: 'LETTUCE_SEEDS', quantityMin: 1, quantityMax: 1, chance: 0.3 }
            ]
        },
        {
            id: 'RICE_RECIPE',
            inputItemId: 'RICE_SEEDS',
            processingTime: 10 * 24 * 60, // 10 days in minutes
            outputs: [
                { itemId: 'RICE', quantityMin: 6, quantityMax: 9, chance: 1.0 },
                { itemId: 'RICE_SEEDS', quantityMin: 1, quantityMax: 1, chance: 0.9 }
            ]
        },
        {
            id: 'STRAWBERRY_RECIPE',
            inputItemId: 'STRAWBERRY_SEEDS',
            processingTime: 4.5 * 24 * 60, // 4.5 days in minutes
            outputs: [
                { itemId: 'STRAWBERRY', quantityMin: 4, quantityMax: 5, chance: 1.0 },
                { itemId: 'STRAWBERRY_SEEDS', quantityMin: 1, quantityMax: 1, chance: 0.1 }
            ]
        },
        {
            id: 'TOMATO_RECIPE',
            inputItemId: 'TOMATO_SEEDS',
            processingTime: 7.5 * 24 * 60, // 7.5 days in minutes
            outputs: [
                { itemId: 'TOMATO', quantityMin: 3, quantityMax: 5, chance: 1.0 },
                { itemId: 'TOMATO_SEEDS', quantityMin: 1, quantityMax: 1, chance: 0.4 }
            ]
        },
        {
            id: 'SOYBEAN_RECIPE',
            inputItemId: 'SOYBEAN_SEEDS',
            processingTime: 5 * 24 * 60, // 5 days in minutes
            outputs: [
                { itemId: 'SOYBEANS', quantityMin: 4, quantityMax: 6, chance: 1.0 },
                { itemId: 'SOYBEAN_SEEDS', quantityMin: 1, quantityMax: 1, chance: 0.9 }
            ]
        }
    ];
