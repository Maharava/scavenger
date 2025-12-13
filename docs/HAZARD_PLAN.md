# Environmental Hazards - Implementation Plan

**Last Updated:** December 2024
**Status:** Design Phase
**Priority:** Medium-High
**Estimated Effort:** 8-12 hours total

---

## Overview

Environmental hazards add dynamic danger to expedition maps, creating tactical challenges beyond enemy combat. Hazards deal damage based on the four core damage types (Kinetic, Energy, Toxin, Radiation) and interact with the existing body parts and damage systems.

**Design Philosophy:**
- Hazards are **persistent environmental threats**, not one-time events
- Players must **navigate around or manage** hazards strategically
- Hazards should be **visually distinct** and **telegraph danger** clearly
- Some hazards can be **triggered** by player actions (shooting, proximity)
- Hazards integrate with existing damage/body parts systems

---

## Core Architecture

### Hazard Component Structure

```javascript
class HazardComponent {
    constructor(hazardType, damageType, damageAmount, pattern, state = 'active') {
        this.hazardType = hazardType;       // 'chemical_spill', 'arcing_conduit', etc.
        this.damageType = damageType;       // 'kinetic', 'energy', 'toxin', 'radiation'
        this.damageAmount = damageAmount;   // Damage per trigger
        this.pattern = pattern;             // Damage pattern (tile list, radius, etc.)
        this.state = state;                 // 'active', 'inactive', 'triggered'
        this.cooldown = 0;                  // For periodic hazards
        this.timer = 0;                     // Internal timer for periodic effects
    }
}
```

### Hazard System

```javascript
class HazardSystem extends System {
    update(world) {
        const hazards = world.query(['HazardComponent', 'PositionComponent']);

        for (const hazard of hazards) {
            const hazardComp = hazard.getComponent('HazardComponent');
            const pos = hazard.getComponent('PositionComponent');

            // Update hazard state
            this.updateHazard(world, hazard, hazardComp, pos);

            // Check for entities in hazard area
            if (hazardComp.state === 'active') {
                this.applyHazardDamage(world, hazard, hazardComp, pos);
            }
        }
    }

    updateHazard(world, hazard, hazardComp, pos) {
        // Handle periodic hazards (arcing conduit, steam vents)
        if (hazardComp.timer !== undefined) {
            hazardComp.timer += world.game.deltaTime;

            // Trigger periodic effect
            if (hazardComp.timer >= hazardComp.cooldown) {
                hazardComp.state = 'active';
                hazardComp.timer = 0;
                // Visual feedback (flash, particle effect, etc.)
            }
        }
    }

    applyHazardDamage(world, hazard, hazardComp, pos) {
        // Get all entities in hazard pattern
        const affectedEntities = this.getEntitiesInPattern(world, pos, hazardComp.pattern);

        for (const entity of affectedEntities) {
            // Only damage entities with body parts (player, enemies)
            const bodyParts = entity.getComponent('BodyPartsComponent');
            if (!bodyParts) continue;

            // Apply damage using existing damage system
            const damageSystem = world.getSystem(DamageSystem);
            if (damageSystem) {
                damageSystem.applyDamage(
                    world,
                    entity,
                    hazardComp.damageAmount,
                    hazardComp.damageType,
                    'environmental' // Source
                );
            }
        }
    }

    getEntitiesInPattern(world, pos, pattern) {
        const entities = [];
        const allEntities = world.query(['PositionComponent']);

        for (const entity of allEntities) {
            const entityPos = entity.getComponent('PositionComponent');

            if (pattern.type === 'tile') {
                // Single tile
                if (entityPos.x === pos.x && entityPos.y === pos.y) {
                    entities.push(entity);
                }
            } else if (pattern.type === 'radius') {
                // Radial area
                const dist = Math.sqrt(
                    Math.pow(entityPos.x - pos.x, 2) +
                    Math.pow(entityPos.y - pos.y, 2)
                );
                if (dist <= pattern.radius) {
                    entities.push(entity);
                }
            } else if (pattern.type === 'line') {
                // Line pattern (steam vents, arcing conduits)
                if (this.isInLinePattern(entityPos, pos, pattern)) {
                    entities.push(entity);
                }
            }
        }

        return entities;
    }

    isInLinePattern(entityPos, hazardPos, pattern) {
        // Check if entity is in a line pattern
        // Example: horizontal line
        if (pattern.direction === 'horizontal') {
            return entityPos.y === hazardPos.y &&
                   Math.abs(entityPos.x - hazardPos.x) <= pattern.length;
        }
        // Example: vertical line
        if (pattern.direction === 'vertical') {
            return entityPos.x === hazardPos.x &&
                   Math.abs(entityPos.y - hazardPos.y) <= pattern.length;
        }
        return false;
    }
}
```

