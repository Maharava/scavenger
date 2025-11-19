# Combat System Implementation Status

**Last Updated:** 2025-11-19

**Overall Status:** Core combat is ~60% implemented and fully functional. Major mechanics work, UI/UX enhancements needed.

---

## ✅ COMPLETED FEATURES

### Core Combat Mechanics
- ✅ Turn-based combat with initiative (Movement + 1d6)
- ✅ Combat entry via enemy detection (proximity + line-of-sight check*)
- ✅ First strike advantage tracking (+15% accuracy bonus)
- ✅ Stress set to minimum 20 on combat start
- ✅ Sequential turn processing with proper death detection
- ✅ Turn order determination (highest initiative first, player wins ties)
- ✅ Round tracking and turn advancement
- ✅ Combat end detection (victory/defeat/flee)

*Line-of-sight currently returns true (placeholder)

### Movement System
- ✅ Movement limiting per turn (movementUsed / movementMax)
- ✅ Movement calculation with penalties:
  - Limb damage penalty (< 70% limbs = -1 per 30% lost)
  - Weight penalty (overencumbrance: -1 per 1000g over)
  - Minimum 1 tile movement enforced
- ✅ Movement reset on turn advance
- ✅ WASD controls during combat

### Combat Actions
- ✅ Shoot action (Space key)
- ✅ Target cycling (R key)
- ✅ Flee action (F key with distance validation)
- ✅ End turn action (E key)
- ✅ Target blinking visual indicator
- ✅ Out-of-range shooting allowed (-25% per tile penalty)

### Hit Calculation
- ✅ Base weapon accuracy from gun stats
- ✅ First strike bonus (+15% when player initiates)
- ✅ Stress modifiers:
  - +10% at 20-40 stress (optimal)
  - -10% at 61-80 stress
  - -20% at 81-100 stress
- ✅ Head damage penalty (-20% if < 50%)
- ✅ Torso damage penalty (-15% if < 50%)
- ✅ Out-of-range penalty (-25% per tile beyond weapon range)
- ✅ No clamping (negative hit chances allowed)
- ✅ Detailed console logging of calculations

### Damage System
- ✅ Body part targeting (weighted random: head 10%, torso 50%, limbs 40%)
- ✅ Armor resistance calculation by damage type
- ✅ Passthrough mechanics based on armor durability
- ✅ Damage split (penetration: 50/50 armor/body or 100/0 blocked)
- ✅ Armor durability damage
- ✅ Dodge rolls (10% base, 0% if overencumbered)
- ✅ Body part damage application
- ✅ Death detection (head or torso <= 0%)

### Status Effects
- ✅ Bleeding (torso < 15%): 5 damage/turn
- ✅ Infected (Parasite Carrier): 3 toxin damage/turn for 5 turns
- ✅ Stunned: Skip next turn
- ✅ Status effect duration tracking

### Enemy AI
- ✅ AI behavior types: aggressive, defensive, passive, fleeing
- ✅ Range checking and distance calculation
- ✅ Behavior-based decision tree:
  - Aggressive: Shoot or move closer
  - Defensive: Shoot, back away, move to optimal range
  - Fleeing: Move away from player
- ✅ AI shooting action
- ✅ AI movement (simple pathfinding)

### Morale System
- ✅ Morale tracking (humanoids only)
- ✅ Morale loss on:
  - Armor destruction (-25)
  - Headshot (-15)
  - Torso hit (-10)
- ✅ Flee behavior when morale < 30
- ✅ Behavior change to 'fleeing'

### Visual & UI
- ✅ Projectile animations (bullets)
- ✅ Target blinking (yellow highlight)
- ✅ Q key weapon range visualization (combat mode)
- ✅ Flavor text system (random hit/miss/status messages)
- ✅ Combat messages (turn indicators, combat start/end)
- ✅ Inventory blocking (I key disabled with message)
- ✅ Equipment screen access (C key - but not locked)

---

## ❌ MISSING FEATURES

### High Priority - UI/UX

**UI Buttons:**
- ❌ End Turn button (bottom-right)
- ❌ Flee button (bottom-right, with grayed state)
- ❌ Button click handlers
- ❌ Button tooltips

**Mouse Controls:**
- ❌ Left-click enemy to shoot
- ❌ Hit chance % display on hover
- ❌ Crosshair cursor during combat
- ❌ Color-coded hit chance (white/red/green)

**Visual Feedback:**
- ❌ Movement counter UI ("Movement: 2/4")
- ❌ Turn indicator panel (top-left)
- ❌ Turn order list display
- ❌ Enemy health bars (3-bar system: head/torso/limbs)

### Medium Priority - Gameplay

**Combat Restrictions:**
- ❌ Equipment screen read-only mode (buttons disabled)
- ❌ Fleeing restriction when limbs < 30%
- ❌ Heavy armor movement penalty (-1 for heavy armor)

