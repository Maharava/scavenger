/**
 * Damage System
 * =============
 * Processes damage events, applies armor/resistance, and handles death/loot.
 *
 * Responsibilities:
 * - Applying damage to specific body parts
 * - Calculating armor resistance and penetration
 * - Managing status effects (bleeding, morale loss)
 * - Handling player and enemy death
 * - Spawning corpses with loot drops
 * - Generating random materials from enemy types
 *
 * Damage Flow:
 * 1. processDamageEvent() - Calculates final damage after armor
 * 2. Updates body part efficiency
 * 3. Checks for status effects (bleeding at low torso health)
 * 4. Checks for death conditions (head or torso destroyed)
 * 5. Calls handleDeath() → spawnEnemyCorpse() or handlePlayerDeath()
 */

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
            // Handle enemy death - spawn corpse with loot
            this.spawnEnemyCorpse(world, entity);
        }
    }

    spawnEnemyCorpse(world, enemyEntity) {
        const pos = enemyEntity.getComponent('PositionComponent');
        const name = enemyEntity.getComponent('NameComponent');
        const equipped = enemyEntity.getComponent('EquippedItemsComponent');

        if (!pos || !name) return;

        // Create corpse entity
        const corpse = world.createEntity();
        world.addComponent(corpse, new PositionComponent(pos.x, pos.y));
        world.addComponent(corpse, new RenderableComponent('%', '#666', 1));
        world.addComponent(corpse, new NameComponent(`${name.name} Corpse`));
        world.addComponent(corpse, new VisibilityStateComponent());

        // Create a container for loot
        const lootInventory = new Map();

        // Transfer equipped items to corpse
        if (equipped) {
            // Transfer weapon
            if (equipped.hand) {
                const weaponEntity = world.getEntity(equipped.hand);
                if (weaponEntity) {
                    const itemComp = weaponEntity.getComponent('ItemComponent');
                    if (itemComp) {
                        lootInventory.set(itemComp.name, {
                            entityId: equipped.hand,
                            quantity: 1
                        });
                    }
                }
            }

            // Transfer armor
            if (equipped.body) {
                const armorEntity = world.getEntity(equipped.body);
                if (armorEntity) {
                    const itemComp = armorEntity.getComponent('ItemComponent');
                    if (itemComp) {
                        lootInventory.set(itemComp.name, {
                            entityId: equipped.body,
                            quantity: 1
                        });
                    }
                }
            }
        }

        // Add random materials based on enemy type
        const creatureDef = this.getCreatureDefinition(name.name);
        const materials = this.generateLootMaterials(world, creatureDef);

        // Add materials to loot inventory
        for (const materialData of materials) {
            const existing = lootInventory.get(materialData.name);
            if (existing) {
                existing.quantity += materialData.quantity;
            } else {
                lootInventory.set(materialData.name, {
                    entityId: materialData.entityId,
                    quantity: materialData.quantity
                });
            }
        }

        // Add loot container component to corpse
        world.addComponent(corpse, new LootContainerComponent(lootInventory));

        // Make corpse interactable for looting
        world.addComponent(corpse, new InteractableComponent('lootCorpse', { corpseEntity: corpse }));

        console.log(`Spawned corpse for ${name.name} at (${pos.x}, ${pos.y}) with ${lootInventory.size} items`);
    }

    getCreatureDefinition(creatureName) {
        return CREATURE_DATA.find(c => c.name === creatureName);
    }

    generateLootMaterials(world, creatureDef) {
        const materials = [];

        if (!creatureDef) return materials;

        // Define loot tables based on enemy type
        let materialPool = [];
        let dropCount = { min: 1, max: 3 };

        // Humanoid enemies (Scavenger)
        if (creatureDef.id === 'SCAVENGER') {
            materialPool = [
                { id: 'SALVAGED_COMPONENTS', weight: 40 },
                { id: 'POLYMER_RESIN', weight: 30 },
                { id: 'BASIC_ELECTRONICS', weight: 20 },
                { id: 'ARAMID_FIBRES', weight: 10 }
            ];
            dropCount = { min: 2, max: 4 };
        }
        // Robot enemies (Scout Drone, Security Bot)
        else if (creatureDef.id === 'SCOUT_DRONE' || creatureDef.id === 'SECURITY_BOT') {
            materialPool = [
                { id: 'BASIC_ELECTRONICS', weight: 40 },
                { id: 'SALVAGED_COMPONENTS', weight: 30 },
                { id: 'INTACT_LOGIC_BOARD', weight: 15 },
                { id: 'POLYMER_RESIN', weight: 15 }
            ];
            dropCount = { min: 1, max: 3 };
        }
        // Future: Aberrant enemies
        else {
            // Default loot for unknown types
            materialPool = [
                { id: 'SALVAGED_COMPONENTS', weight: 50 },
                { id: 'POLYMER_RESIN', weight: 50 }
            ];
            dropCount = { min: 1, max: 2 };
        }

        // Roll for number of drops
        const numDrops = Math.floor(Math.random() * (dropCount.max - dropCount.min + 1)) + dropCount.min;

        // Weighted random selection
        for (let i = 0; i < numDrops; i++) {
            const totalWeight = materialPool.reduce((sum, item) => sum + item.weight, 0);
            let roll = Math.random() * totalWeight;

            for (const item of materialPool) {
                roll -= item.weight;
                if (roll <= 0) {
                    const materialDef = MATERIAL_DATA[item.id];
                    if (materialDef) {
                        // Create material entity
                        const materialEntity = world.createEntity();
                        world.addComponent(materialEntity, new ItemComponent(
                            materialDef.name,
                            materialDef.description || '',
                            materialDef.weight || 0,
                            materialDef.slots || 0.5
                        ));
                        world.addComponent(materialEntity, new RenderableComponent(
                            materialDef.char,
                            materialDef.colour,
                            0
                        ));
                        world.addComponent(materialEntity, new NameComponent(materialDef.name));

                        if (materialDef.stackable) {
                            world.addComponent(materialEntity, new StackableComponent(1, materialDef.stackLimit || 99));
                        }

                        // Check if we already have this material in the list
                        const existing = materials.find(m => m.name === materialDef.name);
                        if (existing) {
                            existing.quantity++;
                        } else {
                            materials.push({
                                name: materialDef.name,
                                entityId: materialEntity,
                                quantity: 1
                            });
                        }
                    }
                    break;
                }
            }
        }

        return materials;
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
        const skillsSystem = world.getSystem(SkillsSystem);
        if (skillsSystem) {
            skillsSystem.applyDeathPenalty(world, entity);
        }

        // Clear expedition inventory and equipment (all items lost on death)
        // Note: This is intentional permadeath consequence - player loses everything
        // collected during the expedition, including equipped items
        // Ship inventory/equipment from before expedition is restored via save/load
        const inventory = entity.getComponent('InventoryComponent');
        if (inventory) {
            inventory.items.clear();
            inventory.currentWeight = 0;
        }

        // Clear equipped items (they will be restored from ship save if applicable)
        const equipped = entity.getComponent('EquippedItemsComponent');
        if (equipped) {
            equipped.hand = null;
            equipped.body = null;
            equipped.tool1 = null;
            equipped.tool2 = null;
            equipped.backpack = null;
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
            const combatSystem = world.getSystem(CombatSystem);
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

        // Save player state components that persist through death
        // Note: Inventory and equipment are NOT saved - player loses all items on death
        const savedComponents = {
            skills: entity.getComponent('SkillsComponent'),
            stats: entity.getComponent('CreatureStatsComponent'),
            bodyParts: entity.getComponent('BodyPartsComponent'),
            time: entity.getComponent('TimeComponent')
        };

        // Rebuild the ship map
        buildWorld(world, 'SHIP');

        // Find the new player entity
        const newPlayer = world.getPlayer();
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
