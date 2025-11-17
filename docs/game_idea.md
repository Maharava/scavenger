# Scavenger: Game Idea

## Concept

Scavenger is a rogue-like game focused on exploration, survival, and resource management within a procedurally generated universe. Players operate from a persistent home base – a space ship – venturing out to various hazardous locations to scavenge for resources and technology. The core loop involves preparing for expeditions, exploring dangerous environments, and returning to the ship to upgrade and survive.

## Core Gameplay Loop

1.  **Preparation (Ship Phase):**
    *   **Crafting & Upgrading:** Use scavenged resources to craft new equipment, upgrade the ship's capabilities (e.g., survival systems, cargo capacity), and improve the player's gear.
    *   **Survival Management:** Manage the ship's resources (fuel, oxygen, food) which are consumed during travel and exploration.
    *   **Expedition Planning:** Choose a destination from procedurally generated locations, considering its potential rewards and known hazards.

2.  **Exploration (Location Phase):
    *   **Procedural Generation:** Each location is uniquely generated, offering varied layouts, challenges, and loot.
    *   **Scavenging:** Discover and collect resources, components, and unique items.
    *   **Survival Mechanics:** Players must contend with environmental hazards (e.g., extreme temperatures, radiation) and personal needs (hunger, thirst, oxygen). Failure to manage these leads to health degradation.
    *   **Combat/Avoidance:** Encounter hostile entities or environmental traps. Players can choose to engage, avoid, or use stealth.

3.  **Consequence (Death & Return):**
    *   **Permadeath (Expedition-wise):** If the player dies during an expedition, they are automatically returned to their ship. However, all items and resources collected during that expedition are lost. This creates a high-stakes, risk-reward dynamic.
    *   **Ship Persistence:** The ship and its upgrades remain, providing a sense of persistent progression despite expedition failures.

## Design Philosophy

*   **Simple to Play, Complex to Master:** The game aims for intuitive controls and clear mechanics. Difficulty and depth emerge from the interaction of simple systems (e.g., low fuel + extreme temperature + hostile creatures = difficult decision-making).
*   **Emergent Storytelling:** Procedural generation and survival mechanics will create unique narratives for each player's journey.
*   **Focus on Resource Management:** Every decision, from what to carry to where to explore, revolves around managing limited resources.

## Key Features

*   **Procedurally Generated Locations:** Infinite replayability with diverse biomes and challenges.
*   **Persistent Home Base (Space Ship):** A hub for crafting, upgrading, and strategic planning.
*   **Survival Mechanics:** Hunger, thirst, temperature, oxygen, radiation.
*   **Risk/Reward Gameplay:** High stakes for expeditions with significant losses upon death.
*   **Modular Crafting System:** Build and customize equipment and ship modules.
*   **Dynamic Events:** Unpredictable events during expeditions or while on the ship.

## Inventory System

The inventory system combines both slot-based and weight-based limitations to simulate realistic carrying capacity.

*   **Item Weight:** All items will have a weight, measured in grams (g).
*   **Inventory Slots:** The player starts with 4 inventory slots. Backpacks and other gear can increase the number of available slots.
*   **Max Weight Capacity:** The base maximum weight the character can carry is 3kg (3000g). This capacity can be increased through character upgrades or specific equipment.