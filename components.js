// This file contains all component definitions for the ECS.
// Components are simple data containers.

class PositionComponent {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class RenderableComponent {
    constructor(char, colour, layer = 1) {
        this.char = char;
        this.colour = colour;
        this.layer = layer; // e.g., 0 for scenery, 1 for items, 2 for creatures
    }
}

class SolidComponent {} // A "tag" component for collision

class PlayerComponent {} // A "tag" component to identify the player

// Body Parts Component - Manages body parts for creatures (player and enemies)
class BodyPartsComponent {
    constructor() {
        // Map of body part name to efficiency value (0-100)
        // 100 = full efficiency, 0 = destroyed/missing
        // Simplified to 3 zones for clarity, but system supports adding/removing parts
        // for mutations, aliens, etc.
        this.parts = new Map([
            ['head', 100],
            ['torso', 100],
            ['limbs', 100]
        ]);
    }

    // Get efficiency of a body part (returns 0 if part doesn't exist)
    getPart(partName) {
        return this.parts.get(partName) || 0;
    }

    // Set efficiency of a body part
    setPart(partName, value) {
        this.parts.set(partName, Math.max(MIN_STAT_VALUE, Math.min(MAX_STAT_VALUE, value)));
    }

    // Damage a body part by a certain amount
    damage(partName, amount) {
        if (this.parts.has(partName)) {
            const current = this.parts.get(partName);
            this.setPart(partName, current - amount);
        }
    }

    // Heal a body part by a certain amount
    heal(partName, amount) {
        if (this.parts.has(partName)) {
            const current = this.parts.get(partName);
            this.setPart(partName, current + amount);
        }
    }

    // Add a new body part
    addPart(partName, efficiency = MAX_STAT_VALUE) {
        this.parts.set(partName, Math.max(MIN_STAT_VALUE, Math.min(MAX_STAT_VALUE, efficiency)));
    }

    // Remove a body part (sets efficiency to 0)
    removePart(partName) {
        if (this.parts.has(partName)) {
            this.parts.set(partName, 0);
        }
    }

    // Get all parts that are below 100% efficiency
    getDamagedParts() {
        const damaged = [];
        for (const [name, efficiency] of this.parts) {
            if (efficiency < 100) {
                damaged.push({ name, efficiency });
            }
        }
        return damaged;
    }

    // Get all parts
    getAllParts() {
        return Array.from(this.parts.entries()).map(([name, efficiency]) => ({ name, efficiency }));
    }
}

class CreatureStatsComponent {
    constructor(initialHunger = 100) {
        this.hunger = initialHunger;
        this.rest = 100;
        this.stress = 0;
        this.comfort = 50; // Base comfort is 50
        // Temperature comfort range (in Celsius)
        this.baseMinComfortTemp = 10; // Base minimum comfortable temperature
        this.baseMaxComfortTemp = 30; // Base maximum comfortable temperature
    }

    // Get effective comfortable temperature range (modified by equipment)
    getComfortTempRange(tempModMin = 0, tempModMax = 0) {
        return {
            min: this.baseMinComfortTemp - tempModMin,
            max: this.baseMaxComfortTemp + tempModMax
        };
    }
}

// Comfort Modifiers Component - Tracks over-time comfort effects
class ComfortModifiersComponent {
    constructor() {
        this.modifiers = []; // Array of { id, amount, duration, elapsed }
        this.nextId = 0;
    }

    // Add a new comfort modifier
    addModifier(amount, duration) {
        const id = this.nextId++;
        this.modifiers.push({
            id: id,
            amount: amount, // +/- comfort per application
            duration: duration, // Total duration in seconds
            elapsed: 0 // Time elapsed in seconds
        });
        return id;
    }

    // Remove a modifier by ID
    removeModifier(id) {
        this.modifiers = this.modifiers.filter(m => m.id !== id);
    }

