// Script registry for interactable objects
// Maps script names to their handler functions

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
    },
    'openProducerMenu': (game, self, args) => {
        const player = game.world.query(['PlayerComponent'])[0];
        if (!player) return;

        const producer = self.getComponent('ProducerComponent');
        if (!producer) return;

        const producerType = PRODUCER_TYPES[producer.producerType];
        if (!producerType) return;

        if (producer.state === 'empty') {
            const inventory = player.getComponent('InventoryComponent');
            const validInputs = [];

            // Find all recipes for this producer type
            const recipes = PRODUCER_RECIPES[producer.producerType];
            if (!recipes) return;

            // Check player inventory for valid input items
            for (const [itemName, itemData] of inventory.items) {
                const itemEntity = game.world.getEntity(itemData.entityId);
                const nameComp = itemEntity.getComponent('NameComponent');

                // Check all data sources for this item
                let itemDef = INTERACTABLE_DATA.find(def => def.name === nameComp.name);
                if (!itemDef) itemDef = FOOD_DATA.find(def => def.name === nameComp.name);
                if (!itemDef) itemDef = ITEM_DATA.find(def => def.name === nameComp.name);

                if (itemDef) {
                    // Check if this item is a valid input for any recipe
                    const matchingRecipe = recipes.find(recipe => recipe.inputItemId === itemDef.id);
                    if (matchingRecipe) {
                        validInputs.push({ itemDef, recipe: matchingRecipe });
                    }
                }
            }

            if (validInputs.length === 0) {
                game.world.addComponent(player.id, new MessageComponent(producerType.noInputMessage, 'yellow'));
                return;
            }

            const menuOptions = validInputs.map(input => ({
                label: `${producerType.startActionLabel} ${input.itemDef.name}`,
                action: 'startProduction',
                actionArgs: { recipeId: input.recipe.id, producerId: self.id }
            }));
            menuOptions.push({ label: 'Cancel', action: 'close_menu' });

            game.world.addComponent(player.id, new MenuComponent(producerType.emptyMessage, menuOptions, self));
        } else if (producer.state === 'processing') {
            const timeComponent = player.getComponent('TimeComponent');
            const currentTotalMinutes = timeComponent.totalMinutes;

            // Check if production is actually complete (deadline-based system)
            if (currentTotalMinutes >= producer.endTotalMinutes) {
                // Automatically transition to ready state
                producer.state = 'ready';
                const menuOptions = [
                    { label: producerType.collectActionLabel, action: 'collectOutput', actionArgs: { producerId: self.id } },
                    { label: 'Cancel', action: 'close_menu' }
                ];
                game.world.addComponent(player.id, new MenuComponent(producerType.readyMessage, menuOptions, self));
            } else {
                // Calculate remaining time
                const remainingMinutes = Math.max(0, producer.endTotalMinutes - currentTotalMinutes);
                const remainingHours = Math.ceil(remainingMinutes / 60); // Round up

                // Look up the input item name for display
                const inputItemDef = findItemDefinition(producer.inputItemId);
                const itemDisplayName = inputItemDef ? inputItemDef.name : producer.inputItemId;

                game.world.addComponent(player.id, new MessageComponent(`${producerType.processingMessagePrefix} ${itemDisplayName}. Roughly ${remainingHours} hour${remainingHours !== 1 ? 's' : ''} left.`, 'cyan'));
            }
        } else if (producer.state === 'ready') {
            const menuOptions = [
                { label: producerType.collectActionLabel, action: 'collectOutput', actionArgs: { producerId: self.id } },
                { label: 'Cancel', action: 'close_menu' }
            ];
            game.world.addComponent(player.id, new MenuComponent(producerType.readyMessage, menuOptions, self));
        } else if (producer.state === 'failed') {
            const menuOptions = [
                { label: 'Clear Dead Plants', action: 'clearFailedProducer', actionArgs: { producerId: self.id } },
                { label: 'Cancel', action: 'close_menu' }
            ];
            game.world.addComponent(player.id, new MenuComponent('The plants have died from lack of water.', menuOptions, self));
        }
    },
    'openExpeditionMenu': (game, self, args) => {
        const player = game.world.query(['PlayerComponent'])[0];
        if (!player) return;

        // Check if player is in combat
        const inCombat = player.hasComponent('CombatStateComponent');
        if (inCombat) {
            game.world.addComponent(player.id, new MessageComponent('You cannot start an expedition during combat!', 'red'));
            return;
        }

        // Build expedition options from LOCATION_DATA
        const menuOptions = [];
        for (const [locationId, locationData] of Object.entries(LOCATION_DATA)) {
            menuOptions.push({
                label: `${locationData.name} (${locationData.difficulty})`,
                action: 'start_expedition',
                actionArgs: { locationId: locationId }
            });
        }
        menuOptions.push({ label: 'Cancel', action: 'close_menu' });

        game.world.addComponent(player.id, new MenuComponent('Select Expedition Location', menuOptions, self));
    },
    'refillWaterTank': (game, self, args) => {
        const player = game.world.query(['PlayerComponent'])[0];
        if (!player) return;

        const inventory = player.getComponent('InventoryComponent');
        const shipEntity = game.world.query(['ShipComponent'])[0];

        if (!shipEntity) {
            game.world.addComponent(player.id, new MessageComponent('Water tank only works on the ship!', 'yellow'));
            return;
        }

        const ship = shipEntity.getComponent('ShipComponent');

        // Check if player has water canister
        const waterCanister = inventory.items.get('Sealed Water Canister');

        if (!waterCanister || waterCanister.quantity <= 0) {
            game.world.addComponent(player.id, new MessageComponent('You need a Sealed Water Canister to refill the tank.', 'yellow'));
            return;
        }

        // Remove one water canister from inventory
        waterCanister.quantity--;
        if (waterCanister.quantity <= 0) {
            inventory.items.delete('Sealed Water Canister');
        }

        // Add 2L to ship water
        const waterAdded = ship.addWater(2.0);

        if (waterAdded < 2.0) {
            const wastedWater = 2.0 - waterAdded;
            game.world.addComponent(player.id, new MessageComponent(`Added ${waterAdded.toFixed(1)}L to the ship tank. ${wastedWater.toFixed(1)}L wasted (tank full).`, 'green'));
        } else {
            game.world.addComponent(player.id, new MessageComponent('Added 2L to the ship water tank.', 'green'));
        }
    },
    'returnToShip': (game, self, args) => {
        const player = game.world.query(['PlayerComponent'])[0];
        if (!player) return;

        // Check if in combat
        const inCombat = player.hasComponent('CombatStateComponent');
        if (inCombat) {
            game.world.addComponent(player.id, new MessageComponent('You cannot return to ship during combat!', 'red'));
            return;
        }

        // Show confirmation menu
        game.world.addComponent(player.id, new MenuComponent(
            'Return to Ship?',
            [
                { label: 'Yes - End Expedition', action: 'confirm_return_to_ship' },
                { label: 'Cancel', action: 'close_menu' }
            ],
            self
        ));
    }
};
