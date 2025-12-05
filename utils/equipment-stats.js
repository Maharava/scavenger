// Equipment stat calculation functions
// Handles dynamic stat calculation for modular equipment (guns and armor)

// Helper function to calculate armor stats from attached components
// Returns null if equipment is not armor or has no attachment slots
function calculateArmourStats(world, armourEntity) {
    const attachmentSlots = armourEntity.getComponent('AttachmentSlotsComponent');
    const armourComponent = armourEntity.getComponent('ArmourComponent');

    if (!attachmentSlots || !armourComponent) return null;

    const stats = {
        maxDurability: 0,
        resistances: { kinetic: 0, energy: 0, toxin: 0, radiation: 0 },
        tempMin: 0,
        tempMax: 0,
        comfort: 0
    };

    // Calculate stats from each attached component
    for (const [slotName, slotData] of Object.entries(attachmentSlots.slots)) {
        if (!slotData.entity_id) continue;

        const part = world.getEntity(slotData.entity_id);
        if (!part) continue;

        const statMod = part.getComponent('StatModifierComponent');
        if (!statMod || !statMod.modifiers) continue;

        // Accumulate armor-specific stats
        if (statMod.modifiers.maxDurability) {
            stats.maxDurability += statMod.modifiers.maxDurability;
        }
        if (statMod.modifiers.kinetic) {
            stats.resistances.kinetic += statMod.modifiers.kinetic;
        }
        if (statMod.modifiers.energy) {
            stats.resistances.energy += statMod.modifiers.energy;
        }
        if (statMod.modifiers.toxin) {
            stats.resistances.toxin += statMod.modifiers.toxin;
        }
        if (statMod.modifiers.radiation) {
            stats.resistances.radiation += statMod.modifiers.radiation;
        }
        if (statMod.modifiers.tempMin) {
            stats.tempMin += statMod.modifiers.tempMin;
        }
        if (statMod.modifiers.tempMax) {
            stats.tempMax += statMod.modifiers.tempMax;
        }
        if (statMod.modifiers.comfort) {
            stats.comfort += statMod.modifiers.comfort;
        }
    }

    // Default durability if none specified
    if (stats.maxDurability === 0) {
        // Check if required slots are filled
        if (!isEquipmentValid(world, armourEntity)) {
            stats.maxDurability = 0; // Incomplete armor has no durability
        } else {
            stats.maxDurability = 100; // Complete armor with no durability modifiers gets default
        }
    }

    return stats;
}

// Helper function to update armor stats component based on attached parts
function updateArmourStats(world, armourEntity) {
    const calculatedStats = calculateArmourStats(world, armourEntity);
    if (!calculatedStats) return;

    let armourStats = armourEntity.getComponent('ArmourStatsComponent');

    // Create component if it doesn't exist
    if (!armourStats) {
        armourStats = new ArmourStatsComponent(calculatedStats.maxDurability);
        world.addComponent(armourEntity.id, armourStats);
    }

    // Update stats from calculated values
    const oldMaxDurability = armourStats.maxDurability;
    armourStats.maxDurability = calculatedStats.maxDurability;

    // Scale current durability proportionally if max changed
    if (oldMaxDurability > 0 && oldMaxDurability !== calculatedStats.maxDurability) {
        const durabilityPercent = armourStats.durability / oldMaxDurability;
        armourStats.durability = calculatedStats.maxDurability * durabilityPercent;
    } else if (armourStats.durability === 0 || armourStats.durability > calculatedStats.maxDurability) {
        armourStats.durability = calculatedStats.maxDurability;
    }

    armourStats.resistances = calculatedStats.resistances;
    armourStats.tempMin = calculatedStats.tempMin;
    armourStats.tempMax = calculatedStats.tempMax;
    armourStats.comfort = calculatedStats.comfort;
}

