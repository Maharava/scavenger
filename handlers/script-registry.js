/**
 * Script Registry
 * ===============
 * Maps interactable script names to their handler functions.
 *
 * Scripts are triggered when the player interacts with entities (pressing 'E').
 * Each script receives: (game, self, args)
 *   - game: The game instance with world reference
 *   - self: The entity being interacted with
 *   - args: Custom arguments from the entity's InteractableComponent
 *
 * Note: A duplicate findItemDefinition() exists here for standalone use.
 *       For world-context code, use world.findItemDefinition() instead.
 */

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
        const player = game.world.getPlayer();
        if (player && !player.hasComponent('MenuComponent')) {
            game.world.addComponent(player.id, new MenuComponent(args.title, args.options, self));
        }
    },
    'pickupItem': (game, self, args) => {
        const player = game.world.getPlayer();
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
        const player = game.world.getPlayer();
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
        const player = game.world.getPlayer();
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
        const player = game.world.getPlayer();
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
    'openShowerMenu': (game, self, args) => {
        const player = game.world.getPlayer();
        if (!player) return;

        // Check if player is already showering
        if (player.hasComponent('ShoweringComponent')) {
            game.world.addComponent(player.id, new MessageComponent('You are already showering!', 'yellow'));
            return;
        }

        // Check shower lockout
        const lockout = player.getComponent('ShowerLockoutComponent');
        if (lockout && game.world.gameTime < lockout.lockoutEndTime) {
            const remaining = Math.ceil(lockout.lockoutEndTime - game.world.gameTime);
            game.world.addComponent(player.id, new MessageComponent(
                `You showered recently. Wait ${remaining} more minutes for full benefits.`, 'yellow'
            ));
            return;
        }

        // Check if in combat
        if (player.hasComponent('CombatStateComponent')) {
            game.world.addComponent(player.id, new MessageComponent('You cannot shower during combat!', 'red'));
            return;
        }

        // Check ship water availability
        const ship = game.world.getShip();
        if (!ship) {
            game.world.addComponent(player.id, new MessageComponent('No ship found!', 'red'));
            return;
        }

        const shipComp = ship.getComponent('ShipComponent');
        const hasRecycler = ship.hasComponent('WaterRecyclerComponent');
        const waterNeeded = hasRecycler ? 20 : 40;

        if (shipComp.water < waterNeeded) {
            game.world.addComponent(player.id, new MessageComponent(
                `Not enough water! (Need ${waterNeeded}L, have ${shipComp.water.toFixed(1)}L)`, 'red'
            ));
            return;
        }

        // Create shower menu
        const waterText = hasRecycler ? '20L (Recycler Active)' : '40L';
        const menuOptions = [
            { label: `Take Shower (-${waterText}, +20 comfort, -20 stress)`, action: 'use_shower', actionArgs: { showerEntity: self } },
            { label: 'Cancel', action: 'close_menu' }
        ];

        game.world.addComponent(player.id, new MenuComponent('Shower', menuOptions, self));
    },
    'openProducerMenu': (game, self, args) => {
        const player = game.world.getPlayer();
        if (!player) return;

        const producer = self.getComponent('ProducerComponent');
        if (!producer) return;

        const producerType = PRODUCER_TYPES[producer.producerType];
        if (!producerType) return;

        if (producer.state === 'empty') {
            const inventory = player.getComponent('InventoryComponent');
            const shipEntity = game.world.query(['ShipComponent'])[0];
            const ship = shipEntity ? shipEntity.getComponent('ShipComponent') : null;

            // Find all recipes for this producer type
            const recipes = PRODUCER_RECIPES[producer.producerType];
            if (!recipes) return;

            // Filter to show ONLY viable inputs that exist in player's inventory OR ship cargo
            const validInputs = [];
            const seenItemIds = new Set(); // Track which items we've already found

            // Helper function to check inventory/cargo for viable inputs
            const checkInventorySource = (inventoryMap, sourceName) => {
                for (const [itemKey, itemData] of inventoryMap) {
                    const itemEntity = game.world.getEntity(itemData.entityId);
                    if (!itemEntity) continue;

                    const itemComponent = itemEntity.getComponent('ItemComponent');
                    if (!itemComponent) continue;

                    // Look up item definition by name across all data sources
                    let itemDef = INTERACTABLE_DATA.find(def => def.name === itemComponent.name);
                    if (!itemDef) itemDef = FOOD_DATA.find(def => def.name === itemComponent.name);
                    if (!itemDef) itemDef = ITEM_DATA.find(def => def.name === itemComponent.name);

                    if (itemDef) {
                        // Check if this item ID matches any recipe's input requirement
                        const matchingRecipe = recipes.find(recipe => recipe.inputItemId === itemDef.id);
                        if (matchingRecipe && itemData.quantity > 0 && !seenItemIds.has(itemDef.id)) {
                            // This item is viable - found in inventory/cargo AND it's a valid input
                            seenItemIds.add(itemDef.id); // Prevent duplicates
                            validInputs.push({
                                itemDef,
                                recipe: matchingRecipe,
                                source: sourceName,
                                itemKey: itemKey
                            });
                        }
                    }
                }
            };

            // Check player inventory first
            checkInventorySource(inventory.items, 'inventory');

            // Check ship cargo second (if on ship)
            if (ship) {
                checkInventorySource(ship.cargo, 'cargo');
            }

            // Show message if no viable inputs found
            if (validInputs.length === 0) {
                game.world.addComponent(player.id, new MessageComponent(producerType.noInputMessage, 'yellow'));
                return;
            }

            // Build menu with only viable inputs from both inventories
            const menuOptions = validInputs.map(input => {
                const sourceLabel = input.source === 'cargo' ? ' [Cargo]' : '';
                return {
                    label: `${producerType.startActionLabel} ${input.itemDef.name}${sourceLabel}`,
                    action: 'startProduction',
                    actionArgs: {
                        recipeId: input.recipe.id,
                        producerId: self.id,
                        itemSource: input.source,
                        itemKey: input.itemKey
                    }
                };
            });
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
        const player = game.world.getPlayer();
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
        const player = game.world.getPlayer();
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
        const player = game.world.getPlayer();
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
    },
    'openShipCargoMenu': (game, self, args) => {
        const player = game.world.getPlayer();
        if (!player) return;

        const shipEntity = game.world.query(['ShipComponent'])[0];
        if (!shipEntity) {
            game.world.addComponent(player.id, new MessageComponent('Cargo hold only accessible on ship!', 'yellow'));
            return;
        }

        const ship = shipEntity.getComponent('ShipComponent');
        const playerInventory = player.getComponent('InventoryComponent');

        const menuOptions = [
            { label: `View Cargo (${ship.getTotalCargoSlotsUsed(game.world)}/${ship.cargoCapacity} slots)`, action: 'view_cargo' },
            { label: 'Deposit Item from Inventory', action: 'deposit_to_cargo' },
            { label: 'Withdraw Item from Cargo', action: 'withdraw_from_cargo' },
            { label: 'Close', action: 'close_menu' }
        ];

        game.world.addComponent(player.id, new MenuComponent('Ship Cargo Hold', menuOptions, self, 'ship_cargo'));
    },
    'openBridgeConsole': (game, self, args) => {
        const player = game.world.getPlayer();
        if (!player) return;

        // Must be on ship to use bridge console
        if (game.world.currentMap !== 'SHIP') {
            game.world.addComponent(player.id, new MessageComponent('Bridge console only works on the ship!', 'yellow'));
            return;
        }

        const menuOptions = [
            { label: 'Travel (Coming Soon)', action: 'close_menu' },
            { label: 'Build Interactable', action: 'show_buildables_menu', actionArgs: { consoleEntity: self } },
            { label: 'Build Ship Upgrade (Coming Soon)', action: 'close_menu' },
            { label: 'Close', action: 'close_menu' }
        ];

        game.world.addComponent(player.id, new MenuComponent('Bridge Console', menuOptions, self, 'bridge_console'));
    },
    'openRecyclerMenu': (game, self, args) => {
        const player = game.world.getPlayer();
        if (!player) return;

        const inventory = player.getComponent('InventoryComponent');
        const shipEntity = game.world.query(['ShipComponent'])[0];
        const ship = shipEntity ? shipEntity.getComponent('ShipComponent') : null;

        console.log('=== RECYCLER DEBUG START ===');
        console.log('Player inventory items:', inventory.items.size);
        console.log('Ship cargo items:', ship ? ship.cargo.size : 'No ship');

        // Find all loose modules in player inventory and ship cargo
        const looseModules = [];

        // Helper function to check if an item is a loose module
        const checkForModules = (inventoryMap, sourceName) => {
            console.log(`\n--- Checking ${sourceName} ---`);
            let itemIndex = 0;
            for (const [itemKey, itemData] of inventoryMap) {
                itemIndex++;
                console.log(`\nItem ${itemIndex}: Key="${itemKey}", Quantity=${itemData.quantity}`);

                const itemEntity = game.world.getEntity(itemData.entityId);
                if (!itemEntity) {
                    console.log('  ✗ Entity not found!');
                    continue;
                }
                console.log('  ✓ Entity exists');

                const itemComponent = itemEntity.getComponent('ItemComponent');
                console.log('  ItemComponent:', itemComponent ? `name="${itemComponent.name}"` : 'MISSING');

                const partComponent = itemEntity.getComponent('PartComponent');
                console.log('  PartComponent:', partComponent ? `part_type="${partComponent.part_type}"` : 'MISSING');

                // Modules have PartComponent (not EquipmentComponent - that's for complete weapons/armor)
                if (!itemComponent || !partComponent) {
                    console.log('  ✗ Missing ItemComponent or PartComponent - skipping');
                    continue;
                }

                // Find the equipment definition using the part_type from the PartComponent
                const equipmentDef = EQUIPMENT_DATA.find(eq => eq.part_type && eq.name === itemComponent.name);
                console.log('  Equipment def search: name match =', equipmentDef ? equipmentDef.id : 'NOT FOUND');

                if (equipmentDef && equipmentDef.part_type) {
                    console.log('  ✓ VALID MODULE - Adding to list');
                    looseModules.push({
                        entity: itemEntity,
                        def: equipmentDef,
                        source: sourceName,
                        itemKey: itemKey,
                        quantity: itemData.quantity || 1
                    });
                } else {
                    console.log('  ✗ Not a valid module (no matching def with part_type)');
                }
            }
        };

        // Check player inventory
        if (inventory) {
            checkForModules(inventory.items, 'inventory');
        }

        // Check ship cargo if on ship
        if (ship) {
            checkForModules(ship.cargo, 'cargo');
        }

        // Also find complete equipment (guns, armor)
        const completeEquipment = [];

        const checkForEquipment = (inventoryMap, sourceName) => {
            console.log(`\n--- Checking ${sourceName} for complete equipment ---`);
            for (const [itemKey, itemData] of inventoryMap) {
                const itemEntity = game.world.getEntity(itemData.entityId);
                if (!itemEntity) continue;

                const itemComponent = itemEntity.getComponent('ItemComponent');
                const equipmentComponent = itemEntity.getComponent('EquipmentComponent');
                const attachmentSlots = itemEntity.getComponent('AttachmentSlotsComponent');

                // Check if it's complete equipment (not a loose module)
                if (itemComponent && equipmentComponent && attachmentSlots) {
                    const equipmentDef = EQUIPMENT_DATA.find(eq =>
                        (eq.equipment_slot === equipmentComponent.slot || eq.gun_type || eq.armour_type) &&
                        eq.name === itemComponent.name
                    );

                    if (equipmentDef && equipmentDef.attachment_slots) {
                        console.log(`  Found complete equipment: ${equipmentDef.name}`);
                        completeEquipment.push({
                            entity: itemEntity,
                            def: equipmentDef,
                            source: sourceName,
                            itemKey: itemKey,
                            quantity: itemData.quantity || 1,
                            attachmentSlots: attachmentSlots
                        });
                    }
                }
            }
        };

        // Check for equipment in both inventories
        if (inventory) {
            checkForEquipment(inventory.items, 'inventory');
        }
        if (ship) {
            checkForEquipment(ship.cargo, 'cargo');
        }

        console.log('\n=== SUMMARY ===');
        console.log('Total modules found:', looseModules.length);
        console.log('Total complete equipment found:', completeEquipment.length);
        console.log('=== RECYCLER DEBUG END ===\n');

        // If nothing found, show message
        if (looseModules.length === 0 && completeEquipment.length === 0) {
            game.world.addComponent(player.id, new MessageComponent('Nothing to recycle. Try loose modules or complete equipment.', 'yellow'));
            return;
        }

        // Build menu options
        const menuOptions = [];

        // Add complete equipment first
        completeEquipment.forEach(equipment => {
            const sourceLabel = equipment.source === 'cargo' ? ' [Cargo]' : '';
            const quantityLabel = equipment.quantity > 1 ? ` (x${equipment.quantity})` : '';
            menuOptions.push({
                label: `${equipment.def.name}${quantityLabel}${sourceLabel}`,
                action: 'recycle_equipment',
                actionArgs: {
                    equipmentEntity: equipment.entity,
                    equipmentDef: equipment.def,
                    source: equipment.source,
                    itemKey: equipment.itemKey,
                    attachmentSlots: equipment.attachmentSlots
                }
            });
        });

        // Add loose modules
        looseModules.forEach(module => {
            const sourceLabel = module.source === 'cargo' ? ' [Cargo]' : '';
            const quantityLabel = module.quantity > 1 ? ` (x${module.quantity})` : '';
            menuOptions.push({
                label: `${module.def.name}${quantityLabel}${sourceLabel}`,
                action: 'recycle_module',
                actionArgs: {
                    moduleEntity: module.entity,
                    moduleDef: module.def,
                    source: module.source,
                    itemKey: module.itemKey
                }
            });
        });

        menuOptions.push({ label: 'Cancel', action: 'close_menu' });

        game.world.addComponent(player.id, new MenuComponent('Recycler - Select Item', menuOptions, self, 'recycler'));
    },
    'lootCorpse': (game, self, args) => {
        const player = game.world.getPlayer();
        if (!player) return;

        const lootContainer = self.getComponent('LootContainerComponent');
        if (!lootContainer || !lootContainer.lootInventory) {
            game.world.addComponent(player.id, new MessageComponent('Nothing to loot.', 'yellow'));
            return;
        }

        if (lootContainer.lootInventory.size === 0) {
            game.world.addComponent(player.id, new MessageComponent('Corpse is empty.', 'yellow'));
            return;
        }

        // Build loot menu
        const menuOptions = [];

        for (const [itemName, itemData] of lootContainer.lootInventory) {
            const itemEntity = game.world.getEntity(itemData.entityId);
            if (itemEntity) {
                const itemComp = itemEntity.getComponent('ItemComponent');
                const quantityLabel = itemData.quantity > 1 ? ` (x${itemData.quantity})` : '';

                menuOptions.push({
                    label: `${itemName}${quantityLabel}`,
                    action: 'take_loot',
                    actionArgs: {
                        corpseEntity: self,
                        itemEntity: itemEntity,
                        itemName: itemName,
                        quantity: itemData.quantity
                    }
                });
            }
        }

        menuOptions.push({ label: 'Take All', action: 'take_all_loot', actionArgs: { corpseEntity: self } });
        menuOptions.push({ label: 'Close', action: 'close_menu' });

        const name = self.getComponent('NameComponent');
        const title = name ? `Loot: ${name.name}` : 'Loot Corpse';

        game.world.addComponent(player.id, new MenuComponent(title, menuOptions, self, 'loot_corpse'));
    },

    /**
     * Opens the cooking menu at a Stove.
     * Shows recipes organized by tier (Basic/Intermediate/Advanced) based on cooking skill.
     */
    'openStoveMenu': (game, self, args) => {
        const player = game.world.getPlayer();
        if (!player) return;

        const skills = player.getComponent('SkillsComponent');
        const inventory = player.getComponent('InventoryComponent');

        if (!skills || !inventory) return;

        const cookingSkill = skills.skills.get('Cooking')?.level || 0;

        // Helper function to count available ingredients
        const countIngredient = (itemId) => {
            // Check player inventory
            for (const [itemName, itemData] of inventory.items) {
                const itemEntity = game.world.getEntity(itemData.entityId);
                if (!itemEntity) continue;

                const nameComp = itemEntity.getComponent('NameComponent');
                if (!nameComp) continue;

                // Match by name (need to get definition to check ID)
                const def = game.world.findItemDefinition(itemId);
                if (def && def.name === itemName) {
                    const stackable = itemEntity.getComponent('StackableComponent');
                    return stackable ? stackable.quantity : 1;
                }
            }

            // Check ship cargo
            const ship = game.world.getShip();
            if (ship) {
                const shipComp = ship.getComponent('ShipComponent');
                if (shipComp && shipComp.cargoInventory) {
                    for (const [itemName, itemData] of shipComp.cargoInventory) {
                        const itemEntity = game.world.getEntity(itemData.entityId);
                        if (!itemEntity) continue;

                        const nameComp = itemEntity.getComponent('NameComponent');
                        if (!nameComp) continue;

                        const def = game.world.findItemDefinition(itemId);
                        if (def && def.name === itemName) {
                            const stackable = itemEntity.getComponent('StackableComponent');
                            return stackable ? stackable.quantity : 1;
                        }
                    }
                }
            }

            return 0;
        };

        // Helper function to check if player can make a recipe
        const canMakeRecipe = (recipe) => {
            if (recipe.skillRequired > cookingSkill) return 0;

            let maxCanMake = 999;
            for (const ingredient of recipe.ingredients) {
                const available = countIngredient(ingredient.itemId);
                const possible = Math.floor(available / ingredient.quantity);
                maxCanMake = Math.min(maxCanMake, possible);
            }

            return maxCanMake;
        };

        // Organize recipes by category
        const basicRecipes = COOKING_RECIPES.filter(r => r.tier <= 2);
        const intermediateRecipes = COOKING_RECIPES.filter(r => r.tier === 3 || r.tier === 4);
        const advancedRecipes = COOKING_RECIPES.filter(r => r.tier === 5);

        const menuOptions = [];

        // Add Basic category
        if (cookingSkill >= 1) {
            menuOptions.push({
                label: '=== BASIC MEALS ===',
                action: 'close_menu' // Disabled header
            });

            for (const recipe of basicRecipes) {
                const canMake = canMakeRecipe(recipe);
                const availableLabel = canMake > 0 ? ` (x${canMake})` : ' [MISSING INGREDIENTS]';
                const label = `${recipe.name}${availableLabel}`;

                menuOptions.push({
                    label: label,
                    action: canMake > 0 ? 'show_recipe_details' : 'close_menu',
                    actionArgs: { recipe, canMake, stove: self }
                });
            }
        }

        // Add Intermediate category
        if (cookingSkill >= 3) {
            menuOptions.push({
                label: '=== INTERMEDIATE MEALS ===',
                action: 'close_menu' // Disabled header
            });

            for (const recipe of intermediateRecipes) {
                const canMake = canMakeRecipe(recipe);
                const availableLabel = canMake > 0 ? ` (x${canMake})` : ' [MISSING INGREDIENTS]';
                const label = `${recipe.name}${availableLabel}`;

                menuOptions.push({
                    label: label,
                    action: canMake > 0 ? 'show_recipe_details' : 'close_menu',
                    actionArgs: { recipe, canMake, stove: self }
                });
            }
        }

        // Add Advanced category
        if (cookingSkill >= 5) {
            menuOptions.push({
                label: '=== ADVANCED MEALS ===',
                action: 'close_menu' // Disabled header
            });

            for (const recipe of advancedRecipes) {
                const canMake = canMakeRecipe(recipe);
                const availableLabel = canMake > 0 ? ` (x${canMake})` : ' [MISSING INGREDIENTS]';
                const label = `${recipe.name}${availableLabel}`;

                menuOptions.push({
                    label: label,
                    action: canMake > 0 ? 'show_recipe_details' : 'close_menu',
                    actionArgs: { recipe, canMake, stove: self }
                });
            }
        }

        menuOptions.push({ label: 'Close', action: 'close_menu' });

        const title = `Stove (Cooking Skill: ${cookingSkill})`;
        game.world.addComponent(player.id, new MenuComponent(title, menuOptions, self, 'stove_menu'));
    },

    'searchNode': (game, self, args) => {
        const player = game.world.getPlayer();
        if (!player) return;

        const nodeComponent = self.getComponent('ScavengeNodeComponent');
        if (!nodeComponent) {
            console.warn('searchNode called on entity without ScavengeNodeComponent');
            return;
        }

        const nameComponent = self.getComponent('NameComponent');
        const nodeName = nameComponent ? nameComponent.name : 'Container';

        // Check if already searched
        if (nodeComponent.searched) {
            game.ui.showMessage(`The ${nodeName} has already been searched.`, '#888888');
            return;
        }

        // Mark as searched
        nodeComponent.searched = true;

        // Change appearance to grey
        const renderable = self.getComponent('RenderableComponent');
        if (renderable) {
            renderable.colour = '#555555';
        }

        // Check if node has any loot
        if (!nodeComponent.lootItems || nodeComponent.lootItems.length === 0) {
            game.ui.showMessage(`The ${nodeName} is empty.`, '#888888');
            return;
        }

        // Open node loot menu
        const menuOptions = [];

        menuOptions.push({
            label: `--- ${nodeName} Contents ---`,
            action: 'nothing'
        });

        // Add each item in the node as a menu option
        for (const itemId of nodeComponent.lootItems) {
            const itemDef = findItemDefinition(itemId);
            if (itemDef) {
                menuOptions.push({
                    label: `Take ${itemDef.name}`,
                    action: 'take_from_node',
                    actionArgs: { nodeEntity: self, itemId: itemId }
                });
            }
        }

        menuOptions.push({
            label: 'Take All',
            action: 'take_all_from_node',
            actionArgs: { nodeEntity: self }
        });

        menuOptions.push({ label: 'Close', action: 'close_menu' });

        game.world.addComponent(player.id, new MenuComponent(`${nodeName}`, menuOptions, self, 'node_menu'));
    },
    'examineWaterRecycler': (game, self, args) => {
        const player = game.world.getPlayer();
        if (!player) return;

        game.world.addComponent(player.id, new MessageComponent(
            'Water Recycler is active. All water usage reduced by 50%.', 'cyan'
        ));
    },
    'openLifeSupportMenu': (game, self, args) => {
        const player = game.world.getPlayer();
        if (!player) return;

        const lifeSupport = self.getComponent('LifeSupportComponent');
        if (!lifeSupport) {
            // Initialize if missing
            game.world.addComponent(self.id, new LifeSupportComponent(0));
            return SCRIPT_REGISTRY['openLifeSupportMenu'](game, self, args);
        }

        const level = lifeSupport.level;
        const menuOptions = [];

        if (level === 0) {
            menuOptions.push({ label: 'Base Life Support Active (No upgrades)', action: 'close_menu' });
            menuOptions.push({ label: 'Upgrade to Tier 1 (10/70 comfort)', action: 'upgrade_life_support', actionArgs: { lifeSupportEntity: self, tier: 1 } });
        } else if (level === 1) {
            menuOptions.push({ label: `Tier 1 Active (Base: ${lifeSupport.baseComfort}, Max: ${lifeSupport.maxComfort})`, action: 'close_menu' });
            menuOptions.push({ label: 'Upgrade to Tier 2 (25/85 comfort)', action: 'upgrade_life_support', actionArgs: { lifeSupportEntity: self, tier: 2 } });
        } else if (level === 2) {
            menuOptions.push({ label: `Tier 2 Active (Base: ${lifeSupport.baseComfort}, Max: ${lifeSupport.maxComfort})`, action: 'close_menu' });
            menuOptions.push({ label: 'Upgrade to Tier 3 (40/100 comfort)', action: 'upgrade_life_support', actionArgs: { lifeSupportEntity: self, tier: 3 } });
        } else {
            menuOptions.push({ label: `Tier 3 Active (Base: ${lifeSupport.baseComfort}, Max: ${lifeSupport.maxComfort}) - MAX`, action: 'close_menu' });
        }

        menuOptions.push({ label: 'Close', action: 'close_menu' });

        game.world.addComponent(player.id, new MenuComponent('Life Support System', menuOptions, self));
    },
    'openAutoDocMenu': (game, self, args) => {
        const player = game.world.getPlayer();
        if (!player) return;

        // Check if already treating
        if (player.hasComponent('AutoDocTreatmentComponent')) {
            game.world.addComponent(player.id, new MessageComponent('Treatment already in progress!', 'yellow'));
            return;
        }

        // Check body parts status
        const bodyParts = player.getComponent('BodyPartsComponent');
        let needsHealing = false;
        const damages = [];

        for (const [part, eff] of bodyParts.parts) {
            if (eff < 100) {
                needsHealing = true;
                damages.push(`${part}: ${eff}%`);
            }
        }

        if (!needsHealing) {
            game.world.addComponent(player.id, new MessageComponent('No injuries detected.', 'green'));
            return;
        }

        const menuOptions = [
            { label: `Start Treatment (+20% all parts, 2hr, -20 comfort, +15 stress)`, action: 'start_autodoc_treatment', actionArgs: { autoDocEntity: self } },
            { label: 'Cancel', action: 'close_menu' }
        ];

        game.world.addComponent(player.id, new MenuComponent('Auto-Doc Medical Station', menuOptions, self));
    },
    'openRefineryMenu': (game, self, args) => {
        const player = game.world.getPlayer();
        if (!player) return;

        // Check if refining in progress
        const refining = self.getComponent('RefiningComponent');
        if (refining && refining.startTime) {
            const timeComp = player.getComponent('TimeComponent');
            const elapsed = timeComp.totalMinutes - refining.startTime;
            const remaining = refining.duration - elapsed;

            const menuOptions = [
                { label: `Refining ${refining.itemName}... (${Math.ceil(remaining)}min left)`, action: 'close_menu' },
                { label: 'Collect Fuel', action: 'collect_refined_fuel', actionArgs: { refineryEntity: self } },
                { label: 'Close', action: 'close_menu' }
            ];

            game.world.addComponent(player.id, new MenuComponent('Refinery', menuOptions, self));
            return;
        }

        // Show menu of organic items to refine
        const inventory = player.getComponent('InventoryComponent');
        const ship = game.world.getShip();
        const shipCargo = ship ? ship.getComponent('ShipComponent').cargo : null;

        const menuOptions = [];
        const refinableItems = [];

        // Check player inventory for food/organic items
        for (const [itemKey, itemData] of inventory.items) {
            const itemEntity = game.world.getEntity(itemData.entityId);
            if (!itemEntity) continue;

            const itemComp = itemEntity.getComponent('ItemComponent');
            if (!itemComp) continue;

            const itemDef = game.world.findItemDefinition(itemKey);
            if (itemDef && (itemDef.tags && (itemDef.tags.includes('food_raw') || itemDef.tags.includes('food_protein') || itemDef.tags.includes('organic')))) {
                refinableItems.push({
                    key: itemKey,
                    entity: itemEntity,
                    name: itemComp.name,
                    quantity: itemData.quantity,
                    source: 'inventory'
                });
            }
        }

        if (refinableItems.length === 0) {
            menuOptions.push({ label: 'No organic materials available', action: 'close_menu' });
        } else {
            for (const item of refinableItems) {
                menuOptions.push({
                    label: `Refine ${item.name} (x${item.quantity}) -> 5L Fuel`,
                    action: 'start_refining',
                    actionArgs: { refineryEntity: self, itemKey: item.key, itemEntity: item.entity, itemName: item.name }
                });
            }
        }

        menuOptions.push({ label: 'Close', action: 'close_menu' });

        game.world.addComponent(player.id, new MenuComponent('Refinery', menuOptions, self));
    },
    'openDropChuteMenu': (game, self, args) => {
        const player = game.world.getPlayer();
        if (!player) return;

        const inventory = player.getComponent('InventoryComponent');
        const ship = game.world.getShip();

        if (!ship) {
            game.world.addComponent(player.id, new MessageComponent('No ship connection!', 'red'));
            return;
        }

        const shipComp = ship.getComponent('ShipComponent');
        const menuOptions = [];

        // Show player inventory items
        for (const [itemKey, itemData] of inventory.items) {
            const itemEntity = game.world.getEntity(itemData.entityId);
            if (!itemEntity) continue;

            const itemComp = itemEntity.getComponent('ItemComponent');
            if (!itemComp) continue;

            menuOptions.push({
                label: `Send ${itemComp.name} (x${itemData.quantity}) to Ship`,
                action: 'send_to_ship_via_chute',
                actionArgs: { itemKey: itemKey, itemEntityId: itemData.entityId, quantity: itemData.quantity }
            });
        }

        if (menuOptions.length === 0) {
            menuOptions.push({ label: 'No items to send', action: 'close_menu' });
        }

        menuOptions.push({ label: 'Close', action: 'close_menu' });

        game.world.addComponent(player.id, new MenuComponent('Drop Chute', menuOptions, self));
    }
};
