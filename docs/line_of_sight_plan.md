# Line of Sight & Fog of War Implementation Plan

**Status:** Design Phase
**Priority:** Medium (needed for proper combat detection)
**Estimated Complexity:** Medium
**Breaking Changes:** Minimal (if done correctly)

---

## Overview

This document outlines a sound, performance-conscious implementation of line-of-sight (LOS) detection for combat and an optional fog-of-war system for exploration.

**Important:** These are TWO separate features that can be implemented independently.

---

## Part 1: Line of Sight (Combat Detection)

**Purpose:** Enemies can't detect player through walls. Combat doesn't trigger through walls.

### Current Issues
- `hasLineOfSight()` stub always returns `true`
- Enemies detect through walls
- Combat can start through walls

### Implementation Strategy

#### 1.1 Bresenham Line Algorithm

**Function signature:**
```javascript
hasLineOfSight(world, pos1, pos2) {
    // Returns true if no solid tiles block the line between pos1 and pos2
    // Uses Bresenham's line algorithm to trace the path
}
```

**Algorithm:**
```javascript
hasLineOfSight(world, pos1, pos2) {
    // Bresenham's line algorithm
    let x0 = pos1.x, y0 = pos1.y;
    let x1 = pos2.x, y1 = pos2.y;

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    while (true) {
        // Check if current position blocks LOS
        // Skip the start and end positions (allow standing on edge)
        if ((x0 !== pos1.x || y0 !== pos1.y) &&
            (x0 !== pos2.x || y0 !== pos2.y)) {

            // Check for solid entities at this position
            const entitiesAtPos = world.query(['PositionComponent', 'SolidComponent']);
            for (const entity of entitiesAtPos) {
                const ePos = entity.getComponent('PositionComponent');
                if (ePos.x === x0 && ePos.y === y0) {
                    return false; // Wall blocks LOS
                }
            }
        }

        // Reached destination
        if (x0 === x1 && y0 === y1) break;

        // Step to next position
        const e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy;
            x0 += sx;
        }
        if (e2 < dx) {
            err += dx;
            y0 += sy;
        }
    }

    return true; // No obstacles found
}
```

#### 1.2 Performance Optimization

**Problem:** Querying all solid entities for every LOS check is expensive.

**Solution:** Cache solid tile positions in World

```javascript
// In world-builder.js or World class
class World {
    constructor() {
        // ... existing code
        this.solidTileCache = new Set(); // Stores "x,y" strings
    }

    addSolidTileToCache(x, y) {
        this.solidTileCache.add(`${x},${y}`);
    }

    removeSolidTileFromCache(x, y) {
        this.solidTileCache.delete(`${x},${y}`);
    }

    isSolidTile(x, y) {
        return this.solidTileCache.has(`${x},${y}`);
    }
}

// Update world-builder.js to populate cache when creating walls
if (char === '+' && !isPlaceholder) {
    world.addComponent(entity, new RenderableComponent('+', '#666', 0));
    world.addComponent(entity, new SolidComponent());
    world.addSolidTileToCache(x, y); // ← Add this
}
```

**Optimized LOS function:**
```javascript
hasLineOfSight(world, pos1, pos2) {
    // Bresenham's line algorithm with cached solid tiles
    let x0 = pos1.x, y0 = pos1.y;
    let x1 = pos2.x, y1 = pos2.y;

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    while (true) {
        // Skip start and end positions
        if ((x0 !== pos1.x || y0 !== pos1.y) &&
            (x0 !== pos2.x || y0 !== pos2.y)) {

            // Fast cache lookup instead of query
            if (world.isSolidTile(x0, y0)) {
                return false; // Wall blocks LOS
            }
        }

        if (x0 === x1 && y0 === y1) break;

        const e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy;
            x0 += sx;
        }
        if (e2 < dx) {
            err += dx;
            y0 += sy;
        }
    }

    return true;
}
```

**Performance Impact:**
- Without cache: O(n * distance) where n = number of solid entities
- With cache: O(distance) - constant time lookups
- Huge improvement for large maps

#### 1.3 Integration Points

