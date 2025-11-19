// This file contains all System definitions for the ECS.

class RenderSystem extends System {
    constructor() {
        super();
        this.messageOverlay = document.getElementById('message-overlay-container');
        this.itemNameOverlay = document.getElementById('item-name-overlay-container'); // New overlay for item names
        this.menuOverlay = document.getElementById('menu-overlay-container'); // New overlay for menus
        this.blinkState = false; // For target blinking
        this.lastBlinkTime = 0;
    }

    update(world) {
        this.world = world; // Store reference for helper methods
        const container = world.game.container;
        const width = world.game.width;
        const height = world.game.height;

        // Update blink state (every 500ms)
        const now = Date.now();
        if (now - this.lastBlinkTime > 500) {
            this.blinkState = !this.blinkState;
            this.lastBlinkTime = now;
        }

        // Get combat info for target blinking
        const player = world.query(['PlayerComponent'])[0];
        const combatSystem = world.systems.find(s => s.constructor.name === 'CombatSystem');
        const inCombat = player && player.hasComponent('CombatStateComponent');
        let selectedEnemyId = null;
        let isPlayerTurn = false;

        if (inCombat && combatSystem && combatSystem.activeCombatSession) {
            selectedEnemyId = combatSystem.activeCombatSession.selectedEnemyId;
            const activeId = combatSystem.activeCombatSession.getActiveCombatant();
            isPlayerTurn = player && activeId === player.id;
        }

        // --- Grid Rendering ---
        const grid = Array.from({ length: height }, () =>
            Array.from({ length: width }, () => ({ char: ' ', colour: '#000' }))
        );

        const renderables = world.query(['PositionComponent', 'RenderableComponent']);
        renderables.sort((a, b) => {
            const layerA = a.getComponent('RenderableComponent').layer;
            const layerB = b.getComponent('RenderableComponent').layer;
            return layerA - layerB;
        });

        for (const entity of renderables) {
            const pos = entity.getComponent('PositionComponent');
            const render = entity.getComponent('RenderableComponent');

            // Check if this is the selected enemy during player's turn
            const isSelectedEnemy = isPlayerTurn && entity.id === selectedEnemyId;

            // Skip rendering selected enemy every other blink cycle (makes it blink)
            if (isSelectedEnemy && !this.blinkState) {
                continue; // Don't render = appears to blink off
            }

            if (pos.x >= 0 && pos.x < width && pos.y >= 0 && pos.y < height) {
                grid[pos.y][pos.x] = {
                    char: render.char,
                    colour: isSelectedEnemy ? '#ffff00' : render.colour // Yellow when selected
                };
            }
        }

        // Preserve the overlay before clearing
        const overlay = this.itemNameOverlay;
        const overlayParent = overlay.parentElement;

        container.innerHTML = '';
        container.style.gridTemplateColumns = `repeat(${width}, 1fr)`;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const tileData = grid[y][x];
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.textContent = tileData.char;
                tile.style.color = tileData.colour;
                container.appendChild(tile);
            }
        }

        // Re-append the overlay after tiles are added
        if (overlayParent === container) {
            container.appendChild(overlay);
        }

        // --- UI Rendering ---
        overlay.innerHTML = ''; // Clear old item names from overlay

        const menuEntity = world.query(['MenuComponent'])[0];
        if (menuEntity) {
            this.#renderMenu(container, menuEntity.getComponent('MenuComponent'));
        } else {
            // Clear menu overlay when no menu is active
            this.menuOverlay.innerHTML = '';
        }

        // --- Item Name Overlay / Range Visualization Rendering ---
        const inputSystem = world.systems.find(s => s instanceof InputSystem);

        if (inputSystem && inputSystem.qPressed) {
            if (inCombat) {
                // During combat: Show weapon range
                this.#renderWeaponRange(world, container);
            } else {
                // Outside combat: Show item names
                this.#renderItemNames(world, overlay);
            }
        }
    }

    #renderMenu(container, menu) {
        // Clear the menu overlay before rendering new menu elements
        this.menuOverlay.innerHTML = '';

        const gap = 10; // Gap between menus
        const menuContainers = [];

        // Render main menu
        const mainContainer = this.#createMenuContainer(
            menu.title,
            menu.options,
            menu.selectedIndex,
            menu.activeMenu === 'main'
        );
        mainContainer.className = 'menu-container menu-main';
        menuContainers.push({ element: mainContainer, level: 'main', menu: menu });
        this.menuOverlay.appendChild(mainContainer);

        // Render submenu1 if it exists
        if (menu.submenu1) {
            const submenu1Container = this.#createMenuContainer(
                menu.submenu1.title,
                menu.submenu1.options,
                menu.submenu1SelectedIndex,
                menu.activeMenu === 'submenu1'
            );
            submenu1Container.className = 'menu-container menu-submenu1';
            menuContainers.push({ element: submenu1Container, level: 'submenu1', menu: menu });
            this.menuOverlay.appendChild(submenu1Container);
        }

        // Render submenu2 if it exists
        if (menu.submenu2) {
            const submenu2Container = this.#createMenuContainer(
                menu.submenu2.title,
                menu.submenu2.options,
                menu.submenu2SelectedIndex,
                menu.activeMenu === 'submenu2'
            );
            submenu2Container.className = 'menu-container menu-submenu2';
            menuContainers.push({ element: submenu2Container, level: 'submenu2', menu: menu });
            this.menuOverlay.appendChild(submenu2Container);
        }

        // Position menus independently
        this.#positionMenus(menuContainers, gap);

        // Render details pane if it exists
        if (menu.detailsPane) {
            const detailsElement = this.#createDetailsPane(menu.detailsPane);
            this.menuOverlay.appendChild(detailsElement);

            // Position details pane: for workbench, position above submenu1; otherwise above main menu
            const referenceContainer = (menu.menuType === 'workbench' && menuContainers.length > 1)
                ? menuContainers[1].element  // submenu1
                : mainContainer;              // main menu
            this.#positionDetailsPane(detailsElement, referenceContainer, gap);
        }
    }

    #createMenuContainer(title, options, selectedIndex, isActive) {
        const container = document.createElement('div');

        const titleElement = document.createElement('h3');
        titleElement.textContent = title;
        container.appendChild(titleElement);

        options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'menu-option';
            if (index === selectedIndex && isActive) {
                optionElement.classList.add('selected');
            }
            optionElement.textContent = option.label;
            container.appendChild(optionElement);
        });

        return container;
    }

    #positionMenus(menuContainers, gap) {
        if (menuContainers.length === 0) return;

        const mainContainer = menuContainers[0].element;
        const mainWidth = mainContainer.offsetWidth;
        const mainHeight = mainContainer.offsetHeight;
        const screenCenterY = window.innerHeight / 2;

        // Get menu type from the menu element's dataset or determine from context
        const menu = menuContainers[0].menu;
        let mainX;

        // Position workbench menus at 1/3 from left, inventory at center
        if (menu && menu.menuType === 'workbench') {
            mainX = window.innerWidth / 3;
        } else {
            mainX = window.innerWidth / 2;
        }

        // Position main menu
        mainContainer.style.position = 'absolute';
        mainContainer.style.left = `${mainX - mainWidth / 2}px`;
        mainContainer.style.top = `${screenCenterY - mainHeight / 2}px`;

        // Position submenu1 to the right of main
        if (menuContainers.length > 1) {
            const submenu1Container = menuContainers[1].element;
            submenu1Container.style.position = 'absolute';
            submenu1Container.style.left = `${mainX + mainWidth / 2 + gap}px`;
            submenu1Container.style.top = `${screenCenterY - submenu1Container.offsetHeight / 2}px`;

            // Position submenu2 to the right of submenu1
            if (menuContainers.length > 2) {
                const submenu2Container = menuContainers[2].element;
                const submenu1Width = submenu1Container.offsetWidth;
                submenu2Container.style.position = 'absolute';
                submenu2Container.style.left = `${mainX + mainWidth / 2 + gap + submenu1Width + gap}px`;
                submenu2Container.style.top = `${screenCenterY - submenu2Container.offsetHeight / 2}px`;
            }
        }
    }

    #createDetailsPane(detailsData) {
        const detailsPane = document.createElement('div');
        detailsPane.className = 'details-pane';

        // Title
        const title = document.createElement('h4');
        title.textContent = detailsData.title;
        detailsPane.appendChild(title);

        // Content lines
        detailsData.lines.forEach(line => {
            const lineElement = document.createElement('div');
            lineElement.className = 'details-line';
            lineElement.textContent = line;
            detailsPane.appendChild(lineElement);
        });

        return detailsPane;
    }

    #positionDetailsPane(detailsElement, mainContainer, gap) {
        const mainRect = mainContainer.getBoundingClientRect();
        const detailsHeight = detailsElement.offsetHeight;
        const detailsWidth = detailsElement.offsetWidth;

        // Default: position above main menu, centered
        let left = mainRect.left + (mainRect.width / 2) - (detailsWidth / 2);
        let top = mainRect.top - detailsHeight - gap;

        // Check if it goes off the top of the screen
        if (top < gap) {
            // Try positioning below instead
            const bottomPosition = mainRect.bottom + gap;
            if (bottomPosition + detailsHeight + gap < window.innerHeight) {
                top = bottomPosition;
            } else {
                // If neither works, position at top with small gap
                top = gap;
            }
        }

        // Check horizontal bounds
        if (left < gap) {
            left = gap;
        } else if (left + detailsWidth + gap > window.innerWidth) {
            left = window.innerWidth - detailsWidth - gap;
        }

        detailsElement.style.position = 'absolute';
        detailsElement.style.left = `${left}px`;
        detailsElement.style.top = `${top}px`;
    }

    #renderWeaponRange(world, container) {
        const TILE_SIZE = 20; // Should match style.css
        const player = world.query(['PlayerComponent'])[0];
        if (!player) return;

        const equipped = player.getComponent('EquippedItemsComponent');
        if (!equipped || !equipped.hand) return; // No weapon equipped

        const weapon = world.getEntity(equipped.hand);
        if (!weapon || !weapon.hasComponent('GunStatsComponent')) return;

        const gunStats = weapon.getComponent('GunStatsComponent');
        const playerPos = player.getComponent('PositionComponent');
        const weaponRange = gunStats.range;

        // Clear existing range indicators
        const existingIndicators = container.querySelectorAll('.range-indicator');
        existingIndicators.forEach(el => el.remove());

        // Render range indicators for all tiles within weapon range
        for (let y = 0; y < world.game.height; y++) {
            for (let x = 0; x < world.game.width; x++) {
                const distance = Math.abs(x - playerPos.x) + Math.abs(y - playerPos.y);

                if (distance <= weaponRange && distance > 0) { // Exclude player's own tile
                    const rangeElement = document.createElement('div');
                    rangeElement.className = 'range-indicator';
                    rangeElement.style.position = 'absolute';
                    rangeElement.style.left = `${x * TILE_SIZE}px`;
                    rangeElement.style.top = `${y * TILE_SIZE}px`;
                    rangeElement.style.width = `${TILE_SIZE}px`;
                    rangeElement.style.height = `${TILE_SIZE}px`;
                    rangeElement.style.backgroundColor = 'rgba(255, 255, 0, 0.2)'; // Transparent yellow
                    rangeElement.style.border = '1px solid rgba(255, 255, 0, 0.4)';
                    rangeElement.style.pointerEvents = 'none'; // Don't block clicks
                    rangeElement.style.zIndex = '5';

                    container.appendChild(rangeElement);
                }
            }
        }
    }

    #renderItemNames(world, overlayContainer) {
        const TILE_SIZE = 20; // Should match style.css
        const entities = world.query(['PositionComponent', 'NameComponent']);
        const inputSystem = world.systems.find(s => s instanceof InputSystem);

        // Separate hovered and non-hovered entities
        const hoveredEntities = [];
        const normalEntities = [];

        for (const entity of entities) {
            // Only show names for items and non-door interactables
            const isItem = entity.hasComponent('ItemComponent');
            const isInteractable = entity.hasComponent('InteractableComponent');
            const isDoor = isInteractable && (entity.getComponent('InteractableComponent').scriptArgs && (entity.getComponent('InteractableComponent').scriptArgs.title === 'Door' || entity.getComponent('InteractableComponent').scriptArgs.title === 'Open Doorway'));

            if (isItem || (isInteractable && !isDoor)) {
                const pos = entity.getComponent('PositionComponent');

                // Check if this entity is at the hovered tile position
                const isHovered = inputSystem &&
                                  inputSystem.hoveredTileX === pos.x &&
                                  inputSystem.hoveredTileY === pos.y;

                if (isHovered) {
                    hoveredEntities.push(entity);
                } else {
                    normalEntities.push(entity);
                }
            }
        }

        // Render normal entities first
        for (const entity of normalEntities) {
            const pos = entity.getComponent('PositionComponent');
            const name = entity.getComponent('NameComponent').name;

            const nameElement = document.createElement('div');
            nameElement.className = 'item-name-tag';
            nameElement.textContent = name;

            nameElement.style.left = `${pos.x * TILE_SIZE + (TILE_SIZE / 2)}px`;
            nameElement.style.top = `${(pos.y * TILE_SIZE) - 16}px`;
            nameElement.style.zIndex = '10';

            overlayContainer.appendChild(nameElement);
        }

        // Render hovered entities last (on top)
        for (const entity of hoveredEntities) {
            const pos = entity.getComponent('PositionComponent');
            const name = entity.getComponent('NameComponent').name;

            const nameElement = document.createElement('div');
            nameElement.className = 'item-name-tag item-name-tag-hovered';
            nameElement.textContent = name;

            nameElement.style.left = `${pos.x * TILE_SIZE + (TILE_SIZE / 2)}px`;
            nameElement.style.top = `${(pos.y * TILE_SIZE) - 16}px`;
            nameElement.style.zIndex = '100'; // Higher z-index for hovered items

            overlayContainer.appendChild(nameElement);
        }
    }
}

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

            // Calculate which tile is hovered (20px per tile from style.css)
            const TILE_SIZE = 20;
            this.hoveredTileX = Math.floor(this.mouseX / TILE_SIZE);
            this.hoveredTileY = Math.floor(this.mouseY / TILE_SIZE);
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

    update(world) {
        if (this.keys.size === 0) return; 
        
        const key = this.keys.values().next().value;

        const menuEntity = world.query(['MenuComponent'])[0];

        if (menuEntity) {
            // --- Menu Input ---
            const menu = menuEntity.getComponent('MenuComponent');
            switch (key) {
                case 'w':
                    // Navigate up in current active menu
                    if (menu.activeMenu === 'main') {
                        menu.selectedIndex = (menu.selectedIndex > 0) ? menu.selectedIndex - 1 : menu.options.length - 1;
                    } else if (menu.activeMenu === 'submenu1' && menu.submenu1) {
                        menu.submenu1SelectedIndex = (menu.submenu1SelectedIndex > 0) ? menu.submenu1SelectedIndex - 1 : menu.submenu1.options.length - 1;
                    } else if (menu.activeMenu === 'submenu2' && menu.submenu2) {
                        menu.submenu2SelectedIndex = (menu.submenu2SelectedIndex > 0) ? menu.submenu2SelectedIndex - 1 : menu.submenu2.options.length - 1;
                        // Update workbench details when navigating in submenu2
                        if (menu.menuType === 'workbench') {
                            MENU_ACTIONS['update_workbench_details'](world.game);
                        }
                    }
                    break;
                case 's':
                    // Navigate down in current active menu
                    if (menu.activeMenu === 'main') {
                        menu.selectedIndex = (menu.selectedIndex < menu.options.length - 1) ? menu.selectedIndex + 1 : 0;
                    } else if (menu.activeMenu === 'submenu1' && menu.submenu1) {
                        menu.submenu1SelectedIndex = (menu.submenu1SelectedIndex < menu.submenu1.options.length - 1) ? menu.submenu1SelectedIndex + 1 : 0;
                    } else if (menu.activeMenu === 'submenu2' && menu.submenu2) {
                        menu.submenu2SelectedIndex = (menu.submenu2SelectedIndex < menu.submenu2.options.length - 1) ? menu.submenu2SelectedIndex + 1 : 0;
                        // Update workbench details when navigating in submenu2
                        if (menu.menuType === 'workbench') {
                            MENU_ACTIONS['update_workbench_details'](world.game);
                        }
                    }
                    break;
                case 'a':
                    // Navigate back through menu levels
                    if (menu.activeMenu === 'submenu2' && menu.submenu1) {
                        menu.activeMenu = 'submenu1';
                        // Update workbench details when navigating back
                        if (menu.menuType === 'workbench') {
                            MENU_ACTIONS['update_workbench_details'](world.game);
                        }
                    } else if (menu.activeMenu === 'submenu1') {
                        menu.activeMenu = 'main';
                        // Clear details when navigating back to main
                        if (menu.menuType === 'workbench') {
                            menu.detailsPane = null;
                        }
                    }
                    break;
                case 'd':
                    // Navigate forward through menu levels
                    if (menu.activeMenu === 'main' && menu.submenu1) {
                        menu.activeMenu = 'submenu1';
                    } else if (menu.activeMenu === 'submenu1' && menu.submenu2) {
                        menu.activeMenu = 'submenu2';
                        // Update workbench details when navigating forward
                        if (menu.menuType === 'workbench') {
                            MENU_ACTIONS['update_workbench_details'](world.game);
                        }
                    }
                    break;
                case ' ':
                    // Select option in current active menu
                    let selectedOption;
                    if (menu.activeMenu === 'main') {
                        selectedOption = menu.options[menu.selectedIndex];
                    } else if (menu.activeMenu === 'submenu1' && menu.submenu1) {
                        selectedOption = menu.submenu1.options[menu.submenu1SelectedIndex];
                    } else if (menu.activeMenu === 'submenu2' && menu.submenu2) {
                        selectedOption = menu.submenu2.options[menu.submenu2SelectedIndex];
                    }

                    if (selectedOption) {
                        // If actionArgs exist, pass them, otherwise pass menu.interactable
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
                        // Clear details pane when closing submenu2 for workbench
                        if (menu.menuType === 'workbench') {
                            menu.detailsPane = null;
                        }
                    } else if (menu.activeMenu === 'submenu1' && menu.submenu1) {
                        menu.submenu1 = null;
                        menu.submenu2 = null; // Cascade close
                        menu.activeMenu = 'main';
                        // Clear details pane when closing submenu1
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

class MovementSystem extends System {
    update(world) {
        const entities = world.query(['ActionComponent', 'PositionComponent']);
        const solidEntities = world.query(['PositionComponent', 'SolidComponent']);
        const width = world.game.width;
        const height = world.game.height;

        for (const entity of entities) {
            const action = entity.getComponent('ActionComponent');
            if (action.name !== 'move') continue;

            // Check if entity is in combat and has movement limits
            const inCombat = entity.hasComponent('CombatStateComponent');
            if (inCombat) {
                const combatant = entity.getComponent('CombatantComponent');
                if (combatant) {
                    // Calculate maximum movement for this turn
                    const movementMax = this.calculateMovementMax(world, entity, combatant);

                    // Check if movement exhausted
                    if (combatant.movementUsed >= movementMax) {
                        if (entity.hasComponent('PlayerComponent')) {
                            world.addComponent(entity.id, new MessageComponent(
                                `No movement remaining! (${combatant.movementUsed}/${movementMax})`,
                                'red'
                            ));
                        }
                        entity.removeComponent('ActionComponent');
                        continue;
                    }
                }
            }

            const pos = entity.getComponent('PositionComponent');
            const targetX = pos.x + action.payload.dx;
            const targetY = pos.y + action.payload.dy;

            if (targetX < 0 || targetX >= width || targetY < 0 || targetY >= height) {
                entity.removeComponent('ActionComponent');
                continue;
            }

            let collision = false;
            for (const solid of solidEntities) {
                if (solid.id === entity.id) continue;
                const solidPos = solid.getComponent('PositionComponent');
                if (solidPos.x === targetX && solidPos.y === targetY) {
                    collision = true;
                    break;
                }
            }

            if (!collision) {
                pos.x = targetX;
                pos.y = targetY;

                // Track movement usage in combat
                if (inCombat) {
                    const combatant = entity.getComponent('CombatantComponent');
                    if (combatant) {
                        combatant.movementUsed++;
                    }
                }
            }

            entity.removeComponent('ActionComponent');
        }
    }

    calculateMovementMax(world, entity, combatant) {
        let movementMax = combatant.movementPerTurn; // Base 4 tiles

        // 1. Limb damage penalty
        const bodyParts = entity.getComponent('BodyPartsComponent');
        if (bodyParts) {
            const limbsEfficiency = bodyParts.getPart('limbs');
            if (limbsEfficiency < 70) {
                const efficiencyLost = 100 - limbsEfficiency;
                const penalty = Math.floor(efficiencyLost / 30);
                movementMax -= penalty;
            }
        }

        // 2. Weight penalty (encumbrance)
        const inventory = entity.getComponent('InventoryComponent');
        if (inventory) {
            const totalWeight = inventory.getTotalWeight(world);
            const maxWeight = inventory.maxWeight;
            if (totalWeight > maxWeight) {
                const overWeight = totalWeight - maxWeight;
                const penalty = Math.floor(overWeight / 1000);
                movementMax -= penalty;
            }
        }

        // 3. Armor penalty (future implementation - heavy armor)
        // TODO: Add armor weight penalty

        // Minimum 1 tile (always can move at least 1 tile)
        return Math.max(1, movementMax);
    }
}

class MessageSystem extends System {
    constructor() {
        super();
        this.messageLog = document.getElementById('message-log');
    }

    update(world) {
        // This system no longer processes messages with duration.
        // Instead, it acts as a sink for new MessageComponents,
        // appending them to the message log and then removing the component.
        const entitiesWithNewMessages = world.query(['MessageComponent']);
        for (const entity of entitiesWithNewMessages) {
            const msg = entity.getComponent('MessageComponent');
            const msgElement = document.createElement('div');
            msgElement.textContent = msg.text;
            msgElement.className = 'message-log-entry';
            if (msg.colour) {
                msgElement.style.color = msg.colour;
            }
            this.messageLog.prepend(msgElement);

            entity.removeComponent('MessageComponent'); // Remove the component after logging
        }
    }
}

class ProjectileSystem extends System {
    update(world, deltaTime) {
        const projectiles = world.query(['ProjectileComponent', 'PositionComponent']);

        if (projectiles.length > 0) {
            console.log('Updating', projectiles.length, 'projectiles, deltaTime:', deltaTime);
        }

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
                console.log('Projectile at same position as target, removing');
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

            console.log('Projectile progress:', projectile.progress, 'at', [pos.x, pos.y]);

            // Remove when reached destination
            if (projectile.progress >= 1) {
                console.log('Projectile reached destination, removing');
                world.destroyEntity(entity.id);
            }
        }
    }
}

class HudSystem extends System {
    update(world) {
        const player = world.query(['PlayerComponent', 'CreatureStatsComponent', 'NameComponent'])[0];
        if (!player) return;

        const stats = player.getComponent('CreatureStatsComponent');
        const bodyParts = player.getComponent('BodyPartsComponent');
        const name = player.getComponent('NameComponent');
        const inventory = player.getComponent('InventoryComponent');

        // Get equipment modifiers
        const modifiers = getEquipmentModifiers(world, player);

        // Apply modifiers to displayed stats
        const displayHunger = Math.min(100, stats.hunger + (modifiers.hunger || 0));
        const displayRest = Math.min(100, stats.rest + (modifiers.rest || 0));
        const displayStress = Math.min(100, stats.stress + (modifiers.stress || 0));
        const displayComfort = Math.min(100, stats.comfort + (modifiers.comfort || 0));

        document.getElementById('hud-title').textContent = name.name;
        document.getElementById('bar-hunger').querySelector('.bar-fill').style.width = `${displayHunger}%`;
        document.getElementById('bar-rest').querySelector('.bar-fill').style.width = `${displayRest}%`;
        document.getElementById('bar-stress').querySelector('.bar-fill').style.width = `${displayStress}%`;
        document.getElementById('bar-comfort').querySelector('.bar-fill').style.width = `${displayComfort}%`;

        // Display body parts - only show parts below 100%
        const bodyPartsContainer = document.getElementById('hud-body-parts');
        if (bodyParts) {
            const damagedParts = bodyParts.getDamagedParts();
            if (damagedParts.length > 0) {
                const partTexts = damagedParts.map(part => {
                    // Capitalize first letter of part name
                    const displayName = part.name.charAt(0).toUpperCase() + part.name.slice(1);
                    const modifier = modifiers[part.name] || 0;
                    const displayEfficiency = Math.min(100, part.efficiency + modifier);
                    return `${displayName}: ${displayEfficiency}%${modifier ? ` (+${modifier})` : ''}`;
                });
                bodyPartsContainer.textContent = partTexts.join(' | ');
            } else {
                bodyPartsContainer.textContent = '';
            }
        }

        // Display inventory weight and slots
        if (inventory) {
            const currentWeight = inventory.getTotalWeight(world);
            const maxWeight = inventory.maxWeight;
            const usedSlots = inventory.getTotalSlotsUsed(world);
            const maxSlots = inventory.capacity;

            document.getElementById('hud-weight').textContent = `Weight: ${currentWeight}g/${maxWeight}g`;
            document.getElementById('hud-inventory').textContent = `Slots: ${usedSlots.toFixed(1)}/${maxSlots}`;
        }
    }
}

class InteractionSystem extends System {
    update(world) {
        const actors = world.query(['ActionComponent', 'PositionComponent']);
        const interactables = world.query(['PositionComponent', 'InteractableComponent']);

        for (const actor of actors) {
            const action = actor.getComponent('ActionComponent');
            if (action.name !== 'activate') continue;

            const actorPos = actor.getComponent('PositionComponent');

            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx === 0 && dy === 0) continue;
                    
                    const checkX = actorPos.x + dx;
                    const checkY = actorPos.y + dy;

                    for (const interactable of interactables) {
                        const interactablePos = interactable.getComponent('PositionComponent');
                        if (interactablePos.x === checkX && interactablePos.y === checkY) {
                            const interactableComp = interactable.getComponent('InteractableComponent');
                            
                            const script = SCRIPT_REGISTRY[interactableComp.script];
                            if (script) {
                                script(world.game, interactable, interactableComp.scriptArgs);
                            }
                            
                            actor.removeComponent('ActionComponent');
                            return;
                        }
                    }
                }
            }
            actor.removeComponent('ActionComponent');
        }
    }
}

