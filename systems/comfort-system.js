// ComfortSystem - Manages comfort modifiers and stress adjustments

class ComfortSystem extends System {
    constructor() {
        super();
        this.lastUpdateTime = Date.now();
        this.stressAdjustmentTimer = 0; // Timer for stress adjustments
    }

    update(world) {
        const now = Date.now();
        const deltaTime = (now - this.lastUpdateTime) / 1000; // Convert to seconds
        this.lastUpdateTime = now;

        // Update stress adjustment timer
        this.stressAdjustmentTimer += deltaTime;

        const players = world.query(['PlayerComponent', 'CreatureStatsComponent', 'ComfortModifiersComponent']);
        for (const player of players) {
            const stats = player.getComponent('CreatureStatsComponent');
            const comfortMods = player.getComponent('ComfortModifiersComponent');
            const timeComponent = player.getComponent('TimeComponent');
            const inventory = player.getComponent('InventoryComponent');
            const equipped = player.getComponent('EquippedItemsComponent');

            // Update comfort modifiers (remove expired ones)
            comfortMods.updateModifiers(deltaTime);

            // === CALCULATE BASE COMFORT ===
            let baseComfort = BASE_COMFORT; // Start at 50

            // 1. Armor comfort modifier (flat, while equipped)
            if (equipped && equipped.body) {
                const armor = world.getEntity(equipped.body);
                if (armor) {
                    const armorStats = armor.getComponent('ArmourStatsComponent');
                    if (armorStats) {
                        baseComfort += armorStats.comfort;
                    }
                }
            }

            // 2. Weight penalty (-10 if carrying >= 10kg)
            if (inventory) {
                const totalWeight = inventory.getTotalWeight(world);
                if (totalWeight >= 10000) { // 10kg = 10000g
                    baseComfort -= 10;
                }
            }

            // 3. Hunger modifiers
            if (stats.hunger < 25) {
                baseComfort -= 20;
            } else if (stats.hunger < 50) {
                baseComfort -= 10;
            } else if (stats.hunger > 80) {
                baseComfort += 10;
            }

            // 4. Temperature modifier (applied by TemperatureSystem - baseComfort already modified)

            // Store base comfort for reference
            stats.baseComfort = baseComfort;

            // === CALCULATE FINAL COMFORT ===
            // Final comfort = baseComfort + timed modifiers
            const totalTimedModifier = comfortMods.getTotalModifier();
            stats.comfort = Math.max(MIN_STAT_VALUE, Math.min(MAX_STAT_VALUE, baseComfort + totalTimedModifier));

            // === APPLY STRESS CAP ===
            // Max stress = 100 - (comfort - 40)
            // At comfort 100: max stress = 60
            // At comfort 40: max stress = 100
            // At comfort 0: max stress = 100 (capped at 100)
            const maxStress = Math.max(60, 100 - (stats.comfort - 40));
            stats.stress = Math.min(stats.stress, maxStress);

            // === PERIODICALLY ADJUST STRESS BASED ON COMFORT ===
            // Do NOT adjust stress if player is sleeping
            const isSleeping = timeComponent && timeComponent.isSleeping;
            if (this.stressAdjustmentTimer >= STRESS_ADJUSTMENT_INTERVAL_SECONDS && !isSleeping) {
                if (stats.comfort >= 0 && stats.comfort <= 20) {
                    // Very low comfort: +2 stress
                    stats.stress = Math.min(MAX_STAT_VALUE, stats.stress + 2);
                } else if (stats.comfort >= 21 && stats.comfort <= 40) {
                    // Low comfort: +1 stress
                    stats.stress = Math.min(MAX_STAT_VALUE, stats.stress + 1);
                } else if (stats.comfort >= 61 && stats.comfort <= 80) {
                    // High comfort: -1 stress
                    stats.stress = Math.max(MIN_STAT_VALUE, stats.stress - 1);
                } else if (stats.comfort >= 81 && stats.comfort <= 100) {
                    // Very high comfort: -2 stress
                    stats.stress = Math.max(MIN_STAT_VALUE, stats.stress - 2);
                }
                // 41-60 comfort: no stress change (neutral zone)
            }
        }

        // Reset timer
        if (this.stressAdjustmentTimer >= STRESS_ADJUSTMENT_INTERVAL_SECONDS) {
            this.stressAdjustmentTimer = 0;
        }
    }
}
