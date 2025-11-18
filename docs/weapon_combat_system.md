# Weapon Combat System

## Overview

The weapon combat system is built around modular weapon customization, where each weapon part contributes specific stats to the overall weapon performance. This creates meaningful choices and trade-offs for the player.

## Core Stats

### Chamber Stats
The chamber defines the fundamental damage characteristics of a weapon:
- **Damage Type**: kinetic, energy, toxin, or radiation
- **Damage Amount**: Base damage dealt on hit (10-18 typical range)
- **Penetration**: Multiplier affecting how well damage bypasses armor (base 1.0)

**Penetration Mechanics:**
- Values < 1.0: Armor is MORE effective (e.g., 0.8 pen = armor resistance increased by 25%)
- Values > 1.0: Armor is LESS effective (e.g., 1.2 pen = armor resistance reduced by ~17%)
- Formula: `Effective Armor = Armor Resistance / Penetration`

**Chamber Examples:**
- Basic Chamber: 12 damage, 1.0 penetration (balanced)
- Reinforced Chamber: 18 damage, 1.2 penetration (armor-piercing)
- Lightweight Chamber: 10 damage, 0.8 penetration (lightweight, less effective)

### Barrel Stats
The barrel modifies damage output and determines accuracy and range:
- **Damage Amount Modifier**: Adds or subtracts from chamber damage (-2 to +2)
- **Penetration Multiplier**: Multiplies chamber penetration (0.85 to 1.1)
- **Range**: Effective range in tiles (3-8 tiles)
- **Accuracy Modifier**: Adjusts hit chance percentage (-8 to +15)

**Barrel Examples:**
- Long Barrel: +2 damage, 1.1 pen mult, 8 range, +10 accuracy (sniper build)
- Compact Barrel: -2 damage, 0.85 pen mult, 3 range, -8 accuracy (close quarters)
- Rifled Barrel: +1 damage, 1.05 pen mult, 6 range, +15 accuracy (accuracy focused)

### Grip Stats
The grip affects weapon handling and user comfort:
- **Accuracy Modifier**: Adjusts hit chance percentage (-5 to +8)
- **Comfort Penalty**: Penalty applied to wielder's comfort each time fired (-3 to 0)

**Base Accuracy**: All weapons start at 70% hit chance before modifiers.

**Grip Examples:**
- Ergonomic Grip: +3 accuracy, 0 comfort penalty (comfortable extended use)
- Textured Grip: +8 accuracy, -1 comfort penalty (best control, slightly harsh)
- Compact Grip: -5 accuracy, -3 comfort penalty (lightweight but uncomfortable)

### Weapon Modifications
Optional mods provide additional customization:
- **Pistol Mods** (mod_pistol): Compact accessories for pistols
- **Rifle Mods** (mod_rifle): Larger accessories for rifles

**Examples:**
- Pistol Laser Sight: +12 accuracy
- Rifle Scope: +20 accuracy, +5 range
- Rifle Bipod: +10 accuracy, +2 comfort (reduces penalty)

## Pistol vs Rifle Differences

### Pistols
**Characteristics:**
- Light weight (400g base)
- Lower damage output (10-18 base from chambers)
- Shorter effective range (3-6 tiles typical)
- Better for close-quarters combat
- Lower comfort penalties overall
- Accepts mod_pistol accessories

**Strengths:**
- Mobility (lower weight)
- Faster handling
- Less fatiguing to use
- Good backup weapon

**Weaknesses:**
- Limited range
- Lower damage
- Less armor penetration options

**Recommended Builds:**
1. **Close Quarters**: Compact Barrel + Textured Grip + Laser Sight
2. **Balanced**: Basic Barrel + Ergonomic Grip + Suppressor
3. **Accurate**: Rifled Barrel + Rubber Grip + Laser Sight

### Rifles
**Characteristics:**
- Heavy weight (800g base)
- Higher damage potential (12-20+ with mods)
- Longer effective range (5-13 tiles with scope)
- Better armor penetration options
- Higher comfort penalties
- Accepts mod_rifle accessories

**Strengths:**
- Superior range
- Higher damage output
- Better armor penetration
- Excellent with scope/bipod mods

**Weaknesses:**
- Heavy (inventory management)
- More fatiguing (higher comfort penalties)
- Slower to handle

**Recommended Builds:**
1. **Sniper**: Long Barrel + Textured Grip + Scope + Bipod
2. **Assault**: Rifled Barrel + Ergonomic Grip + Suppressor
3. **Marksman**: Basic Barrel + Ergonomic Grip + Scope

## Comfort System Integration

### Firing Penalties
Every time a weapon is fired, the wielder's comfort is reduced by the weapon's comfort penalty:
- Basic grips: -2 comfort per shot
- Comfortable grips: -1 or 0 comfort per shot
- With bipod/stabilizers: reduced penalties

### Comfort Impact on Stress
- Comfort ≤ 30: Stress increases by +1 every 30 seconds
- Comfort ≥ 80: Stress decreases by -1 every 30 seconds
- Base comfort: 50 (neutral)

### Tactical Considerations
1. **Weapon Choice**: Ergonomic grips for extended firefights
2. **Mods Matter**: Suppressors and bipods reduce firing stress
3. **Rest Between Engagements**: Let comfort recover before stress penalties kick in
4. **Comfort Modifiers**: Environmental effects stack with weapon penalties

## System Improvements & Design Philosophy

### 1. Modular Granularity
**Improvement**: Each weapon part has a specific role rather than generic stat bonuses.
- Chamber = ammunition type (damage profile)
- Barrel = ballistics (range, accuracy)
- Grip = handling (user interface)
- Mods = specialization (tactical choices)

**Benefit**: Players understand what each part does intuitively.

