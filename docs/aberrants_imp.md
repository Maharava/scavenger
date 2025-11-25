# Aberrant Faction Implementation Plan

## Overarching Theme: The Glitch

Aberrants are not a cohesive faction; they are the universe's runtime errors. They are chaotic, universally hostile biological anomalies stemming from a multitude of horrific origins: failed human and robot experiments, entities warped by staring into the existential Void, and ancient, dark lifeforms that evolved on rogue planets between the stars. Their appearance on the battlefield is a system crash, introducing bizarre mechanics that break the normal rules of combat.

---

## Aberrant Archetypes (Chaos Agents)

Each Aberrant is a rare encounter that introduces a unique, disruptive mechanic.

### 1. The Amalgam (The Failed Experiment)
- **Concept:** A grotesque, unstable mound of fused organic and inorganic matter. A walking pile of body horror.
- **Mechanic:** It's slow, with high health. When it takes damage, there's a 25% chance a small, hostile "Splinter" (with low health) spawns from its body and attacks the nearest target. This turns a single, tough enemy into a chaotic, multi-target problem over time.

### 2. The Phase Echo (The Void-Touched)
- **Concept:** A flickering, staticky afterimage of a creature, unstuck from normal spacetime.
- **Mechanic:** It moves via short, random teleports each turn, making it extremely difficult to predict and pin down. Its weak melee strike has a high chance to apply a `Confusion` debuff for one turn.
- **(Note:** The `Confusion` status effect (e.g., reversing player movement controls, scrambling HUD) needs to be designed and implemented.)

### 3. The Stalker (The Dark Thing)
- **Concept:** A predator that evolved in the silent darkness between stars. It is a sleek, obsidian-black creature built for speed and stealth.
- **Mechanic:** A fast-moving, melee-only attacker. It has a naturally low detection radius, making it harder to spot on motion trackers. It uses its high speed to rapidly close the distance and attack with vicious, armor-piercing claws.
- **Impact:** It's a pure and terrifying threat of sudden violence, punishing players who don't maintain situational awareness.

### 4. The Bloom (The Unknowable Biology)
- **Concept:** A slow-moving sac of explosive, crystalline growth, whose biology is a weapon.
- **Mechanic:** Upon death, it explodes, dealing massive kinetic damage in a large radius and permanently seeding the area with hazardous crystalline terrain. This terrain deals damage to any entity that walks over it, scarring the battlefield for the remainder of the expedition.

### 5. The Ruptured (The Leaking Hazard)
- **Concept:** A humanoid figure that is a walking ruptured container for a hazardous substance. Its danger is not what it does, but what it *is*.
- **Mechanic:** It constantly emits a visible, 2-tile radius aura. This aura can have several variants, making each encounter different:
    - **Toxin Variant:** Deals persistent `Toxin` damage.
    - **Cryo Variant:** Deals `Energy` damage (extreme cold) and applies a `MovementDown` debuff.
    - **Corrosive Variant:** Damages the durability of armour and weapons, but not health.
- **Impact:** It's a mobile hazard you have to manage. You must kill it from a distance or lure it away from key areas.
