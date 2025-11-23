# Scavenger Game - Outstanding Work Items

**Last Updated:** 2025-11-23
**Status:** Minor cleanup and enhancements remaining

---

## Overview

The major refactoring is complete (see [REFACTORING_SUMMARY.md](REFACTORING_SUMMARY.md)). This document tracks remaining work items that need attention.

---

## 1. CRITICAL BUGS - Priority: HIGH

### 1.1 ItemComponent Parameter Bug (world-builder.js)

**Issue:** Several locations pass incorrect parameters to `ItemComponent` constructor.

**Expected signature:** `ItemComponent(name, description, weight, slots)`

**Problematic code:**
```javascript
// world-builder.js:240 - Weapon creation
world.addComponent(weaponId, new ItemComponent(weaponDef.name, weaponDef.weight || 400, weaponDef.volume || 1));
// Should be: new ItemComponent(weaponDef.name, '', weaponDef.weight || 400, 1.0)

// world-builder.js:268 - Part creation
world.addComponent(partEntityId, new ItemComponent(randomPart.name, randomPart.weight || 50, 0.1));
// Should be: new ItemComponent(randomPart.name, '', randomPart.weight || 50, 0.5)

// world-builder.js:346 - Armor creation
world.addComponent(armorId, new ItemComponent(armorDef.name, armorDef.weight || 800, armorDef.volume || 2));
// Should be: new ItemComponent(armorDef.name, '', armorDef.weight || 800, 1.0)
```

**Bug:** This sets description to weight, weight to volume/slots - completely wrong!

**Impact:** Item properties are incorrectly assigned, causing weight/slot calculations to fail.

**Files affected:**
- `world-builder.js:240` (enemy weapon spawning)
- `world-builder.js:268` (enemy weapon part spawning)
- `world-builder.js:346` (enemy armor spawning)

---

## 2. TODO COMMENTS - Priority: MEDIUM

These TODO comments should either be implemented or removed if not planned.

### 2.1 Enemy Spawning
**File:** `world-builder.js:187`
```javascript
// TODO: Replace with proper enemy spawn locations from map data
```
**Action needed:** Either implement map-based spawn locations or mark as "deferred for procedural generation".

---

### 2.2 Combat Features
**File:** `systems/combat/action-resolution-system.js:241`
```javascript
// TODO: Implement item usage (medkits, stims)
```
**Action needed:** Implement consumable item usage in combat or remove if not planned.

---

**File:** `systems/combat/combat-system.js:344`
```javascript
// TODO: Spawn loot corpses
```
**Action needed:** Implement corpse/loot spawning on death or remove if using different loot system.

---

**File:** `systems/combat/combat-system.js:347`
```javascript
// TODO: Respawn player on ship, lose expedition loot
```
**Action needed:** Implement expedition/ship death mechanics or mark as deferred for ship phase.

---

**File:** `systems/combat/damage-system.js:180-181`
```javascript
// TODO: Spawn corpse with loot
// TODO: Remove entity from world or mark as dead
```
**Action needed:** Implement entity death handling (corpses, loot drops, entity removal).

---

### 2.3 Movement
**File:** `systems/movement-system.js:105`
```javascript
// TODO: Add armor weight penalty
```
**Action needed:** Implement movement penalty based on armor weight or remove if not planned.

---

## 3. CODE QUALITY IMPROVEMENTS - Priority: LOW

### 3.1 Magic Numbers

Some magic numbers remain that should be extracted to constants:

**systems/movement-system.js:**
```javascript
// Line ~105 - Should use constants for weight penalty calculations
// Already has overencumbrance constants, but armor-specific penalties not defined
```

**systems/render-system.js:**
```javascript
// Blink interval already moved to BLINK_INTERVAL_MS in game-constants.js ✅
```

**Recommendation:** Review all systems for remaining magic numbers and extract to `config/game-constants.js`.

---

### 3.2 Deep Nesting in Menu System

**systems/input-system.js:** Menu handling has 4-5 levels of nesting (lines vary by version).

**Recommendation:** Extract menu navigation logic into separate helper methods:
- `handleMainMenuInput()`
- `handleSubmenuInput()`
- `handleConfirmAction()`

**Impact:** Low priority - code works fine, but could improve readability.

---

### 3.3 Long Switch Statements

**Opportunities for refactoring:**

**systems/input-system.js:**
- Movement key switch could be a lookup map
- Menu action switch could use handler pattern

**systems/combat/action-resolution-system.js:**
- Action type switch could use strategy pattern

**Recommendation:** Low priority - current approach is readable and maintainable.

---

## 4. PERFORMANCE OPTIMIZATIONS - Priority: LOW

