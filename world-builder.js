// --- World Builder ---
// This script reads map and game data to populate the ECS world.

class MapLightingComponent {
    constructor(enabled = true) {
        this.enabled = enabled;  // If false, entire map is lit (ship)
    }
}

function buildWorld(world, mapId, generatedMap = null) {
    // Use generatedMap if provided, otherwise look up in MAP_DATA
    const map = generatedMap || MAP_DATA[mapId];
    if (!map) {
        console.error(`Map with id "${mapId}" not found!`);
        return;
    }

    // Clear existing world entities
    world.entities.clear();
    world.nextEntityId = 0;
    world.solidTileCache.clear();

    // Store current map ID for systems to check
    world.currentMap = mapId;

    // Calculate map dimensions
    const mapWidth = map.width || (map.layout && map.layout[0] ? map.layout[0].length : 0);
    const mapHeight = map.height || (map.layout ? map.layout.length : 0);

    // Update viewport dimensions based on map size
    if (world.game && world.game.updateViewportDimensions) {
        world.game.updateViewportDimensions(mapWidth, mapHeight);
    }

    // Set map lighting (from map data)
    world.mapLighting = new MapLightingComponent(map.darkMap || false);

    // 1. Create entities from the layout string (walls, floors)
    for (let y = 0; y < map.layout.length; y++) {
        const row = map.layout[y];
        for (let x = 0; x < row.length; x++) {
            const char = row[x];
            const entity = world.createEntity();
            world.addComponent(entity, new PositionComponent(x, y));
            world.addComponent(entity, new VisibilityStateComponent());

            let isPlaceholder = map.interactables.some(i => i.x === x && i.y === y);
            // In the future, you might add other placeholders for creatures, items, etc.

            if (char === '+' && !isPlaceholder) { // Don't create walls at interactable positions
                world.addComponent(entity, new RenderableComponent('+', '#666', 0));
                world.addComponent(entity, new SolidComponent());
                world.addSolidTileToCache(x, y); // Add to cache for LOS calculations
            } else if (char === '.' || isPlaceholder) { // Treat placeholder spots as floor
                world.addComponent(entity, new RenderableComponent('.', '#333', 0));
            }
        }
    }

    // 2. Create interactable entities
    map.interactables.forEach(item => {
        // Handle scavenge nodes
        if (item.type === 'scavenge_node') {
            const nodeType = NODE_TYPES[item.nodeTypeId];
            if (!nodeType) {
                console.warn(`Node type not found: ${item.nodeTypeId}`);
                return;
            }

            const entity = world.createEntity();
            world.addComponent(entity, new PositionComponent(item.x, item.y));

            // Random name variant
            const name = game.rng.choice(nodeType.nameVariants);
            world.addComponent(entity, new NameComponent(name));

            // Renderable
            world.addComponent(entity, new RenderableComponent(nodeType.char, nodeType.colour, 1));
            world.addComponent(entity, new VisibilityStateComponent());

            // Scavenge node component
            const nodeComponent = new ScavengeNodeComponent(item.nodeTypeId, item.lootItems, false);
            nodeComponent.difficulty = nodeType.searchDifficulty;
            world.addComponent(entity, nodeComponent);

            // Interactable
            world.addComponent(entity, new InteractableComponent('searchNode', {}));

            return;
        }

        let def = INTERACTABLE_DATA.find(i => i.id === item.id);

        // If not found in INTERACTABLE_DATA, check other data sources
        if (!def) {
            def = EQUIPMENT_DATA.find(i => i.id === item.id);
        }
        if (!def) {
            def = TOOL_DATA[item.id];
        }
        if (!def) {
            def = MATERIAL_DATA[item.id];
        }
        if (!def) {
            def = FOOD_DATA.find(i => i.id === item.id);
        }
        if (!def) {
            def = ITEM_DATA.find(i => i.id === item.id);
        }

        if (!def) {
            console.warn(`Entity definition not found for id: ${item.id}`);
            return;
        }

        const entity = world.createEntity();
        world.addComponent(entity, new PositionComponent(item.x, item.y));

        // For producers, get visual properties from producer config
        let char = def.char;
        let colour = def.colour;
        if (def.producerType && PRODUCER_TYPES[def.producerType]) {
            const producerConfig = PRODUCER_TYPES[def.producerType];
            char = producerConfig.char || def.char;
            colour = producerConfig.colour || def.colour;
        }

        world.addComponent(entity, new RenderableComponent(char, colour, 1));
        world.addComponent(entity, new NameComponent(def.name));
        world.addComponent(entity, new VisibilityStateComponent());


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
        } else if (def.tool_type) {
            // This is a tool
            world.addComponent(entity, new ItemComponent(def.name, def.description, def.weight || 0, def.slots || 1.0));
            world.addComponent(entity, new ToolComponent(def.tool_type, def.uses || -1));
            if (def.stats) {
                world.addComponent(entity, new ToolStatsComponent(def.stats));
                if (def.stats.lightRadius > 0) {
                    world.addComponent(entity, new LightSourceComponent(def.stats.lightRadius, true));
                }
            }
             world.addComponent(entity, new InteractableComponent('pickupItem', {}));
        } else if (def.stackable) {
            // Stackable materials (crafting components, salvage, etc.)
            world.addComponent(entity, new ItemComponent(def.name, def.description, def.weight || 0, def.slots || 0.5));
            world.addComponent(entity, new StackableComponent(item.quantity || 1, def.stackLimit || 99));
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

        // Add special components for certain interactables
        if (item.id === 'LIFE_SUPPORT') {
            world.addComponent(entity, new LifeSupportComponent(0)); // Start at tier 0
        }
        if (item.id === 'WATER_RECYCLER') {
            // Find the ship entity and add WaterRecyclerComponent to it
            const shipEntities = world.query(['ShipComponent']);
            if (shipEntities.length > 0) {
                const shipEntity = shipEntities[0];
                if (!shipEntity.hasComponent('WaterRecyclerComponent')) {
                    world.addComponent(shipEntity.id, new WaterRecyclerComponent());
                }
            }
        }

        if (def.solid) {
            world.addComponent(entity, new SolidComponent());
            world.addSolidTileToCache(item.x, item.y); // Add to cache for LOS calculations
        }

        if (def.producerType) {
            world.addComponent(entity, new ProducerComponent(def.producerType));
        }

        if (def.lightRadius && def.lightRadius > 0) {
            world.addComponent(entity, new LightSourceComponent(def.lightRadius, true));
        }
    });

    // 3. Create player entity
    const playerDef = CREATURE_DATA.find(c => c.id === 'PLAYER');
    const player = world.createEntity();
    world.addComponent(player, new PlayerComponent());
    world.addComponent(player, new NameComponent(playerDef.name));
    world.addComponent(player, new PositionComponent(map.playerSpawn.x, map.playerSpawn.y));
    world.addComponent(player, new RenderableComponent(playerDef.char, playerDef.colour, 2));
    world.addComponent(player, new VisibilityStateComponent());

    // Create stats component with initial values for testing new ship systems
    const stats = new CreatureStatsComponent(50);
    stats.rest = 10; // Set rest to 10% for testing
    stats.stress = 80; // High stress for testing shower
    stats.comfort = 15; // Low comfort for testing shower and life support
    world.addComponent(player, stats);

    // Create body parts with injuries for testing Auto-Doc
    const bodyParts = new BodyPartsComponent();
    bodyParts.setPart('head', 65);   // 65% health (35% injury)
    bodyParts.setPart('torso', 50);  // 50% health (50% injury)
    bodyParts.setPart('limbs', 40);  // 40% health (60% injury)
    world.addComponent(player, bodyParts);

    world.addComponent(player, new InventoryComponent(4, 13000));
    world.addComponent(player, new EquippedItemsComponent());
    world.addComponent(player, new ComfortModifiersComponent());

    // Add TimeComponent - start time at 00:00 (midnight)
    world.addComponent(player, new TimeComponent(0, 0));

    // Add FacingComponent - player starts facing down
    world.addComponent(player, new FacingComponent('down'));

    if (world.mapLighting.enabled) {
        world.addComponent(player, new LightSourceComponent(BASE_PLAYER_LIGHT_RADIUS, true));
    }

    // Center camera on player immediately
    if (world.game) {
        world.game.cameraX = Math.floor(map.playerSpawn.x - world.game.width / 2);
        world.game.cameraY = Math.floor(map.playerSpawn.y - world.game.height / 2);
    }

    const playerEntity = world.getEntity(player);
    const playerInventory = playerEntity.getComponent('InventoryComponent');
    playerInventory.items.clear();

    // Create ship entity if this is the SHIP map
    if (mapId === 'SHIP') {
        const ship = world.createEntity();
        world.addComponent(ship, new ShipComponent(90, 100)); // 90L water (for testing), 100L fuel

        // Load saved ship state (if returning from expedition)
        const player = world.query(['PlayerComponent'])[0];
        const shipLoaded = player ? loadShipState(world, player) : false;

        // If no save was loaded, initialize with test modules for recycler testing
        if (!shipLoaded) {
            const playerInventory = player.getComponent('InventoryComponent');
            const shipComponent = world.getEntity(ship).getComponent('ShipComponent');

            console.log('\n=== SPAWNING TEST MODULES ===');

            // Add test modules for recycler testing (player inventory)
            const testModules = [
                { id: 'RUBBER_GRIP', quantity: 2 },          // Simple: 1 material (Polymer Resin)
                { id: 'WOODEN_GRIP', quantity: 1 },          // Simple: 1 material (Salvaged Components)
                { id: 'SHORT_BARREL', quantity: 2 },         // Standard: 2 materials
                { id: 'STANDARD_CHAMBER', quantity: 1 },     // Standard: 2 materials
                { id: 'PISTOL_LASER_SIGHT', quantity: 1 }    // Advanced: 3 materials
            ];

            for (const module of testModules) {
                const moduleDef = EQUIPMENT_DATA.find(eq => eq.id === module.id);
                if (moduleDef) {
                    console.log(`Spawning: ${moduleDef.name} (${module.id}) x${module.quantity}`);
                    console.log(`  part_type: ${moduleDef.part_type}`);

                    const moduleEntity = world.createEntity();
                    world.addComponent(moduleEntity, new ItemComponent(moduleDef.name, moduleDef.description || '', moduleDef.weight || 0, 0.5));
                    world.addComponent(moduleEntity, new NameComponent(moduleDef.name));
                    world.addComponent(moduleEntity, new PartComponent(moduleDef.part_type)); // Modules have PartComponent!
                    world.addComponent(moduleEntity, new RenderableComponent(moduleDef.char, moduleDef.colour, 0));

                    console.log(`  Entity ID: ${moduleEntity}`);
                    console.log(`  Components: ItemComponent ✓, PartComponent(${moduleDef.part_type}) ✓`);

                    if (playerInventory.items.has(moduleDef.name)) {
                        const existingStack = playerInventory.items.get(moduleDef.name);
                        existingStack.quantity += module.quantity;
                        console.log(`  Added to existing stack, new quantity: ${existingStack.quantity}`);
                    } else {
                        playerInventory.items.set(moduleDef.name, { entityId: moduleEntity, quantity: module.quantity });
                        console.log(`  Created new inventory entry`);
                    }
                } else {
                    console.log(`ERROR: Module definition not found for ${module.id}`);
                }
            }

            // Add some test modules to ship cargo too
            if (shipComponent) {
                console.log('\n--- Adding to Ship Cargo ---');
                const cargoModules = [
                    { id: 'PISTOL_SUPPRESSOR', quantity: 1 },    // 3 materials
                    { id: 'SHORT_BARREL', quantity: 1 }           // 2 materials
                ];

                for (const module of cargoModules) {
                    const moduleDef = EQUIPMENT_DATA.find(eq => eq.id === module.id);
                    if (moduleDef) {
                        console.log(`Spawning to cargo: ${moduleDef.name} (${module.id}) x${module.quantity}`);

                        const moduleEntity = world.createEntity();
                        world.addComponent(moduleEntity, new ItemComponent(moduleDef.name, moduleDef.description || '', moduleDef.weight || 0, 0.5));
                        world.addComponent(moduleEntity, new NameComponent(moduleDef.name));
                        world.addComponent(moduleEntity, new PartComponent(moduleDef.part_type)); // Modules have PartComponent!
                        world.addComponent(moduleEntity, new RenderableComponent(moduleDef.char, moduleDef.colour, 0));

                        shipComponent.cargo.set(moduleDef.name, { entityId: moduleEntity, quantity: module.quantity });
                        console.log(`  Added to ship cargo`);
                    }
                }
            }

            console.log('\n=== INVENTORY SUMMARY ===');
            console.log('Player inventory size:', playerInventory.items.size);
            console.log('Ship cargo size:', shipComponent ? shipComponent.cargo.size : 0);
            console.log('=== MODULE SPAWN COMPLETE ===\n');
        }
    }

    // Store map metadata in a global entity or directly in the world?
    // For now, let's attach it to the game object, which systems can access.
    // This will replace the old `currentRoom` properties.
    world.game.mapInfo = {
        name: map.name,
        temperature: map.temperature,
        layout: map.layout,
        width: map.width || (map.layout && map.layout[0] ? map.layout[0].length : 0),
        height: map.height || (map.layout ? map.layout.length : 0)
    };

    // Mark lighting system dirty (new map loaded)
    const lightingSystem = world.systems.find(s => s.constructor.name === 'LightingSystem');
    if (lightingSystem && lightingSystem.markDirty) {
        lightingSystem.markDirty();
    }

    // 4. Spawn test enemies for combat testing
    // TODO: Replace with proper enemy spawn locations from map data
    // Spawn enemy further from player (player at 20,10, enemy at 5,5 = 20 tiles away)
    // Don't spawn enemies on the SHIP map
    if (mapId !== 'SHIP') {
        spawnEnemy(world, 'SCAVENGER', 5, 5);
    }
}

