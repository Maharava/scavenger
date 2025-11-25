# Expedition Locations - Procgen Design Guide

This document defines expedition locations as **data-driven templates** designed for easy expansion. Anyone should be able to add a new location or room by editing gamedata files.

---

## Core Design Philosophy

**Desolation:** This is a dead universe. Empty rooms are common. The silence is oppressive.

**Density:** Spaces are tight and interconnected. Long empty corridors connecting distant rooms should be rare - this isn't a sprawling campus, it's a cramped, claustrophobic wreck.

**Enemy Spawning:**
- Small maps (≤40×40): Can have primary faction (ROBOT or ALIEN) plus humanoids/aberrants always possible
- Medium/Large maps (>60×60): Can have both ROBOT and ALIEN factions simultaneously
- **Aliens** can spawn **anywhere on the map** IF there is at least one Nature biome room present
- **Robots** spawn in Tech, Industrial, and Security biomes
- **Aberrants** are rare spawns ANYWHERE (2-5% chance)
- **Scavengers** are medium spawns anywhere (10-15% chance)
- **No location is ever truly single-faction** - scavengers and aberrants can appear anywhere
- **0 enemies** must have equal probability to any other count
  - If a room can spawn 1-3 enemies: use [0, 1, 2, 3] with 25% each
  - If a room can spawn 1-4 enemies: use [0, 1, 2, 3, 4] with 20% each
- Rooms can have **multiple enemy types** simultaneously (robots + aberrant, aliens + scavenger, etc.)

**Map Sizes:**
- Small (satellites, escape pods): ≤40×40
- Medium (stations, outposts): 41×41 to 70×70
- Large (habitats, industrial complexes): 71×71 to 100×100

---

## Biome System

**Biomes** are thematic/functional categories that determine enemy spawns, loot types, and atmosphere. Rooms belong to one or more biomes.

### Biome Definitions

**NATURE** - Organic growth, food production, bio-research
- Enemy Spawns: Aliens (primary if present on map), Scavengers
- Loot: Raw Biomass, Organic Protein, Bio-Woven Chitin, Chemical Compounds
- Examples: Hydroponics, Gardens, Bio-Labs, Food Storage
- Special Rule: If ANY room with NATURE biome exists on map, aliens can spawn anywhere

**TECH** - Computing, data storage, communications
- Enemy Spawns: Robots (Scout Drones, Security Bots), Scavengers
- Loot: Intact Logic Board, High-Capacity Battery, Basic Electronics, Focusing Lenses
- Examples: Server Rooms, Data Centers, Signal Processing, AI Cores

**INDUSTRIAL** - Manufacturing, fabrication, heavy machinery
- Enemy Spawns: Robots (Security Bots primary), Scavengers
- Loot: Titanium Alloy, Ceramic-Composite Plate, Polymer Resin, Repair Paste, Salvaged Components
- Examples: Fabrication Bays, Machining Shops, Material Silos, Workshops

**RESIDENTIAL** - Living quarters, social spaces, civilian areas
- Enemy Spawns: Scavengers, Aliens (if nature present on map)
- Loot: Aramid Fibres, Polymer Resin, Basic Electronics, personal items
- Examples: Crew Quarters, Dormitories, Recreation Rooms, Mess Halls

**SECURITY** - Military installations, defensive positions, armories
- Enemy Spawns: Robots (Security Bots primary), Scavengers
- Loot: Weapons, Armor, Basic Electronics, Salvaged Components
- Examples: Armories, Security Checkpoints, Guard Stations, Weapons Lockers

**TRANSIT** - Movement corridors, docking facilities, airlocks
- Enemy Spawns: Any faction, ambush potential
- Loot: Salvaged Components, Basic Electronics, Titanium Alloy (ship parts)
- Examples: Docking Bays, Airlocks, Shuttle Hangars, Loading Areas

**UTILITY** - Life support, environmental control, maintenance
- Enemy Spawns: Robots, Scavengers
- Loot: Repair Paste, Chemical Compounds, Basic Electronics, Thermal Gel
- Examples: Life Support Bays, Water Treatment, Oxygen Scrubbers, Power Relays

**ATMOSPHERIC** - Non-functional spaces for ambiance and storytelling
- Enemy Spawns: Low chance (mostly empty)
- Loot: Minimal or none
- Examples: Observation Decks, Structural Walkways, Damaged Sections, Empty Halls

### Biome Mixing Rules
- Most rooms have 1-2 primary biomes
- Large rooms (20×20+) can have 3 biomes
- A location should have 2-4 distinct biomes represented
- Biome distribution creates location identity

---

## Enemy Faction Reference

### Current Enemy Types
| Type | ID | Faction | Biome Preference |
|------|----|---------| -----------------|
| Scavenger | SCAVENGER | Humanoid | Any (10-15% chance) |
| Scout Drone | SCOUT_DRONE | Robot | Tech, Utility |
| Security Bot | SECURITY_BOT | Robot | Tech, Industrial, Security |

### Planned Enemy Types
| Type | Faction | Biome Preference |
|------|---------|------------------|
| Aberrant | Aberrant | Any (2-5% rare spawn) |
| Spore Walker | Alien | Any (if Nature exists on map) |
| Mutant Rat | Alien | Residential, Nature (if Nature exists) |
| Elite Security Bot | Robot | Industrial, Security (Hard locations) |

---

## Location Template Structure

```javascript
{
    id: 'LOCATION_ID',
    name: 'Display Name',
    difficulty: 'EASY|MEDIUM|HARD',
    mapSize: { min: [60, 60], max: [80, 80] },
    theme: 'Brief thematic description',

    // Faction availability
    hasNature: true,  // If true, aliens can spawn anywhere on map
    hasRobots: true,  // If true, robots spawn in appropriate biomes

    // Biome distribution (what % of rooms should be each biome)
    biomeDistribution: {
        NATURE: 0.20,      // 20% of rooms
        RESIDENTIAL: 0.30,
        TECH: 0.15,
        INDUSTRIAL: 0.10,
        UTILITY: 0.15,
        ATMOSPHERIC: 0.10
    },

    darkMap: true,
    temperature: 21,

    // Room generation parameters
    roomCount: { min: 6, max: 10 },
    roomPools: [/* see room pool structure below */],

    // Procgen behavior
    layoutDensity: 'tight',  // tight, moderate, sparse
    corridorWidth: { min: 3, max: 5 },
    deadEndChance: 0.15,  // 15% of rooms can be dead ends

    // Loot and atmosphere
    lootDensity: 'medium',  // low, medium, high
    atmosphericRoomChance: 0.15  // 15% rooms have minimal/no loot
}
```

---

## Room Pool Structure

