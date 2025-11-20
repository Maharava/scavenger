// --- World Builder ---
// This script reads map and game data to populate the ECS world.

function buildWorld(world, mapId) {
    const map = MAP_DATA[mapId];
    if (!map) {
        console.error(`Map with id "${mapId}" not found!`);
        return;
    }

    // 1. Create entities from the layout string (walls, floors)
    for (let y = 0; y < map.layout.length; y++) {
        const row = map.layout[y];
        for (let x = 0; x < row.length; x++) {
            const char = row[x];
            const entity = world.createEntity();
            world.addComponent(entity, new PositionComponent(x, y));

            let isPlaceholder = map.interactables.some(i => i.x === x && i.y === y);
            // In the future, you might add other placeholders for creatures, items, etc.

            if (char === '+' && !isPlaceholder) { // Don't create walls at interactable positions
                world.addComponent(entity, new RenderableComponent('+', '#666', 0));
                world.addComponent(entity, new SolidComponent());
            } else if (char === '.' || isPlaceholder) { // Treat placeholder spots as floor
                world.addComponent(entity, new RenderableComponent('.', '#333', 0));
            }
        }
    }

    // 2. Create interactable entities
    map.interactables.forEach(item => {
        let def = INTERACTABLE_DATA.find(i => i.id === item.id);

        // If not found in INTERACTABLE_DATA, check EQUIPMENT_DATA
        if (!def) {
            def = EQUIPMENT_DATA.find(i => i.id === item.id);
        }

        if (!def) {
            console.warn(`Entity definition not found for id: ${item.id}`);
            return;
        }

        const entity = world.createEntity();
        world.addComponent(entity, new PositionComponent(item.x, item.y));
        world.addComponent(entity, new RenderableComponent(def.char, def.colour, 1));
        world.addComponent(entity, new NameComponent(def.name)); // Add NameComponent for Q key display

        // Handle equipment items
        if (def.part_type) {
            // This is a part item - modules take 0.5 slots
            world.addComponent(entity, new ItemComponent(def.name, def.description, def.weight || 0, 0.5));
            world.addComponent(entity, new PartComponent(def.part_type));
            // Only add stat modifiers if they exist (some parts are just generic)
            if (def.modifiers && Object.keys(def.modifiers).length > 0) {
                world.addComponent(entity, new StatModifierComponent(def.modifiers));
            }
            world.addComponent(entity, new InteractableComponent('pickupItem', {}));
        } else if (def.attachment_slots) {
            // This is a container item (gun or armour)
            world.addComponent(entity, new ItemComponent(def.name, def.description, def.weight || 0));

            const attachmentSlots = new AttachmentSlotsComponent(JSON.parse(JSON.stringify(def.attachment_slots)));

            // Pre-attach required parts
            for (const [slotName, slotData] of Object.entries(attachmentSlots.slots)) {
                if (slotData.required) {
                    // Find a part definition that matches this slot type
                    const partDef = EQUIPMENT_DATA.find(e => e.part_type === slotData.accepted_type);

                    if (partDef) {
                        // Create the part entity (createEntity returns the ID, not the entity object)
                        const partEntityId = world.createEntity();
                        // Parts (modules) take 0.5 slots
                        world.addComponent(partEntityId, new ItemComponent(partDef.name, partDef.description, partDef.weight || 0, 0.5));
                        world.addComponent(partEntityId, new PartComponent(partDef.part_type));
                        world.addComponent(partEntityId, new NameComponent(partDef.name));
                        // Only add stat modifiers if they exist (some parts are just generic)
                        if (partDef.modifiers && Object.keys(partDef.modifiers).length > 0) {
                            world.addComponent(partEntityId, new StatModifierComponent(partDef.modifiers));
                        }

                        // Attach it to the equipment (partEntityId is already the ID)
                        slotData.entity_id = partEntityId;
                    }
                }
            }

            world.addComponent(entity, attachmentSlots);

            if (def.equipment_slot) {
                world.addComponent(entity, new EquipmentComponent(def.equipment_slot));
            }
            if (def.gun_type) {
                world.addComponent(entity, new GunComponent(def.gun_type));
            }
            if (def.armour_type) {
                world.addComponent(entity, new ArmourComponent(def.armour_type));
            }
            world.addComponent(entity, new InteractableComponent('pickupItem', {}));
        } else if (def.script === 'pickupItem') {
            // Original consumable item handling
            world.addComponent(entity, new ItemComponent(def.name, '', def.weight || 0));
            world.addComponent(entity, new ConsumableComponent(def.scriptArgs.effect, def.scriptArgs.value));
            world.addComponent(entity, new StackableComponent(1, 99)); // Make items stackable
            world.addComponent(entity, new InteractableComponent(def.script, def.scriptArgs));
        } else {
            // Regular interactable
            world.addComponent(entity, new InteractableComponent(def.script, def.scriptArgs));
        }

        if (def.solid) {
            world.addComponent(entity, new SolidComponent());
        }
    });

    // 3. Create player entity
    const playerDef = CREATURE_DATA.find(c => c.id === 'PLAYER');
    const player = world.createEntity();
    world.addComponent(player, new PlayerComponent());
    world.addComponent(player, new NameComponent(playerDef.name));
    world.addComponent(player, new PositionComponent(map.playerSpawn.x, map.playerSpawn.y));
    world.addComponent(player, new RenderableComponent(playerDef.char, playerDef.colour, 2));

    // Create stats component with initial hunger at 50%
    const stats = new CreatureStatsComponent(50);
    stats.rest = 10; // Set rest to 10% for testing
    world.addComponent(player, stats);

    // Create body parts and set all to 50% for testing
    const bodyParts = new BodyPartsComponent();
    bodyParts.setPart('head', 50);
    bodyParts.setPart('torso', 50);
    bodyParts.setPart('limbs', 50);
    world.addComponent(player, bodyParts);

    world.addComponent(player, new InventoryComponent());
    world.addComponent(player, new EquippedItemsComponent());
    world.addComponent(player, new ComfortModifiersComponent());

    // Add TimeComponent - start time at 00:00 (midnight)
    world.addComponent(player, new TimeComponent(0, 0));

    // Add FacingComponent - player starts facing down
    world.addComponent(player, new FacingComponent('down'));

    // Add Rice Patties to player inventory for testing (3 patties)
    const playerEntity = world.getEntity(player);
    const playerInventory = playerEntity.getComponent('InventoryComponent');

    // Create Rice Patty entities and add to inventory
    for (let i = 0; i < 3; i++) {
        const riceDef = INTERACTABLE_DATA.find(item => item.id === 'RICE_PATTY');
        if (riceDef) {
            const riceEntity = world.createEntity();
            world.addComponent(riceEntity, new ItemComponent(riceDef.name, '', riceDef.weight || 0));
            world.addComponent(riceEntity, new ConsumableComponent(riceDef.scriptArgs.effect, riceDef.scriptArgs.value));
            world.addComponent(riceEntity, new StackableComponent(1, 99));
            world.addComponent(riceEntity, new NameComponent(riceDef.name));

            // Add to inventory (stackable items use name as key)
            if (playerInventory.items.has(riceDef.name)) {
                const existingStack = playerInventory.items.get(riceDef.name);
                existingStack.quantity++;
            } else {
                playerInventory.items.set(riceDef.name, { entityId: riceEntity, quantity: 1 });
            }
        }
    }

    // Create ship entity if this is the SHIP map
    if (mapId === 'SHIP') {
        const ship = world.createEntity();
        world.addComponent(ship, new ShipComponent(100, 100)); // 100L water, 100L fuel
    }

    // Store map metadata in a global entity or directly in the world?
    // For now, let's attach it to the game object, which systems can access.
    // This will replace the old `currentRoom` properties.
    world.game.mapInfo = {
        name: map.name,
        temperature: map.temperature
    };

    // 4. Spawn test enemies for combat testing
    // TODO: Replace with proper enemy spawn locations from map data
    // Spawn enemy further from player (player at 20,10, enemy at 5,5 = 20 tiles away)
    // Don't spawn enemies on the SHIP map
    if (mapId !== 'SHIP') {
        spawnEnemy(world, 'SCAVENGER', 5, 5);
    }
}