// Helper function to create modular equipment from loadout
function createEquipmentFromLoadout(world, loadoutId, loadoutType) {
    const loadout = loadoutType === 'weapon'
        ? ENEMY_WEAPON_LOADOUTS[loadoutId]
        : ENEMY_ARMOUR_LOADOUTS[loadoutId];

    if (!loadout) {
        console.error(`Loadout not found: ${loadoutId}`);
        return null;
    }

    // Find base equipment definition
    const baseDef = EQUIPMENT_DATA.find(e => e.id === loadout.base);
    if (!baseDef) {
        console.error(`Base equipment not found: ${loadout.base}`);
        return null;
    }

    // Create base equipment entity
    const equipmentId = world.createEntity();
    world.addComponent(equipmentId, new ItemComponent(baseDef.name, baseDef.description || '', baseDef.weight || 0, baseDef.slots || 1.0));
    world.addComponent(equipmentId, new NameComponent(baseDef.name));
    world.addComponent(equipmentId, new EquipmentComponent(baseDef.equipment_slot));
    world.addComponent(equipmentId, new RenderableComponent(baseDef.char, baseDef.colour, 1));
    world.addComponent(equipmentId, new VisibilityStateComponent());

    // Add gun or armour component
    if (baseDef.gun_type) {
        world.addComponent(equipmentId, new GunComponent(baseDef.gun_type));
    }
    if (baseDef.armour_type) {
        world.addComponent(equipmentId, new ArmourComponent(baseDef.armour_type));
    }

    // Create attachment slots
    const attachmentSlots = new AttachmentSlotsComponent(JSON.parse(JSON.stringify(baseDef.attachment_slots)));

    // Install parts from loadout
    for (const [slotName, partId] of Object.entries(loadout.parts)) {
        const slot = attachmentSlots.slots[slotName];
        if (!slot) continue;

        // Find part definition
        const partDef = EQUIPMENT_DATA.find(p => p.id === partId);
        if (!partDef) {
            console.error(`Part not found: ${partId}`);
            continue;
        }

        // Create part entity
        const partEntityId = world.createEntity();
        world.addComponent(partEntityId, new ItemComponent(partDef.name, partDef.description || '', partDef.weight || 0, 0.5));
        world.addComponent(partEntityId, new NameComponent(partDef.name));
        world.addComponent(partEntityId, new PartComponent(partDef.part_type));
        world.addComponent(partEntityId, new VisibilityStateComponent());

        // Add stat modifiers if present
        if (partDef.modifiers && Object.keys(partDef.modifiers).length > 0) {
            world.addComponent(partEntityId, new StatModifierComponent(partDef.modifiers));
        }

        // Install part into slot
        slot.entity_id = partEntityId;
    }

    world.addComponent(equipmentId, attachmentSlots);

    // Calculate and add stats
    if (baseDef.gun_type) {
        updateGunStats(world, world.getEntity(equipmentId));
    }
    if (baseDef.armour_type) {
        updateArmourStats(world, world.getEntity(equipmentId));
    }

    return equipmentId;
}