```javascript
{
    id: 'ROOM_TYPE_ID',
    name: 'Display Name',
    difficulty: 'EASY|MEDIUM|HARD',
    spawnWeight: 20,  // Relative probability vs other rooms

    size: {
        min: [8, 10],
        max: [12, 15],
        shape: 'rectangular|square|irregular'
    },

    biomes: ['RESIDENTIAL', 'ATMOSPHERIC'],  // Primary biome tags

    // Enemy spawning
    enemyCount: [0, 1, 2, 3],  // Equal probability for each
    enemyTypes: {
        robots: ['SECURITY_BOT', 'SCOUT_DRONE'],     // If location hasRobots
        aliens: ['SPORE_WALKER', 'MUTANT_RAT'],       // If location hasNature
        humanoids: ['SCAVENGER', 'PIRATE'],           // Common spawns
        aberrants: ['ABERRANT']                       // 2-5% chance
    },
    enemySpawnChance: {
        robots: 0.40,     // 40% chance if applicable
        aliens: 0.30,     // 30% chance if applicable
        humanoids: 0.15,  // 15% chance
        aberrants: 0.03   // 3% chance
    },

    // Loot tables
    loot: {
        common: ['SALVAGED_COMPONENTS', 'BASIC_ELECTRONICS'],
        uncommon: ['REPAIR_PASTE'],
        rare: ['INTACT_LOGIC_BOARD']
    },

    // Atmospheric details
    description: 'Brief description for flavor text',
    ambientDetails: ['Scattered tools', 'Broken terminals', 'Sparking wires']
}
```

---

# Location 1: Asteroid Civilian Habitat

**ID:** `ASTEROID_HABITAT`
**Difficulty:** EASY
**Map Size:** 70×70 to 90×90 (Large)
**Has Nature:** YES (hydroponics present - aliens spawn anywhere)
**Has Robots:** NO (civilian installation)
**Theme:** Abandoned rotating settlement where families once lived. Now overgrown and silent.

**Biome Distribution:**
- RESIDENTIAL: 40%
- NATURE: 20%
- UTILITY: 15%
- TRANSIT: 10%
- ATMOSPHERIC: 15%

**Vibe:** Domestic spaces gone wrong. Children's toys on the floor. Plants growing through walls. The mundane made eerie by absence.

**Procgen Parameters:**
- Layout Density: `tight` (residential blocks clustered together)
- Corridor Width: 3-4 tiles (narrow residential hallways)
- Room Count: 10-14
- Dead End Chance: 10% (some apartments are dead ends)
- Atmospheric Room Chance: 20% (many empty living spaces)

**Enemy Factions:** Aliens (anywhere because nature exists), Scavengers, Aberrants

---

## Room Pool: Asteroid Habitat

### Living Quarters [EASY]
**Weight:** 35 (most common)
**Size:** 8×10 to 12×15 (rectangular)
**Biomes:** `RESIDENTIAL`
**Enemy Count:** [0, 1, 2] (33% each)
- Aliens: 20% (Mutant Rat, Bloated Corpse)
- Humanoids: 30% (Scavenger)
- Aberrants: 2%

**Loot:**
- Common: Polymer Resin, Aramid Fibres
- Uncommon: Basic Electronics
- Rare: None

**Atmosphere:** Personal belongings scattered, makeshift beds, family photos, locked safes, empty cribs

---

### Hydroponic Garden [EASY]
**Weight:** 25
**Size:** 10×12 to 15×20 (irregular - organic growth)
**Biomes:** `NATURE`, `UTILITY`
**Enemy Count:** [0, 1, 2, 3] (25% each)
- Aliens: 40% (Spore Walker primary, Mutant Rat)
- Humanoids: 20% (Scavenger)
- Aberrants: 3%

**Loot:**
- Common: Raw Biomass, Organic Protein
- Uncommon: Chemical Compounds
- Rare: Bio-Woven Chitin (from alien enemies)

**Atmosphere:** Wild plant growth, water recyclers, grow lights flickering, vines everywhere, fungal growth

---

### Community Center [EASY]
**Weight:** 12
**Size:** 12×15 to 18×20 (square/rectangular)
**Biomes:** `RESIDENTIAL`, `ATMOSPHERIC`
**Enemy Count:** [0, 1] (50% each - mostly empty)
- Aliens: 15% (Mutant Rat)
- Humanoids: 20% (Scavenger)
- Aberrants: 2%

**Loot:**
- Common: Basic Electronics, Polymer Resin (low density)
- Uncommon: None
- Rare: None

**Atmosphere:** Empty stages, scattered toys, bulletin boards with faded notices, rec equipment, children's drawings

---

### Mess Hall [EASY]
**Weight:** 15
**Size:** 10×15 to 15×18 (rectangular)
**Biomes:** `RESIDENTIAL`
**Enemy Count:** [0, 1, 2, 3] (25% each)
- Aliens: 25% (Mutant Rat)
- Humanoids: 35% (Scavenger)
- Aberrants: 3%

**Loot:**
- Common: Organic Protein, Salvaged Components
- Uncommon: Chemical Compounds (from kitchen supplies)
- Rare: None

**Atmosphere:** Overturned tables, food storage, kitchen equipment, serving lines, dried stains

---

### Maintenance Closet [MEDIUM]
**Weight:** 8
**Size:** 6×8 to 10×12 (rectangular)
**Biomes:** `UTILITY`
**Enemy Count:** [0, 1, 2] (33% each)
- Aliens: 15% (Mutant Rat)
- Humanoids: 25% (Scavenger)
- Aberrants: 3%

**Loot:**
- Common: Salvaged Components, Basic Electronics
- Uncommon: Repair Paste (guaranteed 1+)
- Rare: None

**Atmosphere:** Tool racks, spare parts, electrical panels, maintenance logs, repair schedules

---

### Sanitation Block [EASY]
**Weight:** 3
**Size:** 6×10 to 10×12 (rectangular)
**Biomes:** `UTILITY`, `ATMOSPHERIC`
**Enemy Count:** [0, 1] (50% each - usually empty)
- Aliens: 10% (Mutant Rat)
- Humanoids: 10% (Scavenger)
- Aberrants: 1%

**Loot:**
- Common: Polymer Resin, Chemical Compounds
- Uncommon: None
- Rare: None

**Atmosphere:** Water damage, functional recyclers, laundry machines, personal hygiene items, mold

---

### Shuttle Dock [MEDIUM]
**Weight:** 2
**Size:** 15×20 to 20×25 (large rectangular)
**Biomes:** `TRANSIT`
**Enemy Count:** [0, 1, 2, 3, 4] (20% each)
- Aliens: 20% (Spore Walker, Mutant Rat)
- Humanoids: 50% (Scavenger, Pirate)
- Aberrants: 3%

**Loot:**
- Common: Salvaged Components, Basic Electronics
- Uncommon: Repair Paste
- Rare: Titanium Alloy (from ship parts)

**Atmosphere:** Empty airlocks, cargo crates, fuel lines, docking clamps, evacuation signs

