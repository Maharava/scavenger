# Tool Equipment System - Complete Implementation Plan

**Status:** Design Phase - Ready to Implement
**Priority:** High (Needed for lighting system)
**Complexity:** Medium
**Breaking Changes:** Minimal (additive feature)

---

## Overview

Tools are a new equipment category alongside guns and armor. Players have two tool slots (tool1, tool2) for equipping utility items like torches, scanners, and environmental interaction tools.

**Key Design Principles:**
- Tools are **equippable items** (not consumables)
- 50% weight reduction when equipped (balance between guns/armor at 0% and inventory at 100%)
- Tools provide utility, information, or environmental interaction
- Simple stat structure (no complex modular system like guns/armor)

---

## Equipment Slot Integration

### Current Equipment Slots

| Slot | Equipment Type | Weight When Equipped |
|------|----------------|----------------------|
| hand | Gun | 0g (weightless) |
| body | Armor | 0g (weightless) |
| **tool1** | **Tool** | **50% weight** |
| **tool2** | **Tool** | **50% weight** |

### Weight Logic

```javascript
// In InventoryComponent.getTotalWeight():

// Equipped guns/armor: 0g
if (equippedSlot === 'hand' || equippedSlot === 'body') {
    totalWeight += itemComponent.weight * 0;  // Weightless
}

// Equipped tools: 50% weight
else if (equippedSlot === 'tool1' || equippedSlot === 'tool2') {
    totalWeight += itemComponent.weight * 0.5;  // Half weight
}

// Inventory items: full weight
else {
    totalWeight += itemComponent.weight;  // Full weight
}
```

**Design rationale:**
- Guns/armor: Worn/integrated, weightless encourages equipping
- Tools: Carried on belt/back, some burden but lighter than inventory
- Inventory: In backpack, full weight penalty

---

## Component Architecture

### 1. ToolComponent

Marks an item as a tool and defines its type.

```javascript
class ToolComponent {
    constructor(toolType, usesRemaining = -1) {
        this.toolType = toolType;           // 'light', 'scanner', 'cutter', 'medkit', etc.
        this.usesRemaining = usesRemaining; // -1 = infinite, 0+ = limited uses
    }
}
```

**Properties:**
- `toolType`: Category of tool (for filtering, abilities)
- `usesRemaining`: Number of uses left (-1 for unlimited, like torches)

**Examples:**
```javascript
// Torch: unlimited uses
new ToolComponent('light', -1)

// Medkit: 5 uses per expedition
new ToolComponent('medkit', 5)

// Plasma cutter: 10 uses (limited fuel)
new ToolComponent('cutter', 10)
```

---

### 2. ToolStatsComponent (Optional)

For tools with numerical stats (light radius, scan range, effectiveness).

```javascript
class ToolStatsComponent {
    constructor(stats = {}) {
        this.lightRadius = stats.lightRadius || 0;      // Light emission (0 = none)
        this.scanRange = stats.scanRange || 0;          // Scanner detection range
        this.effectiveness = stats.effectiveness || 0;  // Tool power (100 = max)
        this.specialAbility = stats.specialAbility || null;  // Unique ability ID
    }
}
```

**Properties:**
- `lightRadius`: For light-emitting tools (torches, flashlights)
- `scanRange`: For scanners (motion tracker, material analyzer)
- `effectiveness`: General power rating (medkit healing, cutter speed)
- `specialAbility`: Reference to special ability function

**Examples:**
```javascript
// Torch: 12-tile light
new ToolStatsComponent({ lightRadius: 12 })

// Motion tracker: 15-tile scan range
new ToolStatsComponent({ scanRange: 15, specialAbility: 'detect_enemies' })

// Medkit: 50 effectiveness (heals 50% of body part damage)
new ToolStatsComponent({ effectiveness: 50 })
```

---

## Tool Categories & Definitions

### Category 1: Light Sources

Essential for exploration in dark maps.