**Detection:**
- ❌ Proper line-of-sight detection (currently placeholder)
- ❌ Wall blocking for enemy detection
- ❌ Bresenham's algorithm implementation

**Loot & Death:**
- ❌ Corpse spawning on enemy death
- ❌ Lootable corpse interactables
- ❌ Player corpse on death
- ❌ Ship respawn system
- ❌ Expedition loot loss on death

### Low Priority - Polish

**Advanced Features:**
- ❌ Item usage in combat (medkits, stims)
- ❌ Advanced AI (cover, flanking, tactical positioning)
- ❌ Post-combat status persistence (bleeding continues)
- ❌ Enhanced status effects (slowed, burning, poisoned)
- ❌ Morale affecting accuracy
- ❌ Surrender mechanics

---

## 🐛 KNOWN ISSUES

**NONE CRITICAL** - All major bugs have been fixed:
- ✅ Fixed: Dead enemies taking turns (death check added before AI processing)
- ✅ Fixed: Combat end not detected after AI actions
- ✅ Fixed: Movement not limiting properly (movementUsed tracking added)

**Minor Issues:**
- ⚠️ Line-of-sight always returns true (placeholder function)
- ⚠️ Equipment screen not locked during combat (can unequip items)

---

## 📊 IMPLEMENTATION BREAKDOWN

| System | Status | Completion |
|--------|--------|------------|
| Combat Flow | ✅ Working | 90% |
| Movement | ✅ Working | 100% |
| Shooting | ✅ Working | 80% (missing mouse) |
| Damage | ✅ Working | 100% |
| AI | ✅ Working | 60% |
| Status Effects | ✅ Working | 80% |
| UI Elements | ⚠️ Partial | 30% |
| Mouse Controls | ❌ Missing | 0% |
| Loot/Death | ❌ Missing | 10% |
| Morale | ✅ Working | 80% |

**Overall Progress: ~60% complete**

---

## 🎯 RECOMMENDED NEXT STEPS

### Phase 1: Critical UI (4-6 hours)
1. Add End Turn button (bottom-right)
2. Add Flee button with grayed state logic
3. Add movement counter display ("Movement: 2/4")
4. Add turn indicator panel (top-left)

### Phase 2: Mouse Controls (3-4 hours)
5. Implement click-to-shoot (canvas click handler)
6. Add hit chance display on hover
7. Add crosshair cursor
8. Color-code hit chance text

### Phase 3: Visual Polish (3-4 hours)
9. Implement enemy health bars (3-bar system)
10. Lock equipment screen (disable buttons in combat)
11. Add limbs < 30% flee restriction
12. Improve line-of-sight detection

### Phase 4: Loot & Death (2-3 hours)
13. Spawn corpses on death
14. Create loot interaction
15. Implement player death/respawn (requires ship system)

---

## 📝 DESIGN NOTES

**What Changed from Original Plan:**
- ✅ Kept keyboard controls (hybrid input instead of mouse-only)
- ✅ Movement limiting implemented and working
- ✅ Out-of-range shooting works perfectly
- ✅ Flavor text system implemented with random messages
- ✅ Status effects implemented (bleeding, infected, stunned)
- ❌ UI buttons not yet implemented (E/F keys work)
- ❌ Mouse controls not yet implemented (Space key works)
- ❌ Health bars not yet implemented (check HUD body parts)

**What Works Great:**
- Hit calculation is comprehensive and balanced
- Armor system feels tactical (passthrough, durability)
- AI behavior types provide variety
- Morale system makes humanoids feel dynamic
- Flavor text adds narrative depth
- Stress optimal window (20-40) creates interesting gameplay

**What Needs Attention:**
- UI feedback is minimal (missing visual indicators)
- Mouse input would improve accessibility
- Line-of-sight placeholder breaks immersion
- No loot system makes victories feel hollow
- Equipment screen should lock during combat

---

## 🔧 FILES MODIFIED

**Already Modified:**
- ✅ `systems.js` - All combat systems implemented
- ✅ `components.js` - Combat components added
- ✅ `game.js` - Combat constants and flavor text added
- ✅ `gamedata/creatures.js` - AI types and morale values
- ✅ `gamedata/equipment.js` - Weapon/armor stats for combat

**Still Need Modification:**
- ❌ `systems.js` - RenderSystem (UI buttons, health bars, mouse events)
- ❌ `systems.js` - InputSystem (mouse click handlers)
- ❌ `systems.js` - CombatSystem (fleeing restrictions, LOS)
- ❌ `index.html` - Add button elements and turn indicator
- ❌ `style.css` - Style buttons, panels, health bars

---

## 📚 RELATED DOCUMENTATION

- **combat_plan.md** - Detailed list of missing features (updated)
- **weapon_combat_system.md** - Weapon stats and modular system (accurate)
- **hud_and_stats.md** - HUD and body parts system (accurate)
- **ecs_design.md** - ECS architecture overview (accurate)

---

**Combat is playable and fun! The remaining work is primarily UI/UX polish and loot integration.**
