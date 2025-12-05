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
        // Check if this is the player
        const isPlayer = entity.hasComponent('PlayerComponent');

        if (isPlayer) {
            // Handle player death - return to ship with consequences
            this.handlePlayerDeath(world, entity);
        } else {
            // Handle enemy death
            // TODO: Spawn corpse with loot
            // For now, just mark as dead - combat system will detect in checkCombatEnd
        }
    }

    handlePlayerDeath(world, entity) {
        // Show death message
        world.addComponent(entity.id, new MessageComponent(
            '═══════════════════════════════\n' +
            '     YOU HAVE DIED\n' +
            '═══════════════════════════════\n' +
            'You awaken on your ship...\n' +
            'All expedition items lost.\n' +
            'Skills may have regressed.',
            'red'
        ));

        // Apply skill regression (2 random skills)
        const skillsSystem = world.systems.find(s => s.constructor.name === 'SkillsSystem');
        if (skillsSystem) {
            skillsSystem.applyDeathPenalty(world, entity);
        }

        // Clear expedition inventory (items collected during expedition)
        // We distinguish between "ship inventory" (what you had when leaving)
        // and "expedition inventory" (what you collected)
        // For simplicity, we'll clear ALL inventory since save/load handles ship inventory
        const inventory = entity.getComponent('InventoryComponent');
        if (inventory) {
            inventory.items.clear();
            inventory.currentWeight = 0;
        }

        // Restore player health to prevent immediate re-death
        const bodyParts = entity.getComponent('BodyPartsComponent');
        if (bodyParts) {
            for (const [partName, efficiency] of bodyParts.parts) {
                bodyParts.parts.set(partName, 50); // Restore to 50% each
            }
        }

        // Restore stats to survivable levels
        const stats = entity.getComponent('CreatureStatsComponent');
        if (stats) {
            stats.hunger = 30; // Low but not critical
            stats.rest = 40;
            stats.stress = 80; // High stress from near-death experience
            stats.comfort = 30;
        }

        // Exit combat if in combat
        if (entity.hasComponent('CombatStateComponent')) {
            world.removeComponent(entity.id, 'CombatStateComponent');
            world.removeComponent(entity.id, 'CombatantComponent');

            // Clean up combat session
            const combatSystem = world.systems.find(s => s.constructor.name === 'CombatSystem');
            if (combatSystem && combatSystem.activeCombatSession) {
                combatSystem.endCombat(world);
            }
        }

        // Return to ship after short delay
        setTimeout(() => {
            this.returnToShipAfterDeath(world, entity);
        }, 3000); // 3 second delay to read death message
    }

    returnToShipAfterDeath(world, entity) {
        // Destroy current world and rebuild ship map
        const game = world.game;
        if (!game) {
            console.error('Cannot return to ship: game reference not found');
            return;
        }

        // Save the player state before rebuilding
        const timeComp = entity.getComponent('TimeComponent');
        const savedTime = timeComp ? {
            day: timeComp.day,
            hours: timeComp.hours,
            minutes: timeComp.minutes,
            totalMinutes: timeComp.totalMinutes
        } : null;

        // Clear all entities except player components we want to keep
        const savedComponents = {
            skills: entity.getComponent('SkillsComponent'),
            stats: entity.getComponent('CreatureStatsComponent'),
            bodyParts: entity.getComponent('BodyPartsComponent'),
            inventory: entity.getComponent('InventoryComponent'),
            equipped: entity.getComponent('EquippedItemsComponent'),
            time: entity.getComponent('TimeComponent')
        };

        // Rebuild the ship map
        buildWorld(world, 'SHIP');

        // Find the new player entity
        const newPlayer = world.query(['PlayerComponent'])[0];
        if (newPlayer && savedComponents) {
            // Restore components
            if (savedComponents.skills) {
                const skills = newPlayer.getComponent('SkillsComponent');
                if (skills) {
                    skills.medical = savedComponents.skills.medical;
                    skills.cooking = savedComponents.skills.cooking;
                    skills.farming = savedComponents.skills.farming;
                    skills.repair = savedComponents.skills.repair;
                }
            }

            if (savedComponents.stats) {
                const stats = newPlayer.getComponent('CreatureStatsComponent');
                if (stats) {
                    stats.hunger = savedComponents.stats.hunger;
                    stats.rest = savedComponents.stats.rest;
                    stats.stress = savedComponents.stats.stress;
                    stats.comfort = savedComponents.stats.comfort;
                }
            }

            if (savedComponents.bodyParts) {
                const bodyParts = newPlayer.getComponent('BodyPartsComponent');
                if (bodyParts) {
                    for (const [partName, efficiency] of savedComponents.bodyParts.parts) {
                        bodyParts.parts.set(partName, efficiency);
                    }
                }
            }

            if (savedTime) {
                const timeComp = newPlayer.getComponent('TimeComponent');
                if (timeComp) {
                    timeComp.day = savedTime.day;
                    timeComp.hours = savedTime.hours;
                    timeComp.minutes = savedTime.minutes;
                    timeComp.totalMinutes = savedTime.totalMinutes;
                }
            }

            // Show return message
            world.addComponent(newPlayer.id, new MessageComponent(
                'You have returned to your ship.',
                'yellow'
            ));
        }
    }
}
