# Next Steps & Simplification Suggestions

## Completed Phase 1: Armor Foundation
✅ Bug fix: menu.submenu → menu.submenu1
✅ ArmourStatsComponent with durability and resistances
✅ Body part hit distribution system (weighted random)
✅ Temperature effects design document
✅ Armor stat calculation from components
✅ Workbench durability restriction (<80%)
✅ Updated armor modules with proper stats

---

## Next Steps for Combat System

### Phase 2: Basic Damage System (Immediate Priority)
**Goal**: Enable damage dealing and taking

1. **Create DamageComponent** (temporary event component)
   - `amount`: Base damage value
   - `damageType`: kinetic/energy/toxin/radiation
   - `sourceEntityId`: Who/what caused the damage
   - `targetBodyPart`: Optional specific body part (null = random)

2. **Create DamageSystem**
   ```
   For each entity with DamageComponent:
     1. Get target's armor (if equipped)
     2. Calculate resistance reduction
     3. Apply damage to armor durability
     4. Roll for passthrough (based on armor %)
     5. If passthrough: damage body part
     6. Remove DamageComponent
   ```

3. **Test Damage with Console Command**
   - Add debug key (e.g., 'T') to apply test damage
   - Verify armor absorption works
   - Verify body part damage distribution
   - Verify armor durability decreases

### Phase 3: Temperature System
**Goal**: Make environment affect player

1. **Create TemperatureSystem**
   - Check area temperature vs comfortable range
   - Apply stress/comfort changes over time
   - Apply damage in extreme conditions
   - Use weighted body part selection for cold/heat

2. **Update HudSystem**
   - Show temperature warnings
   - Display comfort range (modified by armor)
   - Visual indicators (blue tint for cold, orange for heat)

3. **Testing**
   - Change map temperature to extremes
   - Verify armor temperature mods work
   - Test damage from prolonged exposure

### Phase 4: Weapons & Combat Actions
**Goal**: Player can deal damage

1. **Add WeaponStatsComponent**
   - Calculate from gun modules
   - `baseDamage`, `damageType`, `accuracy`, etc.

2. **Create AttackActionComponent**
   - Player initiates attack
   - Target selection system

3. **Create CombatSystem**
   - Process attack actions
   - Roll for hit/miss
   - Create DamageComponent on target

### Phase 5: Armor Repair & Maintenance
**Goal**: Player can maintain equipment

1. **Create RepairComponent** (consumable item type)
   - `repairAmount`: How much durability restored
   - `repairType`: 'armor', 'weapon', 'all'

2. **Add Repair Action**
   - Use repair kits on damaged armor
   - Cannot repair destroyed armor (0 durability)
   - Repair cost scales with max durability

3. **Workbench Repair**
   - Advanced repairs at workbenches
   - Use materials to restore durability
   - Higher quality materials = more repair

### Phase 6: Enemy AI & Combat
**Goal**: Enemies can fight back

1. **Create AIComponent**
   - `behavior`: 'passive', 'aggressive', 'defensive'
   - `detectionRange`: How far they can see
   - `state`: 'idle', 'patrolling', 'combat', 'fleeing'

2. **Create AISystem**
   - Process AI decisions
   - Path to player when aggressive
   - Attack when in range

3. **Enemy Types**
   - Start with 1-2 simple enemy types
   - Different damage types (melee = kinetic, laser = energy)

---

## Simplification Suggestions

### 🎯 HIGH PRIORITY SIMPLIFICATIONS

#### 1. ✅ **Abstract Body Parts** (IMPLEMENTED)
**Previous**: 6 specific body parts (head, chest, left_arm, right_arm, left_leg, right_leg)
**Current**: 3 abstract regions (head, torso, limbs)

**Benefits Achieved**:
- Simpler damage distribution
- Easier to balance
- Less UI clutter
- Faster to process

**Implementation**:
```javascript
parts: {
  head: 100,      // 10% hit chance
  torso: 100,     // 50% hit chance
  limbs: 100      // 40% hit chance (represents all limbs)
}
```

**Impact**:
- Limb damage affects movement/actions equally
- Less granular but more intuitive
- System still supports adding/removing body parts for mutations/aliens

#### 2. **Consolidate Damage Types**
**Current**: 4 types (kinetic, energy, toxin, radiation)
**Simplified**: 2 types (physical, energy)

**Benefits**:
- Easier to balance armor builds
- Less mental overhead for player
- Simpler resistance calculations

**Mapping**:
- Physical: kinetic, toxin
- Energy: energy, radiation

**Impact**:
- Less variety in armor specialization
- **Recommended**: Only if combat feels overwhelming

#### 3. **Unified Carrying Capacity**
**Current**: Dual system (weight + slots)
**Simplified**: Weight-only OR slots-only

**Benefits**:
- One less thing to track
- Simpler inventory management
- Faster "can I pick this up?" checks

**Recommendation**:
- **Keep dual system** - it's already working well
- The slot system prevents "1000 bullets" problem
- Weight prevents "500 guns" problem
- Complexity is justified by gameplay benefit

#### 4. ✅ **Simplify Temperature Zones** (IMPLEMENTED)
**Previous**: 5 zones with different effects
**Current**: 3 zones (comfortable, harsh, extreme)

**Benefits Achieved**:
- Clearer thresholds
- Easier to communicate to player
- Less floating-point math

**Zones**:
- Comfortable: No effects
- Harsh (1-20°C outside): +1 stress/min, -10 comfort, -5% stats
- Extreme (21+°C outside): +4 stress/min, -25 comfort, -20% stats, 2 damage/min

**Impact**:
- Less granular but still provides clear feedback
- Simpler without losing core mechanic

### 🔄 MEDIUM PRIORITY SIMPLIFICATIONS

