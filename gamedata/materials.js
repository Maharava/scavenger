// Crafting Materials and Salvage Items
// These are stackable items used for crafting, trading, and ship repairs

const MATERIAL_DATA = {
    // --- Basic Materials ---
    'POLYMER_RESIN': {
        id: 'POLYMER_RESIN',
        name: 'Polymer Resin',
        description: 'Synthetic resin used in fabrication and repairs. Common salvage.',
        char: '*',
        colour: '#8B7355',
        weight: 200,
        slots: 0.5,
        stackable: true,
        stackLimit: 50
    },

    'ARAMID_FIBRES': {
        id: 'ARAMID_FIBRES',
        name: 'Aramid Fibres',
        description: 'Strong synthetic fibers for armor and equipment reinforcement.',
        char: '~',
        colour: '#C0C0C0',
        weight: 150,
        slots: 0.5,
        stackable: true,
        stackLimit: 50
    },

    'BASIC_ELECTRONICS': {
        id: 'BASIC_ELECTRONICS',
        name: 'Basic Electronics',
        description: 'Circuit boards, wires, and components salvaged from devices.',
        char: '%',
        colour: '#4169E1',
        weight: 100,
        slots: 0.5,
        stackable: true,
        stackLimit: 50
    },

    'SALVAGED_COMPONENTS': {
        id: 'SALVAGED_COMPONENTS',
        name: 'Salvaged Components',
        description: 'Generic mechanical parts and scrap metal.',
        char: '&',
        colour: '#696969',
        weight: 250,
        slots: 0.5,
        stackable: true,
        stackLimit: 50
    },

    // --- Organic Materials ---
    'ORGANIC_PROTEIN': {
        id: 'ORGANIC_PROTEIN',
        name: 'Organic Protein',
        description: 'Preserved protein from plants or cultivated sources.',
        char: '*',
        colour: '#8FBC8F',
        weight: 180,
        slots: 0.5,
        stackable: true,
        stackLimit: 50
    },

    'RAW_BIOMASS': {
        id: 'RAW_BIOMASS',
        name: 'Raw Biomass',
        description: 'Unprocessed plant matter and organic material.',
        char: '~',
        colour: '#228B22',
        weight: 300,
        slots: 0.5,
        stackable: true,
        stackLimit: 50
    },

    // --- Chemical Compounds ---
    'CHEMICAL_COMPOUNDS': {
        id: 'CHEMICAL_COMPOUNDS',
        name: 'Chemical Compounds',
        description: 'Various chemicals useful for synthesis and processing.',
        char: '!',
        colour: '#FFD700',
        weight: 150,
        slots: 0.5,
        stackable: true,
        stackLimit: 30
    },

    'THERMAL_GEL': {
        id: 'THERMAL_GEL',
        name: 'Thermal Gel',
        description: 'Heat-resistant compound for insulation and temperature regulation.',
        char: '!',
        colour: '#FF6347',
        weight: 200,
        slots: 0.5,
        stackable: true,
        stackLimit: 20
    },

    // --- Advanced Materials ---
    'BIO_WOVEN_CHITIN': {
        id: 'BIO_WOVEN_CHITIN',
        name: 'Bio-Woven Chitin',
        description: 'Engineered organic armor plating. Lightweight and strong.',
        char: '#',
        colour: '#DEB887',
        weight: 400,
        slots: 1.0,
        stackable: true,
        stackLimit: 20
    },

    'TITANIUM_ALLOY': {
        id: 'TITANIUM_ALLOY',
        name: 'Titanium Alloy',
        description: 'High-grade metal alloy for structural reinforcement.',
        char: '=',
        colour: '#B0C4DE',
        weight: 500,
        slots: 1.0,
        stackable: true,
        stackLimit: 20
    },

    'CERAMIC_COMPOSITE_PLATE': {
        id: 'CERAMIC_COMPOSITE_PLATE',
        name: 'Ceramic Composite Plate',
        description: 'Advanced armor plating with excellent thermal resistance.',
        char: '[',
        colour: '#F5F5F5',
        weight: 600,
        slots: 1.0,
        stackable: true,
        stackLimit: 15
    },

    'ENERGY_REFLECTIVE_FILM': {
        id: 'ENERGY_REFLECTIVE_FILM',
        name: 'Energy Reflective Film',
        description: 'Thin film that reflects energy weapons. Rare and valuable.',
        char: '"',
        colour: '#00CED1',
        weight: 100,
        slots: 0.5,
        stackable: true,
        stackLimit: 10
    },

    // --- Repair & Consumables ---
    'REPAIR_PASTE': {
        id: 'REPAIR_PASTE',
        name: 'Repair Paste',
        description: 'Multipurpose sealant and repair compound.',
        char: '~',
        colour: '#A9A9A9',
        weight: 250,
        slots: 0.5,
        stackable: true,
        stackLimit: 20
    },

    // --- Tech Components ---
    'HIGH_CAPACITY_BATTERY': {
        id: 'HIGH_CAPACITY_BATTERY',
        name: 'High Capacity Battery',
        description: 'Rechargeable power cell for equipment and tools.',
        char: '|',
        colour: '#FFD700',
        weight: 300,
        slots: 0.5,
        stackable: true,
        stackLimit: 15
    },

    'INTACT_LOGIC_BOARD': {
        id: 'INTACT_LOGIC_BOARD',
        name: 'Intact Logic Board',
        description: 'Undamaged computer logic board. Essential for advanced repairs.',
        char: '%',
        colour: '#00FF00',
        weight: 150,
        slots: 0.5,
        stackable: true,
        stackLimit: 10
    },

    'FOCUSING_LENSES': {
        id: 'FOCUSING_LENSES',
        name: 'Focusing Lenses',
        description: 'Precision optics for energy weapons and sensors.',
        char: 'o',
        colour: '#87CEEB',
        weight: 100,
        slots: 0.5,
        stackable: true,
        stackLimit: 10
    }
};
