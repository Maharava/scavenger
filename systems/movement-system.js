// MovementSystem - Handles entity movement, collision detection, and combat movement limits

class MovementSystem extends System {
    update(world) {
        const entities = world.query(['ActionComponent', 'PositionComponent']);
        const solidEntities = world.query(['PositionComponent', 'SolidComponent']);

        // Use map dimensions, not viewport dimensions
        const width = world.mapWidth || world.game.width;
        const height = world.mapHeight || world.game.height;

        for (const entity of entities) {
            const action = entity.getComponent('ActionComponent');
            if (action.name !== 'move') continue;

            // Check if entity is in combat and has movement limits
            const inCombat = entity.hasComponent('CombatStateComponent');
            if (inCombat) {
                const combatant = entity.getComponent('CombatantComponent');
                if (combatant) {
                    // Calculate maximum movement for this turn
                    const movementMax = this.calculateMovementMax(world, entity, combatant);

                    // Check if movement exhausted
                    if (combatant.movementUsed >= movementMax) {
                        if (entity.hasComponent('PlayerComponent')) {
                            world.addComponent(entity.id, new MessageComponent(
                                `No movement remaining! (${combatant.movementUsed}/${movementMax})`,
                                'red'
                            ));
                        }
                        entity.removeComponent('ActionComponent');
                        continue;
                    }
                }
            }

            const pos = entity.getComponent('PositionComponent');
            const targetX = pos.x + action.payload.dx;
            const targetY = pos.y + action.payload.dy;

            if (targetX < 0 || targetX >= width || targetY < 0 || targetY >= height) {
                entity.removeComponent('ActionComponent');
                continue;
            }

            let collision = false;
            for (const solid of solidEntities) {
                if (solid.id === entity.id) continue;
                const solidPos = solid.getComponent('PositionComponent');
                if (solidPos.x === targetX && solidPos.y === targetY) {
                    collision = true;
                    break;
                }
            }

            if (!collision) {
                pos.x = targetX;
                pos.y = targetY;

                // Update facing direction for entities with FacingComponent
                const facing = entity.getComponent('FacingComponent');
                if (facing) {
                    facing.setFromMovement(action.payload.dx, action.payload.dy);
                }

                // If a light source moves, mark the lighting system as dirty
                if (entity.hasComponent('LightSourceComponent')) {
                    const lightingSystem = world.systems.find(s => s instanceof LightingSystem);
                    if (lightingSystem) {
                        lightingSystem.markDirty();
                    }
                }

                // Track movement usage in combat
                if (inCombat) {
                    const combatant = entity.getComponent('CombatantComponent');
                    if (combatant) {
                        combatant.movementUsed++;
                    }
                }
            }

            entity.removeComponent('ActionComponent');
        }
    }

    calculateMovementMax(world, entity, combatant) {
        let movementMax = combatant.movementPerTurn; // Base 4 tiles

        // 1. Limb damage penalty
        const bodyParts = entity.getComponent('BodyPartsComponent');
        if (bodyParts) {
            const limbsEfficiency = bodyParts.getPart('limbs');
            if (limbsEfficiency < 70) {
                const efficiencyLost = 100 - limbsEfficiency;
                const penalty = Math.floor(efficiencyLost / 30);
                movementMax -= penalty;
            }
        }

        // 2. Weight penalty (encumbrance)
        const inventory = entity.getComponent('InventoryComponent');
        if (inventory) {
            const totalWeight = inventory.getTotalWeight(world);
            const maxWeight = inventory.maxWeight;
            if (totalWeight > maxWeight) {
                const overWeight = totalWeight - maxWeight;
                const penalty = Math.floor(overWeight / 1000);
                movementMax -= penalty;
            }
        }

        // 3. Armor penalty (future implementation - heavy armor)
        // TODO: Add armor weight penalty

        // Minimum 1 tile (always can move at least 1 tile)
        return Math.max(1, movementMax);
    }
}
