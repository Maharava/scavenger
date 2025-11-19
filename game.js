// The main game setup and loop

// --- COMBAT CONSTANTS ---

const COMBAT_CONSTANTS = {
    // Initiative
    INITIATIVE_DIE: 6,               // Roll 1d6 for initiative

    // Movement
    BASE_MOVEMENT: 4,                // Tiles per turn (default)

    // Hit Chance
    BASE_ACCURACY: 70,               // Base weapon accuracy (%)
    MIN_HIT_CHANCE: 5,               // Minimum after all modifiers
    MAX_HIT_CHANCE: 95,              // Maximum after all modifiers
    OUT_OF_RANGE_PENALTY: 25,        // -25% per tile beyond weapon range

    // Aim Action
    AIM_BONUS: 15,                   // +15% per aim stack
    MAX_AIM_STACKS: 2,               // Max 2 stacks (+30% total)

    // Stress Effects on Combat
    STRESS_OPTIMAL_MIN: 20,          // +10% accuracy
    STRESS_OPTIMAL_MAX: 40,
    STRESS_PENALTY_1_MIN: 61,        // -10% accuracy
    STRESS_PENALTY_1_MAX: 80,
    STRESS_PENALTY_2_MIN: 81,        // -20% accuracy
    STRESS_PENALTY_2_MAX: 100,

    // Body Part Damage Effects
    HEAD_ACCURACY_PENALTY: 20,       // -20% if head < 50%
    TORSO_ACCURACY_PENALTY: 15,      // -15% if torso < 50%
    LIMBS_MOVEMENT_THRESHOLD: 70,    // -1 move per 30% below this

    // Dodge
    BASE_DODGE: 10,                  // 10% dodge chance

    // Melee Fallback
    UNARMED_DAMAGE: 5,               // Unarmed melee damage
    UNARMED_ACCURACY: 60,            // Unarmed melee accuracy
    UNARMED_TYPE: 'kinetic',

    // Status Effects
    BLEEDING_DAMAGE_PER_TURN: 5,     // Damage from bleeding (torso < 15%)
    TORSO_BLEEDING_THRESHOLD: 15,    // Torso HP % for bleeding
    INFECTED_DAMAGE_PER_TURN: 3,     // Toxin damage per turn
    INFECTED_DURATION: 5,            // Turns until infection ends

    // Enemy Detection
    HUMANOID_DETECTION: 10,          // Tiles
    ROBOT_DETECTION: 12,
    ALIEN_DETECTION: 8,
    ABERRANT_DETECTION_MIN: 4,       // Random 4-16
    ABERRANT_DETECTION_MAX: 16,

    // Flee & Morale
    FLEE_MORALE_THRESHOLD: 30,       // Humanoids flee below this

    // Combat Entry
    COMBAT_ENTRY_MIN_STRESS: 20,     // Minimum stress when combat starts

    // First Strike
    FIRST_STRIKE_BONUS: 15           // +15% accuracy if player initiated combat
};

// --- COMBAT FLAVOR TEXT ---

const COMBAT_FLAVOR = {
    HIT: [
        "You hit the",
        "Your shot connects with",
        "Direct hit on",
        "You strike"
    ],
    MISS: [
        "You miss!",
        "Your shot goes wide!",
        "You fail to hit the target!",
        "Your aim was off!"
    ],
    DODGE: [
        "They dodge at the last second!",
        "They evade your shot!",
        "They move out of the way!",
        "Your target dodges!"
    ],
    HEAD_50: [
        "They appear dazed.",
        "Their eyes are unfocused.",
        "They're struggling to track you.",
        "Blood streams from their face.",
        "They stagger, disoriented."
    ],
    HEAD_25: [
        "They're struggling to focus.",
        "Their vision is clearly impaired.",
        "They can barely keep their head up.",
        "They're swaying unsteadily.",
        "Severe head trauma is evident."
    ],
    TORSO_50: [
        "They're winded.",
        "They're breathing heavily.",
        "They clutch their chest.",
        "They're favoring their side.",
        "Their movements are labored."
    ],
    TORSO_25: [
        "They're bleeding heavily.",
        "Blood pours from their wounds.",
        "Their chest is a mess of gore.",
        "They're gasping for air.",
        "They won't last much longer."
    ],
    LIMBS_50: [
        "They have a pronounced limp.",
        "They're favoring one arm.",
        "Their movements are unsteady.",
        "They're clearly injured.",
        "One of their limbs isn't working properly."
    ],
    LIMBS_25: [
        "One of their legs isn't working.",
        "One of their arms isn't working.",
        "They drag a useless limb.",
        "They can barely move.",
        "They're crippled, but still fighting."
    ]
};

