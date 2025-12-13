/**
 * Cooking Recipes
 * ===============
 * Defines all cooking recipes, organized by skill level tiers.
 *
 * Recipe Structure:
 * {
 *   id: Unique identifier for the recipe
 *   name: Display name of the meal
 *   tier: Recipe tier (1-5, determines Basic/Intermediate/Advanced menu)
 *   skillRequired: Minimum Cooking skill level to cook this recipe
 *   ingredients: Array of {itemId, quantity} objects
 *   output: {
 *     hungerRestore: How much hunger the meal restores
 *     weight: Weight in grams
 *     slots: Inventory slots consumed
 *     effect: Optional secondary effect (COMFORT_BUFF, STRESS_REDUCE, REST_RESTORE, etc.)
 *     effectValue: Value for the secondary effect
 *     effectDuration: Duration in minutes (for timed buffs)
 *   }
 *   description: Flavor text for the meal
 * }
 */

const COOKING_RECIPES = [
    // =========================================================================
    // TIER 1 - BASIC RECIPES (Skill Level 1)
    // =========================================================================

    {
        id: "RICE_PATTY",
        name: "Rice Patty",
        tier: 1,
        skillRequired: 1,
        ingredients: [
            { itemId: "RICE", quantity: 3 }
        ],
        output: {
            hungerRestore: 6,
            weight: 600,
            slots: 0.2
        },
        description: "A simple patty made from compressed cooked rice"
    },

    {
        id: "LETTUCE_WRAP",
        name: "Lettuce Wrap",
        tier: 1,
        skillRequired: 1,
        ingredients: [
            { itemId: "LETTUCE", quantity: 2 },
            { itemId: "TOMATO", quantity: 1 }
        ],
        output: {
            hungerRestore: 5,
            weight: 600,
            slots: 0.2
        },
        description: "Fresh vegetables wrapped in crisp lettuce"
    },

    {
        id: "SIMPLE_SALAD",
        name: "Simple Salad",
        tier: 1,
        skillRequired: 1,
        ingredients: [
            { itemId: "LETTUCE", quantity: 1 },
            { itemId: "TOMATO", quantity: 1 },
            { itemId: "STRAWBERRY", quantity: 1 }
        ],
        output: {
            hungerRestore: 6,
            weight: 550,
            slots: 0.25
        },
        description: "A basic mixed salad with fresh berries"
    },

    {
        id: "STEAMED_SOYBEANS",
        name: "Steamed Soybeans",
        tier: 1,
        skillRequired: 1,
        ingredients: [
            { itemId: "SOYBEANS", quantity: 2 },
            { itemId: "WATER_CANISTER", quantity: 1 }
        ],
        output: {
            hungerRestore: 4,
            weight: 900,
            slots: 0.3
        },
        description: "Tender soybeans steamed to perfection"
    },

    // =========================================================================
    // TIER 2 - INTERMEDIATE BASIC RECIPES (Skill Level 2)
    // =========================================================================

    {
        id: "GARDEN_SOUP",
        name: "Garden Soup",
        tier: 2,
        skillRequired: 2,
        ingredients: [
            { itemId: "LETTUCE", quantity: 1 },
            { itemId: "TOMATO", quantity: 1 },
            { itemId: "RICE", quantity: 1 },
            { itemId: "WATER_CANISTER", quantity: 2 }
        ],
        output: {
            hungerRestore: 10,
            weight: 1450,
            slots: 0.4,
            effect: "COMFORT_BUFF",
            effectValue: 15,
            effectDuration: 60
        },
        description: "A hearty vegetable and rice soup that warms you from within"
    },

    {
        id: "TOMATO_RICE_BOWL",
        name: "Tomato Rice Bowl",
        tier: 2,
        skillRequired: 2,
        ingredients: [
            { itemId: "RICE", quantity: 2 },
            { itemId: "TOMATO", quantity: 2 },
            { itemId: "WATER_CANISTER", quantity: 1 }
        ],
        output: {
            hungerRestore: 10,
            weight: 1400,
            slots: 0.4
        },
        description: "Seasoned rice mixed with cooked tomatoes"
    },

    {
        id: "BERRY_SMOOTHIE",
        name: "Berry Smoothie",
        tier: 2,
        skillRequired: 2,
        ingredients: [
            { itemId: "STRAWBERRY", quantity: 3 },
            { itemId: "WATER_CANISTER", quantity: 1 }
        ],
        output: {
            hungerRestore: 6,
            weight: 800,
            slots: 0.3
        },
        description: "A refreshing blended berry drink"
    },

    {
        id: "SOYBEAN_STEW",
        name: "Soybean Stew",
        tier: 2,
        skillRequired: 2,
        ingredients: [
            { itemId: "SOYBEANS", quantity: 2 },
            { itemId: "LETTUCE", quantity: 1 },
            { itemId: "WATER_CANISTER", quantity: 1 }
        ],
        output: {
            hungerRestore: 6,
            weight: 1100,
            slots: 0.35
        },
        description: "A simple stew with beans and greens"
    },

    // =========================================================================
    // TIER 3 - INTERMEDIATE RECIPES (Skill Level 3)
    // =========================================================================

    {
        id: "ALIEN_GARDEN_BOWL",
        name: "Alien Garden Bowl",
        tier: 3,
        skillRequired: 3,
        ingredients: [
            { itemId: "VOIDBERRY", quantity: 1 },
            { itemId: "LETTUCE", quantity: 1 },
            { itemId: "TOMATO", quantity: 1 },
            { itemId: "RICE", quantity: 1 }
        ],
        output: {
            hungerRestore: 8,
            weight: 820,
            slots: 0.5,
            effect: "COMFORT_BOOST",
            effectValue: 10
        },
        description: "A colorful bowl mixing earthly greens with void-grown berries"
    },

    {
        id: "VOID_TEA",
        name: "Void Tea",
        tier: 3,
        skillRequired: 3,
        ingredients: [
            { itemId: "VOIDBERRY", quantity: 2 },
            { itemId: "WATER_CANISTER", quantity: 2 }
        ],
        output: {
            hungerRestore: 4,
            weight: 1240,
            slots: 0.4,
            effect: "REST_REDUCE",
            effectValue: 15
        },
        description: "A dark, energizing tea brewed from voidberries. Reduces tiredness."
    },

    {
        id: "PROTEIN_SALAD",
        name: "Protein Salad",
        tier: 3,
        skillRequired: 3,
        ingredients: [
            { itemId: "PROTEIN_PASTE", quantity: 1 },
            { itemId: "LETTUCE", quantity: 1 },
            { itemId: "TOMATO", quantity: 1 },
            { itemId: "LUMINROOT", quantity: 1 }
        ],
        output: {
            hungerRestore: 11,
            weight: 900,
            slots: 0.5,
            effect: "COMFORT_BOOST",
            effectValue: 10
        },
        description: "A nutritious salad enriched with protein paste and glowing root"
    },

    // =========================================================================
    // TIER 4 - ADVANCED RECIPES (Skill Level 4)
    // =========================================================================

    {
        id: "MEAT_AND_GRAIN",
        name: "Meat & Grain",
        tier: 4,
        skillRequired: 4,
        ingredients: [
            { itemId: "MEAT_CHUNK", quantity: 1 },
            { itemId: "RICE", quantity: 2 },
            { itemId: "TOMATO", quantity: 1 }
        ],
        output: {
            hungerRestore: 15,
            weight: 1150,
            slots: 0.6,
            effect: "COMFORT_BOOST",
            effectValue: 15
        },
        description: "Grilled meat served over seasoned rice"
    },

    {
        id: "LUMINROOT_SOUP",
        name: "Luminroot Soup",
        tier: 4,
        skillRequired: 4,
        ingredients: [
            { itemId: "LUMINROOT", quantity: 2 },
            { itemId: "NUTRIENT_PASTE", quantity: 1 },
            { itemId: "WATER_CANISTER", quantity: 2 }
        ],
        output: {
            hungerRestore: 9,
            weight: 1700,
            slots: 0.6,
            effect: "STRESS_REDUCE",
            effectValue: 20
        },
        description: "A calming soup with bioluminescent roots. The glow fades when consumed."
    },

    {
        id: "CRYSTAL_PRESERVE",
        name: "Crystal Preserve",
        tier: 4,
        skillRequired: 4,
        ingredients: [
            { itemId: "CRYSTALFRUIT", quantity: 3 },
            { itemId: "STRAWBERRY", quantity: 1 }
        ],
        output: {
            hungerRestore: 8,
            weight: 550,
            slots: 0.5,
            effect: "STRESS_REDUCE",
            effectValue: 15
        },
        description: "Crystallized fruit preserve with a soothing sweetness"
    },

    // =========================================================================
    // TIER 5 - MASTER RECIPES (Skill Level 5)
    // =========================================================================

    {
        id: "GOURMET_PROTEIN_BOWL",
        name: "Gourmet Protein Bowl",
        tier: 5,
        skillRequired: 5,
        ingredients: [
            { itemId: "MEAT_CHUNK", quantity: 1 },
            { itemId: "PROTEIN_PASTE", quantity: 1 },
            { itemId: "RICE", quantity: 1 },
            { itemId: "LUMINROOT", quantity: 1 },
            { itemId: "TOMATO", quantity: 1 }
        ],
        output: {
            hungerRestore: 20,
            weight: 1400,
            slots: 0.8,
            effect: "COMFORT_BOOST",
            effectValue: 20
        },
        description: "A perfectly balanced meal combining proteins, grains, and vegetables"
    },

    {
        id: "EXOTIC_FRUIT_MEDLEY",
        name: "Exotic Fruit Medley",
        tier: 5,
        skillRequired: 5,
        ingredients: [
            { itemId: "VOIDBERRY", quantity: 2 },
            { itemId: "CRYSTALFRUIT", quantity: 2 },
            { itemId: "STRAWBERRY", quantity: 1 },
            { itemId: "WATER_CANISTER", quantity: 1 }
        ],
        output: {
            hungerRestore: 10,
            weight: 1090,
            slots: 0.7,
            effect: "STRESS_REDUCE",
            effectValue: 25
        },
        description: "A luxurious fruit blend with stress-relieving properties"
    },

    {
        id: "SURVIVAL_RATION_SUPREME",
        name: "Survival Ration Supreme",
        tier: 5,
        skillRequired: 5,
        ingredients: [
            { itemId: "MEAT_CHUNK", quantity: 1 },
            { itemId: "NUTRIENT_PASTE", quantity: 1 },
            { itemId: "SOYBEANS", quantity: 1 },
            { itemId: "RICE", quantity: 1 },
            { itemId: "LUMINROOT", quantity: 1 }
        ],
        output: {
            hungerRestore: 18,
            weight: 1400,
            slots: 0.8,
            effect: "REST_RESTORE",
            effectValue: 20
        },
        description: "The ultimate survival meal, designed to restore both hunger and energy"
    }
];
