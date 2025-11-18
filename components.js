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
        this.parts.set(partName, Math.max(0, Math.min(100, value)));
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
    addPart(partName, efficiency = 100) {
        this.parts.set(partName, Math.max(0, Math.min(100, efficiency)));
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
        this.items = new Map(); // Map<itemName, { entityId: number, quantity: number }>
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

    // Calculate total weight from all items in inventory AND equipped items
    getTotalWeight(world) {
        let totalWeight = 0;

        // Weight from inventory items
        for (const [itemName, itemData] of this.items) {
            const itemEntity = world.getEntity(itemData.entityId);
            if (itemEntity) {
                const itemComponent = itemEntity.getComponent('ItemComponent');
                if (itemComponent) {
                    totalWeight += itemComponent.weight * itemData.quantity;
                }
            }
        }

        // Weight from equipped items
        const player = world.query(['PlayerComponent'])[0];
        if (player) {
            const equipped = player.getComponent('EquippedItemsComponent');
            if (equipped) {
                [equipped.hand, equipped.body].forEach(equipmentId => {
                    if (equipmentId) {
                        const equipment = world.getEntity(equipmentId);
                        if (equipment) {
                            const itemComponent = equipment.getComponent('ItemComponent');
                            if (itemComponent) {
                                // Equipped items weigh nothing (encourages equipping over carrying)
                                // totalWeight += itemComponent.weight * 0;

                                // Add weight of attached parts (also free when equipped)
                                const attachmentSlots = equipment.getComponent('AttachmentSlotsComponent');
                                if (attachmentSlots) {
                                    for (const slotData of Object.values(attachmentSlots.slots)) {
                                        if (slotData.entity_id) {
                                            const part = world.getEntity(slotData.entity_id);
                                            if (part) {
                                                const partItem = part.getComponent('ItemComponent');
                                                if (partItem) {
                                                    // totalWeight += partItem.weight * 0;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                });
            }
        }

        return totalWeight;
    }

    // Check if an item can be added to inventory
    canAddItem(world, itemEntity, itemCount = 1) {
        const itemComponent = itemEntity.getComponent('ItemComponent');
        if (!itemComponent) return false;

        const newWeight = this.getTotalWeight(world) + (itemComponent.weight * itemCount);
        const newSlots = this.getTotalSlotsUsed(world) + (itemComponent.slots * itemCount);

        return newWeight <= this.maxWeight && newSlots <= this.capacity;
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

class WearableComponent {
    constructor(slot) {
        this.slot = slot; // e.g., 'back'
    }
}

class ThrowableComponent {
    constructor(effect, range) {
        this.effect = effect; // e.g., 'EXPLODE'
        this.range = range;
    }
}

class KeyComponent {
    constructor(keyId) {
        this.keyId = keyId; // e.g., 'CRYOBAY_7'
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
        return Math.max(0, Math.min(100, 100 - durabilityPercent));
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

class NameComponent {
    constructor(name) {
        this.name = name;
    }
}

class EquippedItemsComponent {
    constructor() {
        this.hand = null; // Entity ID of equipped weapon
        this.body = null; // Entity ID of equipped armour
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