---

**Location Notes:**
- Nature present (Hydroponics) enables aliens to spawn throughout the map
- No robots - pure civilian installation
- Mix of alien mutations (from overgrown plants) and desperate scavengers
- Living Quarters cluster together (residential blocks)
- 20% of rooms are atmospheric only (empty, abandoned, eerie)

---

# Location 2: Deep Space Listening Post

**ID:** `LISTENING_POST`
**Difficulty:** MEDIUM
**Map Size:** 50×60 to 65×65 (Medium)
**Has Nature:** NO (pure military - no aliens)
**Has Robots:** YES (automated security active)
**Theme:** Remote intelligence station for signal interception. Automated defenses still active. No organics.

**Biome Distribution:**
- TECH: 35%
- SECURITY: 20%
- RESIDENTIAL: 20%
- UTILITY: 15%
- ATMOSPHERIC: 10%

**Vibe:** Cold military precision. Blinking server lights in darkness. The hum of machines that never stopped listening. Security that never stood down.

**Procgen Parameters:**
- Layout Density: `tight` (military efficiency, minimal wasted space)
- Corridor Width: 3-4 tiles (narrow, angular, defensive)
- Room Count: 7-11
- Dead End Chance: 20% (security chokepoints)
- Atmospheric Room Chance: 10% (observation galleries)

Enemy Factions: Robots (Security Bots, Scout Drones), Scavengers, Aberrants

---

## Room Pool: Listening Post

### Data Center [MEDIUM]
**Weight:** 35
**Size:** 8×15 to 12×20 (rectangular)
**Biomes:** `TECH`, `SECURITY`
**Enemy Count:** [0, 1, 2, 3] (25% each)
- Robots: 50% (Scout Drone 60%, Security Bot 40%)
- Humanoids: 15% (Scavenger)
- Aberrants: 3%

**Loot:**
- Common: Basic Electronics
- Uncommon: High-Capacity Battery
- Rare: Intact Logic Board (guaranteed 1+)

**Atmosphere:** Humming servers, blinking lights, cooling fans, cable bundles everywhere, security cameras

---

### Intelligence Operations [HARD]
**Weight:** 20
**Size:** 10×12 to 15×18 (rectangular)
**Biomes:** `TECH`, `SECURITY`
**Enemy Count:** [0, 1, 2, 3, 4] (20% each)
- Robots: 65% (Security Bot 70%, Scout Drone 30%)
- Humanoids: 10% (Scavenger)
- Aberrants: 5%

**Loot:**
- Common: Basic Electronics
- Uncommon: High-Capacity Battery
- Rare: Intact Logic Board, Focusing Lenses

**Atmosphere:** Encrypted terminals, star maps, active displays, tactical consoles, classified warnings

---

### Signal Analysis Chamber [MEDIUM]
**Weight:** 15
**Size:** 10×12 to 14×16 (rectangular)
**Biomes:** `TECH`
**Enemy Count:** [0, 1, 2] (33% each)
- Robots: 40% (Scout Drone)
- Humanoids: 15% (Scavenger)
- Aberrants: 3%

**Loot:**
- Common: Basic Electronics
- Uncommon: Focusing Lenses
- Rare: None

**Atmosphere:** Waveform displays, headset stations, recording equipment, audio logs, signal graphs

---

### Crew Quarters [EASY]
**Weight:** 15
**Size:** 8×12 to 12×15 (rectangular)
**Biomes:** `RESIDENTIAL`
**Enemy Count:** [0, 1, 2] (33% each)
- Robots: 10% (Scout Drone - patrol route)
- Humanoids: 30% (Scavenger)
- Aberrants: 2%

**Loot:**
- Common: Aramid Fibres, Polymer Resin
- Uncommon: Basic Electronics
- Rare: None

**Atmosphere:** Military bunks, personal effects, security lockers, pinup posters, duty rosters

---

### Mess Hall [EASY]
**Weight:** 8
**Size:** 8×12 to 12×14 (rectangular)
**Biomes:** `RESIDENTIAL`
**Enemy Count:** [0, 1, 2] (33% each)
- Robots: 5% (Scout Drone)
- Humanoids: 30% (Scavenger)
- Aberrants: 3%

**Loot:**
- Common: Organic Protein, Salvaged Components
- Uncommon: None
- Rare: None

**Atmosphere:** Metal tables, automated kitchen, ration dispensers, mess schedules, spilled trays

---

### Life Support Bay [MEDIUM]
**Weight:** 5
**Size:** 10×15 to 14×18 (rectangular)
**Biomes:** `UTILITY`
**Enemy Count:** [0, 1, 2] (33% each)
- Robots: 35% (Scout Drone)
- Humanoids: 20% (Scavenger)
- Aberrants: 3%

**Loot:**
- Common: Basic Electronics, Salvaged Components
- Uncommon: Repair Paste, Chemical Compounds
- Rare: None

**Atmosphere:** Pipes, gauges, recycling tanks, oxygen scrubbers, water purifiers, pressure warnings

---

### Observation Gallery [EASY]
**Weight:** 2
**Size:** 10×12 to 15×15 (square/irregular)
**Biomes:** `ATMOSPHERIC`
**Enemy Count:** [0, 1] (50% each - usually empty)
- Robots: 10% (Scout Drone)
- Humanoids: 10% (Scavenger)
- Aberrants: 1%

**Loot:** None (atmospheric)

**Atmosphere:** Windows to deep space, telescope mounts, observation logs, eerie silence, star charts

---

**Location Notes:**
- No nature = no aliens anywhere
- Robot security still active (automated protocols)
- Tight corridors create defensive chokepoints
- 30% of Data Centers have active electronics (light sources in darkness)
- Security Bots patrol high-value areas (Intelligence, Data Centers)

---

# Location 3: Fractured Dyson Scaffold

**ID:** `DYSON_SCAFFOLD`
**Difficulty:** HARD
**Map Size:** 80×100 to 100×100 (Large)
**Has Nature:** NO (pure industrial - no aliens)
**Has Robots:** YES (heavy automated defenses)
**Theme:** Megastructure fragment for stellar engineering. Massive scale. Heavy automated defenses. No organics.

**Biome Distribution:**
- INDUSTRIAL: 40%
- TECH: 20%
- UTILITY: 15%
- SECURITY: 15%
- ATMOSPHERIC: 10%

**Vibe:** Inhuman scale. Machine cathedrals. The sounds of industry that never stopped. Security protocols that protect nothing but themselves.

**Procgen Parameters:**
- Layout Density: `moderate` (large industrial spaces with breathing room)
- Corridor Width: 5-8 tiles (industrial scale, wide enough for machinery)
- Room Count: 12-16
- Dead End Chance: 15% (some silos/workshops are terminals)
- Atmospheric Room Chance: 10% (structural support areas)

