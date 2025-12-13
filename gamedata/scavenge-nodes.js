// Scavenge Node Definitions
// Contextual containers and loot points for expedition maps
// Each node type is appropriate to specific room biomes

const NODE_TYPES = {
    // ========================================================================
    // RESIDENTIAL / LIVING AREAS
    // ========================================================================

    'PERSONAL_LOCKER': {
        id: 'PERSONAL_LOCKER',
        nameVariants: ['Personal Locker', 'Storage Locker', 'Crew Locker'],
        char: '[',
        colour: '#8B7355',
        biomes: ['RESIDENTIAL'],
        spawnWeight: 30,
        lootSlots: { min: 1, max: 3 },
        searchDifficulty: 'easy'
    },

    'FOOTLOCKER': {
        id: 'FOOTLOCKER',
        nameVariants: ['Footlocker', 'Personal Chest', 'Storage Chest'],
        char: '=',
        colour: '#696969',
        biomes: ['RESIDENTIAL'],
        spawnWeight: 25,
        lootSlots: { min: 2, max: 4 },
        searchDifficulty: 'easy'
    },

    'DESK_DRAWER': {
        id: 'DESK_DRAWER',
        nameVariants: ['Desk Drawer', 'Office Desk', 'Workstation'],
        char: 'n',
        colour: '#8B4513',
        biomes: ['RESIDENTIAL', 'TECH'],
        spawnWeight: 20,
        lootSlots: { min: 1, max: 2 },
        searchDifficulty: 'easy'
    },

    // ========================================================================
    // NATURE / HYDROPONICS
    // ========================================================================

    'OVERGROWN_PLANTER': {
        id: 'OVERGROWN_PLANTER',
        nameVariants: ['Overgrown Planter', 'Wild Growth', 'Tangled Vines'],
        char: '&',
        colour: '#228B22',
        biomes: ['NATURE'],
        spawnWeight: 35,
        lootSlots: { min: 1, max: 3 },
        searchDifficulty: 'medium'
    },

    'ORGANIC_MASS': {
        id: 'ORGANIC_MASS',
        nameVariants: ['Organic Mass', 'Fungal Growth', 'Biomatter Cluster'],
        char: '%',
        colour: '#8B7355',
        biomes: ['NATURE'],
        spawnWeight: 25,
        lootSlots: { min: 1, max: 2 },
        searchDifficulty: 'medium'
    },

    'SUPPLY_CRATE': {
        id: 'SUPPLY_CRATE',
        nameVariants: ['Supply Crate', 'Storage Crate', 'Equipment Crate'],
        char: '□',
        colour: '#A0522D',
        biomes: ['NATURE', 'UTILITY', 'INDUSTRIAL'],
        spawnWeight: 30,
        lootSlots: { min: 2, max: 5 },
        searchDifficulty: 'easy'
    },

    // ========================================================================
    // TECH / DATA AREAS
    // ========================================================================

    'SERVER_RACK': {
        id: 'SERVER_RACK',
        nameVariants: ['Server Rack', 'Data Terminal', 'Console Station'],
        char: '║',
        colour: '#4169E1',
        biomes: ['TECH'],
        spawnWeight: 30,
        lootSlots: { min: 1, max: 3 },
        searchDifficulty: 'medium'
    },

    'ELECTRONICS_CABINET': {
        id: 'ELECTRONICS_CABINET',
        nameVariants: ['Electronics Cabinet', 'Component Locker', 'Parts Cabinet'],
        char: '╪',
        colour: '#708090',
        biomes: ['TECH', 'UTILITY'],
        spawnWeight: 25,
        lootSlots: { min: 2, max: 4 },
        searchDifficulty: 'easy'
    },

    // ========================================================================
    // INDUSTRIAL / MANUFACTURING
    // ========================================================================

    'TOOLBOX': {
        id: 'TOOLBOX',
        nameVariants: ['Toolbox', 'Tool Chest', 'Maintenance Kit'],
        char: '▣',
        colour: '#DC143C',
        biomes: ['INDUSTRIAL', 'UTILITY'],
        spawnWeight: 30,
        lootSlots: { min: 2, max: 4 },
        searchDifficulty: 'easy'
    },

    'MATERIAL_BIN': {
        id: 'MATERIAL_BIN',
        nameVariants: ['Material Bin', 'Component Bin', 'Parts Container'],
        char: '▢',
        colour: '#696969',
        biomes: ['INDUSTRIAL'],
        spawnWeight: 35,
        lootSlots: { min: 3, max: 6 },
        searchDifficulty: 'easy'
    },

    'FABRICATOR_OUTPUT': {
        id: 'FABRICATOR_OUTPUT',
        nameVariants: ['Fabricator Output', 'Manufacturing Bay', '3D Printer Tray'],
        char: '╬',
        colour: '#4682B4',
        biomes: ['INDUSTRIAL'],
        spawnWeight: 20,
        lootSlots: { min: 1, max: 4 },
        searchDifficulty: 'medium'
    },

    // ========================================================================
    // SECURITY
    // ========================================================================

    'WEAPON_LOCKER': {
        id: 'WEAPON_LOCKER',
        nameVariants: ['Weapon Locker', 'Armory Cabinet', 'Security Locker'],
        char: '║',
        colour: '#8B0000',
        biomes: ['SECURITY'],
        spawnWeight: 25,
        lootSlots: { min: 2, max: 4 },
        searchDifficulty: 'medium'
    },

    'AMMO_CRATE': {
        id: 'AMMO_CRATE',
        nameVariants: ['Ammunition Crate', 'Weapons Parts', 'Tactical Cache'],
        char: '▪',
        colour: '#A0522D',
        biomes: ['SECURITY'],
        spawnWeight: 20,
        lootSlots: { min: 2, max: 5 },
        searchDifficulty: 'easy'
    },

    // ========================================================================
    // UTILITY / MAINTENANCE
    // ========================================================================

    'SUPPLY_CABINET': {
        id: 'SUPPLY_CABINET',
        nameVariants: ['Supply Cabinet', 'Maintenance Cabinet', 'Utility Locker'],
        char: '▦',
        colour: '#808080',
        biomes: ['UTILITY'],
        spawnWeight: 30,
        lootSlots: { min: 2, max: 4 },
        searchDifficulty: 'easy'
    },

    'CHEMICAL_CONTAINER': {
        id: 'CHEMICAL_CONTAINER',
        nameVariants: ['Chemical Container', 'Reagent Tank', 'Compound Canister'],
        char: '◘',
        colour: '#FF8C00',
        biomes: ['UTILITY', 'INDUSTRIAL'],
        spawnWeight: 15,
        lootSlots: { min: 1, max: 2 },
        searchDifficulty: 'medium'
    },

    // ========================================================================
    // TRANSIT / DOCKING
    // ========================================================================

    'CARGO_CONTAINER': {
        id: 'CARGO_CONTAINER',
        nameVariants: ['Cargo Container', 'Shipping Crate', 'Transport Box'],
        char: '■',
        colour: '#A0522D',
        biomes: ['TRANSIT', 'INDUSTRIAL'],
        spawnWeight: 30,
        lootSlots: { min: 3, max: 7 },
        searchDifficulty: 'easy'
    },

    'LUGGAGE': {
        id: 'LUGGAGE',
        nameVariants: ['Luggage', 'Travel Case', 'Personal Bag'],
        char: '▤',
        colour: '#8B7355',
        biomes: ['TRANSIT', 'RESIDENTIAL'],
        spawnWeight: 25,
        lootSlots: { min: 1, max: 3 },
        searchDifficulty: 'easy'
    },

    // ========================================================================
    // ATMOSPHERIC (Generic/Debris)
    // ========================================================================

    'DEBRIS_PILE': {
        id: 'DEBRIS_PILE',
        nameVariants: ['Debris Pile', 'Rubble Heap', 'Wreckage'],
        char: '≈',
        colour: '#696969',
        biomes: ['ATMOSPHERIC'],
        spawnWeight: 40,
        lootSlots: { min: 0, max: 2 },
        searchDifficulty: 'hard'
    },

    'SCRAP_HEAP': {
        id: 'SCRAP_HEAP',
        nameVariants: ['Scrap Heap', 'Metal Debris', 'Component Wreckage'],
        char: '≋',
        colour: '#708090',
        biomes: ['ATMOSPHERIC', 'INDUSTRIAL'],
        spawnWeight: 35,
        lootSlots: { min: 1, max: 3 },
        searchDifficulty: 'hard'
    }
};