#### Torch
```javascript
{
    id: 'TOOL_TORCH',
    name: 'Torch',
    description: 'A bright, reliable light source for dark environments.',
    char: 't',
    colour: '#ffaa00',
    weight: 300,  // 300g
    slots: 1.0,
    tool_type: 'light',
    stats: {
        lightRadius: 12  // Best light source
    }
}
```
- **Light radius:** 12 tiles
- **Weight:** 300g (150g equipped)
- **Uses:** Unlimited
- **Best for:** Maximum visibility

---

#### Flashlight
```javascript
{
    id: 'TOOL_FLASHLIGHT',
    name: 'Tactical Flashlight',
    description: 'Compact, focused beam for tactical operations.',
    char: 'f',
    colour: '#ffffff',
    weight: 180,  // 180g
    slots: 0.5,   // Smaller profile
    tool_type: 'light',
    stats: {
        lightRadius: 10  // Slightly less than torch
    }
}
```
- **Light radius:** 10 tiles
- **Weight:** 180g (90g equipped) - lighter than torch
- **Uses:** Unlimited
- **Best for:** Balanced light with less burden

---

#### Glow Stick
```javascript
{
    id: 'TOOL_GLOWSTICK',
    name: 'Chemical Glow Stick',
    description: 'Emergency chemical light. Weak but weightless.',
    char: 'g',
    colour: '#00ff00',
    weight: 50,   // Very light
    slots: 0.5,
    tool_type: 'light',
    stats: {
        lightRadius: 6  // Same as base player light
    }
}
```
- **Light radius:** 6 tiles (same as base)
- **Weight:** 50g (25g equipped) - negligible
- **Uses:** Unlimited
- **Best for:** Emergency backup, minimal weight

---

### Category 2: Scanners & Detectors

Information-gathering tools for tactical advantage.

#### Motion Tracker
```javascript
{
    id: 'TOOL_MOTION_TRACKER',
    name: 'Motion Tracker',
    description: 'Detects movement of nearby creatures. Shows blips on HUD.',
    char: 'M',
    colour: '#00ffff',
    weight: 400,
    slots: 1.0,
    tool_type: 'scanner',
    stats: {
        scanRange: 15,
        specialAbility: 'detect_enemies'
    }
}
```
- **Ability:** Reveals enemy positions within 15 tiles on HUD (minimap or arrows)
- **Weight:** 400g (200g equipped)
- **Uses:** Unlimited (passive)
- **Best for:** Early warning system

---

#### Material Analyzer
```javascript
{
    id: 'TOOL_ANALYZER',
    name: 'Material Analyzer',
    description: 'Scans items to reveal quality and properties before pickup.',
    char: 'A',
    colour: '#ffff00',
    weight: 350,
    slots: 1.0,
    tool_type: 'scanner',
    stats: {
        scanRange: 5,
        specialAbility: 'identify_items'
    }
}
```
- **Ability:** Shows detailed item stats when hovering (Q key)
- **Weight:** 350g (175g equipped)
- **Uses:** Unlimited (passive)
- **Best for:** Loot optimization

---

#### Thermal Scanner
```javascript
{
    id: 'TOOL_THERMAL',
    name: 'Thermal Scanner',
    description: 'Detects heat signatures through walls. Limited range.',
    char: 'T',
    colour: '#ff0000',
    weight: 500,
    slots: 1.0,
    tool_type: 'scanner',
    stats: {
        scanRange: 8,
        specialAbility: 'see_through_walls'
    }
}
```
- **Ability:** Reveals enemies through walls (within 8 tiles)
- **Weight:** 500g (250g equipped)
- **Uses:** Unlimited (passive)
- **Best for:** Tactical awareness, avoiding ambushes

---

### Category 3: Environmental Tools

Interact with the environment to access new areas or bypass obstacles.

#### Plasma Cutter
```javascript
{
    id: 'TOOL_PLASMA_CUTTER',
    name: 'Plasma Cutter',
    description: 'High-energy tool for cutting through locked doors and containers.',
    char: 'P',
    colour: '#ff6600',
    weight: 800,
    slots: 1.0,
    tool_type: 'cutter',
    stats: {
        effectiveness: 100,  // Can cut any lock
        specialAbility: 'open_locked'
    },
    uses: 10  // Limited fuel
}
```
- **Ability:** Open locked doors/containers (use on locked interactable)
- **Weight:** 800g (400g equipped)
- **Uses:** 10 (limited fuel)
- **Best for:** Accessing restricted areas