---

## Hazard Categories

### 1. KINETIC HAZARDS

#### 1.1 Chemical Spill (Passive)
**Concept:** Toxic puddle on floor, damages entities standing on it.

**Implementation:**
```javascript
{
    id: 'CHEMICAL_SPILL',
    name: 'Chemical Spill',
    char: '~',
    colour: '#00ff00', // Bright green
    hazardType: 'chemical_spill',
    damageType: 'toxin',
    damageAmount: 5,  // 5 damage per turn standing on it
    pattern: { type: 'tile' },  // Single tile
    state: 'active'  // Always active
}
```

**Behavior:**
- Persistent floor hazard
- Damages any entity ending turn on the tile
- Visually distinct (bright green ~)
- Can be multiple tiles for larger spills

**Spawn Rules:**
- 10% chance in INDUSTRIAL/TECH rooms
- 1-3 tiles per spill
- Clustered together (adjacent tiles)

---

#### 1.2 Explosive Canister (Trigger-Based)
**Concept:** Volatile container that explodes when damaged.

**Implementation:**
```javascript
{
    id: 'EXPLOSIVE_CANISTER',
    name: 'Explosive Canister',
    char: 'X',
    colour: '#ff4500', // Red-orange
    hazardType: 'explosive',
    damageType: 'kinetic',
    damageAmount: 30,  // High burst damage
    pattern: { type: 'radius', radius: 2 },  // 2-tile radius explosion
    state: 'inactive',  // Triggers only when hit
    health: 10  // Can be destroyed by gunfire
}
```

**Behavior:**
- Idle until shot or hit by explosion
- When triggered: explodes, damages all entities in radius
- Chain reactions possible (explosion triggers nearby canisters)
- Destroys self after explosion

**Spawn Rules:**
- 15% chance in INDUSTRIAL rooms
- 1-2 per room
- Near walls or in corners (tactical placement)

**Interaction:**
- Player can intentionally shoot to clear area
- Can be used tactically against enemies
- Risk/reward: trigger too close = player damage

---

#### 1.3 Debris Drop (Trigger-Based)
**Concept:** Ceiling debris that falls when tile below is occupied.

**Implementation:**
```javascript
{
    id: 'DEBRIS_DROP',
    name: 'Unstable Ceiling',
    char: '^',
    colour: '#888888', // Grey
    hazardType: 'debris_drop',
    damageType: 'kinetic',
    damageAmount: 20,  // Heavy impact
    pattern: { type: 'tile' },  // Tile directly below
    state: 'armed',  // Waiting for trigger
    triggerTile: { x, y }  // Tile that triggers drop
}
```

**Behavior:**
- Visual indicator on ceiling (render on higher layer)
- When player/enemy moves onto trigger tile: debris falls
- One-time trigger (debris removed after falling)
- Brief delay (0.5s) before impact (chance to dodge if fast)

**Spawn Rules:**
- 5% chance in corridors/transit areas
- 1 per corridor section
- Marked with visual cue (cracks, flickering, etc.)

