// HydroponicsSystem - Manages the growth of plants in hydroponics bays.
// Handles:
// - Growth timer updates for all hydroponics bays.
// - Applying farming skill bonuses to growth speed.
// - Changing plant state from 'growing' to 'grown'.

class HydroponicsSystem extends System {
    constructor() {
        super();
        this.lastHourUpdate = 0;
    }

    update(world) {
        const hydroponicsBays = world.query(['HydroponicsComponent']);
        if (hydroponicsBays.length === 0) return;

        const player = world.query(['PlayerComponent', 'SkillsComponent', 'TimeComponent'])[0];
        if (!player) return;

        const timeComponent = player.getComponent('TimeComponent');
        const currentHour = Math.floor(timeComponent.getTotalMinutes() / 60);

        if (currentHour <= this.lastHourUpdate) return;

        const hoursPassed = currentHour - this.lastHourUpdate;
        this.lastHourUpdate = currentHour;
        
        const farmingSkill = player.getComponent('SkillsComponent').farming;

        for (const bay of hydroponicsBays) {
            const hydroponics = bay.getComponent('HydroponicsComponent');
            if (hydroponics.state === 'growing') {
                const growthReduction = hoursPassed * 60 * (1 + (farmingSkill * 0.05)) * HYDROPHONICS_TIME_MULTIPLIER;
                hydroponics.growthTimer -= growthReduction;

                if (hydroponics.growthTimer <= 0) {
                    hydroponics.state = 'grown';
                    hydroponics.growthTimer = 0;
                }
            }
        }
    }
}
