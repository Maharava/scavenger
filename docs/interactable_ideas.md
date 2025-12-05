# Ship Interactable Ideas

## Storage & Item Management
- **Crate / Cargo Container:** A container with a local inventory.
- **Ship Crate / Ship Cargo:** An access point to the shared, ship-wide cargo hold.
- **Drop Chute:** A one-way chute to send items directly to the ship's cargo hold during an expedition.
- **Resource Recycler:** A potential producer-type interactable that could break down equipment into base components over time. Not yet implemented, but the producer system supports this pattern.

## Survival & Recovery
- **Hydroponics Bay:** A producer-type interactable that grows food from seeds over time. Uses the generic producer system, which supports skill bonuses (farming skill increases growth speed and seed return chance). Seeds take 2.5-10 game days to grow depending on type.
- **Stove:** Allows for the crafting of meals from raw food items, providing better stat restoration.
- **Shower:** Increases the player's `Comfort` and reduces `Stress`.
- **Bed:** Restores the `Rest` stat. Higher quality beds can also improve `Comfort`.
- **Auto-Doc:** Applies a heal-over-time effect. Consumes `Organic Protein` and `Chemical Compounds` to enhance the healing rate significantly.

## Ship Systems & Progression
- **Weapons Workbench:** Modify weapons. Pulls from player and ship inventory for modules.
- **Armour Workbench:** Modify armour. Pulls from player and ship inventory for modules.
- **Bridge:** The ship's command center. Used to travel to expedition locations.
- **Scanner:** Discovers new expedition locations. Can be upgraded to find rarer and more dangerous sites.
- **Refinery:** Converts biomass and organic materials into fuel for the ship.
- **Water Recycler:** A passive system that reduces the player's water consumption. Can be upgraded.
- **Life Support:** Sets the baseline `Comfort` and `Stress` levels on the ship. Can be upgraded for better passive recovery.

## Utility & Practice
- **Target Dummy:** A non-hostile dummy on the ship. When shot, it displays the exact damage dealt, allowing players to safely test their modified weapons and different ammo types.

## Expedition Interactables
- **Door:** Can be opened and closed.
- **Scavenged Item Node:** A generic loot source found in the world (e.g., a server rack, a locked footlocker, a broken hydroponics bay). These nodes can be simple containers or they may require a **skill check** (e.g., `Repair` to fix a mechanism, a future `Hack` skill for terminals) or a specific **tool** to access their contents, providing more engaging and challenging looting opportunities.
- **Story Node:** A generic interactable for delivering lore and environmental storytelling. This can have variable graphics (a datapad, a scrawled note on a wall, a terminal entry) but its core function is to display a text box with a snippet of story when activated.

## Dynamic Environmental Hazards
These interactables make the environment itself a threat. They are often persistent and tied to the game's core damage types.

### Kinetic Hazards
- **Debris Drop:** A ceiling section that can be shot or triggered, dropping heavy debris on the tiles below.
- **Piston Trap:** An industrial piston that fires periodically across a hallway, dealing massive damage to anything in its path.
- **Explosive Canister:** A volatile fuel canister that explodes when it takes any damage, dealing kinetic damage in a radius.

### Energy Hazards
- **Arcing Conduit:** An exposed power cable that periodically electrifies adjacent tiles, dealing `Energy` damage.
- **Superheated Steam Pipe:** A ruptured pipe that releases jets of scalding steam in a pattern, dealing `Energy` damage over time to those caught in it.
- **Overcharged Terminal:** A computer terminal that sparks with energy. Interacting with it (even for a skill check) without a tool with insulated properties could result in a damaging shock.

### Toxin Hazards
- **Chemical Spill:** A puddle of green goo on the floor that deals `Toxin` damage to any entity that ends its turn on it.
- **Spore Cloud Vent:** A vent connected to an alien-infested area that periodically releases a cloud of toxic spores, which lingers for several turns and deals `Toxin` damage.
- **Leaking Chemical Barrel:** A container of volatile chemicals that will rupture and create a large chemical spill if it takes any damage.

### Radiation Hazards
- **Leaking Micro-Reactor:** A damaged ship or station reactor that irradiates a large area around it, dealing persistent `Radiation` damage.
- **Irradiated Container:** A damaged container with a radiation warning symbol. Being near it causes radiation buildup. It may hold valuable loot, presenting a risk/reward challenge.
- **Medical Scanner (Malfunctioning):** A diagnostic machine that is stuck in a high-power state, bathing the area in low-level radiation.

## Ship Personalization
- **Future Development:** To increase player investment in their ship as a "home," future development could include interactables that allow for cosmetic customization (e.g., changing interior light colour, placing found trinkets on a shelf) or adding a personal touch (e.g., a terminal to rename the ship).
