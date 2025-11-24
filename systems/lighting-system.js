class LightingSystem extends System {
    constructor() {
        super();
        this.litTilesCache = new Set();  // Set of "x,y" strings
        this.dirty = true;                // Needs recalculation?
    }

    update(world) {
        // 1. Check if lighting is enabled for this map
        const mapLighting = world.mapLighting; // Stored on world
        if (!mapLighting || !mapLighting.enabled) {
            // Ship map - everything is always lit
            this.ensureAllLit(world);
            return;
        }

        // 2. Only recalculate if something changed
        if (!this.dirty) {
            return;
        }

        // 3. Clear previous lit tiles
        this.litTilesCache.clear();

        // 4. Find all active light sources
        const lightSources = world.query(['PositionComponent', 'LightSourceComponent']);

        // 5. Calculate lit areas for each light source
        for (const source of lightSources) {
            const light = source.getComponent('LightSourceComponent');
            if (!light.active) continue;

            const pos = source.getComponent('PositionComponent');
            this.calculateLitArea(world, pos, light.radius);
        }

        // 6. Update visibility states for all tiles and entities
        this.updateVisibilityStates(world);

        // 7. Mark as clean
        this.dirty = false;
    }

    calculateLitArea(world, centerPos, radius) {
        // For each tile within radius, check LOS
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                const x = centerPos.x + dx;
                const y = centerPos.y + dy;

                // Check if within radius (Manhattan distance)
                const distance = Math.abs(dx) + Math.abs(dy);
                if (distance > radius) continue;

                // Check LOS (use existing hasLineOfSight from combat system)
                // Access via world.game since CombatSystem has it
                const combatSystem = world.systems.find(s => s instanceof CombatSystem);
                const hasLOS = combatSystem.hasLineOfSight(
                    world,
                    centerPos,
                    { x, y }
                );

                if (hasLOS) {
                    this.litTilesCache.add(`${x},${y}`);
                }
            }
        }
    }

    updateVisibilityStates(world) {
        // Update all entities with VisibilityStateComponent
        const visibleEntities = world.query(['PositionComponent', 'VisibilityStateComponent']);

        for (const entity of visibleEntities) {
            const pos = entity.getComponent('PositionComponent');
            const vis = entity.getComponent('VisibilityStateComponent');
            const tileKey = `${pos.x},${pos.y}`;

            if (this.litTilesCache.has(tileKey)) {
                // Currently lit
                vis.state = 'lit';
            } else if (vis.state === 'lit') {
                // Was lit, now isn't - mark as revealed
                vis.state = 'revealed';
            }
            // If never_seen, stays never_seen until lit
        }
    }

    ensureAllLit(world) {
        // Ship map - set everything to 'lit' state
        const visibleEntities = world.query(['VisibilityStateComponent']);
        for (const entity of visibleEntities) {
            const vis = entity.getComponent('VisibilityStateComponent');
            vis.state = 'lit';
        }
    }

    // Called by MovementSystem when player/light source moves
    markDirty() {
        this.dirty = true;
    }
}
