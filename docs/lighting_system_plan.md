# Lighting & Visibility System - Complete Implementation Plan

**Status:** Design Phase - Ready to Implement
**Priority:** High (Core exploration mechanic)
**Complexity:** Medium-High
**Breaking Changes:** Minimal (additive feature)

---

## Overview

A light-based exploration system where expedition maps start in complete darkness. The player and certain equipment/interactables emit light that reveals the environment. Revealed areas remain visible as gray when outside light radius, allowing map memory but not real-time updates.

**Key Design Principles:**
- Darkness is an **exploration mechanic only** (doesn't affect enemy detection/AI)
- One-time maps mean no persistence needed
- Sharp, clear visuals (pure black → gray → full color)
- Performance-optimized with dirty flags and caching

---

## Visual Specification

### Three Visibility States

| State | Visual | Entities Visible? | Use Case |
|-------|--------|-------------------|----------|
| **Never Seen** | Pure black `#000000` | No | Unexplored darkness |
| **Revealed** | Gray `#666666` | No | Previously explored, now dark |
| **Lit** | Full color | Yes | Currently in light radius |

### Rendering Examples

```
# = Never seen (pure black, nothing rendered)
. = Revealed floor (gray '#666')
@ = Player (full color, lit)
+ = Revealed wall (gray '#666')
i = Item in light (full color)
  = Lit floor (full color)

######################
######################
#####+++++++##########
#####+.....+##########
#####+ @ i +##########    ← Player emits 6-tile light
#####+.....+##########       Everything in radius: full color
#####+++++++##########       Beyond radius: gray
######################       Unexplored: pure black
```

---

## Component Architecture

### 1. LightSourceComponent

Marks entities that emit light.

```javascript
class LightSourceComponent {
    constructor(radius = 0, active = true) {
        this.radius = radius;    // Light radius in tiles
        this.active = active;    // Can be toggled on/off
    }
}
```

**Attached to:**
- Player entity (base 6 radius)
- Equipped tools (torches: 12, helmet lamps: 10, gun lights: 8)
- Interactables (emergency lights, computer terminals, fire)

**Properties:**
- `radius`: Number of tiles the light reaches
- `active`: Boolean toggle (for flickering lights, toggleable equipment)

---

### 2. VisibilityStateComponent

Tracks visibility state of tiles and entities.

```javascript
class VisibilityStateComponent {
    constructor() {
        this.state = 'never_seen';  // 'never_seen', 'revealed', 'lit'
    }
}
```

**Attached to:**
- All floor/wall tiles
- All entities (items, enemies, interactables)

**States:**
- `never_seen`: Never been in light radius (render as pure black, don't render entities)
- `revealed`: Previously lit, now outside radius (render as gray `#666`)
- `lit`: Currently in light radius (render at full color)

---

### 3. MapLightingComponent

Map-level metadata indicating if lighting system is active.

```javascript
class MapLightingComponent {
    constructor(enabled = true) {
        this.enabled = enabled;  // If false, entire map is lit (ship)
    }
}
```

**Attached to:**
- World (one per game)

**Purpose:**
- Ship maps: `enabled = false` (always fully lit)
- Expedition maps: `enabled = true` (darkness system active)

---

## System Architecture

### LightingSystem

New system that calculates lit areas and updates visibility states.

```javascript
class LightingSystem extends System {
    constructor() {
        super();
        this.litTilesCache = new Set();  // Set of "x,y" strings
        this.dirty = true;                // Needs recalculation?
    }

    update(world) {
        // 1. Check if lighting is enabled for this map
        const mapLighting = world.mapLighting; // Stored on world
        if (!mapLighting || !mapLighting.enabled) {
            // Ship map - everything is always lit
            this.ensureAllLit(world);
            return;
        }

        // 2. Only recalculate if something changed
        if (!this.dirty) {
            return;
        }

        // 3. Clear previous lit tiles
        this.litTilesCache.clear();

        // 4. Find all active light sources
        const lightSources = world.query(['PositionComponent', 'LightSourceComponent']);

        // 5. Calculate lit areas for each light source
        for (const source of lightSources) {
            const light = source.getComponent('LightSourceComponent');
            if (!light.active) continue;

            const pos = source.getComponent('PositionComponent');
            this.calculateLitArea(world, pos, light.radius);
        }

        // 6. Update visibility states for all tiles and entities
        this.updateVisibilityStates(world);

        // 7. Mark as clean
        this.dirty = false;
    }

    calculateLitArea(world, centerPos, radius) {
        // For each tile within radius, check LOS
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                const x = centerPos.x + dx;
                const y = centerPos.y + dy;

                // Check if within radius (Manhattan distance)
                const distance = Math.abs(dx) + Math.abs(dy);
                if (distance > radius) continue;

                // Check LOS (use existing hasLineOfSight from combat system)
                // Access via world.game since CombatSystem has it
                const hasLOS = world.game.combatSystem.hasLineOfSight(
                    world,
                    centerPos,
                    { x, y }
                );

                if (hasLOS) {
                    this.litTilesCache.add(`${x},${y}`);
                }
            }
        }
    }

    updateVisibilityStates(world) {
        // Update all entities with VisibilityStateComponent
        const visibleEntities = world.query(['PositionComponent', 'VisibilityStateComponent']);

        for (const entity of visibleEntities) {
            const pos = entity.getComponent('PositionComponent');
            const vis = entity.getComponent('VisibilityStateComponent');
            const tileKey = `${pos.x},${pos.y}`;

            if (this.litTilesCache.has(tileKey)) {
                // Currently lit
                vis.state = 'lit';
            } else if (vis.state === 'lit') {
                // Was lit, now isn't - mark as revealed
                vis.state = 'revealed';
            }
            // If never_seen, stays never_seen until lit
        }
    }

    ensureAllLit(world) {
        // Ship map - set everything to 'lit' state
        const visibleEntities = world.query(['VisibilityStateComponent']);
        for (const entity of visibleEntities) {
            const vis = entity.getComponent('VisibilityStateComponent');
            vis.state = 'lit';
        }
    }

    // Called by MovementSystem when player/light source moves
    markDirty() {
        this.dirty = true;
    }
}
```

**Key Features:**
- **Dirty flag optimization**: Only recalculates when lights move
- **LOS reuse**: Leverages existing `hasLineOfSight` from combat
- **Cache**: Stores lit tiles in Set for O(1) lookups
- **Ship bypass**: Automatically handles always-lit ship maps

---

## Rendering Integration

### Update RenderSystem

Modify `render-system.js` to respect visibility states:

```javascript
#renderGrid(world, container) {
    container.innerHTML = '';

    // Check if lighting is enabled
    const lightingEnabled = world.mapLighting && world.mapLighting.enabled;

    // Sort entities by layer for proper z-ordering
    const renderables = world.query(['PositionComponent', 'RenderableComponent']);
    renderables.sort((a, b) => {
        const aRender = a.getComponent('RenderableComponent');
        const bRender = b.getComponent('RenderableComponent');
        return aRender.layer - bRender.layer;
    });

    for (const entity of renderables) {
        const pos = entity.getComponent('PositionComponent');
        const render = entity.getComponent('RenderableComponent');
        const vis = entity.getComponent('VisibilityStateComponent');

        // Handle visibility
        if (lightingEnabled && vis) {
            // Never seen tiles: don't render at all
            if (vis.state === 'never_seen') {
                // Render pure black tile instead
                this.#renderBlackTile(container, pos.x, pos.y);
                continue;
            }

            // Revealed tiles: render in gray
            if (vis.state === 'revealed') {
                // Tiles render gray, but skip entities (items, enemies)
                if (render.layer === 0) {
                    // Floor/wall tiles - render gray
                    this.#renderTile(container, pos.x, pos.y, render.char, '#666', render.layer);
                }
                // Skip layer 1+ entities (they're not visible in darkness)
                continue;
            }

            // Lit tiles: render normally (full color)
            // Fall through to normal rendering
        }

        // Normal rendering for lit tiles or when lighting disabled
        const isSelectedEnemy = /* ... existing logic ... */;

        // Skip rendering selected enemy every other blink cycle
        if (isSelectedEnemy && this.blinkState) {
            continue;
        }

        this.#renderTile(
            container,
            pos.x,
            pos.y,
            render.char,
            isSelectedEnemy ? '#ffff00' : render.colour,
            render.layer
        );
    }

    // Render menus, weapon range, item names as before...
}

#renderBlackTile(container, x, y) {
    // Render pure black for never-seen areas
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.style.gridColumn = x + 1;
    tile.style.gridRow = y + 1;
    tile.textContent = ' '; // Empty
    tile.style.color = '#000';
    tile.style.backgroundColor = '#000';
    container.appendChild(tile);
}

#renderTile(container, x, y, char, colour, layer) {
    // Existing tile rendering code (unchanged)
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.style.gridColumn = x + 1;
    tile.style.gridRow = y + 1;
    tile.textContent = char;
    tile.style.color = colour;
    tile.dataset.layer = layer;
    container.appendChild(tile);
}
```

**Rendering Logic:**
1. **Never seen**: Render pure black tile, skip all entities
2. **Revealed**: Render tiles gray, skip entities (no real-time updates)
3. **Lit**: Render everything full color (normal rendering)

---

## Movement Integration

### Update MovementSystem

Trigger lighting recalculation when light sources move:

```javascript
// In MovementSystem.update(), after successful player movement:

// Check if entity has a light source
const light = entity.getComponent('LightSourceComponent');
if (light) {
    // Mark lighting system dirty for recalculation
    const lightingSystem = world.systems.find(s => s instanceof LightingSystem);
    if (lightingSystem) {
        lightingSystem.markDirty();
    }
}
```

**Also trigger on:**
- Door opening/closing (changes LOS)
- Interactable light toggle
- Equipment changes (torch equipped/unequipped)

---

## Equipment Light Integration

### Tools with Light (Torches, Lamps, etc.)

When tool is equipped:

```javascript
// In menu-actions.js, equip_item action:

'equip_item': (game, args) => {
    // ... existing equip logic ...

    // Check if equipped item has a light source
    const light = world.getEntity(itemEntityId).getComponent('LightSourceComponent');
    if (light) {
        // Add light component to player
        player.addComponent(new LightSourceComponent(light.radius, true));

        // Mark lighting dirty
        const lightingSystem = world.systems.find(s => s instanceof LightingSystem);
        if (lightingSystem) {
            lightingSystem.markDirty();
        }
    }
}
```

When tool is unequipped:

```javascript
'unequip_item': (game, args) => {
    // ... existing unequip logic ...

    // Check if unequipped item had light
    const light = world.getEntity(itemEntityId).getComponent('LightSourceComponent');
    if (light) {
        // Remove light component from player
        player.removeComponent('LightSourceComponent');

        // Re-add base player light (6 radius)
        player.addComponent(new LightSourceComponent(6, true));

        // Mark lighting dirty
        const lightingSystem = world.systems.find(s => s instanceof LightingSystem);
        if (lightingSystem) {
            lightingSystem.markDirty();
        }
    }
}
```

### Armor/Gun Mods with Light

Modules can have `LightSourceComponent`. When calculating equipment stats, check for light mods:

```javascript
// In utils/equipment-stats.js, after calculating armor/gun stats:

function updateArmourStats(world, armourEntity) {
    // ... existing stat calculation ...

    // Check for light-emitting modules
    let totalLightRadius = 0;
    for (const [slotName, slotData] of Object.entries(attachmentSlots.slots)) {
        if (slotData.entity_id) {
            const partEntity = world.getEntity(slotData.entity_id);
            const partLight = partEntity.getComponent('LightSourceComponent');
            if (partLight) {
                totalLightRadius = Math.max(totalLightRadius, partLight.radius);
            }
        }
    }

    // Add light component to armor if mods emit light
    if (totalLightRadius > 0) {
        armourEntity.addComponent(new LightSourceComponent(totalLightRadius, true));
    }
}
```

---

## World Builder Integration

### Add Components to Map Entities

```javascript
// In world-builder.js, when creating tiles:

function buildWorld(world, mapId) {
    const map = MAP_DATA[mapId];
    if (!map) {
        console.error(`Map with id "${mapId}" not found!`);
        return;
    }

    // Set map lighting (from map data)
    world.mapLighting = new MapLightingComponent(map.darkMap || false);

    // Create entities from layout
    for (let y = 0; y < map.layout.length; y++) {
        const row = map.layout[y];
        for (let x = 0; x < row.length; x++) {
            const char = row[x];
            const entity = world.createEntity();
            world.addComponent(entity, new PositionComponent(x, y));

            // Add visibility component to all tiles
            world.addComponent(entity, new VisibilityStateComponent());

            let isPlaceholder = map.interactables.some(i => i.x === x && i.y === y);

            if (char === '+' && !isPlaceholder) {
                world.addComponent(entity, new RenderableComponent('+', '#666', 0));
                world.addComponent(entity, new SolidComponent());
                world.addSolidTileToCache(x, y);
            } else if (char === '.' || isPlaceholder) {
                world.addComponent(entity, new RenderableComponent('.', '#333', 0));
            }
        }
    }

    // Add visibility to interactables
    map.interactables.forEach(item => {
        // ... existing interactable creation ...

        // Add visibility component
        world.addComponent(entity, new VisibilityStateComponent());

        // Add light component if defined
        if (def.lightRadius && def.lightRadius > 0) {
            world.addComponent(entity, new LightSourceComponent(def.lightRadius, true));
        }
    });

    // Add base light to player
    const player = world.query(['PlayerComponent'])[0];
    if (player && world.mapLighting.enabled) {
        world.addComponent(player.id, new LightSourceComponent(6, true));
    }
}
```

---

## Map Data Format

### Update gamedata/map.js

```javascript
const MAP_DATA = {
    'SHIP': {
        layout: [ /* ... */ ],
        interactables: [ /* ... */ ],
        darkMap: false  // ← Ship is always lit
    },

    'CRYOBAY_7': {
        layout: [ /* ... */ ],
        interactables: [
            { id: 'WORKBENCH', x: 5, y: 5 },
            { id: 'EMERGENCY_LIGHT', x: 10, y: 10 }, // ← Has light
            // ...
        ],
        darkMap: true  // ← Expedition map has darkness
    }
};
```

---

## Interactable Data Format

### Update gamedata/interactables.js

```javascript
const INTERACTABLE_DATA = [
    {
        id: 'EMERGENCY_LIGHT',
        name: 'Emergency Light',
        char: 'L',
        colour: '#ffff00',
        lightRadius: 8,  // ← Emits 8-tile light
        menu: {
            title: "A flickering emergency light.",
            options: [
                { label: 'Cancel', action: 'close_menu' }
            ]
        }
    },

    {
        id: 'COMPUTER_TERMINAL',
        name: 'Computer Terminal',
        char: 'T',
        colour: '#00ff00',
        lightRadius: 4,  // ← Screen glow
        menu: { /* ... */ }
    },

    {
        id: 'WORKBENCH',
        name: 'Workbench',
        char: 'W',
        colour: '#888888',
        lightRadius: 0,  // ← No light (default)
        menu: { /* ... */ }
    }
];
```

---

## Tool Equipment Integration

Light-emitting tools (torches, flashlights) will be covered in the separate Tool System plan. When tools are equipped, they should:

1. Add their `LightSourceComponent` to the player
2. Mark `LightingSystem` as dirty
3. Trigger immediate recalculation

---

## Flickering Lights (Optional Enhancement)

For atmospheric flickering emergency lights:

```javascript
class LightSourceComponent {
    constructor(radius = 0, active = true, flicker = false) {
        this.radius = radius;
        this.active = active;
        this.flicker = flicker;          // ← Enable flickering
        this.flickerTimer = 0;           // Internal timer
        this.flickerInterval = 0.5;      // Flicker every 0.5 seconds
        this.flickerChance = 0.3;        // 30% chance to toggle per interval
    }
}

// In LightingSystem.update():
if (light.flicker) {
    light.flickerTimer += deltaTime;
    if (light.flickerTimer >= light.flickerInterval) {
        light.flickerTimer = 0;
        if (Math.random() < light.flickerChance) {
            light.active = !light.active;  // Toggle on/off
            this.dirty = true;             // Trigger recalculation
        }
    }
}
```

**Interactable definition:**
```javascript
{
    id: 'DAMAGED_EMERGENCY_LIGHT',
    name: 'Damaged Emergency Light',
    char: 'L',
    colour: '#ff8800',
    lightRadius: 6,
    lightFlicker: true,  // ← Enable flickering
    menu: { /* ... */ }
}
```

---

## System Registration

### Update game.js

```javascript
// In Game.init(), register the new system:

this.world.registerSystem(new LightingSystem());  // ← Add after MovementSystem
```

**System order matters:**
1. MovementSystem (moves entities)
2. LightingSystem (recalculates light after movement)
3. RenderSystem (renders based on visibility states)

---

## Performance Considerations

### Optimization Strategies

1. **Dirty Flag**
   - Only recalculate when player/lights move
   - Typical case: 0 calculations per frame (standing still)
   - Worst case: 1 calculation per frame (constant movement)

2. **Cached Lit Tiles**
   - Set lookup is O(1)
   - Avoids repeated LOS checks for same tiles

3. **LOS Reuse**
   - Already implemented for combat
   - Already optimized with solid tile cache
   - No additional cost

4. **Radius Limits**
   - Max radius ~15 tiles (torches)
   - Typical radius 6-10 tiles
   - Affects (2r+1)² tiles max = 961 tiles for r=15
   - With LOS rejection, typically 50-100 tiles checked

**Performance estimate:**
- Small map (50×50): ~100 tiles checked per light source
- 3 light sources (player + 2 interactables): 300 tile checks
- Only when moving: 60fps maintained easily

---

## Testing Plan

### Unit Tests

1. ✅ **Visibility state transitions**
   - never_seen → lit (when entering light)
   - lit → revealed (when leaving light)
   - revealed → lit (when re-entering light)

2. ✅ **Light blocking**
   - Wall blocks light completely
   - Open door allows light through
   - Closed door blocks light

3. ✅ **Multiple light sources**
   - Player + torch = combined lit area (not merged radius)
   - Overlapping light sources work correctly

4. ✅ **Ship vs expedition**
   - Ship map: everything always lit
   - Expedition map: darkness system active

### Integration Tests

1. ✅ **Equipment changes**
   - Equip torch → light radius increases, dirty flag set
   - Unequip torch → light radius decreases, dirty flag set

2. ✅ **Door interactions**
   - Open door → light passes through
   - Close door → light blocked

3. ✅ **Movement**
   - Player moves → lighting recalculated
   - Revealed tiles stay gray
   - Never-seen tiles discovered

4. ✅ **Interactable lights**
   - Emergency light visible from distance
   - Computer terminal glow illuminates nearby area

---

## Implementation Checklist

### Phase 1: Core Components (2-3 hours)
- [ ] Create `LightSourceComponent` (components.js)
- [ ] Create `VisibilityStateComponent` (components.js)
- [ ] Create `MapLightingComponent` (components.js)
- [ ] Add `mapLighting` to World class (ecs.js)

### Phase 2: Lighting System (3-4 hours)
- [ ] Create `LightingSystem` (systems/lighting-system.js)
- [ ] Implement `calculateLitArea()` method
- [ ] Implement `updateVisibilityStates()` method
- [ ] Add dirty flag mechanism
- [ ] Register system in game.js

### Phase 3: Rendering Integration (2-3 hours)
- [ ] Update RenderSystem to check visibility states
- [ ] Add `#renderBlackTile()` method
- [ ] Modify `#renderGrid()` to handle three states
- [ ] Test rendering never_seen/revealed/lit

### Phase 4: World Builder Integration (1-2 hours)
- [ ] Add `VisibilityStateComponent` to all tiles
- [ ] Add `VisibilityStateComponent` to all entities
- [ ] Add base `LightSourceComponent` to player
- [ ] Read `darkMap` from map data
- [ ] Set `world.mapLighting` based on map

### Phase 5: Movement Integration (1 hour)
- [ ] Update MovementSystem to mark lighting dirty
- [ ] Test light updates on player movement

### Phase 6: Equipment Integration (2 hours)
- [ ] Add light radius to interactable data
- [ ] Load light components in world-builder
- [ ] Test interactable lights

### Phase 7: Map Data Updates (1 hour)
- [ ] Add `darkMap: false` to SHIP map
- [ ] Add `darkMap: true` to expedition maps
- [ ] Add `lightRadius` to light-emitting interactables

### Phase 8: Testing & Polish (2-3 hours)
- [ ] Test ship map (always lit)
- [ ] Test expedition map (darkness)
- [ ] Test door opening/closing LOS
- [ ] Test equipment light changes
- [ ] Performance test on large maps
- [ ] Visual polish (ensure colors are correct)

**Total estimated time: 14-19 hours**

---

## Future Enhancements

### After Initial Implementation

1. **Flickering lights** (atmospheric)
   - Add flicker flag to LightSourceComponent
   - Random on/off toggle every ~0.5s

2. **Colored lights** (visual variety)
   - Emergency lights: red/orange
   - Computer terminals: green/blue
   - Fire: yellow/orange

3. **Dynamic shadows** (advanced)
   - Entities cast shadows
   - Shadow direction based on light source position

4. **Light intensity** (gradient)
   - Bright center, dim edges
   - More realistic but more complex

5. **Torch fuel** (resource management)
   - Torches burn out over time
   - Need to manage fuel/batteries

---

## Conclusion

This lighting system provides:
- ✅ **Clear exploration mechanic** (discover the dark)
- ✅ **Performance optimized** (dirty flags, caching)
- ✅ **Flexible** (works with tools, mods, interactables)
- ✅ **Simple** (three clear states, sharp cutoff)
- ✅ **Non-intrusive** (doesn't affect combat/AI)

The system integrates cleanly with existing ECS architecture and leverages already-implemented LOS calculations. No breaking changes to existing functionality.

**Ready to implement immediately after Tool System is designed.**
