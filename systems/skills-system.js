// SkillsSystem - Manages skill progression and leveling
// Handles:
// - Daily trigger resets at midnight
// - End-of-day skill checks (Medical, Cooking)
// - Immediate skill checks (Farming, Repair)
// - Death regression
// - Stress-based learning penalties

class SkillsSystem extends System {
    constructor() {
        super();
        this.lastCheckDay = -1; // Track which day we last checked
    }

    update(world) {
        const player = world.query(['PlayerComponent', 'SkillsComponent', 'TimeComponent', 'CreatureStatsComponent'])[0];
        if (!player) return;

        const skills = player.getComponent('SkillsComponent');
        const timeComp = player.getComponent('TimeComponent');
        const stats = player.getComponent('CreatureStatsComponent');

        if (!skills || !timeComp || !stats) return;

        const currentDay = Math.floor(timeComp.getTotalMinutes() / (24 * 60));
        const currentHour = timeComp.hours;
        const currentMinute = timeComp.minutes;

        // Check for day transition (midnight reset)
        if (currentDay > this.lastCheckDay) {
            // New day - do end-of-day checks for the previous day first
            if (this.lastCheckDay >= 0) {
                this.performEndOfDayChecks(world, player, skills, stats);
            }

            // Reset daily triggers for the new day
            this.resetDailyTriggers(skills, currentDay);
            this.lastCheckDay = currentDay;
        }
    }

    // Reset daily triggers at midnight
    resetDailyTriggers(skills, newDay) {
        skills.triggers.hasHealedToday = false;
        skills.triggers.hasCookedToday = false;
        skills.triggers.harvestsToday = 0;
        skills.triggers.repairsToday = 0;
        // Note: lastLevelUpDay tracks are not reset, they persist across days
    }

    // Perform end-of-day skill checks for Medical and Cooking
    performEndOfDayChecks(world, player, skills, stats) {
        // Medical skill check - only if healed today
        if (skills.triggers.hasHealedToday) {
            this.tryLevelUpSkill(world, player, skills, stats, 'medical');
        }

        // Cooking skill check - only if cooked today
        if (skills.triggers.hasCookedToday) {
            this.tryLevelUpSkill(world, player, skills, stats, 'cooking');
        }
    }

    // Try to level up a skill based on current level and stress
    tryLevelUpSkill(world, player, skills, stats, skillName) {
        const currentLevel = skills[skillName];

        // Check if already at max natural level
        const maxNaturalLevel = this.getMaxNaturalLevel(skillName);
        if (currentLevel >= maxNaturalLevel) return;

        // Get base chance for this level transition
        let chance = SKILL_LEVELUP_CHANCES[currentLevel] || 0;

        // Apply stress penalty if stress is high (>60)
        if (stats.stress > SKILL_STRESS_THRESHOLD) {
            chance *= 0.5; // Halve the chance when stressed
        }

        // Roll for level up
        if (Math.random() < chance) {
            skills[skillName]++;
            this.showLevelUpMessage(world, player, skillName, skills[skillName]);
        }
    }

    // Get maximum natural level for a skill
    getMaxNaturalLevel(skillName) {
        switch (skillName) {
            case 'medical':
            case 'farming':
            case 'repair':
                return 3;
            case 'cooking':
                return 5;
            default:
                return 0;
        }
    }

    // Show level up notification
    showLevelUpMessage(world, player, skillName, newLevel) {
        const skillDisplayName = skillName.charAt(0).toUpperCase() + skillName.slice(1);
        let bonusText = '';

        switch (skillName) {
            case 'medical':
                bonusText = `Daily healing rate +${newLevel}%`;
                break;
            case 'cooking':
                bonusText = 'New recipes unlocked';
                break;
            case 'farming':
                bonusText = 'Plants grow faster';
                break;
            case 'repair':
                bonusText = 'Can repair more items';
                break;
        }

        world.addComponent(player.id, new MessageComponent(
            `★ ${skillDisplayName.toUpperCase()} increased to Level ${newLevel}! ★\n${bonusText}`,
            'cyan'
        ));
    }

