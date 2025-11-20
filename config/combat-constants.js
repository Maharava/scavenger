// Combat configuration constants
// All combat-related numerical values in one place for easy balancing

const COMBAT_CONSTANTS = {
    // Initiative
    INITIATIVE_DIE: 6,               // Roll 1d6 for initiative

    // Movement
    BASE_MOVEMENT: 4,                // Tiles per turn (default)

    // Hit Chance
    BASE_ACCURACY: 70,               // Base weapon accuracy (%)
    MIN_HIT_CHANCE: 5,               // Minimum after all modifiers
    MAX_HIT_CHANCE: 95,              // Maximum after all modifiers
    OUT_OF_RANGE_PENALTY: 25,        // -25% per tile beyond weapon range

    // Aim Action
    AIM_BONUS: 15,                   // +15% per aim stack
    MAX_AIM_STACKS: 2,               // Max 2 stacks (+30% total)

    // Stress Effects on Combat
    STRESS_OPTIMAL_MIN: 20,          // +10% accuracy
    STRESS_OPTIMAL_MAX: 40,
    STRESS_PENALTY_1_MIN: 61,        // -10% accuracy
    STRESS_PENALTY_1_MAX: 80,
    STRESS_PENALTY_2_MIN: 81,        // -20% accuracy
    STRESS_PENALTY_2_MAX: 100,

    // Body Part Damage Effects
    HEAD_ACCURACY_PENALTY: 20,       // -20% if head < 50%
    TORSO_ACCURACY_PENALTY: 15,      // -15% if torso < 50%
    LIMBS_MOVEMENT_THRESHOLD: 70,    // -1 move per 30% below this

    // Dodge
    BASE_DODGE: 10,                  // 10% dodge chance

    // Melee Fallback
    UNARMED_DAMAGE: 5,               // Unarmed melee damage
    UNARMED_ACCURACY: 60,            // Unarmed melee accuracy
    UNARMED_TYPE: 'kinetic',

    // Status Effects
    BLEEDING_DAMAGE_PER_TURN: 5,     // Damage from bleeding (torso < 15%)
    TORSO_BLEEDING_THRESHOLD: 15,    // Torso HP % for bleeding
    INFECTED_DAMAGE_PER_TURN: 3,     // Toxin damage per turn
    INFECTED_DURATION: 5,            // Turns until infection ends

    // Enemy Detection
    HUMANOID_DETECTION: 10,          // Tiles
    ROBOT_DETECTION: 12,
    ALIEN_DETECTION: 8,
    ABERRANT_DETECTION_MIN: 4,       // Random 4-16
    ABERRANT_DETECTION_MAX: 16,

    // Flee & Morale
    FLEE_MORALE_THRESHOLD: 30,       // Humanoids flee below this

    // Combat Entry
    COMBAT_ENTRY_MIN_STRESS: 20,     // Minimum stress when combat starts

    // First Strike
    FIRST_STRIKE_BONUS: 15           // +15% accuracy if player initiated combat
};
