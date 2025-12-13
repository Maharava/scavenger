# Cooking System Design

**Created:** December 2024

This document outlines the complete cooking system including new ingredients, recipes, and implementation details.

---

## New Ingredients (Loot Only)

### Protein Sources
1. **Protein Paste**
   - Description: A thick paste made from concentrated meat proteins
   - Hunger: 4
   - Weight: 200g
   - Slots: 0.25
   - Appearance: Beige/tan colored paste

2. **Meat Chunk**
   - Description: Edible meat from an unknown creature
   - Hunger: 5
   - Weight: 400g
   - Slots: 0.5
   - Appearance: Reddish-brown chunk

3. **Nutrient Paste**
   - Description: A smooth paste made from plant proteins and nutrients
   - Hunger: 3
   - Weight: 200g
   - Slots: 0.25
   - Appearance: Green paste

### Alien/Sci-Fi Produce

4. **Voidberry**
   - Description: Dark berries that grow in zero-gravity environments
   - Hunger: 2
   - Weight: 120g
   - Slots: 0.25
   - Appearance: Deep purple/black berries
   - Flavor: Slightly sweet with a tart finish

5. **Luminroot**
   - Description: A bioluminescent root vegetable that glows faintly blue
   - Hunger: 3
   - Weight: 250g
   - Slots: 0.25
   - Appearance: Pale blue glowing root
   - Flavor: Slightly bitter, earthy

6. **Crystalfruit**
   - Description: Translucent fruit with a crystalline structure
   - Hunger: 2
   - Weight: 150g
   - Slots: 0.25
   - Appearance: Clear/translucent with faceted surface
   - Flavor: Very sweet, almost honey-like

---

## Recipe System

### Mechanics
- Cooking requires 2+ ingredients
- Water Canister can be used as an ingredient
- Multiple units of same ingredient allowed (e.g., 3x Rice)
- Recipes unlock at specific Cooking skill levels
- Cooking triggers `hasCookedToday` for skill progression
- Menu organized into: Basic (Tier 1-2), Intermediate (Tier 3-4), Advanced (Tier 5)

### Recipe Effects
- **Tier 1-2**: Restore hunger only (one Tier 2 recipe gives timed comfort buff)
- **Tier 3-4**: Restore hunger + secondary effect (comfort/stress/rest)
- **Tier 5**: All restore hunger + powerful secondary effect

---

## TIER 1 RECIPES (Skill Level 1)
**Theme:** Simple, recognizable meals using basic ingredients

### 1. Rice Patty
- **Ingredients:** 3x Rice
- **Effect:** Restores 6 hunger
- **Weight:** 600g
- **Slots:** 0.2
- **Description:** A simple patty made from compressed cooked rice

### 2. Lettuce Wrap
- **Ingredients:** 2x Lettuce, 1x Tomato
- **Effect:** Restores 5 hunger
- **Weight:** 600g
- **Slots:** 0.2
- **Description:** Fresh vegetables wrapped in crisp lettuce

### 3. Simple Salad
- **Ingredients:** 1x Lettuce, 1x Tomato, 1x Strawberry
- **Effect:** Restores 6 hunger
- **Weight:** 550g
- **Slots:** 0.25
- **Description:** A basic mixed salad with fresh berries

### 4. Steamed Soybeans
- **Ingredients:** 2x Soybeans, 1x Water Canister
- **Effect:** Restores 4 hunger
- **Weight:** 900g
- **Slots:** 0.3
- **Description:** Tender soybeans steamed to perfection

---

## TIER 2 RECIPES (Skill Level 2)
**Theme:** More complex meals, still familiar ingredients

### 1. Garden Soup ⭐ (Comfort Buff)
- **Ingredients:** 1x Lettuce, 1x Tomato, 1x Rice, 2x Water Canister
- **Effect:** Restores 10 hunger + Comfort +15 for 60 minutes
- **Weight:** 1450g
- **Slots:** 0.4
- **Description:** A hearty vegetable and rice soup

