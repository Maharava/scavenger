// --- World Builder ---
// This script reads map and game data to populate the ECS world.

function buildWorld(world, mapId) {
    const map = MAP_DATA[mapId];
    if (!map) {
        console.error(`Map with id "${mapId}" not found!`);
        return;
    }

    // 1. Create entities from the layout string (walls, floors)
    for (let y = 0; y < map.layout.length; y++) {
        const row = map.layout[y];
        for (let x = 0; x < row.length; x++) {
            const char = row[x];
            const entity = world.createEntity();
            world.addComponent(entity, new PositionComponent(x, y));

            let isPlaceholder = map.interactables.some(i => i.x === x && i.y === y);
            // In the future, you might add other placeholders for creatures, items, etc.

            if (char === '+') {
                world.addComponent(entity, new RenderableComponent('+', '#666', 0));
                world.addComponent(entity, new SolidComponent());
            } else if (char === '.' || isPlaceholder) { // Treat placeholder spots as floor
                world.addComponent(entity, new RenderableComponent('.', '#333', 0));
            }
        }
    }

    // 2. Create interactable entities
    map.interactables.forEach(item => {
        const def = INTERACTABLE_DATA.find(i => i.id === item.id);
        if (!def) {
            console.warn(`Interactable definition not found for id: ${item.id}`);
            return;
        }
        const entity = world.createEntity();
        world.addComponent(entity, new PositionComponent(item.x, item.y));
        world.addComponent(entity, new RenderableComponent(def.char, def.colour, 1));
        world.addComponent(entity, new InteractableComponent(def.script, def.scriptArgs));
        world.addComponent(entity, new NameComponent(def.name)); // Add NameComponent for Q key display

        if (def.script === 'pickupItem') {
            world.addComponent(entity, new ItemComponent(def.name));
            world.addComponent(entity, new ConsumableComponent(def.scriptArgs.effect, def.scriptArgs.value));
            world.addComponent(entity, new StackableComponent(1, 99)); // Make items stackable
        }

        if (def.solid) {
            world.addComponent(entity, new SolidComponent());
        }
    });

    // 3. Create player entity
    const playerDef = CREATURE_DATA.find(c => c.id === 'PLAYER');
    const player = world.createEntity();
    world.addComponent(player, new PlayerComponent());
    world.addComponent(player, new NameComponent(playerDef.name));
    world.addComponent(player, new PositionComponent(map.playerSpawn.x, map.playerSpawn.y));
    world.addComponent(player, new RenderableComponent(playerDef.char, playerDef.colour, 2));
    world.addComponent(player, new CreatureStatsComponent(50));
    world.addComponent(player, new InventoryComponent());

    // Store map metadata in a global entity or directly in the world?
    // For now, let's attach it to the game object, which systems can access.
    // This will replace the old `currentRoom` properties.
    world.game.mapInfo = {
        name: map.name,
        temperature: map.temperature,
        air_quality: map.air_quality
    };
}
