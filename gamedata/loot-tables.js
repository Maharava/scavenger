// Loot Table Definitions
// Contextual item pools for scavenge nodes and floor loot
// Uses tag-based system for flexible item categorization

const LOOT_TABLES = {
    // ========================================================================
    // RESIDENTIAL AREAS
    // ========================================================================
    'RESIDENTIAL': {
        nodes: {
            'common': {
                tags: ['basic_materials', 'food_raw', 'food_prepared'],
                weights: {
                    'basic_materials': 50,
                    'food_raw': 30,
                    'food_prepared': 20
                }
            },
            'uncommon': {
                tags: ['electronics', 'utility', 'medical_supplies'],
                weights: {
                    'electronics': 40,
                    'utility': 35,
                    'medical_supplies': 25
                }
            },
            'rare': {
                tags: ['advanced_materials', 'weapon_parts', 'armor_parts'],
                weights: {
                    'advanced_materials': 40,
                    'weapon_parts': 35,
                    'armor_parts': 25
                }
            }
        },
        floor: {
            densityMultiplier: 1.0,  // Baseline
            items: {
                tags: ['food_prepared', 'basic_materials', 'medical_supplies'],
                weights: {
                    'food_prepared': 60,
                    'basic_materials': 30,
                    'medical_supplies': 10
                }
            }
        },
        rarityDistribution: {
            common: 0.60,
            uncommon: 0.30,
            rare: 0.10
        }
    },

    // ========================================================================
    // NATURE / HYDROPONICS
    // ========================================================================
    'NATURE': {
        nodes: {
            'common': {
                tags: ['food_raw', 'food_alien', 'organic'],
                weights: {
                    'food_raw': 40,
                    'food_alien': 35,
                    'organic': 25
                }
            },
            'uncommon': {
                tags: ['food_protein', 'basic_materials'],
                weights: {
                    'food_protein': 60,
                    'basic_materials': 40
                }
            },
            'rare': {
                tags: ['advanced_materials', 'medical_supplies'],
                weights: {
                    'advanced_materials': 50,
                    'medical_supplies': 50
                }
            }
        },
        floor: {
            densityMultiplier: 1.3,  // More scattered items in overgrown areas
            items: {
                tags: ['food_raw', 'food_alien', 'organic'],
                weights: {
                    'food_alien': 50,
                    'food_raw': 30,
                    'organic': 20
                }
            }
        },
        rarityDistribution: {
            common: 0.65,
            uncommon: 0.25,
            rare: 0.10
        }
    },

    // ========================================================================
    // TECH / DATA CENTERS
    // ========================================================================
    'TECH': {
        nodes: {
            'common': {
                tags: ['electronics', 'basic_materials'],
                weights: {
                    'electronics': 70,
                    'basic_materials': 30
                }
            },
            'uncommon': {
                tags: ['advanced_materials', 'utility'],
                weights: {
                    'advanced_materials': 60,
                    'utility': 40
                }
            },
            'rare': {
                tags: ['weapon_mods', 'armor_mods'],
                weights: {
                    'weapon_mods': 50,
                    'armor_mods': 50
                }
            }
        },
        floor: {
            densityMultiplier: 0.5,  // Clean, organized areas
            items: {
                tags: ['electronics', 'basic_materials'],
                weights: {
                    'electronics': 80,
                    'basic_materials': 20
                }
            }
        },
        rarityDistribution: {
            common: 0.50,
            uncommon: 0.35,
            rare: 0.15
        }
    },

    // ========================================================================
    // INDUSTRIAL / MANUFACTURING
    // ========================================================================
    'INDUSTRIAL': {
        nodes: {
            'common': {
                tags: ['basic_materials', 'advanced_materials'],
                weights: {
                    'basic_materials': 60,
                    'advanced_materials': 40
                }
            },
            'uncommon': {
                tags: ['weapon_parts', 'armor_parts'],
                weights: {
                    'weapon_parts': 50,
                    'armor_parts': 50
                }
            },
            'rare': {
                tags: ['weapon_mods', 'armor_mods'],
                weights: {
                    'weapon_mods': 50,
                    'armor_mods': 50
                }
            }
        },
        floor: {
            densityMultiplier: 0.7,  // Somewhat organized
            items: {
                tags: ['basic_materials', 'advanced_materials'],
                weights: {
                    'basic_materials': 70,
                    'advanced_materials': 30
                }
            }
        },
        rarityDistribution: {
            common: 0.55,
            uncommon: 0.30,
            rare: 0.15
        }
    },

    // ========================================================================
    // SECURITY
    // ========================================================================
    'SECURITY': {
        nodes: {
            'common': {
                tags: ['weapon_parts', 'basic_materials'],
                weights: {
                    'weapon_parts': 70,
                    'basic_materials': 30
                }
            },
            'uncommon': {
                tags: ['armor_parts', 'combat'],
                weights: {
                    'armor_parts': 60,
                    'combat': 40
                }
            },
            'rare': {
                tags: ['weapon_mods', 'armor_mods'],
                weights: {
                    'weapon_mods': 60,
                    'armor_mods': 40
                }
            }
        },
        floor: {
            densityMultiplier: 0.4,  // Most orderly areas
            items: {
                tags: ['weapon_parts', 'medical_supplies'],
                weights: {
                    'weapon_parts': 70,
                    'medical_supplies': 30
                }
            }
        },
        rarityDistribution: {
            common: 0.45,
            uncommon: 0.35,
            rare: 0.20
        }
    },

    // ========================================================================
    // UTILITY / MAINTENANCE
    // ========================================================================
    'UTILITY': {
        nodes: {
            'common': {
                tags: ['basic_materials', 'electronics'],
                weights: {
                    'basic_materials': 60,
                    'electronics': 40
                }
            },
            'uncommon': {
                tags: ['utility', 'chemical'],
                weights: {
                    'utility': 55,
                    'chemical': 45
                }
            },
            'rare': {
                tags: ['advanced_materials', 'armor_mods'],
                weights: {
                    'advanced_materials': 60,
                    'armor_mods': 40
                }
            }
        },
        floor: {
            densityMultiplier: 0.8,  // Moderately messy
            items: {
                tags: ['basic_materials', 'utility'],
                weights: {
                    'basic_materials': 70,
                    'utility': 30
                }
            }
        },
        rarityDistribution: {
            common: 0.60,
            uncommon: 0.30,
            rare: 0.10
        }
    },

    // ========================================================================
    // TRANSIT / DOCKING
    // ========================================================================
    'TRANSIT': {
        nodes: {
            'common': {
                tags: ['basic_materials', 'food_prepared'],
                weights: {
                    'basic_materials': 60,
                    'food_prepared': 40
                }
            },
            'uncommon': {
                tags: ['utility', 'electronics'],
                weights: {
                    'utility': 50,
                    'electronics': 50
                }
            },
            'rare': {
                tags: ['weapon_parts', 'armor_parts'],
                weights: {
                    'weapon_parts': 50,
                    'armor_parts': 50
                }
            }
        },
        floor: {
            densityMultiplier: 1.2,  // Scattered luggage/cargo
            items: {
                tags: ['food_prepared', 'basic_materials', 'utility'],
                weights: {
                    'food_prepared': 50,
                    'basic_materials': 30,
                    'utility': 20
                }
            }
        },
        rarityDistribution: {
            common: 0.65,
            uncommon: 0.25,
            rare: 0.10
        }
    },

    // ========================================================================
    // ATMOSPHERIC (Debris/Generic)
    // ========================================================================
    'ATMOSPHERIC': {
        nodes: {
            'common': {
                tags: ['basic_materials'],
                weights: {
                    'basic_materials': 100
                }
            },
            'uncommon': {
                tags: ['electronics', 'advanced_materials'],
                weights: {
                    'electronics': 50,
                    'advanced_materials': 50
                }
            },
            'rare': {
                tags: ['weapon_parts', 'armor_parts', 'utility'],
                weights: {
                    'weapon_parts': 35,
                    'armor_parts': 35,
                    'utility': 30
                }
            }
        },
        floor: {
            densityMultiplier: 1.5,  // Messy, debris-filled areas
            items: {
                tags: ['basic_materials', 'electronics'],
                weights: {
                    'basic_materials': 80,
                    'electronics': 20
                }
            }
        },
        rarityDistribution: {
            common: 0.70,
            uncommon: 0.20,
            rare: 0.10
        }
    }
};