// ComfortSystem - Manages comfort modifiers and stress adjustments
class ComfortSystem extends System {
    constructor() {
        super();
        this.lastUpdateTime = Date.now();
        this.stressAdjustmentTimer = 0; // Timer for stress adjustments (every 30 seconds)
    }

    update(world) {
        const now = Date.now();
        const deltaTime = (now - this.lastUpdateTime) / 1000; // Convert to seconds
        this.lastUpdateTime = now;

        // Update stress adjustment timer
        this.stressAdjustmentTimer += deltaTime;

        const players = world.query(['PlayerComponent', 'CreatureStatsComponent', 'ComfortModifiersComponent']);
        for (const player of players) {
            const stats = player.getComponent('CreatureStatsComponent');
            const comfortMods = player.getComponent('ComfortModifiersComponent');

            // Update comfort modifiers (remove expired ones)
            comfortMods.updateModifiers(deltaTime);

            // Calculate total comfort (base 50 + modifiers)
            const totalModifier = comfortMods.getTotalModifier();
            stats.comfort = Math.max(0, Math.min(100, 50 + totalModifier));

            // Every 30 seconds, adjust stress based on comfort
            if (this.stressAdjustmentTimer >= 30) {
                if (stats.comfort <= 30) {
                    // Low comfort increases stress (penalty)
                    stats.stress = Math.min(100, stats.stress + 1);
                } else if (stats.comfort >= 80) {
                    // High comfort decreases stress (relief)
                    stats.stress = Math.max(0, stats.stress - 1);
                }
            }
        }

        // Reset timer after 30 seconds
        if (this.stressAdjustmentTimer >= 30) {
            this.stressAdjustmentTimer = 0;
        }
    }
}

