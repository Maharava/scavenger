# Combat System - Missing Features

**Status:** Core combat system is ~60% implemented and functional. This document lists features that are still missing or incomplete.

**Last Updated:** 2025-11-19

---

## What's Already Working ✅

**Core Combat:**
- Turn-based combat with initiative rolls (Movement + 1d6)
- Enemy detection and combat entry (stress set to minimum 20)
- First strike advantage tracking
- Sequential turn processing with death detection
- Movement limiting per turn (limb damage + weight penalties)
- Keyboard controls (R=cycle targets, Space=shoot, F=flee, E=end turn, WASD=move)
- Out-of-range shooting with -25% penalty per tile beyond range
- Comprehensive hit calculation with stress/damage/range modifiers
- Body part targeting system (head 10%, torso 50%, limbs 40%)
- Full armor resistance and passthrough mechanics
- Armor durability damage
- Dodge rolls (10% base, 0% when overencumbered)
- Projectile animations
- Status effects (bleeding, infected, stunned)
- Enemy AI with behavior types (aggressive, defensive, fleeing)
- Morale system for humanoids
- Flavor text messages (random hit/miss/status descriptions)
- Combat end conditions (victory/defeat/flee)
- Q key weapon range visualization
- Inventory blocking during combat (I key disabled)

---

## Missing Features (Prioritized)

### 🔴 High Priority - UI/UX Improvements