    // Update modifiers - call this every tick (elapsed time in seconds)
    updateModifiers(deltaTime) {
        const toRemove = [];
        for (const modifier of this.modifiers) {
            modifier.elapsed += deltaTime;
            if (modifier.elapsed >= modifier.duration) {
                toRemove.push(modifier.id);
            }
        }
        // Remove expired modifiers
        for (const id of toRemove) {
            this.removeModifier(id);
        }
    }

    // Get total comfort modifier amount
    getTotalModifier() {
        return this.modifiers.reduce((sum, m) => sum + m.amount, 0);
    }

    // Get all active modifiers (for debugging/display)
    getActiveModifiers() {
        return this.modifiers.map(m => ({
            amount: m.amount,
            remaining: m.duration - m.elapsed
        }));
    }
}

class InteractableComponent {
    constructor(script, scriptArgs) {
        this.script = script;
        this.scriptArgs = scriptArgs;
    }
}

class ItemComponent {
    constructor(name, description = '', weight = 0, slots = 1.0) {
        this.name = name;
        this.description = description;
        this.weight = weight; // Weight in grams
        this.slots = slots; // Number of inventory slots (modules = 0.5, regular items = 1.0)
    }
}

class InventoryComponent {
    constructor(capacity = 4, maxWeight = 3000) {
        this.capacity = capacity; // Number of inventory slots
        this.maxWeight = maxWeight; // Max weight in grams
        this.currentWeight = 0; // Current carried weight in grams
        // Map<string | number, { entityId: number, quantity: number }>
        // Key is itemName (string) for stackable items, entityId (number) for non-stackable items
        this.items = new Map();
    }

    // Calculate total slots used in inventory
    getTotalSlotsUsed(world) {
        let totalSlots = 0;
        for (const [itemName, itemData] of this.items) {
            const itemEntity = world.getEntity(itemData.entityId);
            if (itemEntity) {
                const itemComponent = itemEntity.getComponent('ItemComponent');
                if (itemComponent) {
                    totalSlots += itemComponent.slots * itemData.quantity;
                }
            }
        }
        return totalSlots;
    }

    // Calculate total weight from inventory and equipped items
    getTotalWeight(world) {
        let totalWeight = 0;

        // Weight from inventory items
        for (const [itemName, itemData] of this.items) {
            const itemEntity = world.getEntity(itemData.entityId);
            if (itemEntity) {
                const equipmentWeight = calculateEquipmentWeight(world, itemEntity);
                totalWeight += equipmentWeight * itemData.quantity;
            }
        }

        // Weight from equipped items
        const player = world.query(['PlayerComponent'])[0];
        if (player) {
            const equipped = player.getComponent('EquippedItemsComponent');
            if (equipped) {
                // Hand slot: Guns retain full weight
                if (equipped.hand) {
                    const handEquipment = world.getEntity(equipped.hand);
                    if (handEquipment) {
                        const equipmentWeight = calculateEquipmentWeight(world, handEquipment);
                        totalWeight += equipmentWeight;
                    }
                }

                // Body slot: Armor is weightless
                if (equipped.body) {
                    // totalWeight += 0;
                }

                // Tool slots: Tools are 50% weight
                if (equipped.tool1) {
                    const tool1Equipment = world.getEntity(equipped.tool1);
                    if (tool1Equipment) {
                        const equipmentWeight = calculateEquipmentWeight(world, tool1Equipment);
                        totalWeight += equipmentWeight * 0.5;
                    }
                }
                if (equipped.tool2) {
                    const tool2Equipment = world.getEntity(equipped.tool2);
                    if (tool2Equipment) {
                        const equipmentWeight = calculateEquipmentWeight(world, tool2Equipment);
                        totalWeight += equipmentWeight * 0.5;
                    }
                }
            }
        }

        return totalWeight;
    }