---

#### Repair Tool
```javascript
{
    id: 'TOOL_REPAIR',
    name: 'Multi-Tool Repair Kit',
    description: 'Fix broken machinery and restore functionality.',
    char: 'R',
    colour: '#888888',
    weight: 600,
    slots: 1.0,
    tool_type: 'repair',
    stats: {
        effectiveness: 75,  // Repair power
        specialAbility: 'repair_broken'
    },
    uses: 8
}
```
- **Ability:** Repair broken interactables (restore functionality)
- **Weight:** 600g (300g equipped)
- **Uses:** 8
- **Best for:** Restoring useful equipment

---

#### Fire Extinguisher
```javascript
{
    id: 'TOOL_EXTINGUISHER',
    name: 'Fire Extinguisher',
    description: 'Puts out fires and cools overheating equipment.',
    char: 'E',
    colour: '#ff0000',
    weight: 1000,  // Heavy
    slots: 1.0,
    tool_type: 'extinguisher',
    stats: {
        effectiveness: 100,
        specialAbility: 'extinguish_fire'
    },
    uses: 5
}
```
- **Ability:** Extinguish fire hazards, prevent environmental damage
- **Weight:** 1000g (500g equipped)
- **Uses:** 5
- **Best for:** Environmental hazard management

---

### Category 4: Utility Tools

General-purpose tools for survival and resource gathering.

#### Field Medkit
```javascript
{
    id: 'TOOL_MEDKIT',
    name: 'Field Medkit',
    description: 'Portable medical kit. Heals body part damage during expeditions.',
    char: '+',
    colour: '#00ff00',
    weight: 500,
    slots: 1.0,
    tool_type: 'medkit',
    stats: {
        effectiveness: 50,  // Heals 50% of max HP
        specialAbility: 'heal_bodypart'
    },
    uses: 5
}
```
- **Ability:** Use on self to heal body part (50% restoration)
- **Weight:** 500g (250g equipped)
- **Uses:** 5 per expedition
- **Best for:** Emergency healing outside combat

---

#### Sample Collector
```javascript
{
    id: 'TOOL_SAMPLER',
    name: 'Sample Collector',
    description: 'Collect rare biological and chemical samples.',
    char: 'S',
    colour: '#00ffaa',
    weight: 300,
    slots: 1.0,
    tool_type: 'sampler',
    stats: {
        effectiveness: 100,
        specialAbility: 'collect_samples'
    },
    uses: -1  // Unlimited
}
```
- **Ability:** Harvest rare materials from special interactables
- **Weight:** 300g (150g equipped)
- **Uses:** Unlimited
- **Best for:** Resource gathering

---

#### Climbing Gear
```javascript
{
    id: 'TOOL_CLIMBING',
    name: 'Climbing Harness',
    description: 'Access elevated areas and ventilation shafts.',
    char: 'C',
    colour: '#666666',
    weight: 700,
    slots: 1.0,
    tool_type: 'climbing',
    stats: {
        effectiveness: 100,
        specialAbility: 'access_vents'
    },
    uses: -1
}
```
- **Ability:** Access special "climbing required" areas
- **Weight:** 700g (350g equipped)
- **Uses:** Unlimited
- **Best for:** Exploration, alternate routes

---

#### Hacking Tool
```javascript
{
    id: 'TOOL_HACKING',
    name: 'Electronic Lockpick',
    description: 'Bypass electronic locks and access computer systems.',
    char: 'H',
    colour: '#0088ff',
    weight: 250,
    slots: 0.5,  // Compact
    tool_type: 'hacking',
    stats: {
        effectiveness: 80,
        specialAbility: 'hack_terminal'
    },
    uses: 15
}
```
- **Ability:** Hack locked terminals, bypass security
- **Weight:** 250g (125g equipped)
- **Uses:** 15
- **Best for:** Information access, alternate solutions

