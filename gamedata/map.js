// This file defines the layout and entity placement for game maps.

const MAP_DATA = {
    'CRYOBAY_7': {
        name: 'Cryo-bay 7',
        temperature: 21,
        air_quality: 98,
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
            { id: 'SCRAP_ARMOR', x: 22, y: 8 },
            // Consumables
            { id: 'RICE_PATTY', x: 19, y: 9 },
            // Optional parts for modification
            { id: 'RANGE_FINDER', x: 17, y: 9 },
            { id: 'GRIP_WARMER', x: 23, y: 9 },
            { id: 'HEATING_ELEMENT', x: 18, y: 10 },
            { id: 'COOLING_SYSTEM', x: 22, y: 10 },
            // Workbench for modifications
            { id: 'WORKBENCH', x: 20, y: 12 }
        ],
        creatures: [
            // { id: 'PLAYER', x: 20, y: 7 } // Player start position is handled separately for now
        ],
        playerSpawn: { x: 20, y: 10 }
    }
};