    // Check if an item can be added to inventory
    canAddItem(world, itemEntity, itemCount = 1) {
        const itemComponent = itemEntity.getComponent('ItemComponent');
        if (!itemComponent) return false;

        const equipmentWeight = calculateEquipmentWeight(world, itemEntity);
        const newWeight = this.getTotalWeight(world) + (equipmentWeight * itemCount);
        const newSlots = this.getTotalSlotsUsed(world) + (itemComponent.slots * itemCount);

        // Hard limit: 4500g (150% of maxWeight)
        const HARD_WEIGHT_LIMIT = this.maxWeight * 1.5;

        return newWeight <= HARD_WEIGHT_LIMIT && newSlots <= this.capacity;
    }
}

class ActionComponent {
    constructor(name, payload = {}) {
        this.name = name;
        this.payload = payload;
    }
}

// --- Item & Equipment Components ---

class StackableComponent {
    constructor(quantity = 1, stackLimit = 99) {
        this.quantity = quantity;
        this.stackLimit = stackLimit;
    }
}

class ConsumableComponent {
    constructor(effect, value) {
        this.effect = effect; // e.g., 'HEAL_HP'
        this.value = value;
    }
}

class EquipmentComponent {
    constructor(slot) {
        this.slot = slot; // e.g., 'hand', 'body'
    }
}

// --- Modular Equipment Components ---

class AttachmentSlotsComponent {
    constructor(slots = {}) {
        // e.g., { chamber: { accepted_type: 'chamber', entity_id: null } }
        this.slots = slots;
    }
}

class GunComponent {
    constructor(type) {
        this.type = type; // e.g., 'rifle', 'pistol'
    }
}

class ArmourComponent {
    constructor(type) {
        this.type = type; // e.g., 'chest_plate', 'helmet'
    }
}

// Armor Stats Component - Tracks armor performance and condition
class ArmourStatsComponent {
    constructor(maxDurability = 100) {
        this.durability = maxDurability; // Current durability
        this.maxDurability = maxDurability; // Maximum durability
        // Damage type resistances (0-100, percentage reduction)
        this.resistances = {
            kinetic: 0,
            energy: 0,
            toxin: 0,
            radiation: 0
        };
        // Temperature comfort modifiers
        this.tempMax = 0; // Increases maximum comfortable temperature
        this.tempMin = 0; // Decreases minimum comfortable temperature (use positive values)
    }

    // Get durability as percentage of max
    getDurabilityPercent() {
        return (this.durability / this.maxDurability) * 100;
    }

    // Apply damage to armor durability
    applyDamage(amount) {
        this.durability = Math.max(0, this.durability - amount);
    }

    // Repair armor
    repair(amount) {
        this.durability = Math.min(this.maxDurability, this.durability + amount);
    }

    // Calculate damage passthrough chance based on durability
    // Lower durability = higher chance of damage passing through
    getPassthroughChance() {
        const durabilityPercent = this.getDurabilityPercent();
        // 100% durability = 0% passthrough
        // 0% durability = 100% passthrough
        return Math.max(MIN_STAT_VALUE, Math.min(MAX_STAT_VALUE, MAX_STAT_VALUE - durabilityPercent));
    }
}

// Gun Stats Component - Tracks weapon performance stats
class GunStatsComponent {
    constructor() {
        // Damage stats (from chamber)
        this.damageType = 'kinetic'; // kinetic, energy, toxin, radiation
        this.damageAmount = 10; // Base damage
        this.penetration = 1.0; // Base penetration multiplier (affects enemy armor)

        // Accuracy (base 70%, modified by barrel and grip)
        this.accuracy = 70; // Hit chance percentage (0-100)

        // Range (from barrel, in tiles)
        this.range = 5; // Effective range in tiles

        // Comfort penalty (from grip, applied when fired)
        this.comfortPenalty = -2; // Applied to wielder's comfort when gun is fired
    }

