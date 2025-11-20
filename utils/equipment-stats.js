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
        tempMax: 0
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

    let totalWeight = 0;

    // Sum weights of all attached parts
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