**Enemy Factions:** Robots (Security Bots, Scout Drones, Elite variants), Scavengers, Aberrants

---

## Room Pool: Dyson Scaffold

### Advanced Manufacturing [HARD]
**Weight:** 22
**Size:** 15×20 to 20×25 (large rectangular)
**Biomes:** `INDUSTRIAL`, `SECURITY`
**Enemy Count:** [0, 1, 2, 3, 4, 5] (16.7% each)
- Robots: 70% (Security Bot 50%, Elite Security Bot 20%, Scout Drone 30%)
- Humanoids: 5% (Scavenger)
- Aberrants: 5%

**Loot:**
- Common: Polymer Resin, Salvaged Components
- Uncommon: Titanium Alloy
- Rare: Energy-Reflective Film, Ceramic-Composite Plate

**Atmosphere:** Massive machinery, sparking equipment, nano-fabricators, assembly arms, warning klaxons

---

### Bulk Materials Silo [HARD]
**Weight:** 12
**Size:** 20×25 to 30×30 (very large, square/irregular)
**Biomes:** `INDUSTRIAL`
**Enemy Count:** [0, 1, 2, 3, 4] (20% each)
- Robots: 60% (Security Bot, Scout Drone)
- Humanoids: 15% (Scavenger)
- Aberrants: 5%

**Loot:** (High density)
- Common: Salvaged Components, Polymer Resin
- Uncommon: Titanium Alloy, Ceramic-Composite Plate
- Rare: Energy-Reflective Film

**Atmosphere:** Towering containers, loading cranes, material scattered everywhere, echo chamber, industrial scale

---

### Fabrication Bay [MEDIUM]
**Weight:** 18
**Size:** 12×18 to 18×22 (rectangular)
**Biomes:** `INDUSTRIAL`, `TECH`
**Enemy Count:** [0, 1, 2, 3] (25% each)
- Robots: 50% (Security Bot, Scout Drone)
- Humanoids: 12% (Scavenger)
- Aberrants: 3%

**Loot:**
- Common: Polymer Resin, Salvaged Components
- Uncommon: Titanium Alloy
- Rare: None

**Atmosphere:** Conveyor belts, robotic arms, half-finished products, 3D printers, assembly lines

---

### Maintenance Workshop [MEDIUM]
**Weight:** 15
**Size:** 10×15 to 15×18 (rectangular)
**Biomes:** `INDUSTRIAL`, `UTILITY`
**Enemy Count:** [0, 1, 2] (33% each)
- Robots: 40% (Scout Drone)
- Humanoids: 20% (Scavenger)
- Aberrants: 3%

**Loot:**
- Common: Salvaged Components, Basic Electronics
- Uncommon: Repair Paste (guaranteed 1-2)
- Rare: Titanium Alloy

**Atmosphere:** Workbenches, scattered tools, spare machine parts, repair logs, diagnostic equipment

---

### Power Relay Station [MEDIUM]
**Weight:** 12
**Size:** 10×12 to 14×18 (rectangular)
**Biomes:** `UTILITY`, `TECH`
**Enemy Count:** [0, 1, 2, 3] (25% each)
- Robots: 50% (Security Bot, Scout Drone)
- Humanoids: 10% (Scavenger)
- Aberrants: 3%

**Loot:**
- Common: Basic Electronics
- Uncommon: Thermal Gel, High-Capacity Battery (guaranteed 1+)
- Rare: None

**Atmosphere:** Electrical arcs, humming capacitors, cable bundles, warning lights, power conduits

---

### Overseer AI Core [HARD]
**Weight:** 8
**Size:** 12×15 to 16×20 (rectangular with central pillar)
**Biomes:** `TECH`, `SECURITY`
**Enemy Count:** [0, 1, 2, 3, 4] (20% each)
- Robots: 85% (Security Bot 70%, Elite Security Bot 30%)
- Humanoids: 0%
- Aberrants: 5%

**Loot:**
- Common: None
- Uncommon: High-Capacity Battery, Intact Logic Board
- Rare: Energy-Reflective Film (guaranteed 1+)

**Atmosphere:** Holographic displays, central AI pillar, active monitoring, defense protocols, security sweeps

---

### Structural Support [EASY]
**Weight:** 10
**Size:** 8×20 to 12×30 (long, narrow)
**Biomes:** `ATMOSPHERIC`
**Enemy Count:** [0, 1] (50% each - mostly empty)
- Robots: 15% (Scout Drone)
- Humanoids: 15% (Scavenger)
- Aberrants: 2%

**Loot:** (Low density)
- Common: Salvaged Components
- Uncommon: Ceramic-Composite Plate
- Rare: None

**Atmosphere:** Open frameworks, catwalks, exposed superstructure, stars visible through gaps, creaking metal

---

### Star-Facing Observatory [EASY]
**Weight:** 3
**Size:** 12×12 to 16×16 (square)
**Biomes:** `TECH`, `ATMOSPHERIC`
**Enemy Count:** [0, 1] (50% each)
- Robots: 20% (Scout Drone)
- Humanoids: 10% (Scavenger)
- Aberrants: 1%

**Loot:**
- Common: None
- Uncommon: Focusing Lenses (guaranteed 1+)
- Rare: Energy-Reflective Film

**Atmosphere:** Massive optical arrays, view of nearby star, scientific instruments, heat shielding, radiation warnings

---

**Location Notes:**
- No nature anywhere = no aliens spawn
- Highest robot density and toughest fights
- Wide corridors (industrial scale) create different combat dynamics
- Large rooms have multiple entry points (not single chokepoints)
- Mix 25% Easy rooms for safe zones (Structural Support, Observatory)
- Elite Security Bots in high-value areas

---

# Procedural Generation - Implementation Specification

This section provides complete implementation details for the map generation system.

---

## System Overview

**Trigger:** Interactable object on player's ship (e.g., `EXPEDITION_CONSOLE`)
**Flow:** User activates console → Generate map → Spawn player on generated map → Begin exploration
**Exit:** Return to ship (future implementation)

---

## Data Structures

### Generated Map Format
```javascript
{
    id: 'generated_ASTEROID_HABITAT_1234',  // Unique ID with seed
    name: 'Asteroid Civilian Habitat',
    sourceLocationId: 'ASTEROID_HABITAT',
    seed: 1234,  // RNG seed for reproducibility

    width: 85,
    height: 85,

    darkMap: true,
    temperature: 21,

    // ASCII layout (like existing MAP_DATA)
    layout: [
        "+++++++++++...",  // '+' = wall, '.' = floor
        // ... height number of strings
    ],

    // Generated entities
    interactables: [
        { id: 'SALVAGED_COMPONENTS', x: 15, y: 20 },
        // ... all loot items
    ],

    creatures: [
        { id: 'SCAVENGER', x: 25, y: 30 },
        // ... all enemies
    ],

    playerSpawn: { x: 10, y: 10 },

    // Metadata for debugging
    rooms: [
        {
            id: 'room_0',
            type: 'LIVING_QUARTERS',
            bounds: { x: 5, y: 5, width: 12, height: 15 },
            biomes: ['RESIDENTIAL'],
            difficulty: 'EASY'
        },
        // ... all rooms
    ]
}
```