---

## Equipment Integration

### Update EquippedItemsComponent

Add tool slots to existing equipment system:

```javascript
class EquippedItemsComponent {
    constructor() {
        this.items = new Map([
            ['hand', null],   // Gun
            ['body', null],   // Armor
            ['tool1', null],  // ← New: First tool slot
            ['tool2', null]   // ← New: Second tool slot
        ]);
    }

    // ... existing methods (equip, unequip, getEquipped, isEquipped) ...
}
```

**No changes to existing methods** - tool slots work identically to hand/body.

---

## Menu Integration

### Equipment Menu

Update equipped items menu to show tool slots:

```javascript
// In handlers/menu-actions.js, show_equipped_items action:

'show_equipped_items': (game) => {
    // ... existing hand and body slot code ...

    // Tool 1 slot
    const tool1 = equipped.getEquipped('tool1');
    if (tool1) {
        const tool1Entity = world.getEntity(tool1);
        const tool1Item = tool1Entity.getComponent('ItemComponent');
        menuOptions.push({
            label: `Tool 1: ${tool1Item.name}`,
            action: 'show_item_submenu',
            itemEntityId: tool1,
            itemName: tool1Item.name
        });
    } else {
        menuOptions.push({ label: 'Tool 1: Empty', action: 'close_menu' });
    }

    // Tool 2 slot
    const tool2 = equipped.getEquipped('tool2');
    if (tool2) {
        const tool2Entity = world.getEntity(tool2);
        const tool2Item = tool2Entity.getComponent('ItemComponent');
        menuOptions.push({
            label: `Tool 2: ${tool2Item.name}`,
            action: 'show_item_submenu',
            itemEntityId: tool2,
            itemName: tool2Item.name
        });
    } else {
        menuOptions.push({ label: 'Tool 2: Empty', action: 'close_menu' });
    }

    // Close option
    menuOptions.push({ label: 'Close', action: 'close_menu' });
}
```

---

### Inventory Menu - Equip to Tool Slot

When selecting a tool from inventory, ask which slot:

```javascript
// In handlers/menu-actions.js, show_item_submenu action:

'show_item_submenu': (game, args) => {
    // ... existing code ...

    // Check if item is a tool
    const tool = itemEntity.getComponent('ToolComponent');
    if (tool) {
        // Tool-specific submenu
        submenuOptions.push(
            { label: 'Equip to Tool 1', action: 'equip_tool', slot: 'tool1', itemEntityId },
            { label: 'Equip to Tool 2', action: 'equip_tool', slot: 'tool2', itemEntityId }
        );
    }

    // ... rest of submenu options ...
}
```

**New action: equip_tool**
```javascript
'equip_tool': (game, args) => {
    const { slot, itemEntityId } = args;
    const world = game.world;
    const player = world.query(['PlayerComponent'])[0];
    const equipped = player.getComponent('EquippedItemsComponent');
    const inventory = player.getComponent('InventoryComponent');

    // Check if slot already occupied
    const currentTool = equipped.getEquipped(slot);
    if (currentTool) {
        // Swap: unequip current, equip new
        const currentEntity = world.getEntity(currentTool);
        const currentItem = currentEntity.getComponent('ItemComponent');

        // Add current tool back to inventory
        inventory.addItem(world, currentTool);

        // Unequip from slot
        equipped.unequip(slot);

        world.addComponent(player.id, new MessageComponent(`Unequipped ${currentItem.name}`, 'white'));
    }

    // Equip new tool
    const itemEntity = world.getEntity(itemEntityId);
    const itemComponent = itemEntity.getComponent('ItemComponent');

    // Remove from inventory
    inventory.removeItem(world, itemEntityId);

    // Equip to slot
    equipped.equip(slot, itemEntityId);

    // Handle light source activation
    const light = itemEntity.getComponent('LightSourceComponent');
    if (light) {
        // Add light to player (lighting system will detect it)
        player.addComponent(new LightSourceComponent(light.radius, true));

        // Mark lighting dirty
        const lightingSystem = world.systems.find(s => s instanceof LightingSystem);
        if (lightingSystem) {
            lightingSystem.markDirty();
        }
    }

    world.addComponent(player.id, new MessageComponent(`Equipped ${itemComponent.name} to ${slot}`, 'green'));

    // Refresh inventory menu
    MENU_ACTIONS['open_inventory_menu'](game);
}
```

