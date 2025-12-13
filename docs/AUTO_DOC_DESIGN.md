# Auto-Doc Design Specification

**Status:** Design Phase
**Priority:** Medium
**Complexity:** Medium

---

## Overview

The Auto-Doc is an advanced medical station that provides automated healing over time, consuming materials to repair body part damage more efficiently than natural regeneration.

**Core Concept:** "Set it and forget it" healing that works in the background while you do other things on the ship.

---

## Basic Mechanics

### Usage Flow
1. Player interacts with Auto-Doc on ship
2. Menu shows:
   - Current body part status (all parts with damage)
   - Cost per treatment session
   - Available materials in inventory/cargo
3. Player selects "Start Treatment"
4. Materials consumed immediately
5. Healing effect applies over time (passive background process)
6. Can only have ONE active treatment at a time

### Healing Parameters

**Healing Rate:**
- **20% restoration to ALL body parts** over **2 hours (120 game minutes)**
- That's **10% per hour** or **~0.17% per minute**
- Works on all damaged parts simultaneously

**Material Costs per Treatment:**
- 2x Organic Protein
- 3x Chemical Compounds
- 1x Polymer Resin (for medical supplies/bandages)

**Comparison to Natural Healing:**
- Natural: 0.05% per minute (3% per hour)
- Auto-Doc: 0.17% per minute (10% per hour)
- **Auto-Doc is ~3.3x faster than natural healing**

---

## Implementation Options

### Option A: Simple Time-Based (RECOMMENDED)
**Pro:** Easy to implement, clear to player
**Con:** Requires staying on ship for full effect

```javascript
// When player activates Auto-Doc:
1. Check if treatment already active
2. Check materials available
3. Consume materials
4. Add AutoDocComponent to player:
   {
       startTime: currentGameTime,
       endTime: currentGameTime + 120, // 2 hours
       healingPerMinute: 0.17
   }
5. Show message: "Treatment initiated. Estimated completion: 2 hours."

// In AutoDocSystem update():
- If player has AutoDocComponent:
  - Each minute: heal all body parts by 0.17%
  - When endTime reached: remove component, show completion message
  - If player leaves ship: pause/cancel treatment (configurable)
```

### Option B: Installment-Based
**Pro:** Can leave ship mid-treatment
**Con:** More complex, less realistic

```javascript
// Treatment creates "charges" that apply healing
- Consume materials upfront
- Add 120 "healing charges" to player
- Each minute on ship: consume 1 charge, heal 0.17%
- Charges persist even if leaving ship
- Can continue treatment next time on ship
```

### Option C: Instant Heal (Simple Alternative)
**Pro:** Very simple, no timing concerns
**Con:** Less interesting, feels like instant cheat

```javascript
// Single button click:
1. Check materials
2. Consume materials
3. Heal all parts by 20% IMMEDIATELY
4. Done
```

---

## Recommended Implementation: Option A (Time-Based)

### Behavior Details

**While Treatment Active:**
- Player can still move around ship
- Player can use other interactables (bed, stove, etc.)
- Player CANNOT start expedition (requires ending treatment first)
- Player CAN cancel treatment early (materials already consumed, healing stops)
- HUD shows "Auto-Doc Active: 45min remaining" status

**Treatment Completion:**
- Green message: "Auto-Doc treatment complete. All body parts restored by 20%."
- Component removed automatically
- Can start new treatment immediately if desired

**Multiple Treatments:**
- Can chain treatments back-to-back
- E.g., if heavily damaged (50% on limbs), could do 3 treatments to fully heal
- Cost: 6 Organic Protein, 9 Chemical Compounds, 3 Polymer Resin for full heal

---

## Script Implementation

### Menu Script: `openAutoDocMenu`