---

## Generation Algorithm - Step by Step

### Phase 1: Initialization

```javascript
function generateMap(locationId, seed = Date.now()) {
    const location = LOCATION_DATA[locationId];
    const rng = new SeededRandom(seed);

    // 1. Determine map dimensions
    const width = rng.randInt(location.mapSize.min[0], location.mapSize.max[0]);
    const height = rng.randInt(location.mapSize.min[1], location.mapSize.max[1]);

    // 2. Initialize empty grid
    const grid = createEmptyGrid(width, height);  // All void initially

    // 3. Determine room count
    const roomCount = rng.randInt(location.roomCount.min, location.roomCount.max);

    // 4. Create weighted room pool
    const roomPool = createWeightedPool(location.roomPools);

    const state = {
        location,
        rng,
        grid,
        width,
        height,
        roomCount,
        roomPool,
        rooms: [],          // Placed rooms
        corridors: [],      // Corridor segments
        hasNature: false    // Track if any NATURE biome room placed
    };

    return state;
}
```

---

### Phase 2: Room Placement

**Algorithm:** Organic growth from seed point

```javascript
function placeRooms(state) {
    // 1. Place seed room (player spawn)
    const seedRoom = selectSeedRoom(state);  // Must be EASY difficulty
    const seedPos = {
        x: state.rng.randInt(5, 15),  // Near edge
        y: state.rng.randInt(5, 15)
    };

    placeRoom(state, seedRoom, seedPos);

    // 2. Grow rooms organically
    let openList = [state.rooms[0]];  // Rooms that can spawn neighbors
    let attemptsRemaining = state.roomCount * 3;  // Prevent infinite loops

    while (state.rooms.length < state.roomCount && attemptsRemaining > 0) {
        attemptsRemaining--;

        // Pick random room from open list
        const parentRoom = state.rng.choice(openList);

        // Select next room type from weighted pool
        const nextRoomType = selectWeightedRoom(state.roomPool, state.rng);

        // Try to place adjacent to parent
        const placement = findAdjacentPlacement(state, parentRoom, nextRoomType);

        if (placement) {
            const newRoom = placeRoom(state, nextRoomType, placement);
            openList.push(newRoom);

            // Create corridor connection
            createCorridor(state, parentRoom, newRoom);

        } else {
            // Can't place next to this room, remove from open list
            openList = openList.filter(r => r !== parentRoom);
        }

        // Prune open list if too large (maintain density)
        if (openList.length > 5) {
            openList = state.rng.shuffle(openList).slice(0, 5);
        }
    }

    return state;
}

function selectSeedRoom(state) {
    // Must be EASY difficulty
    const easyRooms = state.roomPool.filter(r => r.difficulty === 'EASY');
    return state.rng.choice(easyRooms);
}

function findAdjacentPlacement(state, parentRoom, nextRoomType) {
    // Determine room size
    const w = state.rng.randInt(nextRoomType.size.min[0], nextRoomType.size.max[0]);
    const h = state.rng.randInt(nextRoomType.size.min[1], nextRoomType.size.max[1]);

    // Try all 4 cardinal directions
    const directions = state.rng.shuffle([
        { dx: 1, dy: 0 },   // Right
        { dx: -1, dy: 0 },  // Left
        { dx: 0, dy: 1 },   // Down
        { dx: 0, dy: -1 }   // Up
    ]);

    for (const dir of directions) {
        // Calculate position based on direction
        let x, y;

        if (dir.dx === 1) {  // Right of parent
            x = parentRoom.bounds.x + parentRoom.bounds.width + state.rng.randInt(3, 8);  // 3-8 tile gap for corridor
            y = parentRoom.bounds.y + state.rng.randInt(-h/2, parentRoom.bounds.height - h/2);
        } else if (dir.dx === -1) {  // Left of parent
            x = parentRoom.bounds.x - w - state.rng.randInt(3, 8);
            y = parentRoom.bounds.y + state.rng.randInt(-h/2, parentRoom.bounds.height - h/2);
        } else if (dir.dy === 1) {  // Below parent
            x = parentRoom.bounds.x + state.rng.randInt(-w/2, parentRoom.bounds.width - w/2);
            y = parentRoom.bounds.y + parentRoom.bounds.height + state.rng.randInt(3, 8);
        } else {  // Above parent
            x = parentRoom.bounds.x + state.rng.randInt(-w/2, parentRoom.bounds.width - w/2);
            y = parentRoom.bounds.y - h - state.rng.randInt(3, 8);
        }

        // Check if position is valid
        if (isValidPlacement(state, x, y, w, h)) {
            return { x: Math.floor(x), y: Math.floor(y), width: w, height: h };
        }
    }

    return null;  // No valid placement found
}

function isValidPlacement(state, x, y, w, h) {
    // Check bounds
    if (x < 2 || y < 2 || x + w >= state.width - 2 || y + h >= state.height - 2) {
        return false;
    }

    // Check overlap with existing rooms (with 2-tile buffer)
    for (const room of state.rooms) {
        if (rectanglesOverlap(
            x - 2, y - 2, w + 4, h + 4,
            room.bounds.x, room.bounds.y, room.bounds.width, room.bounds.height
        )) {
            return false;
        }
    }

    return true;
}

function placeRoom(state, roomType, placement) {
    const room = {
        id: `room_${state.rooms.length}`,
        type: roomType.id,
        roomData: roomType,
        bounds: placement,
        biomes: roomType.biomes,
        difficulty: roomType.difficulty,
        entities: [],  // Will be populated with enemies/loot
        floorTiles: []  // List of walkable coordinates
    };

    // Carve room into grid (set to floor)
    for (let dy = 0; dy < placement.height; dy++) {
        for (let dx = 0; dx < placement.width; dx++) {
            const gx = placement.x + dx;
            const gy = placement.y + dy;
            state.grid[gy][gx] = 'floor';
            room.floorTiles.push({ x: gx, y: gy });
        }
    }

    // Track if this adds NATURE biome
    if (roomType.biomes.includes('NATURE')) {
        state.hasNature = true;
    }

    state.rooms.push(room);
    return room;
}
```

---

### Phase 3: Corridor Generation