    // Check for farming skill level up (called after harvest)
    checkFarmingLevelUp(world, player) {
        const skills = player.getComponent('SkillsComponent');
        const stats = player.getComponent('CreatureStatsComponent');
        const timeComp = player.getComponent('TimeComponent');

        if (!skills || !stats || !timeComp) return;

        const currentDay = Math.floor(timeComp.getTotalMinutes() / (24 * 60));

        // Increment harvest count
        skills.triggers.harvestsToday++;

        // Only allow 3 checks per day, and only 1 level up per day
        if (skills.triggers.harvestsToday > 3) return;
        if (skills.triggers.lastLevelUpDay.farming === currentDay) return;

        // Try to level up
        const leveledUp = this.attemptSkillLevelUp(world, player, skills, stats, 'farming');
        if (leveledUp) {
            skills.triggers.lastLevelUpDay.farming = currentDay;
        }
    }

    // Check for repair skill level up (called after successful repair)
    checkRepairLevelUp(world, player) {
        const skills = player.getComponent('SkillsComponent');
        const stats = player.getComponent('CreatureStatsComponent');
        const timeComp = player.getComponent('TimeComponent');

        if (!skills || !stats || !timeComp) return;

        const currentDay = Math.floor(timeComp.getTotalMinutes() / (24 * 60));

        // Increment repair count
        skills.triggers.repairsToday++;

        // Only allow 1 level up per day
        if (skills.triggers.lastLevelUpDay.repair === currentDay) return;

        // Try to level up
        const leveledUp = this.attemptSkillLevelUp(world, player, skills, stats, 'repair');
        if (leveledUp) {
            skills.triggers.lastLevelUpDay.repair = currentDay;
        }
    }

    // Attempt skill level up (returns true if leveled up)
    attemptSkillLevelUp(world, player, skills, stats, skillName) {
        const currentLevel = skills[skillName];

        // Check if already at max natural level
        const maxNaturalLevel = this.getMaxNaturalLevel(skillName);
        if (currentLevel >= maxNaturalLevel) return false;

        // Get base chance for this level transition
        let chance = SKILL_LEVELUP_CHANCES[currentLevel] || 0;

        // Apply stress penalty if stress is high (>60)
        if (stats.stress > SKILL_STRESS_THRESHOLD) {
            chance *= 0.5; // Halve the chance when stressed
        }

        // Roll for level up
        if (Math.random() < chance) {
            skills[skillName]++;
            this.showLevelUpMessage(world, player, skillName, skills[skillName]);
            return true;
        }

        return false;
    }

    // Handle skill regression on death
    applyDeathPenalty(world, player) {
        const skills = player.getComponent('SkillsComponent');
        if (!skills) return;

        // Get all skills with level > 0
        const skillsAboveZero = [];
        if (skills.medical > 0) skillsAboveZero.push('medical');
        if (skills.cooking > 0) skillsAboveZero.push('cooking');
        if (skills.farming > 0) skillsAboveZero.push('farming');
        if (skills.repair > 0) skillsAboveZero.push('repair');

        if (skillsAboveZero.length === 0) return;

        // Select up to 2 random skills
        const skillsToCheck = [];
        const numSkillsToSelect = Math.min(SKILL_DEATH_REGRESSION_COUNT, skillsAboveZero.length);

        for (let i = 0; i < numSkillsToSelect; i++) {
            const randomIndex = Math.floor(Math.random() * skillsAboveZero.length);
            skillsToCheck.push(skillsAboveZero[randomIndex]);
            skillsAboveZero.splice(randomIndex, 1);
        }

        // Roll for regression on each selected skill
        for (const skillName of skillsToCheck) {
            const currentLevel = skills[skillName];
            const lossChance = SKILL_DEATH_BASE_CHANCE + (currentLevel * SKILL_DEATH_LEVEL_PENALTY);

            if (Math.random() < lossChance) {
                skills[skillName]--;
                const skillDisplayName = skillName.charAt(0).toUpperCase() + skillName.slice(1);
                world.addComponent(player.id, new MessageComponent(
                    `${skillDisplayName} skill decreased to Level ${skills[skillName]}`,
                    'red'
                ));
            }
        }
    }
}
