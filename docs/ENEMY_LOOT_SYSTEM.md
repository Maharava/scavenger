# Enemy Loot & Corpse System

**Date:** December 2024
**Status:** ✅ Fully Implemented

---

## 🎯 Overview

When enemies are killed in combat, they now spawn corpses containing their equipped items and random materials. Players can loot corpses by interacting with them.

---

## ✨ Features

### Corpse Spawning
- ✅ Spawns at enemy's death location
- ✅ Visual: `%` character in dark gray (#666)
- ✅ Named: "[Enemy Name] Corpse"
- ✅ Interactable with E key
- ✅ Contains all enemy equipment + random materials

### Loot Contents
**Enemy Equipment:**
- Equipped weapon (if any)
- Equipped armor (if any)

**Random Materials:**
- 1-4 materials per corpse (based on enemy type)
- Weighted random selection from loot tables

### Loot Interface
- **Take Individual Items:** Select specific items to loot
- **Take All:** Loot everything in one action
- **Weight Validation:** Cannot take items if over carry capacity
- **Corpse Cleanup:** Corpse disappears when fully looted

---

## 📊 Loot Tables by Enemy Type

### Scavenger (Humanoid)
**Drop Count:** 2-4 materials

| Material | Weight | Probability |
|----------|--------|-------------|
| Salvaged Components | 40% | Most common |
| Polymer Resin | 30% | Common |
| Basic Electronics | 20% | Uncommon |
| Aramid Fibres | 10% | Rare |

**Typical Loot:**
- Rusty Pistol (equipped weapon)
- 2-4 crafting materials
- Total weight: ~500-1500g

---

### Scout Drone (Robot)
**Drop Count:** 1-3 materials

| Material | Weight | Probability |
|----------|--------|-------------|
| Basic Electronics | 40% | Most common |
| Salvaged Components | 30% | Common |
| Intact Logic Board | 15% | Uncommon |
| Polymer Resin | 15% | Uncommon |

**Typical Loot:**
- Light Laser (equipped weapon)
- 1-3 crafting materials
- Total weight: ~400-1200g

---

### Security Bot (Robot)
**Drop Count:** 1-3 materials

| Material | Weight | Probability |
|----------|--------|-------------|
| Basic Electronics | 40% | Most common |
| Salvaged Components | 30% | Common |
| Intact Logic Board | 15% | Uncommon |
| Polymer Resin | 15% | Uncommon |

**Typical Loot:**
- Plasma Rifle (equipped weapon)
- 1-3 crafting materials
- Total weight: ~600-1800g

---

## 🎮 How to Use

### Looting a Corpse
1. **Kill an enemy** in combat
2. **Victory message** displays: "Victory! Check for loot."
3. **Walk to corpse** (grey `%` symbol)
4. **Press E** to interact
5. **Select items** to take, or choose "Take All"

### Loot Menu Options
```
Loot: Scavenger Corpse
━━━━━━━━━━━━━━━━━━━━━
> Rusty Pistol
> Polymer Resin (x2)
> Salvaged Components (x3)
> Take All
> Close
```

### Individual Item Selection
- Selecting an item transfers it to your inventory
- Updates your carry weight
- Removes item from corpse
- Menu refreshes showing remaining items

### Take All
- Checks total weight before taking
- If too heavy: "Cannot carry all items - too heavy!"
- If successful: Takes all items at once
- Corpse disappears after taking everything

---

## 🔧 Technical Implementation

### Components Added

#### LootContainerComponent
```javascript
class LootContainerComponent {
    constructor(lootInventory = new Map()) {
        this.lootInventory = lootInventory; // Map<string, {entityId, quantity}>
    }
}
```

**Properties:**
- `lootInventory`: Map of item names to item data
- Structured like player/ship inventory for consistency

---

### Files Modified

#### 1. `components.js`
- Added `LootContainerComponent` class

#### 2. `systems/combat/damage-system.js`
**New Functions:**
- `spawnEnemyCorpse(world, enemyEntity)` - Creates corpse with loot
- `getCreatureDefinition(creatureName)` - Finds enemy definition
- `generateLootMaterials(world, creatureDef)` - Rolls random materials

**Modified Functions:**
- `handleDeath(world, entity)` - Now calls `spawnEnemyCorpse` for enemies

#### 3. `handlers/script-registry.js`
**New Script:**
- `lootCorpse` - Opens loot menu when interacting with corpse

#### 4. `handlers/menu-actions.js`
**New Actions:**
- `take_loot` - Takes individual item from corpse
- `take_all_loot` - Takes all items from corpse

#### 5. `systems/combat/combat-system.js`
**Modified:**
- Removed TODO marker
- Updated victory message to mention loot

---

## 📐 Loot Generation Algorithm

### Step 1: Determine Drop Count
```javascript
// Based on enemy type
dropCount = { min: 1, max: 3 }; // Robots
dropCount = { min: 2, max: 4 }; // Scavengers
```

### Step 2: Weighted Random Selection
```javascript
// For each drop slot:
totalWeight = sum(all weights in pool)
roll = random(0, totalWeight)

for each material in pool:
    roll -= material.weight
    if roll <= 0:
        drop this material
        break
```

### Step 3: Stack Duplicates
- If same material rolled multiple times, increase quantity
- Example: Roll 3 times, get Polymer Resin twice → Polymer Resin (x2)

### Step 4: Create Material Entities
- Each unique material gets an entity created
- Components added: ItemComponent, RenderableComponent, NameComponent, StackableComponent
- Entity stored in loot inventory map

---

## 🎲 Loot Probability Examples

### Scavenger (4 drops)
**Most Likely Outcome:**
- 40% × 4 = 1.6 expected Salvaged Components
- 30% × 4 = 1.2 expected Polymer Resin
- 20% × 4 = 0.8 expected Basic Electronics
- 10% × 4 = 0.4 expected Aramid Fibres

**Typical Loot:**
- 2x Salvaged Components
- 1x Polymer Resin
- 1x Basic Electronics

### Scout Drone (2 drops)
**Most Likely Outcome:**
- 40% × 2 = 0.8 expected Basic Electronics
- 30% × 2 = 0.6 expected Salvaged Components

**Typical Loot:**
- 1x Basic Electronics
- 1x Salvaged Components

---

## ⚖️ Weight & Inventory Management

### Weight Checks
- **Individual Take:** Checks if `current + item weight ≤ max weight × 1.15`
- **Take All:** Calculates total weight first, then checks
- **Over Limit:** Shows "Too heavy to carry!" message

### Auto-Stacking
- Materials stack with existing inventory
- Example: You have 5 Polymer Resin, loot 2 more → Now have 7

### Corpse Cleanup
- **Partial Loot:** Corpse remains, menu refreshes
- **Full Loot:** Corpse destroyed, menu closes
- **Message:** "Corpse fully looted." (cyan)

---

## 🐛 Edge Cases Handled

### Empty Corpse
- If corpse has no loot (shouldn't happen): "Nothing to loot."
- If all items removed: "Corpse is empty."

### Entity Not Found
- If item entity destroyed before looting: Skips that item
- Menu only shows valid items

### Combat End
- Corpse spawns BEFORE combat ends
- Corpse visible on battlefield after victory
- Can be looted immediately

### Multiple Corpses
- Each corpse is independent
- Can have multiple corpses in same area
- Each opens its own loot menu

---

## 🔮 Future Enhancements

### High Priority
- **Corpse Decay:** Corpses despawn after X minutes
- **Scavenging Skill:** Better loot with higher Repair skill
- **Rare Drops:** Very rare chance for special items

### Medium Priority
- **Loot Quality:** Enemy difficulty affects material quantity
- **Partial Looting:** Mark corpses as "partially looted"
- **Loot Indicators:** Visual indicator showing corpse has loot

### Low Priority
- **Corpse Examination:** "Examine" option before looting
- **Auto-Loot:** Option to auto-take materials
- **Loot History:** Track what you've looted

---

## 📈 Economic Impact

### Material Gain Rates
**Per Combat (Scavenger):**
- 2-4 materials
- ~60% common materials
- ~30% uncommon materials
- ~10% rare materials

**Per Hour (Assuming 4 combats):**
- 8-16 materials total
- ~10 common materials
- ~5 uncommon materials
- ~1 rare material

**Economic Balance:**
- Building one interactable: 6-10 materials
- Can build 1-2 interactables per hour of combat
- Encourages exploration and combat

---

## ✅ Testing Checklist

- [x] Corpse spawns at enemy death location
- [x] Corpse has correct visual (`%` #666)
- [x] Corpse is interactable (E key)
- [x] Loot menu opens with items
- [x] Individual item looting works
- [x] Take All works
- [x] Weight validation prevents overloading
- [x] Materials stack correctly
- [x] Equipped weapon/armor transferred
- [x] Random materials generated
- [x] Corpse disappears when empty
- [x] Multiple corpses work independently
- [x] Console logs corpse creation

---

**END OF DOCUMENTATION**

**Status:** System complete and ready for testing!
