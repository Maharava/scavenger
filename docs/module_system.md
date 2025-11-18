# Module System Guide

This document provides a comprehensive guide to the module swapping system in Scavenger.

## Overview

The module system allows players to customize their equipment (guns and armor) by swapping out individual components. Each piece of modular equipment has several attachment slots, and each slot accepts specific types of modules. Modules can provide stat bonuses, penalties, or be purely cosmetic.

## Key Concepts

### Modular Equipment

Equipment items that support module attachment have an `AttachmentSlotsComponent`. Currently, two types of equipment are modular:

1. **Guns** (e.g., Rusty Pistol)
   - Required slots: barrel, grip, chamber
   - Optional slots: mod1, mod2

2. **Armor** (e.g., Scrap Armor)
   - Required slots: underlay, material, overlay
   - Optional slots: mod1, mod2

### Modules (Parts)

Modules are items with a `PartComponent` that defines their `part_type`. They can be:
- Stored in the player's inventory (consuming 0.5 inventory slots each)
- Installed in compatible equipment slots
- Moved between equipment and inventory at workbenches

Modules can also have a `StatModifierComponent` that applies bonuses or penalties to player stats when the equipment is equipped.

**Important**: All modules/parts consume only 0.5 inventory slots instead of the standard 1.0, allowing you to carry more modular components efficiently.

## Using the Workbench

### Accessing the Workbench

1. Stand adjacent to a workbench interactable (marked as 'W' on the map)
2. Press **Space** to activate it
3. The workbench menu will open, showing all modular equipment (both equipped and in inventory)

### Viewing Equipment Modules

1. In the workbench menu, select a piece of equipment (e.g., "Hand: Rusty Pistol")
2. Press **Space** to view its modules
3. A list of all module slots will appear, showing:
   - Slot name (e.g., "barrel", "grip")
   - Currently installed module name (or "Empty" if no module is installed)
   - "(REQUIRED)" indicator for slots that must have a module for the equipment to be equippable

### Swapping Modules

1. From the equipment modules list, select a slot you want to modify
2. Press **Space** to open the swap menu
3. You'll see options to:
   - **Remove [Module Name]**: Takes the current module out and puts it in your inventory (if one is installed)
   - **Install [Module Name]**: Installs a compatible module from your inventory
4. Select your desired action and press **Space**
5. The module will be swapped, and you'll return to the modules view
6. A message will confirm the action (e.g., "Installed Basic Barrel!" or "Removed Rubber Grip!")

### Module Information Display

When navigating through menus, if a module is highlighted, an information box appears above the menu showing:
- **Module Name** (in yellow)
- **Description** (in gray) - what the module is and any flavor text
- **Stat Modifiers** (in green) - any bonuses or penalties the module provides (e.g., "hunger: +5")

This information box appears in three contexts:
1. When browsing modules in the workbench
2. When viewing modules in the inspect menu (press 'I' for inventory, select equipment with modules, choose "Inspect")
3. When selecting module parts in your inventory

## Module Types and Variants

### Gun Modules

#### Grips
- **Basic Grip**: A standard grip with no special features (35g)
- **Compact Grip**: A smaller, lighter grip for better portability (25g)
- **Ergonomic Grip**: A comfortable grip designed for extended use (40g)
- **Textured Grip**: A grip with textured surface for improved handling (38g)

#### Chambers
- **Basic Chamber**: A standard chamber with no special features (75g)
- **Reinforced Chamber**: A reinforced chamber built for durability (90g)
- **Lightweight Chamber**: A lighter chamber made from advanced materials (60g)
- **Precision Chamber**: A precisely machined chamber for consistent performance (85g)

#### Barrels
- **Basic Barrel**: A standard barrel with no special features (95g)
- **Long Barrel**: An extended barrel for improved range (120g)
- **Compact Barrel**: A shorter barrel for better maneuverability (75g)
- **Rifled Barrel**: A barrel with rifling for improved accuracy (105g)

### Armor Modules

#### Underlays
- **Basic Underlay**: A standard underlay with no special features (100g)
- **Padded Underlay**: A padded underlay for additional comfort (140g)
- **Mesh Underlay**: A breathable mesh underlay for ventilation (70g)
- **Thermal Underlay**: An insulated underlay for temperature regulation (110g)

#### Materials
- **Basic Material**: A standard material with no special features (600g)
- **Composite Material**: A composite material balancing protection and weight (550g)
- **Ceramic Material**: A ceramic material offering solid protection (700g)
- **Polymer Material**: A lightweight polymer material (450g)