```javascript
function createCorridor(state, roomA, roomB) {
    // Get center points of rooms
    const centerA = {
        x: Math.floor(roomA.bounds.x + roomA.bounds.width / 2),
        y: Math.floor(roomA.bounds.y + roomA.bounds.height / 2)
    };
    const centerB = {
        x: Math.floor(roomB.bounds.x + roomB.bounds.width / 2),
        y: Math.floor(roomB.bounds.y + roomB.bounds.height / 2)
    };

    // Get corridor width from location settings
    const width = state.rng.randInt(
        state.location.corridorWidth.min,
        state.location.corridorWidth.max
    );

    // Use L-shaped corridor (horizontal then vertical, or vice versa)
    if (state.rng.random() < 0.5) {
        // Horizontal first
        carveTunnel(state, centerA.x, centerA.y, centerB.x, centerA.y, width);
        carveTunnel(state, centerB.x, centerA.y, centerB.x, centerB.y, width);
    } else {
        // Vertical first
        carveTunnel(state, centerA.x, centerA.y, centerA.x, centerB.y, width);
        carveTunnel(state, centerA.x, centerB.y, centerB.x, centerB.y, width);
    }
}

function carveTunnel(state, x1, y1, x2, y2, width) {
    const dx = x2 > x1 ? 1 : (x2 < x1 ? -1 : 0);
    const dy = y2 > y1 ? 1 : (y2 < y1 ? -1 : 0);

    let x = x1;
    let y = y1;

    while (x !== x2 || y !== y2) {
        // Carve width tiles perpendicular to direction
        for (let w = 0; w < width; w++) {
            const offsetX = dy !== 0 ? w - Math.floor(width/2) : 0;
            const offsetY = dx !== 0 ? w - Math.floor(width/2) : 0;

            const gx = x + offsetX;
            const gy = y + offsetY;

            if (gx >= 1 && gx < state.width - 1 && gy >= 1 && gy < state.height - 1) {
                if (state.grid[gy][gx] !== 'floor') {
                    state.grid[gy][gx] = 'corridor';
                }
            }
        }

        x += dx;
        y += dy;
    }
}
```

---

### Phase 4: Wall Building

```javascript
function buildWalls(state) {
    // Create walls around all floor/corridor tiles
    for (let y = 0; y < state.height; y++) {
        for (let x = 0; x < state.width; x++) {
            if (state.grid[y][x] === 'floor' || state.grid[y][x] === 'corridor') {
                // Check all 8 neighbors
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0) continue;

                        const nx = x + dx;
                        const ny = y + dy;

                        if (nx >= 0 && nx < state.width && ny >= 0 && ny < state.height) {
                            if (state.grid[ny][nx] === undefined || state.grid[ny][nx] === 'void') {
                                state.grid[ny][nx] = 'wall';
                            }
                        }
                    }
                }
            }
        }
    }
}

function gridToLayout(state) {
    // Convert grid to ASCII layout array (like MAP_DATA format)
    const layout = [];

    for (let y = 0; y < state.height; y++) {
        let row = '';
        for (let x = 0; x < state.width; x++) {
            const cell = state.grid[y][x];
            if (cell === 'wall') row += '+';
            else if (cell === 'floor' || cell === 'corridor') row += '.';
            else row += ' ';  // void
        }
        layout.push(row);
    }

    return layout;
}
```

---

### Phase 5: Enemy Spawning

```javascript
function spawnEnemies(state) {
    // Check faction availability based on map properties
    const hasRobots = state.location.hasRobots;
    const hasAliens = state.location.hasNature && state.hasNature;

    for (const room of state.rooms) {
        const roomType = room.roomData;

        // 1. Determine enemy count (equal probability including 0)
        const enemyCount = state.rng.choice(roomType.enemyCount);

        if (enemyCount === 0) continue;

        // 2. Spawn enemies based on faction chances
        let spawnedCount = 0;

        while (spawnedCount < enemyCount && room.floorTiles.length > spawnedCount) {
            let enemyId = null;

            // Roll for each faction independently

            // Primary factions (robots/aliens)
            if (hasRobots && state.rng.random() < roomType.enemySpawnChance.robots) {
                enemyId = selectRobotEnemy(state, roomType);
            } else if (hasAliens && state.rng.random() < roomType.enemySpawnChance.aliens) {
                enemyId = selectAlienEnemy(state, roomType);
            }

            // Secondary spawns (humanoids)
            if (!enemyId && state.rng.random() < roomType.enemySpawnChance.humanoids) {
                enemyId = selectHumanoidEnemy(state, roomType);
            }

            // Rare spawns (aberrants)
            if (!enemyId && state.rng.random() < roomType.enemySpawnChance.aberrants) {
                enemyId = 'ABERRANT';
            }

            // If we selected an enemy, place it
            if (enemyId) {
                const pos = room.floorTiles[spawnedCount];  // Spread enemies across room
                room.entities.push({ id: enemyId, x: pos.x, y: pos.y });
                spawnedCount++;
            } else {
                break;  // No enemy selected, stop trying
            }
        }
    }
}

function selectRobotEnemy(state, roomType) {
    if (!roomType.enemyTypes.robots || roomType.enemyTypes.robots.length === 0) {
        return null;
    }

    // Weighted selection based on difficulty
    const weights = roomType.enemyTypes.robots.map(id => {
        if (id === 'SCOUT_DRONE') return 60;
        if (id === 'SECURITY_BOT') return 35;
        if (id === 'ELITE_SECURITY_BOT') return 5;
        return 10;
    });

    return weightedChoice(roomType.enemyTypes.robots, weights, state.rng);
}

function selectAlienEnemy(state, roomType) {
    if (!roomType.enemyTypes.aliens || roomType.enemyTypes.aliens.length === 0) {
        return null;
    }
    return state.rng.choice(roomType.enemyTypes.aliens);
}

function selectHumanoidEnemy(state, roomType) {
    if (!roomType.enemyTypes.humanoids || roomType.enemyTypes.humanoids.length === 0) {
        return null;
    }

    // Scavengers more common than pirates
    const weights = roomType.enemyTypes.humanoids.map(id => {
        if (id === 'SCAVENGER') return 100; // Scavengers are now the only humanoid enemy
        return 10; // Default low weight for any unexpected entries
    });

    return weightedChoice(roomType.enemyTypes.humanoids, weights, state.rng);
}
```

---

### Phase 6: Loot Spawning

