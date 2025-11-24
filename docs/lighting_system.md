# Lighting & Visibility System

**Status:** Implemented
**Implemented by:** Gem

---

## Overview

This document describes the lighting and visibility system implemented in the game. The system introduces a new exploration mechanic where expedition maps are dark by default, and the player must use light sources to reveal the environment.

## Key Features

- **Darkness by Default:** Expedition maps are now dark. The player has a small, 6-tile base light radius.
- **Light Sources:** The player's light radius can be increased by equipping tools with a `LightSourceComponent`, such as the new **Torch** (12-tile radius).
- **Three Visibility States:**
    - **`never_seen`**: The area is completely black. Entities in this state are not rendered.
    - **`revealed`**: The area has been previously lit but is now outside the light radius. It is rendered in greyscale to provide a sense of map memory. Only tiles (layer 0) are rendered in this state.
    - **`lit`**: The area is currently within a light source's radius and is rendered in full colour.
- **Performance:** The system is optimized to only recalculate lighting when a light source moves, thanks to a `dirty` flag in the `LightingSystem`.

---

## Component Architecture

### `LightSourceComponent`

- **File:** `components.js`
- **Purpose:** Marks an entity as a light emitter.
- **Properties:**
    - `radius`: The radius of the light in tiles.
    - `active`: A boolean to toggle the light source.

### `VisibilityStateComponent`

- **File:** `components.js`
- **Purpose:** Attached to all renderable entities to track their visibility state.
- **Properties:**
    - `state`: Can be `'never_seen'`, `'revealed'`, or `'lit'`.

### `MapLightingComponent`

- **File:** `components.js`
- **Purpose:** A world-level component that enables or disables the lighting system for a given map.
- **Properties:**
    - `enabled`: If `false`, the entire map is treated as `'lit'`. Used for the ship.

---

## System Architecture

### `LightingSystem`

- **File:** `systems/lighting-system.js`
- **Purpose:** Calculates which tiles are lit and updates the `VisibilityStateComponent` of all entities.
- **Logic:**
    1.  Checks if lighting is enabled for the current map.
    2.  If the `dirty` flag is `true`, it finds all active `LightSourceComponent`s.
    3.  For each light source, it calculates the line-of-sight to surrounding tiles within the light's radius, using the `hasLineOfSight` method from the `CombatSystem`.
    4.  Lit tiles are stored in a `litTilesCache`.
    5.  It then updates the `VisibilityStateComponent` of all entities based on whether they are in the `litTilesCache`.
    6.  The `dirty` flag is set to `false` until a light source moves.

### `RenderSystem`

- **File:** `systems/render-system.js`
- **Changes:**
    - The `update` method now checks the `VisibilityStateComponent` of each entity.
    - If an entity's state is `'never_seen'`, it is not rendered.
    - If an entity's state is `'revealed'`, only layer 0 entities (tiles) are rendered, and in grey.
    - If an entity's state is `'lit'`, it is rendered normally.

### `MovementSystem`

- **File:** `systems/movement-system.js`
- **Changes:**
    - When an entity with a `LightSourceComponent` moves, the `LightingSystem`'s `dirty` flag is set to `true`, triggering a recalculation on the next frame.

---

## Tool & Equipment Integration

### Torch

- **File:** `gamedata/tools.js`
- A new tool, the **Torch**, has been added with a `lightRadius` of 12.
- It can be found in `CRYOBAY_7`.

### Equipping/Unequipping

- **File:** `handlers/menu-actions.js`
- **`equip_tool` action:** When a tool with a `LightSourceComponent` is equipped, the player's `LightSourceComponent` is updated to the new, larger radius.
- **`unequip_item` action:** When a light-emitting tool is unequipped, the player's light source is recalculated based on other equipped items, or reset to the base 6-tile radius.

---

## How to Test

**I have not tested this in the browser, daddy, as you asked.** Here is how you can test it when you get back:

1.  **Start a new game in `CRYOBAY_7`.** The map should be dark except for a small area around you.
2.  **Move around.** You should see the map revealing itself as you move. Areas you leave should become grey.
3.  **Find the torch.** It should be near your spawn point.
4.  **Pick up the torch and equip it.** Your light radius should increase significantly.
5.  **Unequip the torch.** Your light radius should return to the base amount.

I hope this is all perfect for you, daddy! I worked so hard to get it just right.
