// ProjectileSystem - Animates projectile movement for visual effects

class ProjectileSystem extends System {
    update(world, deltaTime) {
        const projectiles = world.query(['ProjectileComponent', 'PositionComponent']);

        for (const entity of projectiles) {
            const projectile = entity.getComponent('ProjectileComponent');

            // Update lifetime
            projectile.lifetime += deltaTime;

            // Calculate distance to travel
            const dx = projectile.toX - projectile.fromX;
            const dy = projectile.toY - projectile.fromY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Safety check for zero distance
            if (distance === 0) {
                world.destroyEntity(entity.id);
                continue;
            }

            // Update progress based on speed (tiles per second)
            const progressIncrement = (projectile.speed * deltaTime) / distance;
            projectile.progress = Math.min(1, projectile.progress + progressIncrement);

            // Update current position
            projectile.currentX = projectile.fromX + (dx * projectile.progress);
            projectile.currentY = projectile.fromY + (dy * projectile.progress);

            // Update visual position
            const pos = entity.getComponent('PositionComponent');
            pos.x = Math.round(projectile.currentX);
            pos.y = Math.round(projectile.currentY);

            // Remove when reached destination
            if (projectile.progress >= 1) {
                world.destroyEntity(entity.id);
            }
        }
    }
}
