// Ship Persistence System
// Handles saving and loading ship state to/from localStorage
// Saves player stats, inventory, equipment, skills, ship resources, and time

const SHIP_SAVE_KEY = 'scavenger_ship_save';

// Save the current ship state to localStorage
// Called when player leaves ship for an expedition
function saveShipState(world) {
    const player = world.query(['PlayerComponent'])[0];
    if (!player) {
        console.error('Cannot save ship state: Player not found');
        return false;
    }

    const saveData = {
        version: 1,  // Save format version for future compatibility
        timestamp: Date.now(),  // When this save was created

        // Player stats
        stats: serializePlayerStats(world, player),

        // Inventory and equipment
        inventory: serializeInventory(world, player),
        equipment: serializeEquipment(world, player),

        // Skills
        skills: serializeSkills(world, player),

        // Ship resources (water, fuel, etc.)
        shipResources: serializeShipResources(world),

        // Time tracking
        time: serializeTime(world, player)
    };

    try {
        localStorage.setItem(SHIP_SAVE_KEY, JSON.stringify(saveData));
        console.log('Ship state saved successfully');
        return true;
    } catch (error) {
        console.error('Failed to save ship state:', error);
        return false;
    }
}

// Load ship state from localStorage
// Called when player returns to ship or starts a new game
// Returns true if loaded successfully, false if no save exists
function loadShipState(world) {
    try {
        const saveDataStr = localStorage.getItem(SHIP_SAVE_KEY);
        if (!saveDataStr) {
            console.log('No ship save found - starting fresh');
            return false;
        }

        const saveData = JSON.parse(saveDataStr);
        const player = world.query(['PlayerComponent'])[0];
        if (!player) {
            console.error('Cannot load ship state: Player not found');
            return false;
        }

        // Load all saved data
        deserializePlayerStats(world, player, saveData.stats);
        deserializeInventory(world, player, saveData.inventory);
        deserializeEquipment(world, player, saveData.equipment);
        deserializeSkills(world, player, saveData.skills);
        deserializeShipResources(world, saveData.shipResources);
        deserializeTime(world, player, saveData.time);

        console.log('Ship state loaded successfully');
        return true;
    } catch (error) {
        console.error('Failed to load ship state:', error);
        return false;
    }
}

// Clear saved ship state (for starting a new game)
function clearShipState() {
    localStorage.removeItem(SHIP_SAVE_KEY);
    console.log('Ship state cleared');
}

// --- Serialization Functions ---

function serializePlayerStats(world, player) {
    const stats = player.getComponent('CreatureStatsComponent');
    const bodyParts = player.getComponent('BodyPartsComponent');

    return {
        hunger: stats ? stats.hunger : 100,
        rest: stats ? stats.rest : 100,
        stress: stats ? stats.stress : 0,
        comfort: stats ? stats.comfort : BASE_COMFORT,
        bodyParts: bodyParts ? Array.from(bodyParts.parts.entries()) : []
    };
}

function deserializePlayerStats(world, player, data) {
    const stats = player.getComponent('CreatureStatsComponent');
    if (stats) {
        stats.hunger = data.hunger;
        stats.rest = data.rest;
        stats.stress = data.stress;
        stats.comfort = data.comfort;
    }

    const bodyParts = player.getComponent('BodyPartsComponent');
    if (bodyParts && data.bodyParts) {
        bodyParts.parts.clear();
        for (const [partName, efficiency] of data.bodyParts) {
            bodyParts.parts.set(partName, efficiency);
        }
    }
}

function serializeInventory(world, player) {
    const inventory = player.getComponent('InventoryComponent');
    if (!inventory) return { items: [] };

    const items = [];
    for (const [itemKey, itemData] of inventory.items) {
        const itemEntity = world.getEntity(itemData.entityId);
        if (!itemEntity) continue;

        const itemComponent = itemEntity.getComponent('ItemComponent');
        if (!itemComponent) continue;

        const itemSaveData = {
            key: itemKey,
            name: itemComponent.name,
            quantity: itemData.quantity,
            weight: itemComponent.weight,
            slots: itemComponent.slots,
            description: itemComponent.description
        };

        // Save modular equipment data if present
        const attachmentSlots = itemEntity.getComponent('AttachmentSlotsComponent');
        if (attachmentSlots) {
            itemSaveData.attachmentSlots = {};
            for (const [slotName, slotData] of Object.entries(attachmentSlots.slots)) {
                if (slotData.entity_id) {
                    const attachedEntity = world.getEntity(slotData.entity_id);
                    if (attachedEntity) {
                        const attachedItem = attachedEntity.getComponent('ItemComponent');
                        itemSaveData.attachmentSlots[slotName] = {
                            name: attachedItem ? attachedItem.name : 'Unknown',
                            accepted_type: slotData.accepted_type
                        };
                    }
                }
            }
        }

        items.push(itemSaveData);
    }

    return { items, capacity: inventory.capacity, maxWeight: inventory.maxWeight };
}

