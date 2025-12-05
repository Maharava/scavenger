// TimeSystem - Manages game time progression and time-based mechanics
// Handles:
// - Time advancement (30 seconds real time = 5 minutes game time)
// - Hunger depletion (80% every 12 hours, need to eat twice a day)
// - Body part healing (2% per day, +1% bonus for 8hr rest)
// - Water consumption (integrated with ship system)
// - Sleep mechanics (rest restoration, time skip, no stress during sleep)

class TimeSystem extends System {
    constructor() {
        super();
        this.lastUpdateTime = Date.now();
        this.accumulatedRealSeconds = 0; // Tracks real seconds to convert to game minutes
        this.lastHourUpdate = 0; // Track last hour for hourly updates (healing, hunger)
        this.lastDayUpdate = 1; // Track last day for midnight detection
    }

    update(world) {
        const player = world.query(['PlayerComponent', 'TimeComponent', 'CreatureStatsComponent', 'BodyPartsComponent'])[0];
        if (!player) return;

        const timeComponent = player.getComponent('TimeComponent');
        const stats = player.getComponent('CreatureStatsComponent');
        const bodyParts = player.getComponent('BodyPartsComponent');

        // Check if player is in combat - if so, pause time
        const inCombat = player.hasComponent('CombatStateComponent');
        if (inCombat) {
            // Time is paused during combat - combat system handles time increments every 4 turns
            this.lastUpdateTime = Date.now(); // Update timer to prevent time jump when combat ends
            return;
        }

        const now = Date.now();
        const deltaTimeSeconds = (now - this.lastUpdateTime) / 1000;
        this.lastUpdateTime = now;

        // Accumulate real time
        this.accumulatedRealSeconds += deltaTimeSeconds;

        // Convert accumulated real seconds to game minutes
        // REAL_SECONDS_PER_GAME_MINUTE = 6 (from constants)
        const gameMinutesToAdd = Math.floor(this.accumulatedRealSeconds / REAL_SECONDS_PER_GAME_MINUTE);

        if (gameMinutesToAdd > 0) {
            // Add game minutes to time
            timeComponent.addMinutes(gameMinutesToAdd);
            this.accumulatedRealSeconds -= gameMinutesToAdd * REAL_SECONDS_PER_GAME_MINUTE;

            // Check for day changes (midnight crossing)
            this.updateDayTracking(world, timeComponent);

            // Apply hunger and hourly updates (sleep is now instant, no special handling)
            this.applyTimeBasedMechanics(world, player, timeComponent, stats, bodyParts);
        }
    }

    // Update day tracking and handle midnight crossings
    updateDayTracking(world, timeComponent) {
        // Calculate current day from total minutes
        // Day 1 starts at minute 0, Day 2 starts at minute 1440 (24*60), etc.
        const currentDay = Math.floor(timeComponent.totalMinutes / 1440) + 1;

        // Check if we've crossed midnight (into a new day)
        if (currentDay > this.lastDayUpdate) {
            this.lastDayUpdate = currentDay;
            timeComponent.day = currentDay;

            // Update lastDayOnShip if player is on ship
            const shipEntity = world.query(['ShipComponent'])[0];
            if (shipEntity) {
                timeComponent.lastDayOnShip = currentDay;
            }
        } else if (currentDay !== timeComponent.day) {
            // Sync in case of discrepancy (e.g., after loading save)
            timeComponent.day = currentDay;
        }
    }

    // Apply hunger loss and healing based on game time progression
    applyTimeBasedMechanics(world, player, timeComponent, stats, bodyParts) {
        const currentHour = Math.floor(timeComponent.getTotalMinutes() / 60);

        // Check if we've crossed into a new hour
        if (currentHour > this.lastHourUpdate) {
            const hoursPassed = currentHour - this.lastHourUpdate;
            this.lastHourUpdate = currentHour;

            // Apply hunger loss (80% every 12 hours = ~6.67% per hour)
            const hungerLoss = HUNGER_LOSS_PER_GAME_HOUR * hoursPassed;
            stats.hunger = Math.max(MIN_STAT_VALUE, stats.hunger - hungerLoss);

            // Apply body part healing (2% per day = ~0.083% per hour)
            // Add medical skill bonus (+1% per level)
            const skills = player.getComponent('SkillsComponent');
            const medicalBonus = skills ? skills.medical : 0;
            const healingAmount = (HEALING_RATE_PER_GAME_HOUR + medicalBonus) * hoursPassed;

            let anyPartHealed = false;
            for (const [partName, efficiency] of bodyParts.parts) {
                if (efficiency < MAX_STAT_VALUE) {
                    bodyParts.heal(partName, healingAmount);
                    anyPartHealed = true;
                }
            }

            // Set healing trigger for skill system
            if (anyPartHealed && skills) {
                skills.triggers.hasHealedToday = true;
            }

            // Apply water consumption (if on ship)
            const shipEntity = world.query(['ShipComponent'])[0];
            if (shipEntity) {
                const ship = shipEntity.getComponent('ShipComponent');
                // Water consumption: roughly 0.1L per hour (2.4L per day, reasonable for one person)
                const waterConsumption = 0.1 * hoursPassed;
                ship.consumeWater(waterConsumption);
            }
        }
    }

