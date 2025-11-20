# Scavenger Game - Codebase Cleanup Report

**Generated:** 2025-11-20
**Total Lines of Code:** ~4,700 (excluding docs)

---

## Executive Summary

The Scavenger game codebase demonstrates a well-structured ECS architecture with clean separation of concerns. However, there are opportunities for improvement in code organization, removal of dead code, and fixing minor bugs. This report identifies specific areas for cleanup and optimization.

**Overall Assessment:** ✅ **Good foundation, needs refactoring and cleanup**

---

## 1. MONOLITHIC FILES - Priority: HIGH

### 1.1 game.js (1,454 lines)

**Issues:**
- Single file contains: constants (130 lines), flavor text (60 lines), helper functions (200+ lines), menu actions (750+ lines), script registry (165 lines), and Game class (140 lines)
- 60+ combat constants at the top that should be in a config file
- 140+ lines of combat flavor text that should be in a data file
- 750+ lines of menu actions that could be a separate module

**Recommendations:**
```
Split into:
- config/combat-constants.js (all COMBAT_CONSTANTS)
- data/combat-flavor.js (COMBAT_FLAVOR text arrays)
- utils/helpers.js (getInventoryKey, isEquipmentValid, getEquipmentModifiers, etc.)
- utils/equipment-stats.js (calculateArmourStats, updateArmourStats, calculateGunStats, updateGunStats)
- systems/menu-actions.js or handlers/menu-actions.js (MENU_ACTIONS object)
- systems/script-registry.js (SCRIPT_REGISTRY object)
- game.js (just the Game class - ~140 lines)
```

**Impact:** Would reduce game.js from 1,454 lines to ~140 lines

---

### 1.2 systems.js (2,096 lines)

**Issues:**
- Contains 13 system classes in a single file
- Difficult to navigate and find specific systems
- Each system is 50-200+ lines

**Recommendations:**
```
Split into individual files:
- systems/render-system.js (RenderSystem - 399 lines)
- systems/input-system.js (InputSystem - 272 lines)
- systems/movement-system.js (MovementSystem - 100 lines)
- systems/message-system.js (MessageSystem - 50 lines)
- systems/projectile-system.js (ProjectileSystem - 50 lines)
- systems/hud-system.js (HudSystem - 54 lines)
- systems/interaction-system.js (InteractionSystem - 45 lines)
- systems/comfort-system.js (ComfortSystem - 45 lines)
- systems/combat/combat-system.js (CombatSystem - 430 lines)
- systems/combat/action-resolution-system.js (ActionResolutionSystem - 295 lines)
- systems/combat/damage-system.js (DamageSystem - 195 lines)
- systems/combat/combat-ai-system.js (CombatAISystem - 125 lines)
- systems/ship-system.js (ShipSystem - 45 lines)
```

**Impact:** Better code organization, easier to find and modify specific systems

---

## 2. DEAD CODE & UNUSED FEATURES - Priority: MEDIUM

### 2.1 Unused Components (components.js)

**Dead Components:**
```javascript
// Line 304-308: WearableComponent - Never instantiated or used
// Line 310-315: ThrowableComponent - Never instantiated or used
// Line 317-321: KeyComponent - Never instantiated or used
```

**Recommendation:** Remove these components or implement the features they support

---

### 2.2 Deprecated Menu Actions (game.js)

**Lines 1089-1096:**
```javascript
'manage_equipment_modules': (game, equipmentEntity) => {
    // Deprecated - kept for compatibility, redirects to new action
    MENU_ACTIONS['show_equipment_slots'](game, equipmentEntity);
},
'swap_module_menu': (game, args) => {
    // Deprecated - kept for compatibility, redirects to new action
    MENU_ACTIONS['show_slot_mods'](game, args);
}
```

**Recommendation:** Remove deprecated actions if nothing references them

---

### 2.3 Commented Out Code (systems.js)

**Line 1304:**
```javascript
// this.rollInitiative(world);  // Uncomment for dynamic initiative
```

**Recommendation:** Either implement dynamic initiative or remove the comment

---

### 2.4 Unused CSS Classes (style.css)

**Lines 50-55, 188-197, 199-205:**
```css
.sprite { /* Never used - no sprites in the game */
.game-message { /* Position set dynamically but never created */
.menu-wrapper { /* Not used anywhere */
```

**Recommendation:** Remove unused CSS classes

---

### 2.5 Console.log Debugging Statements

**Excessive logging in:**
- systems.js: ProjectileSystem (lines 809, 825, 843, 847)
- systems.js: CombatSystem (lines 1047, 1165, 1305, 1337, 1912)
- systems.js: CombatAISystem (lines 1954-1963)
- game.js: resolveShoot (lines 1489-1508, 1525-1535)

**Recommendation:** Remove or wrap in a DEBUG flag

---

## 3. BUGS & INCONSISTENCIES - Priority: HIGH

### 3.1 HTML Duplicate Elements (index.html)