function deserializeInventory(world, player, data) {
    const inventory = player.getComponent('InventoryComponent');
    if (!inventory) return;

    inventory.items.clear();
    inventory.capacity = data.capacity;
    inventory.maxWeight = data.maxWeight;

    // Recreate inventory items from saved data
    // Note: This creates simple item entities without full recreation from INTERACTABLE_DATA
    // For a full implementation, items should be looked up by name in INTERACTABLE_DATA
    for (const itemData of data.items) {
        const itemEntity = world.createEntity();
        world.addComponent(itemEntity.id, new ItemComponent(
            itemData.name,
            itemData.description || '',
            itemData.weight || 0,
            itemData.slots || 1.0
        ));

        // Add to inventory (simplified - assumes stackable behavior based on item name)
        inventory.items.set(itemData.key, {
            entityId: itemEntity.id,
            quantity: itemData.quantity
        });
    }

    console.log(`Restored ${data.items.length} items to inventory`);
}

function serializeEquipment(world, player) {
    const equipped = player.getComponent('EquippedItemsComponent');
    if (!equipped) return { hand: null, body: null, tool1: null, tool2: null, backpack: null };

    const saveEquippedSlot = (entityId) => {
        if (!entityId) return null;
        const entity = world.getEntity(entityId);
        if (!entity) return null;
        const item = entity.getComponent('ItemComponent');
        return item ? { name: item.name, entityId: entityId } : null;
    };

    return {
        hand: saveEquippedSlot(equipped.hand),
        body: saveEquippedSlot(equipped.body),
        tool1: saveEquippedSlot(equipped.tool1),
        tool2: saveEquippedSlot(equipped.tool2),
        backpack: saveEquippedSlot(equipped.backpack)
    };
}

function deserializeEquipment(world, player, data) {
    const equipped = player.getComponent('EquippedItemsComponent');
    if (!equipped) return;

    // Note: This is a simplified restoration that just stores the entity IDs
    // For full implementation, items should be recreated from INTERACTABLE_DATA or lookup by ID
    equipped.hand = data.hand ? data.hand.entityId : null;
    equipped.body = data.body ? data.body.entityId : null;
    equipped.tool1 = data.tool1 ? data.tool1.entityId : null;
    equipped.tool2 = data.tool2 ? data.tool2.entityId : null;
    equipped.backpack = data.backpack ? data.backpack.entityId : null;

    console.log('Equipment references restored (entities may need recreation)');
}

function serializeSkills(world, player) {
    const skills = player.getComponent('SkillsComponent');
    if (!skills) return {};

    return {
        medical: skills.medical,
        cooking: skills.cooking,
        farming: skills.farming,
        repair: skills.repair
    };
}

function deserializeSkills(world, player, data) {
    const skills = player.getComponent('SkillsComponent');
    if (!skills) return;

    skills.medical = data.medical || 0;
    skills.cooking = data.cooking || 0;
    skills.farming = data.farming || 0;
    skills.repair = data.repair || 0;
}

function serializeShipResources(world) {
    const shipEntities = world.query(['ShipComponent']);
    if (shipEntities.length === 0) return { water: 100, fuel: 100 };

    const ship = shipEntities[0].getComponent('ShipComponent');
    return {
        water: ship.water,
        fuel: ship.fuel,
        maxWater: ship.maxWater,
        maxFuel: ship.maxFuel
    };
}

function deserializeShipResources(world, data) {
    const shipEntities = world.query(['ShipComponent']);
    if (shipEntities.length === 0) return;

    const ship = shipEntities[0].getComponent('ShipComponent');
    ship.water = data.water;
    ship.fuel = data.fuel;
    if (data.maxWater) ship.maxWater = data.maxWater;
    if (data.maxFuel) ship.maxFuel = data.maxFuel;
}

function serializeTime(world, player) {
    const timeComponent = player.getComponent('TimeComponent');
    if (!timeComponent) return { day: 1, hours: 0, minutes: 0, totalMinutes: 0 };

    return {
        day: timeComponent.day,
        hours: timeComponent.hours,
        minutes: timeComponent.minutes,
        totalMinutes: timeComponent.totalMinutes,
        lastDayOnShip: timeComponent.lastDayOnShip
    };
}

function deserializeTime(world, player, data) {
    const timeComponent = player.getComponent('TimeComponent');
    if (!timeComponent) return;

    timeComponent.day = data.day;
    timeComponent.hours = data.hours;
    timeComponent.minutes = data.minutes;
    timeComponent.totalMinutes = data.totalMinutes;
    if (data.lastDayOnShip !== undefined) {
        timeComponent.lastDayOnShip = data.lastDayOnShip;
    }
}
