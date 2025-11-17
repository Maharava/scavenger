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
        "description": "A short barrel for a pistol.",
        "modifiers": {
            "hunger": 5 // Test stat modifier
        }
    },
    {
        "id": "RUBBER_GRIP",
        "name": "Rubber Grip",
        "char": "g",
        "colour": "#333",
        "weight": 30,
        "part_type": "grip",
        "description": "A comfortable rubber grip."
        // No modifiers - just a basic grip
    },
    {
        "id": "WOODEN_GRIP",
        "name": "Wooden Grip",
        "char": "g",
        "colour": "#964",
        "weight": 40,
        "part_type": "grip",
        "description": "A solid wooden grip.",
        "modifiers": {
            "hunger": 3 // Test stat modifier
        }
    },
    {
        "id": "STANDARD_CHAMBER",
        "name": "Standard Chamber",
        "char": "c",
        "colour": "#aaa",
        "weight": 80,
        "part_type": "chamber",
        "description": "A standard pistol chamber.",
        "modifiers": {
            "head": 10 // Test stat modifier
        }
    },
    {
        "id": "RANGE_FINDER",
        "name": "Range Finder",
        "char": "r",
        "colour": "#0f0",
        "weight": 50,
        "part_type": "mod",
        "description": "A small range-finding device.",
        "modifiers": {
            "hunger": 2 // Test stat modifier
        }
    },
    {
        "id": "GRIP_WARMER",
        "name": "Grip Warmer",
        "char": "w",
        "colour": "#f90",
        "weight": 25,
        "part_type": "mod",
        "description": "Keeps your grip warm in cold environments.",
        "modifiers": {
            "hunger": 1 // Test stat modifier
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
            "mod1": { "accepted_type": "mod", "entity_id": null, "required": false },
            "mod2": { "accepted_type": "mod", "entity_id": null, "required": false }
        }
    },

    // === ARMOR PARTS ===
    {
        "id": "CLOTH_UNDERLAY",
        "name": "Cloth Underlay",
        "char": "u",
        "colour": "#ddd",
        "weight": 120,
        "part_type": "underlay",
        "description": "A soft cloth underlay for armor."
        // No modifiers - just a basic part
    },
    {
        "id": "POLYESTER_UNDERLAY",
        "name": "Polyester Underlay",
        "char": "u",
        "colour": "#eee",
        "weight": 80,
        "part_type": "underlay",
        "description": "A lightweight polyester underlay."
        // No modifiers - generic part
    },
    {
        "id": "METAL_PLATING",
        "name": "Metal Plating",
        "char": "m",
        "colour": "#aaa",
        "weight": 800,
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
        "weight": 200,
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
        "part_type": "mod",
        "description": "Keeps you cool in hot environments.",
        "modifiers": {
            "hunger": 3 // Test stat modifier
        }
    },

    // === ARMOR CONTAINER ===
    {
        "id": "SCRAP_ARMOR",
        "name": "Scrap Armor",
        "char": "A",
        "colour": "#963",
        "weight": 600,
        "equipment_slot": "body",
        "armor_type": "body_armor",
        "description": "Armor cobbled together from scrap. Needs parts to function.",
        "attachment_slots": {
            "underlay": { "accepted_type": "underlay", "entity_id": null, "required": true },
            "material": { "accepted_type": "material", "entity_id": null, "required": true },
            "overlay": { "accepted_type": "overlay", "entity_id": null, "required": true },
            "mod1": { "accepted_type": "mod", "entity_id": null, "required": false },
            "mod2": { "accepted_type": "mod", "entity_id": null, "required": false }
        }
    },

    // === GENERIC GUN GRIPS ===
    {
        "id": "BASIC_GRIP",
        "name": "Basic Grip",
        "char": "g",
        "colour": "#999",
        "weight": 35,
        "part_type": "grip",
        "description": "A standard grip with no special features."
    },
    {
        "id": "COMPACT_GRIP",
        "name": "Compact Grip",
        "char": "g",
        "colour": "#888",
        "weight": 25,
        "part_type": "grip",
        "description": "A smaller, lighter grip for better portability."
    },
    {
        "id": "ERGONOMIC_GRIP",
        "name": "Ergonomic Grip",
        "char": "g",
        "colour": "#777",
        "weight": 40,
        "part_type": "grip",
        "description": "A comfortable grip designed for extended use."
    },
    {
        "id": "TEXTURED_GRIP",
        "name": "Textured Grip",
        "char": "g",
        "colour": "#666",
        "weight": 38,
        "part_type": "grip",
        "description": "A grip with textured surface for improved handling."
    },

    // === GENERIC GUN CHAMBERS ===
    {
        "id": "BASIC_CHAMBER",
        "name": "Basic Chamber",
        "char": "c",
        "colour": "#999",
        "weight": 75,
        "part_type": "chamber",
        "description": "A standard chamber with no special features."
    },
    {
        "id": "REINFORCED_CHAMBER",
        "name": "Reinforced Chamber",
        "char": "c",
        "colour": "#888",
        "weight": 90,
        "part_type": "chamber",
        "description": "A reinforced chamber built for durability."
    },
    {
        "id": "LIGHTWEIGHT_CHAMBER",
        "name": "Lightweight Chamber",
        "char": "c",
        "colour": "#777",
        "weight": 60,
        "part_type": "chamber",
        "description": "A lighter chamber made from advanced materials."
    },
    {
        "id": "PRECISION_CHAMBER",
        "name": "Precision Chamber",
        "char": "c",
        "colour": "#666",
        "weight": 85,
        "part_type": "chamber",
        "description": "A precisely machined chamber for consistent performance."
    },

    // === GENERIC GUN BARRELS ===
    {
        "id": "BASIC_BARREL",
        "name": "Basic Barrel",
        "char": "b",
        "colour": "#999",
        "weight": 95,
        "part_type": "barrel",
        "description": "A standard barrel with no special features."
    },
    {
        "id": "LONG_BARREL",
        "name": "Long Barrel",
        "char": "b",
        "colour": "#888",
        "weight": 120,
        "part_type": "barrel",
        "description": "An extended barrel for improved range."
    },
    {
        "id": "COMPACT_BARREL",
        "name": "Compact Barrel",
        "char": "b",
        "colour": "#777",
        "weight": 75,
        "part_type": "barrel",
        "description": "A shorter barrel for better maneuverability."
    },
    {
        "id": "RIFLED_BARREL",
        "name": "Rifled Barrel",
        "char": "b",
        "colour": "#666",
        "weight": 105,
        "part_type": "barrel",
        "description": "A barrel with rifling for improved accuracy."
    },

    // === GENERIC ARMOR UNDERLAYS ===
    {
        "id": "BASIC_UNDERLAY",
        "name": "Basic Underlay",
        "char": "u",
        "colour": "#999",
        "weight": 100,
        "part_type": "underlay",
        "description": "A standard underlay with no special features."
    },
    {
        "id": "PADDED_UNDERLAY",
        "name": "Padded Underlay",
        "char": "u",
        "colour": "#888",
        "weight": 140,
        "part_type": "underlay",
        "description": "A padded underlay for additional comfort."
    },
    {
        "id": "MESH_UNDERLAY",
        "name": "Mesh Underlay",
        "char": "u",
        "colour": "#777",
        "weight": 70,
        "part_type": "underlay",
        "description": "A breathable mesh underlay for ventilation."
    },
    {
        "id": "THERMAL_UNDERLAY",
        "name": "Thermal Underlay",
        "char": "u",
        "colour": "#666",
        "weight": 110,
        "part_type": "underlay",
        "description": "An insulated underlay for temperature regulation."
    },

    // === GENERIC ARMOR MATERIALS ===
    {
        "id": "BASIC_MATERIAL",
        "name": "Basic Material",
        "char": "m",
        "colour": "#999",
        "weight": 600,
        "part_type": "material",
        "description": "A standard material with no special features."
    },
    {
        "id": "COMPOSITE_MATERIAL",
        "name": "Composite Material",
        "char": "m",
        "colour": "#888",
        "weight": 550,
        "part_type": "material",
        "description": "A composite material balancing protection and weight."
    },
    {
        "id": "CERAMIC_MATERIAL",
        "name": "Ceramic Material",
        "char": "m",
        "colour": "#777",
        "weight": 700,
        "part_type": "material",
        "description": "A ceramic material offering solid protection."
    },
    {
        "id": "POLYMER_MATERIAL",
        "name": "Polymer Material",
        "char": "m",
        "colour": "#666",
        "weight": 450,
        "part_type": "material",
        "description": "A lightweight polymer material."
    },

    // === GENERIC ARMOR OVERLAYS ===
    {
        "id": "BASIC_OVERLAY",
        "name": "Basic Overlay",
        "char": "o",
        "colour": "#999",
        "weight": 180,
        "part_type": "overlay",
        "description": "A standard overlay with no special features."
    },
    {
        "id": "REFLECTIVE_OVERLAY",
        "name": "Reflective Overlay",
        "char": "o",
        "colour": "#888",
        "weight": 160,
        "part_type": "overlay",
        "description": "A reflective overlay for improved visibility."
    },
    {
        "id": "ABLATIVE_OVERLAY",
        "name": "Ablative Overlay",
        "char": "o",
        "colour": "#777",
        "weight": 220,
        "part_type": "overlay",
        "description": "An ablative overlay designed to dissipate damage."
    },
    {
        "id": "CAMOUFLAGE_OVERLAY",
        "name": "Camouflage Overlay",
        "char": "o",
        "colour": "#666",
        "weight": 170,
        "part_type": "overlay",
        "description": "A camouflage overlay for concealment."
    }
];