---

## Tool Usage System

### Active Tool Usage

For tools with active abilities (medkit, plasma cutter, etc.), add usage system:

```javascript
// New menu action: use_tool
'use_tool': (game, args) => {
    const { toolEntityId } = args;
    const world = game.world;
    const player = world.query(['PlayerComponent'])[0];
    const toolEntity = world.getEntity(toolEntityId);
    const tool = toolEntity.getComponent('ToolComponent');
    const toolStats = toolEntity.getComponent('ToolStatsComponent');
    const toolItem = toolEntity.getComponent('ItemComponent');

    // Check uses remaining
    if (tool.usesRemaining === 0) {
        world.addComponent(player.id, new MessageComponent(`${toolItem.name} is depleted!`, 'red'));
        return;
    }

    // Execute tool ability based on type
    switch (toolStats.specialAbility) {
        case 'heal_bodypart':
            // Heal player's most damaged body part
            const bodyParts = player.getComponent('BodyPartsComponent');
            const damaged = bodyParts.getDamagedParts();
            if (damaged.length > 0) {
                const mostDamaged = damaged.sort((a, b) => a.efficiency - b.efficiency)[0];
                const healAmount = toolStats.effectiveness;
                bodyParts.heal(mostDamaged.name, healAmount);

                world.addComponent(player.id, new MessageComponent(
                    `Healed ${mostDamaged.name} by ${healAmount}%`,
                    'green'
                ));

                // Consume use
                if (tool.usesRemaining > 0) {
                    tool.usesRemaining--;
                }
            } else {
                world.addComponent(player.id, new MessageComponent(`No injuries to heal.`, 'white'));
            }
            break;

        // Add other tool abilities here...

        default:
            world.addComponent(player.id, new MessageComponent(`Tool has no active ability.`, 'white'));
    }

    closeTopMenu(world);
}
```

---

### Interactable-Targeted Tool Usage

For tools that interact with environment (plasma cutter, repair tool):

```javascript
// Modify InteractionSystem to check for equipped tools

// When player activates interactable:
const interactable = /* ... get interactable entity ... */;
const interactableComp = interactable.getComponent('InteractableComponent');

// Check if interactable requires a tool
if (interactableComp.requiresTool) {
    const player = world.query(['PlayerComponent'])[0];
    const equipped = player.getComponent('EquippedItemsComponent');

    // Check both tool slots for required tool type
    const tool1 = equipped.getEquipped('tool1');
    const tool2 = equipped.getEquipped('tool2');

    let hasTool = false;
    if (tool1) {
        const tool1Entity = world.getEntity(tool1);
        const tool1Comp = tool1Entity.getComponent('ToolComponent');
        if (tool1Comp.toolType === interactableComp.requiredToolType) {
            hasTool = true;
        }
    }
    if (tool2) {
        const tool2Entity = world.getEntity(tool2);
        const tool2Comp = tool2Entity.getComponent('ToolComponent');
        if (tool2Comp.toolType === interactableComp.requiredToolType) {
            hasTool = true;
        }
    }

    if (!hasTool) {
        world.addComponent(player.id, new MessageComponent(
            `Requires ${interactableComp.requiredToolType} tool!`,
            'red'
        ));
        return;
    }
}

// Tool check passed, continue with interaction...
```

**Example locked door interactable:**
```javascript
{
    id: 'LOCKED_DOOR',
    name: 'Locked Security Door',
    char: 'D',
    colour: '#ff0000',
    requiresTool: true,
    requiredToolType: 'cutter',  // Needs plasma cutter
    menu: {
        title: "A reinforced security door. Locked tight.",
        options: [
            { label: 'Use Plasma Cutter', action: 'cut_door' },
            { label: 'Cancel', action: 'close_menu' }
        ]
    }
}
```

