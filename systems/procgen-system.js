// Procedural Map Generation System
// Generates expedition maps based on location templates

// --- UTILITY FUNCTIONS ---

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

// --- GENERATION PHASES ---

// Phase 1: Initialization
function initializeGeneration(locationId, seed = Date.now()) {
    const location = LOCATION_DATA[locationId];
    if (!location) {
        console.error(`Location "${locationId}" not found!`);
        return null;
    }

    const rng = new SeededRandom(seed);

    // Determine map dimensions
    const width = rng.randInt(location.mapSize.min[0], location.mapSize.max[0]);
    const height = rng.randInt(location.mapSize.min[1], location.mapSize.max[1]);

    // Initialize empty grid
    const grid = createEmptyGrid(width, height);

    // Determine room count
    const roomCount = rng.randInt(location.roomCount.min, location.roomCount.max);

    // Create weighted room pool
    const roomPool = createWeightedPool(location.roomPools);

    const state = {
        location,
        rng,
        grid,
        width,
        height,
        roomCount,
        roomPool,
        rooms: [],
        corridors: [],
        hasNature: false,
        seed,
        locationId
    };

    return state;
}

// Phase 2: Room Placement
function selectSeedRoom(state) {
    // Must be EASY difficulty for player spawn
    const easyRooms = state.roomPool.filter(r => r.difficulty === 'EASY');
    return state.rng.choice(easyRooms);
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
        entities: [],
        floorTiles: []
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
        let x, y;

        if (dir.dx === 1) {  // Right of parent
            x = parentRoom.bounds.x + parentRoom.bounds.width + state.rng.randInt(3, 8);
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
        if (isValidPlacement(state, Math.floor(x), Math.floor(y), w, h)) {
            return { x: Math.floor(x), y: Math.floor(y), width: w, height: h };
        }
    }

    return null;  // No valid placement found
}

function placeRooms(state) {
    // 1. Place seed room (player spawn)
    const seedRoom = selectSeedRoom(state);
    const seedPos = {
        x: state.rng.randInt(5, 15),
        y: state.rng.randInt(5, 15),
        width: state.rng.randInt(seedRoom.size.min[0], seedRoom.size.max[0]),
        height: state.rng.randInt(seedRoom.size.min[1], seedRoom.size.max[1])
    };

    placeRoom(state, seedRoom, seedPos);

    // 2. Grow rooms organically
    let openList = [state.rooms[0]];
    let attemptsRemaining = state.roomCount * 3;

    while (state.rooms.length < state.roomCount && attemptsRemaining > 0) {
        attemptsRemaining--;

        // Pick random room from open list
        const parentRoom = state.rng.choice(openList);

        // Select next room type from weighted pool
        const nextRoomType = state.rng.choice(state.roomPool);

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

        // Prevent empty open list
        if (openList.length === 0 && state.rooms.length > 0) {
            openList.push(state.rng.choice(state.rooms));
        }
    }

    return state;
}

// Phase 3: Corridor Generation
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

// Phase 4: Wall Building
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