    // Calculate effective penetration against armor
    // penetration < 1.0 = armor more effective (resistance increased)
    // penetration > 1.0 = armor less effective (resistance decreased)
    getEffectivePenetration(armorResistance) {
        // Penetration 0.8 with 50% armor = 50 * (1/0.8) = 62.5% effective armor
        // Penetration 1.2 with 50% armor = 50 * (1/1.2) = 41.7% effective armor
        return armorResistance / this.penetration;
    }
}

class PartComponent {
    constructor(part_type) {
        this.part_type = part_type; // e.g., 'barrel', 'grip'
    }
}

// --- Stat & Bonus Components ---

class StatModifierComponent {
    constructor(modifiers = {}) {
        // e.g., { accuracy: 10, damage: 5 }
        this.modifiers = modifiers;
    }
}

// --- UI Components ---

class MenuComponent {
    constructor(title, options, interactable, menuType = 'inventory') {
        this.title = title;
        this.options = options;
        this.interactable = interactable; // The entity that opened the menu
        this.selectedIndex = 0;
        this.submenu1 = null; // First level submenu
        this.submenu1SelectedIndex = 0;
        this.submenu2 = null; // Second level submenu
        this.submenu2SelectedIndex = 0;
        this.activeMenu = 'main'; // 'main', 'submenu1', or 'submenu2'
        this.detailsPane = null; // { title, lines: [...] } for details display
        this.menuType = menuType; // 'inventory' or 'workbench'
    }
}

class MessageComponent {
    constructor(text, colour = 'white') {
        this.text = text;
        this.colour = colour;
    }
}

// Visual projectile for bullet animations
class ProjectileComponent {
    constructor(fromX, fromY, toX, toY, char = '•', colour = '#ff0', speed = 20) {
        this.fromX = fromX;
        this.fromY = fromY;
        this.toX = toX;
        this.toY = toY;
        this.currentX = fromX;
        this.currentY = fromY;
        this.char = char;
        this.colour = colour;
        this.speed = speed;  // Tiles per second
        this.progress = 0;   // 0 to 1
        this.lifetime = 0;   // Total time alive
    }
}

class NameComponent {
    constructor(name) {
        this.name = name;
    }
}

class EquippedItemsComponent {
    constructor() {
        this.hand = null; // Entity ID of equipped weapon
        this.body = null; // Entity ID of equipped armour
        this.tool1 = null; // Entity ID of first tool
        this.tool2 = null; // Entity ID of second tool
        this.backpack = null; // Entity ID of equipped backpack
    }
}

// --- TOOL COMPONENTS ---

class ToolComponent {
    constructor(toolType, usesRemaining = -1) {
        this.toolType = toolType;           // 'light', 'scanner', 'cutter', 'medkit', etc.
        this.usesRemaining = usesRemaining; // -1 = infinite, 0+ = limited uses
    }
}

class ToolStatsComponent {
    constructor(stats = {}) {
        this.lightRadius = stats.lightRadius || 0;      // Light emission (0 = none)
        this.scanRange = stats.scanRange || 0;          // Scanner detection range
        this.effectiveness = stats.effectiveness || 0;  // Tool power (100 = max)
        this.specialAbility = stats.specialAbility || null;  // Unique ability ID
    }
}

// --- LIGHTING COMPONENTS ---

class LightSourceComponent {
    constructor(radius = 0, active = true) {
        this.radius = radius;    // Light radius in tiles
        this.active = active;    // Can be toggled on/off
    }
}

class VisibilityStateComponent {
    constructor() {
        this.state = 'never_seen';  // 'never_seen', 'revealed', 'lit'
    }
}

class MapLightingComponent {
    constructor(enabled = true) {
        this.enabled = enabled;  // If false, entire map is lit (ship)
    }
}

// --- COMBAT COMPONENTS ---

// Marks an entity as being in combat
class CombatStateComponent {
    constructor(combatSessionId) {
        this.combatSessionId = combatSessionId;  // ID of active combat session
        this.inCombat = true;                    // Quick check flag
    }
}

// Tracks turn state and combat modifiers for a combatant
class CombatantComponent {
    constructor(movementPerTurn = 4) {
        this.movementPerTurn = movementPerTurn;  // Tiles per turn (base 4)
        this.initiativeRoll = 0;                  // Movement + 1d6
        this.hasActedThisTurn = false;            // True if completed action
        this.hasMovedThisTurn = false;            // True if moved
        this.movementUsed = 0;                    // Tiles moved this turn
        this.stunned = false;                     // Skip next turn
        this.bleeding = false;                    // Take damage per turn
        this.infected = 0;                        // Turns remaining of infection
    }
}

// Global combat session manager (attached to world entity)
class CombatSessionComponent {
    constructor(sessionId, playerInitiated = false) {
        this.sessionId = sessionId;               // Unique combat ID
        this.participants = [];                   // [entityId, entityId, ...]
        this.turnOrder = [];                      // Sorted participant IDs
        this.activeIndex = 0;                     // Current turn index
        this.round = 1;                           // Combat round number
        this.selectedEnemyId = null;              // Currently selected target for shooting
        this.playerInitiated = playerInitiated;   // True if player started combat (first strike bonus)
        this.firstStrikeBonusUsed = false;        // Track if first strike bonus already applied
        this.state = 'active';                    // 'starting', 'active', 'ending'
    }

