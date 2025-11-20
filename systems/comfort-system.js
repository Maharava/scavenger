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

            // Update comfort modifiers (remove expired ones)
            comfortMods.updateModifiers(deltaTime);

            // Calculate total comfort (base comfort + modifiers)
            const totalModifier = comfortMods.getTotalModifier();
            stats.comfort = Math.max(MIN_STAT_VALUE, Math.min(MAX_STAT_VALUE, BASE_COMFORT + totalModifier));

            // Periodically adjust stress based on comfort
            // BUT: Do NOT adjust stress if player is sleeping
            const isSleeping = timeComponent && timeComponent.isSleeping;
            if (this.stressAdjustmentTimer >= STRESS_ADJUSTMENT_INTERVAL_SECONDS && !isSleeping) {
                if (stats.comfort <= LOW_COMFORT_THRESHOLD) {
                    // Low comfort increases stress (penalty)
                    stats.stress = Math.min(MAX_STAT_VALUE, stats.stress + 1);
                } else if (stats.comfort >= HIGH_COMFORT_THRESHOLD) {
                    // High comfort decreases stress (relief)
                    stats.stress = Math.max(MIN_STAT_VALUE, stats.stress - 1);
                }
            }
        }

        // Reset timer
        if (this.stressAdjustmentTimer >= STRESS_ADJUSTMENT_INTERVAL_SECONDS) {
            this.stressAdjustmentTimer = 0;
        }
    }
}
