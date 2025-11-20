# HUD and Stats System

This document describes the HUD (Heads-Up Display) and player stats system in Scavenger.

## HUD Layout

The HUD is displayed on the right side of the screen and consists of several sections:

### Player Name
At the top of the HUD, the player's name is displayed in yellow.

### Vital Stats Bars
Four horizontal bars displaying the player's vital statistics, arranged in a 2x2 grid:

**Row 1:**
- **Hunger (H)** - Orange bar: Represents the player's hunger level (0-100, where 100 is fully fed)
- **Rest (R)** - Grey bar: Represents the player's rest/energy level (0-100, where 100 is fully rested)

**Row 2:**
- **Stress (S)** - Green bar: Represents the player's stress level (0-100, where 0 is no stress)
- **Comfort (C)** - Blue bar: Represents the player's comfort level (0-100, where 100 is fully comfortable)

All bars can be modified by equipped items and their attached modules. Any modifiers are reflected in the bar display.

### Body Parts Status
Below the vital stats bars, the HUD displays body parts that are damaged (below 100% efficiency). This row only shows body parts when they're damaged - if all body parts are at 100%, this row is empty.

Body parts are simplified into 3 zones:
- **Head**: Head efficiency (10% hit chance in combat)
- **Torso**: Torso/chest efficiency (50% hit chance in combat)
- **Limbs**: Arms and legs combined (40% hit chance in combat)

Each body part is displayed as: `Part: XX%` where XX is the efficiency percentage (0-100).
- **100%** = Full efficiency, not displayed in HUD
- **Below 100%** = Damaged, displayed in HUD with efficiency percentage
- **0%** = Destroyed/missing body part

If equipped items provide bonuses to body part stats, they are shown in parentheses (e.g., `Head: 95% (+5)`).

Note: The system supports adding/removing body parts dynamically for mutations, alien creatures, etc.

### Inventory Status
Below body parts, two lines display inventory information:
- **Weight**: Current carried weight vs maximum weight in grams (e.g., `Weight: 1200g/3000g`)
  - The weight of modular equipment (guns, armour) is the sum of its parts.
  - Guns retain their full weight when equipped.
  - Armour is weightless when equipped.
  - Standard component weights are used for consistency:
    - **Pistol Parts**: Chamber (150g), Barrel (100g), Grip (50g), Mods (100g)
    - **Rifle Parts**: Chamber (300g), Barrel (200g), Grip (100g), Mods (200g)
    - **Armour Parts**: Material (600g), Overlay (250g), Underlay (150g). Material is the heaviest component.
- **Slots**: Current inventory slots used vs total available (e.g., `Slots: 2.5/4`)
  - Regular items consume 1.0 slots
  - Modules/parts consume 0.5 slots
  - Fractional slot usage is displayed with one decimal place

### Area Information
Below inventory, the current area information is displayed:
- **Area Name**: The name of the current location (in yellow)
- **Temperature**: Current temperature in Celsius (in cyan)

### Message Log
At the bottom of the HUD is a scrollable message log showing recent game events and notifications.

## Body Parts System

### BodyPartsComponent

The `BodyPartsComponent` manages body parts for all creatures (player and enemies). It uses a Map structure to store body parts and their efficiency values.

**Key Features:**
- Each body part has an efficiency value from 0 to 100
- 100 = full efficiency (optimal condition)
- 0 = destroyed or missing
- Values in between represent varying levels of damage

**Methods:**
- `getPart(partName)`: Get the efficiency of a specific body part
- `setPart(partName, value)`: Set the efficiency of a body part (clamped to 0-100)
- `damage(partName, amount)`: Reduce a body part's efficiency by a specified amount
- `heal(partName, amount)`: Increase a body part's efficiency by a specified amount
- `addPart(partName, efficiency)`: Add a new body part with specified efficiency
- `removePart(partName)`: Remove a body part (sets efficiency to 0)
- `getDamagedParts()`: Get an array of all body parts below 100% efficiency
- `getAllParts()`: Get an array of all body parts and their efficiencies

### CreatureStatsComponent

The `CreatureStatsComponent` holds vital statistics separate from body parts:
- `hunger`: Hunger level (0-100)
- `rest`: Rest/energy level (0-100)
- `stress`: Stress level (0-100)
- `comfort`: Comfort level (0-100)

## Stat Modifiers

Equipment and their attached modules can modify both vital stats and body part efficiency through the `StatModifierComponent`.

**Example:**
```javascript
// On a module entity
{
    modifiers: {
        hunger: 5,      // Adds 5 to hunger stat
        head: 10,       // Adds 10 to head efficiency
        comfort: 3      // Adds 3 to comfort stat
    }
}
```

**Display:**
- Vital stats bars show the modified value
- Body parts show the modified value with the modifier in parentheses
- Example: `Head: 105% (+5)` means base efficiency is 100%, with +5 from equipment

## Future Combat Integration

The body parts system is designed to support future combat mechanics where:
- Different body parts can be targeted in combat
- Damage to specific body parts affects different capabilities
- Body part efficiency may affect movement, accuracy, carry capacity, etc.
- Destroyed body parts (0% efficiency) may disable specific actions

See `combat_plan.md` for more information on planned combat mechanics.

## Technical Details

### HUD Updates
The `HudSystem` updates the HUD every frame by:
1. Querying for the player entity
2. Reading `CreatureStatsComponent` and `BodyPartsComponent`
3. Getting equipment modifiers from equipped items
4. Calculating display values (base + modifiers, capped at 100)
5. Updating DOM elements with current values

### Equipment Modifiers
The `getEquipmentModifiers()` function aggregates stat modifiers from:
1. All equipped items (hand, body slots)
2. All modules attached to equipped items
3. Returns a combined modifier object with all stat bonuses

### Stat Display Logic
- **Vital Bars**: Always visible, show percentage width based on stat value
- **Body Parts**: Only visible when damaged (< 100%), displayed as text
- **Inventory**: Always visible, shows current/max for weight and slots
- **Modifiers**: Shown in parentheses when non-zero (e.g., `+5`)