// --- COMBAT SYSTEMS ---

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
        console.log('Combat starting with participants:', participantIds, 'Player initiated:', playerInitiated);

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

        console.log('Turn order:', this.activeCombatSession.turnOrder);
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
            console.log('advanceTurn called but combat session is null');
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

        // If new round, log it
        if (this.activeCombatSession.activeIndex === 0) {
            // this.rollInitiative(world);  // Uncomment for dynamic initiative
            console.log(`Round ${this.activeCombatSession.round} begins`);
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
        console.log('Combat ending:', result);

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
        // Simple LOS: no walls between points (Bresenham line algorithm)
        // For now, return true (implement proper LOS later)
        return true;
    }

    rollDie(sides) {
        return Math.floor(Math.random() * sides) + 1;
    }
}

// ActionResolutionSystem - Resolves combat actions (shoot, aim, wait, flee, use item)
class ActionResolutionSystem extends System {
    update(world) {
        // Actions are triggered by requestPlayerAction() or AI system
        // This system doesn't update every frame, it's called on-demand
    }

    resolveAction(world, actorEntity, actionType, args) {
        switch (actionType) {
            case 'shoot':
                return this.resolveShoot(world, actorEntity, args.targetId);
            case 'wait':
                return this.resolveWait(world, actorEntity);
            case 'flee':
                return this.resolveFlee(world, actorEntity);
            case 'use_item':
                return this.resolveUseItem(world, actorEntity, args.itemId);
            default:
                console.error('Unknown action type:', actionType);
                return false;
        }
    }

