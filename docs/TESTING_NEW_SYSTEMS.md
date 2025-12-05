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
- Enemy corpses don't spawn (player death works, enemy death TODO)
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

**Have fun testing! Report any bugs in the GitHub issues.**
