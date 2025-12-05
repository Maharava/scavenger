// InputSystem - Handles keyboard and mouse input for player actions, menus, and combat

class InputSystem extends System {
    constructor() {
        super();
        this.keys = new Set();
        this.qPressed = false; // Track q key state
        this.mouseX = null; // Mouse position in pixels
        this.mouseY = null;
        this.hoveredTileX = null; // Hovered tile coordinates
        this.hoveredTileY = null;

        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'q') {
                this.qPressed = true;
            } else if (this.keys.size === 0) {
                this.keys.add(e.key.toLowerCase());
            }
        });
        document.addEventListener('keyup', (e) => {
            if (e.key.toLowerCase() === 'q') {
                this.qPressed = false;
            }
            this.keys.delete(e.key.toLowerCase()); // Ensure key is removed on keyup
        });

        // Track mouse position over game container
        const gameContainer = document.getElementById('game-container');
        gameContainer.addEventListener('mousemove', (e) => {
            const rect = gameContainer.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;

            // Calculate which tile is hovered using actual container dimensions
            // Tile size is dynamic based on viewport size
            if (this.world && this.world.game) {
                const tileWidth = rect.width / this.world.game.width;
                const tileHeight = rect.height / this.world.game.height;

                const screenTileX = Math.floor(this.mouseX / tileWidth);
                const screenTileY = Math.floor(this.mouseY / tileHeight);

                // Convert screen coordinates to world coordinates using camera offset
                this.hoveredTileX = screenTileX + this.world.game.cameraX;
                this.hoveredTileY = screenTileY + this.world.game.cameraY;
            } else {
                // Fallback if world not yet initialized
                const TILE_SIZE = 20;
                const screenTileX = Math.floor(this.mouseX / TILE_SIZE);
                const screenTileY = Math.floor(this.mouseY / TILE_SIZE);
                this.hoveredTileX = screenTileX;
                this.hoveredTileY = screenTileY;
            }
        });

        gameContainer.addEventListener('mouseleave', () => {
            this.mouseX = null;
            this.mouseY = null;
            this.hoveredTileX = null;
            this.hoveredTileY = null;
        });

    }

    cycleTarget(world, combatSystem) {
        const player = world.query(['PlayerComponent'])[0];
        if (!player) return;

        // Get all alive enemies in combat
        const enemies = world.query(['AIComponent', 'CombatStateComponent', 'BodyPartsComponent'])
            .filter(enemy => {
                const bodyParts = enemy.getComponent('BodyPartsComponent');
                return bodyParts && bodyParts.getPart('head') > 0 && bodyParts.getPart('torso') > 0;
            });

        if (enemies.length === 0) {
            world.addComponent(player.id, new MessageComponent('No enemies to target!', 'yellow'));
            return;
        }

        // Find current selected enemy index
        const currentSelected = combatSystem.activeCombatSession.selectedEnemyId;
        let currentIndex = enemies.findIndex(e => e.id === currentSelected);

        // Cycle to next enemy
        currentIndex = (currentIndex + 1) % enemies.length;
        combatSystem.activeCombatSession.selectedEnemyId = enemies[currentIndex].id;

        // Show target name
        const targetName = enemies[currentIndex].getComponent('NameComponent');
        world.addComponent(player.id, new MessageComponent(
            `Target: ${targetName ? targetName.name : 'Enemy'}`,
            'cyan'
        ));
    }

    // Helper: Navigate vertically (up/down) in current active menu
    navigateMenuVertical(menu, direction, game) {
        const menuConfigs = {
            'main': { indexKey: 'selectedIndex', optionsKey: 'options' },
            'submenu1': { indexKey: 'submenu1SelectedIndex', optionsKey: 'submenu1' },
            'submenu2': { indexKey: 'submenu2SelectedIndex', optionsKey: 'submenu2' }
        };

        const config = menuConfigs[menu.activeMenu];
        if (!config) return;

        const submenu = menu[config.optionsKey];
        const options = menu.activeMenu === 'main' ? menu.options : (submenu ? submenu.options : null);
        if (!options) return;

        const currentIndex = menu[config.indexKey];
        const optionsLength = options.length;

        if (direction === 'up') {
            menu[config.indexKey] = currentIndex > 0 ? currentIndex - 1 : optionsLength - 1;
        } else { // down
            menu[config.indexKey] = currentIndex < optionsLength - 1 ? currentIndex + 1 : 0;
        }

        // Update workbench details if navigating in submenu2
        if (menu.activeMenu === 'submenu2' && menu.menuType === 'workbench') {
            MENU_ACTIONS['update_workbench_details'](game);
        }

        // Update skill details if navigating in submenu1 of equipment menu
        if (menu.activeMenu === 'submenu1' && menu.menuType === 'equipment') {
            MENU_ACTIONS['update_skill_details'](game);
        }
    }

    // Helper: Navigate horizontally (left/right) between menu levels
    navigateMenuHorizontal(menu, direction, game) {
        if (direction === 'left') {
            // Navigate back
            if (menu.activeMenu === 'submenu2' && menu.submenu1) {
                menu.activeMenu = 'submenu1';
                if (menu.menuType === 'workbench') {
                    MENU_ACTIONS['update_workbench_details'](game);
                }
                if (menu.menuType === 'equipment') {
                    MENU_ACTIONS['update_skill_details'](game);
                }
            } else if (menu.activeMenu === 'submenu1') {
                menu.activeMenu = 'main';
                if (menu.menuType === 'workbench' || menu.menuType === 'equipment') {
                    menu.detailsPane = null;
                }
            }
        } else { // right
            // Navigate forward
            if (menu.activeMenu === 'main' && menu.submenu1) {
                menu.activeMenu = 'submenu1';
                if (menu.menuType === 'equipment') {
                    MENU_ACTIONS['update_skill_details'](game);
                }
            } else if (menu.activeMenu === 'submenu1' && menu.submenu2) {
                menu.activeMenu = 'submenu2';
                if (menu.menuType === 'workbench') {
                    MENU_ACTIONS['update_workbench_details'](game);
                }
            }
        }
    }

    // Helper: Get currently selected option from active menu
    getSelectedOption(menu) {
        if (menu.activeMenu === 'main') {
            return menu.options[menu.selectedIndex];
        } else if (menu.activeMenu === 'submenu1' && menu.submenu1) {
            return menu.submenu1.options[menu.submenu1SelectedIndex];
        } else if (menu.activeMenu === 'submenu2' && menu.submenu2) {
            return menu.submenu2.options[menu.submenu2SelectedIndex];
        }
        return null;
    }

    update(world) {
        this.world = world; // Store reference for mouse coordinate conversion

        if (this.keys.size === 0) return;

        // Check if player is sleeping - block ALL input during sleep
        const player = world.query(['PlayerComponent', 'TimeComponent'])[0];
        if (player) {
            const timeComponent = player.getComponent('TimeComponent');
            if (timeComponent && timeComponent.isSleeping) {
                this.keys.clear();
                return;
            }
        }

        const key = this.keys.values().next().value;

        // Check for selection menu first (simpler, higher priority)
        const selectionMenuEntity = world.query(['SelectionMenuComponent'])[0];
        if (selectionMenuEntity) {
            // --- Selection Menu Input ---
            const selectionMenu = selectionMenuEntity.getComponent('SelectionMenuComponent');
            switch (key) {
                case 'w':
                    // Navigate up
                    selectionMenu.selectedIndex = Math.max(0, selectionMenu.selectedIndex - 1);
                    break;
                case 's':
                    // Navigate down
                    selectionMenu.selectedIndex = Math.min(selectionMenu.interactables.length - 1, selectionMenu.selectedIndex + 1);
                    break;
                case ' ':
                    // Select interactable
                    const selected = selectionMenu.interactables[selectionMenu.selectedIndex];
                    const interactableComp = selected.entity.getComponent('InteractableComponent');
                    const script = SCRIPT_REGISTRY[interactableComp.script];
                    if (script) {
                        script(world.game, selected.entity, interactableComp.scriptArgs);
                    }
                    // Close selection menu
                    selectionMenuEntity.removeComponent('SelectionMenuComponent');
                    break;
                case 'escape':
                    // Close selection menu
                    selectionMenuEntity.removeComponent('SelectionMenuComponent');
                    break;
            }
            this.keys.clear();
            return;
        }

        const menuEntity = world.query(['MenuComponent'])[0];

        if (menuEntity) {
            // --- Menu Input ---
            const menu = menuEntity.getComponent('MenuComponent');
            switch (key) {
                case 'w':
                    this.navigateMenuVertical(menu, 'up', world.game);
                    break;
                case 's':
                    this.navigateMenuVertical(menu, 'down', world.game);
                    break;
                case 'a':
                    this.navigateMenuHorizontal(menu, 'left', world.game);
                    break;
                case 'd':
                    this.navigateMenuHorizontal(menu, 'right', world.game);
                    break;
                case ' ':
                    // Select option in current active menu
                    const selectedOption = this.getSelectedOption(menu);
                    if (selectedOption) {
                        const actionTarget = selectedOption.actionArgs || menu.interactable;
                        const action = MENU_ACTIONS[selectedOption.action];
                        if (action) {
                            action(world.game, actionTarget);
                        }
                    }
                    break;
                case 'escape':
                    // Close current submenu level or entire menu
                    if (menu.activeMenu === 'submenu2' && menu.submenu2) {
                        menu.submenu2 = null;
                        menu.activeMenu = 'submenu1';
                        if (menu.menuType === 'workbench') {
                            menu.detailsPane = null;
                        }
                    } else if (menu.activeMenu === 'submenu1' && menu.submenu1) {
                        menu.submenu1 = null;
                        menu.submenu2 = null; // Cascade close
                        menu.activeMenu = 'main';
                        if (menu.menuType === 'workbench') {
                            menu.detailsPane = null;
                        }
                    } else {
                        MENU_ACTIONS['close_menu'](world.game);
                    }
                    break;
            }
        } else { // Process player input
            // --- Player Input ---
            const player = world.query(['PlayerComponent'])[0];
            if (!player || player.hasComponent('ActionComponent')) {
                this.keys.clear();
                return;
            }

            // Check if player is in combat
            const inCombat = player.hasComponent('CombatStateComponent');
            const combatSystem = world.systems.find(s => s.constructor.name === 'CombatSystem');

            // --- Combat-specific Input ---
            if (inCombat && combatSystem && combatSystem.activeCombatSession) {
                const activeId = combatSystem.activeCombatSession.getActiveCombatant();
                const isPlayerTurn = activeId === player.id;

                if (isPlayerTurn) {
                    switch (key) {
                        case 'r': // Cycle through enemies
                            this.cycleTarget(world, combatSystem);
                            this.keys.clear();
                            return;
                        case ' ': // Space - shoot at selected enemy
                            if (combatSystem.activeCombatSession.selectedEnemyId) {
                                combatSystem.requestPlayerAction(world, 'shoot', {
                                    targetId: combatSystem.activeCombatSession.selectedEnemyId
                                });
                            } else {
                                world.addComponent(player.id, new MessageComponent('No target selected! Press R to select.', 'red'));
                            }
                            this.keys.clear();
                            return;
                        case 'f': // Flee from combat
                            combatSystem.requestPlayerAction(world, 'flee');
                            this.keys.clear();
                            return;
                        case 'e': // End turn
                            const combatant = player.getComponent('CombatantComponent');
                            if (combatant) {
                                combatant.hasActedThisTurn = true;
                                combatSystem.advanceTurn(world);
                            }
                            this.keys.clear();
                            return;
                    }
                }
            }

            // --- Normal Input (movement, menus, etc.) ---
            // Movement works both in and out of combat
            let action = null;
            switch (key) {
                case 'w': action = new ActionComponent('move', { dx: 0, dy: -1 }); break;
                case 'a': action = new ActionComponent('move', { dx: -1, dy: 0 }); break;
                case 's': action = new ActionComponent('move', { dx: 0, dy: 1 }); break;
                case 'd': action = new ActionComponent('move', { dx: 1, dy: 0 }); break;
                case ' ':
                    if (!inCombat) {
                        action = new ActionComponent('activate');
                    }
                    break;
                case 'i':
                    if (inCombat) {
                        world.addComponent(player.id, new MessageComponent("Can't access inventory during combat!", 'red'));
                    } else {
                        SCRIPT_REGISTRY['openInventoryMenu'](world.game, player);
                    }
                    break;
                case 'c':
                    // Allow opening character/equipment screen in combat (read-only)
                    MENU_ACTIONS['view_equipment'](world.game);
                    break;
            }

            if (action) {
                world.addComponent(player.id, action);
            }
        }

        // Clear only the action keys, not the alt key state
        if (this.keys.size > 0) {
            this.keys.clear();
        }
    }
}