// Helper function to spawn an enemy
function spawnEnemy(world, enemyDefId, x, y) {
    const enemyDef = CREATURE_DATA.find(c => c.id === enemyDefId);
    if (!enemyDef) {
        console.error(`Enemy definition not found for id: ${enemyDefId}`);
        return null;
    }

    const enemyId = world.createEntity();
    world.addComponent(enemyId, new NameComponent(enemyDef.name));
    world.addComponent(enemyId, new PositionComponent(x, y));
    world.addComponent(enemyId, new RenderableComponent(enemyDef.char, enemyDef.colour, 2));
    world.addComponent(enemyId, new BodyPartsComponent());

    // Set body part efficiencies from definition
    if (enemyDef.body) {
        const enemy = world.getEntity(enemyId);
        const bodyParts = enemy.getComponent('BodyPartsComponent');
        bodyParts.setPart('head', enemyDef.body.head);
        bodyParts.setPart('torso', enemyDef.body.torso);
        bodyParts.setPart('limbs', enemyDef.body.limbs);
    }

    // Add AI component
    world.addComponent(enemyId, new AIComponent(
        enemyDef.aiType || 'aggressive',
        enemyDef.detectionRange || 10
    ));

    // Set morale for humanoid enemies
    if (enemyDef.morale !== undefined) {
        const enemy = world.getEntity(enemyId);
        const ai = enemy.getComponent('AIComponent');
        ai.morale = enemyDef.morale;
    }

    // Add equipment component
    world.addComponent(enemyId, new EquippedItemsComponent());

    // Equip weapon if specified
    if (enemyDef.weapon) {
        const weaponDef = EQUIPMENT_DATA.find(e => e.id === enemyDef.weapon);
        if (weaponDef) {
            const weaponId = world.createEntity();
            // Create weapon with basic components
            world.addComponent(weaponId, new ItemComponent(weaponDef.name, weaponDef.weight || 400, weaponDef.volume || 1));
            world.addComponent(weaponId, new NameComponent(weaponDef.name));
            world.addComponent(weaponId, new RenderableComponent(weaponDef.char, weaponDef.colour, 1));

            // Add GunComponent
            if (weaponDef.gun_type) {
                world.addComponent(weaponId, new GunComponent(weaponDef.gun_type));
            }

            // Add AttachmentSlotsComponent
            if (weaponDef.attachment_slots) {
                const attachmentSlots = new AttachmentSlotsComponent(weaponDef.attachment_slots);

                // For modular weapons (has attachment slots), install random parts
                if (Object.keys(weaponDef.attachment_slots).length > 0) {
                    for (const [slotName, slotData] of Object.entries(attachmentSlots.slots)) {
                        if (slotData.required) {
                            // Find compatible parts for this slot
                            const compatibleParts = EQUIPMENT_DATA.filter(part =>
                                part.part_type === slotData.accepted_type
                            );

                            if (compatibleParts.length > 0) {
                                // Pick a random compatible part
                                const randomPart = compatibleParts[Math.floor(Math.random() * compatibleParts.length)];

                                // Create the part entity
                                const partEntityId = world.createEntity();
                                world.addComponent(partEntityId, new ItemComponent(randomPart.name, randomPart.weight || 50, 0.1));
                                world.addComponent(partEntityId, new NameComponent(randomPart.name));
                                world.addComponent(partEntityId, new PartComponent(randomPart.part_type));

                                if (randomPart.modifiers && Object.keys(randomPart.modifiers).length > 0) {
                                    world.addComponent(partEntityId, new StatModifierComponent(randomPart.modifiers));
                                }

                                // Install it into the slot
                                slotData.entity_id = partEntityId;
                            }
                        }
                    }
                }

                world.addComponent(weaponId, attachmentSlots);
            }

            // For pre-assembled weapons (no attachment slots), add default stats
            if (weaponDef.gun_type && Object.keys(weaponDef.attachment_slots || {}).length === 0) {
                const gunStats = new GunStatsComponent();
                // Default stats based on weapon type
                switch (weaponDef.gun_type) {
                    case 'pistol':
                        gunStats.damageType = 'kinetic';
                        gunStats.damageAmount = 15;
                        gunStats.accuracy = 70;
                        gunStats.range = 5;
                        gunStats.penetration = 1.0;
                        gunStats.comfortPenalty = -2;
                        break;
                    case 'rifle':
                        gunStats.damageType = 'kinetic';
                        gunStats.damageAmount = 20;
                        gunStats.accuracy = 75;
                        gunStats.range = 8;
                        gunStats.penetration = 1.1;
                        gunStats.comfortPenalty = -3;
                        break;
                    case 'energy':
                        gunStats.damageType = 'energy';
                        gunStats.damageAmount = 12;
                        gunStats.accuracy = 80;
                        gunStats.range = 6;
                        gunStats.penetration = 0.8;
                        gunStats.comfortPenalty = 0;
                        break;
                    case 'plasma':
                        gunStats.damageType = 'energy';
                        gunStats.damageAmount = 25;
                        gunStats.accuracy = 70;
                        gunStats.range = 7;
                        gunStats.penetration = 1.2;
                        gunStats.comfortPenalty = -1;
                        break;
                    default:
                        gunStats.damageType = 'kinetic';
                        gunStats.damageAmount = 10;
                        gunStats.accuracy = 70;
                        gunStats.range = 5;
                        gunStats.penetration = 1.0;
                        gunStats.comfortPenalty = -2;
                }
                world.addComponent(weaponId, gunStats);
            }

            // Equip to hand
            const enemy = world.getEntity(enemyId);
            const equipped = enemy.getComponent('EquippedItemsComponent');
            equipped.hand = weaponId;
        }
    }

    // Equip armor if specified
    if (enemyDef.armor) {
        const armorDef = EQUIPMENT_DATA.find(e => e.id === enemyDef.armor);
        if (armorDef) {
            const armorId = world.createEntity();
            world.addComponent(armorId, new ItemComponent(armorDef.name, armorDef.weight || 800, armorDef.volume || 2));
            world.addComponent(armorId, new NameComponent(armorDef.name));
            world.addComponent(armorId, new RenderableComponent(armorDef.char, armorDef.colour, 1));

            // Add AttachmentSlotsComponent for armor
            if (armorDef.attachment_slots) {
                world.addComponent(armorId, new AttachmentSlotsComponent(armorDef.attachment_slots));
            }

            // Equip to body
            const enemy = world.getEntity(enemyId);
            const equipped = enemy.getComponent('EquippedItemsComponent');
            equipped.body = armorId;
        }
    }

    // Add armor stats directly for robots (integrated armor)
    if (enemyDef.armorStats) {
        const armorStats = new ArmourStatsComponent();
        armorStats.durability = enemyDef.armorStats.durability;
        armorStats.maxDurability = enemyDef.armorStats.maxDurability;
        armorStats.resistances = enemyDef.armorStats.resistances;
        world.addComponent(enemyId, armorStats);
    }

    console.log(`Spawned enemy: ${enemyDef.name} at (${x}, ${y})`);
    return enemyId;
}
