// The main game setup and loop

// --- SCRIPT & ACTION REGISTRIES ---

function closeTopMenu(world) {
    const menuEntity = world.query(['MenuComponent'])[0];
    if (menuEntity) {
        menuEntity.removeComponent('MenuComponent');
    }
}

// Helper function to check if equipment has all required parts
function isEquipmentValid(world, equipmentEntity) {
    const attachmentSlots = equipmentEntity.getComponent('AttachmentSlotsComponent');
    if (!attachmentSlots) return true; // Not modular equipment

    for (const [slotName, slotData] of Object.entries(attachmentSlots.slots)) {
        if (slotData.required && !slotData.entity_id) {
            return false; // Missing required part
        }
    }
    return true;
}

// Helper function to calculate total stat modifiers from equipped items
function getEquipmentModifiers(world, player) {
    const equipped = player.getComponent('EquippedItemsComponent');
    if (!equipped) return {};

    const modifiers = {};

    [equipped.hand, equipped.body].forEach(equipmentId => {
        if (!equipmentId) return;

        const equipment = world.getEntity(equipmentId);
        if (!equipment) return;

        // Get modifiers from attached parts
        const attachmentSlots = equipment.getComponent('AttachmentSlotsComponent');
        if (attachmentSlots) {
            for (const [slotName, slotData] of Object.entries(attachmentSlots.slots)) {
                if (slotData.entity_id) {
                    const part = world.getEntity(slotData.entity_id);
                    if (part) {
                        const statMod = part.getComponent('StatModifierComponent');
                        if (statMod) {
                            for (const [stat, value] of Object.entries(statMod.modifiers)) {
                                modifiers[stat] = (modifiers[stat] || 0) + value;
                            }
                        }
                    }
                }
            }
        }
    });

    return modifiers;
}

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
        game.world.addComponent(newDoor, new InteractableComponent(doorDef.script, doorDef.scriptArgs));

        closeTopMenu(game.world);
    },
    'close_door': (game, interactable) => {
        const pos = interactable.getComponent('PositionComponent');
        game.world.destroyEntity(interactable.id);

        const doorDef = INTERACTABLE_DATA.find(i => i.id === 'DOOR_CLOSED');
        const newDoor = game.world.createEntity();
        game.world.addComponent(newDoor, new PositionComponent(pos.x, pos.y));
        game.world.addComponent(newDoor, new RenderableComponent(doorDef.char, doorDef.colour, 1));
        game.world.addComponent(newDoor, new SolidComponent());
        game.world.addComponent(newDoor, new InteractableComponent(doorDef.script, doorDef.scriptArgs));

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
                    stats.hunger = Math.min(100, stats.hunger + consumable.value);
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
                            menu.submenu = null;
                            menu.activeMenu = 'main';
                            menu.highlightedModule = null; // Clear highlighted module
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
                        menu.submenu = null;
                        menu.activeMenu = 'main';
                        menu.highlightedModule = null; // Clear highlighted module
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
                menu.submenu = null;
                menu.activeMenu = 'main';
                menu.highlightedModule = null; // Clear highlighted module
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
                const currentItem = currentEquipped.getComponent('ItemComponent');
                // Check inventory space
                if (inventory.items.size >= inventory.capacity) {
                    game.world.addComponent(player.id, new MessageComponent('Inventory full!', 'red'));
                    closeTopMenu(game.world);
                    return;
                }
                inventory.items.set(currentItem.name, { entityId: currentEquipped.id, quantity: 1 });
            }
        }

        // Equip new item (remove from inventory slots but weight still counts)
        equipped[slot] = itemEntity.id;
        inventory.items.delete(itemComponent.name);
        game.world.addComponent(player.id, new MessageComponent(`Equipped ${itemComponent.name}!`, 'green'));

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
        if (inventory.items.size >= inventory.capacity) {
            game.world.addComponent(player.id, new MessageComponent('Inventory full!', 'red'));
            closeTopMenu(game.world);
            return;
        }

        // Unequip item
        equipped[slot] = null;
        inventory.items.set(itemComponent.name, { entityId: itemEntity.id, quantity: 1 });
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
        MENU_ACTIONS['workbench_modules'](game, args.equipment);
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

        // Check inventory space
        if (inventory.items.size >= inventory.capacity) {
            game.world.addComponent(player.id, new MessageComponent('Inventory full!', 'red'));
            closeTopMenu(game.world);
            return;
        }

        const part = game.world.getEntity(partId);
        const partItem = part.getComponent('ItemComponent');

        // Detach the part
        attachmentSlots.slots[args.slotName].entity_id = null;
        inventory.items.set(partItem.name, { entityId: part.id, quantity: 1 });

        game.world.addComponent(player.id, new MessageComponent(`Detached ${partItem.name}!`, 'green'));
        // Return to module view
        MENU_ACTIONS['workbench_modules'](game, args.equipment);
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

        const itemComponent = equipmentEntity.getComponent('ItemComponent');
        const menuOptions = [
            { label: 'Unequip', action: 'unequip_item', actionArgs: equipmentEntity },
            { label: 'Back', action: 'view_equipment' }
        ];

        if (player && !player.hasComponent('MenuComponent')) {
            game.world.addComponent(player.id, new MenuComponent(itemComponent.name, menuOptions, player));
        }
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
        const partComponent = itemEntity.getComponent('PartComponent');

        const submenuOptions = [];

        // Add appropriate actions
        if (consumable) {
            submenuOptions.push({ label: 'Eat', action: 'use_item', actionArgs: itemEntity });
        }

        if (equipment) {
            submenuOptions.push({ label: 'Equip', action: 'equip_item', actionArgs: itemEntity });
        }

        if (attachmentSlots) {
            submenuOptions.push({ label: 'Inspect', action: 'inspect_equipment', actionArgs: itemEntity });
        }

        submenuOptions.push({ label: 'Exit', action: 'close_submenu' });

        // Set submenu and switch to it - if this is a part, include it as moduleEntity for all options
        menu.submenu = { title: itemComponent.name, options: submenuOptions };
        menu.submenuSelectedIndex = 0;
        menu.activeMenu = 'submenu';

        // If this is a module part, set it as the highlighted module
        if (partComponent) {
            menu.highlightedModule = itemEntity.id;
        } else {
            menu.highlightedModule = null;
        }
    },
    'close_submenu': (game) => {
        const player = game.world.query(['PlayerComponent'])[0];
        if (!player) return;

        const menu = player.getComponent('MenuComponent');
        if (menu) {
            menu.submenu = null;
            menu.activeMenu = 'main';
            menu.highlightedModule = null; // Clear highlighted module when submenu closes
        }
    },
    'inspect_equipment': (game, equipmentEntity) => {
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
            let moduleEntity = null;

            if (slotData.entity_id) {
                const part = game.world.getEntity(slotData.entity_id);
                if (part) {
                    const partItem = part.getComponent('ItemComponent');
                    label += partItem.name;
                    moduleEntity = part;
                } else {
                    label += 'ERROR: Missing entity';
                }
            } else {
                label += `Empty${slotData.required ? ' (REQUIRED)' : ''}`;
            }

            submenuOptions.push({ label: label, action: 'close_submenu', moduleEntity: moduleEntity });
        }

        submenuOptions.push({ label: 'Back', action: 'close_submenu' });

        // Replace submenu with inspection view
        menu.submenu = { title: `${itemComponent.name} - Modules`, options: submenuOptions };
        menu.submenuSelectedIndex = 0;
        menu.activeMenu = 'submenu';
    },
    'workbench_modules': (game, equipmentEntity) => {
        const player = game.world.query(['PlayerComponent'])[0];
        if (!player) return;

        const itemComponent = equipmentEntity.getComponent('ItemComponent');
        const attachmentSlots = equipmentEntity.getComponent('AttachmentSlotsComponent');

        if (!attachmentSlots) {
            closeTopMenu(game.world);
            return;
        }

        const menuOptions = [];

        // Show all slots with their current state - these are interactive
        for (const [slotName, slotData] of Object.entries(attachmentSlots.slots)) {
            let label = `${slotName}: `;
            let moduleEntity = null;

            if (slotData.entity_id) {
                const part = game.world.getEntity(slotData.entity_id);
                if (part) {
                    const partItem = part.getComponent('ItemComponent');
                    label += partItem.name;
                    moduleEntity = part;
                } else {
                    label += 'ERROR: Missing entity';
                }
            } else {
                label += `Empty${slotData.required ? ' (REQUIRED)' : ''}`;
            }

            menuOptions.push({
                label: label,
                action: 'swap_module_menu',
                actionArgs: { equipment: equipmentEntity, slotName: slotName },
                moduleEntity: moduleEntity
            });
        }

        menuOptions.push({ label: 'Back', action: 'close_menu' });

        if (player && !player.hasComponent('MenuComponent')) {
            game.world.addComponent(player.id, new MenuComponent(`${itemComponent.name} - Modules`, menuOptions, player));
        }
    },
    'swap_module_menu': (game, args) => {
        const player = game.world.query(['PlayerComponent'])[0];
        if (!player) return;

        const inventory = player.getComponent('InventoryComponent');
        const attachmentSlots = args.equipment.getComponent('AttachmentSlotsComponent');
        const slotData = attachmentSlots.slots[args.slotName];

        const menuOptions = [];

        // If there's currently a module installed, add option to remove it
        if (slotData.entity_id) {
            const currentPart = game.world.getEntity(slotData.entity_id);
            if (currentPart) {
                const partItem = currentPart.getComponent('ItemComponent');
                menuOptions.push({
                    label: `Remove ${partItem.name}`,
                    action: 'swap_module',
                    actionArgs: { equipment: args.equipment, slotName: args.slotName, newPart: null },
                    moduleEntity: currentPart
                });
            }
        }

        // Find compatible parts in inventory
        for (const [itemName, itemData] of inventory.items) {
            const itemEntity = game.world.getEntity(itemData.entityId);
            const partComponent = itemEntity.getComponent('PartComponent');

            if (partComponent && partComponent.part_type === slotData.accepted_type) {
                menuOptions.push({
                    label: `Install ${itemName}`,
                    action: 'swap_module',
                    actionArgs: { equipment: args.equipment, slotName: args.slotName, newPart: itemEntity },
                    moduleEntity: itemEntity
                });
            }
        }

        if (menuOptions.length === 0) {
            game.world.addComponent(player.id, new MessageComponent(`No compatible modules for ${args.slotName}!`, 'yellow'));
            closeTopMenu(game.world);
            return;
        }

        menuOptions.push({ label: 'Back', action: 'workbench_modules', actionArgs: args.equipment });

        if (player && !player.hasComponent('MenuComponent')) {
            game.world.addComponent(player.id, new MenuComponent(`Swap ${args.slotName}`, menuOptions, player));
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
                const oldPartItem = oldPart.getComponent('ItemComponent');

                // Check inventory space if we're installing a new part (swapping)
                if (args.newPart && inventory.items.size >= inventory.capacity) {
                    game.world.addComponent(player.id, new MessageComponent('Inventory full!', 'red'));
                    closeTopMenu(game.world);
                    return;
                }

                // Add old part to inventory
                inventory.items.set(oldPartItem.name, { entityId: oldPart.id, quantity: 1 });
            }
        }

        // Install new part if provided
        if (args.newPart) {
            const newPartItem = args.newPart.getComponent('ItemComponent');
            attachmentSlots.slots[args.slotName].entity_id = args.newPart.id;
            inventory.items.delete(newPartItem.name);
            game.world.addComponent(player.id, new MessageComponent(`Installed ${newPartItem.name}!`, 'green'));
        } else {
            // Just removing the module
            attachmentSlots.slots[args.slotName].entity_id = null;
            game.world.addComponent(player.id, new MessageComponent(`Removed module from ${args.slotName}!`, 'green'));
        }

        // Return to module view
        MENU_ACTIONS['workbench_modules'](game, args.equipment);
    }
};

