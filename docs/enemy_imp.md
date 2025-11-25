# Enemy Implementation Plan

This document outlines the current and planned enemy types for Scavenger.

## Faction Philosophies & Archetypes

### Humanoid (Scavengers)
These archetypes represent different states of mind for the base 'SCAVENGER' enemy. They utilize randomized gear but have unique AI profiles.

- **The Looter:** The common, opportunistic survivor. Balanced AI, focused on survival.
- **The Veteran:** A hardened, tactical survivor. Has a chance to assess the player's gear and may disengage if outmatched.
- **The Berserker:** A desperate, purely aggressive survivor who will charge relentlessly.

### Robot (Automated Defense Force)
Remnants of a pre-Collapse army built to fight the Alien outbreak. They are AI constructs with rudimentary sentience, now executing their anti-alien directives in a world devoid of their creators. Their attempts to counter the chaotic, biological alien threat with rigid logic are not always successful, explaining why neither side has ever gained a permanent advantage.

---

## Planned Robot Classes (Anti-Alien Doctrines)

These robots are defined by their chassis and combat role, equipped with modular gear.

- **Breacher (Close Quarters):** Built on a sturdy chassis with high kinetic resistance. It's tough enough to get close to dangerous targets and wields a shotgun-like weapon, making it effective at point-blank range.

- **Jammer (Electronic Warfare):** An E-war unit that emits a debuffing field to lower enemy accuracy. The robots have no systemic defense against alien sonic attacks, making the Jammer's offensive capabilities crucial for creating an advantage.

- **Sentinel (Elite Sniper):** A long-range marksman whose advanced targeting systems make it **immune to the Alien Screecher's jamming effect**. Its AI is also smart enough to recognize and evade the telegraphed attacks of the Alien Watcher.

- **Tracker (Anti-Stalker Specialist):** A fast, lightly-armed support unit. Its primary weapon would fire a non-damaging "Phase-Inhibitor" beacon to prevent a Phase Stalker from using its phasing ability.
- **(Note:** This is a complex mechanic and will require further design and testing to implement correctly.)

- **Watcher (Mobile Artillery):** A slow-moving siege platform that must anchor itself with **stabilizer legs** before firing, making it immune to the Harpooner's pull. It uses a two-turn cycle: first, it locks on with a visible targeting line, then it fires a devastating energy beam.

- **Berserker (Corrupted Logic):** A heavily damaged combat bot trapped in an aggression logic-spiral. It's not a designed counter-unit but a testament to battlefield failure. It uses high-damage melee attacks and will relentlessly charge any non-robot entity.

## Implemented Enemies
- **Scavenger** (Humanoid)
- **Scout Drone** (Robot)
- **Security Bot** (Robot)

## Retired Enemies
- **Pirate**: Removed. The 'Scavenger' class now covers the role of a hostile human survivor, with randomized gear providing variation.
- **Corpse Enemy**: Removed. The 'Aberrant' class will encompass all forms of mutated or reanimated biological threats.
