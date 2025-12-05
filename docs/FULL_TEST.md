# Complete Game Testing Guide

This document provides a comprehensive testing checklist for all implemented game systems. Use this to verify functionality after changes or to understand how each system works.

---

## Table of Contents

1. [Starting the Game](#1-starting-the-game)
2. [Basic Movement & Controls](#2-basic-movement--controls)
3. [Time System](#3-time-system)
4. [Sleep System](#4-sleep-system)
5. [Inventory System](#5-inventory-system)
6. [Equipment System](#6-equipment-system)
7. [Survival Stats](#7-survival-stats)
8. [Body Parts & Healing](#8-body-parts--healing)
9. [Ship Resources](#9-ship-resources)
10. [Producer System (Hydroponics)](#10-producer-system-hydroponics)
11. [Skill System](#11-skill-system)
12. [Combat System](#12-combat-system)
13. [Lighting System](#13-lighting-system)
14. [Tool System](#14-tool-system)
15. [Expedition System](#15-expedition-system)
16. [Interactables](#16-interactables)
17. [Console Testing](#17-console-testing)

---

## 1. Starting the Game

### How to Start
```bash
npm start
```

### What to Check
- ✅ Game loads without errors in browser console (F12)
- ✅ Player spawns at starting position on ship map
- ✅ HUD displays correctly (top: stats, side: time/day)
- ✅ All systems initialize (check console for "System initialized" messages)

### Expected Starting State
- **Location:** Ship interior (hardcoded map)
- **Time:** Day 1, 0000 (midnight)
- **Stats:** All at 100%
- **Inventory:** Empty (4 slots available)
- **Equipment:** None equipped

---

## 2. Basic Movement & Controls

### Movement Controls
- **Arrow Keys / WASD:** Move player
- **Numpad (if enabled):** 8-direction movement

### How to Test
1. Move player around ship interior
2. Verify solid tiles block movement (walls, furniture)
3. Test all 8 directions (if diagonal movement enabled)

### What to Check
- ✅ Player character (@) moves smoothly
- ✅ Walls and solid interactables block movement
- ✅ Movement doesn't cause screen tearing or visual glitches
- ✅ Camera follows player correctly

### Interaction Controls
- **E:** Interact with object in facing direction
- **I:** Open inventory
- **C:** View equipment and skills
- **ESC:** Close menus

---

## 3. Time System

### How It Works
- **Real Time to Game Time:** 6 real seconds = 1 game minute
- **Display Format:** 24-hour clock (e.g., "0845", "2130")
- **Day Tracking:** Starts at Day 1, increments at midnight (0000)

### How to Test
1. **Watch time progression:**
   - Note current time in HUD
   - Wait 6 real seconds
   - Time should advance by 1 game minute

2. **Verify midnight crossing:**
   - Use console: `player.getComponent('TimeComponent').totalMinutes = 1435` (23:55)
   - Wait for time to cross 0000
   - Day should increment from 1 to 2

3. **Check day tracking:**
   - Console: `player.getComponent('TimeComponent').day`
   - Should match displayed day

### What to Check
- ✅ Time advances at correct rate (1 min per 6 real seconds)
- ✅ Time displays correctly in HUD (top-right)
- ✅ Day increments at 0000 (midnight)
- ✅ Day resets to Day 1 at 0000 on first day start
- ✅ Hours wrap correctly (23:59 → 00:00)

### Console Commands
```javascript
// Get current time
player.getComponent('TimeComponent').totalMinutes
player.getComponent('TimeComponent').day

// Set time (0-23 hours, 0-59 minutes)
player.getComponent('TimeComponent').hours = 12
player.getComponent('TimeComponent').minutes = 30

// Skip to specific day
player.getComponent('TimeComponent').totalMinutes = 1440 * 5 // Day 6 at 0000
```

---

## 4. Sleep System

### Location
Bed interactable on ship (position varies by map)

### Sleep Options
| Duration | Rest Restored | Special Bonus |
|----------|---------------|---------------|
| 1 hour   | 10%          | None |
| 4 hours  | 40%          | None |
| 8 hours  | 100%         | +1% healing to ALL body parts |

### How to Test
1. **Find the bed** (usually marked with 'b' symbol)
2. **Face the bed and press E**
3. **Select sleep duration**
4. **Observe effects:**
   - Screen fades to black briefly
   - Time advances by selected hours
   - Rest stat increases
   - Hunger decreases (~6.67% per hour)
   - Body parts heal slightly

### What to Check
- ✅ Menu shows 3 sleep options
- ✅ Cannot sleep during combat
- ✅ Time instantly skips forward (no real-time waiting)
- ✅ Rest stat increases correctly (10%/40%/100%)
- ✅ Hunger decreases during sleep
- ✅ Body parts heal during sleep
- ✅ 8-hour sleep gives bonus healing (+1% to all parts)
- ✅ Screen fade effect works (black → normal)
- ✅ Wake-up message appears

### Midnight Crossing During Sleep
1. Sleep from 2300 (11 PM) for 8 hours
2. Should wake at 0700 (7 AM) next day
3. Day should increment
4. Producer reductions should apply (if any producers active)

### Console Verification
```javascript
// Check rest before sleep
player.getComponent('CreatureStatsComponent').rest

// Sleep for 8 hours via console
timeSystem.startSleep(world, player, 8)

// Verify rest after
player.getComponent('CreatureStatsComponent').rest // Should be 100
```

---

## 5. Inventory System

### How to Access
- Press **I** to open inventory

### Inventory Limits
- **Slots:** 4 base slots (some items take 0.5 slots)
- **Weight:** 3000g soft cap, 4500g hard cap
- **Overencumbrance:** Penalties above 3000g

### How to Test
1. **Pick up items:**
   - Find items on ground (look for symbols)
   - Face item and press E
   - Select "Pick up" from menu

2. **Drop items:**
   - Open inventory (I)
   - Select item
   - Choose "Drop"

3. **Test weight limits:**
   - Pick up heavy items until over 3000g
   - Verify penalties apply (check comfort stat)
   - Try to pick up more items when at 4500g (should fail)

### What to Check
- ✅ Inventory shows all carried items with quantities
- ✅ Slot count updates correctly (0.5 slot items count properly)
- ✅ Weight displays and updates in real-time
- ✅ Items stack properly (e.g., multiple seeds stack)
- ✅ Cannot pick up items when at hard cap (4500g)
- ✅ Overencumbrance penalties apply:
  - Comfort -10 per 500g over 3000g
  - Combat movement reduced
  - Dodge disabled

### Console Commands
```javascript
// Check inventory
inv = player.getComponent('InventoryComponent')
inv.items // Map of all items
inv.getCurrentWeight() // Current weight in grams

// Check if overencumbered
inv.getOverencumbranceAmount() // > 0 means over limit
```

---

## 6. Equipment System

### How to Access
- Press **C** to view equipment and skills

### Equipment Slots
- **Hand:** Weapons
- **Body:** Armor
- **Tool 1:** Utility items (torch, medkit)
- **Tool 2:** Utility items

### How to Test
1. **Equip items:**
   - Pick up a weapon/armor/tool
   - Open inventory (I)
   - Select item
   - Choose "Equip to [Slot]"

2. **Unequip items:**
   - Open equipment (C)
   - Select equipped item
   - Choose "Unequip"

3. **Verify bonuses:**
   - Equip torch → light radius increases
   - Equip armor → check body part protection
   - Equipped items weigh 0g (not counted in inventory weight)

### What to Check
- ✅ Equipment screen shows all 4 slots
- ✅ Skills display below equipment
- ✅ Can equip appropriate items to each slot
- ✅ Can unequip items back to inventory
- ✅ Equipped items don't count toward weight limit
- ✅ Equipment bonuses apply immediately
- ✅ Tool-based light sources work when equipped

---

## 7. Survival Stats

### Stat Overview
| Stat | Range | Purpose |
|------|-------|---------|
| **Hunger** | 0-100% | Decreases ~6.67% per hour, need to eat |
| **Rest** | 0-100% | Decreases over time, restored by sleep |
| **Stress** | 0-100% | Affected by comfort, combat, events |
| **Comfort** | 0-100% | Affected by temperature, encumbrance |

### How to Test

#### Hunger
1. Note starting hunger (100%)
2. Wait for 1 game hour (6 real minutes at 1x speed)
3. Hunger should decrease by ~6.67%
4. After 12 game hours, should be at ~20%

**Console test:**
```javascript
// Fast-forward time
player.getComponent('TimeComponent').addMinutes(720) // 12 hours
// Check hunger
player.getComponent('CreatureStatsComponent').hunger
```

#### Rest
1. Stay awake for extended periods
2. Rest decreases gradually
3. Sleep to restore (see Sleep System section)

#### Stress
1. Get into combat → stress increases
2. Low comfort → stress increases
3. Over time with high comfort → stress decreases

#### Comfort
1. Normal state: 100%
2. Carry over 3000g → comfort penalty (-10 per 500g over)
3. Check comfort in HUD (should update in real-time)

### What to Check
- ✅ All stats display in HUD (top area)
- ✅ Stats update in real-time
- ✅ Hunger depletes automatically over time
- ✅ Stats can't go below 0 or above 100
- ✅ Color coding works (green = good, yellow = warning, red = critical)

---

## 8. Body Parts & Healing

### Body Parts
- Head
- Torso
- Left Arm
- Right Arm
- Left Leg
- Right Leg

### Natural Healing
- **Base Rate:** 2% per day (~0.083% per hour)
- **Medical Skill Bonus:** +1% per skill level
- **8-Hour Sleep Bonus:** +1% extra to all parts

### How to Test

1. **Damage body parts (via combat or console):**
   ```javascript
   bodyParts = player.getComponent('BodyPartsComponent')
   bodyParts.parts.set('head', 50) // Damage head to 50%
   ```

2. **Wait for healing:**
   - Natural healing: 2% per day
   - With Medical 3: 5% per day (2% base + 3% skill)

3. **Sleep for bonus healing:**
   - Sleep 8 hours → all parts heal +1% (on top of hourly healing)

4. **Verify healing triggers skill:**
   - If you heal naturally, `hasHealedToday` flag should set
   - Medical skill has chance to level up

### What to Check
- ✅ Body parts show efficiency percentage (0-100%)
- ✅ Damaged parts heal over time
- ✅ Healing rate increases with Medical skill
- ✅ 8-hour sleep grants bonus healing
- ✅ Fully healed parts (100%) don't heal further
- ✅ Medical skill can level up from natural healing

### Console Commands
```javascript
// View body parts
bodyParts = player.getComponent('BodyPartsComponent')
for (let [part, eff] of bodyParts.parts) {
    console.log(`${part}: ${eff}%`)
}

// Damage a part
bodyParts.parts.set('head', 50)

// Heal a part
bodyParts.heal('head', 10)
```

---

## 9. Ship Resources

### Resources
- **Water:** 100L max (consumed 0.1L per hour)
- **Fuel:** 100 max (for future expedition travel)

### Display Location
Bottom-left HUD (only visible on ship map)

### How to Test

1. **Verify resource display:**
   - Check bottom-left for water/fuel bars
   - Should show current/max values

2. **Water consumption:**
   - Note starting water level
   - Wait 10 game hours
   - Water should decrease by 1L (0.1L/hour)

3. **Sleep water consumption:**
   - Sleep for 8 hours
   - Water decreases by 0.8L

4. **Off-ship behavior:**
   - Start an expedition (use airlock)
   - Resource bars should disappear (no ship entity on expedition map)

### What to Check
- ✅ Water/fuel display shows correct values
- ✅ Water decreases over time (0.1L per hour)
- ✅ Water consumed during sleep
- ✅ Resources only show when on ship map
- ✅ Resource bars disappear during expeditions

### Console Commands
```javascript
// Get ship entity
ship = world.query(['ShipComponent'])[0]
shipComp = ship.getComponent('ShipComponent')

// Check resources
shipComp.water
shipComp.fuel

// Modify resources
shipComp.addWater(50)
shipComp.consumeWater(10)
```

---

## 10. Producer System (Hydroponics)

### How It Works (NEW DEADLINE-BASED SYSTEM)
1. **Plant seeds:** Calculates end date/time using base recipe time (NO skill applied)
2. **At midnight (0000):** Reduces end time by `(baseTime × 2% × farming_skill_level)`
3. **On interaction:** Checks current time vs end time to determine if ready

### Location
Hydroponics Bay on ship (usually marked with 'H')

### Available Crops
| Crop | Growth Time | Yield | Seed Return |
|------|-------------|-------|-------------|
| Lettuce | 2.5 days | 2-3 | 30% base |
| Rice | 10 days | 6-9 | 90% base |
| Strawberry | 4.5 days | 4-5 | 10% base |
| Tomato | 7.5 days | 3-5 | 40% base |
| Soybeans | 5 days | 4-6 | 90% base |

### How to Test

#### 1. Planting
1. **Get seeds** (console or find in world)
2. **Approach hydroponics bay** and press E
3. **Select crop to plant**
4. Seeds removed from inventory
5. Production starts with calculated end time

#### 2. Check Growth
1. **Interact with bay while growing**
2. Should show: "Growing [crop]. Roughly X hours left."
3. Hours should decrease as time passes

#### 3. Midnight Reduction (NEW SYSTEM)
1. **Plant soybeans at 1000 on Day 1** (120 hours base)
2. **Note:** With Farming 0, no reduction
3. **Wait for midnight (0000 on Day 2)**
4. **With Farming 3:** Reduces by 120 × 0.06 = 7.2 hours
5. **End time moves earlier by 7.2 hours**
6. Each subsequent midnight applies reduction again

#### 4. Off-Ship Reduction
1. **Plant crop on Day 1**
2. **Leave ship** (via airlock)
3. **Advance time to Day 3+** (multiple days away)
4. **Return to ship**
5. Only **ONE reduction** applied (not per day away)
6. Represents lack of tending while gone

#### 5. Harvesting
1. **Wait until current time ≥ end time**
2. **Interact with bay**
3. State changes to "ready"
4. Select "Collect"
5. Receive outputs (crops + possible seeds)

### Farming Skill Effects
- **Daily Reduction:** 2% × skill level of base time (applied at midnight)
- **Seed Return Bonus:** +2% per level to secondary outputs
- **Example with Farming 5:**
  - Soybeans (120 hours): -12 hours each midnight
  - Seed chance: 90% + 10% = 100% guaranteed

### What to Check
- ✅ Can plant seeds when bay is empty
- ✅ Seeds consumed from inventory
- ✅ Growth time shown when interacting
- ✅ Time remaining decreases as time passes
- ✅ Midnight crossing applies skill reduction
- ✅ Off-ship returns only apply ONE reduction
- ✅ Can harvest when time ≥ end time
- ✅ Outputs generated with correct quantities
- ✅ Secondary outputs (seeds) have correct chance
- ✅ Farming skill increases seed return rate
- ✅ Bay resets to empty after collection
- ✅ Farming skill can level up from harvesting

### Console Commands
```javascript
// Find hydroponics bay
producers = world.query(['ProducerComponent'])
hydro = producers[0].getComponent('ProducerComponent')

// Check state
hydro.state // 'empty', 'processing', or 'ready'
hydro.endTotalMinutes // When crop finishes
hydro.baseProductionTime // Base recipe time
hydro.lastReductionDay // Last day reduction applied

// Add seeds to inventory (for testing)
// (Requires finding item entity first - see Console Testing section)

// Fast-forward to midnight
timeComp = player.getComponent('TimeComponent')
timeComp.totalMinutes = 1440 * 2 // Day 2 at 0000

// Check if reduction applied
hydro.lastReductionDay // Should update to current day
```

---

## 11. Skill System

### Skills
1. **Medical** - Increases natural healing (+1%/day per level)
2. **Cooking** - Unlocks advanced recipes
3. **Farming** - Affects producer growth (see section 10)
4. **Repair** - Allows fixing broken items

### Level Caps
- **Natural Cap:** Most skills cap at Level 3 naturally
- **Advanced Levels:** Require tools/terminals/books

### How to Test

#### Medical Skill
1. **Damage body parts:**
   ```javascript
   bodyParts = player.getComponent('BodyPartsComponent')
   bodyParts.parts.set('head', 50)
   ```

2. **Wait 24 hours for natural healing**
3. `hasHealedToday` flag sets
4. Medical has chance to level up

5. **Verify bonus:**
   - Level 0: 2% healing per day
   - Level 1: 3% healing per day
   - Level 3: 5% healing per day

#### Farming Skill
1. **Plant and harvest crops**
2. Each harvest: chance to level up (max 3 checks/day, 1 level/day)
3. **Verify effects:**
   - Daily reduction: 2% × level
   - Seed bonus: +2% × level

#### Cooking Skill
1. **Cook meals** (when crafting system implemented)
2. Levels up once per day after cooking

#### Repair Skill
1. **Repair broken items**
2. Levels up on successful repair (once per day)

### Stress Penalty
- **High Stress (>60):** All level-up chances halved
- Test by raising stress, then attempting skill checks

### Death Penalty
1. **Die in combat**
2. **2 random skills** selected
3. **Loss chance:** 25% + (level × 10%)
4. Lose 1 level if roll succeeds

### What to Check
- ✅ Skills show in equipment screen (C key)
- ✅ Level-up notifications appear (cyan message)
- ✅ Skill bonuses apply correctly
- ✅ High stress halves level-up chances
- ✅ Daily triggers reset properly
- ✅ Can't level up same skill twice in one day
- ✅ Death penalty can reduce skill levels

### Console Commands
```javascript
// Check skills
skills = player.getComponent('SkillsComponent')
skills.medical
skills.cooking
skills.farming
skills.repair

// Set skill level (for testing)
skills.farming = 5

// Check triggers
skills.triggers.hasHealedToday
skills.triggers.harvestsToday

// Force stress for testing
player.getComponent('CreatureStatsComponent').stress = 70
```

---

## 12. Combat System

### Combat Controls
- **Tab:** Enter combat mode (when enemies nearby)
- **Arrow Keys:** Move during combat (costs AP)
- **A:** Attack enemy in facing direction
- **W:** Wait (end turn, restore AP)

### How to Test

1. **Start expedition:**
   - Use airlock on ship
   - Select location

2. **Find enemy:**
   - Explore procedural map
   - Look for enemy symbols (varies by faction)

3. **Enter combat:**
   - Press Tab when near enemy
   - Turn-based mode activates

4. **Combat actions:**
   - Move toward/away from enemy
   - Attack with equipped weapon
   - Wait to restore AP

5. **Body part targeting:**
   - Attacks target random body parts
   - Check which parts take damage

6. **Death:**
   - HP reaches 0
   - Should show death message
   - (Return to ship not yet implemented)

### What to Check
- ✅ Can enter combat mode (Tab)
- ✅ Turn order displays
- ✅ AP costs work correctly
- ✅ Movement costs AP in combat
- ✅ Attacks deal damage to specific body parts
- ✅ Enemy AI takes turns
- ✅ Can win combat (enemy defeated)
- ✅ Can die in combat
- ✅ Damage types work (kinetic, energy, etc.)

---

## 13. Lighting System

### Light Sources
- **Torch:** Tool that provides light radius
- **Other tools:** May provide different light levels

### How to Test

1. **Find dark area:**
   - Expedition maps have dark zones
   - Ship is always lit

2. **Equip torch:**
   - Pick up torch
   - Equip to Tool 1 or Tool 2

3. **Verify light radius:**
   - Tiles around player should be visible
   - Beyond light radius should be dark

4. **Unequip torch:**
   - Light radius should decrease

### What to Check
- ✅ Dark tiles render correctly (darker color/char)
- ✅ Light radius extends from player
- ✅ Equipping torch increases visible area
- ✅ Unequipping torch reduces visible area
- ✅ Ship map is always fully lit

---

## 14. Tool System

### Tool Slots
- Tool 1
- Tool 2

### Tool Types
- **Light Sources:** Torch, flashlight
- **Medical:** Medkit, trauma kit
- **Utility:** Varies

### How to Test

1. **Equip tools:**
   - Pick up tool items
   - Equip to tool slots

2. **Use tools:**
   - Some tools activate on equip (torch)
   - Some tools use via menu (medkit)

3. **Verify bonuses:**
   - Tools may provide:
     - Light radius
     - Skill bonuses
     - Special abilities

### What to Check
- ✅ Can equip tools to either slot
- ✅ Tool bonuses apply when equipped
- ✅ Tools can be swapped between slots
- ✅ Tools with scripts work correctly

---

## 15. Expedition System

### How It Works
1. **On Ship:** Use airlock (usually at position 8,8)
2. **Select Location:** Choose from available expeditions
3. **Ship state saved** to localStorage
4. **Procedural map generated**
5. **Explore/loot/fight**
6. **(Return not yet implemented)**

### Available Locations
- Asteroid Habitat
- Listening Post
- Dyson Scaffold

### How to Test

1. **Start expedition:**
   - Find airlock on ship (symbol: A, cyan color)
   - Press E to interact
   - Cannot start during combat
   - Select location from menu

2. **Verify map generation:**
   - New procedural map loads
   - Ship map destroyed
   - Player spawns on expedition map

3. **Explore:**
   - Move through rooms
   - Find items/enemies
   - Collect loot

4. **Check ship state persistence:**
   - Ship resources saved to localStorage
   - Time saved
   - Player stats saved

### What to Check
- ✅ Airlock accessible on ship
- ✅ Cannot start expedition during combat
- ✅ Location menu shows all available sites
- ✅ Expedition map generates correctly
- ✅ Ship state persists to localStorage
- ✅ Can explore/loot on expedition
- ✅ Enemies spawn on expedition maps

### Return to Ship
- ✅ **Return to ship implemented via Airlock_Return interactable**
- Available on expedition maps
- Saves ship state before leaving, restores on return

---

## 16. Interactables

### Common Interactables

| Type | Symbol | Script | Location |
|------|--------|--------|----------|
| Door | D | openDoor | Various |
| Bed | b | openSleepMenu | Ship |
| Hydroponics | H | openProducerMenu | Ship |
| Airlock | A | openExpeditionMenu | Ship |
| Chest | C | openContainer | Various |
| Item | * | pickupItem | Various |

### How to Test

1. **Doors:**
   - Face door
   - Press E
   - Door opens/closes

2. **Containers:**
   - Face chest/crate
   - Press E
   - View contents
   - Take items

3. **Items:**
   - Face item on ground
   - Press E
   - Select "Pick up"

### What to Check
- ✅ Can interact with all interactable types
- ✅ Menus display correctly
- ✅ Actions perform as expected
- ✅ Items transfer to/from inventory properly

---

## 17. Console Testing

### Opening Console
- Press **F12** in browser
- Click "Console" tab

### Useful Commands

#### Get Player Reference
```javascript
player = world.query(['PlayerComponent'])[0]
```

#### Time Manipulation
```javascript
// Get time component
timeComp = player.getComponent('TimeComponent')

// View current time
timeComp.hours
timeComp.minutes
timeComp.day
timeComp.totalMinutes

// Set time
timeComp.hours = 14
timeComp.minutes = 30

// Skip to midnight
timeComp.totalMinutes = Math.ceil(timeComp.totalMinutes / 1440) * 1440

// Advance to next day
timeComp.totalMinutes += 1440
```

#### Stats Manipulation
```javascript
// Get stats
stats = player.getComponent('CreatureStatsComponent')

// View stats
stats.hunger
stats.rest
stats.stress
stats.comfort

// Modify stats
stats.hunger = 50
stats.rest = 100
```

#### Inventory Commands
```javascript
// Get inventory
inv = player.getComponent('InventoryComponent')

// View items
inv.items

// Check weight
inv.getCurrentWeight()
```

#### Body Parts
```javascript
// Get body parts
bodyParts = player.getComponent('BodyPartsComponent')

// View all parts
for (let [part, eff] of bodyParts.parts) {
    console.log(`${part}: ${eff}%`)
}

// Damage specific part
bodyParts.parts.set('head', 50)

// Heal specific part
bodyParts.heal('head', 10)
```

#### Skills
```javascript
// Get skills
skills = player.getComponent('SkillsComponent')

// View skills
skills.medical
skills.farming

// Set skill (for testing)
skills.farming = 5

// Check triggers
skills.triggers.hasHealedToday
skills.triggers.harvestsToday
```

#### Producer Testing
```javascript
// Find producers
producers = world.query(['ProducerComponent'])

// Get first producer (hydroponics)
hydro = producers[0].getComponent('ProducerComponent')

// Check state
hydro.state
hydro.endTotalMinutes
hydro.baseProductionTime
hydro.lastReductionDay

// Force state change (testing)
hydro.state = 'ready'
```

#### Ship Resources
```javascript
// Get ship
ship = world.query(['ShipComponent'])[0]
shipComp = ship.getComponent('ShipComponent')

// View resources
shipComp.water
shipComp.fuel

// Modify resources
shipComp.addWater(50)
shipComp.consumeFuel(10)
```

---

## Testing Checklist

Use this quick checklist to verify all major systems:

### Core Systems
- [ ] Game starts without errors
- [ ] Time advances correctly (6s = 1 min)
- [ ] Day increments at midnight
- [ ] Sleep system works (all 3 durations)
- [ ] Midnight crossing during sleep

### Survival
- [ ] Hunger depletes over time (~6.67%/hour)
- [ ] Rest decreases, restored by sleep
- [ ] Stress system responds to events
- [ ] Comfort affected by encumbrance
- [ ] Body parts heal naturally (2%/day)

### Inventory & Equipment
- [ ] Can pick up and drop items
- [ ] Weight limits enforce correctly
- [ ] Overencumbrance penalties apply
- [ ] Can equip items to slots
- [ ] Equipped items weigh 0g

### Ship Systems
- [ ] Water depletes over time (0.1L/hour)
- [ ] Ship resources display correctly
- [ ] Resources only show on ship map

### Producer System (NEW)
- [ ] Can plant seeds
- [ ] Growth time displays correctly
- [ ] Midnight reductions apply with farming skill
- [ ] Off-ship returns apply one reduction
- [ ] Can harvest when ready
- [ ] Outputs generated correctly
- [ ] Farming skill affects seed return

### Skills
- [ ] Skills display in equipment screen
- [ ] Medical skill affects healing rate
- [ ] Farming skill affects producers
- [ ] Level-up notifications appear
- [ ] Stress penalty applies (>60 stress)

### Combat
- [ ] Can enter combat mode (Tab)
- [ ] Turn-based combat works
- [ ] AP system functions
- [ ] Body part targeting works
- [ ] Can win/lose combat

### Expeditions
- [ ] Can start expedition from airlock
- [ ] Procedural maps generate
- [ ] Ship state saves to localStorage
- [ ] Can explore expedition maps

### Lighting & Tools
- [ ] Dark areas render correctly
- [ ] Torches provide light radius
- [ ] Tools equip to tool slots

---

## Common Issues & Solutions

### Time Not Advancing
- **Check:** Console for errors
- **Solution:** Verify REAL_SECONDS_PER_GAME_MINUTE constant (should be 6)

### Producers Not Reducing at Midnight
- **Check:** Player farming skill level
- **Check:** lastReductionDay vs current day
- **Solution:** Ensure ProducerSystem is registered in game loop

### Skills Not Leveling Up
- **Check:** Triggers set correctly (hasHealedToday, harvestsToday)
- **Check:** Stress level (<60 for full chance)
- **Solution:** Verify SkillsSystem is registered in game.js (should be fixed)

### Ship Resources Not Displaying
- **Check:** Are you on ship map?
- **Solution:** ShipComponent only exists on 'SHIP' map

### Save/Load System
- **Status:** Basic implementation complete
- **Note:** Inventory and equipment use simplified restoration (items recreated as simple entities)
- **Limitation:** Modular equipment attachments not fully restored on load

---

## Performance Testing

### Recommended Tests
1. **Long Play Session:** Run game for 30+ real minutes
2. **Memory Leaks:** Check browser memory usage over time
3. **Frame Rate:** Monitor FPS during heavy combat
4. **Save/Load:** Verify localStorage persistence

### Performance Metrics
- **Target:** 60 FPS steady
- **Memory:** Should stabilize, not grow continuously
- **Load Time:** < 2 seconds on modern hardware

---

This document should be updated whenever new systems are added or existing systems change significantly.