```javascript
function spawnLoot(state) {
    for (const room of state.rooms) {
        const roomType = room.roomData;

        // 1. Check if this is atmospheric room (low loot)
        if (state.rng.random() < state.location.atmosphericRoomChance) {
            // Atmospheric room: 0-1 items only
            if (state.rng.random() < 0.3) {
                const item = selectLoot(roomType, 'common', state.rng);
                if (item) {
                    const pos = state.rng.choice(room.floorTiles);
                    room.entities.push({ id: item, x: pos.x, y: pos.y });
                }
            }
            continue;
        }

        // 2. Determine item count based on difficulty
        let itemCount;
        if (roomType.difficulty === 'EASY') {
            itemCount = state.rng.randInt(1, 3);
        } else if (roomType.difficulty === 'MEDIUM') {
            itemCount = state.rng.randInt(2, 5);
        } else {  // HARD
            itemCount = state.rng.randInt(4, 8);
        }

        // 3. Spawn guaranteed items first
        const guaranteedItems = parseGuaranteedItems(roomType);
        for (const item of guaranteedItems) {
            if (room.floorTiles.length > room.entities.length) {
                const pos = state.rng.choice(room.floorTiles);
                room.entities.push({ id: item, x: pos.x, y: pos.y });
            }
        }

        // 4. Spawn random items
        for (let i = 0; i < itemCount && room.floorTiles.length > room.entities.length; i++) {
            // Roll rarity tier
            const roll = state.rng.random();
            let rarity;
            if (roll < 0.60) rarity = 'common';
            else if (roll < 0.90) rarity = 'uncommon';
            else rarity = 'rare';

            const item = selectLoot(roomType, rarity, state.rng);
            if (item) {
                // Pick unoccupied floor tile
                const availableTiles = room.floorTiles.filter(tile =>
                    !room.entities.some(e => e.x === tile.x && e.y === tile.y)
                );

                if (availableTiles.length > 0) {
                    const pos = state.rng.choice(availableTiles);
                    room.entities.push({ id: item, x: pos.x, y: pos.y });
                }
            }
        }
    }
}

function selectLoot(roomType, rarity, rng) {
    const pool = roomType.loot[rarity];
    if (!pool || pool.length === 0) return null;
    return rng.choice(pool);
}

function parseGuaranteedItems(roomType) {
    // Look for items marked "guaranteed" in loot tables
    // e.g., "Repair Paste (guaranteed 1+)" becomes ['REPAIR_PASTE']
    const guaranteed = [];

    ['common', 'uncommon', 'rare'].forEach(rarity => {
        if (roomType.loot[rarity]) {
            roomType.loot[rarity].forEach(item => {
                // Check room atmosphere description for "guaranteed" markers
                // This is a simplified version - actual implementation depends on data format
            });
        }
    });

    return guaranteed;
}
```

---

### Phase 7: Player Spawn

```javascript
function determinePlayerSpawn(state) {
    // Player spawns in the seed room (first room placed)
    const seedRoom = state.rooms[0];

    // Pick random floor tile in room
    // NOTE: This can be near enemies (2-3 tiles away is fine)
    const spawnTile = state.rng.choice(seedRoom.floorTiles);

    state.playerSpawn = { x: spawnTile.x, y: spawnTile.y };
}
```

---

### Phase 8: Finalization

```javascript
function finalizeMap(state) {
    // Combine all entities from all rooms
    const allInteractables = [];
    const allCreatures = [];

    for (const room of state.rooms) {
        for (const entity of room.entities) {
            if (isCreature(entity.id)) {
                allCreatures.push(entity);
            } else {
                allInteractables.push(entity);
            }
        }
    }

    // Build final map object
    return {
        id: `generated_${state.location.id}_${state.seed}`,
        name: state.location.name,
        sourceLocationId: state.location.id,
        seed: state.seed,

        width: state.width,
        height: state.height,

        darkMap: state.location.darkMap,
        temperature: state.location.temperature,

        layout: gridToLayout(state),

        interactables: allInteractables,
        creatures: allCreatures,

        playerSpawn: state.playerSpawn,

        // Debug metadata
        rooms: state.rooms.map(r => ({
            id: r.id,
            type: r.type,
            bounds: r.bounds,
            biomes: r.biomes,
            difficulty: r.difficulty
        }))
    };
}
```

---

## Complete Generation Function

```javascript
function generateExpeditionMap(locationId, seed) {
    // Phase 1: Init
    const state = generateMap(locationId, seed);

    // Phase 2: Place rooms
    placeRooms(state);

    // Phase 3: Connect with corridors
    // (already done during placement)

    // Phase 4: Build walls
    buildWalls(state);

    // Phase 5: Spawn enemies
    spawnEnemies(state);

    // Phase 6: Spawn loot
    spawnLoot(state);

    // Phase 7: Determine player spawn
    determinePlayerSpawn(state);

    // Phase 8: Finalize
    const finalMap = finalizeMap(state);

    return finalMap;
}
```

---

## Integration with Game

### Creating the Expedition Console

Add to ship interactables in `gamedata/interactables.js`:

```javascript
{
    id: 'EXPEDITION_CONSOLE',
    name: 'Expedition Console',
    char: 'E',
    colour: '#0af',
    interactable: true,
    onInteract: {
        action: 'GENERATE_EXPEDITION'
    }
}
```

Add to ship map in `gamedata/map.js`:

```javascript
interactables: [
    // ... existing items
    { id: 'EXPEDITION_CONSOLE', x: 6, y: 5 }
]
```

### Handling the Interaction

In `handlers/menu-actions.js` or wherever interactions are processed:

```javascript
function handleInteraction(entity, interactable) {
    if (interactable.onInteract?.action === 'GENERATE_EXPEDITION') {
        // For now, always generate Asteroid Habitat (easiest)
        // Later: show selection UI
        const locationId = 'ASTEROID_HABITAT';
        const seed = Date.now();

        const generatedMap = generateExpeditionMap(locationId, seed);

        // Switch to generated map
        loadMap(generatedMap);

        // Spawn player at designated location
        spawnPlayerAtPosition(generatedMap.playerSpawn.x, generatedMap.playerSpawn.y);

        return;
    }

    // ... other interactions
}
```

---

## Utility Functions

### Seeded Random Number Generator

```javascript
class SeededRandom {
    constructor(seed) {
        this.seed = seed;
    }

    random() {
        // Simple LCG (Linear Congruential Generator)
        this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
        return this.seed / 4294967296;
    }

    randInt(min, max) {
        return Math.floor(this.random() * (max - min + 1)) + min;
    }

    choice(array) {
        return array[this.randInt(0, array.length - 1)];
    }

    shuffle(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = this.randInt(0, i);
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}
```

### Helper Functions

```javascript
function createEmptyGrid(width, height) {
    return Array(height).fill(null).map(() => Array(width).fill('void'));
}

function rectanglesOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
    return !(x1 + w1 < x2 || x2 + w2 < x1 || y1 + h1 < y2 || y2 + h2 < y1);
}

function createWeightedPool(roomPools) {
    // Duplicate rooms based on their spawn weight
    const pool = [];
    for (const room of roomPools) {
        for (let i = 0; i < room.spawnWeight; i++) {
            pool.push(room);
        }
    }
    return pool;
}

function weightedChoice(items, weights, rng) {
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let roll = rng.random() * totalWeight;

    for (let i = 0; i < items.length; i++) {
        roll -= weights[i];
        if (roll <= 0) return items[i];
    }

    return items[items.length - 1];
}

function isCreature(entityId) {
    // Check if entity is in CREATURE_DATA
    return CREATURE_DATA.some(c => c.id === entityId);
}
```

