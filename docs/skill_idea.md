# Skill System Design Proposal

This document outlines a set of proposed skills based on the game's established mechanics. It also includes ideas for future skills. The fundamental architecture (adding a `SkillsComponent` in `components.js`, adding it to the player in `world-builder.js`, and displaying it via `hud-system.js`) remains sound.

---

### Core Skills

These are the primary skills for the game, designed to integrate with existing or near-future systems. All skills range from Level 0 to 5.

**1. Hacking**
*   **Core Mechanic:** Allows the player to bypass electronic security. The skill level is checked against the security system's difficulty.
*   **Implementation Notes:** This requires creating new "locked" interactable objects (e.g., a `LockedComputer` or `SecureLocker`) and a new script in `script-registry.js` (e.g., `attempt_hack`) that performs a skill check.
*   **Progression:** Unlocks the ability to hack higher difficulty locks (Lvl 1 for Difficulty 1, etc.).

**2. Precision**
*   **Core Mechanic:** Increases the chance of hitting an enemy's 'head' body part, serving as the game's "critical hit" system.
*   **Implementation Notes:** This would modify the `BodyPartHitTable`. The `getRandomHitPart` function would be adjusted to increase the `head` weight based on the player's Precision skill level.
*   **Progression:** Each level adds a +2% chance for a shot to be aimed at the head (Lvl 1: +2%, Lvl 5: +10%).

**3. Pistol Proficiency**
*   **Core Mechanic:** Increases the player's base `accuracy` when firing a weapon with the `pistol` gun type.
*   **Implementation Notes:** The bonus is applied within the `calculateHitChance` function in `action-resolution-system.js`.
*   **Progression:** Provides a linear bonus to accuracy (Lvl 1: +3, Lvl 5: +15).

**4. Rifle Proficiency**
*   **Core Mechanic:** Increases the player's base `accuracy` when firing a weapon with the `rifle` gun type.
*   **Implementation Notes:** Implemented identically to the Pistol skill.
*   **Progression:** Provides a linear bonus to accuracy (Lvl 1: +3, Lvl 5: +15).

**5. Initiative**
*   **Core Mechanic:** Adds a direct bonus to the player's initiative roll, increasing their chance to act first.
*   **Implementation Notes:** The bonus is applied during the `rollInitiative` function in `combat-system.js`. It's noted that enemies should also have a base initiative value to provide a consistent challenge.
*   **Progression:** Each level adds +1 to the initiative roll. This skill has a chance to level up each time the player enters combat.

**6. Athletics**
*   **Core Mechanic:** Governs physical fitness. Each level grants +1 `movementPerTurn` in combat.
*   **Implementation Notes:** The bonus is applied to the `movementPerTurn` property in the player's `CombatantComponent`.
*   **Leveling Mechanic:** Has a chance to level up each time the player expends all movement points during a combat turn, rewarding active repositioning.

**7. Stealth**
*   **Core Mechanic:** Gently reduces the detection range of enemies, making it easier to avoid combat.
*   **Implementation Notes:** This bonus is applied to an enemy's `detectionRange` in `combat-system.js` before checking for line-of-sight.
*   **Progression:** A non-linear progression: Level 2 reduces enemy detection range by 1. Level 4 reduces it by a total of 2.
*   **Leveling Mechanic:** Has a chance to level up each time the player moves or ends a turn within an enemy's base detection range *without* being seen (e.g., by staying behind cover).

**8. Medical**
*   **Core Mechanic:** Increases the `efficiency` restored to a body part when using a medical item.
*   **Implementation Notes:** TBA
*   **Progression:** TBA

**9. Cooking**
*   **Core Mechanic:** Acts as a gate for crafting food. The player can only craft recipes whose tier is less than or equal to their Cooking skill level.
*   **Implementation Notes:** Requires a "Food Prep Station" interactable and a full recipe/crafting system.
*   **Progression:** Unlocks higher tiers of recipes.

**10. Xenobiology**
*   **Core Mechanic:** A knowledge skill representing the player's understanding of alien lifeforms. It has no direct mechanical effect on its own.
*   **Implementation Notes:** This skill will be used for a future 'Dossier' or 'Bestiary' feature, where information about aliens (resistances, abilities) is revealed based on the player's skill level.
*   **Leveling Mechanic:** Has a chance to level up after surviving a combat encounter with alien creatures.

**11. Robotics**
*   **Core Mechanic:** A knowledge skill for understanding robotic enemies, similar to Xenobiology.
*   **Implementation Notes:** Feeds the future 'Dossier' feature, revealing information about robots (armour values, weapon types). Excludes mysterious 'Aberrants'.
*   **Leveling Mechanic:** Has a chance to level up after surviving a combat encounter with robotic enemies.

---

## Skill System Critique

### **Critical Issues - Skills Needing Major Revision**

**1. Precision (Headshot Bonus) - UNDERPOWERED**
- Base headshot chance is only 10% (from body parts hit table)
- +2% per level = max 20% at level 5
- Problem: Headshots aren't "critical hits" - they're just another body part with its own HP pool
- The benefit is minimal - you're trading 10% effectiveness for a small chance to hit a different target
- **Suggestion:** Either make headshots deal bonus damage (true crits), or increase the bonus to +5% per level

**2. Athletics (Movement Bonus) - OVERPOWERED**
- Base movement is 4 tiles, +1 per level = 9 tiles at max
- That's a 125% increase in combat mobility!
- Would trivialize positioning and kiting strategies
- **Suggestion:** +0.5 tiles per 2 levels (round down), or +3 tiles total at max level

