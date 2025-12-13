# Scavenger - Development To-Do

**Last Updated:** December 2024

> **Note:** This document tracks **currently in-progress** items only. For comprehensive future ideas and planned features, see **`docs/FUTURE_IDEAS.md`**.

---

## ✅ RECENTLY COMPLETED (December 2024)

- [x] Temperature System (comfort, stress, damage)
- [x] Death/Permadeath System (skill regression, return to ship)
- [x] Ship Cargo Hold (20 slots, expandable)
- [x] Producer integration with ship cargo
- [x] Enemy corpse spawning and loot drops
- [x] Enemy weapon/armor loadout system
- [x] Recycler system for breaking down modules
- [x] Food consumption system (eat to restore hunger)
- [x] Building system (6 buildables via Bridge Console)
- [x] Technical debt cleanup:
  - Added world.getPlayer() and world.getShip() convenience methods
  - Added world.getSystem(SystemClass) for type-safe system access
  - Added world.findItemDefinition(itemId) centralized item lookup
  - Replaced 70+ duplicate player queries throughout codebase
  - Replaced 15+ fragile string-based system lookups
  - Organized menu-actions.js and script-registry.js with section comments
  - Improved documentation accuracy (deleted 4 obsolete docs, updated IMPLEMENTATION_STATUS.md)
- [x] Documentation audit and cleanup

---

## 🔥 CURRENT PRIORITIES

### 1. Building System (Ship Interactables)
**Status:** ✅ FULLY IMPLEMENTED
**Priority:** Complete

Players can build interactables from materials via the Bridge Console!

**Implemented:**
- [x] Material cost system (`gamedata/buildables.js`)
- [x] 7 buildable interactables defined with costs
- [x] Bridge Console building interface
- [x] Material checking (player inventory + ship cargo)
- [x] Material consumption on build
- [x] Placement validation system

**Current Buildables:**
- Hydroponics Bay, Recycler, Door, Water Tank, Workbench, Ship Cargo, Stove

**Next Steps:**
- Add more buildables (Shower, Auto-Doc, Life Support, Target Dummy, etc.)
- See `docs/NEXT_STEPS.md` for detailed roadmap

---

### 2. Cooking System
**Status:** ✅ FULLY IMPLEMENTED (December 2024)
**Priority:** Complete

Food consumption and cooking are now fully functional!

**Implemented:**
- [x] 6 new loot-only ingredients (Protein Paste, Meat Chunk, Nutrient Paste, Voidberry, Luminroot, Crystalfruit)
- [x] 17 cooking recipes across 5 skill tiers
- [x] Stove buildable (5 Salvaged Components, 3 Basic Electronics, 3 Polymer Resin)
- [x] Cooking menu organized by Basic/Intermediate/Advanced categories
- [x] Ingredient checking from both player inventory and ship cargo
- [x] Cooking skill progression via `hasCookedToday` trigger
- [x] Meal effects: hunger + comfort/stress/rest bonuses
- [x] Batch cooking (x1 or x5 if enough ingredients)

**Recipe Tiers:**
- Tier 1 (Skill 1): 4 basic recipes using common ingredients
- Tier 2 (Skill 2): 4 recipes including soups/smoothies
- Tier 3 (Skill 3): 3 recipes with alien ingredients
- Tier 4 (Skill 4): 3 gourmet recipes with special effects
- Tier 5 (Skill 5): 3 master recipes with powerful effects

---

### 3. Scavenging Points
**Status:** ✅ Fully Implemented
**Priority:** Medium

Expeditions now feature a complete scavenge node system with contextual loot.

**Completed:**
- [x] Create container interactables (18 node types defined)
- [x] Add loot generation system (tag-based with rarity tiers)
- [x] Spawn containers on expedition maps (biome-aware spawning)
- [x] Implement search/scavenge interaction (one-time search with visual feedback)
- [x] Define loot tables by location type (8 biome-specific tables)

---

## 📋 BACKLOG

### Ship Interactables (8/21 implemented)
**Implemented:**
- Bed, Ship Cargo, Hydroponics, Water Tank, Airlock, Recycler, Workbench, Stove

**Not Implemented:**
- Shower (comfort/stress recovery)
- Auto-Doc (advanced healing)
- Bridge (location selection, travel system)
- Scanner (discover new locations)
- Refinery/Bioreactor (biomass to fuel)
- Water Recycler (passive water reduction)
- Life Support (passive comfort improvement)
- Target Dummy (weapon testing)
- Drop Chute (send items to ship during expedition)
- Story Nodes (lore delivery)

### Environmental Hazards
- Kinetic: Debris drops, piston traps, explosives
- Energy: Arcing conduits, steam vents
- Toxin: Chemical spills, spore clouds
- Radiation: Leaking reactors

### Advanced Combat Features
- Item usage in combat (medkits, stims) - High priority
- Advanced AI behaviors (flanking, cover usage)
- Grenades and throwables

See `docs/FUTURE_IDEAS.md` for comprehensive list of future features.

---

## 🐛 KNOWN ISSUES

None currently tracked.

**If you find bugs:**
1. Test with console commands (see `docs/TESTING_NEW_SYSTEMS.md`)
2. Check browser console for errors
3. Document reproduction steps
4. Report with context (what you were doing, expected vs actual behavior)

---

## 📝 DEVELOPMENT NOTES

### Code Quality Improvements (December 2024)
- Eliminated 70+ duplicate `world.query(['PlayerComponent'])[0]` calls
- Replaced fragile string-based system lookups with type-safe `world.getSystem()`
- Centralized item definition lookup in `world.findItemDefinition()`
- Added comprehensive header comments to combat systems
- Organized large handler files with section markers

### Gameplay Status
**Current Playability:** ~80% - Fully playable with complete core loop

The game has a working survival/combat/progression loop:
- ✅ Survive (eat food, manage stats, sleep, recover)
- ✅ Fight enemies (rewarding combat with loot drops)
- ✅ Gather resources (scavenge nodes, enemy loot, materials)
- ✅ Return to ship (build structures, modify equipment, store items)
- ✅ Build interactables (7 buildables with material costs)

**Main Focus:** Expanding content (more buildables, enemies, locations, polish)

---

## 🎯 DESIGN PRINCIPLES

- Keep features simple and focused
- Prioritize gameplay value over complexity
- Test thoroughly before marking complete
- Update documentation when adding features
- Follow existing code patterns and conventions
- Use world convenience methods (getPlayer, getShip, getSystem, findItemDefinition)

---

**See Also:**
- **`docs/NEXT_STEPS.md`** - Prioritized development roadmap with implementation details
- **`docs/FUTURE_IDEAS.md`** - Long-term feature ideas and expansion plans
- **`docs/IMPLEMENTATION_STATUS.md`** - Current status of all systems