---

## Testing & Debugging

### Visualization

To debug generation, add a visualization function:

```javascript
function visualizeGrid(state) {
    for (let y = 0; y < state.height; y++) {
        let row = '';
        for (let x = 0; x < state.width; x++) {
            const cell = state.grid[y][x];
            if (cell === 'wall') row += '+';
            else if (cell === 'floor') row += '.';
            else if (cell === 'corridor') row += ':';
            else row += ' ';
        }
        console.log(row);
    }
}
```

### Common Issues

1. **Rooms not connecting:** Check corridor generation and ensure rooms are within reach
2. **Player spawns in wall:** Ensure player spawn uses floor tiles only
3. **No enemies spawning:** Check faction flags (hasNature, hasRobots) and spawn chances
4. **Overlapping rooms:** Increase buffer in `isValidPlacement`
5. **Map too empty:** Increase room count or reduce gap between rooms

---

## Performance Considerations

- **Generation time target:** <500ms for 100×100 map
- **Memory:** Keep grid in memory only during generation, discard after layout created
- **Room placement retries:** Limit to 3x room count to prevent hangs
- **Optimization:** Cache weighted pools, reuse RNG instance

---

## Future Enhancements

1. **Map selection UI:** Let player choose location before generation
2. **Difficulty modifiers:** Player can adjust enemy density, loot rarity
3. **Persistent maps:** Save/load generated maps by seed
4. **Return to ship:** Mechanism to exit expedition and return to ship
5. **Map preview:** Mini-map or stats before committing to expedition
6. **Biome clustering:** Group same-biome rooms together more aggressively
7. **Special rooms:** Boss rooms, treasure rooms, safe rooms (0.5-2% chance)

---

# Adding New Content (Expansion Guide)

## Adding a New Location

1. Copy an existing location template
2. Define core parameters:
   - Difficulty tier (EASY/MEDIUM/HARD)
   - Map size (small/medium/large)
   - Has Nature? (determines if aliens can spawn)
   - Has Robots? (determines if robots spawn)
   - Biome distribution
3. Create 6-10 room types (see room pool structure)
4. Balance room weights to create intended experience
5. Write procgen notes for special rules

**Example: Adding "Derelict Freighter"**
- Difficulty: MEDIUM
- Size: 60×80 (large)
- Has Nature: YES (cargo bay with organic goods = aliens anywhere)
- Has Robots: YES (ship security systems = robots in tech/security areas)
- Biomes: INDUSTRIAL 30%, RESIDENTIAL 20%, NATURE 15%, TRANSIT 20%, UTILITY 15%
- Rooms: Cargo Hold, Bridge, Engine Room, Crew Quarters, Bio-Storage, etc.

## Adding a New Room Type

1. Define basic parameters (size, difficulty)
2. Assign 1-2 primary biomes
3. Set spawn weight relative to other rooms in location
4. Define enemy spawn chances by faction
5. Create loot tables based on biome
6. Write atmospheric details

**Example: Adding "Cargo Bay" room**
```javascript
{
    id: 'CARGO_BAY',
    name: 'Cargo Bay',
    difficulty: 'MEDIUM',
    spawnWeight: 18,
    size: { min: [15, 20], max: [20, 25], shape: 'rectangular' },
    biomes: ['INDUSTRIAL', 'TRANSIT'],
    enemyCount: [0, 1, 2, 3],
    enemySpawnChance: {
        robots: 0.35,
        aliens: 0.25,  // If nature exists on map
        humanoids: 0.20,
        aberrants: 0.03
    },
    loot: {
        common: ['SALVAGED_COMPONENTS', 'POLYMER_RESIN'],
        uncommon: ['TITANIUM_ALLOY'],
        rare: ['CERAMIC_COMPOSITE_PLATE']
    },
    description: 'Large storage area with shipping containers',
    ambientDetails: ['Stacked crates', 'Loading equipment', 'Cargo manifests', 'Broken pallets']
}
```

## Adding a New Biome

1. Define thematic purpose and function
2. Specify which enemy factions prefer this biome
3. Create loot table specific to biome
4. List example room types
5. Define any special rules

**Example: Adding "MEDICAL" biome**
- Purpose: Healthcare facilities, surgical theaters, patient wards
- Enemy Factions: Aliens (infected patients), Humanoids (looters), Aberrants (mutations)
- Loot: Chemical Compounds, Neuro-conductive Tissue, Repair Paste (medkits)
- Examples: Operating Theater, Infirmary, Morgue, Pharmacy
- Special Rule: Higher aberrant spawn chance (5-8%)

## Adding a New Enemy Type

1. Define in creatures.js
2. Assign to faction: Robot, Alien, Aberrant, or Humanoid
3. Specify biome preferences
4. Update spawn rules:
   - Robots: TECH, INDUSTRIAL, SECURITY biomes
   - Aliens: Anywhere (if NATURE exists on map), prefer NATURE and RESIDENTIAL
   - Aberrants: Anywhere (rare)
   - Humanoids: RESIDENTIAL, TRANSIT, varies by type
5. Consider faction conflicts for future implementation

---

# Thematic Notes

**What Makes This Work:**

1. **Absence is presence** - Empty rooms tell stories through what's missing
2. **System failure** - Automated defenses protecting nothing, hydroponics growing wild
3. **Scale variation** - Tiny satellite vs massive scaffold creates different experiences
4. **Biome identity** - Each biome has distinct enemy types, loot, and atmosphere
5. **Faction logic** - Nature enables aliens, tech enables robots, size enables mixing
6. **Environmental storytelling** - Toys in habitats, classified terminals in listening posts
7. **Desolate but not empty** - Sparse spawns create tension, not tedium

**What to Avoid:**

1. Don't make every room dangerous (0 enemies is valid and common)
2. Don't create "loot pinatas" (every room full of items)
3. Don't make sprawling layouts (tight is better)
4. Don't ignore faction rules (aliens need nature, robots need tech/security)
5. Don't forget atmospheric rooms (some spaces are just... there)
6. Don't make small maps have all factions (size determines faction mixing)
7. Don't gate biomes by difficulty - all biomes should appear at all difficulty levels

**Loot Philosophy:**

- **All biomes available at all difficulties** - Easy locations can have TECH/INDUSTRIAL rooms too
- **Difficulty affects efficiency, not access** - Easy locations have fewer rooms, lower enemy density, less loot per room
- **Easier locations must remain worthwhile** - You can get titanium from an Easy habitat's shuttle dock, just less of it
- **Harder locations are more efficient** - More rooms, denser loot spawns, higher rare item chances
- **Risk vs reward, not gating** - Players choose between safe-but-slow (Easy) or dangerous-but-fast (Hard)
