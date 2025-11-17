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
            "+...............D......................+",
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
            { id: 'RICE_PATTY', x: 12, y: 5 }
        ],
        creatures: [
            // { id: 'PLAYER', x: 20, y: 7 } // Player start position is handled separately for now
        ],
        playerSpawn: { x: 20, y: 10 }
    }
};
