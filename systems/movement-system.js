// MovementSystem - Handles entity movement, collision detection, and combat movement limits

class MovementSystem extends System {
    update(world) {
        const entities = world.query(['ActionComponent', 'PositionComponent']);
        const solidEntities = world.query(['PositionComponent', 'SolidComponent']);

        // Use actual map dimensions from layout, not viewport dimensions
        const mapInfo = world.game.mapInfo;
        const width = mapInfo && mapInfo.width ? mapInfo.width : world.game.width;
        const height = mapInfo && mapInfo.height ? mapInfo.height : world.game.height;

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

        // 3. Armor penalty - heavy armor reduces movement
        const equipped = entity.getComponent('EquippedItemsComponent');
        if (equipped && equipped.body) {
            const armorEntity = world.getEntity(equipped.body);
            if (armorEntity) {
                // Calculate total armor weight including all attached parts
                let totalArmorWeight = 0;

                // Add armor frame weight
                const armorItem = armorEntity.getComponent('ItemComponent');
                if (armorItem) {
                    totalArmorWeight += armorItem.weight;
                }

                // Add attached parts weight
                const attachments = armorEntity.getComponent('AttachmentSlotsComponent');
                if (attachments) {
                    for (const slotName in attachments.slots) {
                        const slot = attachments.slots[slotName];
                        if (slot.entity_id) {
                            const partEntity = world.getEntity(slot.entity_id);
                            if (partEntity) {
                                const partItem = partEntity.getComponent('ItemComponent');
                                if (partItem) {
                                    totalArmorWeight += partItem.weight;
                                }
                            }
                        }
                    }
                }

                // Apply movement penalty based on armor weight
                // Light armor (< 2000g): no penalty
                // Medium armor (2000-3000g): -1 movement
                // Heavy armor (> 3000g): -2 movement
                if (totalArmorWeight >= 3000) {
                    movementMax -= 2;
                } else if (totalArmorWeight >= 2000) {
                    movementMax -= 1;
                }
            }
        }

        // 4. Temperature zone penalty (from TemperatureSystem)
        const tempZone = world.tempZone || 'comfortable';
        if (tempZone === 'harsh') {
            movementMax -= 1; // -1 movement in harsh conditions
        } else if (tempZone === 'extreme') {
            movementMax -= 2; // -2 movement in extreme conditions
        }

        // Minimum 1 tile (always can move at least 1 tile)
        return Math.max(1, movementMax);
    }
}
