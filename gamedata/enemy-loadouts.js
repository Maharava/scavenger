// Enemy Equipment Loadouts
// Pre-configured weapon and armor setups for enemies
// Enemies randomly select from these loadouts when spawned

const ENEMY_WEAPON_LOADOUTS = {
    // === PISTOL LOADOUTS ===

    "BASIC_PISTOL": {
        base: "PISTOL",
        parts: {
            barrel: "SHORT_BARREL",
            grip: "BASIC_GRIP",
            chamber: "BASIC_CHAMBER"
        }
    },

    "COMBAT_PISTOL": {
        base: "PISTOL",
        parts: {
            barrel: "BASIC_BARREL",
            grip: "RUBBER_GRIP",
            chamber: "STANDARD_CHAMBER"
        }
    },

    "TACTICAL_PISTOL": {
        base: "PISTOL",
        parts: {
            barrel: "BASIC_BARREL",
            grip: "TEXTURED_GRIP",
            chamber: "REINFORCED_CHAMBER",
            mod1: "PISTOL_LASER_SIGHT"
        }
    },

    "SUPPRESSED_PISTOL": {
        base: "PISTOL",
        parts: {
            barrel: "LONG_BARREL",
            grip: "ERGONOMIC_GRIP",
            chamber: "PRECISION_CHAMBER",
            mod1: "PISTOL_SUPPRESSOR"
        }
    },

    // === RIFLE LOADOUTS ===

    "BASIC_RIFLE": {
        base: "RIFLE",
        parts: {
            barrel: "BASIC_BARREL",
            grip: "BASIC_GRIP",
            chamber: "BASIC_CHAMBER"
        }
    },

    "ASSAULT_RIFLE": {
        base: "RIFLE",
        parts: {
            barrel: "RIFLED_BARREL",
            grip: "TEXTURED_GRIP",
            chamber: "REINFORCED_CHAMBER"
        }
    },

    "SNIPER_RIFLE": {
        base: "RIFLE",
        parts: {
            barrel: "LONG_BARREL",
            grip: "ERGONOMIC_GRIP",
            chamber: "PRECISION_CHAMBER",
            mod1: "RIFLE_SCOPE",
            mod2: "RIFLE_BIPOD"
        }
    },

    "HEAVY_RIFLE": {
        base: "RIFLE",
        parts: {
            barrel: "LONG_BARREL",
            grip: "BASIC_GRIP",
            chamber: "REINFORCED_CHAMBER",
            mod1: "RIFLE_SCOPE"
        }
    },

    "STEALTH_RIFLE": {
        base: "RIFLE",
        parts: {
            barrel: "RIFLED_BARREL",
            grip: "ERGONOMIC_GRIP",
            chamber: "PRECISION_CHAMBER",
            mod1: "RIFLE_SUPPRESSOR"
        }
    }
};

