// This file defines the layout and entity placement for game maps.

const MAP_DATA = {
    'SHIP': {
        name: 'Escape Ship',
        temperature: 21,
        darkMap: false,  // Ship is always lit
        layout: [
            "...++++++...............................",
            "...+....+...............................",
            "...+....+...............................",
            "...++.+++...............................",
            "++++...+................................",
            "+......+................................",
            "+..+...+................................",
            "++++...+++..............................",
            "+.H......+..............................",
            "+..+++++++..............................",
            "++++....................................",
            "........................................",
            "........................................",
            "........................................",
            "........................................"
        ],
        // Doors at positions (4,3), (3,5), (3,8)
        // Bridge Console at (5,1) for ship management
        // Bed at position (1,6) for sleeping
        // Cargo Hold at (1,7) for ship storage
        // Hydroponics Bay at (1,8), Water Tank at (1,9)
        // Airlock at (8,8) for starting expeditions
        interactables: [
            { id: 'DOOR_CLOSED', x: 5, y: 3 },
            { id: 'DOOR_CLOSED', x: 3, y: 5 },
            { id: 'DOOR_CLOSED', x: 3, y: 8 },
            { id: 'BRIDGE_CONSOLE', x: 5, y: 1 },
            { id: 'BED', x: 1, y: 6 },
            { id: 'SHIP_CARGO', x: 1, y: 7 },
            { id: 'HYDROPONICS_BAY', x: 1, y: 8 },
            { id: 'WATER_TANK', x: 1, y: 9 },
            { id: 'WATER_CANISTER', x: 2, y: 9 },
            { id: 'Airlock', x: 8, y: 8 },
            // New interactables for testing
            { id: 'SHOWER', x: 4, y: 6 },
            { id: 'WATER_RECYCLER', x: 7, y: 1 },
            { id: 'LIFE_SUPPORT', x: 6, y: 1 },
            { id: 'AUTO_DOC', x: 4, y: 7 },
            { id: 'REFINERY', x: 2, y: 6 },
            { id: 'WORKBENCH', x: 5, y: 8 },
            { id: 'STOVE', x: 4, y: 9 },
            { id: 'RECYCLER', x: 5, y: 9 },
            // Test materials on ground
            { id: 'POLYMER_RESIN', x: 6, y: 6 },
            { id: 'BASIC_ELECTRONICS', x: 6, y: 7 },
            { id: 'ORGANIC_PROTEIN', x: 6, y: 8 },
            { id: 'CHEMICAL_COMPOUNDS', x: 6, y: 9 },
            { id: 'INTACT_LOGIC_BOARD', x: 7, y: 6 },
            { id: 'TITANIUM_ALLOY', x: 7, y: 7 },
            { id: 'ARAMID_FIBRES', x: 7, y: 8 },
            { id: 'FOCUSING_LENSES', x: 7, y: 9 }
        ],
        creatures: [],
        playerSpawn: { x: 1, y: 5 }
    },
    'CRYOBAY_7': {
        name: 'Cryo-bay 7',
        temperature: 21,
        darkMap: true,  // Expedition map starts in darkness
        layout: [
            "++++++++++++++++++++++++++++++++++++++++",
            "+......................................+",
            "+......................................+",
            "+......................................+",
            "+......................................+",
            "+.........X............................+",
            "+...............+......................+",
            "+...............D.........W............+",
            "+...............+......................+",
            "+......................................+",
            "+......................................+",
            "+......................................+",
            "+......................................+",
            "+......................................+",
            "++++++++++++++++++++++++++++++++++++++++"
        ],
        // Note: The characters in the layout string above (X, D) are placeholders for positioning.
        // The actual entities are defined here and will be created at these coordinates.
        interactables: [
            { id: 'TEST_BOX', x: 10, y: 5 },
            { id: 'DOOR_CLOSED', x: 15, y: 7 },
            // Equipment (with required parts pre-attached) - near player spawn
            { id: 'RUSTY_PISTOL', x: 18, y: 8 },
            { id: 'SCRAP_ARMOUR', x: 22, y: 8 },
            // Consumables
            { id: 'RICE_PATTY', x: 19, y: 9 },
            // Optional parts for modification
            { id: 'RANGE_FINDER', x: 17, y: 9 },
            { id: 'GRIP_WARMER', x: 23, y: 9 },
            { id: 'HEATING_ELEMENT', x: 18, y: 10 },
            { id: 'COOLING_SYSTEM', x: 22, y: 10 },
            // Workbench for modifications
            { id: 'WORKBENCH', x: 20, y: 12 },
            { id: 'TOOL_TORCH', x: 21, y: 10}
        ],
        creatures: [
            // { id: 'PLAYER', x: 20, y: 7 } // Player start position is handled separately for now
        ],
        playerSpawn: { x: 20, y: 10 }
    }
};
