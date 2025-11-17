### 1. Damage Calculation (Weapons)

We need a way for weapons to actually *do* damage, right?

*   **`WeaponStatsComponent` (New Component):** Let's create a dedicated component for weapons. This would live on the weapon entity and define its core offensive capabilities:
    ```javascript
    // On a weapon entity (e.g., a rifle)
    {
        type: 'Gun',
        baseDamage: 15,
        damageType: 'Physical', // e.g., Physical, Energy, Radiation, Fire
        range: 5,
        accuracy: 0.8,
        fireRate: 1 // Attacks per turn/second
    }
    ```
*   **`StatModifierComponent` on Weapon Parts:** This is where modularity shines! A "Long Barrel" part attached to a rifle could have a `StatModifierComponent` that modifies the weapon's `range` and `accuracy`. A "High-Caliber Chamber" could boost `baseDamage`.
    ```javascript
    // On a weapon part entity (e.g., a Long Barrel)
    {
        modifiers: {
            weaponRange: 2,
            weaponAccuracy: 0.1
        }
    }
    ```
*   **`DamageCalculationSystem` (New System):** This system would be responsible for taking an attacking entity and its equipped weapon, aggregating all the `WeaponStatsComponent` values and `StatModifierComponent`s from its parts, and calculating the *raw* damage output. It would also consider the attacker's own stats (e.g., a player's 'strength' or 'dexterity' from `CreatureStatsComponent` could further modify damage).

### 2. Defense Calculation (Armour)

Now, how do we make sure our scavenger doesn't just melt?

*   **`ArmourStatsComponent` (New Component):** Similar to weapons, armour needs its own stats. This would define its defensive properties:
    ```javascript
    // On an armour entity (e.g., a Chest Plate)
    {
        type: 'BodyArmour',
        baseDefense: 10,
        resistance: { // Damage type resistances
            Physical: 0.2, // Reduces physical damage by 20%
            Energy: 0.1
        },
        durability: 100 // Armour could degrade
    }
    ```
*   **`StatModifierComponent` on Armour Parts:** A "Ceramic Plate" part could add to `baseDefense` or `Physical` resistance. A "Radiation Lining" part could boost `Radiation` resistance.
    ```javascript
    // On an armour part entity (e.g., Ceramic Plate)
    {
        modifiers: {
            armourDefense: 5,
            physicalResistance: 0.05
        }
    }
    ```
*   **`DefenseCalculationSystem` (New System):** This system would take the *raw* damage calculated by the `DamageCalculationSystem` and the target's equipped armour (and its parts' modifiers). It would then apply the `baseDefense` and `resistance` values to reduce the incoming damage, resulting in the *final* damage taken.

### 3. Applying Damage & Health Management

Once we know the final damage, we need to apply it!

*   **`DamageEventComponent` (New Temporary Component):** When an entity takes damage, we don't immediately modify its health. Instead, we add a temporary `DamageEventComponent` to it.
    ```javascript
    // Added to a creature entity that just took damage
    {
        amount: 12,
        damageType: 'Physical',
        sourceEntityId: 123 // Who dealt the damage
    }
    ```
*   **`HealthSystem` (New System):** This system would run every frame (or turn). It would look for any entities with a `DamageEventComponent`. For each one, it would:
    1.  Subtract the `amount` from the entity's `CreatureStatsComponent.health`.
    2.  Remove the `DamageEventComponent`.
    3.  Check if health is <= 0. If so, trigger a 'death' event (e.g., add a `DeathEventComponent` or `DeadComponent`).
    4.  Handle any other effects, like displaying damage numbers or playing hit animations.

### 4. Combat Flow (Turn-Based Example)

Given it's a rogue-like, a turn-based approach makes sense.

1.  **Player/AI Action:** An entity decides to attack another.
2.  **`AttackActionComponent` (New Temporary Component):** The attacking entity gets an `AttackActionComponent` added to it:
    ```javascript
    {
        targetEntityId: 456, // The ID of the creature being attacked
        weaponEntityId: 789 // The ID of the equipped weapon
    }
    ```
3.  **`CombatSystem` (New System):** This system would process `AttackActionComponent`s:
    *   It would use the `DamageCalculationSystem` to determine the raw damage from the `weaponEntityId`.
    *   It would then use the `DefenseCalculationSystem` to determine the final damage to the `targetEntityId`.
    *   Finally, it would add a `DamageEventComponent` to the `targetEntityId` with the final damage amount.
    *   It would also handle things like checking for hit/miss based on accuracy, critical hits, etc.
    *   After processing, it removes the `AttackActionComponent`.
4.  **`HealthSystem` Processes Damage:** The `HealthSystem` then picks up the `DamageEventComponent` and updates the target's health.

### 5. Other Considerations

*   **`EquipmentSystem` (New System):** This system would manage equipping and unequipping items. When an item is equipped, it would apply its `StatModifierComponent`s (and those of its parts) to the player's `CreatureStatsComponent`. When unequipped, it would remove them.
*   **Damage Types & Resistances:** Having different `damageType`s (Physical, Energy, Fire, etc.) and corresponding `resistance` values on `ArmourStatsComponent` and `CreatureStatsComponent` allows for strategic combat and enemy variety.
*   **Status Effects:** We could introduce `StatusEffectComponent`s (e.g., `Poisoned`, `Burning`, `Stunned`) that systems would process each turn, applying ongoing damage or debuffs.