#### Overlays
- **Basic Overlay**: A standard overlay with no special features (180g)
- **Reflective Overlay**: A reflective overlay for improved visibility (160g)
- **Ablative Overlay**: An ablative overlay designed to dissipate damage (220g)
- **Camouflage Overlay**: A camouflage overlay for concealment (170g)

### Optional Mods

These can be installed in any "mod" slot on guns or armor:
- **Range Finder**: A small range-finding device (50g) - Test modifier: hunger +2
- **Grip Warmer**: Keeps your grip warm in cold environments (25g) - Test modifier: hunger +1
- **Heating Element**: Provides warmth in cold environments (100g) - Test modifier: hunger +5
- **Cooling System**: Keeps you cool in hot environments (150g) - Test modifier: hunger +3

## Technical Details

### Menu Actions

The module system uses these menu actions (defined in `game.js`):

- **`workbench_modules`**: Opens the module view for a piece of equipment
  - Creates a menu showing all attachment slots
  - Each option includes the `moduleEntity` for info display
  - Navigates to `swap_module_menu` when a slot is selected

- **`swap_module_menu`**: Shows swap options for a specific slot
  - Lists compatible modules from inventory
  - Shows remove option if a module is currently installed
  - Navigates to `swap_module` when an option is selected

- **`swap_module`**: Performs the module swap operation
  - Removes old module from slot (if exists) and adds to inventory
  - Installs new module from inventory to slot (if provided)
  - Returns to `workbench_modules` after completion
  - Handles inventory space checks

### Components Involved

- **`AttachmentSlotsComponent`**: Defines what slots exist and what's installed
  ```javascript
  {
    slots: {
      barrel: {
        accepted_type: 'barrel',
        entity_id: 123,  // ID of installed module entity, or null
        required: true   // Whether this slot must be filled
      },
      // ... more slots
    }
  }
  ```

- **`PartComponent`**: Marks an item as a module part
  ```javascript
  { part_type: 'barrel' }  // Must match the accepted_type of a slot
  ```

- **`StatModifierComponent`**: Provides stat bonuses/penalties
  ```javascript
  {
    modifiers: {
      hunger: 5,    // Adds 5 to hunger stat
      head: 10      // Adds 10 to head HP
    }
  }
  ```

- **`MenuComponent`**: Enhanced with module info display
  ```javascript
  {
    // ... standard menu fields
    highlightedModule: 123,  // Entity ID of module to show info for
  }
  ```

### Rendering

The `RenderSystem` handles module info display:

1. In `#renderMenu()`, it checks the selected option for a `moduleEntity` field
2. If found, it calls `#renderModuleInfo()` to create an info box
3. The info box is rendered above the menu containers
4. CSS classes: `.module-info-box`, `.module-info-description`, `.module-info-stats`

## Design Philosophy (KISS)

The module system follows the "Keep It Simple, Stupid" principle:

1. **Simple Navigation**: Select equipment → Select slot → Select module
2. **Clear Feedback**: Every action shows a confirmation message
3. **Visual Clarity**: The module info box always shows what you're looking at
4. **Inventory Integration**: Modules are just items that move between inventory and equipment slots
5. **No Hidden Mechanics**: Required vs optional slots are clearly marked

## Future Enhancements

Potential additions to the module system:

- **Stat effects for generic modules**: Currently, generic modules have no stat modifiers. Future updates could add balanced bonuses/penalties.
- **Crafting modules**: Allow players to craft new modules from resources
- **Module degradation**: Modules could wear out over time and need replacement
- **Rarity system**: Uncommon/rare variants with better stats
- **Module restrictions**: Some modules only work with specific equipment types
- **Visual changes**: Modules could change the appearance of equipment

## Controls Summary

- **W/S**: Navigate menu up/down
- **A/D**: Navigate between menu levels
- **Space**: Select option
- **Escape**: Close submenu or menu
- **I**: Open inventory menu
- **E**: Open equipped items menu (shows currently equipped items with inspect/unequip/module management options)

## Tips

1. **Check Required Slots**: Equipment with empty required slots cannot be equipped. Fill all required slots before trying to equip an item.

2. **Manage Inventory Space**: Swapping modules requires inventory space for the removed module. Clear space if needed before removing modules.

3. **Inspect Before Swapping**: Use the inventory "Inspect" action to view modules on equipped items without needing to visit a workbench.

4. **Weight Matters**: All modules have weight. Equipped items weigh nothing, so equipping heavy armor removes it from your carried weight entirely. This encourages equipping items over carrying them in your inventory.

5. **Generic is Good**: The generic modules (Basic, Standard, etc.) work fine for basic functionality. Save specialized modules for when you need specific bonuses.

6. **Slots Are Efficient**: Modules only take 0.5 inventory slots each, so you can carry twice as many modules as regular items in the same space.