**Files to modify:**
1. `ecs.js` - Add solid tile cache to World class
2. `world-builder.js` - Populate cache when creating walls
3. `systems/combat/combat-system.js` - Replace stub with real implementation
4. `gamedata/map.js` - Ensure doors update cache when opened/closed

**No breaking changes** - just replacing a stub function.

---

## Part 2: Fog of War (Optional - For Exploration)

**Purpose:** Unexplored areas are hidden. Previously seen areas are gray. Currently visible areas are full color.

### Design Decision: Do We Need This?

**Arguments FOR:**
- Adds exploration mystery
- Makes maps feel larger
- Classic roguelike feature
- Rewards thorough exploration

**Arguments AGAINST:**
- Current game uses small, handcrafted maps
- Adds significant complexity
- Could be frustrating on small maps
- Performance cost for large procedural maps

**Recommendation:** **Defer until procedural generation is implemented.**

### If Implemented, Here's How:

#### 2.1 Component Architecture

```javascript
class VisibilityComponent {
    constructor() {
        this.state = 'never_seen'; // 'never_seen', 'seen', 'visible'
    }
}

class FieldOfViewComponent {
    constructor(range = 10) {
        this.range = range; // How far the entity can see
        this.visibleTiles = new Set(); // Set of "x,y" strings
        this.dirty = true; // Recalculate FOV?
    }
}
```

#### 2.2 System Architecture

Create new `VisibilitySystem`:

```javascript
class VisibilitySystem extends System {
    update(world) {
        // 1. Get player's FOV component
        const player = world.query(['PlayerComponent', 'PositionComponent', 'FieldOfViewComponent'])[0];
        if (!player) return;

        const playerPos = player.getComponent('PositionComponent');
        const fov = player.getComponent('FieldOfViewComponent');

        // 2. Only recalculate if player moved (dirty flag)
        if (fov.dirty) {
            fov.visibleTiles.clear();
            this.calculateFOV(world, playerPos, fov);
            fov.dirty = false;
        }

        // 3. Update visibility states for all entities
        const allVisibleEntities = world.query(['PositionComponent', 'VisibilityComponent']);
        for (const entity of allVisibleEntities) {
            const pos = entity.getComponent('PositionComponent');
            const vis = entity.getComponent('VisibilityComponent');

            const tileKey = `${pos.x},${pos.y}`;
            if (fov.visibleTiles.has(tileKey)) {
                vis.state = 'visible';
            } else if (vis.state === 'visible') {
                vis.state = 'seen'; // Was visible, now isn't
            }
        }
    }

    calculateFOV(world, centerPos, fov) {
        // Shadow-casting algorithm or simple radius check
        // For simplicity, use radius + LOS check
        for (let dx = -fov.range; dx <= fov.range; dx++) {
            for (let dy = -fov.range; dy <= fov.range; dy++) {
                const x = centerPos.x + dx;
                const y = centerPos.y + dy;

                // Check if in range
                const distance = Math.abs(dx) + Math.abs(dy);
                if (distance > fov.range) continue;

                // Check LOS
                if (world.game.hasLineOfSight(world, centerPos, {x, y})) {
                    fov.visibleTiles.add(`${x},${y}`);
                }
            }
        }
    }
}
```

#### 2.3 Rendering Integration

**Update RenderSystem:**

```javascript
#renderGrid(world, container) {
    // ... existing code ...

    for (const entity of renderables) {
        const pos = entity.getComponent('PositionComponent');
        const render = entity.getComponent('RenderableComponent');
        const vis = entity.getComponent('VisibilityComponent');

        // Skip never-seen entities
        if (vis && vis.state === 'never_seen') {
            continue; // Don't render at all
        }

        // Determine color based on visibility
        let colour = render.colour;
        if (vis && vis.state === 'seen') {
            colour = '#444'; // Gray for previously seen
        }

        // ... rest of rendering code with modified colour
    }
}
```

#### 2.4 Performance Considerations

**Problem:** Recalculating FOV every frame is expensive.

**Solution:** Dirty flags

```javascript
// In MovementSystem, after successful move:
const fov = entity.getComponent('FieldOfViewComponent');
if (fov) {
    fov.dirty = true; // Trigger recalculation
}
```

