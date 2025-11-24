# Tool Equipment System - Design Revision 2

**Status:** Design Phase
**Priority:** High
**Complexity:** High (due to new passive systems and combat triggers)

---

## 1. Overview

This document outlines a revised direction for the tool system. Tools are equippable items providing passive bonuses, active utility, or powerful consumable effects. They are distinct from weapons and armor.

**Key Design Principles:**
- **Two Tool Slots:** Players have two dedicated tool slots (`tool1`, `tool2`).
- **One Backpack Slot:** Players have one dedicated backpack slot (`backpack`).
- **Passive & Active Roles:** Tools can grant passive stat/skill boosts, provide information, or be actively used for a specific effect.
- **Consumable Tools:** Some tools have limited uses and are consumed upon depletion.
- **Weight Management:** Tools have weight, but it's reduced by 50% when equipped, encouraging their use over being carried in inventory.

---

## 2. Component Architecture

To support the new tool types, the component structure will be updated.

### ToolComponent
Marks an item as a tool and defines its core nature.

```javascript
class ToolComponent {
    constructor(toolType, uses = -1, maxUses = -1) {
        this.toolType = toolType;   // 'passive', 'consumable', 'light'
        this.uses = uses;           // Current uses remaining (-1 for infinite)
        this.maxUses = maxUses;     // Max uses for display (e.g., 5/5)
    }
}
```

### ToolStatsComponent
Holds all passive and active effects of the tool.

```javascript
class ToolStatsComponent {
    constructor(stats = {}) {
        // Passive Boosts
        this.skillBoosts = stats.skillBoosts || {}; // e.g., { medical: 1, repair: 1 }
        this.statBoosts = stats.statBoosts || {}; // e.g., { maxWeightPct: 20, inventorySlots: 4 }

        // Light Source
        this.lightRadius = stats.lightRadius || 0;

        // Special Ability / Effect
        this.specialAbility = stats.specialAbility || null; // e.g., 'reveal_enemies', 'use_medkit'
        this.abilityArgs = stats.abilityArgs || {}; // Arguments for the ability
    }
}
```

---

## 3. New Tool Definitions

The previous tool list is deprecated, except for light sources. The new tools are:

### Category 1: Light Sources (Unchanged)
- **Torch, Flashlight, Glow Stick:** These function as before, providing a passive light source when equipped.

### Category 2: Consumable Tools
These tools have a limited number of uses and provide powerful, immediate effects.

#### Adrenal Spiker
- **Type:** Consumable (3 uses)
- **Effect:** Can be used at the start of combat to gain **+2 Initiative**.
- **Implementation:** A new UI button or hotkey will appear at the start of combat if this is equipped. Triggers an action that modifies the player's initiative roll for that combat.

#### Chaff-Spitter
- **Type:** Consumable (5 uses)
- **Effect:** Automatically triggers the *first time* the player is targeted by an attack each turn. Reduces the accuracy of **all** attacking enemies by **30%** for that round.
- **Implementation:** Requires a new system to hook into `ActionResolutionSystem`. Before an enemy's `calculateHitChance` is resolved against the player, this system checks if it's the first time the player has been targeted this round. If so, it applies a temporary global debuff and consumes one use.

### Category 3: Passive Boost Tools
These tools provide benefits simply by being equipped.

#### Mini Doc
- **Type:** Passive
- **Effect:** Grants **+1 Medical** skill while equipped.

#### Soil Tester
- **Type:** Passive
- **Effect:** Grants **+1 Farming** skill while equipped.

#### Analyzer
- **Type:** Passive
- **Effect:** Grants **+1 Medical** and **+1 Repair** skill while equipped.

#### Multi-tool
- **Type:** Passive
- **Effect:** Grants **+1 Repair** skill while equipped.

#### Sample Kit
- **Type:** Passive
- **Effect:** Grants **+1 Medical** skill and **+2 inventory slots** while equipped.

