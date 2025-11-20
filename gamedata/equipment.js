// gamedata/equipment.js
const EQUIPMENT_DATA = [
    // === PISTOL PARTS ===
    {
        "id": "SHORT_BARREL",
        "name": "Short Barrel",
        "char": "b",
        "colour": "#888",
        "weight": 100,
        "part_type": "barrel",
        "description": "A short barrel for close quarters.",
        "modifiers": {
            "damageAmount": 0,
            "penetration": 0.9, // Slightly reduced penetration
            "range": 3,
            "accuracy": -5 // Less accurate
        }
    },
    {
        "id": "RUBBER_GRIP",
        "name": "Rubber Grip",
        "char": "g",
        "colour": "#333",
        "weight": 50,
        "part_type": "grip",
        "description": "A comfortable rubber grip with good recoil absorption.",
        "modifiers": {
            "accuracy": 5,
            "comfortPenalty": -1 // Comfortable, only -1 per shot
        }
    },
    {
        "id": "WOODEN_GRIP",
        "name": "Wooden Grip",
        "char": "g",
        "colour": "#964",
        "weight": 50,
        "part_type": "grip",
        "description": "A solid wooden grip, traditional and reliable.",
        "modifiers": {
            "accuracy": 0,
            "comfortPenalty": -2 // Basic comfort penalty
        }
    },
    {
        "id": "STANDARD_CHAMBER",
        "name": "Standard Chamber",
        "char": "c",
        "colour": "#aaa",
        "weight": 150,
        "part_type": "chamber",
        "description": "A standard pistol chamber firing 9mm rounds.",
        "modifiers": {
            "damageType": "kinetic",
            "damageAmount": 15,
            "penetration": 1.0
        }
    },
    {
        "id": "PISTOL_LASER_SIGHT",
        "name": "Pistol Laser Sight",
        "char": "l",
        "colour": "#f00",
        "weight": 100,
        "part_type": "mod_pistol",
        "description": "A compact laser sight for pistols, improves accuracy.",
        "modifiers": {
            "accuracy": 12
        }
    },
    {
        "id": "PISTOL_SUPPRESSOR",
        "name": "Pistol Suppressor",
        "char": "s",
        "colour": "#555",
        "weight": 100,
        "part_type": "mod_pistol",
        "description": "Reduces noise and slightly improves accuracy.",
        "modifiers": {
            "accuracy": 5,
            "damageAmount": -1,
            "comfortPenalty": 1 // Less jarring to fire
        }
    },

    // === PISTOL CONTAINER ===
    {
        "id": "RUSTY_PISTOL",
        "name": "Rusty Pistol",
        "char": "p",
        "colour": "#c84",
        "weight": 400,
        "equipment_slot": "hand",
        "gun_type": "pistol",
        "description": "A rusty old pistol. Needs parts to function.",
        "attachment_slots": {
            "barrel": { "accepted_type": "barrel", "entity_id": null, "required": true },
            "grip": { "accepted_type": "grip", "entity_id": null, "required": true },
            "chamber": { "accepted_type": "chamber", "entity_id": null, "required": true },
            "mod1": { "accepted_type": "mod_pistol", "entity_id": null, "required": false },
            "mod2": { "accepted_type": "mod_pistol", "entity_id": null, "required": false }
        }
    },

    // === RIFLE PARTS ===
    {
        "id": "RIFLE_SCOPE",
        "name": "Rifle Scope",
        "char": "o",
        "colour": "#0af",
        "weight": 200,
        "part_type": "mod_rifle",
        "description": "A precision scope for long-range shooting.",
        "modifiers": {
            "accuracy": 20,
            "range": 5
        }
    },
    {
        "id": "RIFLE_BIPOD",
        "name": "Rifle Bipod",
        "char": "t",
        "colour": "#888",
        "weight": 200,
        "part_type": "mod_rifle",
        "description": "A bipod for stability when firing from prone position.",
        "modifiers": {
            "accuracy": 10,
            "comfortPenalty": 2 // Makes firing more comfortable
        }
    },
    {
        "id": "RIFLE_SUPPRESSOR",
        "name": "Rifle Suppressor",
        "char": "s",
        "colour": "#444",
        "weight": 200,
        "part_type": "mod_rifle",
        "description": "A large suppressor for rifles, reduces noise significantly.",
        "modifiers": {
            "accuracy": 3,
            "damageAmount": -2,
            "comfortPenalty": 3 // Much less jarring
        }
    },

    // === RIFLE CONTAINER ===
    {
        "id": "WORN_RIFLE",
        "name": "Worn Rifle",
        "char": "R",
        "colour": "#964",
        "weight": 800,
        "equipment_slot": "hand",
        "gun_type": "rifle",
        "description": "A worn rifle. Needs parts to function. More powerful than a pistol.",
        "attachment_slots": {
            "barrel": { "accepted_type": "barrel", "entity_id": null, "required": true },
            "grip": { "accepted_type": "grip", "entity_id": null, "required": true },
            "chamber": { "accepted_type": "chamber", "entity_id": null, "required": true },
            "mod1": { "accepted_type": "mod_rifle", "entity_id": null, "required": false },
            "mod2": { "accepted_type": "mod_rifle", "entity_id": null, "required": false }
        }
    },

    // === armour PARTS ===
    {
        "id": "CLOTH_UNDERLAY",
        "name": "Cloth Underlay",
        "char": "u",
        "colour": "#ddd",
        "weight": 150,
        "part_type": "underlay",
        "description": "A soft cloth underlay for armour."
        // No modifiers - just a basic part
    },
    {
        "id": "POLYESTER_UNDERLAY",
        "name": "Polyester Underlay",
        "char": "u",
        "colour": "#eee",
        "weight": 150,
        "part_type": "underlay",
        "description": "A lightweight polyester underlay."
        // No modifiers - generic part
    },
    {
        "id": "METAL_PLATING",
        "name": "Metal Plating",
        "char": "m",
        "colour": "#aaa",
        "weight": 600,
        "part_type": "material",
        "description": "Heavy metal plating for protection.",
        "modifiers": {
            "head": 15 // Test stat modifier
        }
    },
    {
        "id": "REINFORCED_COATING",
        "name": "Reinforced Coating",
        "char": "o",
        "colour": "#666",
        "weight": 250,
        "part_type": "overlay",
        "description": "A protective coating layer.",
        "modifiers": {
            "head": 8 // Test stat modifier
        }
    },
    {
        "id": "HEATING_ELEMENT",
        "name": "Heating Element",
        "char": "h",
        "colour": "#f00",
        "weight": 100,
        "part_type": "mod",
        "description": "Provides warmth in cold environments.",
        "modifiers": {
            "hunger": 5 // Test stat modifier
        }
    },
    {
        "id": "COOLING_SYSTEM",
        "name": "Cooling System",
        "char": "s",
        "colour": "#0af",
        "weight": 150,
        "part_type": "mod_armour",
        "description": "Keeps you cool in hot environments.",
        "modifiers": {
            "hunger": 3 // Test stat modifier
        }
    },

    // === armour CONTAINER ===
    {
        "id": "SCRAP_ARMOUR",
        "name": "Scrap Armour",
        "char": "A",
        "colour": "#963",
        "weight": 600,
        "equipment_slot": "body",
        "armour_type": "body_armour",
        "description": "armour cobbled together from scrap. Needs parts to function.",
        "attachment_slots": {
            "underlay": { "accepted_type": "underlay", "entity_id": null, "required": true },
            "material": { "accepted_type": "material", "entity_id": null, "required": true },
            "overlay": { "accepted_type": "overlay", "entity_id": null, "required": true },
            "mod1": { "accepted_type": "mod_armour", "entity_id": null, "required": false },
            "mod2": { "accepted_type": "mod_armour", "entity_id": null, "required": false }
        }
    },

    // === GENERIC GUN GRIPS ===
    {
        "id": "BASIC_GRIP",
        "name": "Basic Grip",
        "char": "g",
        "colour": "#999",
        "weight": 50,
        "part_type": "grip",
        "description": "A standard grip with no special features.",
        "modifiers": {
            "accuracy": 0,
            "comfortPenalty": -2 // Standard comfort penalty
        }
    },
    {
        "id": "COMPACT_GRIP",
        "name": "Compact Grip",
        "char": "g",
        "colour": "#888",
        "weight": 50,
        "part_type": "grip",
        "description": "A smaller, lighter grip for better portability.",
        "modifiers": {
            "accuracy": -5, // Less stable
            "comfortPenalty": -3 // More uncomfortable due to small size
        }
    },
    {
        "id": "ERGONOMIC_GRIP",
        "name": "Ergonomic Grip",
        "char": "g",
        "colour": "#777",
        "weight": 50,
        "part_type": "grip",
        "description": "A comfortable grip designed for extended use.",
        "modifiers": {
            "accuracy": 3,
            "comfortPenalty": 0 // Very comfortable, no penalty
        }
    },
    {
        "id": "TEXTURED_GRIP",
        "name": "Textured Grip",
        "char": "g",
        "colour": "#666",
        "weight": 50,
        "part_type": "grip",
        "description": "A grip with textured surface for improved handling.",
        "modifiers": {
            "accuracy": 8, // Better control
            "comfortPenalty": -1 // Slightly harsh on hands
        }
    },

    // === GENERIC GUN CHAMBERS ===
    {
        "id": "BASIC_CHAMBER",
        "name": "Basic Chamber",
        "char": "c",
        "colour": "#999",
        "weight": 150,
        "part_type": "chamber",
        "description": "A standard chamber firing basic 9mm rounds.",
        "modifiers": {
            "damageType": "kinetic",
            "damageAmount": 12,
            "penetration": 1.0
        }
    },
    {
        "id": "REINFORCED_CHAMBER",
        "name": "Reinforced Chamber",
        "char": "c",
        "colour": "#888",
        "weight": 150,
        "part_type": "chamber",
        "description": "A reinforced chamber firing high-pressure rounds.",
        "modifiers": {
            "damageType": "kinetic",
            "damageAmount": 18,
            "penetration": 1.2 // Better penetration
        }
    },
    {
        "id": "LIGHTWEIGHT_CHAMBER",
        "name": "Lightweight Chamber",
        "char": "c",
        "colour": "#777",
        "weight": 150,
        "part_type": "chamber",
        "description": "A lighter chamber firing subsonic rounds.",
        "modifiers": {
            "damageType": "kinetic",
            "damageAmount": 10,
            "penetration": 0.8 // Lower penetration
        }
    },
    {
        "id": "PRECISION_CHAMBER",
        "name": "Precision Chamber",
        "char": "c",
        "colour": "#666",
        "weight": 150,
        "part_type": "chamber",
        "description": "A precisely machined chamber for match-grade rounds.",
        "modifiers": {
            "damageType": "kinetic",
            "damageAmount": 14,
            "penetration": 1.1 // Slightly better penetration
        }
    },

    // === GENERIC GUN BARRELS ===
    {
        "id": "BASIC_BARREL",
        "name": "Basic Barrel",
        "char": "b",
        "colour": "#999",
        "weight": 100,
        "part_type": "barrel",
        "description": "A standard barrel with balanced performance.",
        "modifiers": {
            "damageAmount": 0,
            "penetration": 1.0,
            "range": 5,
            "accuracy": 0
        }
    },
    {
        "id": "LONG_BARREL",
        "name": "Long Barrel",
        "char": "b",
        "colour": "#888",
        "weight": 100,
        "part_type": "barrel",
        "description": "An extended barrel for improved range and accuracy.",
        "modifiers": {
            "damageAmount": 2,
            "penetration": 1.1,
            "range": 8,
            "accuracy": 10
        }
    },
    {
        "id": "COMPACT_BARREL",
        "name": "Compact Barrel",
        "char": "b",
        "colour": "#777",
        "weight": 100,
        "part_type": "barrel",
        "description": "A shorter barrel for better maneuverability.",
        "modifiers": {
            "damageAmount": -2,
            "penetration": 0.85,
            "range": 3,
            "accuracy": -8
        }
    },
    {
        "id": "RIFLED_BARREL",
        "name": "Rifled Barrel",
        "char": "b",
        "colour": "#666",
        "weight": 100,
        "part_type": "barrel",
        "description": "A barrel with rifling for improved accuracy.",
        "modifiers": {
            "damageAmount": 1,
            "penetration": 1.05,
            "range": 6,
            "accuracy": 15
        }
    },

    // === GENERIC armour UNDERLAYS ===
    // Underlays focus on temperature regulation
    {
        "id": "BASIC_UNDERLAY",
        "name": "Basic Underlay",
        "char": "u",
        "colour": "#999",
        "weight": 150,
        "part_type": "underlay",
        "description": "A standard underlay with minimal temperature protection.",
        "modifiers": {
            "tempMin": 2,
            "tempMax": 2
        }
    },
    {
        "id": "PADDED_UNDERLAY",
        "name": "Padded Underlay",
        "char": "u",
        "colour": "#888",
        "weight": 150,
        "part_type": "underlay",
        "description": "A padded underlay for warmth in cold environments.",
        "modifiers": {
            "tempMin": 8,
            "tempMax": 3
        }
    },
    {
        "id": "MESH_UNDERLAY",
        "name": "Mesh Underlay",
        "char": "u",
        "colour": "#777",
        "weight": 150,
        "part_type": "underlay",
        "description": "A breathable mesh underlay for hot environments.",
        "modifiers": {
            "tempMin": 1,
            "tempMax": 10
        }
    },
    {
        "id": "THERMAL_UNDERLAY",
        "name": "Thermal Underlay",
        "char": "u",
        "colour": "#666",
        "weight": 150,
        "part_type": "underlay",
        "description": "An insulated underlay for extreme cold protection.",
        "modifiers": {
            "tempMin": 15,
            "tempMax": 5
        }
    },

    // === GENERIC armour MATERIALS ===
    // Materials set durability and provide balanced damage/temp protection
    {
        "id": "BASIC_MATERIAL",
        "name": "Basic Material",
        "char": "m",
        "colour": "#999",
        "weight": 600,
        "part_type": "material",
        "description": "A standard material with basic protection.",
        "modifiers": {
            "maxDurability": 100,
            "kinetic": 10,
            "energy": 5,
            "tempMin": 3,
            "tempMax": 3
        }
    },
    {
        "id": "COMPOSITE_MATERIAL",
        "name": "Composite Material",
        "char": "m",
        "colour": "#888",
        "weight": 600,
        "part_type": "material",
        "description": "A composite material balancing protection and weight.",
        "modifiers": {
            "maxDurability": 150,
            "kinetic": 15,
            "energy": 15,
            "toxin": 5,
            "tempMin": 4,
            "tempMax": 4
        }
    },
    {
        "id": "CERAMIC_MATERIAL",
        "name": "Ceramic Material",
        "char": "m",
        "colour": "#777",
        "weight": 600,
        "part_type": "material",
        "description": "A ceramic material offering solid kinetic protection.",
        "modifiers": {
            "maxDurability": 120,
            "kinetic": 25,
            "energy": 10,
            "tempMin": 2,
            "tempMax": 2
        }
    },
    {
        "id": "POLYMER_MATERIAL",
        "name": "Polymer Material",
        "char": "m",
        "colour": "#666",
        "weight": 600,
        "part_type": "material",
        "description": "A lightweight polymer material with good energy resistance.",
        "modifiers": {
            "maxDurability": 180,
            "kinetic": 8,
            "energy": 20,
            "radiation": 10,
            "tempMin": 5,
            "tempMax": 5
        }
    },

    // === GENERIC armour OVERLAYS ===
    // Overlays focus on damage resistance
    {
        "id": "BASIC_OVERLAY",
        "name": "Basic Overlay",
        "char": "o",
        "colour": "#999",
        "weight": 250,
        "part_type": "overlay",
        "description": "A standard overlay with basic damage protection.",
        "modifiers": {
            "kinetic": 5,
            "energy": 5,
            "tempMin": 1,
            "tempMax": 1
        }
    },
    {
        "id": "REFLECTIVE_OVERLAY",
        "name": "Reflective Overlay",
        "char": "o",
        "colour": "#888",
        "weight": 250,
        "part_type": "overlay",
        "description": "A reflective overlay that deflects energy weapons.",
        "modifiers": {
            "energy": 20,
            "radiation": 15,
            "tempMax": 3
        }
    },
    {
        "id": "ABLATIVE_OVERLAY",
        "name": "Ablative Overlay",
        "char": "o",
        "colour": "#777",
        "weight": 250,
        "part_type": "overlay",
        "description": "An ablative overlay designed to dissipate kinetic damage.",
        "modifiers": {
            "kinetic": 25,
            "tempMin": 2
        }
    },
    {
        "id": "CAMOUFLAGE_OVERLAY",
        "name": "Camouflage Overlay",
        "char": "o",
        "colour": "#666",
        "weight": 250,
        "part_type": "overlay",
        "description": "A lightweight overlay for concealment.",
        "modifiers": {
            "kinetic": 3,
            "toxin": 10,
            "tempMin": 2,
            "tempMax": 2
        }
    },

    // === ENEMY WEAPONS (PRE-ASSEMBLED) ===

    {
        "id": "ASSAULT_RIFLE",
        "name": "Assault Rifle",
        "char": "R",
        "colour": "#444",
        "weight": 800,
        "equipment_slot": "hand",
        "gun_type": "rifle",
        "description": "A military assault rifle. Powerful and accurate.",
        "attachment_slots": {}  // Pre-assembled, no slots
    },

    {
        "id": "LIGHT_LASER",
        "name": "Light Laser",
        "char": "l",
        "colour": "#0ff",
        "weight": 300,
        "equipment_slot": "hand",
        "gun_type": "energy",
        "description": "A lightweight energy weapon used by scout drones.",
        "attachment_slots": {}  // Pre-assembled, no slots
    },

    {
        "id": "PLASMA_RIFLE",
        "name": "Plasma Rifle",
        "char": "P",
        "colour": "#0f0",
        "weight": 900,
        "equipment_slot": "hand",
        "gun_type": "plasma",
        "description": "An advanced plasma weapon. Devastating energy damage.",
        "attachment_slots": {}  // Pre-assembled, no slots
    },

    // === WEAPON ACCESSORIES ===

    {
        "id": "RANGE_FINDER",
        "name": "Range Finder",
        "char": "r",
        "colour": "#fa0",
        "weight": 100,
        "part_type": "mod_pistol",
        "description": "An optical range-finding device. Improves accuracy at distance.",
        "modifiers": {
            "accuracy": 8,
            "range": 2
        }
    },

    {
        "id": "GRIP_WARMER",
        "name": "Grip Warmer",
        "char": "w",
        "colour": "#f66",
        "weight": 100,
        "part_type": "mod_pistol",
        "description": "A heated grip module. Improves comfort in cold environments.",
        "modifiers": {
            "comfortPenalty": 2,  // Reduces comfort penalty
            "tempMin": 5  // Helps in cold temps
        }
    }
];