**Only recalculate when:**
- Player moves
- Doors open/close
- Map changes (rare)

---

## Implementation Phases

### Phase 1: Line of Sight Only (RECOMMENDED FIRST)
1. Add solid tile cache to World class
2. Populate cache in world-builder.js
3. Implement Bresenham LOS in CombatSystem
4. Test combat detection through walls
5. Update door interactions to modify cache

**Time estimate:** 2-3 hours
**Risk:** Low
**Breaking changes:** None

### Phase 2: Fog of War (OPTIONAL - DEFER)
1. Create VisibilityComponent
2. Create FieldOfViewComponent
3. Create VisibilitySystem
4. Add components to relevant entities
5. Update RenderSystem to respect visibility
6. Add dirty flag triggers to MovementSystem
7. Test performance on large maps

**Time estimate:** 6-8 hours
**Risk:** Medium (rendering changes)
**Breaking changes:** Possible visual changes

---

## Testing Plan

### LOS Testing
1. ✅ Player and enemy on opposite sides of wall → no detection
2. ✅ Player and enemy with clear LOS → detection works
3. ✅ Player moves around corner → detection triggers at right moment
4. ✅ Open door → LOS now clear
5. ✅ Close door → LOS blocked again

### FOV Testing (if implemented)
1. ✅ New map starts with everything 'never_seen'
2. ✅ Player movement reveals new tiles
3. ✅ Previously seen tiles remain gray
4. ✅ Currently visible tiles are full color
5. ✅ Performance acceptable on large maps (60fps)

---

## Potential Issues & Solutions

### Issue 1: Doors Don't Update Cache
**Problem:** Opening/closing doors doesn't update solid tile cache
**Solution:** Add cache updates to door interaction scripts

```javascript
'open_door': (game, interactable) => {
    // ... existing door opening code ...

    const pos = interactable.getComponent('PositionComponent');
    game.world.removeSolidTileFromCache(pos.x, pos.y);
}

'close_door': (game, interactable) => {
    // ... existing door closing code ...

    const pos = interactable.getComponent('PositionComponent');
    game.world.addSolidTileToCache(pos.x, pos.y);
}
```

### Issue 2: Performance on Large Maps
**Problem:** FOV calculation expensive on procedural maps
**Solution:**
- Use shadow-casting (faster than checking every tile)
- Limit FOV range (10-15 tiles max)
- Only recalculate when player moves

### Issue 3: Enemies Behind Walls Still Visible
**Problem:** Fog of war doesn't hide enemies player can't see
**Solution:** Enemies need VisibilityComponent too, or hide based on tile visibility

---

## Conclusion

### Sound Implementation Order:

1. **Now:** Implement LOS for combat (Phase 1)
   - Low risk, high value
   - Fixes unrealistic combat detection
   - Performance optimized with cache
   - No breaking changes

2. **Later:** Consider fog of war (Phase 2)
   - Wait for procedural generation
   - More valuable on large, unknown maps
   - Defer until needed

### Breaking Change Risk: **LOW**
- Phase 1 changes internal logic only
- Phase 2 can be feature-flagged
- Both can be toggled on/off

### Recommendation:
**Implement Phase 1 (LOS) immediately. Skip Phase 2 (FOW) until procedural generation.**

---

## Code Checklist

**When implementing Phase 1:**
- [ ] Add `solidTileCache` to World class (ecs.js)
- [ ] Add cache helper methods to World (ecs.js)
- [ ] Populate cache in world-builder.js
- [ ] Implement Bresenham in hasLineOfSight (combat-system.js)
- [ ] Update door scripts to modify cache (script-registry.js)
- [ ] Test combat detection through walls
- [ ] Test door opening/closing LOS changes

**When/If implementing Phase 2:**
- [ ] Create VisibilityComponent (components.js)
- [ ] Create FieldOfViewComponent (components.js)
- [ ] Create VisibilitySystem (systems/visibility-system.js)
- [ ] Add FOV to player in world-builder.js
- [ ] Add VisibilityComponent to tiles/entities
- [ ] Update RenderSystem filtering
- [ ] Add dirty flag to MovementSystem
- [ ] Register system in game.js
- [ ] Performance test on large map