const SCRIPT_REGISTRY = {
    'showMessage': (game, self, args) => {
        if (!self.hasComponent('MessageComponent')) {
            game.world.addComponent(self.id, new MessageComponent(args.message, args.colour));
        }
    },
    'openMenu': (game, self, args) => {
        // Find the player and add a menu component to them.
        // In a more complex game, we might have a dedicated UI entity.
        const player = game.world.query(['PlayerComponent'])[0];
        if (player && !player.hasComponent('MenuComponent')) {
            game.world.addComponent(player.id, new MenuComponent(args.title, args.options, self));
        }
    },
    'pickupItem': (game, self, args) => {
        const player = game.world.query(['PlayerComponent'])[0];
        if (!player) return;

        const inventory = player.getComponent('InventoryComponent');
        const itemComponent = self.getComponent('ItemComponent');
        const stackableComponent = self.getComponent('StackableComponent');
        const itemName = itemComponent.name;

        if (!inventory || !itemComponent) {
            return;
        }

        if (stackableComponent) {
            // Check if item already exists in inventory and can be stacked
            if (inventory.items.has(itemName)) {
                const existingStack = inventory.items.get(itemName);
                if (existingStack.quantity < stackableComponent.stackLimit) {
                    existingStack.quantity++;
                    game.world.addComponent(player.id, new MessageComponent(`Picked up another ${itemName} (x${existingStack.quantity})`));
                    game.world.destroyEntity(self.id); // Destroy the picked up item entity
                    return;
                }
            }
        }

        // If not stackable, or stackable but no existing stack or existing stack is full
        if (inventory.items.size < inventory.capacity) {
            // Add to inventory as a new entry (either new stackable or non-stackable)
            inventory.items.set(itemName, { entityId: self.id, quantity: stackableComponent ? 1 : 1 });
            self.removeComponent('PositionComponent');
            self.removeComponent('RenderableComponent');
            game.world.addComponent(player.id, new MessageComponent(`Picked up ${itemName}`));
        } else {
            game.world.addComponent(player.id, new MessageComponent(`Inventory full!`));
        }
    },
    'openInventoryMenu': (game, self, args) => {
        const player = game.world.query(['PlayerComponent'])[0];
        if (!player) return;

        const inventory = player.getComponent('InventoryComponent');
        if (!inventory || inventory.items.size === 0) {
            game.world.addComponent(player.id, new MessageComponent('Inventory is empty.'));
            return;
        }

        const menuOptions = [];
        for (const [itemName, itemData] of inventory.items) {
            const itemEntity = game.world.getEntity(itemData.entityId);
            const itemComponent = itemEntity.getComponent('ItemComponent');
            let label = itemComponent.name;
            if (itemData.quantity > 1) {
                label += ` (x${itemData.quantity})`;
            }
            menuOptions.push({
                label: label,
                action: 'show_item_submenu',
                actionArgs: itemEntity // Pass the entire item entity
            });
        }
        menuOptions.push({ label: 'Close', action: 'close_menu' });

        // First, remove any existing MenuComponent to ensure a fresh start
        const existingMenuEntity = game.world.query(['MenuComponent'])[0];
        if (existingMenuEntity) {
            game.world.removeComponent(player.id, 'MenuComponent');
        }
        // Then, add the new MenuComponent
        const newMenuComponent = new MenuComponent('Inventory', menuOptions, player);
        newMenuComponent.submenu = null; // Explicitly clear submenu
        newMenuComponent.activeMenu = 'main'; // Explicitly set active menu to main
        game.world.addComponent(player.id, newMenuComponent);
    },
    'openWorkbenchMenu': (game, self, args) => {
        const player = game.world.query(['PlayerComponent'])[0];
        if (!player) return;

        const inventory = player.getComponent('InventoryComponent');
        if (!inventory || inventory.items.size === 0) {
            game.world.addComponent(player.id, new MessageComponent('Inventory is empty. Cannot use workbench.', 'yellow'));
            return;
        }

        const equipableItems = [];
        for (const [itemName, itemData] of inventory.items) {
            const itemEntity = game.world.getEntity(itemData.entityId);
            // Check if the item is equipment (weapon or armour)
            if (itemEntity.hasComponent('EquipmentComponent')) {
                equipableItems.push(itemEntity);
            }
        }

        if (equipableItems.length === 0) {
            game.world.addComponent(player.id, new MessageComponent('No equipable items in inventory to modify.', 'yellow'));
            return;
        }

        const menuOptions = equipableItems.map(itemEntity => {
            const itemComponent = itemEntity.getComponent('ItemComponent');
            return {
                label: itemComponent.name,
                action: 'workbench_modules', // This will be the next action
                actionArgs: itemEntity
            };
        });
        menuOptions.push({ label: 'Back', action: 'close_menu' });

        if (player && !player.hasComponent('MenuComponent')) {
            game.world.addComponent(player.id, new MenuComponent('Select Equipment to Modify', menuOptions, player));
        }
    }
};

