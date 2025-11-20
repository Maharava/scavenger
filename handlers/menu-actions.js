// Menu action handlers
// All menu action callbacks in one place

const MENU_ACTIONS = {
    'close_menu': (game) => {
        closeTopMenu(game.world);
    },
    'open_door': (game, interactable) => {
        const pos = interactable.getComponent('PositionComponent');
        game.world.destroyEntity(interactable.id);

        const doorDef = INTERACTABLE_DATA.find(i => i.id === 'DOOR_OPEN');
        const newDoor = game.world.createEntity();
        game.world.addComponent(newDoor, new PositionComponent(pos.x, pos.y));
        game.world.addComponent(newDoor, new RenderableComponent(doorDef.char, doorDef.colour, 1));
        game.world.addComponent(newDoor, new NameComponent(doorDef.name));
        game.world.addComponent(newDoor, new InteractableComponent(doorDef.script, doorDef.scriptArgs));

        // Only add SolidComponent if the door definition says it should be solid
        if (doorDef.solid) {
            game.world.addComponent(newDoor, new SolidComponent());
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

        // Only add SolidComponent if the door definition says it should be solid
        if (doorDef.solid) {
            game.world.addComponent(newDoor, new SolidComponent());
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

        // Check inventory space
        if (!inventory.canAddItem(game.world, itemEntity, 1)) {
            game.world.addComponent(player.id, new MessageComponent('Not enough space!', 'red'));
            closeTopMenu(game.world);
            return;
        }

        // Unequip item and add to inventory using correct key
        equipped[slot] = null;
        const inventoryKey = getInventoryKey(itemEntity);
        inventory.items.set(inventoryKey, { entityId: itemEntity.id, quantity: 1 });
        game.world.addComponent(player.id, new MessageComponent(`Unequipped ${itemComponent.name}!`, 'green'));
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

        const equipment = equipmentEntity.getComponent('EquipmentComponent');
        const itemComponent = equipmentEntity.getComponent('ItemComponent');
        const equipped = player.getComponent('EquippedItemsComponent');
        const inventory = player.getComponent('InventoryComponent');

        if (!equipment || !equipped || !inventory) {
            closeTopMenu(game.world);
            return;
        }

        const slot = equipment.slot;

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
        const attachmentSlots = itemEntity.getComponent('AttachmentSlotsComponent');

        const submenuOptions = [];

        // Add appropriate actions
        if (consumable) {
            submenuOptions.push({ label: 'Use', action: 'use_item', actionArgs: itemEntity });
        }

        if (equipment) {
            submenuOptions.push({ label: 'Equip', action: 'equip_item', actionArgs: itemEntity });
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
    }
};