---

#### 1.4 Piston Trap (Periodic)
**Concept:** Industrial piston that periodically fires across hallway.

**Implementation:**
```javascript
{
    id: 'PISTON_TRAP',
    name: 'Industrial Piston',
    char: '|',
    colour: '#ffa500', // Orange
    hazardType: 'piston',
    damageType: 'kinetic',
    damageAmount: 40,  // Massive damage
    pattern: { type: 'line', direction: 'horizontal', length: 5 },
    state: 'inactive',
    cooldown: 5000,  // Fires every 5 seconds
    timer: 0
}
```

**Behavior:**
- Fires on regular interval (5 seconds)
- Warning: visual/audio cue 1 second before firing
- Deals heavy damage to anything in path
- Can be timed/dodged with careful movement

**Spawn Rules:**
- 10% chance in INDUSTRIAL corridors
- Always perpendicular to hallway
- Max 1 per corridor section

---

### 2. ENERGY HAZARDS

#### 2.1 Arcing Conduit (Periodic)
**Concept:** Exposed power cable that electrifies adjacent tiles periodically.

**Implementation:**
```javascript
{
    id: 'ARCING_CONDUIT',
    name: 'Exposed Power Line',
    char: '=',
    colour: '#00ffff', // Cyan
    hazardType: 'arcing_conduit',
    damageType: 'energy',
    damageAmount: 15,  // Medium damage
    pattern: { type: 'radius', radius: 1 },  // Adjacent tiles only
    state: 'inactive',
    cooldown: 3000,  // Arcs every 3 seconds
    timer: 0,
    arcDuration: 500  // Active for 0.5 seconds
}
```

**Behavior:**
- Periodically arcs electricity to adjacent tiles
- Visual: flashing tiles, particle effects
- Brief active window (0.5s) then cooldown
- Predictable pattern (players can time movement)

**Spawn Rules:**
- 20% chance in TECH/SECURITY rooms
- Along walls or in corners
- 1-2 per room

---

#### 2.2 Superheated Steam Pipe (Periodic)
**Concept:** Ruptured pipe releasing jets of scalding steam.

**Implementation:**
```javascript
{
    id: 'STEAM_VENT',
    name: 'Ruptured Steam Pipe',
    char: '#',
    colour: '#ffffff', // White
    hazardType: 'steam_vent',
    damageType: 'energy',
    damageAmount: 12,  // Moderate damage over time
    pattern: { type: 'line', direction: 'horizontal', length: 3 },
    state: 'inactive',
    cooldown: 4000,  // Vents every 4 seconds
    timer: 0,
    ventDuration: 2000  // Lasts 2 seconds
}
```

**Behavior:**
- Releases steam in a directional pattern
- Lingers for 2 seconds (multiple damage ticks possible)
- Visual: white cloud/particles
- Can be multiple vents creating patterns

**Spawn Rules:**
- 15% chance in INDUSTRIAL/UTILITY rooms
- Near walls (pipe source)
- 1-3 per room in clusters

---

#### 2.3 Overcharged Terminal (Trigger-Based)
**Concept:** Sparking terminal that shocks on interaction.

**Implementation:**
```javascript
{
    id: 'OVERCHARGED_TERMINAL',
    name: 'Malfunctioning Terminal',
    char: 'T',
    colour: '#ffff00', // Yellow (warning)
    hazardType: 'overcharged_terminal',
    damageType: 'energy',
    damageAmount: 20,  // Burst damage on interaction
    pattern: { type: 'tile' },
    state: 'armed',  // Triggers on interaction
    canBeDisabled: true  // Can be safely disabled with tool
}
```

**Behavior:**
- Appears as interactable terminal
- Shocks player if interacted without protection
- Can be disabled with insulated tools (future feature)
- One-time shock (safe after first trigger)

**Spawn Rules:**
- 10% chance in TECH/SECURITY rooms
- Replaces some story nodes
- 1 per room maximum

