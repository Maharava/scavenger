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
    -   `capacity`: The number of items the inventory can hold.
    -   `items`: An array that stores the unique **entity IDs** of the items it contains.

When an item is "picked up", its entity is not destroyed. Instead, its `PositionComponent` is removed (so it no longer appears in the world) and its ID is added to the player's `InventoryComponent`. Dropping an item does the reverse: the ID is removed from the inventory, and a `PositionComponent` is added back to the item entity.

## 4. Full Component List

This is a list of all components currently implemented in the game.

-   **`PositionComponent`**: Holds the entity's x/y coordinates in the game world.
    -   `{ x, y }`
-   **`RenderableComponent`**: Defines how an entity is drawn to the screen.
    -   `{ char, colour, layer }` (The `layer` determines draw order, e.g., scenery on layer 0, items on layer 1, creatures on layer 2).
-   **`SolidComponent`**: A "tag" component. If an entity has this, other entities cannot move into its space. It has no data.
-   **`PlayerComponent`**: A "tag" component used to identify the player entity for systems like input and HUD updates.
-   **`CreatureStatsComponent`**: Holds all the vital statistics for a creature, including health and vitals.
-   **`InteractableComponent`**: Marks an entity as interactable.
    -   `{ script, scriptArgs }` (The `script` from `SCRIPT_REGISTRY` is triggered on activation).
-   **`ItemComponent`**: The base component for any item.
    -   `{ name, description }`
-   **`InventoryComponent`**: Gives an entity the ability to hold other entities (items).
    -   `{ capacity, items[] }`
-   **`ActionComponent`**: A temporary component added to an entity to signify it is performing an action. It is usually removed by a system after being processed.
    -   `{ name, payload }` (e.g., `name: 'move'`, `payload: { dx: 1, dy: 0 }`).
-   **`StackableComponent`**: For items that can be stacked.
    -   `{ quantity }`
-   **`ConsumableComponent`**: For items that can be consumed.
    -   `{ effect, value }`
-   **`EquipmentComponent`**: Marks an item as equippable to a specific slot.
    -   `{ slot }`
-   **`WearableComponent`**: Marks an item as wearable to a specific slot.
    -   `{ slot }`
-   **`ThrowableComponent`**: Marks an item as throwable with an effect and range.
    -   `{ effect, range }`
-   **`KeyComponent`**: Marks an item as a key for specific locks.
    -   `{ keyId }`
-   **`AttachmentSlotsComponent`**: Defines slots for modular equipment.
    -   `{ slots: { [slotName]: { accepted_type, entity_id } } }`
-   **`GunComponent`**: Marks an item as a gun of a specific type.
    -   `{ type }`
-   **`ArmourComponent`**: Marks an item as armour of a specific type.
    -   `{ type }`
-   **`PartComponent`**: Marks an item as a part for modular equipment.
    -   `{ part_type }`
-   **`StatModifierComponent`**: Applies stat modifiers to an entity.
    -   `{ modifiers: { [statName]: value } }`
-   **`MenuComponent`**: Holds the state for an active in-game menu.
    -   `{ title, options[], selectedIndex, interactable }`
-   **`MessageComponent`**: Holds text and duration for a temporary on-screen message.
    -   `{ text, duration }`

## 5. The Refactoring Plan

The transition to the new ECS architecture has been largely completed.

1.  **Phase 1: Build the Foundation.** - **Completed.**
    -   The core ECS classes (`Entity`, `Component`, `System`, `World`) are implemented in `ecs.js`. The `World` manages all entities and systems.

2.  **Phase 2: Define Components.** - **Completed.**
    -   `components.js` contains all necessary component definitions, including those for items, equipment, and UI elements.

3.  **Phase 3: Shift the Game Logic.** - **Completed.**
    -   The main `game.js` file is simplified, creating a `World` instance and orchestrating systems. The old `Room` class and its associated logic have been removed, with world generation handled by `world-builder.js`.

4.  **Phase 4: Implement Systems.** - **Completed.**
    -   `systems.js` contains `RenderSystem`, `InputSystem`, `MovementSystem`, `HudSystem`, `InteractionSystem`, and `MessageSystem`. These systems now operate purely on ECS entities and components.

5.  **Phase 5: Deprecate Old Code.** - **Largely Completed.**
    -   The old `Entity`, `Creature`, `Interactable`, `Room`, and `Menu` classes have been removed or replaced by the ECS structure. Minor cleanup, such as fully componentizing the player's name in `HudSystem` and externalizing the `SolidComponent` definition for interactables, is still pending.

This phased approach ensured we could make progress without breaking the game at every step, resulting in a robust and scalable ECS foundation.