// Helper function to get random flavor text
function getRandomFlavor(category) {
    const messages = COMBAT_FLAVOR[category];
    if (!messages || messages.length === 0) return "";
    return messages[Math.floor(Math.random() * messages.length)];
}

// --- SCRIPT & ACTION REGISTRIES ---

function closeTopMenu(world) {
    const menuEntity = world.query(['MenuComponent'])[0];
    if (menuEntity) {
        const menu = menuEntity.getComponent('MenuComponent');
        // Clear all menu data to help with garbage collection
        if (menu) {
            menu.submenu1 = null;
            menu.submenu2 = null;
            menu.detailsPane = null;
            menu.options = null;
        }
        menuEntity.removeComponent('MenuComponent');
    }
}

// Helper function to get the correct inventory key for an item
// Stackable items use name as key, non-stackable items use entityId
function getInventoryKey(itemEntity) {
    const stackable = itemEntity.getComponent('StackableComponent');
    if (stackable) {
        const itemComponent = itemEntity.getComponent('ItemComponent');
        return itemComponent.name; // Stackable: key by name
    } else {
        return itemEntity.id; // Non-stackable: key by entityId
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

// Helper function to calculate armor stats from attached components
// Returns null if equipment is not armor or has no attachment slots
function calculateArmourStats(world, armourEntity) {
    const attachmentSlots = armourEntity.getComponent('AttachmentSlotsComponent');
    const armourComponent = armourEntity.getComponent('ArmourComponent');

    if (!attachmentSlots || !armourComponent) return null;

    const stats = {
        maxDurability: 0,
        resistances: { kinetic: 0, energy: 0, toxin: 0, radiation: 0 },
        tempMin: 0,
        tempMax: 0
    };

    // Calculate stats from each attached component
    for (const [slotName, slotData] of Object.entries(attachmentSlots.slots)) {
        if (!slotData.entity_id) continue;

        const part = world.getEntity(slotData.entity_id);
        if (!part) continue;

        const statMod = part.getComponent('StatModifierComponent');
        if (!statMod || !statMod.modifiers) continue;

        // Accumulate armor-specific stats
        if (statMod.modifiers.maxDurability) {
            stats.maxDurability += statMod.modifiers.maxDurability;
        }
        if (statMod.modifiers.kinetic) {
            stats.resistances.kinetic += statMod.modifiers.kinetic;
        }
        if (statMod.modifiers.energy) {
            stats.resistances.energy += statMod.modifiers.energy;
        }
        if (statMod.modifiers.toxin) {
            stats.resistances.toxin += statMod.modifiers.toxin;
        }
        if (statMod.modifiers.radiation) {
            stats.resistances.radiation += statMod.modifiers.radiation;
        }
        if (statMod.modifiers.tempMin) {
            stats.tempMin += statMod.modifiers.tempMin;
        }
        if (statMod.modifiers.tempMax) {
            stats.tempMax += statMod.modifiers.tempMax;
        }
    }

    // Default durability if none specified
    if (stats.maxDurability === 0) {
        // Check if required slots are filled
        if (!isEquipmentValid(world, armourEntity)) {
            stats.maxDurability = 0; // Incomplete armor has no durability
        } else {
            stats.maxDurability = 100; // Complete armor with no durability modifiers gets default
        }
    }

    return stats;
}

// Helper function to update armor stats component based on attached parts
function updateArmourStats(world, armourEntity) {
    const calculatedStats = calculateArmourStats(world, armourEntity);
    if (!calculatedStats) return;

    let armourStats = armourEntity.getComponent('ArmourStatsComponent');

    // Create component if it doesn't exist
    if (!armourStats) {
        armourStats = new ArmourStatsComponent(calculatedStats.maxDurability);
        world.addComponent(armourEntity.id, armourStats);
    }

    // Update stats from calculated values
    const oldMaxDurability = armourStats.maxDurability;
    armourStats.maxDurability = calculatedStats.maxDurability;

    // Scale current durability proportionally if max changed
    if (oldMaxDurability > 0 && oldMaxDurability !== calculatedStats.maxDurability) {
        const durabilityPercent = armourStats.durability / oldMaxDurability;
        armourStats.durability = calculatedStats.maxDurability * durabilityPercent;
    } else if (armourStats.durability === 0 || armourStats.durability > calculatedStats.maxDurability) {
        armourStats.durability = calculatedStats.maxDurability;
    }

    armourStats.resistances = calculatedStats.resistances;
    armourStats.tempMin = calculatedStats.tempMin;
    armourStats.tempMax = calculatedStats.tempMax;
}

// Helper function to calculate gun stats from attached parts
function calculateGunStats(world, gunEntity) {
    const attachmentSlots = gunEntity.getComponent('AttachmentSlotsComponent');
    const gunComponent = gunEntity.getComponent('GunComponent');

    if (!attachmentSlots || !gunComponent) return null;

    const stats = {
        damageType: 'kinetic',
        damageAmount: 0,
        penetration: 1.0,
        accuracy: 70, // Base accuracy
        range: 0,
        comfortPenalty: 0
    };

    // Process each attached part
    for (const [slotName, slotData] of Object.entries(attachmentSlots.slots)) {
        if (!slotData.entity_id) continue;

        const part = world.getEntity(slotData.entity_id);
        if (!part) continue;

        const partComp = part.getComponent('PartComponent');
        const statMod = part.getComponent('StatModifierComponent');
        if (!partComp || !statMod || !statMod.modifiers) continue;

        // Chamber: Sets damage type, amount, and base penetration
        if (partComp.part_type === 'chamber') {
            if (statMod.modifiers.damageType) stats.damageType = statMod.modifiers.damageType;
            if (statMod.modifiers.damageAmount) stats.damageAmount = statMod.modifiers.damageAmount;
            if (statMod.modifiers.penetration !== undefined) stats.penetration = statMod.modifiers.penetration;
        }

        // Barrel: Modifies damage, penetration, sets range, modifies accuracy
        if (partComp.part_type === 'barrel') {
            if (statMod.modifiers.damageAmount) stats.damageAmount += statMod.modifiers.damageAmount;
            if (statMod.modifiers.penetration) stats.penetration *= statMod.modifiers.penetration;
            if (statMod.modifiers.range) stats.range = statMod.modifiers.range;
            if (statMod.modifiers.accuracy) stats.accuracy += statMod.modifiers.accuracy;
        }

        // Grip: Modifies accuracy and comfort penalty
        if (partComp.part_type === 'grip') {
            if (statMod.modifiers.accuracy) stats.accuracy += statMod.modifiers.accuracy;
            if (statMod.modifiers.comfortPenalty !== undefined) stats.comfortPenalty = statMod.modifiers.comfortPenalty;
        }

        // Optional mods can also modify stats
        if (partComp.part_type === 'mod_gun' || partComp.part_type === 'mod_pistol' || partComp.part_type === 'mod_rifle') {
            if (statMod.modifiers.accuracy) stats.accuracy += statMod.modifiers.accuracy;
            if (statMod.modifiers.damageAmount) stats.damageAmount += statMod.modifiers.damageAmount;
            if (statMod.modifiers.range) stats.range += statMod.modifiers.range;
            if (statMod.modifiers.penetration) stats.penetration *= statMod.modifiers.penetration;
        }
    }

    // Clamp accuracy to 0-100 range
    stats.accuracy = Math.max(0, Math.min(100, stats.accuracy));

    return stats;
}

// Helper function to update gun stats component based on attached parts
function updateGunStats(world, gunEntity) {
    const calculatedStats = calculateGunStats(world, gunEntity);
    if (!calculatedStats) return;

    let gunStats = gunEntity.getComponent('GunStatsComponent');

    // Create component if it doesn't exist
    if (!gunStats) {
        gunStats = new GunStatsComponent();
        world.addComponent(gunEntity.id, gunStats);
    }

    // Update stats from calculated values
    gunStats.damageType = calculatedStats.damageType;
    gunStats.damageAmount = calculatedStats.damageAmount;
    gunStats.penetration = calculatedStats.penetration;
    gunStats.accuracy = calculatedStats.accuracy;
    gunStats.range = calculatedStats.range;
    gunStats.comfortPenalty = calculatedStats.comfortPenalty;
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
        MENU_ACTIONS['manage_equipment_modules'](game, args.equipment);
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
        MENU_ACTIONS['manage_equipment_modules'](game, args.equipment);
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
    'manage_equipment_modules': (game, equipmentEntity) => {
        // Deprecated - kept for compatibility, redirects to new action
        MENU_ACTIONS['show_equipment_slots'](game, equipmentEntity);
    },
    'swap_module_menu': (game, args) => {
        // Deprecated - kept for compatibility, redirects to new action
        MENU_ACTIONS['show_slot_mods'](game, args);
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

        // Make world and game accessible from browser console for debugging
        window.world = this.world;
        window.game = this;

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
        this.world.registerSystem(new ComfortSystem());
        // Combat systems
        this.world.registerSystem(new CombatSystem());
        this.world.registerSystem(new ActionResolutionSystem());
        this.world.registerSystem(new DamageSystem());
        this.world.registerSystem(new CombatAISystem());
        this.world.registerSystem(new ProjectileSystem());
        // UI systems
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
        const player = this.world.query(['PlayerComponent'])[0];
        const inCombat = player && player.hasComponent('CombatStateComponent');

        if (inCombat) {
            // Show combat status
            const combatSystem = this.world.systems.find(s => s.constructor.name === 'CombatSystem');
            if (combatSystem && combatSystem.activeCombatSession) {
                const activeId = combatSystem.activeCombatSession.getActiveCombatant();
                const isPlayerTurn = activeId === player.id;

                if (isPlayerTurn) {
                    const combatant = player.getComponent('CombatantComponent');
                    const movementSystem = this.world.systems.find(s => s instanceof MovementSystem);
                    let movementMax = 4;
                    if (combatant && movementSystem) {
                        movementMax = movementSystem.calculateMovementMax(this.world, player, combatant);
                    }
                    const movementUsed = combatant ? combatant.movementUsed : 0;

                    document.getElementById('area-name').textContent = `COMBAT - Round ${combatSystem.activeCombatSession.round} (Movement: ${movementUsed}/${movementMax})`;
                    document.getElementById('area-temp').textContent = 'Space: fire | R: target | F: flee | E: end turn';
                } else {
                    const activeEntity = this.world.getEntity(activeId);
                    const name = activeEntity ? activeEntity.getComponent('NameComponent') : null;
                    document.getElementById('area-name').textContent = `COMBAT - Enemy Turn: ${name ? name.name : 'Unknown'}`;
                    document.getElementById('area-temp').textContent = 'Waiting for enemy...';
                }
            }
        } else {
            // Normal area display
            document.getElementById('area-name').textContent = info.name || 'Area';

            // Get player's comfortable temperature range
            let tempRangeText = '';
            if (player) {
                const stats = player.getComponent('CreatureStatsComponent');
                if (stats) {
                    const modifiers = getEquipmentModifiers(this.world, player);
                    const tempRange = stats.getComfortTempRange(modifiers.tempMin || 0, modifiers.tempMax || 0);
                    tempRangeText = ` (${tempRange.min}-${tempRange.max})`;
                }
            }

            document.getElementById('area-temp').textContent = `${info.temperature}C${tempRangeText}`;
        }
    }
}

// Initialise the game
window.addEventListener('load', () => {
    new Game();
});