// Phase 4.5: Door Placement
function placeDoors(state) {
    state.doors = [];

    for (const room of state.rooms) {
        const bounds = room.bounds;

        // Find connections on each side of the room
        // North, South, East, West
        const sides = [
            { name: 'north', x1: bounds.x, x2: bounds.x + bounds.width - 1, y: bounds.y - 1, dx: 0, dy: -1 },
            { name: 'south', x1: bounds.x, x2: bounds.x + bounds.width - 1, y: bounds.y + bounds.height, dx: 0, dy: 1 },
            { name: 'west', y1: bounds.y, y2: bounds.y + bounds.height - 1, x: bounds.x - 1, dx: -1, dy: 0 },
            { name: 'east', y1: bounds.y, y2: bounds.y + bounds.height - 1, x: bounds.x + bounds.width, dx: 1, dy: 0 }
        ];

        for (const side of sides) {
            const corridorTiles = [];

            if (side.name === 'north' || side.name === 'south') {
                // Check horizontal side
                for (let x = side.x1; x <= side.x2; x++) {
                    if (x >= 0 && x < state.width && side.y >= 0 && side.y < state.height) {
                        if (state.grid[side.y][x] === 'corridor') {
                            corridorTiles.push({ x, y: side.y });
                        }
                    }
                }
            } else {
                // Check vertical side
                for (let y = side.y1; y <= side.y2; y++) {
                    if (side.x >= 0 && side.x < state.width && y >= 0 && y < state.height) {
                        if (state.grid[y][side.x] === 'corridor') {
                            corridorTiles.push({ x: side.x, y });
                        }
                    }
                }
            }

            // If we found corridor tiles on this side, place a door in the middle
            if (corridorTiles.length > 0) {
                const midIndex = Math.floor(corridorTiles.length / 2);
                const doorPos = corridorTiles[midIndex];

                // Check if door already exists here
                const alreadyHasDoor = state.doors.some(d => d.x === doorPos.x && d.y === doorPos.y);
                if (!alreadyHasDoor) {
                    state.doors.push(doorPos);
                    state.grid[doorPos.y][doorPos.x] = 'door';

                    // Determine corridor direction and add walls perpendicular to it
                    // If corridor is on north/south side, it flows vertically -> add walls east/west
                    // If corridor is on east/west side, it flows horizontally -> add walls north/south
                    let perpendicularDirs = [];

                    if (side.name === 'north' || side.name === 'south') {
                        // Vertical corridor - add walls to the sides (east/west)
                        perpendicularDirs = [
                            { dx: -1, dy: 0 },  // West
                            { dx: 1, dy: 0 }    // East
                        ];
                    } else {
                        // Horizontal corridor - add walls above/below (north/south)
                        perpendicularDirs = [
                            { dx: 0, dy: -1 },  // North
                            { dx: 0, dy: 1 }    // South
                        ];
                    }

                    // Add walls perpendicular to corridor (check multiple tiles for wide corridors)
                    for (const dir of perpendicularDirs) {
                        // Keep checking in this direction until we hit a non-corridor tile
                        let distance = 1;
                        let continueChecking = true;

                        while (continueChecking) {
                            const adjX = doorPos.x + (dir.dx * distance);
                            const adjY = doorPos.y + (dir.dy * distance);

                            // Check bounds
                            if (adjX < 0 || adjX >= state.width || adjY < 0 || adjY >= state.height) {
                                continueChecking = false;
                                break;
                            }

                            const tile = state.grid[adjY][adjX];

                            // If it's a corridor or void, convert to wall and continue checking
                            if (tile === 'corridor' || tile === 'void' || tile === undefined) {
                                state.grid[adjY][adjX] = 'wall';
                                distance++;
                            } else {
                                // Hit a non-corridor tile (wall, floor, etc), stop checking
                                continueChecking = false;
                            }
                        }
                    }

                    // Also add walls in all cardinal directions if they're void
                    const allCardinalDirs = [
                        { dx: 0, dy: -1 },  // North
                        { dx: 0, dy: 1 },   // South
                        { dx: -1, dy: 0 },  // West
                        { dx: 1, dy: 0 }    // East
                    ];

                    for (const dir of allCardinalDirs) {
                        const adjX = doorPos.x + dir.dx;
                        const adjY = doorPos.y + dir.dy;

                        if (adjX >= 0 && adjX < state.width && adjY >= 0 && adjY < state.height) {
                            if (state.grid[adjY][adjX] === 'void' || state.grid[adjY][adjX] === undefined) {
                                state.grid[adjY][adjX] = 'wall';
                            }
                        }
                    }
                }
            }
        }
    }

    console.log(`Placed ${state.doors.length} doors`);
}

function gridToLayout(state) {
    // Convert grid to ASCII layout array (like MAP_DATA format)
    const layout = [];

    for (let y = 0; y < state.height; y++) {
        let row = '';
        for (let x = 0; x < state.width; x++) {
            const cell = state.grid[y][x];
            if (cell === 'wall') row += '+';
            else if (cell === 'door' || cell === 'floor' || cell === 'corridor') row += '.';
            else row += ' ';  // void
        }
        layout.push(row);
    }

    return layout;
}

// Phase 5: Enemy Spawning (DISABLED FOR TESTING)
function spawnEnemies(state, enableEnemies = false) {
    if (!enableEnemies) {
        console.log('Enemy spawning disabled for testing');
        return;
    }

    // Enemy spawning code would go here
    // Currently disabled as requested by user
}

