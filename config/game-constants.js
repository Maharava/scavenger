// Game Constants
// Central location for all game-wide constants to avoid magic numbers

// --- Stat Limits ---
const MAX_STAT_VALUE = 100;
const MIN_STAT_VALUE = 0;

// --- Comfort System ---
const BASE_COMFORT = 50;
const LOW_COMFORT_THRESHOLD = 30;
const HIGH_COMFORT_THRESHOLD = 80;
const STRESS_ADJUSTMENT_INTERVAL_SECONDS = 30;

// --- UI/Rendering ---
const BLINK_INTERVAL_MS = 500;
const TILE_SIZE = 20; // pixels per tile

// --- Lighting System ---
const BASE_PLAYER_LIGHT_RADIUS = 6; // Default light radius without equipment

// --- Ship Systems ---
const WATER_CONSUMPTION_INTERVAL_MS = 30000; // 30 seconds

// --- Time System ---
// Real time to game time conversion: 30 seconds real = 5 minutes game
const REAL_SECONDS_PER_GAME_MINUTE = 6; // 30 seconds / 5 minutes = 6 seconds per game minute
const TIME_UPDATE_INTERVAL_MS = 1000; // Update time every 1 second

// --- Hunger System ---
// Player needs to eat twice a day (hits 20% hunger at 7am and 7pm)
// This means 80% hunger loss every 12 hours (720 minutes)
const HUNGER_LOSS_PER_GAME_HOUR = 80 / 12; // ~6.67% per game hour

// --- Healing System ---
// Body parts heal at 2% per day (1440 game minutes)
const HEALING_RATE_PER_GAME_DAY = 2; // 2% per day
const HEALING_RATE_PER_GAME_HOUR = HEALING_RATE_PER_GAME_DAY / 24; // ~0.083% per hour
const HEALING_BONUS_8HR_REST = 1; // Additional 1% for 8 hours of rest

// --- Sleep System ---
// Rest restoration rates based on sleep duration
const REST_RESTORE_1HR = 10;  // 1 hour sleep = 10% rest
const REST_RESTORE_4HR = 40;  // 4 hours sleep = 40% rest
const REST_RESTORE_8HR = 100; // 8 hours sleep = 100% rest
const SLEEP_FADE_DURATION_MS = 1000; // 1 second fade to black

// --- Skill System ---
const SKILL_MAX_LEVEL = 5;
const SKILL_STRESS_THRESHOLD = 60; // Above this, learning is halved
const SKILL_LEVELUP_CHANCES = {
    0: 0.25,  // L0→L1: 25%
    1: 0.20,  // L1→L2: 20%
    2: 0.15,  // L2→L3: 15%
    3: 0.07,  // L3→L4: 7%
    4: 0.05   // L4→L5: 5%
};
// Death regression
const SKILL_DEATH_REGRESSION_COUNT = 2; // Select 2 skills
const SKILL_DEATH_BASE_CHANCE = 0.25;   // 25% base
const SKILL_DEATH_LEVEL_PENALTY = 0.10; // +10% per level