**3. Initiative (Turn Order) - OVERPOWERED**
- Current formula: movementStat + 1d6 (so 5-10 for typical combatant)
- +5 at max level vs a d6 roll means you'd almost always go first
- Removes tactical uncertainty from combat
- **Suggestion:** +0.5 per level (round initiative roll), or cap at +3 total

**4. Stealth (Detection Reduction) - UNDERPOWERED & WEIRD**
- Only gives bonuses at levels 2 and 4 (-1 and -2 total)
- Detection ranges are 10-20 tiles, so -2 is only 10-20% reduction
- Non-linear progression feels arbitrary
- **Suggestion:** Linear progression: -1 per 2 levels, or -0.5 per level (round down)

**5. Weapon Proficiency Split - QUESTIONABLE**
- Splitting Pistol and Rifle fragments progression
- Only 2 weapon types currently exist in the game
- **Suggestion:** Consider "Marksmanship" (all guns) or "Small Arms/Long Arms" categories, or keep split but make progression faster

### **Premature Skills - No System Exists Yet**

These skills reference systems that don't exist in your codebase:

- **Hacking** - No locked computers, security systems, or hacking mechanics exist
- **Cooking** - No recipe system or crafting mechanics exist
- **Xenobiology/Robotics** - No bestiary or dossier system exists (only 2 enemy types each)
- **Medical** - No healing items or medical mechanics implemented yet (says "TBA")

**Recommendation:** Remove these from initial implementation. Add them when the underlying systems are built.

### **Missing Skills Worth Adding**

Based on existing mechanics that could use skill bonuses:

1. **Toughness** - Increases max HP of body parts (+5% per level)
2. **Evasion** - Increases dodge chance (base 10%, +2% per level)
3. **Composure** - Reduces stress penalties to accuracy or improves stress recovery
4. **Scavenging** - Better loot from corpses, find rarer items (when loot system added)
5. **Armor Training** - Reduces encumbrance penalties, improves armor effectiveness
6. **Quick Draw** - Increases first strike bonus or allows weapon swapping without penalty

### **Fair Level-Up Chances (0→5)**

You need 6 total level-ups. Assuming organic gameplay triggers:

**Combat-Focused Skills (Precision, Proficiency, Initiative):**
- Average combat: 3-5 rounds, 10-20 player actions
- Target: 8-12 combats to max out
- **Suggestion:**
  - Level 0→1: 25% chance per trigger
  - Level 1→2: 20% chance
  - Level 2→3: 15% chance
  - Level 3→4: 12% chance
  - Level 4→5: 10% chance

**Active Movement Skills (Athletics, Stealth):**
- More frequent triggers (every turn you move)
- Target: 5-8 combats to max out
- **Suggestion:**
  - Level 0→1: 15% chance per trigger
  - Level 1→2: 12% chance
  - Level 2→3: 10% chance
  - Level 3→4: 8% chance
  - Level 4→5: 6% chance

**Combat Entry Skills (Initiative):**
- Triggers once per combat
- Target: 15-25 combats to max out
- **Suggestion:**
  - Level 0→1: 20% chance
  - Level 1→2: 18% chance
  - Level 2→3: 15% chance
  - Level 3→4: 12% chance
  - Level 4→5: 10% chance

### **Revised Skill Suggestions**

Here's a balanced core set for initial implementation:

1. **Marksmanship** - +2 accuracy per level with all guns
2. **Precision** - +3% headshot chance per level (15% at max)
3. **Initiative** - +0.5 initiative per level (rounds roll up)
4. **Athletics** - +0.5 movement per level (rounds down, max +2 at level 5)
5. **Toughness** - +10% max HP to all body parts per level
6. **Evasion** - +2% dodge chance per level
7. **Stealth** - -0.5 enemy detection per level (rounds down, -2 at max)
8. **Composure** - Reduces stress accuracy penalty by 2% per level

### **GUI Display Ideas**

**Main Skills Screen (Press 'S'):**
```
┌─ SKILLS ────────────────────────────────────┐
│                                             │
│ Marksmanship     [●●●○○] 3/5    Progress: ▓▓▓░░░░░ 35%
│   +6% accuracy with all firearms           │
│                                             │
│ Precision        [●●○○○] 2/5    Progress: ▓▓▓▓░░░░ 48%
│   +6% chance to hit head (critical hits)   │
│                                             │
│ Athletics        [●●●●○] 4/5    Progress: ▓▓░░░░░░ 22%
│   +2 movement in combat                    │
│                                             │
│ Initiative       [●●●○○] 3/5    Progress: ▓▓▓▓▓░░░ 67%
│   +1.5 initiative (act earlier in combat)  │
│                                             │
└─────────────────────────────────────────────┘
```

**In HUD (Show skill bonuses on stats):**
```
Rile    0845
Hunger: ████████░░ 80%
Rest:   ██████████ 100%
Stress: ███░░░░░░░ 30%
Comfort:████████░░ 80%

Skills: Mark+6% Prec+6% Ath+2 Init+1.5

Weight: 2400g/3000g
Slots: 3.5/4
```

**Combat Skill Level-Up Notification:**
```
[Cyan flash] ★ ATHLETICS increased to Level 4! ★
```

**Skills Component in hud-system.js around line 58:**
```javascript
// Display active skill bonuses
const skills = player.getComponent('SkillsComponent');
if (skills) {
    const activeSkills = [];
    if (skills.marksmanship > 0) activeSkills.push(`Mark+${skills.marksmanship * 2}%`);
    if (skills.precision > 0) activeSkills.push(`Prec+${skills.precision * 3}%`);
    if (skills.athletics > 0) activeSkills.push(`Ath+${Math.floor(skills.athletics * 0.5)}`);

    if (activeSkills.length > 0) {
        document.getElementById('hud-skills').textContent =
            `Skills: ${activeSkills.join(' ')}`;
    }
}
```

---

