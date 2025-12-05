# Producer System Guide

## Overview

The Producer System is a generic, modular framework for creating interactables that transform input items into output items over time. This system powers the Hydroponics Bay and can be easily extended to create new production-based interactables like smelters, recyclers, bioreactors, and more.

**NEW in Latest Version:** The system now uses a **deadline-based approach** instead of continuous timers. Producers calculate an end date/time when planted, and skill bonuses reduce this deadline at midnight, making the system more efficient and allowing production to continue even when the player is off-ship.

## Architecture

### Core Components

- **ProducerComponent** (`components/producer-component.js`): Entity component that tracks producer state and deadline
- **ProducerSystem** (`systems/producer-system.js`): System that applies skill reductions at midnight
- **PRODUCER_TYPES** (`gamedata/producer-config.js`): Configuration for each producer type
- **PRODUCER_RECIPES** (`gamedata/*-recipes.js`): Recipe definitions for each producer type

### How the Deadline System Works

1. **Planting:** When player starts production, system calculates `endTotalMinutes` based on base recipe time (NO skill modifiers applied yet)
2. **Midnight Reductions:** At each 0000 (midnight), reduces the end time by `(baseTime × 2% × skillLevel)` for each skill level
3. **Off-Ship Tracking:** When player returns to ship after being away across midnight(s), applies ONE reduction (not per day)
4. **Check on Interaction:** Producer state only checked when player interacts - no continuous updates needed

**Benefits of Deadline System:**
- ✅ More efficient (no per-frame timer updates)
- ✅ Works while player is off-ship
- ✅ Simpler to understand (just compare times)
- ✅ Skill bonuses feel meaningful (see exact time saved)

### Data Flow

1. Player interacts with a producer entity
2. `openProducerMenu` script checks producer state (empty/processing/ready)
3. Player selects an input item from available recipes
4. `startProduction` action calculates end time, starts production
5. `ProducerSystem` applies reductions at midnight (0000)
6. When player interacts again, checks if current time ≥ end time
7. If ready, player uses `collectOutput` to receive items

## How to Add a New Producer

### Step 1: Define Producer Type Configuration

Edit `gamedata/producer-config.js` and add your producer type to `PRODUCER_TYPES`:

```javascript
const PRODUCER_TYPES = {
    'HYDROPONICS': { /* existing config */ },

    'SMELTER': {
        name: 'Ore Smelter',

        // Visual properties (used on map)
        char: 'S',
        colour: '#ff8800',

        // Skill integration (optional - set to null if no skill)
        linkedSkill: 'repair',  // or 'farming', 'medical', etc.
        skillBonuses: {
            // Midnight reduction: 2% of base time per skill level
            // (Not used anymore, hardcoded at 2% in system)
            dailyReduction: 2.0,          // Informational only
            secondaryOutputBonus: 0.02    // +2% to secondary/tertiary output chances per level
        },

        // UI strings
        emptyMessage: 'Select ore to smelt',
        processingMessagePrefix: 'Smelting',          // "Smelting Iron Ore..."
        readyMessage: 'The metal is ready to collect.',
        startActionLabel: 'Insert',                    // "Insert Iron Ore"
        collectActionLabel: 'Collect',
        startSuccessPrefix: 'Inserted',                // "Inserted Iron Ore."
        collectSuccessPrefix: 'Collected',             // "Collected 3 Iron Ingots."
        noInputMessage: 'You have no ore to smelt.',
        foundSecondaryMessage: 'You found slag!'       // Message when secondary outputs are produced
    }
};
```

**Note on Skill Bonuses:**
- The daily reduction is **hardcoded at 2% per skill level** in the ProducerSystem
- `dailyReduction` in config is informational/documentation only
- Secondary output bonus is still configurable

### Step 2: Create Recipe File

Create a new file `gamedata/smelter-recipes.js` (or similar):

```javascript
// gamedata/smelter-recipes.js
// Recipes for smelter producer type

// Initialize PRODUCER_RECIPES if it doesn't exist (allows multiple recipe files)
if (typeof PRODUCER_RECIPES === 'undefined') {
    var PRODUCER_RECIPES = {};
}

PRODUCER_RECIPES['SMELTER'] = [
    {
        id: 'IRON_ORE_RECIPE',
        inputItemId: 'IRON_ORE',                // Must match item ID in INTERACTABLE_DATA
        processingTime: 2 * 24 * 60,            // 2 days in minutes (at 1x multiplier)
        outputs: [
            {
                itemId: 'IRON_INGOT',           // Primary output (always first)
                quantityMin: 2,                 // Random between min and max
                quantityMax: 4,
                chance: 1.0                     // 100% chance
            },
            {
                itemId: 'SLAG',                 // Secondary output
                quantityMin: 1,
                quantityMax: 1,
                chance: 0.3                     // 30% base chance (skill bonuses apply)
            }
        ]
    },
    {
        id: 'COPPER_ORE_RECIPE',
        inputItemId: 'COPPER_ORE',
        processingTime: 1.5 * 24 * 60,          // 1.5 days
        outputs: [
            {
                itemId: 'COPPER_INGOT',
                quantityMin: 3,
                quantityMax: 5,
                chance: 1.0
            }
        ]
    }
];
```

