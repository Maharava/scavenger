// General helper functions used throughout the game

// Helper function to close the top-level menu
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
