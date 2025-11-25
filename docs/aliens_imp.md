# Alien Faction Implementation Plan

## Overarching Theme: The Unraveling

The Alien faction is not an invading extraterrestrial force. It is the horrifying, ecological consequence of humanity's abandoned works, born from runaway bio-experiments and unchecked evolution in the ruins of civilization. They are a new, invasive ecosystem, actively hostile to the robotic faction in an endless, automated war. Their horror is biological, their tactics are instinctual, and their purpose is to convert the metal world back into a grotesque, organic nursery.

Key principles:
- **Ecological Horror:** Their terror comes from body horror, parasitic growth, and natural processes running amok.
- **Tied to Nature:** Their existence is dependent on the presence of `NATURE` biomes.
- **Eternal War:** They are actively hostile to robots, creating a chaotic three-way battlefield. Their abilities are often evolved specifically to counter robotic threats.
- **Attrition Warfare:** Many of their attacks focus on destroying equipment, making them a long-term strategic threat.

## Alien Enemy Classes

### 1. The Corroder (Anti-Armour)
- **Concept:** A slow, walking tank of an alien that projects a short-range cone or line of hyper-corrosive acid. It's the ultimate biological answer to technology.
- **Mechanic:** The acid does **zero health damage to the player** but catastrophically degrades equipment durability. It also deals **increased damage to Robots**, melting their chassis.
- **Player Response:** Demands distance. Getting close is a massive risk to your hard-earned gear. Its own body is immune to acid but may be vulnerable to other damage types like kinetic impact.

### 2. The Screecher (Disruptor)
- **Concept:** A slender, twitching creature with a massive, resonant vocal sac. It's a battlefield disruptor.
- **Mechanic:** Every two turns, it can emit a high-frequency shriek. This screech gives all other entities in a large radius an `AccuracyDown` debuff for one turn. It also has a weak melee attack for when targets get too close.
- **Player Response:** While not a primary damage threat, its ability to cause chaos and make your shots miss makes it a high-priority target. You kill it to "clear the air" and ensure your own attacks are effective.

### 3. The Harpooner (Repositioner)
- **Concept:** A terrifying creature with a long, bio-luminescent tendril or bony harpoon it launches at its prey. It emits a faint light, acting as a dangerous lure in the darkness.
- **Mechanic:** Its attack does negligible damage, but if it hits, it **yanks the player several tiles closer** to it.
- **Player Response:** Creates an immediate and obvious tactical problem. A Harpooner working with a Corroder is a nightmare duo—one pulls you in, the other melts your gear. This creates a clear "kill order" and makes positioning paramount.

### 4. The Phase Stalker (Duelist)
- **Concept:** An eerie, slender predator that can briefly shift its biology out of phase with reality.
- **Mechanic:** It has two states. In its "Phased" state, it's a shimmering blur, **immune to all damage**, and moves towards its target. It must then de-phase to a "Corporeal" state for a single turn to attack with sharp, armour-piercing claws.
- **Player Response:** A tense duel of timing. You must hold your fire and attack only during its brief window of vulnerability.
- **(Note:** This is a complex mechanic and will require further design and testing to implement correctly.)

### 5. The Watcher (Mobile Artillery)
- **Concept:** A slow-moving, living siege cannon. A bio-plasma turret that creeps into position to provide heavy fire support.
- **Mechanic:** It has a two-turn attack cycle.
    - **Turn 1 (Targeting):** It moves into position and locks onto the player, projecting a visible, glowing targeting line on the ground.
    - **Turn 2 (Firing):** It unleashes a devastating, high-damage `energy` beam down the projected line.
- **Player Response:** A pure test of awareness and positioning. The attack is clearly telegraphed; if you are standing on the line at the end of your turn, you will take massive damage. You must move.
