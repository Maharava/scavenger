# Testing Guide: Temperature & Death Systems

**Created:** December 2024
**Systems:** Temperature System, Death System

These two major systems were just implemented and need testing.

---

## 🌡️ TEMPERATURE SYSTEM TESTING

### Overview
The temperature system affects player comfort, stress, and can cause damage in extreme conditions. It uses 3 zones based on how far the current temperature is from your comfort range.

### Your Comfort Range
- **Base Range:** 10°C to 30°C
- **Modified by Armor:** Check your equipped armor's tempMin/tempMax stats
  - tempMin extends cold tolerance (e.g., +10 makes 0°C comfortable)
  - tempMax extends heat tolerance (e.g., +10 makes 40°C comfortable)

### Temperature Zones

| Zone | Condition | Comfort | Stress | Damage |
|------|-----------|---------|--------|--------|
| **Comfortable** | Within range | No penalty | No change | None |
| **Harsh** | 5-15°C outside | -10 | +5 every 5s | None |
| **Extreme** | 15°C+ outside | -25 | +10 every 5s | 5% every 30s |

### How to Test

#### Test 1: Comfortable Zone (No Effects)
1. Start game on ship (temperature: 21°C)
2. Check your stats - should be normal
3. **Expected:** No temperature messages, normal comfort/stress

#### Test 2: Harsh Zone (Penalties)
1. Start an expedition to a location with harsh temperature
   - **Cold example:** Listening Post (18°C with base comfort 10-30°C = harsh)
   - **Hot example:** Custom location with 36°C
2. Wait 5-10 seconds
3. **Expected:**
   - Yellow message: "It's getting cold/hot here"
   - Comfort drops by 10
   - Stress increases by 5 every 5 seconds
   - No damage

#### Test 3: Extreme Zone (Damage)
1. Create a test expedition with extreme temperature:
   - Use console: `game.mapInfo.temperature = -10` (extreme cold)
   - Or: `game.mapInfo.temperature = 50` (extreme heat)
2. Wait for messages
3. **Expected:**
   - Red message: "EXTREME COLD/HEAT! Seek shelter!"
   - Comfort drops by 25
   - Stress increases by 10 every 5 seconds
   - After 30 seconds, take 5% body part damage
   - **Cold damage:** Hits limbs primarily (frostbite)
   - **Heat damage:** Hits torso primarily (core temperature)

#### Test 4: Armor Temperature Protection
1. Equip armor with temperature modifiers
   - Example: Thermal Underlay (tempMin: +15, tempMax: +5)
   - New comfort range: -5°C to 35°C
2. Go to previously harsh/extreme location
3. **Expected:**
   - Zone should improve (extreme → harsh, or harsh → comfortable)
   - Reduced or eliminated penalties

### Console Testing Commands

```javascript
// View current temperature
game.mapInfo.temperature

// Change temperature
game.mapInfo.temperature = -20  // Extreme cold
game.mapInfo.temperature = 50   // Extreme heat
game.mapInfo.temperature = 21   // Comfortable

// Check your comfort range
player = world.query(['PlayerComponent'])[0]
stats = player.getComponent('CreatureStatsComponent')
modifiers = getEquipmentModifiers(world, player)
tempRange = stats.getComfortTempRange(modifiers.tempMin || 0, modifiers.tempMax || 0)
console.log(`Comfort range: ${tempRange.min}°C to ${tempRange.max}°C`)

// Check current zone
world.tempZone  // 'comfortable', 'harsh', or 'extreme'

// View body parts (to see damage)
bodyParts = player.getComponent('BodyPartsComponent')
for (let [part, eff] of bodyParts.parts) {
    console.log(`${part}: ${eff}%`)
}
```

---

## ☠️ DEATH SYSTEM TESTING

### Overview
When the player dies (head or torso destroyed), they lose all expedition items, skills may regress, and they're returned to the ship.

### Death Triggers
- Head efficiency reaches 0%
- Torso efficiency reaches 0%

