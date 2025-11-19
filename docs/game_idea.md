# Scavenger: Game Idea

**Development Status:** Early development - Core systems (ECS, inventory, equipment, combat) are implemented. Ship, expedition, and procedural generation systems are planned for future development.

## Concept

Scavenger is a rogue-like game focused on exploration, survival, and resource management within a procedurally generated universe. Players operate from a persistent home base – a space ship – venturing out to various hazardous locations to scavenge for resources and technology. The core loop involves preparing for expeditions, exploring dangerous environments, and returning to the ship to upgrade and survive.

**Note:** Currently, the game features a single hardcoded map for testing. The full expedition/ship loop is planned for future implementation.

## Core Gameplay Loop

**⚠️ Ship Phase and Expedition System: NOT YET IMPLEMENTED**

1.  **Preparation (Ship Phase):** *(Planned)*
    *   **Crafting & Upgrading:** Use scavenged resources to craft new equipment, upgrade the ship's capabilities (e.g., survival systems, cargo capacity), and improve the player's gear.
    *   **Survival Management:** Manage the ship's resources (fuel, oxygen, food) which are consumed during travel and exploration.
    *   **Expedition Planning:** Choose a destination from procedurally generated locations, considering its potential rewards and known hazards.

2.  **Exploration (Location Phase):** *(Partially Implemented)*
    *   **Procedural Generation:** *(Not implemented - currently using hardcoded maps)* Each location is uniquely generated, offering varied layouts, challenges, and loot.
    *   **Scavenging:** ✅ Implemented - Discover and collect resources, components, and unique items.
    *   **Survival Mechanics:** ⚠️ Partial - Survival stats (hunger, rest, stress, comfort) exist but don't degrade over time. Environmental hazards (temperature, radiation) are designed but not active.
    *   **Combat/Avoidance:** ✅ Implemented - Encounter hostile entities. Turn-based combat system is functional.

3.  **Consequence (Death & Return):** *(Not Implemented)*
    *   **Permadeath (Expedition-wise):** If the player dies during an expedition, they are automatically returned to their ship. However, all items and resources collected during that expedition are lost. This creates a high-stakes, risk-reward dynamic.
    *   **Ship Persistence:** The ship and its upgrades remain, providing a sense of persistent progression despite expedition failures.

## Design Philosophy

*   **Simple to Play, Complex to Master:** The game aims for intuitive controls and clear mechanics. Difficulty and depth emerge from the interaction of simple systems (e.g., low fuel + extreme temperature + hostile creatures = difficult decision-making).
*   **Emergent Storytelling:** Procedural generation and survival mechanics will create unique narratives for each player's journey.
*   **Focus on Resource Management:** Every decision, from what to carry to where to explore, revolves around managing limited resources.

## Key Features

**Currently Implemented:**
*   ✅ **Modular Equipment System:** Customize weapons and armor with swappable modules at workbenches
*   ✅ **Turn-Based Combat:** Tactical combat with body part targeting, armor mechanics, and AI behaviors
*   ✅ **ECS Architecture:** Clean, scalable entity-component-system foundation
*   ✅ **Inventory Management:** Slot and weight-based inventory with equipment system
*   ✅ **Survival Stats:** Hunger, rest, stress, and comfort tracking (degradation not yet active)
*   ✅ **Body Parts System:** Damage tracking for head, torso, and limbs

**Planned for Future:**
*   ⏳ **Procedurally Generated Locations:** Infinite replayability with diverse biomes and challenges
*   ⏳ **Persistent Home Base (Space Ship):** A hub for crafting, upgrading, and strategic planning
*   ⏳ **Environmental Hazards:** Temperature, radiation, oxygen management
*   ⏳ **Risk/Reward Gameplay:** High stakes for expeditions with significant losses upon death
*   ⏳ **Crafting System:** Create new items and modules from scavenged materials
*   ⏳ **Dynamic Events:** Unpredictable events during expeditions or while on the ship

## Inventory System

**✅ IMPLEMENTED** - The inventory system combines both slot-based and weight-based limitations to simulate realistic carrying capacity.

*   **Item Weight:** All items have a weight, measured in grams (g).
*   **Inventory Slots:** The player starts with 4 inventory slots (fractional slots supported). Modules/parts consume 0.5 slots, allowing for more efficient storage of modular components.
*   **Max Weight Capacity:** The base maximum weight the character can carry is 3kg (3000g).
    *   Soft limit: 3000g (no penalties)
    *   Hard limit: 4500g (150% of base - cannot pick up more)
*   **Equipment Weight Bonus:** Equipped items weigh 0g (nothing) - it's much easier to wear armor than carry it. This incentivizes equipping items rather than hoarding them in inventory.
*   **Overencumbrance Penalties:** Carrying more than 3000g results in:
    *   Combat movement penalty (-1 tile per 1000g over)
    *   Comfort penalty (-10 per 500g over)
    *   Dodge disabled (0% dodge chance in combat)