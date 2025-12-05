// ProducerSystem - Generic system for producer-type interactables
// NEW DEADLINE-BASED APPROACH:
// - When planted, calculates end date/time using base recipe time (no skill applied)
// - At midnight (0000), reduces end time by (baseTime × 2% × skillLevel)
// - Checks are only done at midnight or when returning to ship after midnight
// - No continuous timer updates needed
// Handles:
// - Midnight skill reduction application
// - Off-ship return detection and single reduction application
// - Producer state is checked on interaction, not continuously
// - Hydroponics water consumption (0.5L per hour per active bay)

class ProducerSystem extends System {
    constructor() {
        super();
        this.lastCheckedDay = 1; // Track last day we checked for midnight
        this.lastHourUpdate = 0; // Track last hour for water consumption
    }

    update(world) {
        const producers = world.query(['ProducerComponent']);
        if (producers.length === 0) return;

        const player = world.query(['PlayerComponent', 'SkillsComponent', 'TimeComponent'])[0];
        if (!player) return;

        const timeComponent = player.getComponent('TimeComponent');
        const skillsComponent = player.getComponent('SkillsComponent');
        const currentDay = timeComponent.day;

        // Check if we've crossed midnight since last check
        if (currentDay > this.lastCheckedDay) {
            this.lastCheckedDay = currentDay;

            // Check if player just returned to ship (off-ship detection)
            const shipEntity = world.query(['ShipComponent'])[0];
            if (shipEntity) {
                // Player is on ship now
                if (currentDay > timeComponent.lastDayOnShip) {
                    // Player was off-ship and just returned - apply ONE reduction
                    this.#applySkillReductions(producers, skillsComponent, currentDay, true);
                } else {
                    // Normal midnight crossing while on ship
                    this.#applySkillReductions(producers, skillsComponent, currentDay, false);
                }
            }
        }

        // Check for hourly updates (water consumption for hydroponics)
        const currentHour = Math.floor(timeComponent.getTotalMinutes() / 60);
        if (currentHour > this.lastHourUpdate) {
            const hoursPassed = currentHour - this.lastHourUpdate;
            this.lastHourUpdate = currentHour;

            // Apply water consumption for active hydroponics bays
            this.#applyWaterConsumption(world, producers, hoursPassed);
        }
    }

    // Apply skill-based time reductions at midnight
    #applySkillReductions(producers, skillsComponent, currentDay, isReturningToShip) {
        for (const producer of producers) {
            const producerComp = producer.getComponent('ProducerComponent');

            // Only process active producers
            if (producerComp.state !== 'processing') continue;

            // Check if we already applied reduction today (prevent duplicates)
            if (producerComp.lastReductionDay >= currentDay && !isReturningToShip) continue;

            const producerType = PRODUCER_TYPES[producerComp.producerType];
            if (!producerType || !producerType.linkedSkill) continue;

            const skillLevel = skillsComponent[producerType.linkedSkill] || 0;
            if (skillLevel === 0) continue;

            // Calculate reduction: baseTime × 2% × skillLevel (in minutes)
            const reductionPercent = 0.02 * skillLevel;
            const reductionMinutes = producerComp.baseProductionTime * reductionPercent;

            // Subtract from end time (moves deadline earlier)
            producerComp.endTotalMinutes -= reductionMinutes;

            // Update last reduction day
            producerComp.lastReductionDay = currentDay;

            // Note: We don't change state here - that's checked on interaction
        }
    }

    // Apply water consumption for active hydroponics bays
    #applyWaterConsumption(world, producers, hoursPassed) {
        const shipEntity = world.query(['ShipComponent'])[0];
        if (!shipEntity) return; // Not on ship, no water consumption

        const ship = shipEntity.getComponent('ShipComponent');

        // Count active hydroponics bays
        let activeHydroponicsBays = 0;
        for (const producer of producers) {
            const producerComp = producer.getComponent('ProducerComponent');
            if (producerComp.producerType === 'HYDROPONICS' && producerComp.state === 'processing') {
                activeHydroponicsBays++;
            }
        }

        if (activeHydroponicsBays > 0) {
            // Consume water per active bay per hour (configurable via HYDROPONICS_WATER_PER_HOUR)
            const waterConsumption = HYDROPONICS_WATER_PER_HOUR * activeHydroponicsBays * hoursPassed;
            ship.consumeWater(waterConsumption);
        }
    }

    // Helper method for menu actions to check if producer is ready
    // Called from interaction scripts
    static isProducerReady(producer, currentTotalMinutes) {
        const producerComp = producer.getComponent('ProducerComponent');
        if (producerComp.state !== 'processing') return false;

        return currentTotalMinutes >= producerComp.endTotalMinutes;
    }

    // Helper method to get remaining time in hours (rounded up)
    static getRemainingHours(producer, currentTotalMinutes) {
        const producerComp = producer.getComponent('ProducerComponent');
        if (producerComp.state !== 'processing') return 0;

        const remainingMinutes = Math.max(0, producerComp.endTotalMinutes - currentTotalMinutes);
        return Math.ceil(remainingMinutes / 60); // Round up
    }
}