// Helper function to calculate gun stats from attached parts
function calculateGunStats(world, gunEntity) {
    const attachmentSlots = gunEntity.getComponent('AttachmentSlotsComponent');
    const gunComponent = gunEntity.getComponent('GunComponent');

    if (!attachmentSlots || !gunComponent) return null;

    const stats = {
        damageType: 'kinetic',
        damageAmount: 0,
        penetration: 1.0,
        accuracy: 70, // Base accuracy
        range: 0,
        comfortPenalty: 0
    };

    // Process each attached part
    for (const [slotName, slotData] of Object.entries(attachmentSlots.slots)) {
        if (!slotData.entity_id) continue;

        const part = world.getEntity(slotData.entity_id);
        if (!part) continue;

        const partComp = part.getComponent('PartComponent');
        const statMod = part.getComponent('StatModifierComponent');
        if (!partComp || !statMod || !statMod.modifiers) continue;

        // Chamber: Sets damage type, amount, and base penetration
        if (partComp.part_type === 'chamber') {
            if (statMod.modifiers.damageType) stats.damageType = statMod.modifiers.damageType;
            if (statMod.modifiers.damageAmount) stats.damageAmount = statMod.modifiers.damageAmount;
            if (statMod.modifiers.penetration !== undefined) stats.penetration = statMod.modifiers.penetration;
        }

        // Barrel: Modifies damage, penetration, sets range, modifies accuracy
        if (partComp.part_type === 'barrel') {
            if (statMod.modifiers.damageAmount) stats.damageAmount += statMod.modifiers.damageAmount;
            if (statMod.modifiers.penetration) stats.penetration *= statMod.modifiers.penetration;
            if (statMod.modifiers.range) stats.range = statMod.modifiers.range;
            if (statMod.modifiers.accuracy) stats.accuracy += statMod.modifiers.accuracy;
        }

        // Grip: Modifies accuracy and comfort penalty
        if (partComp.part_type === 'grip') {
            if (statMod.modifiers.accuracy) stats.accuracy += statMod.modifiers.accuracy;
            if (statMod.modifiers.comfortPenalty !== undefined) stats.comfortPenalty = statMod.modifiers.comfortPenalty;
        }

        // Optional mods can also modify stats
        if (partComp.part_type === 'mod_gun' || partComp.part_type === 'mod_pistol' || partComp.part_type === 'mod_rifle') {
            if (statMod.modifiers.accuracy) stats.accuracy += statMod.modifiers.accuracy;
            if (statMod.modifiers.damageAmount) stats.damageAmount += statMod.modifiers.damageAmount;
            if (statMod.modifiers.range) stats.range += statMod.modifiers.range;
            if (statMod.modifiers.penetration) stats.penetration *= statMod.modifiers.penetration;
        }
    }

    // Clamp accuracy to valid range
    stats.accuracy = Math.max(MIN_STAT_VALUE, Math.min(MAX_STAT_VALUE, stats.accuracy));

    return stats;
}

// Helper function to update gun stats component based on attached parts
function updateGunStats(world, gunEntity) {
    const calculatedStats = calculateGunStats(world, gunEntity);
    if (!calculatedStats) return;

    let gunStats = gunEntity.getComponent('GunStatsComponent');

    // Create component if it doesn't exist
    if (!gunStats) {
        gunStats = new GunStatsComponent();
        world.addComponent(gunEntity.id, gunStats);
    }

    // Update stats from calculated values
    gunStats.damageType = calculatedStats.damageType;
    gunStats.damageAmount = calculatedStats.damageAmount;
    gunStats.penetration = calculatedStats.penetration;
    gunStats.accuracy = calculatedStats.accuracy;
    gunStats.range = calculatedStats.range;
    gunStats.comfortPenalty = calculatedStats.comfortPenalty;
}

// Helper function to calculate equipment weight from attached parts
// Returns the total weight of all parts attached to modular equipment (guns, armor)
// Returns null if the entity is not modular equipment
function calculateEquipmentWeight(world, equipmentEntity) {
    const attachmentSlots = equipmentEntity.getComponent('AttachmentSlotsComponent');
    if (!attachmentSlots) {
        // Not modular equipment, use ItemComponent weight
        const itemComponent = equipmentEntity.getComponent('ItemComponent');
        return itemComponent ? itemComponent.weight : 0;
    }

    // Start with the base weight of the equipment container (pistol/rifle/armor frame)
    const itemComponent = equipmentEntity.getComponent('ItemComponent');
    let totalWeight = itemComponent ? itemComponent.weight : 0;

    // Add weights of all attached parts
    for (const [slotName, slotData] of Object.entries(attachmentSlots.slots)) {
        if (!slotData.entity_id) continue;

        const part = world.getEntity(slotData.entity_id);
        if (!part) continue;

        const partItem = part.getComponent('ItemComponent');
        if (partItem && partItem.weight) {
            totalWeight += partItem.weight;
        }
    }

    return totalWeight;
}

