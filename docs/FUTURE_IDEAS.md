# Scavenger - Future Ideas & Features

**Last Updated:** December 2024

This document consolidates all future feature ideas, enhancements, and planned systems for the Scavenger game. Features are organized by category and priority.

---

## 🎯 HIGH PRIORITY

### Crafting System
**Status:** Not Implemented
**Design Doc:** `docs/crafting_mat.md`

**Overview:** Players craft items and modules from scavenged materials at workbenches.

**Core Mechanics:**
- Material collection system (25 material types defined)
- Recipe system (input materials → output item)
- Skill requirements for recipes
- Workbench requirement
- Material storage and stacking

**Implementation Requirements:**
1. Create `gamedata/materials.js` - Define all material items
2. Create `gamedata/recipes.js` - Define crafting recipes
3. Create `systems/crafting-system.js` - Handle crafting logic
4. Add crafting interface to workbench interaction
5. Update inventory system to handle material stacking

**Material Categories:**
- **Common:** Salvaged Components, Polymer Resin, Basic Electronics, Raw Biomass
- **Uncommon:** Organic Protein, Chemical Compounds, Aramid Fibres, Thermal Gel, Intact Logic Board, Repair Paste
- **Rare:** Titanium Alloy, Ceramic-Composite Plate, Focusing Lenses, High-Capacity Battery, Energy-Reflective Film, Caustic Organ, Bio-Woven Chitin, Neuro-conductive Tissue

---

### Enemy Corpse Loot System
**Status:** Partially Implemented (player death works, enemy death incomplete)
**Priority:** High

**Current State:**
- Player death fully implemented with permadeath consequences
- Enemy death detected but corpses don't spawn
- TODO markers in `damage-system.js:187` and `combat-system.js:418`

**Needed:**
- Spawn corpse entity when enemy dies
- Corpse contains enemy's equipped items
- Loot interaction (E key on corpse)
- Corpse decay/despawn timer (optional)

---

### Food Consumption Mechanic
**Status:** Data exists, no mechanic
**Priority:** High

**Current State:**
- Hunger tracked and depletes
- Food items defined in `gamedata/food.js`
- Cooking skill exists but can't level up

**Needed:**
- Food item usage (eat from inventory)
- Hunger restoration based on food type
- Cooking mechanic (stove interactable)
- Cooking skill trigger (`hasCookedToday`)
- Recipes that combine raw ingredients

---

## 🔧 MEDIUM PRIORITY

### Ship Cargo Enhancements
**Status:** Base system implemented (December 2024)
**Current Capacity:** 20 slots

**Future Expansions:**
1. **Cargo Capacity Upgrades**
   - Build "Cargo Module" to expand capacity
   - Costs materials + time
   - Each module adds +10 or +20 slots
   - Visual indicator showing modules installed

2. **Cargo Mass System**
   - Add `getTotalCargoWeight()` calculation
   - Ship weight affects fuel consumption during travel
   - Heavy cargo = more fuel per expedition launch

3. **Multiple Cargo Holds**
   - Dedicated holds for different item types
   - Material Cargo (crafting materials only)
   - Equipment Cargo (weapons/armor)
   - General Cargo (everything else)

4. **Restricted Items**
   - Prevent certain items from ship cargo (e.g., radioactive materials)
   - Add `restrictedCargo` array to ShipComponent
   - Warning messages for restricted items

5. **Cargo Manifests**
   - Generate reports of stored items
   - Sort by type, weight, quantity
   - Export to in-game terminal
   - Track cargo history (what was deposited when)

6. **Auto-Sorting**
   - Button to auto-organize cargo by type
   - Group similar items together
   - Move low-quantity items to top

---

### Temperature System Enhancements
**Status:** Core system implemented (December 2024)

**Future Ideas:**
1. **Visual Indicators**
   - HUD temperature zone indicator with color coding
   - Screen tint effects (blue for cold, red for heat)
   - Breath vapor particles in extreme cold
   - Heat shimmer effect in extreme heat

2. **Per-Tile Temperature**
   - Hot/cold zones within maps
   - Fire tiles that emit heat
   - Ice tiles that emit cold
   - Proximity-based temperature blending

3. **Temperature Transitions**
   - Gradual temperature changes over time
   - Moving between zones shows transition effects
   - Body temperature that slowly adjusts

4. **Shelter Mechanics**
   - Interactables that provide temperature protection
   - Campfires (warm zone around them)
   - Tents/Shelters (comfortable zone inside)
   - Heaters/Coolers on ship

5. **Temperature Events**
   - Blizzards (extreme cold spreads)
   - Heat waves (extreme heat increases)
   - Equipment failures (heater breaks)
   - Random environmental hazards

