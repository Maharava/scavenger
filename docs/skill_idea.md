# Skill System - Final Design (Non-Combat Focus)

This document defines the complete non-combat skill system for Scavenger. All skills range from Level 0 (untrained) to a maximum level, with natural progression often capped.

---

## Core Skills

There are **4 non-combat skills** that integrate with survival and crafting systems:

### 1. Medical
- **Effect:** Increases the natural daily healing rate of body parts by a flat +1% per skill level.
- **Maximum Natural Level:** 3
- **Leveling Trigger:** Has a chance to increase once per day, checked only on days where at least one body part has naturally healed (i.e., you were damaged and time passed).
- **Advanced Levels:** Further ranks must be learned from specific tools or interactables (e.g., medical terminals, textbooks).
- **Note:** This skill only affects natural regeneration. It does **not** boost healing from Medkits or Auto-Docs.

### 2. Cooking
- **Effect:** Unlocks the ability to craft advanced food recipes. Each recipe will have a minimum Cooking skill requirement.
- **Maximum Natural Level:** 5
- **Leveling Trigger:** Has a chance to increase once per day, checked only on days where the player has cooked at least one meal.

### 3. Farming
- **Effect:** Increases the growth speed of plants in the hydroponics bay and reduces the chance of plant failure.
- **Maximum Natural Level:** 3
- **Leveling Trigger:** Has a chance to increase each time you harvest from a hydroponics tray. The check can occur a maximum of three times per day, but the skill can only level up once per day.
- **Advanced Levels:** Further ranks must be learned from specific tools or interactables.

### 4. Repair
- **Effect:** Allows the player to fix broken interactables. Each broken item will have a minimum Repair skill requirement.
- **Maximum Natural Level:** 3
- **Leveling Trigger:** Has a chance to increase each time you successfully repair a broken item or piece of equipment. The skill can only level up once per day.
- **Advanced Levels:** Further ranks must be learned from specific tools or interactables.

---

## Leveling Mechanics

### Trigger Conditions

Skills use a **trigger-based system**. Level-up eligibility is checked based on performing specific actions.

| Skill | Trigger Requirement | Check Frequency |
|-------|-------------------|-----------------|
| **Medical** | Heal at least 1% on any body part via natural regeneration | Once per day |
| **Cooking** | Cook at least one meal | Once per day |
| **Farming** | Harvest from a hydroponics tray | Up to 3 times/day (1 level/day max) |
| **Repair** | Successfully repair a broken item | Once per repair (1 level/day max) |

**Check Timing:** Skill checks for Medical and Cooking happen at the end of each day. Farming and Repair checks happen immediately after the action.

### Level-Up Chances

When a skill's trigger condition is met, roll for level-up with these base chances:

| Transition | Base Chance | High Stress (>60) Penalty |
|-----------|-------------|---------------------------|
| L0 → L1 | 25% | 12.5% (halved) |
| L1 → L2 | 20% | 10% (halved) |
| L2 → L3 | 15% | 7.5% (halved) |
| L3 → L4 | 7% | 3.5% (halved) |
| L4 → L5 | 5% | 2.5% (halved) |

### Learning Constraints

- **Stress Constraint (ALL Skills):** When stress > 60, **all level-up chances are halved**. This represents the inability to learn effectively under extreme duress.

---

## Skill Regression (Death Penalty)

### On Player Death

When the player dies, they suffer skill loss:

1. **Select 2 Random Skills** with level > 0.
   - If the player has fewer than 2 skills > 0, select all available.
   - Each selected skill rolls independently.

2. **Loss Chance Per Skill:**
   - Formula: `25% + (skill_level × 10%)`
   - Examples:
     - Level 1: 35% chance to regress to Level 0
     - Level 3: 55% chance to regress to Level 2
     - Level 5: 75% chance to regress to Level 4

3. **Loss Amount:** Always lose exactly 1 level.

---

## Display & UI

### Equipment Screen Integration ('C' Key)

The skill overview is not on the main HUD. Instead, it is displayed as part of the **Equipment Screen** (accessed via the 'C' key). It should appear below the equipped items list.

```
┌─ EQUIPMENT & SKILLS ───────────────────────────┐
│                                                   │
│ Hand:  Rusty Pistol                               │
│ Body:  Scrap Armor                                │
│ Tool 1: Torch                                     │
│ Tool 2: Empty                                     │
│                                                   │
├─ SKILLS ─────────────────────────────────────────┤
│                                                   │
│ ├─ Medical     [●●○○○] Lv 2 (Heal Rate +2%)      │
│ ├─ Cooking     [●●●●●] Lv 5 (Master Chef)        │
│ ├─ Farming     [●○○○○] Lv 1 (Growth Speed +5%)   │
│ └─ Repair      [●●●○○] Lv 3 (Expert Technician)  │
│                                                   │
└───────────────────────────────────────────────────┘
```

**Display Rules:**
- No progress bars. Leveling is meant to feel organic, not like grinding an XP bar.
- Show the current level and a brief summary of the primary bonus.

### Level-Up Notification

When a skill increases:

```
★ MEDICAL increased to Level 2! ★
Daily healing rate +2%
```

- Display for 3 seconds in **cyan color**.

---

## Implementation Notes

### SkillsComponent Structure

```javascript
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
```

### Skills System Logic

Create `systems/skills-system.js` to handle:

1. **Track skill usage triggers.**
2. **End-of-day level-up checks** for Medical and Cooking.
3. **Action-based level-up checks** for Farming and Repair.
4. **Death regression.**
5. **Reset daily triggers** at the start of a new day.

### Integration Points

| File | Change Required |
|------|----------------|
| `components.js` | Update `SkillsComponent` to the new skills. |
| `world-builder.js` | Add the new `SkillsComponent` to the player entity. |
| `systems/skills-system.js` | **NEW** - Create the entire system for leveling and death. |
| `systems/time-system.js` | Apply `Medical` skill bonus to healing rate. Set `hasHealedToday` trigger. |
| `handlers/menu-actions.js` | Add skill display to the 'view_equipment' action. Trigger `Cooking` and `Repair` level-up checks. |
| `game.js` | Register `skills-system.js` in the main loop. |
| `config/game-constants.js` | Update `SKILL_DEATH_REGRESSION_COUNT` to 2. Add any new constants. |
| `systems/input-system.js` | Remove the 'K' key handler for the old skills screen. |

---

## Design Philosophy

1. **Organic Progression:** Skills are improved by doing, not by grinding XP.
2. **Utility-Focused:** Skills unlock new capabilities and improve efficiency rather than providing direct combat power.
3. **Soft Caps:** Natural progression is limited, encouraging players to seek out rare knowledge (tools, books, trainers) for mastery.
4. **Death Matters:** Dying can cost significant skill progress, making survival paramount.
5. **Integrated with other systems:** The skills are designed to hook into future systems like crafting, hydroponics, and world interaction.