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

class CreatureStatsComponent {
    constructor(initialHunger = 100) {
        this.head = 100;
        this.chest = 100;
        this.left_arm = 100;
        this.right_arm = 100;
        this.left_leg = 100;
        this.right_leg = 100;
        this.hunger = initialHunger;
        this.rest = 100;
        this.stress = 0;
    }
}

class InteractableComponent {
    constructor(script, scriptArgs) {
        this.script = script;
        this.scriptArgs = scriptArgs;
    }
}

class ItemComponent {
    constructor(name, description = '', weight = 0) {
        this.name = name;
        this.description = description;
        this.weight = weight; // Weight in grams
    }
}

class InventoryComponent {
    constructor(capacity = 4, maxWeight = 3000) {
        this.capacity = capacity; // Number of inventory slots
        this.maxWeight = maxWeight; // Max weight in grams
        this.currentWeight = 0; // Current carried weight in grams
        this.items = new Map(); // Map<itemName, { entityId: number, quantity: number }>
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
                                totalWeight += itemComponent.weight;

                                // Add weight of attached parts
                                const attachmentSlots = equipment.getComponent('AttachmentSlotsComponent');
                                if (attachmentSlots) {
                                    for (const slotData of Object.values(attachmentSlots.slots)) {
                                        if (slotData.entity_id) {
                                            const part = world.getEntity(slotData.entity_id);
                                            if (part) {
                                                const partItem = part.getComponent('ItemComponent');
                                                if (partItem) {
                                                    totalWeight += partItem.weight;
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
    canAddItem(world, itemWeight, itemCount = 1) {
        const newWeight = this.getTotalWeight(world) + (itemWeight * itemCount);
        return newWeight <= this.maxWeight;
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
    constructor(title, options, interactable) {
        this.title = title;
        this.options = options;
        this.interactable = interactable; // The entity that opened the menu
        this.selectedIndex = 0;
        this.submenu = null; // For side-by-side submenus
        this.submenuSelectedIndex = 0;
        this.activeMenu = 'main'; // 'main' or 'submenu'
        this.highlightedModule = null; // Entity ID of currently highlighted module (for info display)
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
        this.body = null; // Entity ID of equipped armor
    }
}