    resolveShoot(world, attacker, targetId) {
        const target = world.getEntity(targetId);
        if (!target) return false;

        // Get weapon stats
        const equipped = attacker.getComponent('EquippedItemsComponent');
        if (!equipped || !equipped.hand) {
            world.addComponent(attacker.id, new MessageComponent('No weapon equipped!', 'red'));
            return false;
        }

        const weapon = world.getEntity(equipped.hand);
        if (!weapon) {
            world.addComponent(attacker.id, new MessageComponent('Weapon not found!', 'red'));
            return false;
        }

        if (!weapon.hasComponent('GunStatsComponent')) {
            // Calculate gun stats if not present
            updateGunStats(world, weapon);
        }
        const gunStats = weapon.getComponent('GunStatsComponent');

        // Check if weapon is valid (has required parts)
        if (!isEquipmentValid(world, weapon)) {
            world.addComponent(attacker.id, new MessageComponent('Weapon missing required parts!', 'red'));
            return false;
        }

        // Get distance to target
        const attackerPos = attacker.getComponent('PositionComponent');
        const targetPos = target.getComponent('PositionComponent');
        const distance = Math.abs(attackerPos.x - targetPos.x) + Math.abs(attackerPos.y - targetPos.y);

        // Spawn bullet projectile
        const bulletId = world.createEntity();
        const bulletChar = gunStats.damageType === 'energy' ? '~' : '•';
        const bulletColour = gunStats.damageType === 'energy' ? '#0ff' : '#ff0';

        console.log('Creating projectile:', {
            from: [attackerPos.x, attackerPos.y],
            to: [targetPos.x, targetPos.y],
            char: bulletChar,
            colour: bulletColour
        });

        world.addComponent(bulletId, new ProjectileComponent(
            attackerPos.x,
            attackerPos.y,
            targetPos.x,
            targetPos.y,
            bulletChar,
            bulletColour,
            8  // Speed: 8 tiles per second (slowed down to be visible)
        ));
        world.addComponent(bulletId, new PositionComponent(attackerPos.x, attackerPos.y));
        world.addComponent(bulletId, new RenderableComponent(bulletChar, bulletColour, 100)); // High z-index

        console.log('Projectile entity created:', bulletId);

        // Calculate hit chance (allows out-of-range shooting with penalties)
        const result = this.calculateHitChance(world, attacker, target, gunStats, distance);
        const hitChance = result.hitChance;
        const modifiers = result.modifiers;

        // Roll to hit
        const roll = Math.random() * 100;
        const hit = roll <= hitChance;

        // Names
        const isPlayerAttacker = attacker.hasComponent('PlayerComponent');
        const targetName = target.getComponent('NameComponent');
        const targetDisplayName = targetName ? targetName.name : 'enemy';

        // Console logging for player shots
        if (isPlayerAttacker) {
            console.log('=== PLAYER SHOOTS', targetDisplayName.toUpperCase(), '===');
            console.log('Base accuracy:', modifiers.base + '%');
            if (modifiers.firstStrike) console.log('First strike bonus:', modifiers.firstStrike + '%');
            if (modifiers.stress) console.log('Stress modifier:', (modifiers.stress > 0 ? '+' : '') + modifiers.stress + '%');
            if (modifiers.headDamage) console.log('Head damage penalty:', modifiers.headDamage + '%');
            if (modifiers.torsoDamage) console.log('Torso damage penalty:', modifiers.torsoDamage + '%');
            if (modifiers.outOfRange) console.log('Out of range penalty:', modifiers.outOfRange + '% (' + distance + ' tiles, range ' + gunStats.range + ')');
            console.log('Final hit chance:', hitChance.toFixed(1) + '%');
            console.log('Roll:', roll.toFixed(1), '->', hit ? 'HIT!' : 'MISS');
        }

        if (hit) {
            // Create damage event
            const damageEvent = new DamageEventComponent(
                attacker.id,
                target.id,
                gunStats.damageAmount,
                gunStats.damageType,
                null  // Auto-select body part
            );

            // Add damage event to target for DamageSystem to process
            world.addComponent(target.id, damageEvent);

            // Flavor text for player
            if (isPlayerAttacker) {
                const hitFlavor = getRandomFlavor('HIT');
                world.addComponent(attacker.id, new MessageComponent(
                    `${hitFlavor} ${targetDisplayName}!`,
                    'green'
                ));

                // Add body part status message after hit
                setTimeout(() => {
                    const bodyStatus = this.getBodyPartStatusMessage(target);
                    if (bodyStatus) {
                        world.addComponent(attacker.id, new MessageComponent(bodyStatus, 'yellow'));
                    }
                }, 100);
            } else {
                world.addComponent(attacker.id, new MessageComponent(
                    `Enemy hit you!`,
                    'red'
                ));
            }

            return true;
        } else {
            // Miss - use flavor text for player
            if (isPlayerAttacker) {
                const missFlavor = getRandomFlavor('MISS');
                world.addComponent(attacker.id, new MessageComponent(missFlavor, 'yellow'));
            } else {
                world.addComponent(attacker.id, new MessageComponent('Enemy missed!', 'grey'));
            }
            return true;  // Still consumed action
        }
    }