// Helper function to select random loadout from weighted pool
function selectRandomLoadout(pool) {
    const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;

    for (const item of pool) {
        random -= item.weight;
        if (random <= 0) {
            return item.loadout;
        }
    }

    // Fallback to first item
    return pool[0].loadout;
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
    world.addComponent(enemyId, new VisibilityStateComponent());

    // Set body part efficiencies from definition
    if (enemyDef.body) {
        const enemy = world.getEntity(enemyId);
        const bodyParts = enemy.getComponent('BodyPartsComponent');
        bodyParts.setPart('head', enemyDef.body.head);
        bodyParts.setPart('torso', enemyDef.body.torso);
        bodyParts.setPart('limbs', enemyDef.body.limbs);
    }

    // Add AI component with stealth rating
    world.addComponent(enemyId, new AIComponent(
        enemyDef.aiType || 'aggressive',
        enemyDef.detectionRange || 10,
        enemyDef.stealth || 20
    ));

    // Set morale for humanoid enemies
    if (enemyDef.morale !== undefined) {
        const enemy = world.getEntity(enemyId);
        const ai = enemy.getComponent('AIComponent');
        ai.morale = enemyDef.morale;
    }

    // Add equipment component
    world.addComponent(enemyId, new EquippedItemsComponent());

    // Equip weapon and armor from loadout pools (for humanoid enemies)
    if (enemyDef.loadoutPool && ENEMY_LOADOUT_POOLS[enemyDef.loadoutPool]) {
        const pool = ENEMY_LOADOUT_POOLS[enemyDef.loadoutPool];
        const enemy = world.getEntity(enemyId);
        const equipped = enemy.getComponent('EquippedItemsComponent');

        // Select and create weapon
        if (pool.weapons && pool.weapons.length > 0) {
            const weaponLoadoutId = selectRandomLoadout(pool.weapons);
            const weaponId = createEquipmentFromLoadout(world, weaponLoadoutId, 'weapon');
            if (weaponId) {
                equipped.hand = weaponId;
            }
        }

        // Select and create armor
        if (pool.armor && pool.armor.length > 0) {
            const armorLoadoutId = selectRandomLoadout(pool.armor);
            const armorId = createEquipmentFromLoadout(world, armorLoadoutId, 'armour');
            if (armorId) {
                equipped.body = armorId;
            }
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
