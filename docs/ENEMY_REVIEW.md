# Enemy System Review & Gap Analysis

**Date:** 2025-12-11
**Status:** Review Complete

## 1. Executive Summary
The Scavenger enemy system is currently in a **proto-state**. The infrastructure for **humanoid gun-combat** is robust, utilizing a detailed loadout system for weapons and armor. However, the systems required for **Robots, Aliens, and Aberrants** are largely missing. Specifically, the game lacks a **Melee Combat System**, **Status Effects**, and **Complex AI Behaviors**, rendering non-humanoid enemies effectively impossible to implement in the current engine.

## 2. Implementation Status

| Enemy Type | Code Existence | Functional? | Issues |
| :--- | :--- | :--- | :--- |
| **Scavengers** | `creatures.js` | ✅ Yes | Fully functional. Uses `resolveShoot` and basic cover/range AI. |
| **Robots** | `creatures.js` | ❌ No | `SCOUT_DRONE` and `SECURITY_BOT` exist but have `weapon: null`. **They cannot attack** because there is no melee logic. |
| **Aliens** | None | ❌ No | Planned in docs, zero implementation. |
| **Aberrants** | None | ❌ No | Planned in docs, zero implementation. |

### Current AI Capabilities
The `CombatAISystem` is extremely basic, supporting only three behaviors:
- `aggressive`: Move closer or shoot.
- `defensive`: Maintain range or shoot.
- `fleeing`: Move away.

**Critical Limitation:** The AI only attempts to attack if `hasWeapon` is true and `resolveShoot` is called. There is no logic for melee attacks, special abilities, or area-of-effect attacks.

## 3. Documentation vs. Code Discrepancies

### Robots
- **Docs:** Describe 6 specialized classes ("Anti-Alien Doctrines") like **Breacher** (Shotgun/Melee), **Jammer** (Debuffs), **Sentinel** (Sniper), etc.
- **Code:** Implements 2 generic placeholders: `SCOUT_DRONE` and `SECURITY_BOT`. neither matches the documentation's design.

### Aliens & Aberrants
- **Docs:** Describe complex biological threats with unique mechanics:
    - **Phasing** (immune to damage for turns).
    - **Terrain Hazards** (acid/crystals on floor).
    - **Forced Movement** (Harpooner pulling player).
    - **On-Death Effects** (Exploding).
- **Code:** The engine currently supports **none** of these features.

## 4. Critical Engine Gaps

To implement the enemies as designed in `docs/`, the following systems must be built:

### A. Melee Combat System
*   **Requirement:** `ActionResolutionSystem` needs a `resolveMelee(attacker, target)` function.
*   **AI Update:** `CombatAISystem` needs logic to choose melee attacks when adjacent to the player.
*   **Beneficiaries:** Aliens (Stalker, Amalgam), Robots (Breacher, Berserker).

### B. Status Effect System
*   **Requirement:** A way to apply and tick buffs/debuffs on entities (e.g., `Confusion`, `AccuracyDown`, `Toxin`).
*   **Beneficiaries:** Jammer (Robot), Screecher (Alien), Ruptured (Aberrant).

### C. Terrain Hazard System
*   **Requirement:** Logic for tiles that damage/debuff entities standing on them.
*   **Beneficiaries:** Corroder (Alien), The Bloom (Aberrant).

### D. Advanced AI Behaviors
*   **Requirement:** AI that can use "Skills" or "Items", not just Shoot/Move.
*   **Beneficiaries:** Watcher (Telegraphed beam), Harpooner (Pull).

## 5. Recommendations

1.  **Phase 1: The Melee Update**
    *   Implement `resolveMelee` in `ActionResolutionSystem`.
    *   Update `CombatAISystem` to use melee.
    *   **Goal:** Make the existing Robots (`SECURITY_BOT`) dangerous by giving them a melee slam, and implement the first Alien (`Stalker`).

2.  **Phase 2: The Robot Overhaul**
    *   Rename/Refactor existing robots to match the "Anti-Alien Doctrine" in docs.
    *   Give `SCOUT_DRONE` a weak laser or taser (ranged) to make it functional immediately.

3.  **Phase 3: The Hazard Update**
    *   Implement Status Effects and Terrain Hazards.
    *   **Goal:** Enable the "Corroder" and "Jammer" archetypes.