    calculateHitChance(world, attacker, target, gunStats, distance) {
        let accuracy = gunStats.accuracy;  // Base from weapon parts
        const modifiers = {}; // Track modifiers for console logging

        modifiers.base = accuracy;

        // First strike bonus (player only, first turn only)
        if (attacker.hasComponent('PlayerComponent')) {
            const combatSystem = world.systems.find(s => s.constructor.name === 'CombatSystem');
            if (combatSystem && combatSystem.activeCombatSession &&
                combatSystem.activeCombatSession.playerInitiated &&
                !combatSystem.activeCombatSession.firstStrikeBonusUsed) {
                accuracy += COMBAT_CONSTANTS.FIRST_STRIKE_BONUS;
                modifiers.firstStrike = COMBAT_CONSTANTS.FIRST_STRIKE_BONUS;
                combatSystem.activeCombatSession.firstStrikeBonusUsed = true;
            }
        }

        // Stress modifier (player only)
        if (attacker.hasComponent('PlayerComponent')) {
            const stats = attacker.getComponent('CreatureStatsComponent');
            if (stats) {
                if (stats.stress >= COMBAT_CONSTANTS.STRESS_OPTIMAL_MIN &&
                    stats.stress <= COMBAT_CONSTANTS.STRESS_OPTIMAL_MAX) {
                    accuracy += 10;  // Optimal stress zone
                    modifiers.stress = 10;
                } else if (stats.stress >= COMBAT_CONSTANTS.STRESS_PENALTY_1_MIN &&
                           stats.stress <= COMBAT_CONSTANTS.STRESS_PENALTY_1_MAX) {
                    accuracy -= 10;  // High stress
                    modifiers.stress = -10;
                } else if (stats.stress >= COMBAT_CONSTANTS.STRESS_PENALTY_2_MIN) {
                    accuracy -= 20;  // Extreme stress
                    modifiers.stress = -20;
                }
            }
        }

        // Body part damage penalties
        const bodyParts = attacker.getComponent('BodyPartsComponent');
        if (bodyParts) {
            if (bodyParts.getPart('head') < 50) {
                accuracy -= COMBAT_CONSTANTS.HEAD_ACCURACY_PENALTY;
                modifiers.headDamage = -COMBAT_CONSTANTS.HEAD_ACCURACY_PENALTY;
            }
            if (bodyParts.getPart('torso') < 50) {
                accuracy -= COMBAT_CONSTANTS.TORSO_ACCURACY_PENALTY;
                modifiers.torsoDamage = -COMBAT_CONSTANTS.TORSO_ACCURACY_PENALTY;
            }
        }

        // Out-of-range penalty: -25% per tile beyond weapon range
        if (distance > gunStats.range) {
            const tilesOverRange = distance - gunStats.range;
            const rangePenalty = tilesOverRange * COMBAT_CONSTANTS.OUT_OF_RANGE_PENALTY;
            accuracy -= rangePenalty;
            modifiers.outOfRange = -rangePenalty;
        }

        modifiers.final = accuracy;

        // Don't clamp accuracy - allow negative hit chances (very unlikely but possible)
        return { hitChance: accuracy, modifiers: modifiers };
    }

