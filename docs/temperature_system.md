# Temperature System Design

**⚠️ STATUS: NOT IMPLEMENTED - This is a design document for a future feature**

**Current Implementation:** Area temperatures are defined in map data, and armor has temperature stat modifiers (tempMin/tempMax), but the temperature system itself is not active. No environmental effects are currently applied to the player.

---

## Overview
The temperature system affects player comfort, stats, and can lead to damage or death if the player is exposed to extreme temperatures for too long.

## Base Mechanics

### Comfortable Temperature Range
- **Base Range**: 10°C to 30°C (configurable per creature)
- **Modified by Equipment**: Armor can expand this range
  - `tempMin` modifier: Reduces minimum comfortable temp (e.g., +10 makes 10°C → 0°C comfortable)
  - `tempMax` modifier: Increases maximum comfortable temp (e.g., +10 makes 30°C → 40°C comfortable)

### Temperature Zones
Based on how far outside the comfort range the current temperature is:

| Zone | Temperature Range | Effects |
|------|------------------|---------|
| **Comfortable** | Within comfort range | No negative effects |
| **Harsh** | 1-20°C outside range | +1 stress/min, -10 comfort, -5% to all stats |
| **Extreme** | 21+°C outside range | +4 stress/min, -25 comfort, -20% to all stats, 2 damage/min to random body parts, risk of death |

## Detailed Effects

### Comfortable (Within comfort range)
- **Stress**: No change
- **Comfort**: Baseline (100)
- **Stat Penalty**: None
- **Message**: None
- **Visual**: Normal

### Harsh (1-20°C outside range)
- **Stress**: Increases moderately (+1 per minute)
- **Comfort**: Decreases to 90
- **Stat Penalty**: -5% to all effectiveness (hunger regeneration, rest effectiveness)
- **Body Part Damage**: None
- **Message**: "The temperature is uncomfortable."
- **Visual**: Slight color tint (blue for cold, orange for hot)
- **Recovery**: Gradual recovery when returning to comfort zone

### Extreme (21+°C outside range)
- **Stress**: Increases rapidly (+4 per minute)
- **Comfort**: Decreases to 75
- **Stat Penalty**: -20% to all effectiveness
- **Body Part Damage**: 2 damage per minute to weighted-random body parts
  - Cold: Limbs more likely (reduced circulation)
  - Heat: Head and torso more likely (heat exhaustion)
- **Death Risk**: If stress reaches 100 or body parts reach 0%, death occurs
- **Message**: "You are dying from exposure!"
- **Visual**: Strong color tint, pulsing effects, screen shake

## Temperature Types

### Cold Damage Priority (weighted body parts)
When exposed to extreme cold, damage prioritizes extremities:
- Limbs: 70% (reduced circulation affects extremities)
- Torso: 20% (core stays warmer)
- Head: 10% (protected by blood flow)

### Heat Damage Priority (weighted body parts)
When exposed to extreme heat, damage affects core and head:
- Head: 35% (heat exhaustion, dehydration)
- Torso: 50% (core temperature rises)
- Limbs: 15% (better heat dissipation)

## Recovery

### Temperature Recovery
When returning to comfortable temperature:
- **Comfort**: Recovers at +5 per minute until baseline
- **Stress**: Recovers at -2 per minute until baseline
- **Stats**: Return to normal immediately
- **Body Parts**: Do not auto-heal (requires medical items/rest)

### Death Prevention
Players have warning time before death:
1. **Warning at 70% stress**: "You need to find shelter soon!"
2. **Critical at 90% stress**: "You are on the brink of death from exposure!"
3. **Death at 100% stress OR any body part at 0%** (simplified)

## Armor Integration

### Stat Calculation
Armor's temperature stats are calculated from components:
- **Underlay**: Primary temperature modifier (±5 to ±20 per temp zone)
- **Material**: Minor temperature modifier (±2 to ±10 per temp zone)
- **Overlay**: Minimal temperature modifier (±1 to ±5 per temp zone)

### Example Armor Build
**Arctic Explorer Suit**:
- Underlay: Thermal Underlay (tempMin: +15, tempMax: +5)
- Material: Composite Material (tempMin: +5, tempMax: +5)
- Overlay: Reflective Overlay (tempMin: +2, tempMax: +3)
- **Total**: Min comfort: 10 - 22 = -12°C, Max comfort: 30 + 13 = 43°C
- **Comfortable Range**: -12°C to 43°C

## Implementation Notes

### System Responsibilities
1. **TemperatureSystem** (new): Calculate temperature effects each frame
2. **HudSystem**: Display current temperature and comfort indicators
3. **DamageSystem** (future): Apply temperature-based body part damage
4. **MessageSystem**: Show temperature warnings

### Update Frequency
- **Temperature Check**: Every 5 seconds (not every frame)
- **Damage Application**: Every 60 seconds (1 minute intervals)
- **Stress/Comfort Updates**: Continuous (every frame, small increments)

### Save Data
Temperature effects are transient and reset when:
- Player enters a new area
- Player changes equipment
- Area temperature changes

### Future Enhancements
- Weather systems affecting ambient temperature
- Gradual temperature changes in areas
- Temperature zones within a single map
- Frostbite/heatstroke status effects with lasting penalties
- Temperature-affecting consumables (hot coffee, ice packs)
