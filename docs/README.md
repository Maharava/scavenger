# Scavenger Game Documentation

This directory contains design documents, implementation guides, and modding references for the Scavenger game.

## 📊 Project Status

- **[Implementation Status](IMPLEMENTATION_STATUS.md)** - What's implemented, partial, and missing
- **[Future Ideas](FUTURE_IDEAS.md)** - Comprehensive list of planned features and enhancements
- **[Current To-Do](../todo.md)** - Active development priorities

Start here to understand the current state of the game and what's planned next.

## Quick Start for Modders

### Adding New Content

| What to Add | Documentation |
|-------------|---------------|
| **Producer (Smelter, Recycler, etc.)** | [Producer System Guide](producer_system_guide.md) + [Complete Example](producer_example.md) |
| Creature/Enemy | [Enemy Implementation](enemy_imp.md), [Aliens](aliens_imp.md), [Aberrants](aberrants_imp.md) |
| Interactable | [Interactable Ideas](interactable_ideas.md), [Interactables](interactables.md) |
| Combat System Changes | [Combat Plan](combat_plan.md), [Weapon System](weapon_combat_system.md) |
| Skills | [Skill System](skill_idea.md) |

## Core Systems

### Implemented Systems

- **Producer System** ([Guide](producer_system_guide.md) | [Example](producer_example.md))
  - NEW: Deadline-based production system (efficient, works while off-ship)
  - Generic framework for time-based item transformation (hydroponics, smelters, recyclers)
  - Skill bonuses reduce production time at midnight (2% per level)
  - Supports multiple outputs, variable yields, off-ship tracking
  - Modder-friendly with data-driven recipes

- **Skill System** ([skill_idea.md](skill_idea.md))
  - Medical, Cooking, Farming, Repair skills
  - Natural level caps (0-3) with tool/equipment extensions
  - Daily and action-based skill checks

- **Combat System** ([combat_plan.md](combat_plan.md) | [weapon_combat_system.md](weapon_combat_system.md))
  - Turn-based action point system
  - Multiple damage types (kinetic, energy, toxin, radiation)
  - Weapon modifications and attachments

- **Lighting System** ([lighting_system.md](lighting_system.md))
  - Dynamic light sources
  - Line-of-sight calculations
  - Tool-based illumination

- **Tool System** ([tool_system_plan.md](tool_system_plan.md))
  - Equipment-based stat bonuses
  - Skill boosts and special abilities
  - Light radius and weight modifiers

- **Temperature System** ✅ ([temperature_system.md](temperature_system.md))
  - NEW: Fully implemented (December 2024)
  - 3 temperature zones (comfortable/harsh/extreme)
  - Comfort and stress effects
  - Body part damage in extreme conditions
  - Armor temperature modifier integration

- **Death/Permadeath System** ✅
  - Player death with consequences
  - Skill regression (2 random skills)
  - Return to ship after 3 seconds
  - Health and stat restoration

- **Ship Cargo System** ✅
  - NEW: Fully implemented (December 2024)
  - 20-slot expandable cargo hold
  - Deposit/withdraw items from ship inventory
  - Producer integration (use seeds from cargo)
  - Full save/load persistence

- **ECS Architecture** ([ecs_design.md](ecs_design.md))
  - Entity-Component-System pattern
  - Component and system organization
  - Query-based entity access

### Planned/In-Progress Systems

- **Crafting System** ([crafting_mat.md](crafting_mat.md))
  - Material collection and storage
  - Recipe system with skill requirements
  - Workbench-based crafting

- **Module System** ([module_system.md](module_system.md))
  - Weapon and armor modification slots
  - Attachment-based stat bonuses

## Game Design

- [Game Idea](game_idea.md) - Core concept and vision
- [HUD and Stats](hud_and_stats.md) - UI design
- [Future Map Ideas](future_map_ideas.md) - Procedural generation plans
- [Location/Room Ideas](loc_room_ideas.md) - World building

## File Organization

```
gamedata/
├── producer-config.js          # Producer type definitions (visual, skill, UI)
├── hydroponics-recipes.js      # Hydroponics recipes
├── smelter-recipes.js          # (example) Smelter recipes
├── interactables.js            # All interactable entities
├── creatures.js                # Enemy/NPC definitions
├── equipment.js                # Weapons and armor
├── tools.js                    # Tool definitions
└── materials.js                # Crafting materials

components/
├── producer-component.js       # Generic producer component
└── [other components]

systems/
├── producer-system.js          # Generic producer processing
└── [other systems]

docs/
├── producer_system_guide.md    # How to add producers
├── producer_example.md         # Complete working example
└── [other documentation]
```

## Modding Quick Reference

### Producer System (New in Latest Version!)

The producer system is the recommended way to create time-based processing interactables:

**What it handles automatically:**
- Deadline-based production (calculates end time, no continuous updates)
- Player inventory management
- Skill bonuses (2% time reduction per level at midnight)
- Off-ship production tracking (applies one reduction when returning)
- Multiple outputs with variable quantities
- State management (empty/processing/ready)
- UI menus and messages

**What you configure:**
- Visual appearance (char, colour)
- Recipes (input → time → outputs)
- Skill integration (optional)
- UI strings (custom messages)

**Example Use Cases:**
- ✅ Hydroponics Bay (grows food from seeds)
- ⚙️ Ore Smelter (transforms ore into ingots)
- ♻️ Component Recycler (breaks down equipment)
- 🧪 Bioreactor (converts biomass to fuel)
- 💧 Water Purifier (cleans contaminated water)
- 🏭 3D Printer (fabricates parts from materials)

See [producer_system_guide.md](producer_system_guide.md) for complete instructions.

## Contributing

When adding new systems or content:

1. Create or update relevant documentation
2. Add examples for modders
3. Test with different configurations
4. Document edge cases and limitations
5. Update this README with links

## Version History

- **Latest:** Producer system refactor to deadline-based approach (more efficient, off-ship support)
- Previous: Timer-based producer system with continuous updates
- Previous: Hydroponics-specific implementation
