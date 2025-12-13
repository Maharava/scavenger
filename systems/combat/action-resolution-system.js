// ActionResolutionSystem - Resolves combat actions (shoot, aim, wait, flee, use item)

class ActionResolutionSystem extends System {
    update(world) {
        // Actions are triggered by requestPlayerAction() or AI system
        // This system doesn't update every frame, it's called on-demand
    }

    resolveAction(world, actorEntity, actionType, args) {
        switch (actionType) {
            case 'shoot':
                return this.resolveShoot(world, actorEntity, args.targetId);
            case 'wait':
                return this.resolveWait(world, actorEntity);
            case 'flee':
                return this.resolveFlee(world, actorEntity);
            case 'use_item':
                return this.resolveUseItem(world, actorEntity, args.itemId);
            default:
                console.error('Unknown action type:', actionType);
                return false;
        }
    }

    resolveShoot(world, attacker, targetId) {
        const target = world.getEntity(targetId);
        if (!target) return false;

        // Get weapon stats
        const equipped = attacker.getComponent('EquippedItemsComponent');
        if (!equipped || !equipped.hand) {
            world.addComponent(attacker.id, new MessageComponent('No weapon equipped!', 'red'));
            return false;
        }

        const weapon = world.getEntity(equipped.hand);
        if (!weapon) {
            world.addComponent(attacker.id, new MessageComponent('Weapon not found!', 'red'));
            return false;
        }

        if (!weapon.hasComponent('GunStatsComponent')) {
            // Calculate gun stats if not present
            updateGunStats(world, weapon);
        }
        const gunStats = weapon.getComponent('GunStatsComponent');

        // Check if weapon is valid (has required parts)
        if (!isEquipmentValid(world, weapon)) {
            world.addComponent(attacker.id, new MessageComponent('Weapon missing required parts!', 'red'));
            return false;
        }

        // Get distance to target
        const attackerPos = attacker.getComponent('PositionComponent');
        const targetPos = target.getComponent('PositionComponent');
        const distance = Math.abs(attackerPos.x - targetPos.x) + Math.abs(attackerPos.y - targetPos.y);

        // Spawn bullet projectile
        const bulletId = world.createEntity();
        const bulletChar = gunStats.damageType === 'energy' ? '~' : '•';
        const bulletColour = gunStats.damageType === 'energy' ? '#0ff' : '#ff0';

        world.addComponent(bulletId, new ProjectileComponent(
            attackerPos.x,
            attackerPos.y,
            targetPos.x,
            targetPos.y,
            bulletChar,
            bulletColour,
            8  // Speed: 8 tiles per second (slowed down to be visible)
        ));
        world.addComponent(bulletId, new PositionComponent(attackerPos.x, attackerPos.y));
        world.addComponent(bulletId, new RenderableComponent(bulletChar, bulletColour, 100)); // High z-index

        // Calculate hit chance (allows out-of-range shooting with penalties)
        // Chaff Spitter auto-activation happens inside calculateHitChance
        const result = this.calculateHitChance(world, attacker, target, gunStats, distance);
        const hitChance = result.hitChance;
        const modifiers = result.modifiers;

        // Apply gun comfort penalty (3 in-game minutes = 180 real seconds)
        // Only apply penalty if gun has a comfort penalty (negative value)
        // Comfort bonuses do NOT apply (shooting doesn't make you more comfortable)
        if (gunStats.comfortPenalty < 0 && attacker.hasComponent('PlayerComponent')) {
            const stats = attacker.getComponent('CreatureStatsComponent');
            const comfortMods = attacker.getComponent('ComfortModifiersComponent');
            if (stats && comfortMods) {
                // Add timed comfort penalty lasting 3 in-game minutes (180 real seconds)
                comfortMods.addModifier(gunStats.comfortPenalty, 180);
            }
        }

        // Roll to hit
        const roll = Math.random() * 100;
        const hit = roll <= hitChance;

        // Names
        const isPlayerAttacker = attacker.hasComponent('PlayerComponent');
        const targetName = target.getComponent('NameComponent');
        const targetDisplayName = targetName ? targetName.name : 'enemy';

        if (hit) {
            // Create damage event
            const damageEvent = new DamageEventComponent(
                attacker.id,
                target.id,
                gunStats.damageAmount,
                gunStats.damageType,
                null  // Auto-select body part
            );

            // Add damage event to target for DamageSystem to process
            world.addComponent(target.id, damageEvent);

            // Flavor text for player
            if (isPlayerAttacker) {
                const hitFlavor = getRandomFlavor('HIT');
                world.addComponent(attacker.id, new MessageComponent(
                    `${hitFlavor} ${targetDisplayName}!`,
                    'green'
                ));

                // Add body part status message after hit
                setTimeout(() => {
                    const bodyStatus = this.getBodyPartStatusMessage(target);
                    if (bodyStatus) {
                        world.addComponent(attacker.id, new MessageComponent(bodyStatus, 'yellow'));
                    }
                }, 100);
            } else {
                world.addComponent(attacker.id, new MessageComponent(
                    `Enemy hit you!`,
                    'red'
                ));
            }

            return true;
        } else {
            // Miss - use flavor text for player
            if (isPlayerAttacker) {
                const missFlavor = getRandomFlavor('MISS');
                world.addComponent(attacker.id, new MessageComponent(missFlavor, 'yellow'));
            } else {
                world.addComponent(attacker.id, new MessageComponent('Enemy missed!', 'grey'));
            }
            return true;  // Still consumed action
        }
    }

