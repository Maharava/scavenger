# ECS Design Document for Scavenger

This document outlines the plan to refactor the game to an Entity-Component-System (ECS) architecture. This design will provide a robust and scalable foundation for features like crafting, modular equipment, and world interaction.

## 1. Core Concepts

The ECS architecture is built on three simple principles:

-   **Entity**: A simple "thing" that exists in the game. It has no data or logic, only a unique ID. Think of it as an empty container. *Example: An entity with ID `1337` might be the player.*

-   **Component**: A plain block of data that we attach to an entity. Components have no logic; they just hold information. *Example: A `PositionComponent` could be `{ x: 10, y: 5 }`.*

-   **System**: The logic of the game. A System is a function that runs every frame, finds all entities that have a certain set of components, and performs actions on them. *Example: A `RenderSystem` would find all entities with both a `PositionComponent` and a `RenderableComponent` and draw them to the screen.*

This separation makes the code incredibly flexible. We can create new types of game objects just by mixing and matching components, without ever needing to write a new class.

## 2. Item & Equipment Structure

This is how we'll define all the items in the game using ECS. Note that while these components are now implemented, the systems that fully utilize them for complex game mechanics (e.g., crafting, equipment management, stat calculations) are still pending development.

### Base Item Types

-   **ItemComponent**: The most basic component for any item.
    -   `name`: "Steel Plate"
    -   `description`: "A slab of reinforced steel."
    -   `weight`: 500 (weight in grams)
    -   `slots`: 1.0 (inventory slots consumed, modules/parts use 0.5)
-   **RenderableComponent**: What the item looks like.
    -   `char`: "s"
    -   `colour`: "#ccc"
-   **StackableComponent**: For items that can be stacked.
    -   `quantity`: 10

### Item Categories (Defined by adding components)

-   **Resources**: An entity with `ItemComponent`, `RenderableComponent`, and `StackableComponent`.
    -   *Example: An entity representing "Steel" in an inventory.*
-   **Consumables**: An entity with `ItemComponent` and a `ConsumableComponent`.
    -   `ConsumableComponent`: `{ effect: 'HEAL_HP', value: 50 }`
    -   *Example: A "Medkit" entity.*
-   **Tools**: An entity with `ItemComponent` and an `EquipmentComponent`.
    -   `EquipmentComponent`: `{ slot: 'hand' }`
    -   *Example: A "Wrench" entity.*
-   **Wearables**: An entity with `ItemComponent` and a `WearableComponent`. Can also be equipment.
    -   `WearableComponent`: `{ slot: 'back' }`
    -   *Example: A "Backpack" entity, which could also have an `InventoryComponent` to increase player capacity.*
-   **Throwables**: An entity with `ItemComponent` and a `ThrowableComponent`.
    -   `ThrowableComponent`: `{ effect: 'EXPLODE', range: 3 }`
    -   *Example: A "Grenade" entity.*
-   **Key-like Items**: An entity with `ItemComponent` and a `KeyComponent`.
    -   `KeyComponent`: `{ keyId: 'CRYOBAY_7' }`
    -   *Example: A "Keycard" entity that can be checked by interactable doors.*

### Modular Equipment

This is where ECS shines. Equipment is an entity that holds other entities (its parts).

-   **AttachmentSlotsComponent**: Defines the parts a piece of equipment can have. It holds the entity IDs of the attached parts.
    ```javascript
    {
        slots: {
            chamber: { accepted_type: 'chamber', entity_id: 501 },
            barrel:  { accepted_type: 'barrel',  entity_id: 502 },
            // ...etc
        }
    }
    ```
-   **Guns**: An entity with:
    -   `ItemComponent` (name: "Rifle")
    -   `EquipmentComponent` (slot: 'hand')
    -   `GunComponent` (type: 'rifle')
    -   `AttachmentSlotsComponent` (defining slots for `chamber`, `grip`, `barrel`, etc.)