**1. End Turn Button**
- Location: Bottom-right corner
- Always visible, always clickable
- Supplements E key (don't remove keyboard control)
- Shows "End Turn" text in button

**2. Flee Button**
- Location: Bottom-right, above End Turn button
- Grayed out when player is within ANY enemy detection range
- Normal/clickable when outside ALL enemy detection ranges
- Tooltip shows: "Must be outside enemy detection range (X tiles)"
- Supplements F key (don't remove keyboard control)

**3. Mouse Click-to-Shoot**
- Left-click on enemy entity to shoot
- Shows hit chance % when hovering over enemy
- Crosshair cursor appears when hovering enemies
- Color-coded hit chance display:
  - White text: Normal (40-79%)
  - Red text: Low (<40%)
  - Green text: High (80%+)
- Out of range shows negative percentage (e.g., "-75%")
- Supplements Space key (don't remove keyboard control)

**4. Turn Indicator Panel (Top-Left)**
```
┌────────────────────────────┐
│ YOUR TURN! Round 3         │  ← Cyan text for player, yellow for enemy
│ Movement: 2/4              │  ← Remaining / max movement
│                            │
│ Turn Order:                │
│  ► You                     │  ← Arrow shows current turn
│    Scavenger               │
│    Pirate                  │
└────────────────────────────┘
```
- Shows current turn status
- Shows remaining movement counter
- Shows turn order list (optional enhancement)

**5. Enemy Health Bars**
- 3 horizontal bars stacked vertically (bottom to top):
  1. Limbs (bottom, blue)
  2. Torso (middle, green)
  3. Head (top, yellow)
- Bars only visible when damaged (100% = hidden)
- Bar color intensity fades as efficiency drops
- Positioned above each enemy sprite

---

### 🟡 Medium Priority - Gameplay Features

**6. Equipment Screen Read-Only Mode**
- C key already opens equipment during combat ✅
- **Missing:** Disable unequip/swap buttons (gray them out)
- **Missing:** Show message if attempted: "Can't change equipment during combat!"
- Allow inspection only (view stats, modules)

**7. Fleeing Restrictions**
- **Missing:** Limbs < 30% prevents fleeing
- Flee button shows: "Too injured to flee!" tooltip
- F key also blocked when limbs too damaged

**8. Line-of-Sight Detection**
- **Currently:** Always returns true (placeholder)
- **Needed:** Bresenham's algorithm for LOS
- Enemies can't detect through walls
- Combat doesn't start through walls

**9. Heavy Armor Movement Penalty**
- **Currently:** Limb damage + weight penalties working
- **Missing:** Armor-specific movement penalty
- Heavy armor: -1 movement
- Light armor: No penalty
- Integrate with armor stats

---

### 🟢 Low Priority - Polish & Enhancement

**10. Corpse Spawning & Loot**
- On enemy death: Create corpse interactable
- Corpse allows looting equipment/inventory
- Corpse remains on map after combat

**11. Player Death System**
- On player death: Create corpse at death location
- Respawn on ship (future ship system)
- Expedition loot lost (items in inventory)
- Message: "You died! Returning to ship..."

**12. Item Usage in Combat**
- Use medkits to heal during combat
- Use stims for temporary buffs
- Quick slot system or menu-based usage
- **Current:** Stub exists in code (line 1687-1692 in systems.js)

**13. Advanced AI Behaviors**
- Cover usage (humanoids take cover behind solid tiles)
- Flanking attempts (move to player's sides/back)
- Tactical positioning (maintain optimal range)
- Item usage (enemies use medkits/grenades)

**14. Post-Combat Status Persistence**
- Status effects continue after fleeing
- Convert combat turns to real-time (6 turns = 30 seconds)
- Bleeding persists until treated
- Infected persists for full duration

**15. Enhanced Status Effects**
- **Slowed:** Movement -2 for 3 turns
- **Burning:** Damage over time from fire
- **Poisoned:** Damage over time from toxins
- **Disoriented:** Accuracy penalty from head damage

**16. Turn Order Panel Details**
- Show all combatants in initiative order
- Highlight current active combatant
- Arrow indicator for active turn
- Round number display

**17. Enhanced Morale System**
- Morale affects accuracy (low morale = -accuracy)
- Surrender option for very low morale enemies
- Morale recovery over time in combat

---

## Known Bugs to Fix

**None Critical** - All major bugs from earlier development have been resolved:
- ✅ Fixed: Dead enemies taking turns (death check added)
- ✅ Fixed: Combat end not detected after AI actions

---

## Design Decisions Made

**Control Philosophy:**
- **Hybrid input:** Mouse + keyboard, not mouse-only
- Keyboard shortcuts remain functional (don't remove R, Space, F, E keys)
- UI buttons supplement keyboard, don't replace it
- Players can choose their preferred input method

**UI Philosophy:**
- Show information clearly (hit chances, movement remaining)
- Hide clutter (health bars only when damaged)
- Visual feedback for all actions (messages, animations, highlights)
- Accessible (buttons always visible, tooltips explain states)

**Balance Philosophy:**
- Combat is fast and deadly
- No mid-combat healing via inventory (emergency only via items)
- Stress affects performance (optimal window at 20-40)
- Armor degrades (encourages smart engagement)
- Fleeing is viable (not a punishment mechanic)

---

## Implementation Notes

**Files to Modify:**
1. **systems.js** - RenderSystem (UI elements, mouse events, health bars)
2. **systems.js** - CombatSystem (fleeing restrictions, armor penalty)
3. **systems.js** - InputSystem (mouse click handlers, button events)
4. **index.html** - Add button elements and turn indicator div
5. **style.css** - Style buttons, turn panel, health bars

**Testing Priorities:**
1. End Turn / Flee buttons work correctly
2. Mouse click-to-shoot targets right enemy
3. Health bars render and update properly
4. Movement counter displays accurately
5. Fleeing restrictions work (distance + limb damage)
6. Equipment screen locks properly during combat

---

## Out of Scope (Not Planned)

These features are explicitly NOT part of the combat system:

- ❌ Crafting system (separate feature)
- ❌ Temperature damage in combat (environmental system)
- ❌ Ship-based features (base building)
- ❌ Procedural generation (world system)
- ❌ Multiplayer/co-op
- ❌ Real-time combat mode
- ❌ Cover system (low priority, maybe later)

---

**For full implementation details of existing combat mechanics, see the code in `systems.js` (CombatSystem, ActionResolutionSystem, DamageSystem, CombatAISystem).**
