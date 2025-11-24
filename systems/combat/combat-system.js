// CombatSystem - Manages combat lifecycle, turn order, and combat sessions

class CombatSystem extends System {
    constructor() {
        super();
        this.activeCombatSession = null;
    }

    update(world) {
        // Check if combat should start (enemy detection or player initiation)
        if (!this.activeCombatSession) {
            this.checkForCombatStart(world);
        }

        // If in combat, process active combat session
        if (this.activeCombatSession) {
            this.processCombat(world);
        }
    }

    checkForCombatStart(world) {
        const player = world.query(['PlayerComponent'])[0];
        if (!player) return;

        const playerPos = player.getComponent('PositionComponent');

        // Check all AI entities for detection (only alive enemies)
        const enemies = world.query(['AIComponent', 'PositionComponent', 'BodyPartsComponent']);

        for (const enemy of enemies) {
            const ai = enemy.getComponent('AIComponent');
            const enemyPos = enemy.getComponent('PositionComponent');
            const bodyParts = enemy.getComponent('BodyPartsComponent');

            // Skip dead enemies
            if (bodyParts.getPart('head') <= 0 || bodyParts.getPart('torso') <= 0) {
                continue;
            }

            // Check if enemy detects player (within range + LOS)
            const distance = this.getDistance(playerPos, enemyPos);
            if (distance <= ai.detectionRange && this.hasLineOfSight(world, playerPos, enemyPos)) {
                // Start combat!
                this.startCombat(world, [player.id, enemy.id]);
                break;
            }
        }
    }

    startCombat(world, participantIds, playerInitiated = false) {
        // Create combat session
        const sessionId = Date.now();
        this.activeCombatSession = new CombatSessionComponent(sessionId, playerInitiated);
        this.activeCombatSession.participants = participantIds;

        // Mark all participants as in combat
        for (const id of participantIds) {
            const entity = world.getEntity(id);
            world.addComponent(id, new CombatStateComponent(sessionId));

            // Add CombatantComponent if missing
            if (!entity.hasComponent('CombatantComponent')) {
                world.addComponent(id, new CombatantComponent());
            }
        }

        // Roll initiative
        this.rollInitiative(world);

        // Set player stress to minimum 20 (adrenaline)
        const player = world.query(['PlayerComponent'])[0];
        const stats = player.getComponent('CreatureStatsComponent');
        if (stats && stats.stress < COMBAT_CONSTANTS.COMBAT_ENTRY_MIN_STRESS) {
            stats.stress = COMBAT_CONSTANTS.COMBAT_ENTRY_MIN_STRESS;
        }

        // Show combat start message
        world.addComponent(player.id, new MessageComponent(
            'COMBAT! [Space] Fire | [R] Target | [F] Flee | [E] End Turn',
            'cyan'
        ));
        world.addComponent(player.id, new MessageComponent('Combat started!', 'red'));

        // Auto-select first enemy for player
        this.selectFirstEnemy(world);

        // Show whose turn it is first
        const firstActiveId = this.activeCombatSession.getActiveCombatant();
        if (firstActiveId === player.id) {
            world.addComponent(player.id, new MessageComponent('YOUR TURN! Round 1', 'cyan'));
            this.showSelectedTarget(world);
        } else {
            const firstActiveEntity = world.getEntity(firstActiveId);
            const name = firstActiveEntity.getComponent('NameComponent');
            world.addComponent(player.id, new MessageComponent(
                `Enemy turn: ${name ? name.name : 'Unknown'}`,
                'yellow'
            ));
        }
    }

    selectFirstEnemy(world) {
        if (!this.activeCombatSession) return;

        const enemies = world.query(['AIComponent', 'CombatStateComponent', 'BodyPartsComponent'])
            .filter(enemy => {
                const bodyParts = enemy.getComponent('BodyPartsComponent');
                return bodyParts && bodyParts.getPart('head') > 0 && bodyParts.getPart('torso') > 0;
            });

        if (enemies.length > 0) {
            // If there's a previously selected enemy that's still alive, keep it
            if (this.activeCombatSession.selectedEnemyId) {
                const stillAlive = enemies.find(e => e.id === this.activeCombatSession.selectedEnemyId);
                if (stillAlive) {
                    return; // Keep current selection
                }
            }
            // Otherwise select first enemy
            this.activeCombatSession.selectedEnemyId = enemies[0].id;
        }
    }

    showSelectedTarget(world) {
        if (!this.activeCombatSession || !this.activeCombatSession.selectedEnemyId) return;

        const player = world.query(['PlayerComponent'])[0];
        if (!player) return;

        const target = world.getEntity(this.activeCombatSession.selectedEnemyId);
        if (target) {
            const targetName = target.getComponent('NameComponent');
            world.addComponent(player.id, new MessageComponent(
                `[R to cycle] Target: ${targetName ? targetName.name : 'Enemy'}`,
                'cyan'
            ));
        }
    }

