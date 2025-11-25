# Scavenger - Future Features To-Do

This document tracks planned features that are not yet implemented.

---

## Temperature System

**Status:** Not Implemented
**Priority:** Medium
**Design Doc:** `docs/temperature_system.md`

### Overview
Environmental temperature affects player comfort, stats, and can cause damage or death in extreme conditions.

### Core Mechanics Needed
- [ ] Temperature zones (Comfortable / Harsh / Extreme)
- [ ] Temperature-based comfort/stress modifiers
- [ ] Body part damage from extreme temperatures
  - Cold: Prioritizes limbs (70%), torso (20%), head (10%)
  - Heat: Prioritizes head (35%), torso (50%), limbs (15%)
- [ ] Recovery mechanics when returning to comfortable temperature
- [ ] Armor integration (tempMin/tempMax modifiers already in place)
- [ ] Warning messages at 70% and 90% stress
- [ ] Death at 100% stress or 0% body part efficiency

### Implementation Requirements
1. Create `systems/temperature-system.js`
2. Update frequency: Check every 5 seconds, apply damage every 60 seconds
3. Integrate with armor stats (tempMin/tempMax already calculated)
4. Add HUD indicators for temperature zones
5. Add visual effects (color tints, screen shake for extreme temps)

### Dependencies
- Armor system (✅ implemented)
- Body parts system (✅ implemented)
- Stress/comfort systems (✅ implemented)

---

## Crafting System

**Status:** Not Implemented
**Priority:** High
**Design Doc:** `docs/crafting_mat.md`

### Overview
Players craft items and modules from scavenged materials at workbenches.

### Core Mechanics Needed
- [ ] Material collection system
  - 25 material types defined (see `docs/crafting_mat.md`)
  - Rarity: Common / Uncommon / Rare
  - Source tracking (where materials are found)
- [ ] Recipe system
  - Recipe definitions (input materials → output item)
  - Skill requirements for recipes
  - Workbench requirement
- [ ] Material storage
  - Inventory slots for materials
  - Stacking mechanics
  - Weight considerations
- [ ] Crafting UI
  - Recipe browser
  - Material availability display
  - Craft confirmation
- [ ] Module crafting
  - Craft weapon/armor modules
  - Craft tools and consumables
  - Upgrade existing items

### Implementation Requirements
1. Create `gamedata/materials.js` - Define all material items
2. Create `gamedata/recipes.js` - Define crafting recipes
3. Create `systems/crafting-system.js` - Handle crafting logic
4. Add crafting interface to workbench interaction
5. Update inventory system to handle material stacking
6. Add "Craft" menu option to workbench (alongside module swapping)

### Material Categories
**Common:**
- Salvaged Components, Polymer Resin, Basic Electronics, Raw Biomass

**Uncommon:**
- Organic Protein, Chemical Compounds, Aramid Fibres, Thermal Gel, Intact Logic Board, Repair Paste

**Rare:**
- Titanium Alloy, Ceramic-Composite Plate, Focusing Lenses, High-Capacity Battery, Energy-Reflective Film, Caustic Organ, Bio-Woven Chitin, Neuro-conductive Tissue

### Dependencies
- Workbench system (✅ implemented)
- Inventory system (✅ implemented)
- Skill system (✅ implemented)
- Module system (✅ implemented)

---

## Future Considerations

### Short-term (Next 2-3 Updates)
1. **Temperature System** - Adds survival challenge to expeditions
2. **Crafting System** - Core progression mechanic
3. **More Enemies** - Expand combat variety (see `docs/enemy_imp.md`, `docs/aliens_imp.md`, `docs/aberrants_imp.md`)

### Medium-term (Future Updates)
1. **Farming/Hydroponics** - Food production on ship
2. **Repair System** - Fix broken interactables with Repair skill
3. **Corpse Looting** - Loot equipment from defeated enemies
4. **Player Death/Respawn** - Return to ship, lose expedition loot

### Long-term (Major Features)
1. **Full Expedition Loop** - Ship phase → Expedition → Return
2. **Ship Upgrades** - Spend resources on ship improvements
3. **Procedural Enemy Spawning** - Enable enemy generation in procgen maps
4. **Weather/Environmental Events** - Dynamic hazards
5. **Advanced AI** - Cover usage, flanking, item usage

---

## Notes

- All planned features have design documents in `/docs/`
- Systems marked with ✅ are fully implemented
- Priority levels: High / Medium / Low
- Implementation should follow the "Keep It Simple" philosophy - add minimum complexity for maximum gameplay value