### 2. Tomato Rice Bowl
- **Ingredients:** 2x Rice, 2x Tomato, 1x Water Canister
- **Effect:** Restores 10 hunger
- **Weight:** 1400g
- **Slots:** 0.4
- **Description:** Seasoned rice mixed with cooked tomatoes

### 3. Berry Smoothie
- **Ingredients:** 3x Strawberry, 1x Water Canister
- **Effect:** Restores 6 hunger
- **Weight:** 800g
- **Slots:** 0.3
- **Description:** A refreshing blended berry drink

### 4. Soybean Stew
- **Ingredients:** 2x Soybeans, 1x Lettuce, 1x Water Canister
- **Effect:** Restores 6 hunger
- **Weight:** 1100g
- **Slots:** 0.35
- **Description:** A simple stew with beans and greens

---

## TIER 3 RECIPES (Skill Level 3)
**Theme:** Introduction to exotic ingredients

### 1. Alien Garden Bowl
- **Ingredients:** 1x Voidberry, 1x Lettuce, 1x Tomato, 1x Rice
- **Effect:** Restores 8 hunger + Comfort +10
- **Weight:** 820g
- **Slots:** 0.5
- **Description:** A colorful bowl mixing earthly greens with void-grown berries

### 2. Void Tea ☕ (Caffeine Effect)
- **Ingredients:** 2x Voidberry, 2x Water Canister
- **Effect:** Restores 4 hunger + Rest -15 (reduces tiredness)
- **Weight:** 1240g
- **Slots:** 0.4
- **Description:** A dark, energizing tea brewed from voidberries

### 3. Protein Salad
- **Ingredients:** 1x Protein Paste, 1x Lettuce, 1x Tomato, 1x Luminroot
- **Effect:** Restores 11 hunger + Comfort +10
- **Weight:** 900g
- **Slots:** 0.5
- **Description:** A nutritious salad enriched with protein paste and glowing root

---

## TIER 4 RECIPES (Skill Level 4)
**Theme:** Gourmet meals with specialized effects

### 1. Meat & Grain
- **Ingredients:** 1x Meat Chunk, 2x Rice, 1x Tomato
- **Effect:** Restores 15 hunger + Comfort +15
- **Weight:** 1150g
- **Slots:** 0.6
- **Description:** Grilled meat served over seasoned rice

### 2. Luminroot Soup 🧘 (Stress Reducer)
- **Ingredients:** 2x Luminroot, 1x Nutrient Paste, 2x Water Canister
- **Effect:** Restores 9 hunger + Stress -20
- **Weight:** 1700g
- **Slots:** 0.6
- **Description:** A calming soup with bioluminescent roots. The glow fades when consumed.

### 3. Crystal Preserve 🧘 (Stress Reducer)
- **Ingredients:** 3x Crystalfruit, 1x Strawberry
- **Effect:** Restores 8 hunger + Stress -15
- **Weight:** 550g
- **Slots:** 0.5
- **Description:** Crystalized fruit preserve with a soothing sweetness

---

## TIER 5 RECIPES (Skill Level 5)
**Theme:** Master-level cuisine with powerful effects

### 1. Gourmet Protein Bowl
- **Ingredients:** 1x Meat Chunk, 1x Protein Paste, 1x Rice, 1x Luminroot, 1x Tomato
- **Effect:** Restores 20 hunger + Comfort +20
- **Weight:** 1400g
- **Slots:** 0.8
- **Description:** A perfectly balanced meal combining proteins, grains, and vegetables

### 2. Exotic Fruit Medley
- **Ingredients:** 2x Voidberry, 2x Crystalfruit, 1x Strawberry, 1x Water Canister
- **Effect:** Restores 10 hunger + Stress -25
- **Weight:** 1090g
- **Slots:** 0.7
- **Description:** A luxurious fruit blend with stress-relieving properties

