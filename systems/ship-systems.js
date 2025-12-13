// Ship Systems - Life Support and Water Recycler functionality

class LifeSupportSystem extends System {
    constructor() {
        super();
        this.lastUpdateTime = 0;
    }

    update(world) {
        // Only run on ship map
        if (world.currentMap !== 'SHIP') return;

        const currentTime = world.gameTime;

        // Run once per game minute
        if (currentTime - this.lastUpdateTime < 1) return;
        this.lastUpdateTime = currentTime;

        const player = world.getPlayer();
        if (!player) return;

        // Find Life Support entity
        const lifeSupportEntities = world.query(['LifeSupportComponent']);
        if (lifeSupportEntities.length === 0) return;

        const lifeSupport = lifeSupportEntities[0].getComponent('LifeSupportComponent');
        const stats = player.getComponent('StatsComponent');

        if (!stats) return;

        const currentComfort = stats.getStat('comfort');
        const baseComfort = lifeSupport.baseComfort;
        const maxComfort = lifeSupport.maxComfort;

        // Prevent comfort from going below base on ship
        if (currentComfort < baseComfort) {
            stats.setStat('comfort', Math.min(currentComfort + 1, baseComfort));
        }

        // Cap comfort at max
        if (currentComfort > maxComfort) {
            stats.setStat('comfort', maxComfort);
        }
    }
}