-   **Armour**: An entity with:
    -   `ItemComponent` (name: "Chest Plate")
    -   `EquipmentComponent` (slot: 'body')
    -   `ArmourComponent`
    -   `AttachmentSlotsComponent` (defining slots for `underlay`, `material`, `overlay`, etc.)
-   **Parts**: A part is just another item entity that can be placed into a slot.
    -   It will have an `ItemComponent` (name: "Long Barrel") and a `PartComponent`.
    -   `PartComponent`: `{ part_type: 'barrel' }`
    -   It will also have components that grant stats, e.g., `StatModifierComponent: { modifiers: { accuracy: 10 } }`.

## 3. Inventory System

The inventory system is managed by the `InventoryComponent`. Any entity can have an inventory by simply adding this component to it. This allows players, crates, and even dead creatures to hold items.

-   **`InventoryComponent`**:
    -   `capacity`: The number of item slots the inventory can hold (fractional slots supported).
    -   `maxWeight`: Maximum weight in grams (default 3000g).
    -   `currentWeight`: Current carried weight in grams.
    -   `items`: A Map that stores item data as Map<itemName, { entityId: number, quantity: number }>.

When an item is "picked up", its entity is not destroyed. Instead, its `PositionComponent` is removed (so it no longer appears in the world) and its ID is added to the player's `InventoryComponent`. Dropping an item does the reverse: the ID is removed from the inventory, and a `PositionComponent` is added back to the item entity.

**Important**: Equipped items weigh half as much as carried items (easier to wear than carry). Parts/modules consume 0.5 inventory slots instead of 1.0, allowing for more efficient storage of modular components.

## 4. Workbench Module System

The workbench allows players to swap modules on their modular equipment (guns and armor). This system provides an intuitive interface for customizing equipment with different parts.

### How It Works

1. **Accessing the Workbench**: Players activate a workbench interactable to open the workbench menu, which shows all equipment items (equipped and in inventory) that have an `AttachmentSlotsComponent`.

2. **Viewing Modules**: When a player selects an equipment item, they see a list of all its module slots and what's currently installed in each slot.

3. **Swapping Modules**: Selecting a module slot opens a submenu showing:
   - Option to remove the currently installed module (if one exists)
   - List of compatible modules from the player's inventory that can be installed

4. **Module Info Display**: When navigating through modules (whether in the workbench, inventory, or inspect menu), a white-bordered black box appears above the menu showing:
   - Module name (in yellow)
   - Module description (in gray)
   - Stat modifiers (in green), if any

### Menu Actions

The workbench uses the following menu actions (defined in `MENU_ACTIONS`):

- **`workbench_modules`**: Shows all module slots for a piece of equipment. Each slot displays what's currently installed or "Empty" if vacant. Each slot is selectable and leads to the swap menu.

- **`swap_module_menu`**: Shows compatible modules from inventory that can be installed in the selected slot, plus an option to remove the current module if one is installed.

- **`swap_module`**: Performs the actual module swap. If replacing a module, the old module goes to inventory and the new one is installed. If just removing, the module goes to inventory and the slot becomes empty.

### Generic Modules

To support the modular system, generic variants have been created for all required module types:

**Gun Modules** (required for guns):
- **Grips**: Basic, Compact, Ergonomic, Textured
- **Chambers**: Basic, Reinforced, Lightweight, Precision
- **Barrels**: Basic, Long, Compact, Rifled

**Armor Modules** (required for armor):
- **Underlays**: Basic, Padded, Mesh, Thermal
- **Materials**: Basic, Composite, Ceramic, Polymer
- **Overlays**: Basic, Reflective, Ablative, Camouflage

These generic modules have no stat modifiers, providing a baseline for equipment functionality. Future variants can include stat modifiers via the `StatModifierComponent`.

## 5. Full Component List

This is a complete list of all 34 components currently implemented in the game.

### Core Components

-   **`PositionComponent`**: Holds the entity's x/y coordinates in the game world.
    -   `{ x, y }`