    rollInitiative(world) {
        const rolls = [];

        for (const id of this.activeCombatSession.participants) {
            const entity = world.getEntity(id);
            const combatant = entity.getComponent('CombatantComponent');

            // Initiative = movement + 1d6
            const roll = combatant.movementPerTurn + this.rollDie(COMBAT_CONSTANTS.INITIATIVE_DIE);
            combatant.initiativeRoll = roll;

            rolls.push({ entityId: id, roll });
        }

        // Sort by roll descending, ties go to player
        const player = world.query(['PlayerComponent'])[0];
        rolls.sort((a, b) => {
            if (a.roll === b.roll) {
                // Tie: player wins
                return (a.entityId === player.id) ? -1 : 1;
            }
            return b.roll - a.roll;
        });

        this.activeCombatSession.turnOrder = rolls.map(r => r.entityId);
        this.activeCombatSession.activeIndex = 0;
    }

    processCombat(world) {
        // Get active combatant
        const activeId = this.activeCombatSession.getActiveCombatant();
        const activeEntity = world.getEntity(activeId);
        if (!activeEntity) {
            // Entity was destroyed, advance turn
            this.advanceTurn(world);
            return;
        }

        const combatant = activeEntity.getComponent('CombatantComponent');

        // Check if stunned
        if (combatant.stunned) {
            combatant.stunned = false;
            world.addComponent(activeId, new MessageComponent('Stunned! Turn skipped.', 'yellow'));
            this.advanceTurn(world);
            return;
        }

        // Apply bleeding damage
        if (combatant.bleeding) {
            const bodyParts = activeEntity.getComponent('BodyPartsComponent');
            if (bodyParts) {
                bodyParts.damage('torso', COMBAT_CONSTANTS.BLEEDING_DAMAGE_PER_TURN);
                world.addComponent(activeId, new MessageComponent(
                    `Bleeding! ${COMBAT_CONSTANTS.BLEEDING_DAMAGE_PER_TURN} damage to torso`,
                    'red'
                ));
            }
        }

        // Apply infected damage
        if (combatant.infected > 0) {
            const bodyParts = activeEntity.getComponent('BodyPartsComponent');
            if (bodyParts) {
                bodyParts.damage('torso', COMBAT_CONSTANTS.INFECTED_DAMAGE_PER_TURN);
                world.addComponent(activeId, new MessageComponent(
                    `Infected! ${COMBAT_CONSTANTS.INFECTED_DAMAGE_PER_TURN} toxin damage (${combatant.infected} turns left)`,
                    'green'
                ));
                combatant.infected--;
            }
        }

        // Check if active combatant is dead BEFORE processing turn
        const bodyParts = activeEntity.getComponent('BodyPartsComponent');
        if (bodyParts && (bodyParts.getPart('head') <= 0 || bodyParts.getPart('torso') <= 0)) {
            // Entity is dead, skip turn and check combat end
            this.checkCombatEnd(world);
            // Only advance turn if combat is still active (checkCombatEnd might have ended it)
            if (this.activeCombatSession) {
                this.advanceTurn(world);
            }
            return;
        }

        // Check if active combatant is player
        const isPlayer = activeEntity.hasComponent('PlayerComponent');

        if (isPlayer) {
            // Wait for player input (handled by InputSystem)
            // Player chooses action via UI, which calls requestPlayerAction()
            if (!combatant.hasActedThisTurn) {
                // Player's turn, waiting for input
                return;
            }
        } else {
            // AI turn
            const aiSystem = world.systems.find(s => s.constructor.name === 'CombatAISystem');
            if (aiSystem && !combatant.hasActedThisTurn) {
                aiSystem.processAITurn(world, activeEntity, this.activeCombatSession);
                combatant.hasActedThisTurn = true;

                // Check combat end AFTER AI acts (detect newly killed enemies)
                this.checkCombatEnd(world);
                // Only advance turn if combat is still active
                if (this.activeCombatSession) {
                    this.advanceTurn(world);
                }
            }
        }

        // Check victory/defeat conditions (for player turns)
        if (isPlayer) {
            this.checkCombatEnd(world);
        }
    }

    advanceTurn(world) {
        // Safety check - combat might have ended
        if (!this.activeCombatSession) {
            return;
        }

        const activeId = this.activeCombatSession.getActiveCombatant();
        const activeEntity = world.getEntity(activeId);

        if (activeEntity) {
            const combatant = activeEntity.getComponent('CombatantComponent');
            if (combatant) {
                // Reset turn state
                combatant.hasActedThisTurn = false;
                combatant.hasMovedThisTurn = false;
                combatant.movementUsed = 0; // Reset movement for next turn
            }
        }

        // Advance to next participant
        this.activeCombatSession.advanceTurn();

        // Show whose turn it is
        const newActiveId = this.activeCombatSession.getActiveCombatant();
        const newActiveEntity = world.getEntity(newActiveId);
        const player = world.query(['PlayerComponent'])[0];

        if (newActiveEntity && newActiveEntity.hasComponent('PlayerComponent')) {
            // Player's turn - re-select target (in case previous target died)
            this.selectFirstEnemy(world);
            world.addComponent(player.id, new MessageComponent(
                `YOUR TURN! Round ${this.activeCombatSession.round}`,
                'cyan'
            ));
            this.showSelectedTarget(world);
        } else if (newActiveEntity) {
            // Enemy's turn
            const name = newActiveEntity.getComponent('NameComponent');
            world.addComponent(player.id, new MessageComponent(
                `Enemy turn: ${name ? name.name : 'Unknown'}`,
                'yellow'
            ));
        }

    }