### Step 3: Add Items to Game Data

Ensure your input and output items exist in `gamedata/interactables.js`:

```javascript
// Input items (ore)
{
    "id": "IRON_ORE",
    "name": "Iron Ore",
    "char": "*",
    "colour": "#8B7355",
    "solid": false,
    "weight": 500,
    "slots": 1.0,
    "script": "pickupItem",
    "scriptArgs": {}
},

// Output items (ingots)
{
    "id": "IRON_INGOT",
    "name": "Iron Ingot",
    "char": "=",
    "colour": "#A9A9A9",
    "solid": false,
    "weight": 400,
    "slots": 0.5,
    "script": "pickupItem",
    "scriptArgs": {}
},

// Secondary outputs (slag)
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
}
```

### Step 4: Add Producer Interactable

Add the producer entity to `gamedata/interactables.js`:

```javascript
{
    "id": "ORE_SMELTER",
    "name": "Ore Smelter",
    "solid": true,                          // Blocks movement
    "producerType": "SMELTER",              // Links to PRODUCER_TYPES config
    "script": "openProducerMenu",           // Use generic producer menu
    "scriptArgs": {}
}
```

**Note:** `char` and `colour` are automatically pulled from the producer config, so you don't need to specify them here.

### Step 5: Place in World

Add your producer to the map in `gamedata/map.js`:

```javascript
interactables: [
    { id: 'HYDROPONICS_BAY', x: 1, y: 8 },
    { id: 'ORE_SMELTER', x: 5, y: 12 },     // Add your producer here
    // ... other interactables
]
```

### Step 6: Add Recipe File to index.html

Add your recipe file to the script loading order in `index.html`:

```html
<!-- Game Data -->
<script src="gamedata/producer-config.js"></script>
<script src="gamedata/hydroponics-recipes.js"></script>
<script src="gamedata/smelter-recipes.js"></script>  <!-- Add this line -->
```

### Step 7: Test!

1. Start the game
2. Navigate to your producer
3. Interact with it (should show empty state)
4. Add input items to your inventory (via console or normal gameplay)
5. Interact again and select an input
6. Wait for processing (sleep across midnight or use console time skip)
7. Collect outputs

## Understanding the Deadline System

### Example: Soybeans with Farming Skill

**Scenario:** Player plants soybeans (5 days = 7200 minutes) at 1400 on Day 1 with Farming Level 3

#### 1. Planting (Day 1, 1400)
```javascript
endTotalMinutes = currentTotalMinutes + 7200
// If current is 840 (Day 1, 1400), end = 8040 (Day 6, 1400)
baseProductionTime = 7200
lastReductionDay = 1
```

#### 2. First Midnight (Day 2, 0000)
```javascript
reduction = 7200 × 0.02 × 3 = 432 minutes (7.2 hours)
endTotalMinutes = 8040 - 432 = 7608 (Day 6, 0648)
lastReductionDay = 2
```

#### 3. Second Midnight (Day 3, 0000)
```javascript
reduction = 7200 × 0.02 × 3 = 432 minutes
endTotalMinutes = 7608 - 432 = 7176 (Day 5, 1856... wraps to Day 5, 1856)
lastReductionDay = 3
```

#### 4. Continue Each Midnight
Each midnight that passes while on ship, another 432 minutes are removed.

#### 5. Harvest
When `currentTotalMinutes >= endTotalMinutes`, crop is ready!

### Off-Ship Behavior

**Scenario:** Player leaves ship on Day 2, returns on Day 5

```javascript
// On return to ship:
if (currentDay > lastDayOnShip) {
    // Player was off-ship and crossed midnight(s)
    // Apply ONE reduction (not per day missed)
    reduction = 7200 × 0.02 × 3 = 432 minutes
    endTotalMinutes -= 432
    lastReductionDay = currentDay
}
```

**Rationale:** The reduction represents active tending by the player. If you're gone for 3 days, you weren't tending, so you only get one reduction when you return (not three).

## Advanced Features

### Multiple Outputs

