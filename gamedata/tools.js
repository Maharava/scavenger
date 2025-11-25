const TOOL_DATA = {
    // --- Light Sources ---
    'TOOL_TORCH': {
        id: 'TOOL_TORCH',
        name: 'Torch',
        description: 'A bright, reliable light source for dark environments.',
        char: 't',
        colour: '#ffaa00',
        weight: 300,
        slots: 1.0,
        tool_type: 'light',
        uses: -1,
        maxUses: -1,
        stats: {
            lightRadius: 12
        }
    },
    'TOOL_FLASHLIGHT': {
        id: 'TOOL_FLASHLIGHT',
        name: 'Tactical Flashlight',
        description: 'Compact, focused beam for tactical operations.',
        char: 'f',
        colour: '#ffffff',
        weight: 180,
        slots: 0.5,
        tool_type: 'light',
        uses: -1,
        maxUses: -1,
        stats: {
            lightRadius: 10
        }
    },
    'TOOL_GLOWSTICK': {
        id: 'TOOL_GLOWSTICK',
        name: 'Chemical Glow Stick',
        description: 'Emergency chemical light. Weak but very light.',
        char: 'g',
        colour: '#00ff00',
        weight: 50,
        slots: 0.5,
        tool_type: 'light',
        uses: -1,
        maxUses: -1,
        stats: {
            lightRadius: 6
        }
    },

    // --- Consumable Tools ---

    'TOOL_ADRENAL_SPIKER': {
        id: 'TOOL_ADRENAL_SPIKER',
        name: 'Adrenal Spiker',
        description: 'A shot of stimulants for a combat edge. Use at the start of combat.',
        char: 'A',
        colour: '#ff4500',
        weight: 100,
        slots: 0.5,
        tool_type: 'consumable',
        uses: 3,
        maxUses: 3,
        stats: {
            specialAbility: 'use_adrenal_spiker',
            abilityArgs: { initiativeBonus: 2 }
        }
    },
    'TOOL_CHAFF_SPITTER': {
        id: 'TOOL_CHAFF_SPITTER',
        name: 'Chaff Spitter',
        description: 'Releases a cloud of sensor-jamming particles when targeted.',
        char: 'C',
        colour: '#a9a9a9',
        weight: 250,
        slots: 0.5,
        tool_type: 'consumable',
        uses: 5,
        maxUses: 5,
        stats: {
            specialAbility: 'deploy_chaff',
            abilityArgs: { accuracyDebuff: 30 }
        }
    },

    // --- Passive Boost Tools ---
    'TOOL_MINI_DOC': {
        id: 'TOOL_MINI_DOC',
        name: 'Mini-Doc',
        description: 'An wrist-mounted device that offers medical advice and biometric tracking.',
        char: 'm',
        colour: '#add8e6',
        weight: 350,
        slots: 1.0,
        tool_type: 'passive',
        uses: -1,
        maxUses: -1,
        stats: {
            skillBoosts: { medical: 1 }
        }
    },
    'TOOL_SOIL_TESTER': {
        id: 'TOOL_SOIL_TESTER',
        name: 'Soil Tester',
        description: 'Analyzes soil composition to optimize hydroponic yields.',
        char: 's',
        colour: '#966919',
        weight: 400,
        slots: 1.0,
        tool_type: 'passive',
        uses: -1,
        maxUses: -1,
        stats: {
            skillBoosts: { farming: 1 }
        }
    },
    'TOOL_ANALYZER': {
        id: 'TOOL_ANALYZER',
        name: 'Multi-Field Analyzer',
        description: 'A diagnostic tool for assessing structural and biological integrity.',
        char: 'a',
        colour: '#f0e68c',
        weight: 600,
        slots: 1.0,
        tool_type: 'passive',
        uses: -1,
        maxUses: -1,
        stats: {
            skillBoosts: { medical: 1, repair: 1 }
        }
    },
    'TOOL_MULTI_TOOL': {
        id: 'TOOL_MULTI_TOOL',
        name: 'Multi-Tool',
        description: 'A versatile tool for field repairs and adjustments.',
        char: 'T',
        colour: '#c0c0c0',
        weight: 750,
        slots: 1.0,
        tool_type: 'passive',
        uses: -1,
        maxUses: -1,
        stats: {
            skillBoosts: { repair: 1 }
        }
    },
    'TOOL_SAMPLE_KIT': {
        id: 'TOOL_SAMPLE_KIT',
        name: 'Sample Kit',
        description: 'Contains various implements for collecting and preserving specimens, with extra storage.',
        char: 'k',
        colour: '#d2b48c',
        weight: 500,
        slots: 1.0,
        tool_type: 'passive',
        uses: -1,
        maxUses: -1,
        stats: {
            skillBoosts: { medical: 1 },
            statBoosts: { inventorySlots: 2 }
        }
    },
    'TOOL_UTILITY_BELT': {
        id: 'TOOL_UTILITY_BELT',
        name: 'Utility Belt',
        description: 'A sturdy belt with numerous pouches and clips for extra storage.',
        char: 'b',
        colour: '#8b4513',
        weight: 1200,
        slots: 1.0,
        tool_type: 'passive',
        uses: -1,
        maxUses: -1,
        stats: {
            statBoosts: { inventorySlots: 4 }
        }
    },
    'TOOL_GRAV_BALL': {
        id: 'TOOL_GRAV_BALL',
        name: 'Grav Ball',
        description: 'A dense sphere that generates a localized gravitational field, reducing the perceived mass of carried items.',
        char: 'O',
        colour: '#483d8b',
        weight: 2000,
        slots: 1.0,
        tool_type: 'passive',
        uses: -1,
        maxUses: -1,
        stats: {
            statBoosts: { maxWeightPct: 20 }
        }
    },

    // --- Information Tools ---
    'TOOL_MOTION_TRACKER': {
        id: 'TOOL_MOTION_TRACKER',
        name: 'Motion Tracker',
        description: 'Detects movement of nearby creatures through most obstacles.',
        char: 'M',
        colour: '#00ffff',
        weight: 400,
        slots: 1.0,
        tool_type: 'passive',
        uses: -1,
        maxUses: -1,
        stats: {
            specialAbility: 'reveal_enemies',
            abilityArgs: { range: 25, revealChance: 80 }
        }
    }
    // --- Storage Tools ---
    ,
    'TOOL_LIGHTWEIGHT_PACK': {
        id: 'TOOL_LIGHTWEIGHT_PACK',
        name: 'Lightweight Pack',
        description: 'A basic, light backpack for minor inventory expansion.',
        char: 'P',
        colour: '#808080',
        weight: 500,
        slots: 1.0,
        tool_type: 'passive',
        equipment_slot: 'backpack',
        uses: -1,
        maxUses: -1,
        stats: {
            statBoosts: { inventorySlots: 5 }
        }
    },
    'TOOL_SMALL_PACK': {
        id: 'TOOL_SMALL_PACK',
        name: 'Small Pack',
        description: 'A small, durable backpack for moderate inventory expansion.',
        char: 'P',
        colour: '#696969',
        weight: 300,
        slots: 1.0,
        tool_type: 'passive',
        equipment_slot: 'backpack',
        uses: -1,
        maxUses: -1,
        stats: {
            statBoosts: { inventorySlots: 2 }
        }
    },
    'TOOL_DUFFEL_BAG': {
        id: 'TOOL_DUFFEL_BAG',
        name: 'Duffel Bag',
        description: 'A large, versatile duffel bag for significant carrying capacity.',
        char: 'B',
        colour: '#a9a9a9',
        weight: 1500,
        slots: 1.0,
        tool_type: 'passive',
        equipment_slot: 'backpack',
        uses: -1,
        maxUses: -1,
        stats: {
            statBoosts: { inventorySlots: 10 }
        }
    },
    'TOOL_EXPLORERS_PACK': {
        id: 'TOOL_EXPLORERS_PACK',
        name: 'Explorer\'s Pack',
        description: 'A heavy-duty backpack designed for long expeditions, offering maximum storage.',
        char: 'B',
        colour: '#556b2f',
        weight: 2000,
        slots: 1.0,
        tool_type: 'passive',
        equipment_slot: 'backpack',
        uses: -1,
        maxUses: -1,
        stats: {
            statBoosts: { inventorySlots: 15 }
        }
    }
};