    resolveWait(world, attacker) {
        const name = attacker.hasComponent('PlayerComponent') ? 'You' : 'Enemy';
        world.addComponent(attacker.id, new MessageComponent(`${name} wait.`, 'grey'));
        return true;
    }

    resolveFlee(world, attacker) {
        // Check if player is outside all enemy detection ranges
        if (!attacker.hasComponent('PlayerComponent')) {
            return false;  // Only player can flee
        }

        const attackerPos = attacker.getComponent('PositionComponent');
        const enemies = world.query(['AIComponent', 'PositionComponent', 'CombatStateComponent']);

        for (const enemy of enemies) {
            const enemyPos = enemy.getComponent('PositionComponent');
            const ai = enemy.getComponent('AIComponent');
            const distance = Math.abs(attackerPos.x - enemyPos.x) + Math.abs(attackerPos.y - enemyPos.y);

            if (distance <= ai.detectionRange) {
                world.addComponent(attacker.id, new MessageComponent(
                    'Cannot flee! Enemies too close.',
                    'red'
                ));
                return false;
            }
        }

        // Can flee
        const combatSystem = world.systems.find(s => s instanceof CombatSystem);
        if (combatSystem) {
            combatSystem.endCombat(world, 'flee');
        }

        return true;
    }

    resolveUseItem(world, attacker, itemId) {
        // TODO: Implement item usage (medkits, stims)
        // For now, just consume action
        world.addComponent(attacker.id, new MessageComponent('Used item!', 'green'));
        return true;
    }