```javascript
'openAutoDocMenu': (game, self, args) => {
    const player = game.world.getPlayer();
    if (!player) return;

    // Check if treatment already active
    const existingTreatment = player.getComponent('AutoDocComponent');
    if (existingTreatment) {
        const remaining = Math.ceil(existingTreatment.endTime - game.world.gameTime);
        const menuOptions = [
            { label: `Cancel Treatment (${remaining}min left)`, action: 'cancel_autodoc' },
            { label: 'Back', action: 'close_menu' }
        ];
        game.world.addComponent(player.id,
            new MenuComponent('Auto-Doc (Treatment Active)', menuOptions, self));
        return;
    }

    // Show body part status
    const bodyParts = player.getComponent('BodyPartsComponent');
    const damages = [];
    for (const [part, eff] of Object.entries(bodyParts.parts)) {
        if (eff < 100) {
            damages.push(`${part}: ${eff}%`);
        }
    }

    // Check materials
    const inventory = player.getComponent('InventoryComponent');
    const ship = game.world.getShip();
    const shipCargo = ship ? ship.getComponent('ShipComponent').cargo : null;

    const organicProtein = countMaterial(inventory, shipCargo, 'ORGANIC_PROTEIN');
    const chemicalCompounds = countMaterial(inventory, shipCargo, 'CHEMICAL_COMPOUNDS');
    const polymerResin = countMaterial(inventory, shipCargo, 'POLYMER_RESIN');

    const canAfford = organicProtein >= 2 && chemicalCompounds >= 3 && polymerResin >= 1;

    const menuOptions = [];

    if (damages.length === 0) {
        menuOptions.push({ label: 'No injuries detected', action: 'close_menu' });
    } else {
        const costLine = `Cost: 2 Organic Protein, 3 Chemical Compounds, 1 Polymer Resin`;
        const statusLine = `Status: ${damages.join(', ')}`;

        if (canAfford) {
            menuOptions.push({
                label: `Start Treatment (+20% to all parts, 2hr)`,
                action: 'start_autodoc_treatment'
            });
        } else {
            menuOptions.push({ label: 'Insufficient materials', action: 'close_menu' });
        }
    }

    menuOptions.push({ label: 'Back', action: 'close_menu' });

    game.world.addComponent(player.id,
        new MenuComponent('Auto-Doc Medical Station', menuOptions, self));
}
```

### Menu Action: `start_autodoc_treatment`

```javascript
'start_autodoc_treatment': (game, args) => {
    const player = game.world.getPlayer();
    if (!player) return;

    // Consume materials (prioritize player inventory, then ship cargo)
    const costs = [
        { materialId: 'ORGANIC_PROTEIN', quantity: 2 },
        { materialId: 'CHEMICAL_COMPOUNDS', quantity: 3 },
        { materialId: 'POLYMER_RESIN', quantity: 1 }
    ];

    for (const cost of costs) {
        consumeMaterial(player, cost.materialId, cost.quantity);
    }

    // Start treatment
    const treatment = new AutoDocComponent(game.world.gameTime);
    game.world.addComponent(player.id, treatment);

    game.world.addComponent(player.id,
        new MessageComponent('Auto-Doc treatment initiated. Estimated completion: 2 hours.', 'cyan'));

    closeAllMenus(game.world);
}
```

---

## Component: AutoDocComponent

```javascript
class AutoDocComponent {
    constructor(startTime) {
        this.startTime = startTime;
        this.endTime = startTime + 120; // 2 hours
        this.healingPerMinute = 0.17;
        this.lastHealTime = startTime;
    }
}
```

---

## System: AutoDocSystem

```javascript
class AutoDocSystem extends System {
    update(world) {
        const player = world.getPlayer();
        if (!player) return;

        const treatment = player.getComponent('AutoDocComponent');
        if (!treatment) return;

        const currentTime = world.gameTime;

        // Apply healing every game minute
        if (currentTime >= treatment.lastHealTime + 1) {
            const bodyParts = player.getComponent('BodyPartsComponent');
            if (bodyParts) {
                // Heal all parts
                for (const part in bodyParts.parts) {
                    bodyParts.healPart(part, treatment.healingPerMinute);
                }
                treatment.lastHealTime = currentTime;
            }
        }

        // Check if treatment complete
        if (currentTime >= treatment.endTime) {
            world.removeComponent(player.id, 'AutoDocComponent');
            world.addComponent(player.id,
                new MessageComponent('Auto-Doc treatment complete!', 'green'));
        }
    }
}
```

---

## HUD Integration

Add to HUD display (when AutoDocComponent present):

```javascript
// In hud-system.js
if (player.hasComponent('AutoDocComponent')) {
    const treatment = player.getComponent('AutoDocComponent');
    const remaining = Math.max(0, treatment.endTime - world.gameTime);

    const hudElement = document.getElementById('autodoc-status');
    if (hudElement) {
        hudElement.textContent = `Auto-Doc: ${remaining}min`;
        hudElement.style.color = '#00ffff';
    }
}
```

---

## Buildable Definition

```javascript
{
    id: 'AUTO_DOC',
    name: 'Auto-Doc',
    description: 'Advanced medical station for automated healing.',
    char: 'M',
    colour: '#00ffff',
    buildCost: [
        { materialId: 'BASIC_ELECTRONICS', quantity: 5 },
        { materialId: 'INTACT_LOGIC_BOARD', quantity: 2 },
        { materialId: 'CHEMICAL_COMPOUNDS', quantity: 3 }
    ],
    requiresFloorTile: true,
    blocksMovement: true,
    interactableId: 'AUTO_DOC'
}
```

