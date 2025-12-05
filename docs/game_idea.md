# Scavenger: Game Idea

**Development Status:** Core systems complete - ECS architecture, inventory, equipment, combat, time progression, ship management, and procedural generation are fully implemented. Expedition loop is functional with airlock system for starting expeditions.

## Concept

Scavenger is a rogue-like game focused on exploration, survival, and resource management within a procedurally generated universe. Players operate from a persistent home base – a space ship – venturing out to various hazardous locations to scavenge for resources and technology. The core loop involves preparing for expeditions, exploring dangerous environments, and returning to the ship to upgrade and survive.

Beyond human survivors and the automated robotic systems, the player will encounter Aberrants. These are not a cohesive faction but chaotic, universal mutations stemming from a multitude of horrific origins: failed human and robot experiments, entities warped by staring into the existential Void between stars, and ancient, dark lifeforms that evolved on rogue planets far beyond known space. They are the universe's runtime errors, unpredictable and universally hostile.

**Note:** The game features both a persistent ship (hardcoded map) and procedurally generated expedition locations. Players can use the airlock on the ship to start expeditions.

## Core Gameplay Loop

1.  **Preparation (Ship Phase):** *(Planned)*
    *   **Crafting & Upgrading:** Use scavenged resources to craft new equipment, upgrade the ship's capabilities (e.g., survival systems, cargo capacity), and improve the player's gear.
    *   **Survival Management:** Manage the ship's resources (fuel, oxygen, food) which are consumed during travel and exploration.
    *   **Expedition Planning:** Choose a destination from procedurally generated locations, considering its potential rewards and known hazards.

2.  **Exploration (Location Phase):** *(Implemented)*
    *   **Procedural Generation:** ✅ Implemented - Each expedition location is uniquely generated with rooms, corridors, doors, and loot placement based on location templates.
    *   **Scavenging:** ✅ Implemented - Discover and collect resources, components, and unique items.
    *   **Survival Mechanics:** ✅ Implemented - Survival stats (hunger, rest, stress, comfort) with automatic hunger depletion over time. Body parts heal naturally (2% per day). **Temperature system fully active** with 3 zones (comfortable/harsh/extreme) affecting comfort, stress, and causing damage. Radiation and oxygen systems not yet implemented.
    *   **Combat/Avoidance:** ✅ Implemented - Encounter hostile entities. Fully functional turn-based combat system with body part targeting, armor mechanics, and AI behaviors.

3.  **Consequence (Death & Return):** ✅ **Fully Implemented**
    *   **Return to Ship:** ✅ Implemented - Players can return to ship via Airlock_Return interactable. Ship state persists using localStorage.
    *   **Death Mechanics:** ✅ Implemented - Death detected (head or torso destroyed) triggers full death sequence: expedition inventory cleared, skill regression applied, automatic return to ship after 3 seconds, health restored to 50%.
    *   **Skill Regression:** ✅ Implemented - Death can cause loss of 1 level in up to 2 random skills (chance: 25% + 10% per skill level).
    *   **Expedition Item Loss:** ✅ Implemented - All items collected during expedition are lost on death.

## Design Philosophy

*   **Simple to Play, Complex to Master:** The game aims for intuitive controls and clear mechanics. Difficulty and depth emerge from the interaction of simple systems (e.g., low fuel + extreme temperature + hostile creatures = difficult decision-making).
*   **Emergent Storytelling:** Procedural generation and survival mechanics will create unique narratives for each player's journey.
*   **Focus on Resource Management:** Every decision, from what to carry to where to explore, revolves around managing limited resources.

## Key Features

**Currently Implemented:**
*   ✅ **Modular Equipment System:** Customize weapons and armor with swappable modules at workbenches
*   ✅ **Turn-Based Combat:** Tactical combat with body part targeting, armor mechanics, and AI behaviors
*   ✅ **ECS Architecture:** Clean, scalable entity-component-system foundation (fully modularized)
*   ✅ **Inventory Management:** Slot and weight-based inventory with equipment system
*   ✅ **Time Progression:** Real-time to game-time conversion (6 seconds real = 1 minute game) with day/night cycle tracking
*   ✅ **Day System:** Day counter starts at Day 1, increments at midnight (0000), integrates with all time-based systems
*   ✅ **Survival Stats:** Hunger, rest, stress, and comfort tracking with automatic hunger depletion
*   ✅ **Body Parts System:** Damage tracking and natural healing for head, torso, and limbs
*   ✅ **Sleep System:** Rest restoration with instant time-skip mechanics (1hr/4hr/8hr options), handles midnight crossing
*   ✅ **Ship Resources:** Water and fuel management with consumption tracking

*   ✅ **Procedurally Generated Locations:** Infinite replayability with diverse biomes and challenges
*   ✅ **Expedition System:** Airlock on ship allows starting expeditions to procedurally generated locations
*   ✅ **Producer System (Hydroponics):** Deadline-based production with skill bonuses, works while player is off-ship
*   ✅ **Skill System:** Medical, Cooking, Farming, and Repair skills with natural progression and death penalties

**Planned for Future:**
*   ⏳ **Environmental Hazards:** Radiation and oxygen effects (temperature system fully active)
*   ~~**Permadeath Consequences:** Expedition item loss on death~~ ✅ **COMPLETED**
*   ⏳ **Food/Cooking System:** Ability to cook and consume food (food items and cooking skill exist, no consumption mechanic)
*   ⏳ **Repair System:** Ability to repair broken items (repair skill exists, no items to repair)
*   ⏳ **Crafting System:** Create new items and modules from scavenged materials (materials exist, no crafting recipes)
*   ⏳ **Dynamic Events:** Unpredictable events during expeditions or while on the ship
*   ⏳ **Corpse/Loot System:** Enemy corpses with lootable items (TODO in damage-system.js)
*   ⏳ **Ship Interactables:** Stove, Shower, Auto-Doc, Workbenches, Bridge, Scanner, Refinery, Water Recycler, Life Support, Target Dummy, and more

## Inventory System

**✅ IMPLEMENTED** - The inventory system combines both slot-based and weight-based limitations to simulate realistic carrying capacity.

*   **Item Weight:** All items have a weight, measured in grams (g).
*   **Inventory Slots:** The player starts with 4 inventory slots (fractional slots supported). Modules/parts consume 0.5 slots, allowing for more efficient storage of modular components.
*   **Max Weight Capacity:** The base maximum weight the character can carry is 13kg (13000g).
    *   Soft limit: 13000g (no penalties)
    *   Hard limit: 15000g (115% of base - cannot pick up more)
*   **Equipment Weight Bonus:** Equipped armor weighs 50% when worn (calculated into total), guns weigh full weight when equipped. This makes armor more practical to wear than carry.
*   **Overencumbrance Penalties:** Carrying 10kg or more results in:
    *   Comfort penalty (-10 while carrying ≥10kg)
    *   Additional penalties planned for future implementation