// Calculate the effective weight of equipment based on what slot it's equipped in
// Returns the actual weight value to use when calculating total carried weight
// Parameters:
//   - baseWeight: The raw weight of the item (from calculateEquipmentWeight or ItemComponent)
//   - equipmentSlot: The slot where the item is equipped ('hand', 'body', 'tool1', 'tool2', 'backpack')
//   - equipmentEntity: The entity of the equipment (used to check if it's armor/gun/tool/backpack)
function getEquippedWeightMultiplier(world, equipmentEntity, equipmentSlot) {
    // Determine equipment type
    const hasGun = equipmentEntity.hasComponent('GunComponent');
    const hasArmor = equipmentEntity.hasComponent('ArmourComponent');
    const hasTool = equipmentEntity.hasComponent('ToolComponent');
    const isBackpack = equipmentSlot === 'backpack';

    // Apply weight multipliers based on equipment type
    if (hasArmor) {
        return EQUIPPED_ARMOR_WEIGHT_MULT;  // 50% weight for armor
    } else if (hasTool && !isBackpack) {
        return EQUIPPED_TOOL_WEIGHT_MULT;   // 50% weight for tools (not backpacks)
    } else if (hasGun) {
        return EQUIPPED_GUN_WEIGHT_MULT;    // 100% weight for guns (full weight)
    } else if (isBackpack) {
        return EQUIPPED_BACKPACK_WEIGHT_MULT; // 100% weight for backpacks (full weight)
    }

    // Default: full weight
    return 1.0;
}

// Check if equipment has all required attachment slots filled
// Returns true if equipment can be equipped, false otherwise
function isEquipmentValid(world, equipmentEntity) {
    const attachmentSlots = equipmentEntity.getComponent('AttachmentSlotsComponent');
    if (!attachmentSlots) return true;  // Non-modular equipment is always valid

    // Check that all required slots have parts installed
    for (const [slotName, slotData] of Object.entries(attachmentSlots.slots)) {
        if (slotData.required && !slotData.entity_id) {
            return false;  // Required slot is empty
        }
    }

    return true;  // All required slots are filled
}

// Get modified stats from all equipped tools (skill boosts, inventory slots, weight bonuses)
// Returns an object with aggregated bonuses: { skillBoosts: {}, inventorySlots: 0, maxWeightPct: 0 }
function getModifiedStatsFromTools(world, playerEntity) {
    const equipped = playerEntity.getComponent('EquippedItemsComponent');
    if (!equipped) return { skillBoosts: {}, inventorySlots: 0, maxWeightPct: 0 };

    const modifiedStats = {
        skillBoosts: {},      // e.g., { medical: 1, farming: 1 }
        inventorySlots: 0,    // Total bonus slots from tools
        maxWeightPct: 0       // Percentage bonus to max weight (e.g., 20 for +20%)
    };

    // Check all tool slots (tool1, tool2, backpack)
    const toolSlots = ['tool1', 'tool2', 'backpack'];
    for (const slotName of toolSlots) {
        const toolEntityId = equipped[slotName];
        if (!toolEntityId) continue;

        const toolEntity = world.getEntity(toolEntityId);
        if (!toolEntity) continue;

        const toolStats = toolEntity.getComponent('ToolStatsComponent');
        if (!toolStats) continue;

        // Aggregate skill boosts
        if (toolStats.skillBoosts) {
            for (const [skill, bonus] of Object.entries(toolStats.skillBoosts)) {
                modifiedStats.skillBoosts[skill] = (modifiedStats.skillBoosts[skill] || 0) + bonus;
            }
        }

        // Aggregate stat boosts (inventory slots, weight capacity)
        if (toolStats.statBoosts) {
            if (toolStats.statBoosts.inventorySlots) {
                modifiedStats.inventorySlots += toolStats.statBoosts.inventorySlots;
            }
            if (toolStats.statBoosts.maxWeightPct) {
                modifiedStats.maxWeightPct += toolStats.statBoosts.maxWeightPct;
            }
        }
    }

    return modifiedStats;
}

// Calculate the effective max weight capacity for a player
// Takes into account base capacity and any percentage bonuses from tools (e.g., Grav Ball +20%)
// Returns the modified max weight in grams
function getPlayerMaxWeight(world, playerEntity) {
    const inventory = playerEntity.getComponent('InventoryComponent');
    if (!inventory) return BASE_MAX_WEIGHT;

    const baseMaxWeight = inventory.maxWeight;  // Should be BASE_MAX_WEIGHT (13kg)
    const toolStats = getModifiedStatsFromTools(world, playerEntity);

    // Apply percentage bonus (e.g., Grav Ball adds +20%)
    const percentageBonus = toolStats.maxWeightPct / 100;
    const modifiedMaxWeight = baseMaxWeight * (1 + percentageBonus);

    return Math.floor(modifiedMaxWeight);  // Return as integer grams
}

// Calculate the effective inventory slot capacity for a player
// Takes into account base capacity and any slot bonuses from tools
// Returns the modified slot capacity
function getPlayerMaxSlots(world, playerEntity) {
    const inventory = playerEntity.getComponent('InventoryComponent');
    if (!inventory) return 4;  // Default base capacity

    const baseCapacity = inventory.capacity;  // Base slots (usually 4)
    const toolStats = getModifiedStatsFromTools(world, playerEntity);

    return baseCapacity + toolStats.inventorySlots;
}