    // Check for and auto-activate Chaff Spitter when player is targeted
    // Chaff Spitter applies -30% accuracy to attacker (once per turn cycle)
    // Automatically consumes 1 use when activated
    checkAndActivateChaffSpitter(world, attacker, target) {
        // Only activate if target is the player
        if (!target.hasComponent('PlayerComponent')) return 0;

        const player = target;
        const playerCombatant = player.getComponent('CombatantComponent');
        if (!playerCombatant) return 0;

        // Check if already used this turn cycle
        if (playerCombatant.chaffUsedThisCycle) return 0;

        const equipped = player.getComponent('EquippedItemsComponent');
        if (!equipped) return 0;

        // Check both tool slots for Chaff Spitter
        const toolSlots = [equipped.tool1, equipped.tool2];
        for (const toolId of toolSlots) {
            if (!toolId) continue;

            const toolEntity = world.getEntity(toolId);
            if (!toolEntity) continue;

            const toolComponent = toolEntity.getComponent('ToolComponent');
            const toolStats = toolEntity.getComponent('ToolStatsComponent');
            const itemComponent = toolEntity.getComponent('ItemComponent');

            // Check if this is a Chaff Spitter with uses remaining
            if (toolComponent && toolStats &&
                toolStats.specialAbility === 'deploy_chaff' &&
                toolComponent.usesRemaining !== 0) {

                const accuracyDebuff = toolStats.abilityArgs?.accuracyDebuff || 30;

                // Consume one use
                if (toolComponent.usesRemaining > 0) {
                    toolComponent.usesRemaining--;
                }

                // Mark as used this cycle
                playerCombatant.chaffUsedThisCycle = true;

                // Notify player
                world.addComponent(player.id, new MessageComponent(
                    `${itemComponent.name} activated! -${accuracyDebuff}% enemy accuracy (${toolComponent.usesRemaining} uses left)`,
                    'cyan'
                ));

                // Return the debuff to apply
                return accuracyDebuff;
            }
        }

        return 0;  // No chaff spitter found or already used
    }