#### Utility Belt
- **Type:** Passive
- **Effect:** Grants **+4 inventory slots** while equipped.

#### Grav Ball
- **Type:** Passive
- **Effect:** Increases maximum carry weight by **+20%** while equipped.

#### Motion Tracker
- **Type:** Passive
- **Effect:** Reveals enemies within **25 tiles**, ignoring Line of Sight, Fog of War, and darkness. Each enemy entering the radius has a **20% chance to *not* be revealed**.


### Category 4: Storage Tools
These tools primarily expand the player's inventory capacity.

#### Lightweight Pack
- **Type:** Passive
- **Effect:** Grants **+5 inventory slots** while equipped.
- **Weight:** 500g (250g equipped)

#### Small Pack
- **Type:** Passive
- **Effect:** Grants **+2 inventory slots** while equipped.
- **Weight:** 300g (150g equipped)

#### Duffel Bag
- **Type:** Passive
- **Effect:** Grants **+10 inventory slots** while equipped.
- **Weight:** 1500g (750g equipped)

#### Explorer's Pack
- **Type:** Passive
- **Effect:** Grants **+15 inventory slots** while equipped.
- **Weight:** 2000g (1000g equipped)

---

## 4. Inventory Overflow Mechanic

When unequipping a tool that provides inventory slots (Utility Belt, Sample Kit), the player's inventory capacity may decrease. If the number of used slots now exceeds the new capacity, items must be dropped.

### Logic Flow
1. Player unequips a slot-providing tool.
2. The `unequip_tool` action calculates the `newCapacity` and `currentUsage`.
3. If `currentUsage > newCapacity`, calculate the `overflow = currentUsage - newCapacity`.
4. The system iterates through the player's inventory, creating a flat list of all items (stacks are treated as individual items for this purpose).
5. It then **randomly** selects items from this list and drops them on the ground at the player's position.
6. This process repeats until the `currentUsage` is less than or equal to the `newCapacity`. The system should be smart enough to drop items whose total slots meet or exceed the overflow, rather than dropping one at a time. It may drop an item that results in being under the overflow (e.g., if 1.5 slots are overflowed, a 2.0-slot item might be dropped).

---

## 5. Implementation Plan

### Phase 1: Components & Data
- Update `ToolComponent` and `ToolStatsComponent`.
- Create `gamedata/tools.js` with all the new tool definitions.
- Implement a helper function `getModifiedStats(world, player)` that aggregates all passive boosts from equipped tools for skills, weight, and slots.

### Phase 2: Passive Systems
- Modify the `TimeSystem` to use `getModifiedStats()` for the Medical skill bonus.
- Modify the inventory display and `canAddItem` checks to use `getModifiedStats()` for capacity changes (Utility Belt, Grav Ball, Sample Kit).
- Create a `MotionTrackerSystem` to handle the enemy reveal logic.

### Phase 3: Active & Consumable Systems

- **Adrenal Spiker:**
    - Add a trigger/UI element at the start of combat (`CombatSystem`).
    - Create a `use_adrenal_spiker` action that modifies the player's initiative roll.
- **Chaff-Spitter:**
    - Create a `ChaffSystem` that runs before `ActionResolutionSystem`.
    - It will need to check if the player is being targeted and if the effect has already triggered this round. This may require adding a `isTargetedThisRound` flag to the player's `CombatantComponent`.

### Phase 4: Inventory Overflow
- In `handlers/menu-actions.js`, update the `unequip_tool` (or generic `unequip_item`) action.
- Add the logic to check for overflow and randomly drop items from inventory. Ensure a message is displayed informing the player what was dropped.

### Phase 5: Testing & Polish
- Test each tool's functionality individually.
- Test tool combinations (e.g., two skill-boosting items).
- Rigorously test the inventory overflow to ensure it is working as expected and not causing crashes.
- Test the new combat triggers for Adrenal Spiker and Chaff-Spitter.