Recipes support unlimited outputs. The first output (index 0) is always the primary output and is guaranteed at 100% chance. Additional outputs are secondary/tertiary and can have < 100% chance:

```javascript
outputs: [
    { itemId: 'PRIMARY_ITEM', quantityMin: 1, quantityMax: 3, chance: 1.0 },
    { itemId: 'RARE_BYPRODUCT', quantityMin: 1, quantityMax: 1, chance: 0.1 },
    { itemId: 'VERY_RARE_BYPRODUCT', quantityMin: 1, quantityMax: 1, chance: 0.01 }
]
```

### Skill Integration

If your producer has a `linkedSkill`, skill bonuses automatically apply:

- **Midnight Reduction:** 2% of base time per skill level, applied at each 0000
- **Secondary Output Bonus:** Increased chance for outputs with index > 0 (+2% per level by default)

The system automatically calls the appropriate skill level-up check method when collecting outputs. The method name is generated as: `check{SkillName}LevelUp` (e.g., `checkFarmingLevelUp`, `checkRepairLevelUp`).

**To add a new skill:**
1. Add the skill to `components.js` `SkillsComponent`
2. Add the level-up check method to `systems/skills-system.js`
3. Link it in your producer config via `linkedSkill`

### No Skill Producers

If you don't want skill integration, set `linkedSkill: null`:

```javascript
'BASIC_RECYCLER': {
    name: 'Basic Recycler',
    char: 'R',
    colour: '#808080',
    linkedSkill: null,              // No skill bonuses
    skillBonuses: null,             // Not needed
    // ... UI strings
}
```

### Variable Output Quantities

Use `quantityMin` and `quantityMax` to create variable yields:

```javascript
outputs: [
    {
        itemId: 'SALVAGED_COMPONENTS',
        quantityMin: 1,         // Could get 1...
        quantityMax: 10,        // ...or 10!
        chance: 1.0
    }
]
```

### Zero-Quantity Outputs

You can set `quantityMin: 0` to create "chance to get nothing" outcomes:

```javascript
outputs: [
    {
        itemId: 'RARE_MATERIAL',
        quantityMin: 0,         // Might get nothing
        quantityMax: 2,         // Or 1-2 items
        chance: 0.5             // 50% chance to roll this output
    }
]
```

## Time Multiplier

All producers use `PRODUCER_TIME_MULTIPLIER` from `config/game-constants.js`. This controls ALL producer speeds globally:

```javascript
const PRODUCER_TIME_MULTIPLIER = 1;  // 1x = real game-time progression
```

- **1x:** Normal speed (2.5 game-days = 2.5 game-days)
- **20x:** Fast testing (2.5 game-days completes 20x faster)
- **2000x:** Very fast testing (nearly instant)

**Note:** Time is in **game-time**, not real-time. Players can sleep to advance time instantly. The multiplier can be used for testing or to create super-fast producers (e.g., a rapid fabricator).

**Current Setting:** 1x (normal game-time)

## Example: Component Recycler

Here's a complete example of a recycler that breaks down equipment:

**producer-config.js:**
```javascript
'RECYCLER': {
    name: 'Component Recycler',
    char: 'Y',
    colour: '#00ff88',
    linkedSkill: 'repair',
    skillBonuses: {
        dailyReduction: 2.0,              // 2% per level (hardcoded in system)
        secondaryOutputBonus: 0.02        // +2% per level
    },
    emptyMessage: 'Select equipment to recycle',
    processingMessagePrefix: 'Recycling',
    readyMessage: 'Recycling complete.',
    startActionLabel: 'Load',
    collectActionLabel: 'Collect',
    startSuccessPrefix: 'Loaded',
    collectSuccessPrefix: 'Collected',
    noInputMessage: 'You have no equipment to recycle.',
    foundSecondaryMessage: 'You recovered intact components!'
}
```

**recycler-recipes.js:**
```javascript
PRODUCER_RECIPES['RECYCLER'] = [
    {
        id: 'RECYCLE_WEAPON_RECIPE',
        inputItemId: 'BROKEN_WEAPON',
        processingTime: 0.5 * 24 * 60,      // 12 hours
        outputs: [
            { itemId: 'SALVAGED_COMPONENTS', quantityMin: 5, quantityMax: 10, chance: 1.0 },
            { itemId: 'INTACT_LOGIC_BOARD', quantityMin: 1, quantityMax: 1, chance: 0.2 }
        ]
    }
];
```

## Debugging

### Console Commands

