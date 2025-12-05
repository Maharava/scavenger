# Producer System - Complete Example

This document provides a complete, copy-paste example for adding a new producer: an **Ore Smelter**.

## File 1: gamedata/producer-config.js

Add this to the `PRODUCER_TYPES` object:

```javascript
const PRODUCER_TYPES = {
    'HYDROPONICS': { /* existing config */ },

    // --- NEW PRODUCER TYPE ---
    'SMELTER': {
        name: 'Ore Smelter',

        // Visual properties
        char: 'S',
        colour: '#ff8800',  // Orange

        // Skill integration
        linkedSkill: 'repair',
        skillBonuses: {
            speedMultiplier: 0.05,        // +5% speed per level
            dailyReduction: 1.0,          // -1% of max time per day per level
            secondaryOutputBonus: 0.02    // +2% secondary output chance per level
        },

        // UI strings
        emptyMessage: 'Select ore to smelt',
        processingMessagePrefix: 'Smelting',
        readyMessage: 'The metal is ready to collect.',
        startActionLabel: 'Insert',
        collectActionLabel: 'Collect',
        startSuccessPrefix: 'Inserted',
        collectSuccessPrefix: 'Collected',
        noInputMessage: 'You have no ore to smelt.',
        foundSecondaryMessage: 'You recovered slag!'
    }
};
```

## File 2: gamedata/smelter-recipes.js (NEW FILE)

Create this new file:

```javascript
// gamedata/smelter-recipes.js
// Recipes for ore smelter producer type

// Initialize PRODUCER_RECIPES if it doesn't exist
if (typeof PRODUCER_RECIPES === 'undefined') {
    var PRODUCER_RECIPES = {};
}

PRODUCER_RECIPES['SMELTER'] = [
    {
        id: 'IRON_ORE_RECIPE',
        inputItemId: 'IRON_ORE',
        processingTime: 2 * 24 * 60,        // 2 game-days
        outputs: [
            {
                itemId: 'IRON_INGOT',
                quantityMin: 2,
                quantityMax: 4,
                chance: 1.0                 // Always produces
            },
            {
                itemId: 'SLAG',
                quantityMin: 1,
                quantityMax: 1,
                chance: 0.3                 // 30% base chance
            }
        ]
    },
    {
        id: 'COPPER_ORE_RECIPE',
        inputItemId: 'COPPER_ORE',
        processingTime: 1.5 * 24 * 60,      // 1.5 game-days
        outputs: [
            {
                itemId: 'COPPER_INGOT',
                quantityMin: 3,
                quantityMax: 5,
                chance: 1.0
            }
        ]
    },
    {
        id: 'TITANIUM_ORE_RECIPE',
        inputItemId: 'TITANIUM_ORE',
        processingTime: 4 * 24 * 60,        // 4 game-days (rare metal takes longer)
        outputs: [
            {
                itemId: 'TITANIUM_INGOT',
                quantityMin: 1,
                quantityMax: 2,
                chance: 1.0
            },
            {
                itemId: 'TITANIUM_POWDER',
                quantityMin: 1,
                quantityMax: 3,
                chance: 0.5                 // 50% chance for powder
            }
        ]
    }
];
```

## File 3: gamedata/interactables.js

Add these items to the `INTERACTABLE_DATA` array:

```javascript
// === INPUT ITEMS (ORE) ===
{
    "id": "IRON_ORE",
    "name": "Iron Ore",
    "char": "*",
    "colour": "#cd7f32",
    "solid": false,
    "weight": 500,
    "slots": 1.0,
    "script": "pickupItem",
    "scriptArgs": {}
},
{
    "id": "COPPER_ORE",
    "name": "Copper Ore",
    "char": "*",
    "colour": "#b87333",
    "solid": false,
    "weight": 450,
    "slots": 1.0,
    "script": "pickupItem",
    "scriptArgs": {}
},
{
    "id": "TITANIUM_ORE",
    "name": "Titanium Ore",
    "char": "*",
    "colour": "#878787",
    "solid": false,
    "weight": 600,
    "slots": 1.0,
    "script": "pickupItem",
    "scriptArgs": {}
},

// === OUTPUT ITEMS (INGOTS & BYPRODUCTS) ===
{
    "id": "IRON_INGOT",
    "name": "Iron Ingot",
    "char": "=",
    "colour": "#a9a9a9",
    "solid": false,
    "weight": 400,
    "slots": 0.5,
    "script": "pickupItem",
    "scriptArgs": {}
},
{
    "id": "COPPER_INGOT",
    "name": "Copper Ingot",
    "char": "=",
    "colour": "#b87333",
    "solid": false,
    "weight": 350,
    "slots": 0.5,
    "script": "pickupItem",
    "scriptArgs": {}
},
{
    "id": "TITANIUM_INGOT",
    "name": "Titanium Ingot",
    "char": "=",
    "colour": "#c0c0c0",
    "solid": false,
    "weight": 300,
    "slots": 0.5,
    "script": "pickupItem",
    "scriptArgs": {}
},
{
    "id": "SLAG",
    "name": "Slag",
    "char": "~",
    "colour": "#4a4a4a",
    "solid": false,
    "weight": 100,
    "slots": 0.25,
    "script": "pickupItem",
    "scriptArgs": {}
},
{
    "id": "TITANIUM_POWDER",
    "name": "Titanium Powder",
    "char": ".",
    "colour": "#d3d3d3",
    "solid": false,
    "weight": 50,
    "slots": 0.1,
    "script": "pickupItem",
    "scriptArgs": {}
},

// === PRODUCER INTERACTABLE ===
{
    "id": "ORE_SMELTER",
    "name": "Ore Smelter",
    "solid": true,
    "producerType": "SMELTER",
    "script": "openProducerMenu",
    "scriptArgs": {}
}
```

