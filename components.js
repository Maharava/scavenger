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
    constructor(name, description = '') {
        this.name = name;
        this.description = description;
    }
}

class InventoryComponent {
    constructor(capacity = 10) {
        this.capacity = capacity;
        this.items = new Map(); // Map<itemName, { entityId: number, quantity: number }>
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