#### 5. **Auto-Calculate Equipment Stats**
**Current**: Must equip/use item to see stats
**Simplified**: Show calculated stats in inspect menu

**Benefits**:
- Better player decision-making
- Less trial-and-error
- Quality of life improvement

**Implementation**:
- When inspecting armor, show total resistances
- Show effective temperature range
- Preview stat changes before equipping

**Impact**:
- **Recommended**: Improves UX without removing depth

#### 6. **Standardize Module Slots**
**Current**: Different slot names per equipment type
**Simplified**: Generic slot categories

**Benefits**:
- More modular module system
- Easier to add new equipment types
- Less special-casing in code

**Example**:
```javascript
slots: {
  core1: { type: 'any', required: true },
  core2: { type: 'any', required: true },
  core3: { type: 'any', required: true },
  mod1: { type: 'any', required: false },
  mod2: { type: 'any', required: false }
}
```

**Impact**:
- Loses thematic clarity ("barrel" → "core1")
- **Not Recommended**: Current system is more flavorful

#### 7. ✅ **Remove Equipment Weight When Equipped** (IMPLEMENTED)
**Previous**: Equipped items weigh 50%
**Current**: Equipped items weigh 0%

**Benefits Achieved**:
- Simpler mental model
- No fractional math
- Clear incentive to equip vs carry

**Impact**:
- Less realistic but more gamey
- Strongly encourages equipping items over hoarding them

### ⚠️ AVOID THESE SIMPLIFICATIONS

#### ❌ Remove Durability
Durability creates:
- Maintenance gameplay loop
- Tension (damaged armor is risky)
- Resource sink (repair costs)
- Player agency (risk vs safety)

**Keep it**: Core to the survival/scavenging theme

#### ❌ Remove Module System
Modular equipment is a **signature feature**:
- Enables customization
- Creates scavenging goals
- Provides progression without levels
- Simple rules create complex interactions

**Keep it**: Foundation of the game's identity

#### ❌ Single Body Part (HP Pool)
A single HP pool removes:
- Tactical damage distribution
- Armor value scaling
- Body part specific penalties
- Strategic armor choices

**Keep body parts**: Even in simplified form (3 regions)

---

## Recommended Simplification Path

### ✅ Phase A: Core Simplifications (COMPLETED)
1. ✅ Abstract to 3 body regions (head/torso/limbs)
2. ✅ Simplify temperature zones to 3 levels
3. ✅ Equipped items weigh 0%

**Result**: ~30% less complexity, minimal depth loss
**Status**: All implemented successfully

### Phase B: Quality of Life (Do Second)
1. ✅ Show calculated armor stats in inspect
2. ✅ Display effective temperature range in HUD
3. ✅ Add durability % to equipment labels

**Result**: Better UX, same depth

### Phase C: Consider Later (After Playtesting)
1. ⚠️ Consolidate damage types to 2 (if overwhelming)
2. ⚠️ Reduce module slot count (if too fiddly)

**Result**: Based on actual player feedback

---

## Implementation Priority Queue

### Week 1: Core Combat
1. DamageComponent + DamageSystem
2. Test damage with debug command
3. Verify armor absorption works

### Week 2: Environment
1. TemperatureSystem implementation
2. HUD temperature display
3. Test exposure damage

### Week 3: Weapons
1. WeaponStatsComponent from modules
2. AttackActionComponent
3. Basic combat system

### Week 4: Enemies
1. Simple enemy entity
2. Basic AI (move toward player, attack when adjacent)
3. Player can kill enemies

### Week 5: Polish
1. Repair system
2. Armor maintenance mechanics
3. UI improvements

---

## Metrics for "Too Complex"

Watch for these signs that systems need simplification:

### Red Flags 🚩
- Player repeatedly asks "why did that happen?"
- Common actions require >5 clicks
- Tutorial needs >10 minutes to explain core loop
- Balance requires >20 variables per system

### Green Flags ✅
- Player discovers interactions naturally
- "Aha!" moments from combining systems
- Can explain core mechanics in 3 sentences
- Balance emerges from simple rules

### Current Status
**Complexity Score**: 6/10 (Good!)
- ✅ Module system: Simple rules, complex interactions
- ✅ Body parts: Intuitive hit distribution
- ⚠️ Damage types: 4 types might be 1 too many
- ⚠️ Temperature zones: 5 zones is borderline
- ✅ Dual inventory: Well justified

**Recommendation**: Implement Phase A simplifications, proceed with combat, then reassess.

---

## Design Philosophy

> "The game should be deep and complex due to the interaction of simple systems, and avoid complex systems."

### This Means:
✅ **Simple Rule Example**: "Armor durability % = chance damage passes through"
- One variable, clear relationship, emergent decision-making

❌ **Complex System Example**: "Armor has 4 layers, each with penetration curves, stacking bonuses, critical thresholds"
- Many variables, opaque interactions, spreadsheet required

### Apply to Every System:
1. Can I explain this rule in one sentence?
2. Does this create interesting choices?
3. Does this interact with other systems?
4. Could I remove a variable without losing depth?

If yes to 1-3 and no to 4: Keep it
Otherwise: Simplify or remove

---

## Final Recommendation

**Before implementing combat**:
1. Abstract to 3 body parts (head/torso/limbs)
2. Simplify temperature to 3 zones
3. Make equipped items weightless

**Then**: Implement combat Phase 2-4 with these simplified foundations

**After combat works**: Playtest and gather data on:
- Are 4 damage types too many?
- Is durability system engaging or tedious?
- Does temperature add tension or annoyance?

**Then**: Make data-driven simplifications if needed

**Philosophy**: Start slightly simpler, add complexity only when it creates meaningful choices.