---

### 3. TOXIN HAZARDS

#### 3.1 Spore Cloud Vent (Periodic)
**Concept:** Vent releasing toxic alien spores that linger.

**Implementation:**
```javascript
{
    id: 'SPORE_VENT',
    name: 'Spore Vent',
    char: 'V',
    colour: '#9acd32', // Yellow-green
    hazardType: 'spore_vent',
    damageType: 'toxin',
    damageAmount: 8,  // Low damage per turn
    pattern: { type: 'radius', radius: 2 },
    state: 'inactive',
    cooldown: 8000,  // Vents every 8 seconds
    timer: 0,
    cloudDuration: 5000,  // Cloud lingers 5 seconds
    cloudTicks: 0  // Internal timer for cloud
}
```

**Behavior:**
- Periodically releases spore cloud
- Cloud lingers for 5 seconds after release
- Damages entities in cloud area each turn
- Visual: green haze/particles
- Multiple vents can create large hazard zones

**Spawn Rules:**
- 15% chance in NATURE/ALIEN biome rooms
- Near walls or vents
- 1-2 per room

---

#### 3.2 Leaking Chemical Barrel (Trigger-Based)
**Concept:** Unstable barrel that ruptures when damaged, creating large spill.

**Implementation:**
```javascript
{
    id: 'CHEMICAL_BARREL',
    name: 'Volatile Chemical Barrel',
    char: 'B',
    colour: '#00ff00', // Bright green
    hazardType: 'chemical_barrel',
    damageType: 'toxin',
    damageAmount: 5,  // Damage per turn in spill
    pattern: { type: 'radius', radius: 2 },  // Creates 2-tile radius spill
    state: 'intact',
    health: 15,  // Can be destroyed
    spillDuration: -1  // Permanent spill
}
```

**Behavior:**
- Idle until shot or hit
- When destroyed: creates large chemical spill
- Spill persists for duration of expedition
- Can be used tactically (block enemy paths)

**Spawn Rules:**
- 10% chance in INDUSTRIAL/UTILITY rooms
- 1-2 per room
- In open areas (allows spill to spread)

---

### 4. RADIATION HAZARDS

#### 4.1 Leaking Micro-Reactor (Passive)
**Concept:** Damaged reactor core that irradiates large area.

**Implementation:**
```javascript
{
    id: 'LEAKING_REACTOR',
    name: 'Damaged Micro-Reactor',
    char: 'R',
    colour: '#39ff14', // Neon green
    hazardType: 'radiation_leak',
    damageType: 'radiation',
    damageAmount: 3,  // Low damage per turn, persistent
    pattern: { type: 'radius', radius: 5 },  // Large area
    state: 'active',  // Always leaking
    visualPulse: true  // Pulsing glow effect
}
```

**Behavior:**
- Always active, large radius
- Damages all entities in area each turn
- Cannot be disabled (permanent hazard)
- Visual: pulsing green glow, radiation symbol

**Spawn Rules:**
- 5% chance in TECH/SECURITY rooms (rare)
- Central location in room
- 1 per room maximum (high impact)

---

#### 4.2 Irradiated Container (Passive + Loot)
**Concept:** Radioactive container with valuable loot inside (risk/reward).

**Implementation:**
```javascript
{
    id: 'IRRADIATED_CONTAINER',
    name: 'Irradiated Storage',
    char: 'C',
    colour: '#ffff00', // Yellow (radiation warning)
    hazardType: 'irradiated_container',
    damageType: 'radiation',
    damageAmount: 2,  // Low damage per turn near it
    pattern: { type: 'radius', radius: 1 },
    state: 'active',
    lootQuality: 'rare',  // Contains good loot
    interactable: true  // Can be opened
}
```

**Behavior:**
- Passive radiation damage to nearby entities
- Can be interacted with to open
- Opening grants loot but deals radiation damage
- Risk/reward: worth the damage?

