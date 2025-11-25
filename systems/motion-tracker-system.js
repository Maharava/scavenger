// Motion Tracker System
// Detects enemies within range when Motion Tracker tool is equipped
// Detection chance = (100 - enemy.stealth)%
// Only checks when enemies ENTER the tracker's range

class MotionTrackerSystem extends System {
    constructor() {
        super();
        this.trackedEnemies = new Map();  // Map<enemyId, lastFrameInRange>
    }

    update(world) {
        const player = world.query(['PlayerComponent', 'PositionComponent'])[0];
        if (!player) return;

        const equipped = player.getComponent('EquippedItemsComponent');
        if (!equipped) return;

        // Check if player has Motion Tracker equipped in either tool slot
        let motionTracker = null;
        let trackerRange = 0;

        const toolSlots = [equipped.tool1, equipped.tool2];
        for (const toolId of toolSlots) {
            if (!toolId) continue;

            const toolEntity = world.getEntity(toolId);
            if (!toolEntity) continue;

            const toolStats = toolEntity.getComponent('ToolStatsComponent');
            if (toolStats && toolStats.specialAbility === 'reveal_enemies') {
                motionTracker = toolEntity;
                trackerRange = toolStats.abilityArgs?.range || 25;
                break;  // Found tracker, use first one
            }
        }

        // If no motion tracker equipped, clear all tracked enemies and exit
        if (!motionTracker) {
            this.clearAllTracking(world);
            this.trackedEnemies.clear();
            return;
        }

        // Get player position
        const playerPos = player.getComponent('PositionComponent');

        // Get all enemies with AI components
        const enemies = world.query(['AIComponent', 'PositionComponent']);
        const currentFrameInRange = new Set();

        for (const enemy of enemies) {
            const enemyPos = enemy.getComponent('PositionComponent');
            const ai = enemy.getComponent('AIComponent');

            // Calculate distance to player
            const distance = Math.abs(playerPos.x - enemyPos.x) + Math.abs(playerPos.y - enemyPos.y);

            // Check if enemy is within tracker range
            if (distance <= trackerRange) {
                currentFrameInRange.add(enemy.id);

                // Check if enemy just entered range (wasn't in range last frame)
                const wasInRangeBefore = this.trackedEnemies.has(enemy.id);

                if (!wasInRangeBefore && !ai.trackedByMotionTracker) {
                    // Enemy just entered range - roll detection chance
                    // Detection chance = 100 - enemy stealth
                    const detectionChance = 100 - ai.stealth;
                    const roll = Math.random() * 100;

                    if (roll <= detectionChance) {
                        // Successfully detected!
                        ai.trackedByMotionTracker = true;
                        this.revealEnemy(world, enemy);

                        // Notify player
                        const enemyName = enemy.getComponent('NameComponent');
                        world.addComponent(player.id, new MessageComponent(
                            `Motion Tracker: ${enemyName ? enemyName.name : 'Enemy'} detected!`,
                            'cyan'
                        ));
                    }
                }
            } else {
                // Enemy left range - untrack them
                if (ai.trackedByMotionTracker) {
                    ai.trackedByMotionTracker = false;
                    this.unrevealEnemy(world, enemy);
                }
            }
        }

        // Update tracked enemies map for next frame
        this.trackedEnemies.clear();
        for (const enemyId of currentFrameInRange) {
            this.trackedEnemies.set(enemyId, true);
        }
    }

    // Reveal an enemy by making them visible regardless of lighting
    // (Motion tracker can see through walls and in darkness)
    revealEnemy(world, enemy) {
        const visibility = enemy.getComponent('VisibilityStateComponent');
        if (visibility) {
            visibility.state = 'lit';  // Force visible
        }
    }

    // Remove motion tracker reveal from enemy
    unrevealEnemy(world, enemy) {
        const visibility = enemy.getComponent('VisibilityStateComponent');
        if (visibility && visibility.state === 'lit') {
            // Reset to default state (will be recalculated by lighting system)
            visibility.state = 'never_seen';
        }
    }

    // Clear all tracking when motion tracker is unequipped
    clearAllTracking(world) {
        const enemies = world.query(['AIComponent']);
        for (const enemy of enemies) {
            const ai = enemy.getComponent('AIComponent');
            if (ai.trackedByMotionTracker) {
                ai.trackedByMotionTracker = false;
                this.unrevealEnemy(world, enemy);
            }
        }
    }
}