---

## Passive Tool Abilities

Some tools have passive effects when equipped (motion tracker, material analyzer).

### Motion Tracker Implementation

```javascript
// New system: ToolEffectSystem
class ToolEffectSystem extends System {
    update(world) {
        const player = world.query(['PlayerComponent', 'EquippedItemsComponent'])[0];
        if (!player) return;

        const equipped = player.getComponent('EquippedItemsComponent');

        // Check both tool slots for passive abilities
        const tool1 = equipped.getEquipped('tool1');
        const tool2 = equipped.getEquipped('tool2');

        let hasMotionTracker = false;
        let motionTrackerRange = 0;

        // Check tool1
        if (tool1) {
            const tool1Entity = world.getEntity(tool1);
            const tool1Stats = tool1Entity.getComponent('ToolStatsComponent');
            if (tool1Stats && tool1Stats.specialAbility === 'detect_enemies') {
                hasMotionTracker = true;
                motionTrackerRange = tool1Stats.scanRange;
            }
        }

        // Check tool2
        if (tool2) {
            const tool2Entity = world.getEntity(tool2);
            const tool2Stats = tool2Entity.getComponent('ToolStatsComponent');
            if (tool2Stats && tool2Stats.specialAbility === 'detect_enemies') {
                hasMotionTracker = true;
                motionTrackerRange = Math.max(motionTrackerRange, tool2Stats.scanRange);
            }
        }

        // Apply motion tracker effect
        if (hasMotionTracker) {
            this.showEnemyBlips(world, player, motionTrackerRange);
        }
    }

    showEnemyBlips(world, player, range) {
        const playerPos = player.getComponent('PositionComponent');
        const enemies = world.query(['AIComponent', 'PositionComponent']);

        for (const enemy of enemies) {
            const enemyPos = enemy.getComponent('PositionComponent');
            const distance = Math.abs(playerPos.x - enemyPos.x) + Math.abs(playerPos.y - enemyPos.y);

            if (distance <= range) {
                // Mark enemy as detected (add component for rendering)
                if (!enemy.hasComponent('DetectedComponent')) {
                    world.addComponent(enemy.id, new DetectedComponent());
                }
            } else {
                // Remove detection if out of range
                if (enemy.hasComponent('DetectedComponent')) {
                    world.removeComponent(enemy.id, 'DetectedComponent');
                }
            }
        }
    }
}
```

**Update RenderSystem to show detected enemies:**
```javascript
// In RenderSystem, after rendering enemies:
const detected = entity.getComponent('DetectedComponent');
if (detected) {
    // Render blip indicator above enemy
    // Or show on minimap
    // Or add pulsing outline
}
```

---

## Data File Structure

### gamedata/tools.js (NEW)

```javascript
const TOOL_DATA = [
    // Light Sources
    {
        id: 'TOOL_TORCH',
        name: 'Torch',
        description: 'A bright, reliable light source for dark environments.',
        char: 't',
        colour: '#ffaa00',
        weight: 300,
        slots: 1.0,
        tool_type: 'light',
        stats: {
            lightRadius: 12
        }
    },

    {
        id: 'TOOL_FLASHLIGHT',
        name: 'Tactical Flashlight',
        description: 'Compact, focused beam for tactical operations.',
        char: 'f',
        colour: '#ffffff',
        weight: 180,
        slots: 0.5,
        tool_type: 'light',
        stats: {
            lightRadius: 10
        }
    },

    // Scanners
    {
        id: 'TOOL_MOTION_TRACKER',
        name: 'Motion Tracker',
        description: 'Detects movement of nearby creatures.',
        char: 'M',
        colour: '#00ffff',
        weight: 400,
        slots: 1.0,
        tool_type: 'scanner',
        stats: {
            scanRange: 15,
            specialAbility: 'detect_enemies'
        }
    },

    // Utility
    {
        id: 'TOOL_MEDKIT',
        name: 'Field Medkit',
        description: 'Portable medical kit. Heals body part damage.',
        char: '+',
        colour: '#00ff00',
        weight: 500,
        slots: 1.0,
        tool_type: 'medkit',
        stats: {
            effectiveness: 50,
            specialAbility: 'heal_bodypart'
        },
        uses: 5
    },

    // ... rest of tools ...
];
```

