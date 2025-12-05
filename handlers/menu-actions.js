// Menu action handlers
// All menu action callbacks in one place

// Helper function to find item definition across all data sources
function findItemDefinition(itemId) {
    let def = INTERACTABLE_DATA.find(i => i.id === itemId);
    if (!def) def = EQUIPMENT_DATA.find(i => i.id === itemId);
    if (!def) def = TOOL_DATA[itemId];
    if (!def) def = MATERIAL_DATA[itemId];
    if (!def) def = FOOD_DATA.find(i => i.id === itemId);
    if (!def) def = ITEM_DATA.find(i => i.id === itemId);
    return def;
}

const MENU_ACTIONS = {
    'close_menu': (game) => {
        closeTopMenu(game.world);
    },
    'open_door': (game, interactable) => {
        const pos = interactable.getComponent('PositionComponent');
        game.world.destroyEntity(interactable.id);

        // Remove from solid cache (door is now open, light can pass)
        game.world.removeSolidTileFromCache(pos.x, pos.y);

        const doorDef = INTERACTABLE_DATA.find(i => i.id === 'DOOR_OPEN');
        const newDoor = game.world.createEntity();
        game.world.addComponent(newDoor, new PositionComponent(pos.x, pos.y));
        game.world.addComponent(newDoor, new RenderableComponent(doorDef.char, doorDef.colour, 1));
        game.world.addComponent(newDoor, new NameComponent(doorDef.name));
        game.world.addComponent(newDoor, new InteractableComponent(doorDef.script, doorDef.scriptArgs));
        game.world.addComponent(newDoor, new VisibilityStateComponent()); // Add visibility

        // Only add SolidComponent if the door definition says it should be solid
        if (doorDef.solid) {
            game.world.addComponent(newDoor, new SolidComponent());
        }

        // Mark lighting system dirty (LOS has changed)
        const lightingSystem = game.world.systems.find(s => s.constructor.name === 'LightingSystem');
        if (lightingSystem) {
            lightingSystem.markDirty();
        }

        closeTopMenu(game.world);
    },
    'close_door': (game, interactable) => {
        const pos = interactable.getComponent('PositionComponent');
        game.world.destroyEntity(interactable.id);

        const doorDef = INTERACTABLE_DATA.find(i => i.id === 'DOOR_CLOSED');
        const newDoor = game.world.createEntity();
        game.world.addComponent(newDoor, new PositionComponent(pos.x, pos.y));
        game.world.addComponent(newDoor, new RenderableComponent(doorDef.char, doorDef.colour, 1));
        game.world.addComponent(newDoor, new NameComponent(doorDef.name));
        game.world.addComponent(newDoor, new InteractableComponent(doorDef.script, doorDef.scriptArgs));
        game.world.addComponent(newDoor, new VisibilityStateComponent()); // Add visibility

        // Only add SolidComponent if the door definition says it should be solid
        if (doorDef.solid) {
            game.world.addComponent(newDoor, new SolidComponent());
            // Add to solid cache (door is now closed, blocks light)
            game.world.addSolidTileToCache(pos.x, pos.y);
        }

        // Mark lighting system dirty (LOS has changed)
        const lightingSystem = game.world.systems.find(s => s.constructor.name === 'LightingSystem');
        if (lightingSystem) {
            lightingSystem.markDirty();
        }

        closeTopMenu(game.world);
    },
    'use_item': (game, itemEntity) => {
        const player = game.world.query(['PlayerComponent'])[0];
        if (!player) return;

        const consumable = itemEntity.getComponent('ConsumableComponent');
        const stats = player.getComponent('CreatureStatsComponent');
        const itemComponent = itemEntity.getComponent('ItemComponent');
        const itemName = itemComponent.name;

        if (consumable && stats) {
            switch (consumable.effect) {
                case 'RESTORE_HUNGER':
                    stats.hunger = Math.min(MAX_STAT_VALUE, stats.hunger + consumable.value);
                    game.world.addComponent(player.id, new MessageComponent(`Ate ${itemName}, hunger restored by ${consumable.value}!`, 'green'));
                    break;
                // Add other effects here as needed
            }

            const inventory = player.getComponent('InventoryComponent');
            if (inventory) {
                const inventoryItem = inventory.items.get(itemName);
                if (inventoryItem) {
                    inventoryItem.quantity--;
                    const menu = player.getComponent('MenuComponent'); // Get the current menu component

                    if (inventoryItem.quantity <= 0) {
                        inventory.items.delete(itemName);
                        game.world.destroyEntity(itemEntity.id); // Destroy the item entity only if quantity is 0
                        // If quantity is 0, close the submenu and return to main inventory
                        if (menu) {
                            menu.submenu1 = null;
                            menu.activeMenu = 'main';
                            menu.detailsPane = null; // Clear details pane
                        }
                        // Check if inventory is now empty and close menu
                        if (inventory.items.size === 0) {
                            closeTopMenu(game.world);
                            return; // Exit early as menu is closed
                        }
                    }
                    // Refresh the main inventory menu to update quantities
                    SCRIPT_REGISTRY['openInventoryMenu'](game, player);
                    // If quantity is not 0, the submenu should remain open, so we don't explicitly close it here.
                    // The openInventoryMenu call will rebuild the main menu, but the submenu will persist if not explicitly closed.
                } else {
                    // Fallback for non-stacked items or if somehow not in map (shouldn't happen if selected from menu)
                    game.world.destroyEntity(itemEntity.id);
                    // If item is destroyed, close the submenu and return to main inventory
                    const menu = player.getComponent('MenuComponent');
                    if (menu) {
                        menu.submenu1 = null;
                        menu.activeMenu = 'main';
                        menu.detailsPane = null; // Clear details pane
                    }
                    // Check if inventory is now empty and close menu
                    if (inventory.items.size === 0) {
                        closeTopMenu(game.world);
                        return; // Exit early as menu is closed
                    }
                    SCRIPT_REGISTRY['openInventoryMenu'](game, player); // Refresh main inventory
                }
            }
        }
        // If the item was not consumable or had no stats, just refresh the inventory and close submenu
        // This handles cases where an item might be "used" but not consumed (e.g., a key)
        if (!consumable || !stats) {
            const menu = player.getComponent('MenuComponent');
            if (menu) {
                menu.submenu1 = null;
                menu.activeMenu = 'main';
                menu.detailsPane = null; // Clear details pane
            }
            // Check if inventory is now empty and close menu
            if (inventory.items.size === 0) {
                closeTopMenu(game.world);
                return; // Exit early as menu is closed
            }
            SCRIPT_REGISTRY['openInventoryMenu'](game, player); // Refresh main inventory
        }
    },
    'equip_item': (game, itemEntity) => {
        const player = game.world.query(['PlayerComponent'])[0];
        if (!player) return;

        const equipment = itemEntity.getComponent('EquipmentComponent');
        const itemComponent = itemEntity.getComponent('ItemComponent');
        const equipped = player.getComponent('EquippedItemsComponent');
        const inventory = player.getComponent('InventoryComponent');

        if (!equipment || !equipped || !inventory) {
            closeTopMenu(game.world);
            return;
        }

        // Check if equipment has all required parts
        if (!isEquipmentValid(game.world, itemEntity)) {
            game.world.addComponent(player.id, new MessageComponent(`Cannot equip ${itemComponent.name} - missing required parts!`, 'red'));
            closeTopMenu(game.world);
            return;
        }

        const slot = equipment.slot;

        // Unequip current item in slot if exists
        if (equipped[slot]) {
            const currentEquipped = game.world.getEntity(equipped[slot]);
            if (currentEquipped) {
                // Check inventory space
                if (!inventory.canAddItem(game.world, currentEquipped, 1)) {
                    game.world.addComponent(player.id, new MessageComponent('Not enough space!', 'red'));
                    closeTopMenu(game.world);
                    return;
                }
                // Add old equipment to inventory using correct key
                const oldKey = getInventoryKey(currentEquipped);
                inventory.items.set(oldKey, { entityId: currentEquipped.id, quantity: 1 });
            }
        }

        // Equip new item (remove from inventory slots but weight still counts)
        equipped[slot] = itemEntity.id;
        // Delete from inventory using correct key
        const newKey = getInventoryKey(itemEntity);
        inventory.items.delete(newKey);
        game.world.addComponent(player.id, new MessageComponent(`Equipped ${itemComponent.name}!`, 'green'));

        // If inventory is now empty, close the menu
        if (inventory.items.size === 0) {
            closeTopMenu(game.world);
            return; // Exit early as menu is closed
        }

        // Re-open the inventory menu to refresh its contents
        SCRIPT_REGISTRY['openInventoryMenu'](game, player);
    },
    'unequip_item': (game, itemEntity) => {
        const player = game.world.query(['PlayerComponent'])[0];
        if (!player) return;

        const equipment = itemEntity.getComponent('EquipmentComponent');
        const itemComponent = itemEntity.getComponent('ItemComponent');
        const equipped = player.getComponent('EquippedItemsComponent');
        const inventory = player.getComponent('InventoryComponent');

        if (!equipment || !equipped || !inventory) {
            closeTopMenu(game.world);
            return;
        }

        const slot = equipment.slot;
        const playerPos = player.getComponent('PositionComponent');

        // Check if unequipping this tool will cause inventory slot loss
        const toolStats = itemEntity.getComponent('ToolStatsComponent');
        let slotsLost = 0;
        if (toolStats && toolStats.statBoosts && toolStats.statBoosts.inventorySlots) {
            slotsLost = toolStats.statBoosts.inventorySlots;
        }

        // Unequip the item first (this affects getPlayerMaxSlots calculation)
        equipped[slot] = null;

        // Calculate new effective max slots after unequipping
        const newMaxSlots = getPlayerMaxSlots(game.world, player);
        const currentSlotsUsed = inventory.getTotalSlotsUsed(game.world);

        // Check if we need to drop items due to slot overflow
        if (currentSlotsUsed > newMaxSlots) {
            const slotsToDrop = currentSlotsUsed - newMaxSlots;
            game.world.addComponent(player.id, new MessageComponent(
                `Lost ${slotsLost} inventory slots! Dropping items...`, 'yellow'
            ));

            // Build list of droppable items (exclude the item being unequipped)
            const droppableItems = [];
            for (const [key, itemData] of inventory.items) {
                const invItem = game.world.getEntity(itemData.entityId);
                if (invItem && invItem.id !== itemEntity.id) {
                    const invItemComp = invItem.getComponent('ItemComponent');
                    if (invItemComp) {
                        // Add each quantity as separate droppable entry
                        for (let i = 0; i < itemData.quantity; i++) {
                            droppableItems.push({ entity: invItem, key: key, itemData: itemData });
                        }
                    }
                }
            }

            // Randomly drop items until we're under the new capacity
            let slotsDropped = 0;
            while (slotsDropped < slotsToDrop && droppableItems.length > 0) {
                const randomIndex = Math.floor(Math.random() * droppableItems.length);
                const toDrop = droppableItems.splice(randomIndex, 1)[0];

                // Remove from inventory
                const itemData = toDrop.itemData;
                if (itemData.quantity > 1) {
                    itemData.quantity--;
                } else {
                    inventory.items.delete(toDrop.key);
                }

                // Drop at player position
                dropItemAt(game.world, toDrop.entity, playerPos.x, playerPos.y);

                const droppedItemComp = toDrop.entity.getComponent('ItemComponent');
                slotsDropped += droppedItemComp.slots;

                game.world.addComponent(player.id, new MessageComponent(
                    `Dropped ${droppedItemComp.name}`, 'orange'
                ));
            }
        }

        // Now check if we can add the unequipped item to inventory
        if (!inventory.canAddItem(game.world, itemEntity, 1)) {
            // No room - drop at feet
            dropItemAt(game.world, itemEntity, playerPos.x, playerPos.y);
            game.world.addComponent(player.id, new MessageComponent(
                `Unequipped ${itemComponent.name} (dropped at feet)`, 'yellow'
            ));
        } else {
            // Add to inventory
            const inventoryKey = getInventoryKey(itemEntity);
            inventory.items.set(inventoryKey, { entityId: itemEntity.id, quantity: 1 });
            game.world.addComponent(player.id, new MessageComponent(
                `Unequipped ${itemComponent.name}!`, 'green'
            ));
        }

        // Re-open the inventory menu to refresh its contents
        SCRIPT_REGISTRY['openInventoryMenu'](game, player);
    },
    'manage_attachments': (game, equipmentEntity) => {
        const player = game.world.query(['PlayerComponent'])[0];
        if (!player) return;

        const attachmentSlots = equipmentEntity.getComponent('AttachmentSlotsComponent');
        const itemComponent = equipmentEntity.getComponent('ItemComponent');

        if (!attachmentSlots) {
            closeTopMenu(game.world);
            return;
        }

        const menuOptions = [];

        // Show all slots with their current state
        for (const [slotName, slotData] of Object.entries(attachmentSlots.slots)) {
            let label = `${slotName}: `;

            if (slotData.entity_id) {
                const part = game.world.getEntity(slotData.entity_id);
                if (part) {
                    const partItem = part.getComponent('ItemComponent');
                    label += partItem.name;
                    menuOptions.push({
                        label: label,
                        action: 'detach_part',
                        actionArgs: { equipment: equipmentEntity, slotName: slotName }
                    });
                }
            } else {
                label += `Empty${slotData.required ? ' (REQUIRED)' : ''}`;
                menuOptions.push({
                    label: label,
                    action: 'attach_part_menu',
                    actionArgs: { equipment: equipmentEntity, slotName: slotName }
                });
            }
        }

        menuOptions.push({ label: 'Back', action: 'close_menu' });

        if (player && !player.hasComponent('MenuComponent')) {
            game.world.addComponent(player.id, new MenuComponent(`${itemComponent.name} - Attachments`, menuOptions, player));
        }
    },
    'attach_part_menu': (game, args) => {
        const player = game.world.query(['PlayerComponent'])[0];
        if (!player) return;

        const inventory = player.getComponent('InventoryComponent');
        const attachmentSlots = args.equipment.getComponent('AttachmentSlotsComponent');
        const slotData = attachmentSlots.slots[args.slotName];

        // Find compatible parts in inventory
        const menuOptions = [];
        for (const [itemName, itemData] of inventory.items) {
            const itemEntity = game.world.getEntity(itemData.entityId);
            const partComponent = itemEntity.getComponent('PartComponent');

            if (partComponent && partComponent.part_type === slotData.accepted_type) {
                menuOptions.push({
                    label: itemName,
                    action: 'attach_part',
                    actionArgs: { equipment: args.equipment, slotName: args.slotName, part: itemEntity }
                });
            }
        }

        if (menuOptions.length === 0) {
            game.world.addComponent(player.id, new MessageComponent(`No compatible parts for ${args.slotName}!`, 'yellow'));
            closeTopMenu(game.world);
            return;
        }

        menuOptions.push({ label: 'Back', action: 'manage_attachments', actionArgs: args.equipment });

        if (player && !player.hasComponent('MenuComponent')) {
            game.world.addComponent(player.id, new MenuComponent(`Attach to ${args.slotName}`, menuOptions, player));
        }
    },
    'attach_part': (game, args) => {
        const player = game.world.query(['PlayerComponent'])[0];
        if (!player) return;

        const inventory = player.getComponent('InventoryComponent');
        const attachmentSlots = args.equipment.getComponent('AttachmentSlotsComponent');
        const partItem = args.part.getComponent('ItemComponent');

        // Attach the part
        attachmentSlots.slots[args.slotName].entity_id = args.part.id;
        inventory.items.delete(partItem.name);

        game.world.addComponent(player.id, new MessageComponent(`Attached ${partItem.name}!`, 'green'));
        // Return to module view
        MENU_ACTIONS['show_equipment_slots'](game, args.equipment);
    },
    'detach_part': (game, args) => {
        const player = game.world.query(['PlayerComponent'])[0];
        if (!player) return;

        const inventory = player.getComponent('InventoryComponent');
        const attachmentSlots = args.equipment.getComponent('AttachmentSlotsComponent');
        const partId = attachmentSlots.slots[args.slotName].entity_id;

        if (!partId) {
            closeTopMenu(game.world);
            return;
        }

        const part = game.world.getEntity(partId);
        const partItem = part.getComponent('ItemComponent');

        // Check inventory space
        if (!inventory.canAddItem(game.world, part, 1)) {
            game.world.addComponent(player.id, new MessageComponent('Not enough space!', 'red'));
            closeTopMenu(game.world);
            return;
        }

        // Detach the part
        attachmentSlots.slots[args.slotName].entity_id = null;
        inventory.items.set(partItem.name, { entityId: part.id, quantity: 1 });

        game.world.addComponent(player.id, new MessageComponent(`Detached ${partItem.name}!`, 'green'));
        // Return to module view
        MENU_ACTIONS['show_equipment_slots'](game, args.equipment);
    },
    'view_equipment': (game) => {
        const player = game.world.query(['PlayerComponent'])[0];
        if (!player) return;

        const equipped = player.getComponent('EquippedItemsComponent');
        const menuOptions = [];

        // Show equipped items
        if (equipped.hand) {
            const handItem = game.world.getEntity(equipped.hand);
            const itemComponent = handItem.getComponent('ItemComponent');
            menuOptions.push({
                label: `Hand: ${itemComponent.name}`,
                action: 'equipment_submenu',
                actionArgs: handItem
            });
        } else {
            menuOptions.push({ label: 'Hand: Empty', action: 'close_menu' });
        }

        if (equipped.body) {
            const bodyItem = game.world.getEntity(equipped.body);
            const itemComponent = bodyItem.getComponent('ItemComponent');
            menuOptions.push({
                label: `Body: ${itemComponent.name}`,
                action: 'equipment_submenu',
                actionArgs: bodyItem
            });
        } else {
            menuOptions.push({ label: 'Body: Empty', action: 'close_menu' });
        }

        menuOptions.push({ label: 'Close', action: 'close_menu' });

        if (player && !player.hasComponent('MenuComponent')) {
            game.world.addComponent(player.id, new MenuComponent('Equipment', menuOptions, player));
        }
    },
    'equipment_submenu': (game, equipmentEntity) => {
        const player = game.world.query(['PlayerComponent'])[0];
        if (!player) return;

        const menu = player.getComponent('MenuComponent');
        if (!menu) return;

        const itemComponent = equipmentEntity.getComponent('ItemComponent');
        const attachmentSlots = equipmentEntity.getComponent('AttachmentSlotsComponent');
        const inCombat = player.hasComponent('CombatStateComponent');

        const submenuOptions = [
            { label: 'Inspect', action: 'inspect_item', actionArgs: equipmentEntity }
        ];

        // Only allow unequipping outside of combat
        if (!inCombat) {
            submenuOptions.push({ label: 'Unequip', action: 'unequip_equipped_item', actionArgs: equipmentEntity });
        }

        submenuOptions.push({ label: 'Exit', action: 'close_submenu' });

        // Set submenu1 and switch to it
        menu.submenu1 = { title: itemComponent.name, options: submenuOptions };
        menu.submenu1SelectedIndex = 0;
        menu.submenu2 = null;
        menu.activeMenu = 'submenu1';
        menu.detailsPane = null;
    },
    'unequip_equipped_item': (game, equipmentEntity) => {
        const player = game.world.query(['PlayerComponent'])[0];
        if (!player) return;

        const itemComponent = equipmentEntity.getComponent('ItemComponent');
        const equipped = player.getComponent('EquippedItemsComponent');
        const inventory = player.getComponent('InventoryComponent');

        if (!equipped || !inventory) {
            closeTopMenu(game.world);
            return;
        }

        // Find which slot the item is in
        let slot = null;
        if (equipped.hand === equipmentEntity.id) slot = 'hand';
        else if (equipped.body === equipmentEntity.id) slot = 'body';
        else if (equipped.tool1 === equipmentEntity.id) slot = 'tool1';
        else if (equipped.tool2 === equipmentEntity.id) slot = 'tool2';

        if (!slot) {
             game.world.addComponent(player.id, new MessageComponent(`Error: ${itemComponent.name} not equipped!`, 'red'));
             closeTopMenu(game.world);
             return;
        }


        // Check inventory space
        if (!inventory.canAddItem(game.world, equipmentEntity, 1)) {
            game.world.addComponent(player.id, new MessageComponent('Not enough space!', 'red'));
            closeTopMenu(game.world);
            return;
        }

        // Unequip item and add to inventory using correct key
        equipped[slot] = null;
        const inventoryKey = getInventoryKey(equipmentEntity);
        inventory.items.set(inventoryKey, { entityId: equipmentEntity.id, quantity: 1 });
        game.world.addComponent(player.id, new MessageComponent(`Unequipped ${itemComponent.name}!`, 'green'));

        // Handle light source
        const light = equipmentEntity.getComponent('LightSourceComponent');
        if (light) {
            // Recalculate player's light source based on other equipped items
            let newLightRadius = BASE_PLAYER_LIGHT_RADIUS;
            const tool1 = equipped.tool1 ? game.world.getEntity(equipped.tool1) : null;
            const tool2 = equipped.tool2 ? game.world.getEntity(equipped.tool2) : null;

            if (tool1 && tool1.hasComponent('LightSourceComponent')) {
                newLightRadius = Math.max(newLightRadius, tool1.getComponent('LightSourceComponent').radius);
            }
            if (tool2 && tool2.hasComponent('LightSourceComponent')) {
                newLightRadius = Math.max(newLightRadius, tool2.getComponent('LightSourceComponent').radius);
            }

            // Remove all light sources and add the new one
            const playerLights = player.getComponent('LightSourceComponent');
            if(playerLights) player.removeComponent('LightSourceComponent');
            player.addComponent(new LightSourceComponent(newLightRadius, true));


            const lightingSystem = game.world.systems.find(s => s instanceof LightingSystem);
            if (lightingSystem) {
                lightingSystem.markDirty();
            }
        }


        // Refresh the equipment view
        MENU_ACTIONS['view_equipment'](game);
    },
    'show_item_submenu': (game, itemEntity) => {
        const player = game.world.query(['PlayerComponent'])[0];
        if (!player) return;

        const menu = player.getComponent('MenuComponent');
        if (!menu) return;

        const itemComponent = itemEntity.getComponent('ItemComponent');
        const consumable = itemEntity.getComponent('ConsumableComponent');
        const equipment = itemEntity.getComponent('EquipmentComponent');
        const tool = itemEntity.getComponent('ToolComponent');

        const submenuOptions = [];

        // Add appropriate actions
        if (consumable) {
            submenuOptions.push({ label: 'Use', action: 'use_item', actionArgs: itemEntity });
        }

        if (equipment) {
            submenuOptions.push({ label: 'Equip', action: 'equip_item', actionArgs: itemEntity });
        }

        if (tool) {
            submenuOptions.push({ label: 'Equip to Tool 1', action: 'equip_tool', actionArgs: { itemEntity: itemEntity, slot: 'tool1' } });
            submenuOptions.push({ label: 'Equip to Tool 2', action: 'equip_tool', actionArgs: { itemEntity: itemEntity, slot: 'tool2' } });
        }

        // Always offer inspect option
        submenuOptions.push({ label: 'Inspect', action: 'inspect_item', actionArgs: itemEntity });

        submenuOptions.push({ label: 'Exit', action: 'close_submenu' });

        // Set submenu1 and switch to it
        menu.submenu1 = { title: itemComponent.name, options: submenuOptions };
        menu.submenu1SelectedIndex = 0;
        menu.submenu2 = null; // Clear deeper submenus
        menu.activeMenu = 'submenu1';
        menu.detailsPane = null; // Clear any existing details pane
    },
    'equip_tool': (game, args) => {
        const player = game.world.query(['PlayerComponent'])[0];
        if (!player) return;

        const { itemEntity, slot } = args;
        const itemComponent = itemEntity.getComponent('ItemComponent');
        const equipped = player.getComponent('EquippedItemsComponent');
        const inventory = player.getComponent('InventoryComponent');

        if (!equipped || !inventory) {
            closeTopMenu(game.world);
            return;
        }

        // Unequip current item in slot if exists
        if (equipped[slot]) {
            const currentEquipped = game.world.getEntity(equipped[slot]);
            if (currentEquipped) {
                 if (!inventory.canAddItem(game.world, currentEquipped, 1)) {
                    game.world.addComponent(player.id, new MessageComponent('Not enough space!', 'red'));
                    closeTopMenu(game.world);
                    return;
                }
                const oldKey = getInventoryKey(currentEquipped);
                inventory.items.set(oldKey, { entityId: currentEquipped.id, quantity: 1 });
            }
        }

        // Equip new item
        equipped[slot] = itemEntity.id;
        const newKey = getInventoryKey(itemEntity);
        inventory.items.delete(newKey);
        game.world.addComponent(player.id, new MessageComponent(`Equipped ${itemComponent.name} to ${slot}!`, 'green'));

        // Recalculate light source from all equipped tools
        let newLightRadius = BASE_PLAYER_LIGHT_RADIUS;
        const tool1 = equipped.tool1 ? game.world.getEntity(equipped.tool1) : null;
        const tool2 = equipped.tool2 ? game.world.getEntity(equipped.tool2) : null;

        if (tool1 && tool1.hasComponent('LightSourceComponent')) {
            newLightRadius = Math.max(newLightRadius, tool1.getComponent('LightSourceComponent').radius);
        }
        if (tool2 && tool2.hasComponent('LightSourceComponent')) {
            newLightRadius = Math.max(newLightRadius, tool2.getComponent('LightSourceComponent').radius);
        }

        // Update player's light source
        const playerLight = player.getComponent('LightSourceComponent');
        if (playerLight) player.removeComponent('LightSourceComponent');
        player.addComponent(new LightSourceComponent(newLightRadius, true));

        const lightingSystem = game.world.systems.find(s => s instanceof LightingSystem);
        if (lightingSystem) {
            lightingSystem.markDirty();
        }

        if (inventory.items.size === 0) {
            closeTopMenu(game.world);
            return;
        }

        SCRIPT_REGISTRY['openInventoryMenu'](game, player);
    },
    'inspect_item': (game, itemEntity) => {
        const player = game.world.query(['PlayerComponent'])[0];
        if (!player) return;

        const menu = player.getComponent('MenuComponent');
        if (!menu) return;

        const itemComponent = itemEntity.getComponent('ItemComponent');
        const statModifier = itemEntity.getComponent('StatModifierComponent');
        const consumable = itemEntity.getComponent('ConsumableComponent');
        const equipment = itemEntity.getComponent('EquipmentComponent');

        const lines = [];

        // Add description
        if (itemComponent.description) {
            lines.push(itemComponent.description);
            lines.push(''); // Blank line
        }

        // Add item type
        if (consumable) {
            lines.push('Type: Consumable');
        } else if (equipment) {
            lines.push(`Type: ${equipment.slot}`);
        }

        // Add stats if present
        if (statModifier && Object.keys(statModifier.modifiers).length > 0) {
            lines.push(''); // Blank line
            lines.push('Stats:');
            for (const [stat, value] of Object.entries(statModifier.modifiers)) {
                const sign = value >= 0 ? '+' : '';
                lines.push(`  ${stat}: ${sign}${value}`);
            }
        }

        // Set details pane
        menu.detailsPane = {
            title: itemComponent.name,
            lines: lines
        };
    },
    'close_submenu': (game) => {
        const player = game.world.query(['PlayerComponent'])[0];
        if (!player) return;

        const menu = player.getComponent('MenuComponent');
        if (menu) {
            // Close current submenu level
            if (menu.activeMenu === 'submenu2') {
                menu.submenu2 = null;
                menu.activeMenu = 'submenu1';
            } else if (menu.activeMenu === 'submenu1') {
                menu.submenu1 = null;
                menu.submenu2 = null;
                menu.activeMenu = 'main';
            }
            menu.detailsPane = null; // Clear details pane when closing submenu
        }
    },
    'show_equipment_slots': (game, equipmentEntity) => {
        const player = game.world.query(['PlayerComponent'])[0];
        if (!player) return;

        const menu = player.getComponent('MenuComponent');
        if (!menu) return;

        const itemComponent = equipmentEntity.getComponent('ItemComponent');
        const attachmentSlots = equipmentEntity.getComponent('AttachmentSlotsComponent');

        if (!attachmentSlots) return;

        const submenuOptions = [];

        // Show all slots with their current state
        for (const [slotName, slotData] of Object.entries(attachmentSlots.slots)) {
            let label = `${slotName}: `;

            if (slotData.entity_id) {
                const part = game.world.getEntity(slotData.entity_id);
                if (part) {
                    const partItem = part.getComponent('ItemComponent');
                    label += partItem.name;
                } else {
                    label += 'ERROR: Missing entity';
                }
            } else {
                label += `Empty${slotData.required ? ' (REQUIRED)' : ''}`;
            }

            submenuOptions.push({
                label: label,
                action: 'show_slot_mods',
                actionArgs: { equipment: equipmentEntity, slotName: slotName }
            });
        }

        submenuOptions.push({ label: 'Exit', action: 'close_submenu' });

        // Set submenu1 and auto-focus
        menu.submenu1 = { title: `${itemComponent.name} - Slots`, options: submenuOptions };
        menu.submenu1SelectedIndex = 0;
        menu.submenu2 = null; // Close any deeper submenus
        menu.activeMenu = 'submenu1';
        menu.detailsPane = null; // Clear details when opening new equipment
    },
    'show_slot_mods': (game, args) => {
        const player = game.world.query(['PlayerComponent'])[0];
        if (!player) return;

        const menu = player.getComponent('MenuComponent');
        if (!menu) return;

        // Check if this is armor and if it's too damaged to modify
        const armourStats = args.equipment.getComponent('ArmourStatsComponent');
        const itemComponent = args.equipment.getComponent('ItemComponent');
        if (armourStats) {
            const durabilityPercent = armourStats.getDurabilityPercent();
            if (durabilityPercent < 80) {
                game.world.addComponent(player.id, new MessageComponent(
                    `${itemComponent.name} is too damaged (${Math.floor(durabilityPercent)}%) to modify. Repair it to at least 80% durability first.`,
                    'red'
                ));
                // Stay on the slots menu
                return;
            }
        }

        const inventory = player.getComponent('InventoryComponent');
        const attachmentSlots = args.equipment.getComponent('AttachmentSlotsComponent');
        const slotData = attachmentSlots.slots[args.slotName];

        const submenuOptions = [];

        // If there's currently a module installed, add option to remove it
        if (slotData.entity_id) {
            const currentPart = game.world.getEntity(slotData.entity_id);
            if (currentPart) {
                const partItem = currentPart.getComponent('ItemComponent');
                submenuOptions.push({
                    label: `Remove ${partItem.name}`,
                    action: 'swap_module',
                    actionArgs: { equipment: args.equipment, slotName: args.slotName, newPart: null },
                    modEntity: currentPart
                });
            }
        }

        // Find compatible parts in inventory
        for (const [itemKey, itemData] of inventory.items) {
            const itemEntity = game.world.getEntity(itemData.entityId);
            const partComponent = itemEntity.getComponent('PartComponent');

            if (partComponent && partComponent.part_type === slotData.accepted_type) {
                // Get actual item name (itemKey might be entityId for non-stackable items)
                const itemComponent = itemEntity.getComponent('ItemComponent');
                const actualItemName = itemComponent ? itemComponent.name : itemKey;
                const label = slotData.entity_id ? `Swap with ${actualItemName}` : `Install ${actualItemName}`;
                submenuOptions.push({
                    label: label,
                    action: 'swap_module',
                    actionArgs: { equipment: args.equipment, slotName: args.slotName, newPart: itemEntity },
                    modEntity: itemEntity
                });
            }
        }

        if (submenuOptions.length === 0) {
            submenuOptions.push({ label: 'No compatible modules', action: 'close_submenu' });
        }

        submenuOptions.push({ label: 'Exit', action: 'close_submenu' });

        // Set submenu2 and auto-focus
        menu.submenu2 = { title: `${args.slotName}`, options: submenuOptions };
        menu.submenu2SelectedIndex = 0;
        menu.activeMenu = 'submenu2';

        // Show details for first mod (if any)
        MENU_ACTIONS['update_workbench_details'](game);
    },
    'update_workbench_details': (game) => {
        const player = game.world.query(['PlayerComponent'])[0];
        if (!player) return;

        const menu = player.getComponent('MenuComponent');
        if (!menu || menu.menuType !== 'workbench') return;

        // Only show details if in submenu2 (mod selection)
        if (menu.activeMenu === 'submenu2' && menu.submenu2) {
            const selectedOption = menu.submenu2.options[menu.submenu2SelectedIndex];
            if (selectedOption && selectedOption.modEntity) {
                const modEntity = selectedOption.modEntity;
                const itemComponent = modEntity.getComponent('ItemComponent');
                const statModifier = modEntity.getComponent('StatModifierComponent');
                const partComponent = modEntity.getComponent('PartComponent');

                const lines = [];

                if (itemComponent.description) {
                    lines.push(itemComponent.description);
                    lines.push('');
                }

                if (partComponent) {
                    lines.push(`Type: ${partComponent.part_type}`);
                }

                if (statModifier && Object.keys(statModifier.modifiers).length > 0) {
                    lines.push('');
                    lines.push('Stats:');
                    for (const [stat, value] of Object.entries(statModifier.modifiers)) {
                        const sign = value >= 0 ? '+' : '';
                        lines.push(`  ${stat}: ${sign}${value}`);
                    }
                }

                menu.detailsPane = {
                    title: itemComponent.name,
                    lines: lines
                };
            } else {
                menu.detailsPane = null;
            }
        } else if (menu.activeMenu === 'submenu1') {
            // Clear details when navigating back to slot selection
            menu.detailsPane = null;
        }
    },
    'swap_module': (game, args) => {
        const player = game.world.query(['PlayerComponent'])[0];
        if (!player) return;

        const inventory = player.getComponent('InventoryComponent');
        const attachmentSlots = args.equipment.getComponent('AttachmentSlotsComponent');
        const slotData = attachmentSlots.slots[args.slotName];

        // Remove old part if it exists
        if (slotData.entity_id) {
            const oldPart = game.world.getEntity(slotData.entity_id);
            if (oldPart) {
                // Check inventory space if we're installing a new part (swapping)
                if (args.newPart && !inventory.canAddItem(game.world, oldPart, 1)) {
                    game.world.addComponent(player.id, new MessageComponent('Not enough space!', 'red'));
                    closeTopMenu(game.world);
                    return;
                }

                // Add old part to inventory using correct key
                const oldPartKey = getInventoryKey(oldPart);
                inventory.items.set(oldPartKey, { entityId: oldPart.id, quantity: 1 });
            }
        }

        // Install new part if provided
        if (args.newPart) {
            const newPartItem = args.newPart.getComponent('ItemComponent');
            attachmentSlots.slots[args.slotName].entity_id = args.newPart.id;
            // Delete from inventory using correct key
            const newPartKey = getInventoryKey(args.newPart);
            inventory.items.delete(newPartKey);
            game.world.addComponent(player.id, new MessageComponent(`Installed ${newPartItem.name}!`, 'green'));
        } else {
            // Just removing the module
            attachmentSlots.slots[args.slotName].entity_id = null;
            game.world.addComponent(player.id, new MessageComponent(`Removed module from ${args.slotName}!`, 'green'));
        }

        // Update equipment stats
        updateArmourStats(game.world, args.equipment); // Updates if armor
        updateGunStats(game.world, args.equipment); // Updates if gun

        // Refresh the equipment slots submenu and close the mod selection submenu
        MENU_ACTIONS['show_equipment_slots'](game, args.equipment);
    },
    'sleep': (game, args) => {
        const player = game.world.query(['PlayerComponent'])[0];
        if (!player) return;

        // Close the menu first
        closeTopMenu(game.world);

        // Get the TimeSystem and initiate sleep
        const timeSystem = game.world.systems.find(s => s instanceof TimeSystem);
        if (timeSystem) {
            timeSystem.startSleep(game.world, player, args.hours);
        } else {
            game.world.addComponent(player.id, new MessageComponent('Error: Time system not found!', 'red'));
        }
    },
    'startProduction': (game, args) => {
        const player = game.world.query(['PlayerComponent'])[0];
        if (!player) return;

        const { recipeId, producerId } = args;
        const producerEntity = game.world.getEntity(producerId);
        const producer = producerEntity.getComponent('ProducerComponent');
        const inventory = player.getComponent('InventoryComponent');
        const timeComponent = player.getComponent('TimeComponent');

        // Find the recipe
        const recipes = PRODUCER_RECIPES[producer.producerType];
        const recipe = recipes.find(r => r.id === recipeId);
        if (!recipe) return;

        const producerType = PRODUCER_TYPES[producer.producerType];
        if (!producerType) return;

        // Find input item definition
        const inputItemDef = findItemDefinition(recipe.inputItemId);
        if (!inputItemDef) return;

        // Remove input item from inventory
        const inventoryItem = inventory.items.get(inputItemDef.name);
        if (inventoryItem) {
            inventoryItem.quantity--;
            if (inventoryItem.quantity <= 0) {
                inventory.items.delete(inputItemDef.name);
            }
        }

        // Start production (deadline-based system)
        producer.state = 'processing';
        producer.recipeId = recipeId;
        producer.inputItemId = recipe.inputItemId;
        // Calculate end time using base recipe time (no skill applied yet)
        producer.endTotalMinutes = timeComponent.totalMinutes + recipe.processingTime;
        producer.baseProductionTime = recipe.processingTime;
        producer.lastReductionDay = timeComponent.day; // Track current day

        closeTopMenu(game.world);
        game.world.addComponent(player.id, new MessageComponent(`${producerType.startSuccessPrefix} ${inputItemDef.name}.`, 'green'));
    },
    'collectOutput': (game, args) => {
        const player = game.world.query(['PlayerComponent'])[0];
        if (!player) return;

        const { producerId } = args;
        const producerEntity = game.world.getEntity(producerId);
        const producer = producerEntity.getComponent('ProducerComponent');
        const inventory = player.getComponent('InventoryComponent');
        const skills = player.getComponent('SkillsComponent');

        // Find the recipe
        const recipes = PRODUCER_RECIPES[producer.producerType];
        const recipe = recipes.find(r => r.id === producer.recipeId);
        if (!recipe) return;

        const producerType = PRODUCER_TYPES[producer.producerType];
        if (!producerType) return;

        // Get skill level for bonuses
        const skillLevel = (producerType.linkedSkill && skills) ? (skills[producerType.linkedSkill] || 0) : 0;
        const secondaryChanceBonus = producerType.skillBonuses?.secondaryOutputBonus || 0;

        // Process each output from the recipe
        let primaryOutputMessage = '';
        let secondaryOutputFound = false;

        for (let i = 0; i < recipe.outputs.length; i++) {
            const output = recipe.outputs[i];

            // Apply skill bonus to secondary/tertiary outputs (index > 0)
            let outputChance = output.chance;
            if (i > 0) {
                outputChance += (skillLevel * secondaryChanceBonus);
            }

            // Check if this output is produced
            if (Math.random() < outputChance) {
                const quantity = Math.floor(Math.random() * (output.quantityMax - output.quantityMin + 1)) + output.quantityMin;

                if (quantity > 0) {
                    const outputItemDef = findItemDefinition(output.itemId);
                    if (outputItemDef) {
                        // Create the output item entity
                        const outputEntity = game.world.createEntity();
                        game.world.addComponent(outputEntity, new ItemComponent(outputItemDef.name, '', outputItemDef.weight || 0, outputItemDef.slots || 0));
                        game.world.addComponent(outputEntity, new NameComponent(outputItemDef.name));
                        game.world.addComponent(outputEntity, new StackableComponent(1, 99));

                        // Add consumable component if it exists
                        if (outputItemDef.scriptArgs && outputItemDef.scriptArgs.effect) {
                            game.world.addComponent(outputEntity, new ConsumableComponent(outputItemDef.scriptArgs.effect, outputItemDef.scriptArgs.value));
                        }

                        // Add to inventory
                        if (inventory.items.has(outputItemDef.name)) {
                            const existingStack = inventory.items.get(outputItemDef.name);
                            existingStack.quantity += quantity;
                        } else {
                            inventory.items.set(outputItemDef.name, { entityId: outputEntity, quantity: quantity });
                        }

                        // Track message for primary output
                        if (i === 0) {
                            primaryOutputMessage = `${producerType.collectSuccessPrefix} ${quantity} ${outputItemDef.name}.`;
                        } else {
                            secondaryOutputFound = true;
                        }
                    }
                }
            }
        }

        // Display messages
        if (primaryOutputMessage) {
            game.world.addComponent(player.id, new MessageComponent(primaryOutputMessage, 'green'));
        }
        if (secondaryOutputFound) {
            game.world.addComponent(player.id, new MessageComponent(producerType.foundSecondaryMessage, 'green'));
        }

        // Reset producer state (deadline-based system)
        producer.state = 'empty';
        producer.recipeId = null;
        producer.inputItemId = null;
        producer.endTotalMinutes = 0;
        producer.baseProductionTime = 0;
        producer.lastReductionDay = 0;

        // Trigger skill check if linked skill exists
        if (producerType.linkedSkill) {
            const skillsSystem = game.world.systems.find(s => s.constructor.name === 'SkillsSystem');
            if (skillsSystem) {
                const checkMethodName = `check${producerType.linkedSkill.charAt(0).toUpperCase() + producerType.linkedSkill.slice(1)}LevelUp`;
                if (skillsSystem[checkMethodName]) {
                    skillsSystem[checkMethodName](game.world, player);
                }
            }
        }

        closeTopMenu(game.world);
    },
    'clearFailedProducer': (game, args) => {
        const player = game.world.query(['PlayerComponent'])[0];
        if (!player) return;

        const { producerId } = args;
        const producerEntity = game.world.getEntity(producerId);
        const producer = producerEntity.getComponent('ProducerComponent');

        if (!producer || producer.state !== 'failed') return;

        // Reset producer to empty state
        producer.state = 'empty';
        producer.recipeId = null;
        producer.inputItemId = null;
        producer.endTotalMinutes = 0;
        producer.baseProductionTime = 0;
        producer.lastReductionDay = 0;

        closeTopMenu(game.world);
        game.world.addComponent(player.id, new MessageComponent('Cleared the dead plants.', 'yellow'));
    },
    'start_expedition': (game, args) => {
        const player = game.world.query(['PlayerComponent'])[0];
        if (!player) return;

        const { locationId } = args;

        // Check if LOCATION_DATA exists
        if (!LOCATION_DATA || !LOCATION_DATA[locationId]) {
            game.world.addComponent(player.id, new MessageComponent(`Error: Location ${locationId} not found!`, 'red'));
            closeTopMenu(game.world);
            return;
        }

        // Save ship state before leaving (for return journey)
        saveShipState(game.world, player);

        // Generate a new map using the procgen system
        const seed = Date.now();
        const generatedMap = generateExpeditionMap(locationId, seed, false); // false = no enemies for now

        if (!generatedMap) {
            game.world.addComponent(player.id, new MessageComponent(`Error: Failed to generate map for ${locationId}!`, 'red'));
            closeTopMenu(game.world);
            return;
        }

        // Close menu
        closeTopMenu(game.world);

        // Load the generated map
        buildWorld(game.world, generatedMap.id, generatedMap);
        game.world.addComponent(player.id, new MessageComponent(`Starting expedition to ${generatedMap.name}...`, 'cyan'));
    },
    'confirm_return_to_ship': (game) => {
        const player = game.world.query(['PlayerComponent'])[0];
        if (!player) return;

        // Get current time before reloading ship
        const timeComponent = player.getComponent('TimeComponent');
        const totalMinutesAway = timeComponent ? timeComponent.totalMinutes : 0;

        closeTopMenu(game.world);

        // Reload ship map
        buildWorld(game.world, 'SHIP');

        // After ship loads, calculate off-ship water consumption
        const newPlayer = game.world.query(['PlayerComponent'])[0];
        if (newPlayer) {
            const newTimeComponent = newPlayer.getComponent('TimeComponent');
            const shipEntity = game.world.query(['ShipComponent'])[0];
            const producers = game.world.query(['ProducerComponent']);

            if (shipEntity && newTimeComponent) {
                const ship = shipEntity.getComponent('ShipComponent');

                // Calculate time away (in hours)
                // Note: When ship loads, time is restored from save, so we need to compare
                const timeAwayMinutes = totalMinutesAway - (newTimeComponent.totalMinutes || 0);
                const hoursAway = Math.abs(timeAwayMinutes) / 60;

                // Count active hydroponics bays
                let activeHydroponicsBays = 0;
                const processingBays = [];

                for (const producer of producers) {
                    const producerComp = producer.getComponent('ProducerComponent');
                    if (producerComp.producerType === 'HYDROPONICS' && producerComp.state === 'processing') {
                        activeHydroponicsBays++;
                        processingBays.push(producer);
                    }
                }

                if (activeHydroponicsBays > 0 && hoursAway > 0) {
                    // Calculate water consumed
                    const waterConsumed = HYDROPONICS_WATER_PER_HOUR * activeHydroponicsBays * hoursAway;
                    const waterBefore = ship.water;

                    ship.consumeWater(waterConsumed);

                    // Check if water ran out
                    if (ship.water <= 0) {
                        // Mark all processing hydroponics as failed
                        for (const producer of processingBays) {
                            const producerComp = producer.getComponent('ProducerComponent');
                            producerComp.state = 'failed';
                        }
                        game.world.addComponent(newPlayer.id, new MessageComponent('WARNING: Ship water depleted! Hydroponics systems failed!', 'red'));
                    } else if (waterConsumed > 0) {
                        game.world.addComponent(newPlayer.id, new MessageComponent(`Hydroponics consumed ${waterConsumed.toFixed(1)}L water while you were away.`, 'cyan'));
                    }
                }
            }

            game.world.addComponent(newPlayer.id, new MessageComponent('Returned to ship successfully.', 'green'));
        }
    }
};