const ENEMY_ARMOUR_LOADOUTS = {
    // === LIGHT ARMOUR ===

    "SCOUT_ARMOUR": {
        base: "ARMOUR",
        parts: {
            underlay: "MESH_UNDERLAY",
            material: "POLYMER_MATERIAL",
            overlay: "BASIC_OVERLAY"
        }
    },

    "LIGHT_COMBAT_ARMOUR": {
        base: "ARMOUR",
        parts: {
            underlay: "BASIC_UNDERLAY",
            material: "BASIC_MATERIAL",
            overlay: "BASIC_OVERLAY"
        }
    },

    // === MEDIUM ARMOUR ===

    "TACTICAL_ARMOUR": {
        base: "ARMOUR",
        parts: {
            underlay: "PADDED_UNDERLAY",
            material: "COMPOSITE_MATERIAL",
            overlay: "ABLATIVE_OVERLAY"
        }
    },

    "COMBAT_ARMOUR": {
        base: "ARMOUR",
        parts: {
            underlay: "BASIC_UNDERLAY",
            material: "COMPOSITE_MATERIAL",
            overlay: "REFLECTIVE_OVERLAY",
            mod1: "COOLING_SYSTEM"
        }
    },

    // === HEAVY ARMOUR ===

    "HEAVY_ASSAULT_ARMOUR": {
        base: "ARMOUR",
        parts: {
            underlay: "THERMAL_UNDERLAY",
            material: "CERAMIC_MATERIAL",
            overlay: "ABLATIVE_OVERLAY",
            mod1: "HEATING_ELEMENT"
        }
    },

    "ELITE_COMBAT_ARMOUR": {
        base: "ARMOUR",
        parts: {
            underlay: "PADDED_UNDERLAY",
            material: "POLYMER_MATERIAL",
            overlay: "REFLECTIVE_OVERLAY",
            mod1: "COOLING_SYSTEM"
        }
    },

    // === SPECIALIZED ARMOUR ===

    "STEALTH_ARMOUR": {
        base: "ARMOUR",
        parts: {
            underlay: "MESH_UNDERLAY",
            material: "POLYMER_MATERIAL",
            overlay: "CAMOUFLAGE_OVERLAY"
        }
    },

    "HAZARD_ARMOUR": {
        base: "ARMOUR",
        parts: {
            underlay: "THERMAL_UNDERLAY",
            material: "POLYMER_MATERIAL",
            overlay: "REFLECTIVE_OVERLAY",
            mod1: "COOLING_SYSTEM",
            mod2: "HEATING_ELEMENT"
        }
    }
};

// Enemy type -> possible loadout combinations
// Each enemy type has weighted arrays of weapon/armor loadouts they can spawn with
const ENEMY_LOADOUT_POOLS = {
    "HOSTILE_HUMAN": {
        weapons: [
            { loadout: "BASIC_PISTOL", weight: 30 },
            { loadout: "COMBAT_PISTOL", weight: 25 },
            { loadout: "TACTICAL_PISTOL", weight: 15 },
            { loadout: "BASIC_RIFLE", weight: 20 },
            { loadout: "ASSAULT_RIFLE", weight: 10 }
        ],
        armor: [
            { loadout: "SCOUT_ARMOUR", weight: 25 },
            { loadout: "LIGHT_COMBAT_ARMOUR", weight: 35 },
            { loadout: "TACTICAL_ARMOUR", weight: 25 },
            { loadout: "COMBAT_ARMOUR", weight: 15 }
        ]
    },

    "RAIDER": {
        weapons: [
            { loadout: "COMBAT_PISTOL", weight: 20 },
            { loadout: "TACTICAL_PISTOL", weight: 20 },
            { loadout: "SUPPRESSED_PISTOL", weight: 10 },
            { loadout: "ASSAULT_RIFLE", weight: 30 },
            { loadout: "HEAVY_RIFLE", weight: 20 }
        ],
        armor: [
            { loadout: "LIGHT_COMBAT_ARMOUR", weight: 20 },
            { loadout: "TACTICAL_ARMOUR", weight: 35 },
            { loadout: "COMBAT_ARMOUR", weight: 30 },
            { loadout: "HEAVY_ASSAULT_ARMOUR", weight: 15 }
        ]
    },

    "ELITE_SOLDIER": {
        weapons: [
            { loadout: "TACTICAL_PISTOL", weight: 15 },
            { loadout: "SUPPRESSED_PISTOL", weight: 10 },
            { loadout: "ASSAULT_RIFLE", weight: 25 },
            { loadout: "HEAVY_RIFLE", weight: 25 },
            { loadout: "SNIPER_RIFLE", weight: 15 },
            { loadout: "STEALTH_RIFLE", weight: 10 }
        ],
        armor: [
            { loadout: "COMBAT_ARMOUR", weight: 30 },
            { loadout: "HEAVY_ASSAULT_ARMOUR", weight: 35 },
            { loadout: "ELITE_COMBAT_ARMOUR", weight: 25 },
            { loadout: "HAZARD_ARMOUR", weight: 10 }
        ]
    }
};