-   **`RenderableComponent`**: Defines how an entity is drawn to the screen.
    -   `{ char, colour, layer }` (The `layer` determines draw order, e.g., scenery on layer 0, items on layer 1, creatures on layer 2).
-   **`SolidComponent`**: A "tag" component. If an entity has this, other entities cannot move into its space. It has no data.
-   **`PlayerComponent`**: A "tag" component used to identify the player entity for systems like input and HUD updates.
-   **`NameComponent`**: Display name for an entity. Used for item name overlays (Q key).
    -   `{ name }`
-   **`FacingComponent`**: Tracks which direction an entity is facing.
    -   `{ direction }` (values: 'up', 'down', 'left', 'right')

### Creature & Stats Components

-   **`CreatureStatsComponent`**: Holds all the vital statistics for a creature.
    -   `{ hunger, rest, stress, comfort, baseMinComfortTemp, baseMaxComfortTemp }`
-   **`BodyPartsComponent`**: Manages body parts for creatures (player and enemies). Each body part has an efficiency value (0-100) where 100 is full efficiency. Includes methods to damage, heal, add, and remove body parts.
    -   `parts<Map>` - Maps body part names to efficiency values
    -   Methods: `getPart()`, `setPart()`, `damage()`, `heal()`, `addPart()`, `removePart()`, `getDamagedParts()`, `getAllParts()`
-   **`ComfortModifiersComponent`**: Modifies the creature's temperature comfort range.
    -   `{ minTempModifier, maxTempModifier }` - Adjustments to comfort temperature thresholds

### Interaction Components

-   **`InteractableComponent`**: Marks an entity as interactable.
    -   `{ script, scriptArgs }` (The `script` from `SCRIPT_REGISTRY` is triggered on activation).

### Item Components

-   **`ItemComponent`**: The base component for any item.
    -   `{ name, description, weight, slots }` (weight is in grams, slots is inventory space consumed)
-   **`InventoryComponent`**: Gives an entity the ability to hold other entities (items).
    -   `{ capacity, maxWeight, currentWeight, items<Map> }`
    -   Methods: `addItem()`, `removeItem()`, `hasItem()`, `getItemQuantity()`, `getTotalWeight()`, `canAddItem()`
-   **`ActionComponent`**: A temporary component added to an entity to signify it is performing an action. It is usually removed by a system after being processed.
    -   `{ name, payload }` (e.g., `name: 'move'`, `payload: { dx: 1, dy: 0 }`).
-   **`StackableComponent`**: For items that can be stacked.
    -   `{ quantity }`
-   **`ConsumableComponent`**: For items that can be consumed.
    -   `{ effect, value }`

### Equipment Components

-   **`EquipmentComponent`**: Marks an item as equippable to a specific slot.
    -   `{ slot }` (e.g., 'hand', 'body', 'head')
-   **`EquippedItemsComponent`**: Tracks what items are currently equipped.
    -   `{ items<Map> }` - Maps equipment slots to entity IDs
    -   Methods: `equip()`, `unequip()`, `getEquipped()`, `isEquipped()`
-   **`AttachmentSlotsComponent`**: Defines slots for modular equipment.
    -   `{ slots: { [slotName]: { accepted_type, entity_id } } }`

### Weapon & Armor Components

-   **`GunComponent`**: Marks an item as a gun of a specific type.
    -   `{ type }` (e.g., 'pistol', 'rifle', 'shotgun')
-   **`GunStatsComponent`**: Calculated stats for a gun based on installed modules.
    -   `{ damage, accuracy, range, magSize, reloadTime, recoilMultiplier, noiseLevel, modifiers }`
-   **`ArmourComponent`**: Marks an item as armour of a specific type.
    -   `{ type }` (e.g., 'light', 'medium', 'heavy')
-   **`ArmourStatsComponent`**: Calculated stats for armor based on installed modules.
    -   `{ coverage<Map>, modifiers }` - Coverage values per body part (head, torso, limbs)
