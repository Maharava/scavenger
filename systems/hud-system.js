// HudSystem - Updates the HUD display with player stats, body parts, and inventory info

class HudSystem extends System {
    update(world) {
        const player = world.query(['PlayerComponent', 'CreatureStatsComponent', 'NameComponent'])[0];
        if (!player) return;

        const stats = player.getComponent('CreatureStatsComponent');
        const bodyParts = player.getComponent('BodyPartsComponent');
        const name = player.getComponent('NameComponent');
        const inventory = player.getComponent('InventoryComponent');
        const timeComponent = player.getComponent('TimeComponent');

        // Get equipment modifiers
        const modifiers = getEquipmentModifiers(world, player);

        // Apply modifiers to displayed stats
        const displayHunger = Math.min(MAX_STAT_VALUE, stats.hunger + (modifiers.hunger || 0));
        const displayRest = Math.min(MAX_STAT_VALUE, stats.rest + (modifiers.rest || 0));
        const displayStress = Math.min(MAX_STAT_VALUE, stats.stress + (modifiers.stress || 0));
        const displayComfort = Math.min(MAX_STAT_VALUE, stats.comfort + (modifiers.comfort || 0));

        // Display player name with time (e.g., "Rile    0845")
        const timeDisplay = timeComponent ? `    ${timeComponent.getFormattedTime()}` : '';
        document.getElementById('hud-title').textContent = name.name + timeDisplay;
        document.getElementById('bar-hunger').querySelector('.bar-fill').style.width = `${displayHunger}%`;
        document.getElementById('bar-rest').querySelector('.bar-fill').style.width = `${displayRest}%`;
        document.getElementById('bar-stress').querySelector('.bar-fill').style.width = `${displayStress}%`;
        document.getElementById('bar-comfort').querySelector('.bar-fill').style.width = `${displayComfort}%`;

        // Display body parts - only show parts below 100%
        const bodyPartsContainer = document.getElementById('hud-body-parts');
        if (bodyParts) {
            const damagedParts = bodyParts.getDamagedParts();
            if (damagedParts.length > 0) {
                const partTexts = damagedParts.map(part => {
                    // Capitalize first letter of part name
                    const displayName = part.name.charAt(0).toUpperCase() + part.name.slice(1);
                    const modifier = modifiers[part.name] || 0;
                    const displayEfficiency = Math.min(MAX_STAT_VALUE, part.efficiency + modifier);
                    return `${displayName}: ${displayEfficiency}%${modifier ? ` (+${modifier})` : ''}`;
                });
                bodyPartsContainer.textContent = partTexts.join(' | ');
            } else {
                bodyPartsContainer.textContent = '';
            }
        }

        // Display inventory weight and slots
        // Max values are modified by equipped tools (e.g., Grav Ball adds +20% weight, backpacks add slots)
        if (inventory) {
            const currentWeight = inventory.getTotalWeight(world);
            const maxWeight = getPlayerMaxWeight(world, player);  // Includes tool bonuses (e.g., Grav Ball +20%)
            const usedSlots = inventory.getTotalSlotsUsed(world);
            const maxSlots = getPlayerMaxSlots(world, player);    // Includes tool bonuses (e.g., backpack slots)

            document.getElementById('hud-weight').textContent = `Weight: ${currentWeight}g/${maxWeight}g`;
            document.getElementById('hud-inventory').textContent = `Slots: ${usedSlots.toFixed(1)}/${maxSlots}`;
        }
    }
}