    checkCombatEnd(world) {
        const player = world.query(['PlayerComponent'])[0];
        if (!player) return;

        const bodyParts = player.getComponent('BodyPartsComponent');

        // Check player death
        if (bodyParts && (bodyParts.getPart('head') <= 0 || bodyParts.getPart('torso') <= 0)) {
            this.endCombat(world, 'defeat');
            return;
        }

        // Check all enemies dead
        const enemies = this.activeCombatSession.participants.filter(id => id !== player.id);
        const aliveEnemies = enemies.filter(id => {
            const entity = world.getEntity(id);
            if (!entity) return false;

            const bp = entity.getComponent('BodyPartsComponent');
            return bp && (bp.getPart('head') > 0 && bp.getPart('torso') > 0);
        });

        if (aliveEnemies.length === 0) {
            this.endCombat(world, 'victory');
        }
    }

    endCombat(world, result) {
        const player = world.query(['PlayerComponent'])[0];

        // Remove combat components
        for (const id of this.activeCombatSession.participants) {
            const entity = world.getEntity(id);
            if (entity && entity.hasComponent('CombatStateComponent')) {
                world.removeComponent(id, 'CombatStateComponent');
            }
        }

        // Handle result
        if (result === 'victory') {
            world.addComponent(player.id, new MessageComponent('Victory!', 'green'));
            // TODO: Spawn loot corpses
        } else if (result === 'defeat') {
            world.addComponent(player.id, new MessageComponent('You died! Returning to ship...', 'red'));
            // TODO: Respawn player on ship, lose expedition loot
        } else if (result === 'flee') {
            world.addComponent(player.id, new MessageComponent('Fled from combat!', 'yellow'));
        }

        // Clear combat session
        this.activeCombatSession = null;
    }

    // Request player action (called by InputSystem or UI)
    requestPlayerAction(world, actionType, args) {
        const player = world.query(['PlayerComponent'])[0];
        if (!player) return false;

        const combatant = player.getComponent('CombatantComponent');
        if (!combatant) return false;

        // Validate it's player's turn
        const activeId = this.activeCombatSession.getActiveCombatant();
        if (activeId !== player.id) {
            world.addComponent(player.id, new MessageComponent("Not your turn!", 'red'));
            return false;
        }

        // Validate action hasn't been taken
        if (combatant.hasActedThisTurn) {
            world.addComponent(player.id, new MessageComponent("Already acted this turn!", 'red'));
            return false;
        }

        // Process action via ActionResolutionSystem
        const actionSystem = world.systems.find(s => s.constructor.name === 'ActionResolutionSystem');
        if (actionSystem) {
            const success = actionSystem.resolveAction(world, player, actionType, args);
            if (success) {
                // Mark action as taken (prevents shooting twice)
                if (actionType === 'shoot') {
                    combatant.hasActedThisTurn = true;
                }

                // Only auto-advance turn for wait action
                // Flee ends combat (doesn't need turn advance)
                // Shooting does NOT end turn (player can move after shooting)
                // Turn ends via "End Turn" button
                if (actionType === 'wait') {
                    combatant.hasActedThisTurn = true;
                    this.advanceTurn(world);
                }
                // Flee ends combat entirely, no turn advance needed
            }
            return success;
        }

        return false;
    }

    // Helpers
    getDistance(pos1, pos2) {
        return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
    }

    hasLineOfSight(world, pos1, pos2) {
        // Bresenham's line algorithm with solid tile cache
        let x0 = pos1.x, y0 = pos1.y;
        let x1 = pos2.x, y1 = pos2.y;

        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;

        while (true) {
            // Skip start and end positions (can stand on edge of wall)
            if ((x0 !== pos1.x || y0 !== pos1.y) &&
                (x0 !== pos2.x || y0 !== pos2.y)) {

                // Fast cache lookup - check if wall blocks LOS
                if (world.isSolidTile(x0, y0)) {
                    return false; // Wall blocks LOS
                }
            }

            // Reached destination
            if (x0 === x1 && y0 === y1) break;

            // Step to next position
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x0 += sx;
            }
            if (e2 < dx) {
                err += dx;
                y0 += sy;
            }
        }

        return true; // No obstacles found
    }

    rollDie(sides) {
        return Math.floor(Math.random() * sides) + 1;
    }
}