```javascript
// Find all producers
producers = world.query(['ProducerComponent'])

// Get first producer
producer = producers[0].getComponent('ProducerComponent')

// Check deadline info
console.log(`State: ${producer.state}`)
console.log(`End time: ${producer.endTotalMinutes}`)
console.log(`Base time: ${producer.baseProductionTime}`)
console.log(`Last reduction day: ${producer.lastReductionDay}`)

// Get current time
timeComp = player.getComponent('TimeComponent')
console.log(`Current time: ${timeComp.totalMinutes}`)
console.log(`Current day: ${timeComp.day}`)

// Calculate remaining time
if (producer.state === 'processing') {
    remaining = producer.endTotalMinutes - timeComp.totalMinutes
    hours = Math.ceil(remaining / 60)
    console.log(`${hours} hours remaining`)
}

// Force midnight (for testing reductions)
timeComp.totalMinutes = Math.ceil(timeComp.totalMinutes / 1440) * 1440

// Skip to specific day
timeComp.totalMinutes = 1440 * 5  // Day 6 at 0000
```

### Enable Debug Logging

```javascript
// In browser console:
console.log(PRODUCER_TYPES);        // See all producer configs
console.log(PRODUCER_RECIPES);      // See all recipes
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "No input items" | Input item IDs don't match | Check INTERACTABLE_DATA for exact IDs |
| Producer not working | Recipe file not loaded | Verify index.html includes recipe script |
| No skill reduction | Skill level is 0 | Increase farming/linked skill level |
| Reduction not applying | Not crossing midnight | Use console to skip to 0000 |
| Wrong skill triggered | Method name mismatch | Check `check{SkillName}LevelUp` exists |
| Visual doesn't match | Config mismatch | char/colour in producer-config.js overrides interactables.js |
| Time not advancing | Time system issue | Check REAL_SECONDS_PER_GAME_MINUTE constant |

## Best Practices

1. **Use descriptive recipe IDs:** `IRON_ORE_RECIPE` not `RECIPE_1`
2. **Balance processing times:** Consider player experience (1-10 game days typical)
   - Short: 12 hours - 2 days
   - Medium: 3-7 days
   - Long: 8-14 days
3. **Test skill bonuses:** Verify reductions feel meaningful
   - At Farming 5: 10% reduction per midnight = significant impact
4. **Multiple recipe files:** Keep producer types in separate files for organization
5. **Comment your configs:** Explain non-obvious choices (why this time? why this chance?)
6. **Test edge cases:**
   - What if player has 0 input items?
   - What if skill is 0?
   - What if player is off-ship for many days?
7. **Consider midnight crossings:** Longer processes benefit more from skill reductions

## Skill Reduction Math

For reference, here's how skill reductions compound over time:

**Example: Lettuce (2.5 days = 3600 minutes) with Farming 5**

| Midnight | Reduction | End Time Adjustment | Total Saved |
|----------|-----------|---------------------|-------------|
| Day 2 0000 | 360 min | -6 hours | 6 hours |
| Day 3 0000 | 360 min | -6 hours | 12 hours |

**Original:** 2.5 days (60 hours)
**With Farming 5:** ~2.0 days (48 hours) - **20% faster!**

**Example: Rice (10 days = 14400 minutes) with Farming 5**

| Midnight | Reduction | Total Saved |
|----------|-----------|-------------|
| Each midnight | 1440 min (24 hours) | 1 day per midnight |

After 5 midnights: **5 days saved** = finishes in **~5 days instead of 10!**

This demonstrates why longer-term crops benefit more from high farming skills.

## Future Extensions

The producer system is designed for easy extension:

- **Resource Costs:** Could add water/power consumption per producer
- **Upgrade System:** Could add producer tiers (basic/advanced/expert)
- **Failure Chances:** Could add risk of production failure based on conditions
- **Quality Tiers:** Could produce "poor/normal/excellent" quality outputs
- **Batch Processing:** Could process multiple inputs at once
- **Visual Feedback:** Could change char/colour based on state (empty/processing/ready)
- **Temperature Requirements:** Could require specific temperature ranges
- **Maintenance:** Could require periodic player attention or break down

All of these can be added without changing the core deadline-based architecture.

## Migration from Old Timer System

If you have old producer code using `processingTimer` and `maxProcessingTime`, update to the new deadline system:

**Old System (Timer-based):**
```javascript
producer.processingTimer = recipe.processingTime
producer.maxProcessingTime = recipe.processingTime
```

**New System (Deadline-based):**
```javascript
producer.endTotalMinutes = timeComponent.totalMinutes + recipe.processingTime
producer.baseProductionTime = recipe.processingTime
producer.lastReductionDay = timeComponent.day
```

The new system is more efficient and supports off-ship production tracking.