// --- GAME CLASS (Now an orchestrator for the ECS World) ---
class Game {
    constructor() {
        this.container = document.getElementById('game-container');
        this.width = 40;
        this.height = 15;
        this.world = new World();
        this.world.game = this; // Systems can access game globals via the world

        this.mapInfo = {}; // Will be populated by the world builder
        this.lastFrameTime = 0;
        this.messageSystem = new MessageSystem(); // Instantiate MessageSystem here
        
        this.init();
    }

    init() {
        // Setup the world and systems
        this.world.registerSystem(new InputSystem());
        this.world.registerSystem(new InteractionSystem());
        this.world.registerSystem(new MovementSystem());
        this.world.registerSystem(new HudSystem());
        this.world.registerSystem(new RenderSystem());
        // MessageSystem is updated manually after world.update() to ensure proper message ordering

        // Create the game world using the builder
        buildWorld(this.world, 'CRYOBAY_7');
        
        // Start the game loop
        this.lastFrameTime = performance.now();
        this.gameLoop();
    }

    gameLoop() {
        const now = performance.now();
        const deltaTime = now - this.lastFrameTime;
        this.lastFrameTime = now;

        // The world runs all the systems
        this.world.update(deltaTime);
        
        // Manually update the MessageSystem
        this.messageSystem.update(this.world);

        this.updateAreaHud();

        requestAnimationFrame(() => this.gameLoop());
    }

    updateAreaHud() {
        const info = this.mapInfo;
        document.getElementById('area-name').textContent = info.name || 'Area';
        document.getElementById('area-temp').textContent = `${info.temperature}C`;
        document.getElementById('area-air').textContent = `Air: ${info.air_quality}%`;
    }
}

// Initialise the game
window.addEventListener('load', () => {
    new Game();
});