### 3. Survival Ration Supreme
- **Ingredients:** 1x Meat Chunk, 1x Nutrient Paste, 1x Soybeans, 1x Rice, 1x Luminroot
- **Effect:** Restores 18 hunger + Rest +20
- **Weight:** 1400g
- **Slots:** 0.8
- **Description:** The ultimate survival meal, designed to restore both hunger and energy

---

## Recipe Summary

| Tier | Recipes | Ingredients | Primary Effect | Secondary Effect |
|------|---------|-------------|----------------|------------------|
| 1 | 4 | 2-3, basic only | Hunger (4-6) | None |
| 2 | 4 | 3-4, basic only | Hunger (6-10) | 1 with comfort buff |
| 3 | 3 | 3-4, any | Hunger (4-11) | Comfort or rest |
| 4 | 3 | 3-4, any | Hunger (8-15) | Comfort or stress |
| 5 | 3 | 5, any | Hunger (10-20) | Powerful effects |

**Total Recipes:** 17

---

## Stove Interactable

### Properties
- **Character:** 'S'
- **Color:** Orange (#ff6600)
- **Solid:** Yes
- **Script:** openStoveMenu
- **Buildable:** Yes

### Build Cost
- 5x Salvaged Components
- 3x Basic Electronics
- 3x Polymer Resin

### Functionality
- Opens cooking menu when interacted with
- Menu shows available recipes based on Cooking skill level
- Organized into Basic / Intermediate / Advanced sections
- Each recipe shows:
  - Required ingredients (with quantities)
  - Available quantity you can make
  - Effect description
  - Greyed out if ingredients missing

---

## Skill Progression

### Cooking Skill Leveling
- **Trigger:** Cooking any recipe sets `hasCookedToday = true`
- **Daily Check:** Midnight check for skill progression
- **Level Caps:**
  - Natural cap: Level 5
  - No equipment extends Cooking skill
- **Stress Penalty:** Learning chance halved if stress > 60

### Unlock Progression
- **Level 1:** Start with 4 basic recipes
- **Level 2:** Unlocks 4 more recipes (8 total)
- **Level 3:** Unlocks 3 intermediate recipes (11 total)
- **Level 4:** Unlocks 3 advanced recipes (14 total)
- **Level 5:** Unlocks 3 master recipes (17 total)

---

## Implementation Checklist

- [ ] Add 6 new food items to gamedata/food.js
- [ ] Create gamedata/cooking-recipes.js with all 17 recipes
- [ ] Add Stove to gamedata/buildables.js
- [ ] Add Stove to gamedata/interactables.js
- [ ] Create `openStoveMenu` script in handlers/script-registry.js
- [ ] Create `cook_recipe` action in handlers/menu-actions.js
- [ ] Add cooking skill progression trigger
- [ ] Test all recipes
- [ ] Test skill leveling

---

## Balance Notes

### Ingredient Rarity
- **Common (Hydroponics):** Lettuce, Rice, Tomato, Strawberry, Soybeans
- **Uncommon (Loot):** Protein Paste, Nutrient Paste, Voidberry, Luminroot, Crystalfruit
- **Rare (Loot):** Meat Chunk
- **Resource:** Water Canister (refillable at ship)

### Recipe Value Analysis
- Tier 1 recipes use 2-3 common ingredients (hydroponics-friendly)
- Tier 2 recipes introduce soups/smoothies (water usage)
- Tier 3+ recipes require exotic ingredients (encourages expeditions)
- Tier 5 recipes require 5 ingredients (material investment)

### Weight/Slots Balance
- Lighter meals (0.2-0.4 slots) for quick hunger restoration
- Heavier meals (0.6-0.8 slots) provide additional benefits
- Soups/smoothies heavier due to water content
- Tier 5 meals largest investment in inventory space

---

**End of Design Document**
