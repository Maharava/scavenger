// gamedata/producer-config.js
// Configuration for different producer types (hydroponics, smelters, recyclers, etc.)

const PRODUCER_TYPES = {
    'HYDROPONICS': {
        name: 'Hydroponics Bay',

        // Visual properties
        char: 'H',
        colour: '#0f0',

        // Skill integration
        linkedSkill: 'farming',
        skillBonuses: {
            speedMultiplier: 0.05,        // +5% processing speed per skill level
            dailyReduction: 1.0,          // -1% of max time per skill level per day (at 0000)
            secondaryOutputBonus: 0.02    // +2% to secondary/tertiary output chances per level
        },

        // UI strings
        emptyMessage: 'Select a seed to plant',
        processingMessagePrefix: 'Growing',           // "Growing LETTUCE_SEEDS..."
        readyMessage: 'The plant is ready to harvest.',
        startActionLabel: 'Plant',                    // "Plant Lettuce Seeds"
        collectActionLabel: 'Harvest',
        startSuccessPrefix: 'Planted',                // "Planted Lettuce Seeds."
        collectSuccessPrefix: 'Harvested',            // "Harvested 3 Lettuce."
        noInputMessage: 'You have no seeds to plant.',
        foundSecondaryMessage: 'You found a seed!'    // Generic secondary output message
    }

    // Future producer types can be added here:
    // 'SMELTER': { ... },
    // 'RECYCLER': { ... },
    // 'BIOREACTOR': { ... }
};