    getBodyPartStatusMessage(target) {
        const bodyParts = target.getComponent('BodyPartsComponent');
        if (!bodyParts) return null;

        const head = bodyParts.getPart('head');
        const torso = bodyParts.getPart('torso');
        const limbs = bodyParts.getPart('limbs');

        // Check body parts in priority order (most severe first)
        if (head > 0 && head < 25) {
            return getRandomFlavor('HEAD_25');
        } else if (head >= 25 && head < 50) {
            return getRandomFlavor('HEAD_50');
        }

        if (torso > 0 && torso < 25) {
            return getRandomFlavor('TORSO_25');
        } else if (torso >= 25 && torso < 50) {
            return getRandomFlavor('TORSO_50');
        }

        if (limbs > 0 && limbs < 25) {
            return getRandomFlavor('LIMBS_25');
        } else if (limbs >= 25 && limbs < 50) {
            return getRandomFlavor('LIMBS_50');
        }

        return null; // No status to report
    }
}

// DamageSystem - Processes damage events, applies armor/resistance, updates body parts
class DamageSystem extends System {
    update(world) {
        // Process all entities with DamageEventComponent
        const damagedEntities = world.query(['DamageEventComponent']);

        for (const entity of damagedEntities) {
            // Get all damage events on this entity
            const damageEvents = [];

            // The query returns entities, we need to extract the components
            // Since multiple DamageEventComponents may exist, collect them all
            const components = entity.components.get('DamageEventComponent');
            if (Array.isArray(components)) {
                damageEvents.push(...components);
            } else if (components) {
                damageEvents.push(components);
            }

            for (const event of damageEvents) {
                this.processDamageEvent(world, entity, event);
            }

            // Remove damage event components after processing
            world.removeComponent(entity.id, 'DamageEventComponent');
        }
    }