**Spawn Rules:**
- 8% chance in TECH/SECURITY rooms
- 1 per room
- Against walls or in corners

---

#### 4.3 Malfunctioning Medical Scanner (Passive)
**Concept:** Diagnostic machine stuck on, bathing area in low radiation.

**Implementation:**
```javascript
{
    id: 'MALFUNCTIONING_SCANNER',
    name: 'Stuck Medical Scanner',
    char: 'M',
    colour: '#00ffff', // Cyan
    hazardType: 'medical_scanner',
    damageType: 'radiation',
    damageAmount: 1,  // Very low damage
    pattern: { type: 'line', direction: 'horizontal', length: 4 },
    state: 'active',
    canBeDisabled: true  // Can be turned off
}
```

**Behavior:**
- Low radiation in beam pattern
- Constant active state
- Can be disabled by interacting (requires skill check)
- Minimal threat but annoying

**Spawn Rules:**
- 5% chance in UTILITY/MEDICAL rooms
- Near walls (scanner source)
- 1 per room

---

## Implementation Phases

### Phase 1: Foundation (2-3 hours)
**Goal:** Core hazard system and passive hazards

1. Create `HazardComponent` class
2. Create `HazardSystem` class
3. Implement pattern matching (tile, radius, line)
4. Integrate with existing DamageSystem
5. Test with Chemical Spill (simplest hazard)

**Deliverable:** Working passive hazard (Chemical Spill)

---

### Phase 2: Periodic Hazards (3-4 hours)
**Goal:** Time-based activation hazards

1. Add timer/cooldown logic to HazardSystem
2. Implement Arcing Conduit
3. Implement Steam Vent
4. Implement Spore Vent
5. Add visual feedback (flashing, particles)

**Deliverable:** 3 working periodic hazards

---

### Phase 3: Trigger Hazards (2-3 hours)
**Goal:** Player-activated hazards

1. Add trigger logic to HazardSystem
2. Implement Explosive Canister
3. Implement Debris Drop
4. Implement Chemical Barrel
5. Add interaction handling

**Deliverable:** 3 working trigger hazards

---

### Phase 4: Radiation & Complex Patterns (1-2 hours)
**Goal:** Radiation hazards and special mechanics

1. Implement Leaking Reactor
2. Implement Irradiated Container (loot + hazard)
3. Implement Malfunctioning Scanner
4. Add line pattern support

**Deliverable:** 3 radiation hazards

---

### Phase 5: Polish & Balance (1-2 hours)
**Goal:** Visual feedback and game balance

1. Add visual effects (particle systems, color flashing)
2. Add audio cues (optional)
3. Balance damage values
4. Test all hazards in actual gameplay
5. Adjust spawn rates

**Deliverable:** Polished, balanced hazards

---

## Spawn Integration

### Procgen Integration

Add hazard spawning to `procgen-system.js`:

```javascript
function spawnHazards(state) {
    for (const room of state.rooms) {
        const roomData = room.roomData;
        const biomes = roomData.biomes || ['ATMOSPHERIC'];

        // Spawn hazards based on biome
        const hazardTable = HAZARD_SPAWN_TABLES[biomes[0]];
        if (!hazardTable) continue;

        for (const hazardType in hazardTable) {
            const spawnChance = hazardTable[hazardType];

            if (state.rng.random() < spawnChance) {
                const hazardDef = HAZARD_DEFINITIONS[hazardType];
                const pos = state.rng.choice(getUnoccupiedFloorTiles(room));

                room.entities.push({
                    type: 'hazard',
                    hazardType: hazardType,
                    x: pos.x,
                    y: pos.y
                });
            }
        }
    }
}
```

### Spawn Tables