// Phase 6: Loot Spawning
function selectLoot(roomType, rarity, rng) {
    const pool = roomType.loot[rarity];
    if (!pool || pool.length === 0) return null;
    return rng.choice(pool);
}

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
        if (roomType.guaranteedLoot) {
            for (const item of roomType.guaranteedLoot) {
                if (room.floorTiles.length > room.entities.length) {
                    const pos = state.rng.choice(room.floorTiles);
                    room.entities.push({ id: item, x: pos.x, y: pos.y });
                }
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

// Phase 7: Player Spawn
function determinePlayerSpawn(state) {
    // Player spawns in the seed room (first room placed)
    const seedRoom = state.rooms[0];

    // Pick random floor tile in room
    const spawnTile = state.rng.choice(seedRoom.floorTiles);

    state.playerSpawn = { x: spawnTile.x, y: spawnTile.y };
}

// Phase 7.5: Place Airlock (Return to Ship)
function placeAirlock(state) {
    // Place airlock in seed room (where player spawns)
    const seedRoom = state.rooms[0];
    const bounds = seedRoom.bounds;

    // Find all floor tiles adjacent to walls in the seed room
    const wallAdjacentTiles = [];

    for (const tile of seedRoom.floorTiles) {
        // Check 4 cardinal directions for walls
        const adjacentWalls = [
            { x: tile.x, y: tile.y - 1 },
            { x: tile.x, y: tile.y + 1 },
            { x: tile.x - 1, y: tile.y },
            { x: tile.x + 1, y: tile.y }
        ];

        for (const adj of adjacentWalls) {
            if (adj.x >= 0 && adj.x < state.width && adj.y >= 0 && adj.y < state.height) {
                if (state.grid[adj.y][adj.x] === 'wall') {
                    // This tile is adjacent to a wall
                    wallAdjacentTiles.push(tile);
                    break; // Only need one adjacent wall
                }
            }
        }
    }

    if (wallAdjacentTiles.length > 0) {
        // Pick a tile adjacent to wall, preferably close to player spawn
        // Sort by distance to player spawn
        wallAdjacentTiles.sort((a, b) => {
            const distA = Math.abs(a.x - state.playerSpawn.x) + Math.abs(a.y - state.playerSpawn.y);
            const distB = Math.abs(b.x - state.playerSpawn.x) + Math.abs(b.y - state.playerSpawn.y);
            return distA - distB;
        });

        // Pick one of the closest tiles (within top 5 to add some randomness)
        const topCandidates = wallAdjacentTiles.slice(0, Math.min(5, wallAdjacentTiles.length));
        const airlockTile = state.rng.choice(topCandidates);

        // Make sure it's not on the player spawn
        if (airlockTile.x !== state.playerSpawn.x || airlockTile.y !== state.playerSpawn.y) {
            state.airlockPos = { x: airlockTile.x, y: airlockTile.y };
            console.log(`Placed airlock at (${airlockTile.x}, ${airlockTile.y})`);
        } else {
            // If by chance we picked player spawn, try the next one
            const alternative = topCandidates.find(t => t.x !== state.playerSpawn.x || t.y !== state.playerSpawn.y);
            if (alternative) {
                state.airlockPos = { x: alternative.x, y: alternative.y };
                console.log(`Placed airlock at (${alternative.x}, ${alternative.y})`);
            }
        }
    }
}

// Phase 8: Finalization
function finalizeMap(state) {
    // Combine all entities from all rooms
    const allInteractables = [];
    const allCreatures = [];

    // Add loot items from rooms
    for (const room of state.rooms) {
        for (const entity of room.entities) {
            // All entities are interactables for now (loot items)
            // Creatures would be added here if enemy spawning was enabled
            allInteractables.push(entity);
        }
    }

    // Add doors
    for (const door of state.doors) {
        allInteractables.push({ id: 'DOOR_CLOSED', x: door.x, y: door.y });
    }

    // Add airlock (return to ship)
    if (state.airlockPos) {
        allInteractables.push({ id: 'Airlock_Return', x: state.airlockPos.x, y: state.airlockPos.y });
    }

    // Build final map object
    return {
        id: `generated_${state.locationId}_${state.seed}`,
        name: state.location.name,
        sourceLocationId: state.locationId,
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

// --- MAIN GENERATION FUNCTION ---

function generateExpeditionMap(locationId, seed = Date.now(), enableEnemies = false) {
    console.log(`Generating expedition map: ${locationId} (seed: ${seed})`);

    // Phase 1: Init
    const state = initializeGeneration(locationId, seed);
    if (!state) return null;

    // Phase 2: Place rooms
    placeRooms(state);
    console.log(`Placed ${state.rooms.length} rooms`);

    // Phase 3: Connect with corridors (done during placement)

    // Phase 4: Build walls
    buildWalls(state);

    // Phase 4.5: Place doors
    placeDoors(state);

    // Phase 5: Spawn enemies (disabled for testing)
    spawnEnemies(state, enableEnemies);

    // Phase 6: Spawn loot
    spawnLoot(state);

    // Phase 7: Determine player spawn
    determinePlayerSpawn(state);

    // Phase 7.5: Place airlock
    placeAirlock(state);

    // Phase 8: Finalize
    const finalMap = finalizeMap(state);

    console.log(`Map generation complete: ${finalMap.width}x${finalMap.height}`);
    console.log(`Player spawn: (${finalMap.playerSpawn.x}, ${finalMap.playerSpawn.y})`);
    console.log(`Total interactables: ${finalMap.interactables.length}`);

    return finalMap;
}