---

### Death System Enhancements
**Status:** Core system implemented (December 2024)

**Future Ideas:**
1. **Ship vs Expedition Inventory**
   - Preserve items brought from ship (not collected on expedition)
   - Only lose items picked up during current expedition
   - Requires tracking "expedition start inventory" snapshot

2. **Death Variety**
   - Different death messages based on cause
   - "Frozen to death" vs "Shot by Scavenger" vs "Bled out"
   - Death statistics tracking

3. **Respawn Options**
   - Choose respawn location (ship bed, medical bay, etc.)
   - Time skip on death (optional)
   - Pay cost to preserve expedition loot (fuel/resources)

4. **Death Statistics**
   - Track total deaths
   - Track death causes
   - Track locations of deaths
   - Display in ship terminal

5. **Hardcore Mode**
   - Permadeath erases entire save
   - One life only
   - Extra skill regression penalties

---

### Repair System
**Status:** Skill exists, no items to repair
**Priority:** Medium

**Needed:**
- Items can enter "broken" state
- Equipment durability degrades to 0% = broken
- Repair interactable/menu
- Repair costs (materials)
- Repair skill checks (higher skill = cheaper repairs)

---

## 🚀 SHIP INTERACTABLES

### Storage & Logistics
- ✅ **Ship Cargo Hold** - Implemented (20 slots, expandable)
- ❌ **Drop Chute** - Send items to ship during expedition (one-way)
- ❌ **Resource Recycler** - Break down equipment into components over time (producer type)

### Survival & Recovery
- ✅ **Hydroponics Bay** - Implemented (grows food from seeds)
- ✅ **Bed** - Implemented (sleep to restore rest)
- ❌ **Stove** - Cook meals from raw food (improve stat restoration)
- ❌ **Shower** - Increase comfort, reduce stress
- ❌ **Auto-Doc** - Apply heal-over-time, consume materials for enhanced healing

### Ship Systems & Progression
- ✅ **Workbench** - Implemented (modify weapons/armor)
- ❌ **Bridge** - Ship command center, travel to expedition locations
- ❌ **Scanner** - Discover new expedition locations, upgrade to find rare sites
- ❌ **Refinery** - Convert biomass → fuel (producer type)
- ❌ **Water Recycler** - Passive water reduction, upgradeable
- ❌ **Life Support** - Set baseline comfort/stress, upgradeable for passive recovery
- ❌ **Target Dummy** - Test weapons, see exact damage dealt

### Personalization
- ❌ **Ship Customization** - Change interior light colors
- ❌ **Trophy Shelf** - Place found trinkets for display
- ❌ **Ship Terminal** - Rename ship, view stats, read logs

---

## 🌍 EXPEDITION INTERACTABLES

### Loot & Exploration
- ✅ **Doors** - Implemented (open/close)
- ❌ **Scavenged Item Nodes** - Generic loot sources (server racks, footlockers, broken equipment)
- ❌ **Skill-Locked Loot** - Require Repair skill to fix mechanism, future Hack skill for terminals
- ❌ **Story Nodes** - Datapads, notes, terminal entries for lore delivery

### Dynamic Environmental Hazards

**Kinetic Hazards:**
- ❌ **Debris Drop** - Ceiling section that drops when shot/triggered
- ❌ **Piston Trap** - Industrial piston that fires periodically across hallways
- ❌ **Explosive Canister** - Volatile fuel that explodes when damaged

**Energy Hazards:**
- ❌ **Arcing Conduit** - Exposed power cable that electrifies adjacent tiles periodically
- ❌ **Superheated Steam Pipe** - Ruptured pipe releasing scalding steam patterns
- ❌ **Overcharged Terminal** - Sparking terminal that shocks on interaction

**Toxin Hazards:**
- ❌ **Chemical Spill** - Green puddle dealing toxin damage to entities standing in it
- ❌ **Spore Cloud Vent** - Releases lingering toxic spore clouds periodically
- ❌ **Leaking Chemical Barrel** - Ruptures when damaged, creates large spill

**Radiation Hazards:**
- ❌ **Leaking Micro-Reactor** - Irradiates large area with persistent radiation damage
- ❌ **Irradiated Container** - Radiation warning, valuable loot inside, risk/reward
- ❌ **Malfunctioning Medical Scanner** - Bathing area in low-level radiation

---

## 🤖 ENEMY & COMBAT SYSTEMS

### Enemy Expansion
**Current Enemies:** 3 types (Scavenger, Scout Drone, Security Bot)

**Planned Enemies:**
- **Aliens** - See `docs/aliens_imp.md`
  - Xenos (melee swarm)
  - Lurkers (ambush predators)
  - Spitters (ranged acid)
