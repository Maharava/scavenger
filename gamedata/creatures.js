// gamedata/creatures.js
const CREATURE_DATA = [
    {
        "id": "PLAYER",
        "name": "Jane Doe",
        "char": "@",
        "colour": "#fff"
    },

    // --- HUMANOID ENEMIES ---

    {
        "id": "SCAVENGER",
        "name": "Scavenger",
        "char": "s",
        "colour": "#c84",
        "aiType": "aggressive",
        "detectionRange": 10,
        "morale": 90,
        "body": {
            "head": 100,
            "torso": 80,
            "limbs": 100
        },
        "weapon": "RUSTY_PISTOL",  // Modular weapon with random parts
        "armor": null
    },

    {
        "id": "PIRATE",
        "name": "Pirate",
        "char": "P",
        "colour": "#f44",
        "aiType": "defensive",
        "detectionRange": 12,
        "morale": 120,
        "body": {
            "head": 100,
            "torso": 100,
            "limbs": 100
        },
        "weapon": "ASSAULT_RIFLE",
        "armor": "SCRAP_ARMOUR"
    },

    // --- ROBOT ENEMIES ---

    {
        "id": "SCOUT_DRONE",
        "name": "Scout Drone",
        "char": "r",
        "colour": "#aaf",
        "aiType": "defensive",
        "detectionRange": 12,
        "body": {
            "head": 0,      // Robots only have torso
            "torso": 40,    // Durability pool
            "limbs": 0
        },
        "weapon": "LIGHT_LASER",
        "armor": null,
        "armorStats": {
            "durability": 40,
            "maxDurability": 40,
            "resistances": {
                "kinetic": 20,
                "energy": 40,
                "toxin": 100,    // Immune to toxin
                "radiation": 50  // Weak to radiation (doubled damage = 50% effective resist)
            }
        }
    },

    {
        "id": "SECURITY_BOT",
        "name": "Security Bot",
        "char": "R",
        "colour": "#aaa",
        "aiType": "aggressive",
        "detectionRange": 12,
        "body": {
            "head": 0,
            "torso": 80,
            "limbs": 0
        },
        "weapon": "PLASMA_RIFLE",
        "armor": null,
        "armorStats": {
            "durability": 80,
            "maxDurability": 80,
            "resistances": {
                "kinetic": 30,
                "energy": 50,
                "toxin": 100,
                "radiation": 50
            }
        }
    }
];