**Issue:** Duplicate overlay containers
```html
Line 15: <div id="item-name-overlay-container"></div>  <!-- Inside game-container -->
Line 76: <div id="item-name-overlay-container"></div>  <!-- After scripts -->
Line 77: <div id="menu-overlay-container"></div>       <!-- After scripts -->
```

**Bug:** Duplicate IDs violate HTML standards and cause unexpected behavior

**Recommendation:** Remove lines 76-77 (duplicates outside the game container)

---

### 3.2 DamageSystem Multiple Component Bug (systems.js:1733-1742)

**Issue:**
```javascript
const components = entity.components.get('DamageEventComponent');
if (Array.isArray(components)) {
    damageEvents.push(...components);
} else if (components) {
    damageEvents.push(components);
}
```

**Bug:** `entity.components.get()` returns a single component, never an array. This code expects multiple DamageEventComponents per entity but the ECS doesn't support it.

**Recommendation:** Either:
1. Redesign to process one damage event at a time
2. Create a DamageEventQueue component that holds an array of events
3. Keep as-is if only one damage event per entity is intentional

---

### 3.3 AI Movement Bounds Checking (systems.js:2010-2047)

**Issue:**
```javascript
aiMoveToward(world, entity, targetPos) {
    // ...
    if (Math.abs(dx) > Math.abs(dy)) {
        pos.x += (dx > 0) ? 1 : -1;  // No bounds check!
    } else {
        pos.y += (dy > 0) ? 1 : -1;  // No bounds check!
    }
}
```

**Bug:** AI can move outside map bounds or into walls

**Recommendation:** Add collision detection and bounds checking like MovementSystem does

---

### 3.4 Missing Null Checks

**game.js:217-275, 308-390:** `calculateArmourStats` and `calculateGunStats` assume `attachmentSlots` exists but don't check if it's null/undefined

**Recommendation:** Add null checks or ensure these functions are only called with valid equipment

---

### 3.5 Inventory Weight Calculation Includes Equipped Items (components.js:206-258)

**Issue:**
```javascript
getTotalWeight(world) {
    let totalWeight = 0;
    // Weight from inventory items ...

    // Weight from equipped items (commented out as 0)
    // totalWeight += itemComponent.weight * 0;
}
```

**Inconsistency:** The function claims to get "total weight from inventory AND equipped items" but equipped items are multiplied by 0. This is intentional (encourages equipping), but the comment is misleading.

**Recommendation:** Update function comment to clarify that equipped items are weight-free

---

## 4. CODE QUALITY IMPROVEMENTS - Priority: MEDIUM

### 4.1 Magic Numbers

**Throughout combat code:**
```javascript
// game.js:442 - Should use RESTORE_HUNGER constant
stats.hunger = Math.min(100, stats.hunger + consumable.value);

// systems.js:21 - Should use constant
if (now - this.lastBlinkTime > 500) {

// systems.js:954 - Should use constant
this.stressAdjustmentTimer = 0; // Timer for stress adjustments (every 30 seconds)
if (this.stressAdjustmentTimer >= 30) {
```

**Recommendation:** Extract magic numbers to constants

---

### 4.2 Deep Nesting in Menu System

**InputSystem menu handling (systems.js:486-587)** has 4-5 levels of nesting

**Recommendation:** Extract menu navigation logic into separate methods

---

### 4.3 Long Switch Statements

**InputSystem (systems.js:640-661):** Switch for movement keys could be a map
**ActionResolutionSystem (systems.js:1435-1448):** Switch for action types could use a strategy pattern

**Recommendation:** Refactor to lookup tables or strategy objects

---

### 4.4 Inconsistent Entity Access Patterns

**Mixed patterns:**
```javascript
// Sometimes:
const player = world.query(['PlayerComponent'])[0];

// Other times:
const entity = world.getEntity(entityId);
```

**Recommendation:** Standardize on one pattern per use case

---

## 5. ARCHITECTURAL CONCERNS - Priority: LOW

### 5.1 Tight Coupling Between Systems

**Issues:**
- InputSystem directly calls MENU_ACTIONS and SCRIPT_REGISTRY
- CombatSystem directly accesses ActionResolutionSystem
- Many systems depend on `world.game` reference

**Recommendation:** Consider event bus or message queue for system communication

---

### 5.2 Global State in game.js

**Lines 1322-1324:**
```javascript
// Make world and game accessible from browser console for debugging
window.world = this.world;
window.game = this;
```

**Recommendation:** Keep for debugging but add comment that it's only for dev

---

### 5.3 Mixed Responsibilities in Components

**Components.js has:**
- Simple data containers (PositionComponent)
- Complex logic containers (BodyPartsComponent with 10+ methods)
- Utility classes (BodyPartHitTable)

**Recommendation:** Move BodyPartHitTable to a utils file, consider moving complex component methods to systems

---

## 6. PERFORMANCE CONCERNS - Priority: LOW