    getActiveCombatant() {
        return this.turnOrder[this.activeIndex];
    }

    advanceTurn() {
        this.activeIndex++;
        if (this.activeIndex >= this.turnOrder.length) {
            this.activeIndex = 0;
            this.round++;
        }
    }
}

// Damage event for resolution
class DamageEventComponent {
    constructor(sourceId, targetId, amount, damageType, bodyPart = null) {
        this.sourceId = sourceId;                 // Attacker entity ID
        this.targetId = targetId;                 // Target entity ID
        this.amount = amount;                     // Raw damage value
        this.damageType = damageType;             // 'kinetic', 'energy', 'toxin', 'radiation'
        this.bodyPart = bodyPart;                 // Target body part or null (auto-roll)
        this.timestamp = Date.now();              // For event ordering
    }
}

// Enemy AI configuration
class AIComponent {
    constructor(behaviorType = 'aggressive', detectionRange = 8) {
        this.behaviorType = behaviorType;         // 'aggressive', 'defensive', 'passive', 'fleeing'
        this.detectionRange = detectionRange;     // Tiles (line-of-sight required)
        this.state = 'idle';                      // 'idle', 'patrolling', 'combat', 'fleeing'
        this.target = null;                       // Target entity ID
        this.morale = 100;                        // For humanoid enemies (flee at <30)
    }
}

// --- UTILITY CLASSES ---

// Body Part Hit Distribution
// Provides weighted random selection of body parts for damage
class BodyPartHitTable {
    constructor() {
        // Hit weights for each body part (higher = more likely to be hit)
        // Dynamically built based on creature's actual body parts
        // Simplified 3-zone system:
        // - head: 10% (critical but small target)
        // - torso: 50% (largest target, center mass)
        // - limbs: 40% (arms and legs combined)
        this.defaultWeights = {
            head: 10,
            torso: 50,
            limbs: 40
        };
    }

    // Get a random body part based on weights
    // Only considers parts that exist on the creature
    getRandomHitPart(bodyPartsComponent) {
        const weights = [];
        const parts = [];

        // Build weighted array based on existing parts
        for (const [partName, efficiency] of bodyPartsComponent.parts) {
            // Only include parts that exist (efficiency > 0 means it exists)
            // Missing/destroyed parts have 0 efficiency
            if (efficiency > 0 || efficiency === 0) { // Include all parts from the component
                const weight = this.defaultWeights[partName] || 10; // Default to 10 if not in table
                parts.push(partName);
                weights.push(weight);
            }
        }

        if (parts.length === 0) {
            return null; // No valid parts
        }

        // Calculate total weight
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);

        // Random selection
        let random = Math.random() * totalWeight;

        for (let i = 0; i < parts.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return parts[i];
            }
        }

        // Fallback (shouldn't reach here)
        return parts[parts.length - 1];
    }

    // Modify hit weights (e.g., for crouching reducing head hits)
    getModifiedWeights(baseWeights, modifiers = {}) {
        const modified = { ...baseWeights };
        for (const [part, modifier] of Object.entries(modifiers)) {
            if (modified[part]) {
                modified[part] = Math.max(0, modified[part] + modifier);
            }
        }
        return modified;
    }
}