```javascript
const HAZARD_SPAWN_TABLES = {
    INDUSTRIAL: {
        CHEMICAL_SPILL: 0.10,
        EXPLOSIVE_CANISTER: 0.15,
        PISTON_TRAP: 0.10,
        STEAM_VENT: 0.15,
        CHEMICAL_BARREL: 0.10
    },
    TECH: {
        ARCING_CONDUIT: 0.20,
        OVERCHARGED_TERMINAL: 0.10,
        LEAKING_REACTOR: 0.05,
        MALFUNCTIONING_SCANNER: 0.05
    },
    SECURITY: {
        EXPLOSIVE_CANISTER: 0.10,
        ARCING_CONDUIT: 0.15,
        IRRADIATED_CONTAINER: 0.08
    },
    NATURE: {
        SPORE_VENT: 0.15,
        CHEMICAL_SPILL: 0.05
    },
    UTILITY: {
        STEAM_VENT: 0.15,
        CHEMICAL_BARREL: 0.10,
        MALFUNCTIONING_SCANNER: 0.05
    }
};
```

---

## Testing Plan

### Unit Tests
1. Test each hazard type in isolation
2. Verify damage application
3. Test pattern matching (tile, radius, line)
4. Test periodic timers
5. Test trigger conditions

### Integration Tests
1. Test hazards + combat (enemies affected)
2. Test hazard + hazard interactions (chain explosions)
3. Test hazards across different biomes
4. Test spawn rates (not too many/few)

### Balance Tests
1. Verify damage values feel fair
2. Test visual clarity (can player see hazards?)
3. Test tactical gameplay (dodging, timing)
4. Test risk/reward (irradiated containers, explosive canisters)

---

## Visual Design

### Color Coding
- **Kinetic:** Grey/Orange (debris, explosives)
- **Energy:** Cyan/Yellow (electricity, heat)
- **Toxin:** Green/Yellow-Green (chemicals, spores)
- **Radiation:** Neon Green/Yellow (reactors, containers)

### Visual States
- **Inactive:** Dim/faded colors
- **Active:** Bright, pulsing colors
- **Triggered:** Flash, particle burst
- **Warning:** Flashing before activation

### Render Layers
- Floor hazards (chemical spills): Layer 0
- Standard hazards: Layer 1
- Ceiling hazards (debris): Layer 3 (above entities)

---

## Future Enhancements

### Advanced Features
1. **Hazard Mitigation:** Special armor/tools that reduce hazard damage
2. **Hazard Manipulation:** Player can disable/trigger hazards intentionally
3. **Environmental Combos:** Fire + chemical = explosion, water + electricity = area shock
4. **Dynamic Hazards:** Hazards that spread or move over time
5. **Procedural Hazard Patterns:** Randomly generated hazard layouts per room type

### New Hazard Types
1. **Fire Hazards:** Spreading flames, ignitable surfaces
2. **Ice Hazards:** Slippery floors, freeze damage
3. **Gravity Hazards:** Low/high gravity zones affecting movement
4. **Temporal Hazards:** Time distortion effects (slow/speed zones)

---

## Performance Considerations

- **Query Optimization:** Cache hazard queries (don't search every frame)
- **Pattern Caching:** Pre-calculate affected tiles for static patterns
- **Damage Batching:** Apply damage in batches (not per-entity per-frame)
- **Visual Culling:** Only render hazard effects near player viewport
- **Pooling:** Reuse hazard entities instead of creating/destroying

---

## Summary

**Total Hazards Planned:** 13 unique hazard types
**Damage Types Covered:** All 4 (Kinetic, Energy, Toxin, Radiation)
**Estimated Implementation Time:** 8-12 hours
**Dependencies:** Existing DamageSystem, BodyPartsComponent, Procgen System

**Priority Order:**
1. Chemical Spill (simplest, validates system)
2. Arcing Conduit (tests periodic logic)
3. Explosive Canister (tests trigger logic)
4. Leaking Reactor (tests radiation + large radius)
5. Remaining hazards (polish and variety)

---

**End of Hazard Implementation Plan**
