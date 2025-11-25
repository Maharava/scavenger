// Procedurally generated location definitions
// Based on the design specifications in docs/loc_room_ideas.md

const LOCATION_DATA = {
    'ASTEROID_HABITAT': {
        id: 'ASTEROID_HABITAT',
        name: 'Asteroid Civilian Habitat',
        difficulty: 'EASY',
        mapSize: { min: [70, 70], max: [90, 90] },
        theme: 'Abandoned rotating settlement where families once lived. Now overgrown and silent.',

        // Faction availability
        hasNature: true,  // Hydroponics present - aliens can spawn anywhere
        hasRobots: false,  // Civilian installation - no robots

        // Biome distribution (percentages)
        biomeDistribution: {
            RESIDENTIAL: 0.40,
            NATURE: 0.20,
            UTILITY: 0.15,
            TRANSIT: 0.10,
            ATMOSPHERIC: 0.15
        },

        darkMap: true,
        temperature: 21,

        // Room generation parameters
        roomCount: { min: 10, max: 14 },

        // Procgen behavior
        layoutDensity: 'tight',  // Residential blocks clustered together
        corridorWidth: { min: 1, max: 4 },
        deadEndChance: 0.10,  // 10% of rooms can be dead ends

        // Loot and atmosphere
        lootDensity: 'medium',
        atmosphericRoomChance: 0.20,  // 20% rooms have minimal/no loot

        // Room pool with spawn weights
        roomPools: [
            // Living Quarters - most common
            {
                id: 'LIVING_QUARTERS',
                name: 'Living Quarters',
                difficulty: 'EASY',
                spawnWeight: 35,
                size: {
                    min: [8, 10],
                    max: [12, 15],
                    shape: 'rectangular'
                },
                biomes: ['RESIDENTIAL'],
                enemyCount: [0, 1, 2],  // Equal probability
                enemyTypes: {
                    robots: [],
                    aliens: ['SPORE_WALKER', 'MUTANT_RAT', 'BLOATED_CORPSE'],
                    humanoids: ['SCAVENGER'],
                    aberrants: ['ABERRANT']
                },
                enemySpawnChance: {
                    robots: 0,
                    aliens: 0.20,
                    humanoids: 0.30,
                    aberrants: 0.02
                },
                loot: {
                    common: ['POLYMER_RESIN', 'ARAMID_FIBRES'],
                    uncommon: ['BASIC_ELECTRONICS'],
                    rare: []
                },
                description: 'Personal belongings scattered, makeshift beds, family photos'
            },

            // Hydroponic Garden
            {
                id: 'HYDROPONIC_GARDEN',
                name: 'Hydroponic Garden',
                difficulty: 'EASY',
                spawnWeight: 25,
                size: {
                    min: [10, 12],
                    max: [15, 20],
                    shape: 'irregular'
                },
                biomes: ['NATURE', 'UTILITY'],
                enemyCount: [0, 1, 2, 3],
                enemyTypes: {
                    robots: [],
                    aliens: ['SPORE_WALKER', 'MUTANT_RAT'],
                    humanoids: ['SCAVENGER'],
                    aberrants: ['ABERRANT']
                },
                enemySpawnChance: {
                    robots: 0,
                    aliens: 0.40,
                    humanoids: 0.20,
                    aberrants: 0.03
                },
                loot: {
                    common: ['RAW_BIOMASS', 'ORGANIC_PROTEIN'],
                    uncommon: ['CHEMICAL_COMPOUNDS'],
                    rare: ['BIO_WOVEN_CHITIN']
                },
                description: 'Wild plant growth, water recyclers, grow lights flickering'
            },

            // Community Center
            {
                id: 'COMMUNITY_CENTER',
                name: 'Community Center',
                difficulty: 'EASY',
                spawnWeight: 12,
                size: {
                    min: [12, 15],
                    max: [18, 20],
                    shape: 'rectangular'
                },
                biomes: ['RESIDENTIAL', 'ATMOSPHERIC'],
                enemyCount: [0, 1],  // Mostly empty
                enemyTypes: {
                    robots: [],
                    aliens: ['MUTANT_RAT'],
                    humanoids: ['SCAVENGER'],
                    aberrants: ['ABERRANT']
                },
                enemySpawnChance: {
                    robots: 0,
                    aliens: 0.15,
                    humanoids: 0.20,
                    aberrants: 0.02
                },
                loot: {
                    common: ['BASIC_ELECTRONICS', 'POLYMER_RESIN'],
                    uncommon: [],
                    rare: []
                },
                description: 'Empty stages, scattered toys, bulletin boards with faded notices'
            },

            // Mess Hall
            {
                id: 'MESS_HALL',
                name: 'Mess Hall',
                difficulty: 'EASY',
                spawnWeight: 15,
                size: {
                    min: [10, 15],
                    max: [15, 18],
                    shape: 'rectangular'
                },
                biomes: ['RESIDENTIAL'],
                enemyCount: [0, 1, 2, 3],
                enemyTypes: {
                    robots: [],
                    aliens: ['MUTANT_RAT', 'BLOATED_CORPSE'],
                    humanoids: ['SCAVENGER', 'PIRATE'],
                    aberrants: ['ABERRANT']
                },
                enemySpawnChance: {
                    robots: 0,
                    aliens: 0.25,
                    humanoids: 0.35,
                    aberrants: 0.03
                },
                loot: {
                    common: ['ORGANIC_PROTEIN', 'SALVAGED_COMPONENTS'],
                    uncommon: ['CHEMICAL_COMPOUNDS'],
                    rare: []
                },
                description: 'Overturned tables, food storage, kitchen equipment'
            },

            // Maintenance Closet
            {
                id: 'MAINTENANCE_CLOSET',
                name: 'Maintenance Closet',
                difficulty: 'MEDIUM',
                spawnWeight: 8,
                size: {
                    min: [6, 8],
                    max: [10, 12],
                    shape: 'rectangular'
                },
                biomes: ['UTILITY'],
                enemyCount: [0, 1, 2],
                enemyTypes: {
                    robots: [],
                    aliens: ['MUTANT_RAT'],
                    humanoids: ['SCAVENGER'],
                    aberrants: ['ABERRANT']
                },
                enemySpawnChance: {
                    robots: 0,
                    aliens: 0.15,
                    humanoids: 0.25,
                    aberrants: 0.03
                },
                loot: {
                    common: ['SALVAGED_COMPONENTS', 'BASIC_ELECTRONICS'],
                    uncommon: ['REPAIR_PASTE'],
                    rare: []
                },
                guaranteedLoot: ['REPAIR_PASTE'],  // Always has at least one
                description: 'Tool racks, spare parts, electrical panels'
            },

            // Sanitation Block
            {
                id: 'SANITATION_BLOCK',
                name: 'Sanitation Block',
                difficulty: 'EASY',
                spawnWeight: 3,
                size: {
                    min: [6, 10],
                    max: [10, 12],
                    shape: 'rectangular'
                },
                biomes: ['UTILITY', 'ATMOSPHERIC'],
                enemyCount: [0, 1],  // Usually empty
                enemyTypes: {
                    robots: [],
                    aliens: ['MUTANT_RAT'],
                    humanoids: ['SCAVENGER'],
                    aberrants: ['ABERRANT']
                },
                enemySpawnChance: {
                    robots: 0,
                    aliens: 0.10,
                    humanoids: 0.10,
                    aberrants: 0.01
                },
                loot: {
                    common: ['POLYMER_RESIN', 'CHEMICAL_COMPOUNDS'],
                    uncommon: [],
                    rare: []
                },
                description: 'Water damage, functional recyclers, laundry machines'
            },

            // Shuttle Dock
            {
                id: 'SHUTTLE_DOCK',
                name: 'Shuttle Dock',
                difficulty: 'MEDIUM',
                spawnWeight: 2,
                size: {
                    min: [15, 20],
                    max: [20, 25],
                    shape: 'rectangular'
                },
                biomes: ['TRANSIT'],
                enemyCount: [0, 1, 2, 3, 4],
                enemyTypes: {
                    robots: [],
                    aliens: ['SPORE_WALKER', 'MUTANT_RAT'],
                    humanoids: ['SCAVENGER', 'PIRATE'],
                    aberrants: ['ABERRANT']
                },
                enemySpawnChance: {
                    robots: 0,
                    aliens: 0.20,
                    humanoids: 0.50,
                    aberrants: 0.03
                },
                loot: {
                    common: ['SALVAGED_COMPONENTS', 'BASIC_ELECTRONICS'],
                    uncommon: ['REPAIR_PASTE'],
                    rare: ['TITANIUM_ALLOY']
                },
                description: 'Empty airlocks, cargo crates, fuel lines, docking clamps'
            }
        ]
    },

    'LISTENING_POST': {
        id: 'LISTENING_POST',
        name: 'Deep Space Listening Post',
        difficulty: 'MEDIUM',
        mapSize: { min: [50, 60], max: [65, 65] },
        theme: 'Remote intelligence station for signal interception. Automated defenses still active.',

        // Faction availability
        hasNature: false,  // No nature - pure military
        hasRobots: true,   // Automated security active

        // Biome distribution
        biomeDistribution: {
            TECH: 0.35,
            SECURITY: 0.20,
            RESIDENTIAL: 0.20,
            UTILITY: 0.15,
            ATMOSPHERIC: 0.10
        },

        darkMap: true,
        temperature: 18,

        // Room generation parameters
        roomCount: { min: 7, max: 11 },

        // Procgen behavior
        layoutDensity: 'tight',
        corridorWidth: { min: 1, max: 4 },
        deadEndChance: 0.20,

        // Loot and atmosphere
        lootDensity: 'medium',
        atmosphericRoomChance: 0.10,

        // Room pool
        roomPools: [
            {
                id: 'DATA_CENTER',
                name: 'Data Center',
                difficulty: 'MEDIUM',
                spawnWeight: 35,
                size: {
                    min: [8, 15],
                    max: [12, 20],
                    shape: 'rectangular'
                },
                biomes: ['TECH', 'SECURITY'],
                enemyCount: [0, 1, 2, 3],
                enemyTypes: {
                    robots: ['SCOUT_DRONE', 'SECURITY_BOT'],
                    aliens: [],
                    humanoids: ['SCAVENGER'],
                    aberrants: ['ABERRANT']
                },
                enemySpawnChance: {
                    robots: 0.50,
                    aliens: 0,
                    humanoids: 0.15,
                    aberrants: 0.03
                },
                loot: {
                    common: ['BASIC_ELECTRONICS'],
                    uncommon: ['HIGH_CAPACITY_BATTERY'],
                    rare: ['INTACT_LOGIC_BOARD']
                },
                guaranteedLoot: ['INTACT_LOGIC_BOARD'],
                description: 'Humming servers, blinking lights, cooling fans, cable bundles'
            },

            {
                id: 'INTELLIGENCE_OPS',
                name: 'Intelligence Operations',
                difficulty: 'HARD',
                spawnWeight: 20,
                size: {
                    min: [10, 12],
                    max: [15, 18],
                    shape: 'rectangular'
                },
                biomes: ['TECH', 'SECURITY'],
                enemyCount: [0, 1, 2, 3, 4],
                enemyTypes: {
                    robots: ['SECURITY_BOT', 'SCOUT_DRONE'],
                    aliens: [],
                    humanoids: ['SCAVENGER'],
                    aberrants: ['ABERRANT']
                },
                enemySpawnChance: {
                    robots: 0.65,
                    aliens: 0,
                    humanoids: 0.10,
                    aberrants: 0.05
                },
                loot: {
                    common: ['BASIC_ELECTRONICS'],
                    uncommon: ['HIGH_CAPACITY_BATTERY'],
                    rare: ['INTACT_LOGIC_BOARD', 'FOCUSING_LENSES']
                },
                description: 'Encrypted terminals, star maps, active displays, tactical consoles'
            },

            {
                id: 'CREW_QUARTERS_LP',
                name: 'Crew Quarters',
                difficulty: 'EASY',
                spawnWeight: 15,
                size: {
                    min: [8, 12],
                    max: [12, 15],
                    shape: 'rectangular'
                },
                biomes: ['RESIDENTIAL'],
                enemyCount: [0, 1, 2],
                enemyTypes: {
                    robots: ['SCOUT_DRONE'],
                    aliens: [],
                    humanoids: ['SCAVENGER', 'PIRATE'],
                    aberrants: ['ABERRANT']
                },
                enemySpawnChance: {
                    robots: 0.10,
                    aliens: 0,
                    humanoids: 0.30,
                    aberrants: 0.02
                },
                loot: {
                    common: ['ARAMID_FIBRES', 'POLYMER_RESIN'],
                    uncommon: ['BASIC_ELECTRONICS'],
                    rare: []
                },
                description: 'Military bunks, personal effects, security lockers, duty rosters'
            },

            {
                id: 'LIFE_SUPPORT_BAY',
                name: 'Life Support Bay',
                difficulty: 'MEDIUM',
                spawnWeight: 5,
                size: {
                    min: [10, 15],
                    max: [14, 18],
                    shape: 'rectangular'
                },
                biomes: ['UTILITY'],
                enemyCount: [0, 1, 2],
                enemyTypes: {
                    robots: ['SCOUT_DRONE'],
                    aliens: [],
                    humanoids: ['SCAVENGER'],
                    aberrants: ['ABERRANT']
                },
                enemySpawnChance: {
                    robots: 0.35,
                    aliens: 0,
                    humanoids: 0.20,
                    aberrants: 0.03
                },
                loot: {
                    common: ['BASIC_ELECTRONICS', 'SALVAGED_COMPONENTS'],
                    uncommon: ['REPAIR_PASTE', 'CHEMICAL_COMPOUNDS'],
                    rare: []
                },
                description: 'Pipes, gauges, recycling tanks, oxygen scrubbers, water purifiers'
            }
        ]
    },

    'DYSON_SCAFFOLD': {
        id: 'DYSON_SCAFFOLD',
        name: 'Fractured Dyson Scaffold',
        difficulty: 'HARD',
        mapSize: { min: [80, 100], max: [100, 100] },
        theme: 'Megastructure fragment for stellar engineering. Massive scale. Heavy automated defenses.',

        // Faction availability
        hasNature: false,  // Pure industrial - no aliens
        hasRobots: true,   // Heavy automated defenses

        // Biome distribution
        biomeDistribution: {
            INDUSTRIAL: 0.40,
            TECH: 0.20,
            UTILITY: 0.15,
            SECURITY: 0.15,
            ATMOSPHERIC: 0.10
        },

        darkMap: true,
        temperature: 15,

        // Room generation parameters
        roomCount: { min: 12, max: 16 },

        // Procgen behavior
        layoutDensity: 'moderate',
        corridorWidth: { min: 1, max: 4 },
        deadEndChance: 0.15,

        // Loot and atmosphere
        lootDensity: 'high',
        atmosphericRoomChance: 0.10,

        // Room pool
        roomPools: [
            {
                id: 'ADVANCED_MANUFACTURING',
                name: 'Advanced Manufacturing',
                difficulty: 'HARD',
                spawnWeight: 22,
                size: {
                    min: [15, 20],
                    max: [20, 25],
                    shape: 'rectangular'
                },
                biomes: ['INDUSTRIAL', 'SECURITY'],
                enemyCount: [0, 1, 2, 3, 4, 5],
                enemyTypes: {
                    robots: ['SECURITY_BOT', 'SCOUT_DRONE'],
                    aliens: [],
                    humanoids: ['SCAVENGER'],
                    aberrants: ['ABERRANT']
                },
                enemySpawnChance: {
                    robots: 0.70,
                    aliens: 0,
                    humanoids: 0.05,
                    aberrants: 0.05
                },
                loot: {
                    common: ['POLYMER_RESIN', 'SALVAGED_COMPONENTS'],
                    uncommon: ['TITANIUM_ALLOY'],
                    rare: ['ENERGY_REFLECTIVE_FILM', 'CERAMIC_COMPOSITE_PLATE']
                },
                description: 'Massive machinery, sparking equipment, nano-fabricators, assembly arms'
            },

            {
                id: 'BULK_MATERIALS_SILO',
                name: 'Bulk Materials Silo',
                difficulty: 'HARD',
                spawnWeight: 12,
                size: {
                    min: [20, 25],
                    max: [30, 30],
                    shape: 'irregular'
                },
                biomes: ['INDUSTRIAL'],
                enemyCount: [0, 1, 2, 3, 4],
                enemyTypes: {
                    robots: ['SECURITY_BOT', 'SCOUT_DRONE'],
                    aliens: [],
                    humanoids: ['SCAVENGER'],
                    aberrants: ['ABERRANT']
                },
                enemySpawnChance: {
                    robots: 0.60,
                    aliens: 0,
                    humanoids: 0.15,
                    aberrants: 0.05
                },
                loot: {
                    common: ['SALVAGED_COMPONENTS', 'POLYMER_RESIN'],
                    uncommon: ['TITANIUM_ALLOY', 'CERAMIC_COMPOSITE_PLATE'],
                    rare: ['ENERGY_REFLECTIVE_FILM']
                },
                description: 'Towering containers, loading cranes, material scattered everywhere'
            },

            {
                id: 'FABRICATION_BAY',
                name: 'Fabrication Bay',
                difficulty: 'MEDIUM',
                spawnWeight: 18,
                size: {
                    min: [12, 18],
                    max: [18, 22],
                    shape: 'rectangular'
                },
                biomes: ['INDUSTRIAL', 'TECH'],
                enemyCount: [0, 1, 2, 3],
                enemyTypes: {
                    robots: ['SECURITY_BOT', 'SCOUT_DRONE'],
                    aliens: [],
                    humanoids: ['SCAVENGER'],
                    aberrants: ['ABERRANT']
                },
                enemySpawnChance: {
                    robots: 0.50,
                    aliens: 0,
                    humanoids: 0.12,
                    aberrants: 0.03
                },
                loot: {
                    common: ['POLYMER_RESIN', 'SALVAGED_COMPONENTS'],
                    uncommon: ['TITANIUM_ALLOY'],
                    rare: []
                },
                description: 'Conveyor belts, robotic arms, half-finished products, 3D printers'
            },

            {
                id: 'MAINTENANCE_WORKSHOP',
                name: 'Maintenance Workshop',
                difficulty: 'MEDIUM',
                spawnWeight: 15,
                size: {
                    min: [10, 15],
                    max: [15, 18],
                    shape: 'rectangular'
                },
                biomes: ['INDUSTRIAL', 'UTILITY'],
                enemyCount: [0, 1, 2],
                enemyTypes: {
                    robots: ['SCOUT_DRONE'],
                    aliens: [],
                    humanoids: ['SCAVENGER'],
                    aberrants: ['ABERRANT']
                },
                enemySpawnChance: {
                    robots: 0.40,
                    aliens: 0,
                    humanoids: 0.20,
                    aberrants: 0.03
                },
                loot: {
                    common: ['SALVAGED_COMPONENTS', 'BASIC_ELECTRONICS'],
                    uncommon: ['REPAIR_PASTE', 'TITANIUM_ALLOY'],
                    rare: []
                },
                guaranteedLoot: ['REPAIR_PASTE', 'REPAIR_PASTE'],
                description: 'Workbenches, scattered tools, spare machine parts, repair logs'
            },

            {
                id: 'POWER_RELAY_STATION',
                name: 'Power Relay Station',
                difficulty: 'MEDIUM',
                spawnWeight: 12,
                size: {
                    min: [10, 12],
                    max: [14, 18],
                    shape: 'rectangular'
                },
                biomes: ['UTILITY', 'TECH'],
                enemyCount: [0, 1, 2, 3],
                enemyTypes: {
                    robots: ['SECURITY_BOT', 'SCOUT_DRONE'],
                    aliens: [],
                    humanoids: ['SCAVENGER'],
                    aberrants: ['ABERRANT']
                },
                enemySpawnChance: {
                    robots: 0.50,
                    aliens: 0,
                    humanoids: 0.10,
                    aberrants: 0.03
                },
                loot: {
                    common: ['BASIC_ELECTRONICS'],
                    uncommon: ['THERMAL_GEL', 'HIGH_CAPACITY_BATTERY'],
                    rare: []
                },
                guaranteedLoot: ['HIGH_CAPACITY_BATTERY'],
                description: 'Electrical arcs, humming capacitors, cable bundles, warning lights'
            },

            {
                id: 'STRUCTURAL_SUPPORT',
                name: 'Structural Support',
                difficulty: 'EASY',
                spawnWeight: 10,
                size: {
                    min: [8, 20],
                    max: [12, 30],
                    shape: 'rectangular'
                },
                biomes: ['ATMOSPHERIC'],
                enemyCount: [0, 1],
                enemyTypes: {
                    robots: ['SCOUT_DRONE'],
                    aliens: [],
                    humanoids: ['SCAVENGER'],
                    aberrants: ['ABERRANT']
                },
                enemySpawnChance: {
                    robots: 0.15,
                    aliens: 0,
                    humanoids: 0.15,
                    aberrants: 0.02
                },
                loot: {
                    common: ['SALVAGED_COMPONENTS'],
                    uncommon: ['CERAMIC_COMPOSITE_PLATE'],
                    rare: []
                },
                description: 'Open frameworks, catwalks, exposed superstructure, creaking metal'
            }
        ]
    }
};
