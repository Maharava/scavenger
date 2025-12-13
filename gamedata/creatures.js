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
        "stealth": 20,  // Standard stealth (80% motion tracker detection chance)
        "body": {
            "head": 100,
            "torso": 80,
            "limbs": 100
        },
        "loadoutPool": "HOSTILE_HUMAN"  // Uses modular equipment system
    },



    // --- ROBOT ENEMIES ---

    {
        "id": "SCOUT_DRONE",
        "name": "Scout Drone",
        "char": "r",
        "colour": "#aaf",
        "aiType": "defensive",
        "detectionRange": 12,
        "stealth": 20,  // Standard stealth (80% motion tracker detection chance)
        "body": {
            "head": 0,      // Robots only have torso
            "torso": 40,    // Durability pool
            "limbs": 0
        },
        "weapon": null,  // Robots don't use weapons (for now)
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
        "stealth": 20,  // Standard stealth (80% motion tracker detection chance)
        "body": {
            "head": 0,
            "torso": 80,
            "limbs": 0
        },
        "weapon": null,  // Robots don't use weapons (for now)
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