**Note:** The smelter's `char` ('S') and `colour` ('#ff8800') come from producer-config.js, so you don't need to specify them here.

## File 4: gamedata/map.js

Add the smelter to your ship's interactables:

```javascript
interactables: [
    { id: 'HYDROPONICS_BAY', x: 1, y: 8 },
    { id: 'ORE_SMELTER', x: 5, y: 10 },      // Add this line
    { id: 'Airlock', x: 19, y: 7 },
    // ... other interactables
]
```

## File 5: index.html

Add the recipe file to the script loading order (around line 111):

```html
<!-- Game Data -->
<script src="gamedata/creatures.js"></script>
<script src="gamedata/interactables.js"></script>
<script src="gamedata/producer-config.js"></script>
<script src="gamedata/hydroponics-recipes.js"></script>
<script src="gamedata/smelter-recipes.js"></script>  <!-- ADD THIS LINE -->
<script src="gamedata/equipment.js"></script>
```

## Testing

1. **Start the game**
2. **Add test items via console:**
   ```javascript
   // Get player
   const player = game.world.query(['PlayerComponent'])[0];
   const inv = player.getComponent('InventoryComponent');

   // Add iron ore
   const ironOre = game.world.createEntity();
   game.world.addComponent(ironOre, new ItemComponent('Iron Ore', '', 500, 1.0));
   game.world.addComponent(ironOre, new NameComponent('Iron Ore'));
   game.world.addComponent(ironOre, new StackableComponent(5, 99));
   inv.items.set('Iron Ore', { entityId: ironOre, quantity: 5 });
   ```

3. **Navigate to the smelter** (position 5, 10 on the ship)
4. **Press Enter to interact** - should show "Select ore to smelt" with "Insert Iron Ore" option
5. **Select Iron Ore** - should see "Inserted Iron Ore"
6. **Press Enter again** - should show "Smelting Iron Ore. Time remaining: 2d 0h"
7. **Sleep for 2+ days** (or adjust `PRODUCER_TIME_MULTIPLIER` for faster testing)
8. **Press Enter when ready** - should show "The metal is ready to collect."
9. **Select Collect** - should receive 2-4 Iron Ingots and possibly 1 Slag

## How It Works

1. **Player Interaction** → `openProducerMenu` script checks producer state
2. **Empty State** → Shows menu with available recipes (based on player's inventory)
3. **Start Production** → `startProduction` consumes input item, starts timer
4. **Processing** → `ProducerSystem` reduces timer each hour with skill bonuses
5. **Ready State** → Player can collect outputs
6. **Collection** → `collectOutput` generates items based on recipe + skill, triggers skill check

## Customization Ideas

### Different Processing Times
```javascript
processingTime: 0.5 * 24 * 60,   // 12 hours (fast)
processingTime: 7 * 24 * 60,     // 1 week (slow)
processingTime: 30,              // 30 minutes (testing)
```

### Multiple Byproducts
```javascript
outputs: [
    { itemId: 'PRIMARY', quantityMin: 5, quantityMax: 10, chance: 1.0 },
    { itemId: 'COMMON_BY', quantityMin: 1, quantityMax: 3, chance: 0.5 },
    { itemId: 'RARE_BY', quantityMin: 1, quantityMax: 1, chance: 0.1 },
    { itemId: 'VERY_RARE_BY', quantityMin: 1, quantityMax: 1, chance: 0.01 }
]
```

### No Skill Integration
```javascript
linkedSkill: null,
skillBonuses: null,
```

### Variable Quality
```javascript
// Low-quality recipe (fast, low yield)
{
    id: 'QUICK_SMELT',
    inputItemId: 'IRON_ORE',
    processingTime: 0.5 * 24 * 60,
    outputs: [{ itemId: 'IRON_INGOT', quantityMin: 1, quantityMax: 2, chance: 1.0 }]
},
// High-quality recipe (slow, high yield)
{
    id: 'REFINED_SMELT',
    inputItemId: 'REFINED_IRON_ORE',
    processingTime: 4 * 24 * 60,
    outputs: [{ itemId: 'IRON_INGOT', quantityMin: 5, quantityMax: 8, chance: 1.0 }]
}
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "You have no ore to smelt" | Input item IDs must match exactly in recipes and INTERACTABLE_DATA |
| Smelter appears as '?' on map | Check producer-config.js has `char` and `colour` properties |
| Nothing happens when interacting | Check `producerType: "SMELTER"` and `script: "openProducerMenu"` in interactables.js |
| Time doesn't count down | Check ProducerSystem is registered in game.js |
| Recipe file not loading | Verify script tag is added to index.html |
| Skill bonuses not working | Ensure `linkedSkill` matches a skill in SkillsComponent and skill system has a check method |

## Next Steps

- Try creating a **Bioreactor** that turns organic waste into fuel
- Try creating a **Component Recycler** that breaks down equipment
- Add a **Water Purifier** that converts contaminated water
- Create a **3D Printer** that fabricates parts from raw materials
