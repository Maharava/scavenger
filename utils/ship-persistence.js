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
        head: bodyParts ? bodyParts.head : 100,
        torso: bodyParts ? bodyParts.torso : 100,
        limbs: bodyParts ? bodyParts.limbs : 100
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
    if (bodyParts) {
        bodyParts.head = data.head;
        bodyParts.torso = data.torso;
        bodyParts.limbs = data.limbs;
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

        // Save item by its definition ID (for stackable) or full data (for modular equipment)
        items.push({
            key: itemKey,
            name: itemComponent.name,
            quantity: itemData.quantity,
            // TODO: For modular equipment, also save attached parts
        });
    }

    return { items, capacity: inventory.capacity, maxWeight: inventory.maxWeight };
}

function deserializeInventory(world, player, data) {
    const inventory = player.getComponent('InventoryComponent');
    if (!inventory) return;

    inventory.items.clear();
    inventory.capacity = data.capacity;
    inventory.maxWeight = data.maxWeight;

    // TODO: Recreate inventory items from saved data
    // This is a simplified version - full implementation would recreate entities
    console.log('Inventory deserialization not fully implemented yet');
}

function serializeEquipment(world, player) {
    const equipped = player.getComponent('EquippedItemsComponent');
    if (!equipped) return { hand: null, body: null, tool1: null, tool2: null, backpack: null };

    // TODO: Save equipped item IDs and their configurations
    return {
        hand: equipped.hand,
        body: equipped.body,
        tool1: equipped.tool1,
        tool2: equipped.tool2,
        backpack: equipped.backpack
    };
}

function deserializeEquipment(world, player, data) {
    const equipped = player.getComponent('EquippedItemsComponent');
    if (!equipped) return;

    // TODO: Recreate equipped items from saved IDs
    console.log('Equipment deserialization not fully implemented yet');
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
    const shipEntities = world.query(['ShipResourcesComponent']);
    if (shipEntities.length === 0) return { water: 1000, fuel: 100 };

    const resources = shipEntities[0].getComponent('ShipResourcesComponent');
    return {
        water: resources.water,
        fuel: resources.fuel
    };
}

function deserializeShipResources(world, data) {
    const shipEntities = world.query(['ShipResourcesComponent']);
    if (shipEntities.length === 0) return;

    const resources = shipEntities[0].getComponent('ShipResourcesComponent');
    resources.water = data.water;
    resources.fuel = data.fuel;
}

function serializeTime(world, player) {
    const timeComponent = player.getComponent('TimeComponent');
    if (!timeComponent) return { day: 1, hour: 8, minute: 0 };

    return {
        day: timeComponent.day,
        hour: timeComponent.hour,
        minute: timeComponent.minute
    };
}

function deserializeTime(world, player, data) {
    const timeComponent = player.getComponent('TimeComponent');
    if (!timeComponent) return;

    timeComponent.day = data.day;
    timeComponent.hour = data.hour;
    timeComponent.minute = data.minute;
}