// Ship Component - Manages ship resources (Water and Fuel)
class ShipComponent {
    constructor(maxWater = 100, maxFuel = 100) {
        this.water = maxWater;
        this.maxWater = maxWater;
        this.fuel = maxFuel;
        this.maxFuel = maxFuel;
    }

    // Get water percentage (0-100)
    getWaterPercent() {
        return (this.water / this.maxWater) * 100;
    }

    // Get fuel percentage (0-100)
    getFuelPercent() {
        return (this.fuel / this.maxFuel) * 100;
    }

    // Consume water (returns true if successful, false if not enough)
    consumeWater(amount) {
        if (this.water >= amount) {
            this.water = Math.max(0, this.water - amount);
            return true;
        }
        return false;
    }

    // Consume fuel (returns true if successful, false if not enough)
    consumeFuel(amount) {
        if (this.fuel >= amount) {
            this.fuel = Math.max(0, this.fuel - amount);
            return true;
        }
        return false;
    }

    // Add water (e.g., from refilling)
    addWater(amount) {
        this.water = Math.min(this.maxWater, this.water + amount);
    }

    // Add fuel (e.g., from refilling)
    addFuel(amount) {
        this.fuel = Math.min(this.maxFuel, this.fuel + amount);
    }
}

// Time Component - Tracks game time in 24-hour format
class TimeComponent {
    constructor(hours = 0, minutes = 0) {
        this.hours = hours;       // 0-23
        this.minutes = minutes;   // 0-59
        this.totalMinutes = hours * 60 + minutes; // Total minutes since start
        this.isSleeping = false;  // Flag to indicate if player is sleeping
        this.sleepEndTime = null; // Time when sleep will end (in total minutes)
    }

    // Add minutes to the current time
    addMinutes(minutesToAdd) {
        this.totalMinutes += minutesToAdd;
        this.minutes = this.totalMinutes % 60;
        this.hours = Math.floor(this.totalMinutes / 60) % 24;
    }

    // Get time as a formatted string (e.g., "0845" or "2130")
    getFormattedTime() {
        const h = String(this.hours).padStart(2, '0');
        const m = String(this.minutes).padStart(2, '0');
        return h + m;
    }

    // Get time in total minutes
    getTotalMinutes() {
        return this.totalMinutes;
    }

    // Start sleeping for a duration (in game minutes)
    startSleep(durationMinutes) {
        this.isSleeping = true;
        this.sleepEndTime = this.totalMinutes + durationMinutes;
    }

    // Check if sleep is complete
    checkSleepComplete() {
        if (this.isSleeping && this.totalMinutes >= this.sleepEndTime) {
            this.isSleeping = false;
            this.sleepEndTime = null;
            return true; // Sleep complete
        }
        return false;
    }
}

// Facing Component - Tracks which direction the player is facing
// Used for directional interactions (e.g., activating objects in front)
class FacingComponent {
    constructor(direction = 'down') {
        // Direction can be: 'up', 'down', 'left', 'right'
        this.direction = direction;
    }

    // Get the offset for the current facing direction
    getOffset() {
        switch (this.direction) {
            case 'up': return { dx: 0, dy: -1 };
            case 'down': return { dx: 0, dy: 1 };
            case 'left': return { dx: -1, dy: 0 };
            case 'right': return { dx: 1, dy: 0 };
            default: return { dx: 0, dy: 0 };
        }
    }

    // Set facing direction from movement input
    setFromMovement(dx, dy) {
        if (dy < 0) this.direction = 'up';
        else if (dy > 0) this.direction = 'down';
        else if (dx < 0) this.direction = 'left';
        else if (dx > 0) this.direction = 'right';
    }
}

// In components.js
class SkillsComponent {
    constructor() {
        this.medical = 0;
        this.cooking = 0;
        this.farming = 0;
        this.repair = 0;

        // Track daily/action-based triggers
        this.triggers = {
            hasHealedToday: false,
            hasCookedToday: false,
            harvestsToday: 0,
            repairsToday: 0,
            lastLevelUpDay: { // Prevent multiple levelups in one day
                farming: -1,
                repair: -1
            }
        };
    }
}