### 6.1 Inefficient Query Patterns

**systems.js:1024:** `world.query(['AIComponent', 'PositionComponent', 'BodyPartsComponent'])` - queries all enemies every frame even when not in combat

**Recommendation:** Cache enemy lists or only query when combat starts

---

### 6.2 Multiple Timer Systems

**ComfortSystem (lines 952-993) and ShipSystem (lines 2052-2095)** both maintain their own timers and update intervals

**Recommendation:** Create a centralized timer/scheduler system

---

### 6.3 DOM Manipulation Every Frame

**RenderSystem clears and rebuilds entire grid every frame (lines 75-86)**

**Recommendation:** Only update changed tiles (implement dirty flags)

---

## 7. MISSING FEATURES REFERENCED IN CODE - Priority: MEDIUM

### 7.1 TODO Comments

**systems.js:**
- Line 771: `// TODO: Add armor weight penalty`
- Line 1352: `// TODO: Spawn loot corpses`
- Line 1355: `// TODO: Respawn player on ship, lose expedition loot`
- Line 1688: `// TODO: Implement item usage (medkits, stims)`
- Line 1914: `// TODO: Spawn corpse with loot`
- Line 1915: `// TODO: Remove entity from world or mark as dead`

**world-builder.js:**
- Line 146: `// TODO: Replace with proper enemy spawn locations from map data`

**Recommendation:** Either implement these features or remove TODO comments if not planned

---

### 7.2 Incomplete Implementations

**world-builder.js:199:** Volume parameter on line 199 doesn't exist in ItemComponent (only weight and slots)

```javascript
world.addComponent(weaponId, new ItemComponent(weaponDef.name, weaponDef.weight || 400, weaponDef.volume || 1));
// ItemComponent only takes (name, description, weight, slots)
```

**Bug:** This will set description to weight, and weight to volume, completely wrong!

**Recommendation:** Fix parameter order: `new ItemComponent(weaponDef.name, '', weaponDef.weight || 400, weaponDef.slots || 1)`

---

## 8. DATA FILE ORGANIZATION - Priority: LOW

### 8.1 gamedata/ Structure

**Current:**
- creatures.js
- equipment.js
- interactables.js
- map.js

**Recommendation:** Good organization, no changes needed

---

### 8.2 Map Data Hardcoded

**gamedata/map.js:** Only 2 maps defined (SHIP and CRYOBAY_7)

**Recommendation:** Fine for current scope, consider JSON format if maps grow complex

---

## 9. DOCUMENTATION GAPS - Priority: LOW

### 9.1 Missing JSDoc Comments

**All systems lack JSDoc:**
- No parameter documentation
- No return value documentation
- No description of system responsibilities

**Recommendation:** Add JSDoc comments to all public methods

---

### 9.2 README Missing

**No README.md in root directory**

**Recommendation:** Create README.md with:
- Project description
- How to run
- Controls
- Development setup

---

## 10. TESTING GAPS - Priority: MEDIUM

### 10.1 No Tests

**Observation:** No test files anywhere in the project

**Recommendation:** Add unit tests for:
- Equipment stat calculation
- Damage calculation
- Inventory weight/slot calculation
- Combat hit chance calculation

---

## PRIORITY ACTION ITEMS

### Immediate (Fix Now):
1. ✅ **Fix HTML duplicate elements** (index.html:76-77)
2. ✅ **Fix ItemComponent parameter bug** (world-builder.js:199, 227, 305)
3. ✅ **Add bounds checking to AI movement** (systems.js:2010-2047)
4. ⚠️ **Remove excessive console.log statements**

### Short Term (Next Session):
5. 📦 **Split game.js** into separate modules
6. 📦 **Split systems.js** into individual files
7. 🗑️ **Remove unused components** (WearableComponent, ThrowableComponent, KeyComponent)
8. 🗑️ **Remove deprecated menu actions**

### Medium Term (Future):
9. 📚 **Add JSDoc comments** to all systems
10. 🧪 **Create unit tests** for critical calculations
11. 📖 **Create README.md**
12. ♻️ **Refactor deep nesting** in menu system

### Long Term (Nice to Have):
13. ⚡ **Optimize rendering** with dirty flags
14. 🎯 **Implement event bus** for system communication
15. ⏱️ **Centralize timer management**

---

## CONCLUSION

The codebase is **well-architected** with a clean ECS pattern, but suffers from:
1. **Monolithic files** that should be split for maintainability
2. **Minor bugs** that could cause runtime issues
3. **Dead code** that increases cognitive load
4. **Missing documentation** for onboarding

**Estimated Refactoring Time:**
- High priority items: ~4-6 hours
- Medium priority items: ~8-12 hours
- Low priority items: ~6-10 hours
- **Total: ~18-28 hours of focused work**

**Recommended Next Steps:**
1. Fix the 3 critical bugs identified
2. Split game.js and systems.js
3. Remove dead code
4. Add tests for combat calculations
