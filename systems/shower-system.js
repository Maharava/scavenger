// ShowerSystem - Handles shower animation and player blinking

class ShowerSystem extends System {
    update(world) {
        const deltaTime = world.game.deltaTime || 16; // milliseconds since last frame

        const entities = world.query(['ShoweringComponent', 'PositionComponent', 'RenderableComponent']);

        for (const entity of entities) {
            const showering = entity.getComponent('ShoweringComponent');
            const pos = entity.getComponent('PositionComponent');
            const renderable = entity.getComponent('RenderableComponent');

            // Update elapsed time
            showering.elapsed += deltaTime;

            // Handle blinking
            if (showering.elapsed - showering.lastBlink >= showering.blinkInterval) {
                showering.visible = !showering.visible;
                showering.lastBlink = showering.elapsed;

                // Toggle visibility by changing alpha/color
                if (showering.visible) {
                    renderable.colour = '#fff'; // Normal color
                } else {
                    renderable.colour = '#888'; // Dimmed/invisible
                }
            }

            // Check if shower is complete
            if (showering.elapsed >= showering.duration) {
                this.completeShower(world, entity, showering);
            }
        }
    }

    completeShower(world, entity, showering) {
        const player = entity;
        const ship = world.getShip();

        // Restore visibility
        const renderable = player.getComponent('RenderableComponent');
        renderable.colour = '#fff';

        // Move player back to original position (or keep on shower tile)
        // const pos = player.getComponent('PositionComponent');
        // pos.x = showering.originalX;
        // pos.y = showering.originalY;
        // Actually, let's keep them on the shower tile

        // Apply shower benefits
        const stats = player.getComponent('StatsComponent');
        if (stats) {
            stats.modifyStat('stress', -20); // Reduce stress by 20
            stats.modifyStat('comfort', 20); // Increase comfort by 20
        }

        // Consume water from ship
        if (ship) {
            const shipComp = ship.getComponent('ShipComponent');
            if (shipComp) {
                // Check if Water Recycler exists (50% reduction)
                const hasRecycler = ship.hasComponent('WaterRecyclerComponent');
                const waterUsage = hasRecycler ? 20 : 40; // 40L or 20L with recycler

                shipComp.water -= waterUsage;
            }
        }

        // Set 8-hour lockout
        const lockoutEndTime = world.gameTime + 480; // 8 hours = 480 minutes
        world.addComponent(player.id, new ShowerLockoutComponent(lockoutEndTime));

        // Remove showering component
        world.removeComponent(player.id, 'ShoweringComponent');

        // Show completion message
        world.addComponent(player.id, new MessageComponent('You feel refreshed!', 'cyan'));
    }
}