    processDamageEvent(world, target, event) {
        const bodyParts = target.getComponent('BodyPartsComponent');
        if (!bodyParts) return;  // Can't damage entity without body parts

        // 1. Select body part (random if not specified)
        const hitPart = event.bodyPart || BodyPartHitTable.prototype.getRandomHitPart.call(new BodyPartHitTable(), bodyParts);

        // 2. Get target's armor (if equipped)
        const equipped = target.getComponent('EquippedItemsComponent');
        let armor = null;
        let armorStats = null;

        if (equipped && equipped.body) {
            armor = world.getEntity(equipped.body);
            if (armor) {
                armorStats = armor.getComponent('ArmourStatsComponent');
                if (!armorStats) {
                    // Calculate armor stats if missing
                    updateArmourStats(world, armor);
                    armorStats = armor.getComponent('ArmourStatsComponent');
                }
            }
        }

        // 3. Calculate damage
        let finalDamage = event.amount;
        let armorDamage = 0;
        let bodyDamage = 0;
        let passthrough = false;

        if (armorStats && armorStats.durability > 0) {
            // Has armor
            const resistance = armorStats.resistances[event.damageType] || 0;
            const damageAfterResist = finalDamage * (1 - resistance / 100);

            // Roll passthrough
            const passthroughChance = armorStats.getPassthroughChance();
            const roll = Math.random() * 100;
            passthrough = roll <= passthroughChance;

            if (passthrough) {
                // Penetrated: split damage
                armorDamage = damageAfterResist / 2;
                bodyDamage = damageAfterResist / 2;

                world.addComponent(target.id, new MessageComponent(
                    `Hit ${hitPart}! Penetrated armor (${armorDamage.toFixed(1)} armor, ${bodyDamage.toFixed(1)} body)`,
                    'orange'
                ));
            } else {
                // Blocked: all to armor
                armorDamage = damageAfterResist;
                bodyDamage = 0;

                world.addComponent(target.id, new MessageComponent(
                    `Hit ${hitPart}! Blocked by armor (${armorDamage.toFixed(1)} armor damage)`,
                    'yellow'
                ));
            }

            // Apply armor damage
            armorStats.applyDamage(armorDamage);

            // If armor destroyed, message
            if (armorStats.durability <= 0) {
                world.addComponent(target.id, new MessageComponent(
                    'Armor destroyed!',
                    'red'
                ));

                // Update morale if humanoid enemy
                const ai = target.getComponent('AIComponent');
                if (ai && ai.morale !== undefined) {
                    ai.morale -= 25;
                    if (ai.morale < COMBAT_CONSTANTS.FLEE_MORALE_THRESHOLD) {
                        ai.behaviorType = 'fleeing';
                        world.addComponent(target.id, new MessageComponent('Enemy is fleeing!', 'cyan'));
                    }
                }
            }
        } else {
            // No armor or armor destroyed
            bodyDamage = finalDamage;

            world.addComponent(target.id, new MessageComponent(
                `Hit ${hitPart}! ${bodyDamage.toFixed(1)} damage`,
                'orange'
            ));
        }

        // 4. Dodge roll (last chance)
        if (bodyDamage > 0) {
            const combatant = target.getComponent('CombatantComponent');
            let dodgeChance = COMBAT_CONSTANTS.BASE_DODGE;  // Base 10%

            // Check for overencumbrance (dodge disabled when carrying > maxWeight)
            const inventory = target.getComponent('InventoryComponent');
            if (inventory) {
                const totalWeight = inventory.getTotalWeight(world);
                const maxWeight = inventory.maxWeight;
                if (totalWeight > maxWeight) {
                    dodgeChance = 0; // Cannot dodge when overencumbered
                }
            }

            if (dodgeChance > 0) {
                const dodgeRoll = Math.random() * 100;
                if (dodgeRoll <= dodgeChance) {
                    world.addComponent(target.id, new MessageComponent(
                        `Dodged! No body damage`,
                        'cyan'
                    ));
                    bodyDamage = 0;
                }
            }
        }

        // 5. Apply body part damage
        if (bodyDamage > 0) {
            bodyParts.damage(hitPart, bodyDamage);

            // Update morale for damage taken (humanoids only)
            const ai = target.getComponent('AIComponent');
            if (ai && ai.morale !== undefined) {
                if (hitPart === 'head') {
                    ai.morale -= 15; // Headshot morale penalty
                    world.addComponent(target.id, new MessageComponent('Headshot!', 'orange'));
                } else if (hitPart === 'torso') {
                    ai.morale -= 10; // Torso hit morale penalty
                }

                if (ai.morale < COMBAT_CONSTANTS.FLEE_MORALE_THRESHOLD) {
                    ai.behaviorType = 'fleeing';
                    world.addComponent(target.id, new MessageComponent('Enemy is fleeing!', 'cyan'));
                }
            }

            // Check for status effects
            if (hitPart === 'torso' && bodyParts.getPart('torso') < COMBAT_CONSTANTS.TORSO_BLEEDING_THRESHOLD) {
                const combatant = target.getComponent('CombatantComponent');
                if (combatant && !combatant.bleeding) {
                    combatant.bleeding = true;
                    world.addComponent(target.id, new MessageComponent('Bleeding!', 'red'));
                }
            }

            // Check for death
            if (bodyParts.getPart('head') <= 0) {
                world.addComponent(target.id, new MessageComponent('Head destroyed! Death!', 'red'));
                this.handleDeath(world, target);
            } else if (bodyParts.getPart('torso') <= 0) {
                world.addComponent(target.id, new MessageComponent('Torso destroyed! Death!', 'red'));
                this.handleDeath(world, target);
            }
        }
    }

    handleDeath(world, entity) {
        // Mark entity as dead
        console.log('Entity died:', entity.id);

        // TODO: Spawn corpse with loot
        // TODO: Remove entity from world or mark as dead

        // For now, just log it - combat system will detect dead enemies in checkCombatEnd
    }
}

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

                console.log('AI Weapon Check:', {
                    hasWeapon: hasWeapon,
                    weaponRange: weaponRange,
                    distance: distance,
                    behavior: ai.behaviorType
                });
            }
        } else {
            console.log('AI has no weapon equipped');
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

        // Simple pathfinding: move one tile toward target
        const dx = targetPos.x - pos.x;
        const dy = targetPos.y - pos.y;

        if (Math.abs(dx) > Math.abs(dy)) {
            pos.x += (dx > 0) ? 1 : -1;
        } else {
            pos.y += (dy > 0) ? 1 : -1;
        }

        combatant.hasMovedThisTurn = true;

        world.addComponent(entity.id, new MessageComponent('Enemy moves closer', 'grey'));
    }

    aiMoveAway(world, entity, targetPos) {
        const pos = entity.getComponent('PositionComponent');
        const combatant = entity.getComponent('CombatantComponent');
        if (!combatant) return;

        // Move one tile away from target
        const dx = targetPos.x - pos.x;
        const dy = targetPos.y - pos.y;

        if (Math.abs(dx) > Math.abs(dy)) {
            pos.x -= (dx > 0) ? 1 : -1;
        } else {
            pos.y -= (dy > 0) ? 1 : -1;
        }

        combatant.hasMovedThisTurn = true;

        world.addComponent(entity.id, new MessageComponent('Enemy backs away', 'grey'));
    }
}
