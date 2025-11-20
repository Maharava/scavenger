// Script registry for interactable objects
// Maps script names to their handler functions

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
            // Stackable items use name as key
            if (inventory.items.has(itemName)) {
                const existingStack = inventory.items.get(itemName);
                if (existingStack.quantity < stackableComponent.stackLimit) {
                    // Check if we can add the weight and slots
                    if (inventory.canAddItem(game.world, self, 1)) {
                        existingStack.quantity++;
                        game.world.addComponent(player.id, new MessageComponent(`Picked up another ${itemName} (x${existingStack.quantity})`));
                        game.world.destroyEntity(self.id); // Destroy the picked up item entity
                        return;
                    } else {
                        game.world.addComponent(player.id, new MessageComponent(`Not enough space!`, 'red'));
                        return;
                    }
                }
            }
        }

        // If not stackable, or stackable but no existing stack or existing stack is full
        if (inventory.canAddItem(game.world, self, 1)) {
            // Add to inventory as a new entry
            // Use appropriate key: name for stackables, entityId for non-stackables
            const inventoryKey = getInventoryKey(self);
            inventory.items.set(inventoryKey, { entityId: self.id, quantity: stackableComponent ? 1 : 1 });
            self.removeComponent('PositionComponent');
            self.removeComponent('RenderableComponent');
            game.world.addComponent(player.id, new MessageComponent(`Picked up ${itemName}`));
        } else {
            game.world.addComponent(player.id, new MessageComponent(`Not enough space!`, 'red'));
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
        // Iterate over inventory items (key can be name for stackables or entityId for non-stackables)
        for (const [inventoryKey, itemData] of inventory.items) {
            const itemEntity = game.world.getEntity(itemData.entityId);
            if (!itemEntity) continue; // Skip if entity no longer exists

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
        const newMenuComponent = new MenuComponent('Inventory', menuOptions, player, 'inventory');
        newMenuComponent.submenu1 = null; // Explicitly clear submenu
        newMenuComponent.submenu2 = null;
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

        // Add inventory items that are modular equipment
        // Iterate over inventory items (key can be name for stackables or entityId for non-stackables)
        for (const [inventoryKey, itemData] of inventory.items) {
            const itemEntity = game.world.getEntity(itemData.entityId);
            if (itemEntity && itemEntity.hasComponent('EquipmentComponent') && itemEntity.hasComponent('AttachmentSlotsComponent')) {
                equipableItems.push(itemEntity);
            }
        }

        // Add equipped items that are modular equipment
        const equipped = player.getComponent('EquippedItemsComponent');
        if (equipped) {
            if (equipped.hand) {
                const handItem = game.world.getEntity(equipped.hand);
                if (handItem && handItem.hasComponent('EquipmentComponent') && handItem.hasComponent('AttachmentSlotsComponent')) {
                    equipableItems.push(handItem);
                }
            }
            if (equipped.body) {
                const bodyItem = game.world.getEntity(equipped.body);
                if (bodyItem && bodyItem.hasComponent('EquipmentComponent') && bodyItem.hasComponent('AttachmentSlotsComponent')) {
                    equipableItems.push(bodyItem);
                }
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
                action: 'show_equipment_slots',
                actionArgs: itemEntity
            };
        });
        menuOptions.push({ label: 'Back', action: 'close_menu' });

        // First, remove any existing MenuComponent to ensure a fresh start
        const existingMenuEntity = game.world.query(['MenuComponent'])[0];
        if (existingMenuEntity) {
            game.world.removeComponent(player.id, 'MenuComponent');
        }
        // Then, add the new MenuComponent
        const newMenuComponent = new MenuComponent('Select Equipment to Modify', menuOptions, player, 'workbench');
        newMenuComponent.submenu1 = null; // Explicitly clear submenus
        newMenuComponent.submenu2 = null;
        newMenuComponent.activeMenu = 'main'; // Explicitly set active menu to main
        game.world.addComponent(player.id, newMenuComponent);
    },
    'openSleepMenu': (game, self, args) => {
        const player = game.world.query(['PlayerComponent'])[0];
        if (!player) return;

        // Check if player is already sleeping
        const timeComponent = player.getComponent('TimeComponent');
        if (timeComponent && timeComponent.isSleeping) {
            game.world.addComponent(player.id, new MessageComponent('You are already sleeping!', 'yellow'));
            return;
        }

        // Check if in combat
        const inCombat = player.hasComponent('CombatStateComponent');
        if (inCombat) {
            game.world.addComponent(player.id, new MessageComponent('You cannot sleep during combat!', 'red'));
            return;
        }

        // Open sleep duration menu
        const menuOptions = [
            { label: '1 Hour (10% rest)', action: 'sleep', actionArgs: { hours: 1 } },
            { label: '4 Hours (40% rest)', action: 'sleep', actionArgs: { hours: 4 } },
            { label: '8 Hours (100% rest + healing)', action: 'sleep', actionArgs: { hours: 8 } },
            { label: 'Cancel', action: 'close_menu' }
        ];

        if (player && !player.hasComponent('MenuComponent')) {
            game.world.addComponent(player.id, new MenuComponent('How long do you want to sleep?', menuOptions, self));
        }
    }
};