    // Wake up player after sleep
    wakeUpPlayer(world, player) {
        const stats = player.getComponent('CreatureStatsComponent');

        // Fade back in from black
        this.fadeScreen(false);

        // Show wake up message
        world.addComponent(player.id, new MessageComponent('You wake up feeling refreshed.', 'cyan'));
    }

    // Initiate sleep for the player
    // Called from the sleep script
    startSleep(world, player, hoursToSleep) {
        const timeComponent = player.getComponent('TimeComponent');
        const stats = player.getComponent('CreatureStatsComponent');
        const bodyParts = player.getComponent('BodyPartsComponent');
        const skills = player.getComponent('SkillsComponent');

        if (!timeComponent || !stats) return;

        // Calculate rest restoration based on sleep duration
        let restRestoration = 0;
        let healingBonus = 0;

        switch (hoursToSleep) {
            case 1:
                restRestoration = REST_RESTORE_1HR;
                break;
            case 4:
                restRestoration = REST_RESTORE_4HR;
                break;
            case 8:
                restRestoration = REST_RESTORE_8HR;
                healingBonus = HEALING_BONUS_8HR_REST; // +1% bonus for 8hr rest
                break;
        }

        // Apply rest restoration
        stats.rest = Math.min(MAX_STAT_VALUE, stats.rest + restRestoration);

        // Apply healing bonus if 8 hours (with medical skill bonus)
        if (healingBonus > 0 && bodyParts) {
            const medicalBonus = skills ? skills.medical : 0;
            const totalHealing = healingBonus + medicalBonus;

            let anyPartHealed = false;
            for (const [partName, efficiency] of bodyParts.parts) {
                if (efficiency < MAX_STAT_VALUE) {
                    bodyParts.heal(partName, totalHealing);
                    anyPartHealed = true;
                }
            }

            // Set healing trigger for skill system
            if (anyPartHealed && skills) {
                skills.triggers.hasHealedToday = true;
            }
        }

        // Instantly advance time (no waiting for real-time to pass)
        const sleepDurationMinutes = hoursToSleep * 60;
        timeComponent.addMinutes(sleepDurationMinutes);

        // Update day tracking after sleep (handles midnight crossing during sleep)
        this.updateDayTracking(world, timeComponent);

        // Apply hunger and healing for the hours slept
        const hungerLoss = HUNGER_LOSS_PER_GAME_HOUR * hoursToSleep;
        stats.hunger = Math.max(MIN_STAT_VALUE, stats.hunger - hungerLoss);

        // Apply hourly healing for time slept
        const medicalBonus = skills ? skills.medical : 0;
        const healingAmount = (HEALING_RATE_PER_GAME_HOUR + medicalBonus) * hoursToSleep;

        let anyPartHealed = false;
        if (bodyParts) {
            for (const [partName, efficiency] of bodyParts.parts) {
                if (efficiency < MAX_STAT_VALUE) {
                    bodyParts.heal(partName, healingAmount);
                    anyPartHealed = true;
                }
            }

            if (anyPartHealed && skills) {
                skills.triggers.hasHealedToday = true;
            }
        }

        // Apply water consumption during sleep
        const shipEntity = world.query(['ShipComponent'])[0];
        if (shipEntity) {
            const ship = shipEntity.getComponent('ShipComponent');
            const waterConsumption = 0.1 * hoursToSleep;
            ship.consumeWater(waterConsumption);
        }

        // Update last hour tracker to prevent catch-up mechanics
        this.lastHourUpdate = Math.floor(timeComponent.getTotalMinutes() / 60);

        // Fade to black
        this.fadeScreen(true);

        // Show sleep message
        world.addComponent(player.id, new MessageComponent(`You fall asleep for ${hoursToSleep} hour${hoursToSleep > 1 ? 's' : ''}...`, 'cyan'));

        // Wake up after a brief delay (just for the fade effect)
        setTimeout(() => {
            this.wakeUpPlayer(world, player);
        }, 500); // 0.5 second delay for fade effect
    }

    // Fade screen to/from black
    fadeScreen(fadeToBlack) {
        let overlay = document.getElementById('sleep-fade-overlay');

        if (!overlay) {
            // Create overlay if it doesn't exist
            overlay = document.createElement('div');
            overlay.id = 'sleep-fade-overlay';
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.backgroundColor = 'black';
            overlay.style.opacity = '0';
            overlay.style.pointerEvents = 'none';
            overlay.style.transition = `opacity ${SLEEP_FADE_DURATION_MS}ms ease-in-out`;
            overlay.style.zIndex = '9999';
            document.body.appendChild(overlay);

            // Trigger fade after a brief delay to ensure transition works
            setTimeout(() => {
                if (fadeToBlack) {
                    overlay.style.opacity = '0.95';
                }
            }, 50);
        } else {
            // Use existing overlay
            if (fadeToBlack) {
                overlay.style.opacity = '0.95';
            } else {
                overlay.style.opacity = '0';
            }
        }
    }
}
