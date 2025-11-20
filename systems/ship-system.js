// ShipSystem - Manages ship resource consumption

class ShipSystem extends System {
    constructor() {
        super();
        this.elapsedTime = 0; // Track elapsed time in milliseconds
        this.waterConsumptionRate = 0.5; // Litres per interval
        this.waterConsumptionInterval = WATER_CONSUMPTION_INTERVAL_MS;
    }

    update(world, deltaTime) {
        // Find the ship entity
        const ships = world.query(['ShipComponent']);
        if (ships.length === 0) {
            // No ship on this map, reset timer
            this.elapsedTime = 0;
            return;
        }

        const shipEntity = ships[0];
        const ship = shipEntity.getComponent('ShipComponent');

        // Accumulate time
        this.elapsedTime += deltaTime;

        // Check if we've reached the consumption interval
        if (this.elapsedTime >= this.waterConsumptionInterval) {
            // Consume water
            const consumed = ship.consumeWater(this.waterConsumptionRate);

            // Reset timer (keeping any overflow for accuracy)
            this.elapsedTime -= this.waterConsumptionInterval;

            // Optional: Add a message when water is consumed
            // world.addComponent(shipEntity.id, new MessageComponent(`Water consumed: ${this.waterConsumptionRate}L`, 'grey'));

            // Check if water is low (below 20%)
            if (ship.water < ship.maxWater * 0.2 && ship.water > 0) {
                // Optional: Add warning message
                // world.addComponent(shipEntity.id, new MessageComponent('Warning: Water running low!', 'orange'));
            } else if (ship.water <= 0) {
                // Optional: Add critical message
                // world.addComponent(shipEntity.id, new MessageComponent('Critical: Out of water!', 'red'));
            }
        }
    }
}
