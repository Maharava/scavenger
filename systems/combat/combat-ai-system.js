// CombatAISystem - Enemy AI decision making

class CombatAISystem extends System {
    update(world) {
        // AI turns are processed by CombatSystem calling processAITurn()
        // This system doesn't update every frame
    }

    processAITurn(world, enemyEntity, combatSession) {
        const ai = enemyEntity.getComponent('AIComponent');
        const enemyPos = enemyEntity.getComponent('PositionComponent');
        const player = world.query(['PlayerComponent'])[0];
        if (!player) return;

        const playerPos = player.getComponent('PositionComponent');

        const distance = Math.abs(enemyPos.x - playerPos.x) +
                        Math.abs(enemyPos.y - playerPos.y);

        // Check weapon
        const equipped = enemyEntity.getComponent('EquippedItemsComponent');
        const hasWeapon = equipped && equipped.hand;
        let weaponRange = 0;

        if (hasWeapon) {
            const weapon = world.getEntity(equipped.hand);
            if (weapon) {
                const gunStats = weapon.getComponent('GunStatsComponent');
                if (!gunStats) {
                    updateGunStats(world, weapon);
                }
                const updatedGunStats = weapon.getComponent('GunStatsComponent');
                weaponRange = updatedGunStats ? updatedGunStats.range : 0;
            }
        }

        // Decision tree based on behavior
        switch (ai.behaviorType) {
            case 'aggressive':
                if (hasWeapon && distance <= weaponRange) {
                    // In range: shoot
                    this.aiShoot(world, enemyEntity, player.id);
                } else {
                    // Out of range: move closer
                    this.aiMoveToward(world, enemyEntity, playerPos);
                }
                break;

            case 'defensive':
                if (hasWeapon && distance <= weaponRange) {
                    // In range: shoot
                    this.aiShoot(world, enemyEntity, player.id);
                } else if (distance < weaponRange / 2) {
                    // Too close: back away
                    this.aiMoveAway(world, enemyEntity, playerPos);
                } else {
                    // Too far: move to optimal range
                    this.aiMoveToward(world, enemyEntity, playerPos);
                }
                break;

            case 'passive':
            case 'fleeing':
                // Try to flee - just move away
                this.aiMoveAway(world, enemyEntity, playerPos);
                break;

            default:
                // Unknown behavior, just wait
                world.addComponent(enemyEntity.id, new MessageComponent('Enemy waits.', 'grey'));
                break;
        }
    }

    aiShoot(world, attacker, targetId) {
        const actionSystem = world.systems.find(s => s instanceof ActionResolutionSystem);
        if (actionSystem) {
            actionSystem.resolveShoot(world, attacker, targetId);
        }
    }

    aiMoveToward(world, entity, targetPos) {
        const pos = entity.getComponent('PositionComponent');
        const combatant = entity.getComponent('CombatantComponent');
        if (!combatant) return;

        // Calculate desired move direction
        const dx = targetPos.x - pos.x;
        const dy = targetPos.y - pos.y;

        let targetX = pos.x;
        let targetY = pos.y;

        if (Math.abs(dx) > Math.abs(dy)) {
            targetX += (dx > 0) ? 1 : -1;
        } else {
            targetY += (dy > 0) ? 1 : -1;
        }

        // Bounds check
        const width = world.game.width;
        const height = world.game.height;
        if (targetX < 0 || targetX >= width || targetY < 0 || targetY >= height) {
            world.addComponent(entity.id, new MessageComponent('Enemy cannot move (edge of map)', 'grey'));
            combatant.hasMovedThisTurn = true;
            return;
        }

        // Collision check with solid entities
        const solidEntities = world.query(['PositionComponent', 'SolidComponent']);
        for (const solid of solidEntities) {
            if (solid.id === entity.id) continue;
            const solidPos = solid.getComponent('PositionComponent');
            if (solidPos.x === targetX && solidPos.y === targetY) {
                world.addComponent(entity.id, new MessageComponent('Enemy is blocked', 'grey'));
                combatant.hasMovedThisTurn = true;
                return;
            }
        }

        // Move is valid - apply it
        pos.x = targetX;
        pos.y = targetY;
        combatant.hasMovedThisTurn = true;

        world.addComponent(entity.id, new MessageComponent('Enemy moves closer', 'grey'));
    }

    aiMoveAway(world, entity, targetPos) {
        const pos = entity.getComponent('PositionComponent');
        const combatant = entity.getComponent('CombatantComponent');
        if (!combatant) return;

        // Calculate desired move direction (away from target)
        const dx = targetPos.x - pos.x;
        const dy = targetPos.y - pos.y;

        let targetX = pos.x;
        let targetY = pos.y;

        if (Math.abs(dx) > Math.abs(dy)) {
            targetX -= (dx > 0) ? 1 : -1;
        } else {
            targetY -= (dy > 0) ? 1 : -1;
        }

        // Bounds check
        const width = world.game.width;
        const height = world.game.height;
        if (targetX < 0 || targetX >= width || targetY < 0 || targetY >= height) {
            world.addComponent(entity.id, new MessageComponent('Enemy cannot retreat (edge of map)', 'grey'));
            combatant.hasMovedThisTurn = true;
            return;
        }

        // Collision check with solid entities
        const solidEntities = world.query(['PositionComponent', 'SolidComponent']);
        for (const solid of solidEntities) {
            if (solid.id === entity.id) continue;
            const solidPos = solid.getComponent('PositionComponent');
            if (solidPos.x === targetX && solidPos.y === targetY) {
                world.addComponent(entity.id, new MessageComponent('Enemy cannot retreat (blocked)', 'grey'));
                combatant.hasMovedThisTurn = true;
                return;
            }
        }

        // Move is valid - apply it
        pos.x = targetX;
        pos.y = targetY;
        combatant.hasMovedThisTurn = true;

        world.addComponent(entity.id, new MessageComponent('Enemy backs away', 'grey'));
    }
}