### Death Consequences
1. **Death message displayed** (3 second duration)
2. **Skill regression** (2 random skills, chance based on level)
3. **Expedition inventory cleared** (all items lost)
4. **Return to ship** (automatic after 3 seconds)
5. **Health restored** (50% all body parts)
6. **Stats restored** (hunger 30%, rest 40%, stress 80%, comfort 30%)

### How to Test

#### Test 1: Death by Combat
1. Start an expedition
2. Find an enemy
3. Enter combat (Tab)
4. Let the enemy kill you (don't attack/dodge)
5. **Expected:**
   - Death message appears when head or torso reaches 0%
   - Message shows: "YOU HAVE DIED", "All expedition items lost", etc.
   - After 3 seconds, returns to ship
   - Body parts restored to 50%
   - Inventory is empty
   - Skills may have decreased (check with 'C' key)

#### Test 2: Death by Temperature
1. Go to extreme temperature location
2. Use console: `game.mapInfo.temperature = -30`
3. Wait ~2-3 minutes (6 cycles of 30-second damage)
4. **Expected:**
   - Body parts take damage every 30 seconds
   - Eventually head or torso reaches 0%
   - Death sequence triggers
   - Return to ship

#### Test 3: Skill Regression
1. Before dying, note your skill levels (press 'C')
2. Use console to set high skills for testing:
   ```javascript
   skills = player.getComponent('SkillsComponent')
   skills.medical = 5
   skills.farming = 5
   skills.cooking = 5
   skills.repair = 3
   ```
3. Die (via combat or console damage)
4. After respawn, check skills again
5. **Expected:**
   - 2 random skills selected
   - Each has chance to lose 1 level:
     - Level 1: 35% chance to drop to 0
     - Level 3: 55% chance to drop to 2
     - Level 5: 75% chance to drop to 4
   - Messages in red showing which skills decreased

#### Test 4: Expedition Item Loss
1. Start expedition
2. Collect several items (find loot on map)
3. Check inventory (press 'I') - note what you have
4. Die
5. After respawn on ship, check inventory again
6. **Expected:**
   - Inventory completely empty
   - All items collected during expedition lost

### Console Testing Commands

```javascript
// Instant death (damage torso to 0)
player = world.query(['PlayerComponent'])[0]
bodyParts = player.getComponent('BodyPartsComponent')
bodyParts.parts.set('torso', 0)
// Death should trigger on next damage event or system update

// Damage to near-death
bodyParts.parts.set('head', 5)  // 5% head
bodyParts.parts.set('torso', 10)  // 10% torso
// One more hit should kill you

// Check skills before/after death
skills = player.getComponent('SkillsComponent')
console.log(`Medical: ${skills.medical}, Cooking: ${skills.cooking}, Farming: ${skills.farming}, Repair: ${skills.repair}`)

// Set high skills for testing regression
skills.medical = 5
skills.farming = 5
skills.cooking = 5
skills.repair = 3

// Manually trigger death (requires damage event)
// Better to take damage in combat or from temperature
```

---

## 🐛 KNOWN LIMITATIONS

### Temperature System
- Temperature is set per-map, not per-tile (no hot/cold zones within one map)
- No visual temperature indicators in HUD (only messages)
- Damage continues even if you can't move (no way to take shelter mid-extreme-zone)

### Death System
- No distinction between "ship inventory" and "expedition inventory" - all items lost
  - Future: Could save ship inventory before expedition, restore on death
- ✅ Enemy corpses spawn with loot (fully implemented)
- 3-second delay may feel too short to read full message

---

## ✅ SUCCESS CRITERIA

**Temperature System Working If:**
- ✅ Zone messages appear when temperature changes
- ✅ Comfort/stress affected by temperature
- ✅ Extreme zones cause body part damage
- ✅ Armor temperature modifiers work
- ✅ `world.tempZone` updates correctly

**Death System Working If:**
- ✅ Death triggers when head or torso reaches 0%
- ✅ Death message displays for 3 seconds
- ✅ Inventory cleared after death
- ✅ Skills can regress (not always, but sometimes)
- ✅ Player returns to ship automatically
- ✅ Health restored to 50% all parts
- ✅ Combat exits cleanly on death

---

## 🏗️ SHIP BUILDING SYSTEM TESTING

### Overview
The ship building system allows you to construct interactable items on your ship using materials. You access the system via the Bridge Console, select buildable items, and place them using a cursor-based placement mode.

### How the System Works
1. **Bridge Console:** Main interface at position (5,1) on the ship
2. **Buildables Menu:** Shows available items with material costs
3. **Placement Mode:** WASD cursor movement with green/red validation
4. **Resource System:** Checks both player inventory and ship cargo

### Buildable Items
Currently available:
- **Hydroponics Bay:** Requires Polymer Resin x3, Basic Electronics x2, Organic Protein x1
  - Grows food from seeds over time
  - Requires water to operate
  - Same functionality as expedition Hydroponics Bay

### How to Test

#### Test 1: Access Bridge Console
1. Start a new game (or clear localStorage: `clearShipState()` in console)
2. Move to the Bridge Console at position (5,1) on the ship
3. Press Space to interact
4. **Expected:**
   - Menu appears with "Build Interactable" option
   - "Build Ship Upgrade (Coming Soon)" option visible
   - "Close" option available

#### Test 2: View Buildables Menu
1. Select "Build Interactable" with Space
2. **Expected:**
   - Menu changes to list available buildables
   - Currently shows "Hydroponics Bay"
   - Navigation with W/S keys works
   - Press D to view details

#### Test 3: Check Material Requirements
1. In Buildables menu, press D to view Hydroponics Bay details
2. **Expected:**
   - Details pane shows on right side
   - Lists all required materials:
     - Polymer Resin x3
     - Basic Electronics x2
     - Organic Protein x1
   - Each material shows ✓ or ✗ based on availability
   - Combined count from player + ship cargo shown
   - Green indicator if you have enough total resources

#### Test 4: Enter Placement Mode
1. With Hydroponics Bay details visible and materials available
2. Press Space to enter placement mode
3. **Expected:**
   - Placement cursor appears at Bridge Console position
   - Cursor shows 'H' character
   - Cursor flashes every 500ms (visible/invisible)
   - Cursor is GREEN (valid placement location)

#### Test 5: Cursor Movement & Validation
1. In placement mode, use WASD to move cursor
2. Try moving into walls ('+' characters)
3. Move to different floor tiles ('.')
4. **Expected:**
   - W/A/S/D moves cursor up/left/down/right
   - Cursor CANNOT move through walls (blocked)
   - Cursor stays within map bounds (clamped to edges)
   - Cursor is GREEN on valid floor tiles
   - Cursor turns RED on invalid locations (occupied tiles, etc.)

#### Test 6: Confirm Placement
1. Position cursor on a valid floor tile (green cursor)
2. Press Space to confirm
3. **Expected:**
   - Confirmation dialog appears
   - Shows "Place Hydroponics Bay here?"
   - Options: "Yes" and "No"
   - Navigate with W/S, confirm with Space

#### Test 7: Successful Placement
1. In confirmation dialog, select "Yes" and press Space
2. **Expected:**
   - Green success message: "Hydroponics Bay placed successfully!"
   - Materials deducted from inventory (player first, then ship)
   - New Hydroponics Bay entity appears on ship at cursor position
   - Character 'H' in green color
   - Can interact with it like normal Hydroponics Bay
   - Placement mode exits, returns to game

#### Test 8: Cancel Placement
1. Enter placement mode again
2. Press Escape key
3. **Expected:**
   - Yellow message: "Placement cancelled."
   - Placement mode exits
   - No materials consumed
   - Returns to normal game mode

#### Test 9: Insufficient Materials
1. Use console to clear inventory/ship cargo
2. Access Bridge Console → Build Interactable → Hydroponics Bay
3. Press D to view details
4. **Expected:**
   - Materials show ✗ (red X) next to items you don't have
   - Space bar does NOT enter placement mode
   - Pressing Space just selects the menu option (no action)

#### Test 10: Resource Deduction Priority
1. Set up test materials:
   ```javascript
   // Player has 2 Polymer Resin, Ship has 1 Polymer Resin
   // Player has 0 Basic Electronics, Ship has 2 Basic Electronics
   // Player has 1 Organic Protein, Ship has 0 Organic Protein
   ```
2. Build Hydroponics Bay
3. After placement, check inventories
4. **Expected:**
   - Polymer Resin: Player loses 2, Ship loses 1 (player first)
   - Basic Electronics: Ship loses 2 (only source)
   - Organic Protein: Player loses 1 (only source)
   - Total deducted correctly: 3, 2, 1

### Console Testing Commands

```javascript
// Check current test materials (added automatically on first load)
player = world.query(['PlayerComponent'])[0]
inventory = player.getComponent('InventoryComponent')
for (let [name, data] of inventory.items) {
    console.log(`Player: ${name} x${data.quantity}`)
}

ship = world.query(['ShipComponent'])[0]
shipComp = ship.getComponent('ShipComponent')
for (let [name, data] of shipComp.cargo) {
    console.log(`Ship: ${name} x${data.quantity}`)
}

// Add materials manually
function addMaterialToPlayer(materialId, quantity) {
    const materialDef = MATERIAL_DATA[materialId]
    const inventory = player.getComponent('InventoryComponent')

    const materialEntity = world.createEntity()
    world.addComponent(materialEntity, new ItemComponent(materialDef.name, materialDef.description || '', materialDef.weight || 0, 0.5))
    world.addComponent(materialEntity, new NameComponent(materialDef.name))
    world.addComponent(materialEntity, new StackableComponent(1, 99))

    inventory.items.set(materialDef.name, { entityId: materialEntity, quantity: quantity })
}

function addMaterialToShip(materialId, quantity) {
    const materialDef = MATERIAL_DATA[materialId]
    const shipComp = ship.getComponent('ShipComponent')

    const materialEntity = world.createEntity()
    world.addComponent(materialEntity, new ItemComponent(materialDef.name, materialDef.description || '', materialDef.weight || 0, 0.5))
    world.addComponent(materialEntity, new NameComponent(materialDef.name))
    world.addComponent(materialEntity, new StackableComponent(1, 99))

    shipComp.cargo.set(materialDef.name, { entityId: materialEntity, quantity: quantity })
}

// Usage:
addMaterialToPlayer('POLYMER_RESIN', 5)
addMaterialToShip('BASIC_ELECTRONICS', 3)

// Clear all materials
inventory.items.clear()
shipComp.cargo.clear()

// Reset to default test materials (requires reload)
clearShipState()  // Then reload page
```

### Initial Test Setup

On first load (no save file), the game automatically provides:
- **Player Inventory:** Polymer Resin x2, Organic Protein x1
- **Ship Cargo:** Polymer Resin x1, Basic Electronics x2

This gives exactly enough to build 1 Hydroponics Bay (3+2+1).

---

## ✅ SUCCESS CRITERIA

**Ship Building System Working If:**
- ✅ Bridge Console is interactable on ship at (5,1)
- ✅ "Build Interactable" menu shows buildables list
- ✅ Buildable details show material costs with ✓/✗ indicators
- ✅ Combined resource checking (player + ship) works correctly
- ✅ Placement mode activates when materials available
- ✅ Cursor flashes green/red based on validity
- ✅ WASD moves cursor, blocked by walls
- ✅ Escape cancels placement
- ✅ Space confirms placement (with confirmation dialog)
- ✅ Resources deducted from correct inventories (player first)
- ✅ Hydroponics Bay placed and fully functional
- ✅ Can build multiple items (if materials available)

---

**Have fun testing! Report any bugs in the GitHub issues.**