---

## Interactable Definition

```javascript
{
    id: 'AUTO_DOC',
    name: 'Auto-Doc',
    char: 'M',
    colour: '#00ffff',
    solid: true,
    script: 'openAutoDocMenu',
    scriptArgs: {}
}
```

---

## Balance Considerations

### Cost Analysis
**Per Treatment:**
- 2 Organic Protein (~400g, 0.4 slots)
- 3 Chemical Compounds (~300g, 0.3 slots)
- 1 Polymer Resin (~200g, 0.5 slots)
- **Total: ~900g, 1.2 slots**

**To Fully Heal (0% → 100%):**
- 5 treatments needed
- 10 Organic Protein, 15 Chemical Compounds, 5 Polymer Resin
- Takes 10 hours of game time
- **Expensive but powerful**

### Comparison to Bed
- **Bed (8hr sleep):** Free, restores rest + small heal bonus
- **Auto-Doc (2hr):** Costs materials, heals 3x faster
- **Use Case:** Auto-Doc for emergency healing, Bed for routine rest/recovery

### Economic Impact
- Creates demand for specific materials (Organic Protein, Chemical Compounds)
- Encourages killing organic enemies (drop Organic Protein)
- Encourages looting chemical containers
- **Scavenging becomes more valuable**

---

## Edge Cases

### Player Leaves Ship During Treatment
**Option 1 (Strict):** Treatment cancels, materials lost
- Realistic (can't use medical bay while exploring)
- Punishing (lost materials)

**Option 2 (Lenient):** Treatment pauses, resumes on return
- More forgiving
- Less realistic
- **RECOMMENDED for better UX**

### Player Dies During Treatment
- Treatment component removed on death
- Materials already consumed (lost)
- No special handling needed

### Multiple Auto-Docs Built
- Each Auto-Doc can only treat one person
- In single-player, only affects the player
- Future multiplayer: each player gets their own treatment

---

## UI/UX Considerations

**Menu Display:**
```
╔═══════════════════════════════════════╗
║     Auto-Doc Medical Station          ║
╠═══════════════════════════════════════╣
║                                       ║
║  Current Injuries:                    ║
║    • Head: 85%                        ║
║    • Torso: 65%                       ║
║    • Limbs: 40%                       ║
║                                       ║
║  Treatment: +20% to all parts (2hr)   ║
║                                       ║
║  Cost: 2 Organic Protein              ║
║        3 Chemical Compounds           ║
║        1 Polymer Resin                ║
║                                       ║
║  > Start Treatment                    ║
║    Back                               ║
╚═══════════════════════════════════════╝
```

**HUD Display:**
```
[Auto-Doc: 87min] ← Shows in top-right with cyan color
```

---

## Testing Checklist

- [ ] Auto-Doc builds from Bridge Console
- [ ] Auto-Doc interactable appears on ship
- [ ] Menu shows body part status correctly
- [ ] Menu shows material requirements
- [ ] Can't start treatment without materials
- [ ] Materials consumed on treatment start
- [ ] Healing applies every game minute
- [ ] HUD shows remaining time
- [ ] Treatment completes after 2 hours
- [ ] Can chain multiple treatments
- [ ] Can't start expedition during treatment
- [ ] Treatment pauses/resumes correctly (if implemented)
- [ ] Can cancel treatment early

---

## Future Enhancements

### Advanced Features (V2)
1. **Upgrade System:**
   - Level 1: 20% heal, 2 hours (current)
   - Level 2: 30% heal, 90 minutes (costs more)
   - Level 3: 40% heal, 60 minutes (costs significantly more)

2. **Specialized Treatments:**
   - Head trauma treatment (focus on head)
   - Combat triage (quick 10% heal, 30min, cheaper)
   - Deep tissue repair (slow 50% heal, 6hr, expensive)

3. **Medical Supplies:**
   - Add "Medical Supplies" item type
   - Auto-Doc consumes Medical Supplies instead of raw materials
   - Craft Medical Supplies from Organic Protein + Chemical Compounds

4. **Treatment Slots:**
   - Queue multiple treatments
   - "Start 3 treatments (6hr total, 6 Organic Protein...)"

---

## Implementation Priority

**Recommended Order:**
1. Create AutoDocComponent
2. Create AutoDocSystem (basic healing logic)
3. Add openAutoDocMenu script
4. Add start_autodoc_treatment menu action
5. Add AUTO_DOC to buildables.js
6. Add AUTO_DOC to interactables.js
7. Test basic functionality
8. Add HUD integration
9. Add cancel treatment option
10. Polish messaging and UX

**Estimated Time:** 2-3 hours

---

**End of Auto-Doc Design Document**