- **Aberrants** - See `docs/aberrants_imp.md`
  - Mutated humans
  - Infected specimens
  - Radiation-warped creatures
- **More Machines** - See `docs/enemy_imp.md`
  - Heavy Combat Drones
  - Turrets (stationary)
  - Patrol Bots

### Advanced AI
- **Cover Usage** - Enemies take cover behind obstacles
- **Flanking** - Enemies try to surround player
- **Group Tactics** - Coordinated attacks
- **Item Usage** - Enemies use medkits, grenades
- **Retreat Behavior** - Fall back when wounded
- **Call for Help** - Alert nearby enemies

### Combat Enhancements
- **Item Usage in Combat** - Use medkits, stims during combat (TODO in `action-resolution-system.js:331`)
- **Heavy Armor Movement Penalty** - Placeholder exists, needs values
- **Grenades** - Area damage items
- **Melee Weapons** - Close-range combat option
- **Status Effects** - Poison, bleeding (bleeding exists), burning, stunned

---

## 🗺️ WORLD & GENERATION

### Procedural Generation Improvements
- **Procedural Enemy Spawning** - Enable enemy generation in procedurally generated maps
- **Biome System** - Different area types (frozen, desert, jungle, industrial)
- **Dynamic Difficulty** - Harder expeditions = better loot
- **Random Events** - Surprises during expeditions
- **Trap Rooms** - High-risk, high-reward encounters

### More Locations
**Current Locations:** 3 templates (Asteroid Habitat, Listening Post, Dyson Scaffold)

**Planned:** See `docs/loc_room_ideas.md` and `docs/future_map_ideas.md`
- Derelict Ships
- Underground Bunkers
- Abandoned Stations
- Alien Nests
- Research Facilities

---

## 📊 PROGRESSION SYSTEMS

### Skills Expansion
**Current Skills:** Medical (3), Cooking (5), Farming (3), Repair (3)

**Future Skills:**
- **Hacking** - Access locked terminals, disable security
- **Stealth** - Reduce detection radius, sneak past enemies
- **Scavenging** - Find more loot, better quality
- **Engineering** - Craft better items, reduce material costs

### Ship Upgrades
- **Resource Upgrades** - Increase water/fuel capacity
- **Production Upgrades** - More hydroponics bays, faster production
- **Defense Upgrades** - Turrets, shields for ship
- **Travel Upgrades** - Faster expeditions, unlock distant locations

---

## 🎨 POLISH & UX

### Visual Effects
- **Screen Shake** - On explosions, damage, temperature extremes
- **Particle Effects** - Blood splatter, sparks, smoke
- **Color Tints** - Temperature zones, low health, damage taken
- **Lighting Effects** - Flickering lights, shadows, darkness transitions
- **Animation** - Smooth movement, attack animations

### Audio
- **Sound Effects** - Gunshots, footsteps, door open/close
- **Ambient Sounds** - Ship hum, wind, machinery
- **Music** - Combat music, exploration music, ship music
- **Voice Lines** - Enemy taunts, player grunts (optional)

### UI Improvements
- **Minimap** - Small map in corner showing explored areas
- **Quest Log** - Track objectives and goals
- **Tooltips** - Hover information for items, stats
- **Keybind Customization** - Let players remap controls
- **Multiple Saves** - Support more than one save file

---

## 🔬 ADVANCED SYSTEMS

### Weather & Environmental Events
- **Dynamic Weather** - Rain, snow, fog, sandstorms
- **Day/Night Cycle** - On expedition maps (not just time of day)
- **Environmental Damage** - Acid rain, sandstorm damage
- **Weather Effects on Gameplay** - Fog reduces visibility, rain extinguishes fire

### Oxygen System
- **Oxygen Depletion** - Breathable atmosphere tracking
- **Oxygen Tanks** - Consume oxygen over time
- **Refill Stations** - Recharge oxygen on ship or at stations
- **Suffocation** - Damage when oxygen runs out

### Radiation System
- **Radiation Exposure** - Persistent radiation damage over time
- **Geiger Counter** - Tool to detect radiation levels
- **Anti-Rad Items** - Consumables to reduce radiation
- **Radiation Zones** - Areas with high radiation (reactors, waste)

---

## 📝 NOTES

- All planned features should follow the "Keep It Simple" philosophy
- Add minimum complexity for maximum gameplay value
- Prioritize features that enhance the core survival/scavenger loop
- Some features marked ✅ are fully implemented
- Some features marked ❌ are planned but not started
- Priority levels guide development order, not strict requirements

---

**End of Future Ideas Document**
