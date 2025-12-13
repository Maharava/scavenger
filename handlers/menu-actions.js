/**
 * Menu Action Handlers
 * ===================
 * All menu action callbacks for the game.
 *
 * This file is organized into the following sections:
 * - DOOR ACTIONS: Opening and closing doors
 * - ITEM ACTIONS: Using, inspecting, and managing items
 * - INVENTORY ACTIONS: Inventory and equipment management
 * - EQUIPMENT ACTIONS: Equipping, unequipping, and modifying gear
 * - LOOT ACTIONS: Taking items from corpses
 * - PRODUCER ACTIONS: Hydroponics and other producers
 * - SHIP ACTIONS: Sleeping, cargo, building, recycling
 * - MENU NAVIGATION: General menu controls
 *
 * Note: Helper function findItemDefinition() is now available as world.findItemDefinition()
 */

const MENU_ACTIONS = {
    // =========================================================================
    // DOOR ACTIONS
    // =========================================================================
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
        const lightingSystem = game.world.getSystem(LightingSystem);
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
        const lightingSystem = game.world.getSystem(LightingSystem);
        if (lightingSystem) {
            lightingSystem.markDirty();
        }

        closeTopMenu(game.world);
    },
    'use_item': (game, itemEntity) => {
    // =========================================================================
    // ITEM ACTIONS - Using, inspecting consumables and items
    // =========================================================================
        const player = game.world.getPlayer();
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

                case 'RESTORE_HUNGER_AND_COMFORT_BUFF':
                    stats.hunger = Math.min(MAX_STAT_VALUE, stats.hunger + consumable.value);
                    const buffValue = itemEntity.comfortBuffValue || 15;
                    const buffDuration = itemEntity.comfortBuffDuration || 60;
                    stats.comfort = Math.min(MAX_STAT_VALUE, stats.comfort + buffValue);
                    game.world.addComponent(player.id, new MessageComponent(`Ate ${itemName}! Hunger +${consumable.value}, Comfort +${buffValue} for ${buffDuration}min`, 'green'));
                    break;

                case 'RESTORE_HUNGER_AND_COMFORT':
                    stats.hunger = Math.min(MAX_STAT_VALUE, stats.hunger + consumable.value);
                    const comfortBoost = itemEntity.secondaryEffectValue || 10;
                    stats.comfort = Math.min(MAX_STAT_VALUE, stats.comfort + comfortBoost);
                    game.world.addComponent(player.id, new MessageComponent(`Ate ${itemName}! Hunger +${consumable.value}, Comfort +${comfortBoost}`, 'green'));
                    break;

                case 'RESTORE_HUNGER_AND_REDUCE_STRESS':
                    stats.hunger = Math.min(MAX_STAT_VALUE, stats.hunger + consumable.value);
                    const stressReduction = itemEntity.secondaryEffectValue || 15;
                    stats.stress = Math.max(0, stats.stress - stressReduction);
                    game.world.addComponent(player.id, new MessageComponent(`Ate ${itemName}! Hunger +${consumable.value}, Stress -${stressReduction}`, 'green'));
                    break;

                case 'RESTORE_HUNGER_AND_REDUCE_REST':
                    stats.hunger = Math.min(MAX_STAT_VALUE, stats.hunger + consumable.value);
                    const restReduction = itemEntity.secondaryEffectValue || 15;
                    stats.rest = Math.max(0, stats.rest - restReduction);
                    game.world.addComponent(player.id, new MessageComponent(`Ate ${itemName}! Hunger +${consumable.value}, feeling energized!`, 'green'));
                    break;

                case 'RESTORE_HUNGER_AND_RESTORE_REST':
                    stats.hunger = Math.min(MAX_STAT_VALUE, stats.hunger + consumable.value);
                    const restRestore = itemEntity.secondaryEffectValue || 20;
                    stats.rest = Math.min(MAX_STAT_VALUE, stats.rest + restRestore);
                    game.world.addComponent(player.id, new MessageComponent(`Ate ${itemName}! Hunger +${consumable.value}, Rest +${restRestore}`, 'green'));
                    break;
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
    // =========================================================================
    // EQUIPMENT ACTIONS - Equipping, unequipping, managing attachments
    // =========================================================================
        const player = game.world.getPlayer();
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
        const player = game.world.getPlayer();
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
        const player = game.world.getPlayer();
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
        const player = game.world.getPlayer();
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
        const player = game.world.getPlayer();
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
        const player = game.world.getPlayer();
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
        const player = game.world.getPlayer();
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
        const player = game.world.getPlayer();
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
        const player = game.world.getPlayer();
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
    // =========================================================================
    // INVENTORY ACTIONS - Inventory management and item submenus
    // =========================================================================
        const player = game.world.getPlayer();
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
        const player = game.world.getPlayer();
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
        const player = game.world.getPlayer();
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
        const player = game.world.getPlayer();
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
        const player = game.world.getPlayer();
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
        const player = game.world.getPlayer();
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
        const player = game.world.getPlayer();
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
        const player = game.world.getPlayer();
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
    // =========================================================================
    // SHIP ACTIONS - Sleep, expeditions, ship interactables
    // =========================================================================
        const player = game.world.getPlayer();
        if (!player) return;

        // Close the menu first
        closeTopMenu(game.world);

        // Get the TimeSystem and initiate sleep
        const timeSystem = game.world.systems.find(s => s instanceof TimeSystem);
        if (timeSystem) {
            timeSystem.startSleep(game.world, player, args.hours);

            // Save game after sleeping
            saveShipState(game.world);
        } else {
            game.world.addComponent(player.id, new MessageComponent('Error: Time system not found!', 'red'));
        }
    },
    'use_shower': (game, args) => {
        const player = game.world.getPlayer();
        if (!player) return;

        const { showerEntity } = args;
        const showerPos = showerEntity.getComponent('PositionComponent');
        const playerPos = player.getComponent('PositionComponent');

        if (!showerPos || !playerPos) return;

        // Close menu
        closeTopMenu(game.world);

        // Store original position
        const originalX = playerPos.x;
        const originalY = playerPos.y;

        // Move player to shower tile
        playerPos.x = showerPos.x;
        playerPos.y = showerPos.y;

        // Start showering animation
        game.world.addComponent(player.id, new ShoweringComponent(
            showerPos.x,
            showerPos.y,
            originalX,
            originalY
        ));

        // Disable player input during shower
        const inputSystem = game.world.getSystem(InputSystem);
        if (inputSystem) {
            inputSystem.enabled = false;
            // Re-enable after 5 seconds
            setTimeout(() => {
                if (inputSystem) inputSystem.enabled = true;
            }, 5000);
        }
    },
    'startProduction': (game, args) => {
        const player = game.world.getPlayer();
        if (!player) return;

        const { recipeId, producerId, itemSource, itemKey } = args;
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

        // Remove input item from the correct source (inventory or ship cargo)
        if (itemSource === 'cargo') {
            const shipEntity = game.world.query(['ShipComponent'])[0];
            if (!shipEntity) return;

            const ship = shipEntity.getComponent('ShipComponent');
            const cargoItem = ship.cargo.get(itemKey);
            if (cargoItem) {
                cargoItem.quantity--;
                if (cargoItem.quantity <= 0) {
                    ship.cargo.delete(itemKey);
                }
            }
        } else {
            // Default to inventory
            const inventoryItem = inventory.items.get(itemKey || inputItemDef.name);
            if (inventoryItem) {
                inventoryItem.quantity--;
                if (inventoryItem.quantity <= 0) {
                    inventory.items.delete(itemKey || inputItemDef.name);
                }
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
        const player = game.world.getPlayer();
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
            const skillsSystem = game.world.getSystem(SkillsSystem);
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
        const player = game.world.getPlayer();
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
        const player = game.world.getPlayer();
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

    // === COOKING ACTIONS ===

    /**
     * Shows recipe details including ingredients and effects.
     * Offers options to cook the recipe or go back.
     */
    'show_recipe_details': (game, args) => {
        const player = game.world.getPlayer();
        if (!player) return;

        const { recipe, canMake, stove } = args;
        const menu = player.getComponent('MenuComponent');
        if (!menu) return;

        // Build details text showing ingredients and effects
        const details = [];
        details.push(`${recipe.description}`);
        details.push('');
        details.push('Ingredients:');
        for (const ingredient of recipe.ingredients) {
            const def = game.world.findItemDefinition(ingredient.itemId);
            const name = def ? def.name : ingredient.itemId;
            details.push(`  ${ingredient.quantity}x ${name}`);
        }
        details.push('');
        details.push(`Restores: ${recipe.output.hungerRestore} hunger`);
        if (recipe.output.effect) {
            let effectText = '';
            switch (recipe.output.effect) {
                case 'COMFORT_BUFF':
                    effectText = `+${recipe.output.effectValue} Comfort for ${recipe.output.effectDuration} minutes`;
                    break;
                case 'COMFORT_BOOST':
                    effectText = `+${recipe.output.effectValue} Comfort`;
                    break;
                case 'STRESS_REDUCE':
                    effectText = `-${recipe.output.effectValue} Stress`;
                    break;
                case 'REST_REDUCE':
                    effectText = `Reduces tiredness by ${recipe.output.effectValue}`;
                    break;
                case 'REST_RESTORE':
                    effectText = `+${recipe.output.effectValue} Rest`;
                    break;
            }
            if (effectText) {
                details.push(`Effect: ${effectText}`);
            }
        }
        details.push('');
        details.push(`Weight: ${recipe.output.weight}g | Slots: ${recipe.output.slots}`);

        const submenuOptions = [
            { label: 'Cook (x1)', action: 'cook_recipe', actionArgs: { recipe, quantity: 1, stove } }
        ];

        if (canMake >= 5) {
            submenuOptions.push({ label: 'Cook (x5)', action: 'cook_recipe', actionArgs: { recipe, quantity: 5, stove } });
        }

        submenuOptions.push({ label: 'Back', action: 'close_submenu' });

        // Create submenu
        menu.submenu1 = {
            title: recipe.name,
            options: submenuOptions,
            context: stove,
            details: details.join('\n')
        };
        menu.activeMenu = 'submenu1';
    },

    /**
     * Cooks a recipe, consuming ingredients and creating the meal.
     * Triggers cooking skill progression.
     */
    'cook_recipe': (game, args) => {
        const player = game.world.getPlayer();
        if (!player) return;

        const { recipe, quantity, stove } = args;
        const inventory = player.getComponent('InventoryComponent');
        const skills = player.getComponent('SkillsComponent');

        if (!inventory || !skills) return;

        // Helper function to consume ingredients from inventory or cargo
        const consumeIngredient = (itemId, qty) => {
            let remaining = qty;

            // First try player inventory
            for (const [itemName, itemData] of inventory.items) {
                if (remaining <= 0) break;

                const itemEntity = game.world.getEntity(itemData.entityId);
                if (!itemEntity) continue;

                const def = game.world.findItemDefinition(itemId);
                if (!def || def.name !== itemName) continue;

                const stackable = itemEntity.getComponent('StackableComponent');
                if (!stackable) continue;

                const toConsume = Math.min(stackable.quantity, remaining);
                stackable.quantity -= toConsume;
                remaining -= toConsume;

                if (stackable.quantity <= 0) {
                    inventory.items.delete(itemName);
                    game.world.destroyEntity(itemEntity.id);
                }
            }

            // Then try ship cargo if still needed
            if (remaining > 0) {
                const ship = game.world.getShip();
                if (ship) {
                    const shipComp = ship.getComponent('ShipComponent');
                    if (shipComp && shipComp.cargoInventory) {
                        for (const [itemName, itemData] of shipComp.cargoInventory) {
                            if (remaining <= 0) break;

                            const itemEntity = game.world.getEntity(itemData.entityId);
                            if (!itemEntity) continue;

                            const def = game.world.findItemDefinition(itemId);
                            if (!def || def.name !== itemName) continue;

                            const stackable = itemEntity.getComponent('StackableComponent');
                            if (!stackable) continue;

                            const toConsume = Math.min(stackable.quantity, remaining);
                            stackable.quantity -= toConsume;
                            remaining -= toConsume;

                            if (stackable.quantity <= 0) {
                                shipComp.cargoInventory.delete(itemName);
                                game.world.destroyEntity(itemEntity.id);
                            }
                        }
                    }
                }
            }

            return remaining === 0;
        };

        // Cook each requested quantity
        for (let i = 0; i < quantity; i++) {
            // Consume all ingredients
            let success = true;
            for (const ingredient of recipe.ingredients) {
                if (!consumeIngredient(ingredient.itemId, ingredient.quantity)) {
                    success = false;
                    game.world.addComponent(player.id, new MessageComponent('Not enough ingredients!', 'red'));
                    return;
                }
            }

            if (success) {
                // Create the cooked meal
                const mealEntity = game.world.createEntity();
                game.world.addComponent(mealEntity, new ItemComponent(recipe.name, recipe.description, recipe.output.weight, recipe.output.slots));
                game.world.addComponent(mealEntity, new NameComponent(recipe.name));
                game.world.addComponent(mealEntity, new StackableComponent(1, 99));

                // Add consumable component with effects
                if (recipe.output.effect) {
                    let effectType = 'RESTORE_HUNGER';
                    let effectValue = recipe.output.hungerRestore;

                    // For meals with secondary effects, we'll use a compound effect
                    // The use_item action will need to handle these
                    switch (recipe.output.effect) {
                        case 'COMFORT_BUFF':
                            effectType = 'RESTORE_HUNGER_AND_COMFORT_BUFF';
                            break;
                        case 'COMFORT_BOOST':
                            effectType = 'RESTORE_HUNGER_AND_COMFORT';
                            break;
                        case 'STRESS_REDUCE':
                            effectType = 'RESTORE_HUNGER_AND_REDUCE_STRESS';
                            break;
                        case 'REST_REDUCE':
                            effectType = 'RESTORE_HUNGER_AND_REDUCE_REST';
                            break;
                        case 'REST_RESTORE':
                            effectType = 'RESTORE_HUNGER_AND_RESTORE_REST';
                            break;
                    }

                    game.world.addComponent(mealEntity, new ConsumableComponent(effectType, effectValue));

                    // Store secondary effect data
                    if (recipe.output.effect === 'COMFORT_BUFF') {
                        // For timed buffs, we need to store duration and value
                        mealEntity.comfortBuffValue = recipe.output.effectValue;
                        mealEntity.comfortBuffDuration = recipe.output.effectDuration;
                    } else {
                        mealEntity.secondaryEffectValue = recipe.output.effectValue;
                    }
                } else {
                    // Simple hunger restore only
                    game.world.addComponent(mealEntity, new ConsumableComponent('RESTORE_HUNGER', recipe.output.hungerRestore));
                }

                // Add to inventory
                if (inventory.items.has(recipe.name)) {
                    const existingStack = inventory.items.get(recipe.name);
                    existingStack.quantity++;
                } else {
                    inventory.items.set(recipe.name, { entityId: mealEntity.id, quantity: 1 });
                }
            }
        }

        // Trigger cooking skill progression
        const cookingSkill = skills.skills.get('Cooking');
        if (cookingSkill) {
            cookingSkill.hasCookedToday = true;
        }

        // Close menus and show success message
        closeTopMenu(game.world);
        const qtyLabel = quantity > 1 ? ` (x${quantity})` : '';
        game.world.addComponent(player.id, new MessageComponent(`Cooked ${recipe.name}${qtyLabel}!`, 'green'));
    },

    'confirm_return_to_ship': (game) => {
        const player = game.world.getPlayer();
        if (!player) return;

        // Get current time before reloading ship
        const timeComponent = player.getComponent('TimeComponent');
        const totalMinutesAway = timeComponent ? timeComponent.totalMinutes : 0;

        closeTopMenu(game.world);

        // Reload ship map
        buildWorld(game.world, 'SHIP');

        // After ship loads, calculate off-ship water consumption
        const newPlayer = game.world.getPlayer();
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
    },
    'view_cargo': (game) => {
    // =========================================================================
    // CARGO ACTIONS - Ship cargo hold management
    // =========================================================================
        const player = game.world.getPlayer();
        if (!player) return;

        const shipEntity = game.world.query(['ShipComponent'])[0];
        if (!shipEntity) return;

        const ship = shipEntity.getComponent('ShipComponent');
        const menu = player.getComponent('MenuComponent');

        if (ship.cargo.size === 0) {
            game.world.addComponent(player.id, new MessageComponent('Cargo hold is empty.', 'yellow'));
            return;
        }

        const cargoItems = [];
        for (const [itemKey, itemData] of ship.cargo) {
            const itemEntity = game.world.getEntity(itemData.entityId);
            if (itemEntity) {
                const itemComponent = itemEntity.getComponent('ItemComponent');
                let label = itemComponent.name;
                if (itemData.quantity > 1) {
                    label += ` (x${itemData.quantity})`;
                }
                cargoItems.push(label);
            }
        }

        // Show cargo contents in details pane
        menu.detailsPane = {
            title: 'Cargo Contents',
            lines: cargoItems
        };
    },
    'deposit_to_cargo': (game) => {
        const player = game.world.getPlayer();
        if (!player) return;

        const inventory = player.getComponent('InventoryComponent');
        const shipEntity = game.world.query(['ShipComponent'])[0];
        if (!shipEntity) return;

        const ship = shipEntity.getComponent('ShipComponent');

        if (inventory.items.size === 0) {
            game.world.addComponent(player.id, new MessageComponent('Your inventory is empty.', 'yellow'));
            return;
        }

        // Build menu of inventory items
        const menuOptions = [];
        for (const [itemKey, itemData] of inventory.items) {
            const itemEntity = game.world.getEntity(itemData.entityId);
            if (!itemEntity) continue;

            const itemComponent = itemEntity.getComponent('ItemComponent');
            let label = itemComponent.name;
            if (itemData.quantity > 1) {
                label += ` (x${itemData.quantity})`;
            }

            menuOptions.push({
                label: label,
                action: 'confirm_deposit_to_cargo',
                actionArgs: { itemKey, itemEntity }
            });
        }
        menuOptions.push({ label: 'Cancel', action: 'close_submenu' });

        const menu = player.getComponent('MenuComponent');
        menu.submenu1 = { title: 'Select Item to Deposit', options: menuOptions };
        menu.submenu1SelectedIndex = 0;
        menu.activeMenu = 'submenu1';
    },
    'withdraw_from_cargo': (game) => {
        const player = game.world.getPlayer();
        if (!player) return;

        const shipEntity = game.world.query(['ShipComponent'])[0];
        if (!shipEntity) return;

        const ship = shipEntity.getComponent('ShipComponent');

        if (ship.cargo.size === 0) {
            game.world.addComponent(player.id, new MessageComponent('Cargo hold is empty.', 'yellow'));
            return;
        }

        // Build menu of cargo items
        const menuOptions = [];
        for (const [itemKey, itemData] of ship.cargo) {
            const itemEntity = game.world.getEntity(itemData.entityId);
            if (!itemEntity) continue;

            const itemComponent = itemEntity.getComponent('ItemComponent');
            let label = itemComponent.name;
            if (itemData.quantity > 1) {
                label += ` (x${itemData.quantity})`;
            }

            menuOptions.push({
                label: label,
                action: 'confirm_withdraw_from_cargo',
                actionArgs: { itemKey, itemEntity }
            });
        }
        menuOptions.push({ label: 'Cancel', action: 'close_submenu' });

        const menu = player.getComponent('MenuComponent');
        menu.submenu1 = { title: 'Select Item to Withdraw', options: menuOptions };
        menu.submenu1SelectedIndex = 0;
        menu.activeMenu = 'submenu1';
    },
    'confirm_deposit_to_cargo': (game, args) => {
        const player = game.world.getPlayer();
        if (!player) return;

        const shipEntity = game.world.query(['ShipComponent'])[0];
        if (!shipEntity) return;

        const ship = shipEntity.getComponent('ShipComponent');
        const inventory = player.getComponent('InventoryComponent');
        const { itemKey, itemEntity } = args;

        // Check if cargo can fit the item
        if (!ship.canAddItemToCargo(game.world, itemEntity, 1)) {
            game.world.addComponent(player.id, new MessageComponent('Not enough cargo space!', 'red'));
            closeTopMenu(game.world);
            return;
        }

        const itemComponent = itemEntity.getComponent('ItemComponent');
        const itemData = inventory.items.get(itemKey);

        // Check if item is stackable and already in cargo
        const stackable = itemEntity.hasComponent('StackableComponent');
        if (stackable && ship.cargo.has(itemKey)) {
            // Add to existing stack
            ship.cargo.get(itemKey).quantity++;
        } else {
            // Add new entry to cargo
            ship.cargo.set(itemKey, { entityId: itemEntity.id, quantity: 1 });
        }

        // Remove from player inventory
        itemData.quantity--;
        if (itemData.quantity <= 0) {
            inventory.items.delete(itemKey);
        }

        game.world.addComponent(player.id, new MessageComponent(`Deposited ${itemComponent.name} to cargo.`, 'green'));
        closeTopMenu(game.world);

        // Reopen cargo menu
        SCRIPT_REGISTRY['openShipCargoMenu'](game, player);
    },
    'confirm_withdraw_from_cargo': (game, args) => {
        const player = game.world.getPlayer();
        if (!player) return;

        const shipEntity = game.world.query(['ShipComponent'])[0];
        if (!shipEntity) return;

        const ship = shipEntity.getComponent('ShipComponent');
        const inventory = player.getComponent('InventoryComponent');
        const { itemKey, itemEntity } = args;

        // Check if player inventory can fit the item
        if (!inventory.canAddItem(game.world, itemEntity, 1)) {
            game.world.addComponent(player.id, new MessageComponent('Not enough inventory space!', 'red'));
            closeTopMenu(game.world);
            return;
        }

        const itemComponent = itemEntity.getComponent('ItemComponent');
        const cargoData = ship.cargo.get(itemKey);

        // Check if item is stackable and already in inventory
        const stackable = itemEntity.hasComponent('StackableComponent');
        if (stackable && inventory.items.has(itemKey)) {
            // Add to existing stack
            inventory.items.get(itemKey).quantity++;
        } else {
            // Add new entry to inventory
            inventory.items.set(itemKey, { entityId: itemEntity.id, quantity: 1 });
        }

        // Remove from cargo
        cargoData.quantity--;
        if (cargoData.quantity <= 0) {
            ship.cargo.delete(itemKey);
        }

        game.world.addComponent(player.id, new MessageComponent(`Withdrew ${itemComponent.name} from cargo.`, 'green'));
        closeTopMenu(game.world);

        // Reopen cargo menu
        SCRIPT_REGISTRY['openShipCargoMenu'](game, player);
    },
    'show_buildables_menu': (game, args) => {
        const player = game.world.getPlayer();
        if (!player) return;

        const { consoleEntity } = args;
        const inventory = player.getComponent('InventoryComponent');
        const shipEntity = game.world.query(['ShipComponent'])[0];
        const ship = shipEntity ? shipEntity.getComponent('ShipComponent') : null;

        // Build list of buildable options
        const menuOptions = BUILDABLE_INTERACTABLES.map(buildable => ({
            label: buildable.name,
            action: 'show_buildable_details',
            actionArgs: { buildable, consoleEntity }
        }));
        menuOptions.push({ label: 'Back', action: 'close_submenu' });

        const menu = player.getComponent('MenuComponent');
        menu.submenu1 = { title: 'Select Interactable to Build', options: menuOptions };
        menu.submenu1SelectedIndex = 0;
        menu.activeMenu = 'submenu1';
        menu.detailsPane = null; // Clear details initially
    },
    'show_buildable_details': (game, args) => {
        const player = game.world.getPlayer();
        if (!player) return;

        const { buildable, consoleEntity } = args;
        const inventory = player.getComponent('InventoryComponent');
        const shipEntity = game.world.query(['ShipComponent'])[0];
        const ship = shipEntity ? shipEntity.getComponent('ShipComponent') : null;

        const menu = player.getComponent('MenuComponent');
        if (!menu) return;

        // Check resources and build details pane
        const detailsLines = [];
        detailsLines.push(buildable.description);
        detailsLines.push('');
        detailsLines.push('Required Resources:');

        let canAfford = true;

        for (const cost of buildable.buildCost) {
            // Find material in player inventory
            let playerQty = 0;
            for (const [itemKey, itemData] of inventory.items) {
                const itemEntity = game.world.getEntity(itemData.entityId);
                if (itemEntity) {
                    const itemComp = itemEntity.getComponent('ItemComponent');
                    const materialDef = MATERIAL_DATA[cost.materialId];
                    if (materialDef && itemComp.name === materialDef.name) {
                        playerQty = itemData.quantity;
                        break;
                    }
                }
            }

            // Find material in ship cargo
            let shipQty = 0;
            if (ship) {
                for (const [itemKey, itemData] of ship.cargo) {
                    const itemEntity = game.world.getEntity(itemData.entityId);
                    if (itemEntity) {
                        const itemComp = itemEntity.getComponent('ItemComponent');
                        const materialDef = MATERIAL_DATA[cost.materialId];
                        if (materialDef && itemComp.name === materialDef.name) {
                            shipQty = itemData.quantity;
                            break;
                        }
                    }
                }
            }

            const totalQty = playerQty + shipQty;
            const hasEnough = totalQty >= cost.quantity;
            if (!hasEnough) canAfford = false;

            const materialDef = MATERIAL_DATA[cost.materialId];
            const line = `${materialDef.name} x${cost.quantity} ${hasEnough ? '✓' : '✗'}`;
            detailsLines.push(line);
        }

        detailsLines.push('');
        if (canAfford) {
            detailsLines.push('[Space] Place');
        } else {
            detailsLines.push('[Insufficient Resources]');
        }

        menu.detailsPane = {
            title: buildable.name,
            lines: detailsLines
        };

        // Store buildable and console for later use
        menu.selectedBuildable = buildable;
        menu.bridgeConsoleEntity = consoleEntity;
        menu.canAffordBuildable = canAfford;
    },
    'enter_placement_mode': (game) => {
        const player = game.world.getPlayer();
        if (!player) return;

        const menu = player.getComponent('MenuComponent');
        if (!menu || !menu.selectedBuildable || !menu.canAffordBuildable) return;

        const buildable = menu.selectedBuildable;
        const consoleEntity = menu.bridgeConsoleEntity;

        // Get console position to start cursor there
        const consolePos = consoleEntity.getComponent('PositionComponent');
        if (!consolePos) return;

        // Close menu
        closeTopMenu(game.world);

        // Add PlacementModeComponent to player
        game.world.addComponent(player.id, new PlacementModeComponent(
            buildable.id,
            consolePos.x,
            consolePos.y
        ));

        game.world.addComponent(player.id, new MessageComponent(
            `Placing ${buildable.name}. WASD to move, Space to confirm, Escape to cancel.`,
            'cyan'
        ));
    },
    'confirm_placement': (game, args) => {
        const player = game.world.getPlayer();
        if (!player) return;

        const placementMode = player.getComponent('PlacementModeComponent');
        if (!placementMode) return;

        const { cursorX, cursorY, buildableId } = placementMode;

        // Find buildable definition
        const buildable = BUILDABLE_INTERACTABLES.find(b => b.id === buildableId);
        if (!buildable) return;

        // Validate placement location (pass buildable for special validation)
        const isValid = isValidPlacementLocation(game.world, cursorX, cursorY, buildable);
        if (!isValid) {
            let message = 'Cannot place here!';
            if (buildable.requiresWallTile) {
                message = 'Doors must be placed on walls with floor on at least 2 sides!';
            }
            game.world.addComponent(player.id, new MessageComponent(message, 'red'));
            return;
        }

        // Show confirmation dialog
        game.world.addComponent(player.id, new MenuComponent(
            `Place ${buildable.name} here?`,
            [
                { label: 'Yes', action: 'place_buildable', actionArgs: { buildable, cursorX, cursorY } },
                { label: 'No', action: 'close_menu' }
            ],
            player,
            'placement_confirm'
        ));
    },
    'place_buildable': (game, args) => {
        const player = game.world.getPlayer();
        if (!player) return;

        const { buildable, cursorX, cursorY } = args;
        if (!buildable) return;

        const inventory = player.getComponent('InventoryComponent');
        const shipEntity = game.world.query(['ShipComponent'])[0];
        const ship = shipEntity ? shipEntity.getComponent('ShipComponent') : null;

        // Deduct resources (prioritize player inventory, then ship cargo)
        for (const cost of buildable.buildCost) {
            let remaining = cost.quantity;
            const materialDef = MATERIAL_DATA[cost.materialId];

            // Deduct from player inventory first
            for (const [itemKey, itemData] of inventory.items) {
                if (remaining <= 0) break;

                const itemEntity = game.world.getEntity(itemData.entityId);
                if (itemEntity) {
                    const itemComp = itemEntity.getComponent('ItemComponent');
                    if (itemComp.name === materialDef.name) {
                        const deduct = Math.min(remaining, itemData.quantity);
                        itemData.quantity -= deduct;
                        remaining -= deduct;

                        if (itemData.quantity <= 0) {
                            inventory.items.delete(itemKey);
                        }
                    }
                }
            }

            // Deduct from ship cargo if needed
            if (remaining > 0 && ship) {
                for (const [itemKey, itemData] of ship.cargo) {
                    if (remaining <= 0) break;

                    const itemEntity = game.world.getEntity(itemData.entityId);
                    if (itemEntity) {
                        const itemComp = itemEntity.getComponent('ItemComponent');
                        if (itemComp.name === materialDef.name) {
                            const deduct = Math.min(remaining, itemData.quantity);
                            itemData.quantity -= deduct;
                            remaining -= deduct;

                            if (itemData.quantity <= 0) {
                                ship.cargo.delete(itemKey);
                            }
                        }
                    }
                }
            }
        }

        // Special handling for doors - replace wall with floor tile
        if (buildable.requiresWallTile) {
            const mapData = MAP_DATA['SHIP'];
            if (mapData && mapData.layout && mapData.layout[cursorY]) {
                // Replace wall (+) with floor (.) so door can open/close properly
                const row = mapData.layout[cursorY];
                mapData.layout[cursorY] = row.substring(0, cursorX) + '.' + row.substring(cursorX + 1);

                // Remove from solid tile cache
                game.world.removeSolidTileFromCache(cursorX, cursorY);

                // Find and remove the wall entity at this position
                const wallEntities = game.world.query(['PositionComponent', 'RenderableComponent']);
                for (const entity of wallEntities) {
                    const pos = entity.getComponent('PositionComponent');
                    const renderable = entity.getComponent('RenderableComponent');
                    if (pos.x === cursorX && pos.y === cursorY && renderable.char === '+') {
                        game.world.destroyEntity(entity.id);
                        break;
                    }
                }

                // Create new floor entity
                const floorEntity = game.world.createEntity();
                game.world.addComponent(floorEntity, new PositionComponent(cursorX, cursorY));
                game.world.addComponent(floorEntity, new RenderableComponent('.', '#333', 0));
                game.world.addComponent(floorEntity, new VisibilityStateComponent());
            }
        }

        // Place the interactable
        const interactableDef = INTERACTABLE_DATA.find(i => i.id === buildable.interactableId);
        if (!interactableDef) return;

        // Get visual properties (for producers, use PRODUCER_TYPES config)
        let char = interactableDef.char || buildable.char;
        let colour = interactableDef.colour || buildable.colour;
        if (interactableDef.producerType && PRODUCER_TYPES[interactableDef.producerType]) {
            const producerConfig = PRODUCER_TYPES[interactableDef.producerType];
            char = producerConfig.char || char;
            colour = producerConfig.colour || colour;
        }

        const newEntity = game.world.createEntity();
        game.world.addComponent(newEntity, new PositionComponent(cursorX, cursorY));
        game.world.addComponent(newEntity, new RenderableComponent(char, colour, 1));
        game.world.addComponent(newEntity, new NameComponent(interactableDef.name || buildable.name));
        game.world.addComponent(newEntity, new InteractableComponent(interactableDef.script, interactableDef.scriptArgs));
        game.world.addComponent(newEntity, new VisibilityStateComponent());

        // Add solid component if needed
        if (interactableDef.solid || buildable.blocksMovement) {
            game.world.addComponent(newEntity, new SolidComponent());
            game.world.addSolidTileToCache(cursorX, cursorY);
        }

        // Add producer component if it's a producer type
        if (interactableDef.producerType || buildable.producerType) {
            const producerType = interactableDef.producerType || buildable.producerType;
            game.world.addComponent(newEntity, new ProducerComponent(producerType));
        }

        // Mark lighting system dirty if door was placed (LOS changed)
        if (buildable.requiresWallTile) {
            const lightingSystem = game.world.getSystem(LightingSystem);
            if (lightingSystem && lightingSystem.markDirty) {
                lightingSystem.markDirty();
            }
        }

        // Exit placement mode
        player.removeComponent('PlacementModeComponent');

        // Close menu
        closeTopMenu(game.world);

        game.world.addComponent(player.id, new MessageComponent(
            `Built ${buildable.name}!`,
    // =========================================================================
    // LOOT ACTIONS - Corpse looting and material gathering
    // =========================================================================
            'green'
        ));

        // Save game after construction
        saveShipState(game.world);
    },
    'take_loot': (game, args) => {
        const player = game.world.getPlayer();
        if (!player) return;

        const { corpseEntity, itemEntity, itemName, quantity } = args;
        const inventory = player.getComponent('InventoryComponent');
        const lootContainer = corpseEntity.getComponent('LootContainerComponent');

        if (!inventory || !lootContainer) return;

        const itemComp = itemEntity.getComponent('ItemComponent');
        if (!itemComp) return;

        // Check if player can carry the item
        const itemWeight = itemComp.weight * quantity;
        if (inventory.currentWeight + itemWeight > inventory.maxWeight * 1.15) {
            game.world.addComponent(player.id, new MessageComponent('Too heavy to carry!', 'red'));
            return;
        }

        // Add to player inventory
        const existingItem = inventory.items.get(itemName);
        if (existingItem) {
            // Stack with existing
            existingItem.quantity += quantity;
        } else {
            // Add new item
            inventory.items.set(itemName, {
                entityId: itemEntity.id,
                quantity: quantity
            });
        }

        // Update weight
        inventory.currentWeight += itemWeight;

        // Remove from corpse loot
        lootContainer.lootInventory.delete(itemName);

        // Show message
        const qtyLabel = quantity > 1 ? ` (x${quantity})` : '';
        game.world.addComponent(player.id, new MessageComponent(`Took ${itemName}${qtyLabel}`, 'green'));

        // If corpse is empty, destroy it and close menu
        if (lootContainer.lootInventory.size === 0) {
            game.world.destroyEntity(corpseEntity.id);
            closeTopMenu(game.world);
            game.world.addComponent(player.id, new MessageComponent('Corpse fully looted.', 'cyan'));
        } else {
            // Refresh the loot menu
            SCRIPT_REGISTRY['lootCorpse'](game, corpseEntity, {});
        }
    },
    'take_all_loot': (game, args) => {
        const player = game.world.getPlayer();
        if (!player) return;

        const { corpseEntity } = args;
        const inventory = player.getComponent('InventoryComponent');
        const lootContainer = corpseEntity.getComponent('LootContainerComponent');

        if (!inventory || !lootContainer) return;

        let totalTaken = 0;
        let totalWeight = 0;
        const itemsToTake = [];

        // Calculate total weight and prepare items
        for (const [itemName, itemData] of lootContainer.lootInventory) {
            const itemEntity = game.world.getEntity(itemData.entityId);
            if (itemEntity) {
                const itemComp = itemEntity.getComponent('ItemComponent');
                if (itemComp) {
                    const itemWeight = itemComp.weight * itemData.quantity;
                    totalWeight += itemWeight;
                    itemsToTake.push({ itemName, itemData, itemEntity, itemWeight });
                }
            }
        }

        // Check if player can carry everything
        if (inventory.currentWeight + totalWeight > inventory.maxWeight * 1.15) {
            game.world.addComponent(player.id, new MessageComponent('Cannot carry all items - too heavy!', 'red'));
            return;
        }

        // Take all items
        for (const item of itemsToTake) {
            const existingItem = inventory.items.get(item.itemName);
            if (existingItem) {
                existingItem.quantity += item.itemData.quantity;
            } else {
                inventory.items.set(item.itemName, {
                    entityId: item.itemEntity.id,
                    quantity: item.itemData.quantity
                });
            }
            totalTaken += item.itemData.quantity;
        }

        // Update weight
        inventory.currentWeight += totalWeight;

        // Clear corpse loot
        lootContainer.lootInventory.clear();

        // Destroy corpse and close menu
        game.world.destroyEntity(corpseEntity.id);
        closeTopMenu(game.world);

        game.world.addComponent(player.id, new MessageComponent(`Looted all items (${totalTaken} items)`, 'green'));
    },
    'recycle_module': (game, args) => {
        const player = game.world.getPlayer();
        if (!player) return;

        const inventory = player.getComponent('InventoryComponent');
        const shipEntity = game.world.query(['ShipComponent'])[0];
        const ship = shipEntity ? shipEntity.getComponent('ShipComponent') : null;

        const { moduleEntity, moduleDef, source, itemKey } = args;

        // Determine which inventory to use
        const sourceInventory = source === 'cargo' ? ship.cargo : inventory.items;

        // Get the item from inventory
        const itemData = sourceInventory.get(itemKey);
        if (!itemData || itemData.quantity <= 0) {
            game.world.addComponent(player.id, new MessageComponent('Module no longer available!', 'red'));
            closeTopMenu(game.world);
            return;
        }

        // Remove one module from inventory
        itemData.quantity--;
        if (itemData.quantity <= 0) {
            sourceInventory.delete(itemKey);
            // Also destroy the entity if this was the last one
            game.world.destroyEntity(moduleEntity.id);
        }

        // Get recycling components and calculate drops
        const recyclingComponents = moduleDef.recyclingComponents || [];
        const receivedMaterials = [];

        // Determine drop chances based on number of materials
        let dropChances = [];
        if (recyclingComponents.length === 1) {
            dropChances = [0.5];
        } else if (recyclingComponents.length === 2) {
            dropChances = [0.5, 0.5];
        } else if (recyclingComponents.length === 3) {
            dropChances = [0.5, 0.3, 0.2];
        }

        // Roll for each material independently
        recyclingComponents.forEach((materialId, index) => {
            const chance = dropChances[index] || 0;
            if (Math.random() < chance) {
                receivedMaterials.push(materialId);
            }
        });

        // Add received materials to player inventory
        receivedMaterials.forEach(materialId => {
            const materialDef = MATERIAL_DATA[materialId];
            if (!materialDef) return;

            // Check if material already exists in player inventory
            const existingMaterial = inventory.items.get(materialDef.name);
            if (existingMaterial) {
                existingMaterial.quantity++;
            } else {
                // Create new material entity
                const materialEntity = game.world.createEntity();
                game.world.addComponent(materialEntity, new ItemComponent(materialDef.name, materialDef.description, materialDef.weight, materialDef.slots));
                game.world.addComponent(materialEntity, new RenderableComponent(materialDef.char, materialDef.colour, 0));

                if (materialDef.stackable) {
                    game.world.addComponent(materialEntity, new StackableComponent(materialDef.stackLimit));
                }

                // Add to player inventory
                inventory.items.set(materialDef.name, {
                    entityId: materialEntity,
                    quantity: 1
                });
            }
        });

        // Build result message
        let resultMessage = `Recycled ${moduleDef.name}.`;
        if (receivedMaterials.length > 0) {
            const materialNames = receivedMaterials.map(id => MATERIAL_DATA[id].name).join(', ');
            resultMessage += ` Received: ${materialNames}`;
            game.world.addComponent(player.id, new MessageComponent(resultMessage, 'green'));
        } else {
            resultMessage += ' No materials recovered.';
            game.world.addComponent(player.id, new MessageComponent(resultMessage, 'yellow'));
        }

        closeTopMenu(game.world);
    },
    'recycle_equipment': (game, args) => {
        const player = game.world.getPlayer();
        if (!player) return;

        const inventory = player.getComponent('InventoryComponent');
        const shipEntity = game.world.query(['ShipComponent'])[0];
        const ship = shipEntity ? shipEntity.getComponent('ShipComponent') : null;

        const { equipmentEntity, equipmentDef, source, itemKey, attachmentSlots } = args;

        // Determine which inventory to use
        const sourceInventory = source === 'cargo' ? ship.cargo : inventory.items;

        // Get the item from inventory
        const itemData = sourceInventory.get(itemKey);
        if (!itemData || itemData.quantity <= 0) {
            game.world.addComponent(player.id, new MessageComponent('Equipment no longer available!', 'red'));
            closeTopMenu(game.world);
            return;
        }

        // Calculate durability multiplier for yield reduction (armor only)
        let durabilityMultiplier = 1.0;
        const armourStats = equipmentEntity.getComponent('ArmourStatsComponent');
        if (armourStats && armourStats.maxDurability > 0) {
            // Scale yield based on current durability percentage
            // 100% durability = 100% yield, 0% durability = 10% yield
            const durabilityPercent = armourStats.durability / armourStats.maxDurability;
            durabilityMultiplier = Math.max(0.1, durabilityPercent);
        }

        // Remove one equipment from inventory
        itemData.quantity--;
        if (itemData.quantity <= 0) {
            sourceInventory.delete(itemKey);
        }

        // Collect all recycling components
        const allComponents = [];

        // Add base equipment components
        if (equipmentDef.recyclingComponents) {
            allComponents.push({
                source: equipmentDef.name,
                components: equipmentDef.recyclingComponents,
                durabilityMult: durabilityMultiplier
            });
        }

        // Extract components from installed parts
        if (attachmentSlots && attachmentSlots.slots) {
            for (const [slotName, slot] of Object.entries(attachmentSlots.slots)) {
                if (slot.entity_id !== null) {
                    const partEntity = game.world.getEntity(slot.entity_id);
                    if (partEntity) {
                        const partComponent = partEntity.getComponent('ItemComponent');
                        // Find part definition
                        const partDef = EQUIPMENT_DATA.find(eq =>
                            eq.part_type && eq.name === partComponent.name
                        );

                        if (partDef && partDef.recyclingComponents) {
                            allComponents.push({
                                source: partDef.name,
                                components: partDef.recyclingComponents,
                                durabilityMult: 1.0  // Parts don't have durability
                            });
                        }

                        // Destroy the part entity
                        game.world.destroyEntity(partEntity.id);
                    }
                }
            }
        }

        // Roll for materials from each source
        const receivedMaterials = [];
        for (const componentSet of allComponents) {
            const dropChances = getDropChances(componentSet.components.length);
            componentSet.components.forEach((materialId, index) => {
                // Apply durability multiplier to drop chance
                const adjustedChance = dropChances[index] * componentSet.durabilityMult;
                if (Math.random() < adjustedChance) {
                    receivedMaterials.push(materialId);
                }
            });
        }

        // Add materials to player inventory
        receivedMaterials.forEach(materialId => {
            const materialDef = MATERIAL_DATA[materialId];
            if (!materialDef) return;

            // Check if material already exists in player inventory
            const existingMaterial = inventory.items.get(materialDef.name);
            if (existingMaterial) {
                existingMaterial.quantity++;
            } else {
                // Create new material entity
                const materialEntity = game.world.createEntity();
                game.world.addComponent(materialEntity, new ItemComponent(materialDef.name, materialDef.description, materialDef.weight, materialDef.slots));
                game.world.addComponent(materialEntity, new RenderableComponent(materialDef.char, materialDef.colour, 0));

                if (materialDef.stackable) {
                    game.world.addComponent(materialEntity, new StackableComponent(materialDef.stackLimit));
                }

                // Add to player inventory
                inventory.items.set(materialDef.name, {
                    entityId: materialEntity,
                    quantity: 1
                });
            }
        });

        // Destroy equipment entity if last one
        if (itemData.quantity <= 0) {
            game.world.destroyEntity(equipmentEntity.id);
        }

        // Build result message
        let resultMessage = `Recycled ${equipmentDef.name}.`;
        if (durabilityMultiplier < 1.0) {
            const durabilityPercent = Math.round(durabilityMultiplier * 100);
            resultMessage += ` (${durabilityPercent}% durability)`;
        }
        if (receivedMaterials.length > 0) {
            const materialNames = receivedMaterials.map(id => MATERIAL_DATA[id].name).join(', ');
            resultMessage += ` Received: ${materialNames}`;
            game.world.addComponent(player.id, new MessageComponent(resultMessage, 'green'));
        } else {
            resultMessage += ' No materials recovered.';
            game.world.addComponent(player.id, new MessageComponent(resultMessage, 'yellow'));
        }

        closeTopMenu(game.world);
    },

    'take_from_node': (game, args) => {
        const player = game.world.getPlayer();
        if (!player) return;

        const { nodeEntity, itemId } = args;
        const nodeComponent = nodeEntity.getComponent('ScavengeNodeComponent');
        const inventory = player.getComponent('InventoryComponent');

        if (!nodeComponent || !inventory) return;

        // Find item in node's loot list
        const itemIndex = nodeComponent.lootItems.indexOf(itemId);
        if (itemIndex === -1) {
            game.world.addComponent(player.id, new MessageComponent('Item no longer available!', 'red'));
            closeTopMenu(game.world);
            return;
        }

        // Get item definition
        const itemDef = findItemDefinition(itemId);
        if (!itemDef) {
            console.warn(`Item definition not found: ${itemId}`);
            closeTopMenu(game.world);
            return;
        }

        // Check if player can carry it
        if (!inventory.canAddItem(itemDef.weight || 0, itemDef.slots || 1)) {
            game.world.addComponent(player.id, new MessageComponent('Not enough space!', 'red'));
            closeTopMenu(game.world);
            return;
        }

        // Create item entity and add to inventory
        const itemEntity = game.world.createEntity();
        game.world.addComponent(itemEntity, new ItemComponent(itemDef.name, itemDef.description, itemDef.weight || 0, itemDef.slots || 1));
        game.world.addComponent(itemEntity, new NameComponent(itemDef.name));

        // Add type-specific components
        if (itemDef.part_type) {
            game.world.addComponent(itemEntity, new PartComponent(itemDef.part_type));
            if (itemDef.modifiers && Object.keys(itemDef.modifiers).length > 0) {
                game.world.addComponent(itemEntity, new StatModifierComponent(itemDef.modifiers));
            }
        } else if (itemDef.tool_type) {
            game.world.addComponent(itemEntity, new ToolComponent(itemDef.tool_type, itemDef.uses || -1));
            if (itemDef.stats) {
                game.world.addComponent(itemEntity, new ToolStatsComponent(itemDef.stats));
            }
        } else if (itemDef.stackable) {
            game.world.addComponent(itemEntity, new StackableComponent(itemDef.stackLimit || 99, 1));
        }

        // Add to inventory
        inventory.addItem(itemEntity, itemDef.name, 1);

        // Remove from node
        nodeComponent.lootItems.splice(itemIndex, 1);

        game.world.addComponent(player.id, new MessageComponent(`Took ${itemDef.name}`, 'green'));

        // Close and reopen menu to refresh
        closeTopMenu(game.world);

        // Reopen node menu if items remain
        if (nodeComponent.lootItems.length > 0) {
            const menuOptions = [];
            const nodeName = nodeEntity.getComponent('NameComponent')?.name || 'Container';

            menuOptions.push({
                label: `--- ${nodeName} Contents ---`,
                action: 'nothing'
            });

            for (const remainingItemId of nodeComponent.lootItems) {
                const remainingItemDef = findItemDefinition(remainingItemId);
                if (remainingItemDef) {
                    menuOptions.push({
                        label: `Take ${remainingItemDef.name}`,
                        action: 'take_from_node',
                        actionArgs: { nodeEntity: nodeEntity, itemId: remainingItemId }
                    });
                }
            }

            menuOptions.push({
                label: 'Take All',
                action: 'take_all_from_node',
                actionArgs: { nodeEntity: nodeEntity }
            });

            menuOptions.push({ label: 'Close', action: 'close_menu' });

            game.world.addComponent(player.id, new MenuComponent(`${nodeName}`, menuOptions, nodeEntity, 'node_menu'));
        }
    },

    'take_all_from_node': (game, args) => {
        const player = game.world.getPlayer();
        if (!player) return;

        const { nodeEntity } = args;
        const nodeComponent = nodeEntity.getComponent('ScavengeNodeComponent');
        const inventory = player.getComponent('InventoryComponent');

        if (!nodeComponent || !inventory) return;

        const itemsTaken = [];
        const itemsSkipped = [];

        // Try to take each item
        for (const itemId of [...nodeComponent.lootItems]) {
            const itemDef = findItemDefinition(itemId);
            if (!itemDef) continue;

            // Check if player can carry it
            if (!inventory.canAddItem(itemDef.weight || 0, itemDef.slots || 1)) {
                itemsSkipped.push(itemDef.name);
                continue;
            }

            // Create item entity
            const itemEntity = game.world.createEntity();
            game.world.addComponent(itemEntity, new ItemComponent(itemDef.name, itemDef.description, itemDef.weight || 0, itemDef.slots || 1));
            game.world.addComponent(itemEntity, new NameComponent(itemDef.name));

            // Add type-specific components
            if (itemDef.part_type) {
                game.world.addComponent(itemEntity, new PartComponent(itemDef.part_type));
                if (itemDef.modifiers && Object.keys(itemDef.modifiers).length > 0) {
                    game.world.addComponent(itemEntity, new StatModifierComponent(itemDef.modifiers));
                }
            } else if (itemDef.tool_type) {
                game.world.addComponent(itemEntity, new ToolComponent(itemDef.tool_type, itemDef.uses || -1));
                if (itemDef.stats) {
                    game.world.addComponent(itemEntity, new ToolStatsComponent(itemDef.stats));
                }
            } else if (itemDef.stackable) {
                game.world.addComponent(itemEntity, new StackableComponent(itemDef.stackLimit || 99, 1));
            }

            // Add to inventory
            inventory.addItem(itemEntity, itemDef.name, 1);
            itemsTaken.push(itemDef.name);

            // Remove from node
            const itemIndex = nodeComponent.lootItems.indexOf(itemId);
            if (itemIndex !== -1) {
                nodeComponent.lootItems.splice(itemIndex, 1);
            }
        }

        // Show results
        if (itemsTaken.length > 0) {
            game.world.addComponent(player.id, new MessageComponent(`Took ${itemsTaken.length} item(s)`, 'green'));
        }
        if (itemsSkipped.length > 0) {
            game.world.addComponent(player.id, new MessageComponent(`Not enough space for ${itemsSkipped.length} item(s)`, 'yellow'));
        }

        closeTopMenu(game.world);
    },

    // Life Support upgrade action
    'upgrade_life_support': (game, args) => {
        const player = game.world.getPlayer();
        if (!player) return;

        const { lifeSupportEntity, tier } = args;
        const lifeSupport = lifeSupportEntity.getComponent('LifeSupportComponent');

        // Material costs for each tier
        const costs = {
            1: [
                { materialId: 'BASIC_ELECTRONICS', quantity: 3 },
                { materialId: 'POLYMER_RESIN', quantity: 4 }
            ],
            2: [
                { materialId: 'INTACT_LOGIC_BOARD', quantity: 2 },
                { materialId: 'BASIC_ELECTRONICS', quantity: 5 },
                { materialId: 'CHEMICAL_COMPOUNDS', quantity: 3 }
            ],
            3: [
                { materialId: 'INTACT_LOGIC_BOARD', quantity: 3 },
                { materialId: 'TITANIUM_ALLOY', quantity: 2 },
                { materialId: 'FOCUSING_LENSES', quantity: 2 }
            ]
        };

        const tierCosts = costs[tier];
        if (!tierCosts) return;

        // Check if player has materials
        const inventory = player.getComponent('InventoryComponent');
        const ship = game.world.getShip();
        const shipCargo = ship ? ship.getComponent('ShipComponent').cargo : null;

        let canAfford = true;
        for (const cost of tierCosts) {
            let totalQty = 0;
            const matDef = MATERIAL_DATA[cost.materialId];
            if (!matDef) continue;

            // Count in inventory
            for (const [itemKey, itemData] of inventory.items) {
                const itemEntity = game.world.getEntity(itemData.entityId);
                if (itemEntity) {
                    const itemComp = itemEntity.getComponent('ItemComponent');
                    if (itemComp.name === matDef.name) {
                        totalQty += itemData.quantity;
                    }
                }
            }

            // Count in cargo
            if (shipCargo) {
                for (const [itemKey, itemData] of shipCargo) {
                    const itemEntity = game.world.getEntity(itemData.entityId);
                    if (itemEntity) {
                        const itemComp = itemEntity.getComponent('ItemComponent');
                        if (itemComp.name === matDef.name) {
                            totalQty += itemData.quantity;
                        }
                    }
                }
            }

            if (totalQty < cost.quantity) {
                canAfford = false;
                break;
            }
        }

        if (!canAfford) {
            game.world.addComponent(player.id, new MessageComponent('Insufficient materials!', 'red'));
            closeTopMenu(game.world);
            return;
        }

        // Consume materials
        for (const cost of tierCosts) {
            let remaining = cost.quantity;
            const matDef = MATERIAL_DATA[cost.materialId];

            // Consume from inventory first
            for (const [itemKey, itemData] of inventory.items) {
                if (remaining <= 0) break;
                const itemEntity = game.world.getEntity(itemData.entityId);
                if (itemEntity) {
                    const itemComp = itemEntity.getComponent('ItemComponent');
                    if (itemComp.name === matDef.name) {
                        const deduct = Math.min(remaining, itemData.quantity);
                        itemData.quantity -= deduct;
                        remaining -= deduct;
                        if (itemData.quantity <= 0) {
                            inventory.items.delete(itemKey);
                        }
                    }
                }
            }

            // Consume from cargo if needed
            if (remaining > 0 && shipCargo) {
                for (const [itemKey, itemData] of shipCargo) {
                    if (remaining <= 0) break;
                    const itemEntity = game.world.getEntity(itemData.entityId);
                    if (itemEntity) {
                        const itemComp = itemEntity.getComponent('ItemComponent');
                        if (itemComp.name === matDef.name) {
                            const deduct = Math.min(remaining, itemData.quantity);
                            itemData.quantity -= deduct;
                            remaining -= deduct;
                            if (itemData.quantity <= 0) {
                                shipCargo.delete(itemKey);
                            }
                        }
                    }
                }
            }
        }

        // Upgrade life support
        lifeSupport.upgrade();
        game.world.addComponent(player.id, new MessageComponent(`Life Support upgraded to Tier ${tier}!`, 'green'));
        closeTopMenu(game.world);
    },

    // Auto-Doc treatment action
    'start_autodoc_treatment': (game, args) => {
        const player = game.world.getPlayer();
        if (!player) return;

        closeTopMenu(game.world);

        // Apply stat changes
        const stats = player.getComponent('StatsComponent');
        if (stats) {
            stats.modifyStat('comfort', -20);
            stats.modifyStat('stress', 15);
        }

        // Get time system and sleep for 2 hours (treatment time)
        const timeSystem = game.world.getSystem(TimeSystem);
        if (timeSystem) {
            // Set treatment component to track healing
            game.world.addComponent(player.id, new AutoDocTreatmentComponent(120)); // 2 hours

            // Use sleep system to fade to black and skip time
            timeSystem.startSleep(game.world, player, 2, () => {
                // Callback after treatment
                const bodyParts = player.getComponent('BodyPartsComponent');
                if (bodyParts) {
                    for (const part of bodyParts.parts.keys()) {
                        bodyParts.healPart(part, 20); // Heal 20% to all parts
                    }
                }

                game.world.removeComponent(player.id, 'AutoDocTreatmentComponent');
                game.world.addComponent(player.id, new MessageComponent('Auto-Doc treatment complete!', 'cyan'));
            });
        }
    },

    // Refinery actions
    'start_refining': (game, args) => {
        const player = game.world.getPlayer();
        if (!player) return;

        const { refineryEntity, itemKey, itemEntity, itemName } = args;
        const inventory = player.getComponent('InventoryComponent');

        // Remove item from inventory
        const itemData = inventory.items.get(itemKey);
        if (itemData) {
            itemData.quantity--;
            if (itemData.quantity <= 0) {
                inventory.items.delete(itemKey);
            }
        }

        // Start refining (5 minutes, produces 5L fuel)
        const refining = new RefiningComponent(itemEntity.id, itemName, 5, 5);
        const timeComp = player.getComponent('TimeComponent');
        refining.startTime = timeComp.totalMinutes;

        game.world.addComponent(refineryEntity.id, refining);
        game.world.addComponent(player.id, new MessageComponent(`Refining ${itemName}...`, 'green'));

        closeTopMenu(game.world);
    },

    'collect_refined_fuel': (game, args) => {
        const player = game.world.getPlayer();
        if (!player) return;

        const { refineryEntity } = args;
        const refining = refineryEntity.getComponent('RefiningComponent');
        const timeComp = player.getComponent('TimeComponent');

        if (!refining || !refining.startTime) return;

        const elapsed = timeComp.totalMinutes - refining.startTime;

        if (elapsed < refining.duration) {
            const remaining = Math.ceil(refining.duration - elapsed);
            game.world.addComponent(player.id, new MessageComponent(
                `Refining not complete. ${remaining} minutes remaining.`, 'yellow'
            ));
            return;
        }

        // Refining complete - add fuel to ship
        const ship = game.world.getShip();
        if (ship) {
            const shipComp = ship.getComponent('ShipComponent');
            shipComp.fuel += refining.outputAmount;
            game.world.addComponent(player.id, new MessageComponent(
                `Collected ${refining.outputAmount}L fuel!`, 'green'
            ));
        }

        // Remove refining component
        game.world.removeComponent(refineryEntity.id, 'RefiningComponent');
        closeTopMenu(game.world);
    },

    // Drop Chute action
    'send_to_ship_via_chute': (game, args) => {
        const player = game.world.getPlayer();
        if (!player) return;

        const { itemKey, itemEntityId, quantity } = args;
        const inventory = player.getComponent('InventoryComponent');
        const ship = game.world.getShip();

        if (!ship) return;

        const shipComp = ship.getComponent('ShipComponent');
        const itemEntity = game.world.getEntity(itemEntityId);
        if (!itemEntity) return;

        const itemComp = itemEntity.getComponent('ItemComponent');

        // Check if ship cargo has space
        const currentSlots = Array.from(shipComp.cargo.values()).reduce((sum, item) => {
            const ent = game.world.getEntity(item.entityId);
            if (ent) {
                const ic = ent.getComponent('ItemComponent');
                return sum + (ic.slots || 1);
            }
            return sum;
        }, 0);

        const itemSlots = itemComp.slots || 1;

        if (currentSlots + itemSlots > shipComp.maxCargoSlots) {
            game.world.addComponent(player.id, new MessageComponent('Ship cargo full! Item rejected.', 'red'));
            closeTopMenu(game.world);
            return;
        }

        // Remove from player inventory
        const invItem = inventory.items.get(itemKey);
        if (invItem) {
            invItem.quantity -= quantity;
            if (invItem.quantity <= 0) {
                inventory.items.delete(itemKey);
            }
        }

        // Add to ship cargo
        const existingCargo = shipComp.cargo.get(itemKey);
        if (existingCargo) {
            existingCargo.quantity += quantity;
        } else {
            shipComp.cargo.set(itemKey, {
                entityId: itemEntityId,
                quantity: quantity
            });
        }

        game.world.addComponent(player.id, new MessageComponent(
            `Sent ${itemComp.name} x${quantity} to ship cargo!`, 'green'
        ));

        closeTopMenu(game.world);
    }
}

// Helper function to get drop chances based on material count
function getDropChances(materialCount) {
    if (materialCount === 1) return [0.5];
    if (materialCount === 2) return [0.5, 0.5];
    if (materialCount === 3) return [0.5, 0.3, 0.2];
    return new Array(materialCount).fill(0.5);  // Default 50% for any count
}

// Helper function to validate placement location
function isValidPlacementLocation(world, x, y, buildable = null) {
    // Must be on SHIP map
    if (world.currentMap !== 'SHIP') return false;

    // Get map data
    const mapData = MAP_DATA['SHIP'];
    if (!mapData || !mapData.layout) return false;

    // Check bounds
    if (y < 0 || y >= mapData.layout.length) return false;
    if (x < 0 || x >= mapData.layout[y].length) return false;

    const tile = mapData.layout[y][x];

    // If buildable requires a wall tile (like doors)
    if (buildable && buildable.requiresWallTile) {
        if (tile !== '+') return false; // Must be a wall

        // Check for floor tiles adjacent (at least 2 required)
        if (buildable.requiresFloorAdjacent) {
            const adjacentFloors = countAdjacentFloors(mapData, x, y);
            if (adjacentFloors < buildable.requiresFloorAdjacent) {
                return false; // Not enough adjacent floors
            }
        }
    } else {
        // Default: must be a floor tile ('.')
        if (tile !== '.') return false;
    }

    // Check for existing interactables at this position
    const entities = world.query(['PositionComponent', 'InteractableComponent']);
    for (const entity of entities) {
        const pos = entity.getComponent('PositionComponent');
        if (pos.x === x && pos.y === y) {
            return false; // Another interactable already here
        }
    }

    return true;
}

// Helper function to count adjacent floor tiles
function countAdjacentFloors(mapData, x, y) {
    const directions = [
        { dx: 0, dy: -1 },  // North
        { dx: 1, dy: 0 },   // East
        { dx: 0, dy: 1 },   // South
        { dx: -1, dy: 0 }   // West
    ];

    let floorCount = 0;
    for (const dir of directions) {
        const checkX = x + dir.dx;
        const checkY = y + dir.dy;

        // Check bounds
        if (checkY < 0 || checkY >= mapData.layout.length) continue;
        if (checkX < 0 || checkX >= mapData.layout[checkY].length) continue;

        const adjacentTile = mapData.layout[checkY][checkX];
        if (adjacentTile === '.') {
            floorCount++;
        }
    }

    return floorCount;
};