### 4.1 Inefficient Query Patterns

**Issue:** Some systems query all entities every frame even when not needed.

**Example:**
```javascript
// Combat systems query all enemies every frame
world.query(['AIComponent', 'PositionComponent', 'BodyPartsComponent'])
```

**Recommendation:** Cache enemy lists or only query when combat starts.

**Impact:** Low - current entity counts are small, performance is fine.

---

### 4.2 DOM Manipulation Every Frame

**systems/render-system.js:** Clears and rebuilds entire grid every frame.

**Recommendation:** Implement dirty flags to only update changed tiles.

**Impact:** Low - current performance is acceptable for small maps.

---

## 5. DOCUMENTATION GAPS - Priority: MEDIUM

### 5.1 Missing JSDoc Comments

**All systems lack JSDoc:**
- No parameter documentation
- No return value documentation
- No description of system responsibilities

**Recommendation:** Add JSDoc comments to all public methods for better IDE support and maintainability.

**Example:**
```javascript
/**
 * RenderSystem - Renders all visible entities to the game grid
 * Handles layered rendering, viewport management, and visual effects
 */
class RenderSystem extends System {
    /**
     * Update the visual representation of the game world
     * @param {World} world - The ECS world instance
     */
    update(world) {
        // ...
    }
}
```

---

### 5.2 Component Documentation

**Action needed:** Update `docs/ecs_design.md` with complete component list (see task #3 in this session).

---

## 6. TESTING GAPS - Priority: MEDIUM

### 6.1 No Unit Tests

**Observation:** No test files anywhere in the project.

**Recommendation:** Add unit tests for critical calculations:
- Equipment stat calculation (`utils/equipment-stats.js`)
- Damage calculation (`systems/combat/damage-system.js`)
- Inventory weight/slot calculation (`components.js` - `InventoryComponent`)
- Combat hit chance calculation (`systems/combat/combat-system.js`)
- Time progression calculations (`systems/time-system.js`)

**Suggested framework:** Jest or Vitest (lightweight, easy to set up)

**Impact:** Medium priority - tests would prevent regressions and make refactoring safer.

---

## 7. NICE TO HAVE - Priority: LOW

### 7.1 Centralize Timer Management

**Issue:** Multiple systems maintain their own timers:
- `ComfortSystem` - stress adjustment timer
- `ShipSystem` - water consumption timer
- `TimeSystem` - time progression timer

**Recommendation:** Create a centralized scheduler/timer system.

**Impact:** Low - current approach works fine, just not DRY.

---

### 7.2 Event Bus for System Communication

**Current state:** Some tight coupling between systems:
- `InputSystem` directly calls `MENU_ACTIONS` and `SCRIPT_REGISTRY`
- `CombatSystem` directly accesses `ActionResolutionSystem`
- Many systems depend on `world.game` reference

**Recommendation:** Consider event bus or message queue for system communication.

**Impact:** Low - current architecture works well, this would be over-engineering for now.

---

## 8. PRIORITY SUMMARY

### Fix Immediately (Next Session)
1. ⚠️ **Fix ItemComponent parameter bug** (`world-builder.js` lines 240, 268, 346)

### Short Term (When Implementing Related Features)
2. 📝 **Resolve TODO comments** - Implement or remove the 6 active TODOs
3. 📚 **Add JSDoc comments** - Document all systems and components
4. ✅ **Update ecs_design.md** - Complete component list

### Medium Term (Nice to Have)
5. 🧪 **Add unit tests** - Test critical calculations
6. ♻️ **Refactor deep nesting** - Clean up menu system
7. 🔍 **Extract remaining magic numbers**

### Long Term (Optional Improvements)
8. ⚡ **Optimize rendering** - Dirty flags for changed tiles only
9. 🎯 **Implement event bus** - Decouple system communication
10. ⏱️ **Centralize timers** - Unified scheduler system

---

## Estimated Work Time

- **Critical bug fix:** ~30 minutes
- **TODO resolution:** ~2-4 hours (depending on implementations)
- **JSDoc documentation:** ~3-4 hours
- **Unit tests:** ~6-8 hours
- **Optional improvements:** ~8-12 hours

**Total for must-haves:** ~4-8 hours
**Total for nice-to-haves:** ~14-20 hours

---

## Conclusion

The codebase is in **excellent shape**. All major refactoring is complete, and only minor cleanup items remain. The outstanding work is mostly:

1. **One critical bug** (easy fix)
2. **Documentation gaps** (JSDoc, component list)
3. **TODOs to resolve** (implement or remove)
4. **Optional optimizations** (not needed yet)

**The game is fully functional and the architecture is solid.**
