// TemperatureSystem - Handles environmental temperature effects
// Based on docs/temperature_system.md
// Affects comfort, stress, and can cause body part damage in extreme conditions

class TemperatureSystem extends System {
    constructor() {
        super();
        this.lastCheckTime = 0;
        this.checkInterval = 5000; // Check every 5 seconds (in milliseconds)
        this.lastTemperatureZone = 'comfortable';
        this.timeInCurrentZone = 0; // Accumulated time in current zone (in seconds)
        this.damageInterval = 30; // Apply damage every 30 seconds in extreme zones
        this.lastDamageTime = 0;
    }

    update(world, deltaTime) {
        // Only check every 5 seconds for performance
        const now = performance.now();
        if (now - this.lastCheckTime < this.checkInterval) return;

        this.lastCheckTime = now;

        // Get player and required components
        const player = world.query(['PlayerComponent', 'CreatureStatsComponent', 'PositionComponent'])[0];
        if (!player) return;

        const stats = player.getComponent('CreatureStatsComponent');
        const position = player.getComponent('PositionComponent');

        // Get current area temperature from map info
        const game = world.game;
        if (!game || !game.mapInfo) return;

        const currentTemp = game.mapInfo.temperature || 21; // Default to 21°C if not set

        // Get player's comfortable temperature range (modified by equipment)
        const modifiers = getEquipmentModifiers(world, player);
        const tempRange = stats.getComfortTempRange(modifiers.tempMin || 0, modifiers.tempMax || 0);

        // Determine temperature zone
        const zone = this.getTemperatureZone(currentTemp, tempRange);

        // Track time in zone for damage accumulation
        if (zone !== this.lastTemperatureZone) {
            this.timeInCurrentZone = 0;
            this.lastTemperatureZone = zone;
            this.lastDamageTime = 0; // Reset damage timer on zone change
            this.showZoneChangeMessage(world, player, zone, currentTemp);
        } else {
            this.timeInCurrentZone += this.checkInterval / 1000; // Convert to seconds
        }

        // Apply temperature effects based on zone
        this.applyTemperatureEffects(world, player, stats, zone, currentTemp);

        // Store temperature zone on world for other systems to access
        world.tempZone = zone;
    }

    // Determine temperature zone based on comfort range
    getTemperatureZone(currentTemp, comfortRange) {
        const { min, max } = comfortRange;

        // Comfortable: within range
        if (currentTemp >= min && currentTemp <= max) {
            return 'comfortable';
        }

        // Calculate distance from comfort zone
        let distanceFromComfort;
        if (currentTemp < min) {
            distanceFromComfort = min - currentTemp;
        } else {
            distanceFromComfort = currentTemp - max;
        }

        // Harsh: 5-15°C outside comfort zone
        if (distanceFromComfort >= 5 && distanceFromComfort < 15) {
            return 'harsh';
        }

        // Extreme: 15°C or more outside comfort zone
        if (distanceFromComfort >= 15) {
            return 'extreme';
        }

        return 'comfortable';
    }

    // Apply temperature effects
    applyTemperatureEffects(world, player, stats, zone, currentTemp) {
        // Comfort penalties are now handled by ComfortSystem reading world.tempZone
        // This method only handles stress increases and damage

        switch (zone) {
            case 'comfortable':
                // No stress or damage in comfortable zone
                break;

            case 'harsh':
                // Stress increase: +5 every 5 seconds (checkInterval)
                stats.stress = Math.min(100, stats.stress + 5);
                break;

            case 'extreme':
                // Stress increase: +10 every 5 seconds (checkInterval)
                stats.stress = Math.min(100, stats.stress + 10);

                // Body part damage: Apply every 30 seconds
                if (this.timeInCurrentZone >= this.damageInterval &&
                    (this.timeInCurrentZone - this.lastDamageTime) >= this.damageInterval) {
                    this.applyTemperatureDamage(world, player, currentTemp);
                    this.lastDamageTime = this.timeInCurrentZone;
                }
                break;
        }
    }

    // Apply body part damage from extreme temperatures
    applyTemperatureDamage(world, player, currentTemp) {
        const bodyParts = player.getComponent('BodyPartsComponent');
        if (!bodyParts) return;

        // Determine damage type (cold vs heat)
        const game = world.game;
        const modifiers = getEquipmentModifiers(world, player);
        const stats = player.getComponent('CreatureStatsComponent');
        const tempRange = stats.getComfortTempRange(modifiers.tempMin || 0, modifiers.tempMax || 0);

        const isCold = currentTemp < tempRange.min;
        const damageAmount = 5; // 5% damage per 30 seconds

        if (isCold) {
            // Cold damage - prioritize limbs (frostbite)
            // Limbs: 50%, Torso: 30%, Head: 20%
            const roll = Math.random();
            if (roll < 0.5) {
                bodyParts.damage('limbs', damageAmount);
                world.addComponent(player.id, new MessageComponent('Your limbs are freezing!', 'cyan'));
            } else if (roll < 0.8) {
                bodyParts.damage('torso', damageAmount);
                world.addComponent(player.id, new MessageComponent('The cold penetrates your core!', 'cyan'));
            } else {
                bodyParts.damage('head', damageAmount);
                world.addComponent(player.id, new MessageComponent('Your head aches from the cold!', 'cyan'));
            }
        } else {
            // Heat damage - prioritize torso (core temperature)
            // Torso: 50%, Head: 30%, Limbs: 20%
            const roll = Math.random();
            if (roll < 0.5) {
                bodyParts.damage('torso', damageAmount);
                world.addComponent(player.id, new MessageComponent('The heat is overwhelming your core!', 'red'));
            } else if (roll < 0.8) {
                bodyParts.damage('head', damageAmount);
                world.addComponent(player.id, new MessageComponent('Heatstroke is setting in!', 'red'));
            } else {
                bodyParts.damage('limbs', damageAmount);
                world.addComponent(player.id, new MessageComponent('Your skin is burning!', 'red'));
            }
        }
    }

    // Show message when zone changes
    showZoneChangeMessage(world, player, zone, temp) {
        switch (zone) {
            case 'comfortable':
                // Only show if coming from harsh/extreme
                if (this.lastTemperatureZone !== 'comfortable') {
                    world.addComponent(player.id, new MessageComponent('The temperature feels comfortable.', 'green'));
                }
                break;

            case 'harsh':
                const harshMsg = temp < 10 ? 'It\'s getting cold here.' : 'It\'s getting hot here.';
                world.addComponent(player.id, new MessageComponent(harshMsg, 'yellow'));
                break;

            case 'extreme':
                const extremeMsg = temp < 0 ? 'EXTREME COLD! Seek shelter!' : 'EXTREME HEAT! Seek shelter!';
                world.addComponent(player.id, new MessageComponent(extremeMsg, 'red'));
                break;
        }
    }
}