---

## World Builder Integration

### Spawning Tools as Loot

```javascript
// In world-builder.js, when creating tools:

function createToolEntity(world, toolDef, x, y) {
    const toolId = world.createEntity();

    // Basic components
    world.addComponent(toolId, new PositionComponent(x, y));
    world.addComponent(toolId, new ItemComponent(
        toolDef.name,
        toolDef.description,
        toolDef.weight,
        toolDef.slots
    ));
    world.addComponent(toolId, new RenderableComponent(
        toolDef.char,
        toolDef.colour,
        1
    ));
    world.addComponent(toolId, new NameComponent(toolDef.name));

    // Tool-specific components
    world.addComponent(toolId, new ToolComponent(
        toolDef.tool_type,
        toolDef.uses || -1
    ));

    if (toolDef.stats) {
        world.addComponent(toolId, new ToolStatsComponent(toolDef.stats));

        // Add light component if tool emits light
        if (toolDef.stats.lightRadius > 0) {
            world.addComponent(toolId, new LightSourceComponent(
                toolDef.stats.lightRadius,
                true
            ));
        }
    }

    // Visibility component (for lighting system)
    world.addComponent(toolId, new VisibilityStateComponent());

    return toolId;
}
```

---

## Implementation Checklist

### Phase 1: Core Components (2 hours)
- [ ] Create `ToolComponent` (components.js)
- [ ] Create `ToolStatsComponent` (components.js)
- [ ] Update `EquippedItemsComponent` to include tool1/tool2 slots
- [ ] Update inventory weight calculation for 50% tool weight

### Phase 2: Data Definitions (2 hours)
- [ ] Create `gamedata/tools.js` with all tool definitions
- [ ] Add tool data to index.html script loading
- [ ] Define 10-15 initial tools across all categories

### Phase 3: Menu Integration (3 hours)
- [ ] Update `show_equipped_items` to show tool slots
- [ ] Update `show_item_submenu` to handle tools
- [ ] Create `equip_tool` menu action
- [ ] Create `use_tool` menu action
- [ ] Test equipping/unequipping tools

### Phase 4: World Builder (1 hour)
- [ ] Add tool spawning logic to world-builder.js
- [ ] Place tools in test map for testing
- [ ] Verify tool entities created correctly

### Phase 5: Active Abilities (3 hours)
- [ ] Implement medkit healing
- [ ] Implement plasma cutter door opening
- [ ] Implement repair tool functionality
- [ ] Test tool usage system

### Phase 6: Passive Abilities (3 hours)
- [ ] Create `ToolEffectSystem`
- [ ] Implement motion tracker detection
- [ ] Implement material analyzer item info
- [ ] Register system in game.js

### Phase 7: Lighting Integration (1 hour)
- [ ] Verify light-emitting tools work with lighting system
- [ ] Test torch/flashlight equip/unequip
- [ ] Verify light radius changes correctly

### Phase 8: Testing & Polish (2 hours)
- [ ] Test all tool types
- [ ] Test weight calculations
- [ ] Test equipment menu display
- [ ] Balance tool weights and effectiveness
- [ ] Visual polish

**Total estimated time: 17 hours**

---

## Future Enhancements

1. **Tool durability** (limited uses that deplete)
2. **Tool upgrades** (improve effectiveness, range)
3. **Crafting tools** (create custom tools from materials)
4. **Tool combinations** (using multiple tools together)
5. **Tool-specific enemies** (require specific tools to defeat)

---

## Conclusion

The tool system provides:
- ✅ **New equipment category** (parallel to guns/armor)
- ✅ **Weight balance** (50% equipped weight)
- ✅ **Utility focus** (exploration, information, interaction)
- ✅ **Simple integration** (uses existing equipment systems)
- ✅ **Flexible abilities** (active and passive effects)

**Ready to implement alongside or before the Lighting System.**
