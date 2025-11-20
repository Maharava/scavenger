// DamageSystem - Processes damage events, applies armor/resistance, updates body parts

class DamageSystem extends System {
    update(world) {
        // Process all entities with DamageEventComponent
        const damagedEntities = world.query(['DamageEventComponent']);

        for (const entity of damagedEntities) {
            // Get the damage event component
            const damageEvent = entity.components.get('DamageEventComponent');

            if (damageEvent) {
                this.processDamageEvent(world, entity, damageEvent);
            }

            // Remove damage event component after processing
            world.removeComponent(entity.id, 'DamageEventComponent');
        }
    }

    processDamageEvent(world, target, event) {
        const bodyParts = target.getComponent('BodyPartsComponent');
        if (!bodyParts) return;  // Can't damage entity without body parts

        // 1. Select body part (random if not specified)
        const hitPart = event.bodyPart || BodyPartHitTable.prototype.getRandomHitPart.call(new BodyPartHitTable(), bodyParts);

        // 2. Get target's armor (if equipped)
        const equipped = target.getComponent('EquippedItemsComponent');
        let armor = null;
        let armorStats = null;

        if (equipped && equipped.body) {
            armor = world.getEntity(equipped.body);
            if (armor) {
                armorStats = armor.getComponent('ArmourStatsComponent');
                if (!armorStats) {
                    // Calculate armor stats if missing
                    updateArmourStats(world, armor);
                    armorStats = armor.getComponent('ArmourStatsComponent');
                }
            }
        }

        // 3. Calculate damage
        let finalDamage = event.amount;
        let armorDamage = 0;
        let bodyDamage = 0;
        let passthrough = false;

        if (armorStats && armorStats.durability > 0) {
            // Has armor
            const resistance = armorStats.resistances[event.damageType] || 0;
            const damageAfterResist = finalDamage * (1 - resistance / 100);

            // Roll passthrough
            const passthroughChance = armorStats.getPassthroughChance();
            const roll = Math.random() * 100;
            passthrough = roll <= passthroughChance;

            if (passthrough) {
                // Penetrated: split damage
                armorDamage = damageAfterResist / 2;
                bodyDamage = damageAfterResist / 2;

                world.addComponent(target.id, new MessageComponent(
                    `Hit ${hitPart}! Penetrated armor (${armorDamage.toFixed(1)} armor, ${bodyDamage.toFixed(1)} body)`,
                    'orange'
                ));
            } else {
                // Blocked: all to armor
                armorDamage = damageAfterResist;
                bodyDamage = 0;

                world.addComponent(target.id, new MessageComponent(
                    `Hit ${hitPart}! Blocked by armor (${armorDamage.toFixed(1)} armor damage)`,
                    'yellow'
                ));
            }

            // Apply armor damage
            armorStats.applyDamage(armorDamage);

            // If armor destroyed, message
            if (armorStats.durability <= 0) {
                world.addComponent(target.id, new MessageComponent(
                    'Armor destroyed!',
                    'red'
                ));

                // Update morale if humanoid enemy
                const ai = target.getComponent('AIComponent');
                if (ai && ai.morale !== undefined) {
                    ai.morale -= 25;
                    if (ai.morale < COMBAT_CONSTANTS.FLEE_MORALE_THRESHOLD) {
                        ai.behaviorType = 'fleeing';
                        world.addComponent(target.id, new MessageComponent('Enemy is fleeing!', 'cyan'));
                    }
                }
            }
        } else {
            // No armor or armor destroyed
            bodyDamage = finalDamage;

            world.addComponent(target.id, new MessageComponent(
                `Hit ${hitPart}! ${bodyDamage.toFixed(1)} damage`,
                'orange'
            ));
        }

        // 4. Dodge roll (last chance)
        if (bodyDamage > 0) {
            const combatant = target.getComponent('CombatantComponent');
            let dodgeChance = COMBAT_CONSTANTS.BASE_DODGE;  // Base 10%

            // Check for overencumbrance (dodge disabled when carrying > maxWeight)
            const inventory = target.getComponent('InventoryComponent');
            if (inventory) {
                const totalWeight = inventory.getTotalWeight(world);
                const maxWeight = inventory.maxWeight;
                if (totalWeight > maxWeight) {
                    dodgeChance = 0; // Cannot dodge when overencumbered
                }
            }

            if (dodgeChance > 0) {
                const dodgeRoll = Math.random() * 100;
                if (dodgeRoll <= dodgeChance) {
                    world.addComponent(target.id, new MessageComponent(
                        `Dodged! No body damage`,
                        'cyan'
                    ));
                    bodyDamage = 0;
                }
            }
        }

        // 5. Apply body part damage
        if (bodyDamage > 0) {
            bodyParts.damage(hitPart, bodyDamage);

            // Update morale for damage taken (humanoids only)
            const ai = target.getComponent('AIComponent');
            if (ai && ai.morale !== undefined) {
                if (hitPart === 'head') {
                    ai.morale -= 15; // Headshot morale penalty
                    world.addComponent(target.id, new MessageComponent('Headshot!', 'orange'));
                } else if (hitPart === 'torso') {
                    ai.morale -= 10; // Torso hit morale penalty
                }

                if (ai.morale < COMBAT_CONSTANTS.FLEE_MORALE_THRESHOLD) {
                    ai.behaviorType = 'fleeing';
                    world.addComponent(target.id, new MessageComponent('Enemy is fleeing!', 'cyan'));
                }
            }

            // Check for status effects
            if (hitPart === 'torso' && bodyParts.getPart('torso') < COMBAT_CONSTANTS.TORSO_BLEEDING_THRESHOLD) {
                const combatant = target.getComponent('CombatantComponent');
                if (combatant && !combatant.bleeding) {
                    combatant.bleeding = true;
                    world.addComponent(target.id, new MessageComponent('Bleeding!', 'red'));
                }
            }

            // Check for death
            if (bodyParts.getPart('head') <= 0) {
                world.addComponent(target.id, new MessageComponent('Head destroyed! Death!', 'red'));
                this.handleDeath(world, target);
            } else if (bodyParts.getPart('torso') <= 0) {
                world.addComponent(target.id, new MessageComponent('Torso destroyed! Death!', 'red'));
                this.handleDeath(world, target);
            }
        }
    }

    handleDeath(world, entity) {
        // Mark entity as dead
        // TODO: Spawn corpse with loot
        // TODO: Remove entity from world or mark as dead

        // For now, just log it - combat system will detect dead enemies in checkCombatEnd
    }
}
