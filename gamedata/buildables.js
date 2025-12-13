// Buildable Interactables
// Defines ship interactables that can be constructed via the Bridge Console

const BUILDABLE_INTERACTABLES = [
    {
        id: 'HYDROPONICS_BAY',
        name: 'Hydroponics Bay',
        description: 'Grows food from seeds over time. Requires water.',

        // Visual properties (matches INTERACTABLE_DATA)
        char: 'H',
        colour: '#0f0',

        // Build requirements
        buildCost: [
            { materialId: 'POLYMER_RESIN', quantity: 3 },
            { materialId: 'BASIC_ELECTRONICS', quantity: 2 },
            { materialId: 'ORGANIC_PROTEIN', quantity: 1 }
        ],

        // Placement validation
        requiresFloorTile: true,  // Must be placed on '.' floor tiles
        blocksMovement: true,      // Will be solid when placed

        // Interactable definition (used when spawning)
        interactableId: 'HYDROPONICS_BAY',  // References INTERACTABLE_DATA
        producerType: 'HYDROPONICS'          // Has ProducerComponent
    },
    {
        id: 'RECYCLER',
        name: 'Recycler',
        description: 'Breaks down loose modules into raw materials.',

        // Visual properties (matches INTERACTABLE_DATA)
        char: 'R',
        colour: '#708090',

        // Build requirements
        buildCost: [
            { materialId: 'POLYMER_RESIN', quantity: 3 },
            { materialId: 'BASIC_ELECTRONICS', quantity: 2 },
            { materialId: 'INTACT_LOGIC_BOARD', quantity: 1 }
        ],

        // Placement validation
        requiresFloorTile: true,  // Must be placed on '.' floor tiles
        blocksMovement: true,      // Will be solid when placed

        // Interactable definition (used when spawning)
        interactableId: 'RECYCLER'  // References INTERACTABLE_DATA
    },
    {
        id: 'DOOR_CLOSED',
        name: 'Door',
        description: 'A door that can be opened and closed. Must be placed on a wall with floor on at least 2 sides.',

        // Visual properties (matches INTERACTABLE_DATA)
        char: 'D',
        colour: '#a9f',

        // Build requirements
        buildCost: [
            { materialId: 'POLYMER_RESIN', quantity: 5 },
            { materialId: 'BASIC_ELECTRONICS', quantity: 1 },
            { materialId: 'TITANIUM_ALLOY', quantity: 1 }
        ],

        // Placement validation
        requiresWallTile: true,    // Must be placed on '+' wall tiles
        requiresFloorAdjacent: 2,  // Must have at least 2 adjacent floor tiles
        blocksMovement: true,       // Will be solid when placed

        // Interactable definition (used when spawning)
        interactableId: 'DOOR_CLOSED'  // References INTERACTABLE_DATA
    },
    {
        id: 'WATER_TANK',
        name: 'Water Tank',
        description: 'Refills water supply from ship reserves.',

        // Visual properties (matches INTERACTABLE_DATA)
        char: 'W',
        colour: '#4682b4',

        // Build requirements
        buildCost: [
            { materialId: 'POLYMER_RESIN', quantity: 5 },
            { materialId: 'ARAMID_FIBRES', quantity: 5 }
        ],

        // Placement validation
        requiresFloorTile: true,  // Must be placed on '.' floor tiles
        blocksMovement: true,      // Will be solid when placed

        // Interactable definition (used when spawning)
        interactableId: 'WATER_TANK'  // References INTERACTABLE_DATA
    },
    {
        id: 'WORKBENCH',
        name: 'Workbench',
        description: 'Modify weapons and armor with attachments.',

        // Visual properties (matches INTERACTABLE_DATA)
        char: 'W',
        colour: '#963',

        // Build requirements
        buildCost: [
            { materialId: 'SALVAGED_COMPONENTS', quantity: 3 },
            { materialId: 'BASIC_ELECTRONICS', quantity: 2 },
            { materialId: 'POLYMER_RESIN', quantity: 3 }
        ],

        // Placement validation
        requiresFloorTile: true,  // Must be placed on '.' floor tiles
        blocksMovement: true,      // Will be solid when placed

        // Interactable definition (used when spawning)
        interactableId: 'WORKBENCH'  // References INTERACTABLE_DATA
    },
    {
        id: 'SHIP_CARGO',
        name: 'Ship Cargo Hold',
        description: 'Additional cargo storage for the ship.',

        // Visual properties (matches INTERACTABLE_DATA)
        char: 'C',
        colour: '#a0a0a0',

        // Build requirements
        buildCost: [
            { materialId: 'TITANIUM_ALLOY', quantity: 1 },
            { materialId: 'POLYMER_RESIN', quantity: 4 }
        ],

        // Placement validation
        requiresFloorTile: true,  // Must be placed on '.' floor tiles
        blocksMovement: true,      // Will be solid when placed

        // Interactable definition (used when spawning)
        interactableId: 'SHIP_CARGO'  // References INTERACTABLE_DATA
    },
    {
        id: 'STOVE',
        name: 'Stove',
        description: 'A cooking station for preparing meals from ingredients.',

        // Visual properties (matches INTERACTABLE_DATA)
        char: 'S',
        colour: '#ff6600',

        // Build requirements
        buildCost: [
            { materialId: 'SALVAGED_COMPONENTS', quantity: 5 },
            { materialId: 'BASIC_ELECTRONICS', quantity: 3 },
            { materialId: 'POLYMER_RESIN', quantity: 3 }
        ],

        // Placement validation
        requiresFloorTile: true,  // Must be placed on '.' floor tiles
        blocksMovement: true,      // Will be solid when placed

        // Interactable definition (used when spawning)
        interactableId: 'STOVE'  // References INTERACTABLE_DATA
    },
    {
        id: 'SHOWER',
        name: 'Shower',
        description: 'Hygiene station that restores comfort and reduces stress.',

        // Visual properties
        char: 'S',
        colour: '#4dd0e1',

        // Build requirements
        buildCost: [
            { materialId: 'POLYMER_RESIN', quantity: 4 },
            { materialId: 'BASIC_ELECTRONICS', quantity: 2 },
            { materialId: 'ARAMID_FIBRES', quantity: 2 }
        ],

        // Placement validation
        requiresFloorTile: true,
        blocksMovement: true,

        interactableId: 'SHOWER'
    },
    {
        id: 'WATER_RECYCLER',
        name: 'Water Recycler',
        description: 'Reduces water consumption by 50% ship-wide.',

        // Visual properties
        char: 'W',
        colour: '#00bcd4',

        // Build requirements
        buildCost: [
            { materialId: 'INTACT_LOGIC_BOARD', quantity: 2 },
            { materialId: 'BASIC_ELECTRONICS', quantity: 4 },
            { materialId: 'POLYMER_RESIN', quantity: 5 }
        ],

        // Placement validation
        requiresFloorTile: true,
        blocksMovement: true,

        interactableId: 'WATER_RECYCLER'
    },
    {
        id: 'AUTO_DOC',
        name: 'Auto-Doc',
        description: 'Advanced medical station for automated healing.',

        // Visual properties
        char: 'M',
        colour: '#00ffff',

        // Build requirements - EXPENSIVE!
        buildCost: [
            { materialId: 'INTACT_LOGIC_BOARD', quantity: 3 },
            { materialId: 'BASIC_ELECTRONICS', quantity: 6 },
            { materialId: 'CHEMICAL_COMPOUNDS', quantity: 4 },
            { materialId: 'ORGANIC_PROTEIN', quantity: 3 }
        ],

        // Placement validation
        requiresFloorTile: true,
        blocksMovement: true,

        interactableId: 'AUTO_DOC'
    },
    {
        id: 'REFINERY',
        name: 'Refinery',
        description: 'Converts organic materials into fuel.',

        // Visual properties
        char: 'R',
        colour: '#ff9800',

        // Build requirements
        buildCost: [
            { materialId: 'TITANIUM_ALLOY', quantity: 2 },
            { materialId: 'INTACT_LOGIC_BOARD', quantity: 2 },
            { materialId: 'BASIC_ELECTRONICS', quantity: 4 },
            { materialId: 'POLYMER_RESIN', quantity: 5 }
        ],

        // Placement validation
        requiresFloorTile: true,
        blocksMovement: true,

        interactableId: 'REFINERY'
    }
];