### 2. Meaningful Trade-offs
**Examples:**
- Long barrels: Better range/accuracy but heavier
- Suppressors: Quieter firing but reduced damage
- Compact parts: Lighter but less effective

**Benefit**: No "strictly better" options; choices depend on playstyle and situation.

### 3. Penetration Reverse Scaling
**Implementation**: Instead of "armor piercing damage," penetration modifies armor effectiveness.
- More realistic (bullets don't ignore armor, they overcome it)
- Creates interesting math (0.8 pen makes 50% armor → 62.5% effective)
- Scales well across all armor values

**Benefit**: Armor penetration feels impactful without being binary.

### 4. Comfort as Resource Management
**Innovation**: Weapon use depletes comfort over time, not just per-shot.
- Encourages tactical weapon choice (don't always use the most powerful gun)
- Creates emergent gameplay (knowing when to stop firing)
- Integrates with broader survival mechanics

**Benefit**: Adds strategic depth without adding complexity to combat itself.

### 5. Weapon Specialization
**Implementation**: Pistols and rifles have separate mod ecosystems.
- Prevents "universal best build"
- Encourages carrying multiple weapons
- Creates distinct playstyles

**Benefit**: Both weapon types remain relevant throughout the game.

## Potential Future Enhancements

### Short-term Improvements
1. **Energy Weapons**: Add chamber types for "energy" damage (lasers, plasma)
   - Different penetration profiles (energy ignores kinetic armor)
   - Heat management (comfort penalties from overheating)

2. **Burst Fire**: Some chambers could have multi-shot mechanics
   - Higher damage but increased comfort penalty
   - Accuracy penalty on subsequent shots

3. **Ammunition Scarcity**: Track ammo types based on chamber
   - Reinforced chambers use rare high-pressure rounds
   - Creates resource management tension

### Long-term Enhancements
1. **Weapon Durability**: Parts degrade with use
   - Incentivizes maintenance
   - Creates "favorite weapon" attachment
   - Adds risk to extended firefights

2. **Range Falloff**: Damage decreases beyond effective range
   - Makes range stat more important
   - Creates positioning gameplay
   - Rewards tactical approach

3. **Recoil Patterns**: Different grips have different recoil profiles
   - Skill-based accuracy improvements
   - More active combat engagement
   - Deeper mastery curve

4. **Smart Ammunition**: Mods that affect bullet behavior
   - Tracking rounds (bonus accuracy)
   - Explosive rounds (splash damage)
   - EMP rounds (anti-robot)

## Simplification Opportunities

### If System Feels Too Complex
1. **Merge Grip and Barrel**: Combine into "Frame" part
   - Sets range, accuracy, comfort penalty
   - Reduces part count from 3 to 2 required parts
   - **Trade-off**: Less granular customization

2. **Remove Penetration Multipliers from Barrels**: Only chambers set penetration
   - Simpler penetration math
   - Fewer stat interactions
   - **Trade-off**: Barrels become less interesting

3. **Standardize Comfort Penalties**: All grips have -2 penalty, mods can reduce
   - Removes comfort consideration from grip choice
   - Focuses grip choice on accuracy
   - **Trade-off**: Less variety in playstyle

## Statistical Balance Reference

### Damage Ranges
- **Pistol Low**: 10-12 damage (lightweight chambers, compact barrels)
- **Pistol Medium**: 13-16 damage (standard chambers, basic barrels)
- **Pistol High**: 17-20 damage (reinforced chambers, long barrels)
- **Rifle Low**: 12-15 damage (same parts as pistol low)
- **Rifle Medium**: 16-19 damage (same parts as pistol medium)
- **Rifle High**: 20-25 damage (same parts as pistol high, better mods)

### Accuracy Ranges
- **Minimum**: 50% (base 70 - 8 compact barrel - 5 compact grip - 7 from penalties)
- **Typical Low**: 60-65% (basic parts)
- **Typical High**: 75-85% (good parts, no mods)
- **Maximum**: 95-100% (optimal build with scope/laser sight)

### Range Benchmarks
- **Knife Fighting**: 1-2 tiles
- **Pistol Range**: 3-6 tiles
- **Mid Range**: 7-10 tiles (long pistol barrel or basic rifle)
- **Sniper Range**: 11-15 tiles (rifle with scope)

### Penetration Impact
| Penetration | vs 50% Armor | vs 75% Armor | vs 90% Armor |
|-------------|--------------|--------------|--------------|
| 0.8         | 62.5% eff    | 93.8% eff    | 112.5% eff*  |
| 1.0         | 50.0% eff    | 75.0% eff    | 90.0% eff    |
| 1.2         | 41.7% eff    | 62.5% eff    | 75.0% eff    |
| 1.4         | 35.7% eff    | 53.6% eff    | 64.3% eff    |

\* Values over 100% would mean armor amplifies damage (could cap at 100% or allow for unique mechanics)

## Implementation Notes

### When Adding New Parts
1. **Chambers**: Focus on damage type variety (energy, toxin, radiation)
2. **Barrels**: Create niche use cases (stealth barrel, armor-piercing barrel)
3. **Grips**: Balance accuracy vs comfort (never both high)
4. **Mods**: Add utility (thermal vision, ammo counter) not just stat boosts

### Balance Philosophy
- No part should be "strictly better" than another at the same tier
- Higher-tier parts should have trade-offs (e.g., more damage but more weight)
- Every build archetype should be viable in some situation
- The "best" build should depend on the player's current situation

### Playtesting Focus
- Does weapon customization feel meaningful?
- Are there "trap" builds that are unusable?
- Do pistols and rifles both have clear roles?
- Is the comfort system too punishing or too lenient?
- Does the UI clearly communicate weapon stats?
