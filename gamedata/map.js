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
        // Bed at position (1,6) for sleeping
        // Airlock at (8,8) for starting expeditions
        interactables: [
            { id: 'DOOR_CLOSED', x: 5, y: 3 },
            { id: 'DOOR_CLOSED', x: 3, y: 5 },
            { id: 'DOOR_CLOSED', x: 3, y: 8 },
            { id: 'BED', x: 1, y: 6 },
            { id: 'HYDROPONICS_BAY', x: 1, y: 8 },
            { id: 'Airlock', x: 8, y: 8 }
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