-   **`PartComponent`**: Marks an item as a part for modular equipment.
    -   `{ part_type }` (e.g., 'grip', 'barrel', 'chamber', 'underlay', 'material', 'overlay')
-   **`StatModifierComponent`**: Applies stat modifiers to equipment or entities.
    -   `{ modifiers: { [statName]: value } }` (e.g., `{ accuracy: 10, damage: 5 }`)

### Combat Components

-   **`CombatStateComponent`**: Tracks an entity's state during combat.
    -   `{ initiative, movementPoints, maxMovementPoints, combatStress, inCover }`
-   **`CombatantComponent`**: Marks an entity as a participant in combat.
    -   `{ sessionId }` - ID of the combat session this entity is in
-   **`CombatSessionComponent`**: Manages an active combat session.
    -   `{ sessionId, participants[], turnOrder[], currentTurnIndex, round, active }`
-   **`DamageEventComponent`**: Queues a damage event for processing.
    -   `{ targetEntity, attacker, bodyPart, damage, damageType, armorPenetration }`
-   **`AIComponent`**: Configures enemy AI behavior.
    -   `{ behavior, state, detectionRange, chaseRange, attackRange, lastKnownPlayerPos }`
    -   Behaviors: 'passive', 'defensive', 'aggressive', 'patrol'
    -   States: 'idle', 'alert', 'chasing', 'attacking', 'retreating'
-   **`ProjectileComponent`**: Manages projectile movement and rendering.
    -   `{ startPos, targetPos, currentPos, speed, char, colour, damage, firedBy }`

### UI Components

-   **`MenuComponent`**: Holds the state for an active in-game menu.
    -   `{ title, options[], selectedIndex, submenu, submenuSelectedIndex, activeMenu, highlightedModule, interactable }`
    -   The `submenu` field holds nested menu data for side-by-side menu displays.
    -   The `highlightedModule` field stores the entity ID of a module to display info for (used in workbench and inventory).
-   **`MessageComponent`**: Holds text and duration for a temporary on-screen message.
    -   `{ text, duration }`

### Ship & Time Components

-   **`ShipComponent`**: Manages the player's ship resources.
    -   `{ water, maxWater, fuel, maxFuel, location, docked }`
    -   Methods: `consumeWater()`, `addWater()`, `consumeFuel()`, `addFuel()`
-   **`TimeComponent`**: Tracks game time progression.
    -   `{ hour, day, season, totalGameMinutes }`
    -   Methods: `advanceTime()`, `getTimeString()`, `getDateString()`

## 6. System Architecture

The game uses 14 specialized systems, each handling a specific aspect of the game loop. All systems operate on ECS entities and components.

### Core Systems

-   **`RenderSystem`** (systems/render-system.js - 399 lines)
    -   Renders all visible entities to the game grid
    -   Handles layered rendering (scenery → items → creatures)
    -   Manages player cursor blinking effect
    -   Updates DOM for visual representation

-   **`InputSystem`** (systems/input-system.js - 300 lines)
    -   Processes keyboard input
    -   Handles movement, combat actions, menu navigation
    -   Manages inventory and interaction hotkeys
    -   Supports both normal and combat input modes

-   **`MovementSystem`** (systems/movement-system.js - 110 lines)
    -   Processes movement actions
    -   Collision detection with walls and solid entities
    -   Bounds checking
    -   Triggers combat when player approaches enemies

-   **`MessageSystem`** (systems/message-system.js - 27 lines)
    -   Displays temporary on-screen messages
    -   Manages message lifetimes and cleanup
    -   Updates message overlay DOM

-   **`HudSystem`** (systems/hud-system.js - 60 lines)
    -   Updates the heads-up display
    -   Shows hunger, rest, stress, comfort bars
    -   Displays body part status
    -   Shows inventory and weight information