    calculateHitChance(world, attacker, target, gunStats, distance) {
        let accuracy = gunStats.accuracy;  // Base from weapon parts
        const modifiers = {}; // Track modifiers for console logging

        modifiers.base = accuracy;

        // Check for Chaff Spitter debuff (applied before other calculations)
        const chaffDebuff = this.checkAndActivateChaffSpitter(world, attacker, target);
        if (chaffDebuff > 0) {
            accuracy -= chaffDebuff;
            modifiers.chaffSpitter = -chaffDebuff;
        }

        // First strike bonus (player only, first turn only)
        if (attacker.hasComponent('PlayerComponent')) {
            const combatSystem = world.getSystem(CombatSystem);
            if (combatSystem && combatSystem.activeCombatSession &&
                combatSystem.activeCombatSession.playerInitiated &&
                !combatSystem.activeCombatSession.firstStrikeBonusUsed) {
                accuracy += COMBAT_CONSTANTS.FIRST_STRIKE_BONUS;
                modifiers.firstStrike = COMBAT_CONSTANTS.FIRST_STRIKE_BONUS;
                combatSystem.activeCombatSession.firstStrikeBonusUsed = true;
            }
        }

        // Stress modifier (player only)
        if (attacker.hasComponent('PlayerComponent')) {
            const stats = attacker.getComponent('CreatureStatsComponent');
            if (stats) {
                if (stats.stress >= COMBAT_CONSTANTS.STRESS_OPTIMAL_MIN &&
                    stats.stress <= COMBAT_CONSTANTS.STRESS_OPTIMAL_MAX) {
                    accuracy += 10;  // Optimal stress zone
                    modifiers.stress = 10;
                } else if (stats.stress >= COMBAT_CONSTANTS.STRESS_PENALTY_1_MIN &&
                           stats.stress <= COMBAT_CONSTANTS.STRESS_PENALTY_1_MAX) {
                    accuracy -= 10;  // High stress
                    modifiers.stress = -10;
                } else if (stats.stress >= COMBAT_CONSTANTS.STRESS_PENALTY_2_MIN) {
                    accuracy -= 20;  // Extreme stress
                    modifiers.stress = -20;
                }
            }
        }

        // Body part damage penalties
        const bodyParts = attacker.getComponent('BodyPartsComponent');
        if (bodyParts) {
            if (bodyParts.getPart('head') < 50) {
                accuracy -= COMBAT_CONSTANTS.HEAD_ACCURACY_PENALTY;
                modifiers.headDamage = -COMBAT_CONSTANTS.HEAD_ACCURACY_PENALTY;
            }
            if (bodyParts.getPart('torso') < 50) {
                accuracy -= COMBAT_CONSTANTS.TORSO_ACCURACY_PENALTY;
                modifiers.torsoDamage = -COMBAT_CONSTANTS.TORSO_ACCURACY_PENALTY;
            }
        }

        // Temperature zone penalties (from TemperatureSystem)
        const tempZone = world.tempZone || 'comfortable';
        if (tempZone === 'harsh') {
            accuracy -= 10;
            modifiers.temperature = -10;
        } else if (tempZone === 'extreme') {
            accuracy -= 25;
            modifiers.temperature = -25;
        }

        // Out-of-range penalty: -25% per tile beyond weapon range
        if (distance > gunStats.range) {
            const tilesOverRange = distance - gunStats.range;
            const rangePenalty = tilesOverRange * COMBAT_CONSTANTS.OUT_OF_RANGE_PENALTY;
            accuracy -= rangePenalty;
            modifiers.outOfRange = -rangePenalty;
        }

        modifiers.final = accuracy;

        // Don't clamp accuracy - allow negative hit chances (very unlikely but possible)
        return { hitChance: accuracy, modifiers: modifiers };
    }

    resolveWait(world, attacker) {
        const name = attacker.hasComponent('PlayerComponent') ? 'You' : 'Enemy';
        world.addComponent(attacker.id, new MessageComponent(`${name} wait.`, 'grey'));
        return true;
    }

    resolveFlee(world, attacker) {
        // Check if player is outside all enemy detection ranges
        if (!attacker.hasComponent('PlayerComponent')) {
            return false;  // Only player can flee
        }

        const attackerPos = attacker.getComponent('PositionComponent');
        const enemies = world.query(['AIComponent', 'PositionComponent', 'CombatStateComponent']);

        for (const enemy of enemies) {
            const enemyPos = enemy.getComponent('PositionComponent');
            const ai = enemy.getComponent('AIComponent');
            const distance = Math.abs(attackerPos.x - enemyPos.x) + Math.abs(attackerPos.y - enemyPos.y);

            if (distance <= ai.detectionRange) {
                world.addComponent(attacker.id, new MessageComponent(
                    'Cannot flee! Enemies too close.',
                    'red'
                ));
                return false;
            }
        }

        // Can flee
        const combatSystem = world.systems.find(s => s instanceof CombatSystem);
        if (combatSystem) {
            combatSystem.endCombat(world, 'flee');
        }

        return true;
    }

    resolveUseItem(world, attacker, itemId) {
        // TODO: Implement item usage (medkits, stims)
        // For now, just consume action
        world.addComponent(attacker.id, new MessageComponent('Used item!', 'green'));
        return true;
    }

    getBodyPartStatusMessage(target) {
        const bodyParts = target.getComponent('BodyPartsComponent');
        if (!bodyParts) return null;

        const head = bodyParts.getPart('head');
        const torso = bodyParts.getPart('torso');
        const limbs = bodyParts.getPart('limbs');

        // Check body parts in priority order (most severe first)
        if (head > 0 && head < 25) {
            return getRandomFlavor('HEAD_25');
        } else if (head >= 25 && head < 50) {
            return getRandomFlavor('HEAD_50');
        }

        if (torso > 0 && torso < 25) {
            return getRandomFlavor('TORSO_25');
        } else if (torso >= 25 && torso < 50) {
            return getRandomFlavor('TORSO_50');
        }

        if (limbs > 0 && limbs < 25) {
            return getRandomFlavor('LIMBS_25');
        } else if (limbs >= 25 && limbs < 50) {
            return getRandomFlavor('LIMBS_50');
        }

        return null; // No status to report
    }
}
