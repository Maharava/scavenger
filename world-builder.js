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

            if (char === '+') {
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
    world.addComponent(player, new CreatureStatsComponent(50));
    world.addComponent(player, new BodyPartsComponent());
    world.addComponent(player, new InventoryComponent());
    world.addComponent(player, new EquippedItemsComponent());
    world.addComponent(player, new ComfortModifiersComponent());

    // Store map metadata in a global entity or directly in the world?
    // For now, let's attach it to the game object, which systems can access.
    // This will replace the old `currentRoom` properties.
    world.game.mapInfo = {
        name: map.name,
        temperature: map.temperature
    };
}