-   **`InteractionSystem`** (systems/interaction-system.js - 66 lines)
    -   Handles entity interactions (e.g., picking up items, opening doors)
    -   Executes scripts from `SCRIPT_REGISTRY`
    -   Manages interactable activation

### Survival Systems

-   **`ComfortSystem`** (systems/comfort-system.js - 50 lines)
    -   Manages comfort and stress levels
    -   Adjusts stress based on comfort thresholds
    -   Periodic stress updates (every 30 seconds)

-   **`TimeSystem`** (systems/time-system.js - 186 lines) ⭐ NEW
    -   Advances game time (30 seconds real = 5 minutes game)
    -   Processes hunger depletion (80% every 12 hours)
    -   Handles body part healing (2% per day)
    -   Manages sleep mechanics and time skipping
    -   Updates water consumption

-   **`ShipSystem`** (systems/ship-system.js - 47 lines)
    -   Manages ship resources (water, fuel)
    -   Periodic water consumption
    -   Updates ship HUD display
    -   Tracks ship location and docking status

### Combat Systems

-   **`CombatSystem`** (systems/combat/combat-system.js - 417 lines)
    -   Manages turn-based combat flow
    -   Handles initiative and turn order
    -   Processes combat actions (shoot, reload, move, wait, end turn)
    -   Manages combat session lifecycle
    -   Detects combat start/end conditions

-   **`ActionResolutionSystem`** (systems/combat/action-resolution-system.js - 276 lines)
    -   Resolves combat actions into effects
    -   Calculates hit chances and damage
    -   Handles body part targeting
    -   Processes armor penetration
    -   Creates damage events

-   **`DamageSystem`** (systems/combat/damage-system.js - 185 lines)
    -   Processes queued damage events
    -   Applies damage to body parts
    -   Checks for entity death
    -   Manages armor damage reduction
    -   Updates combat messages

-   **`CombatAISystem`** (systems/combat/combat-ai-system.js - 175 lines)
    -   Controls enemy behavior during combat
    -   Implements AI states (idle, alert, chasing, attacking)
    -   Pathfinding and movement toward player
    -   Decision-making for actions (shoot, move, reload)

-   **`ProjectileSystem`** (systems/projectile-system.js - 43 lines)
    -   Animates projectile movement
    -   Handles projectile rendering
    -   Cleans up projectiles after animation

## 7. The Refactoring Journey

The transition to the new ECS architecture has been **fully completed**.

### ✅ Phase 1: Build the Foundation - **COMPLETE**
-   The core ECS classes (`Entity`, `Component`, `System`, `World`) are implemented in `ecs.js`. The `World` manages all entities and systems.

### ✅ Phase 2: Define Components - **COMPLETE**
-   `components.js` contains all 34 component definitions, including items, equipment, combat, UI, ship, and time components.

### ✅ Phase 3: Shift the Game Logic - **COMPLETE**
-   The main `game.js` file is simplified to just 146 lines, creating a `World` instance and orchestrating systems. The old `Room` class and its associated logic have been removed, with world generation handled by `world-builder.js`.

### ✅ Phase 4: Implement Systems - **COMPLETE**
-   All 14 systems are implemented in individual files, organized into `systems/` and `systems/combat/` directories. These systems operate purely on ECS entities and components.

### ✅ Phase 5: Modularize Codebase - **COMPLETE**
-   Monolithic files split into focused modules:
    - `game.js`: 1,454 → 146 lines (90% reduction)
    - `systems.js`: 2,096 → eliminated (split into 14 files)
    - Created `config/`, `data/`, `utils/`, `handlers/` directories

### ✅ Phase 6: Code Cleanup - **MOSTLY COMPLETE**
-   Removed unused components (WearableComponent, ThrowableComponent, KeyComponent)
-   Removed deprecated code
-   Fixed critical bugs
-   See [cleanup.md](../cleanup.md) for remaining minor items

This phased approach ensured we could make progress without breaking the game at every step, resulting in a robust, scalable, and maintainable ECS foundation.

**The architecture is complete and production-ready.**
