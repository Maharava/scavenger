// RenderSystem - Renders the game world, UI overlays, and visual effects

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

        // Update blink state periodically
        const now = Date.now();
        if (now - this.lastBlinkTime > BLINK_INTERVAL_MS) {
            this.blinkState = !this.blinkState;
            this.lastBlinkTime = now;
        }

        // Get combat info for target blinking
        const player = world.getPlayer();
        const combatSystem = world.getSystem(CombatSystem);
        const inCombat = player && player.hasComponent('CombatStateComponent');
        let selectedEnemyId = null;
        let isPlayerTurn = false;

        if (inCombat && combatSystem && combatSystem.activeCombatSession) {
            selectedEnemyId = combatSystem.activeCombatSession.selectedEnemyId;
            const activeId = combatSystem.activeCombatSession.getActiveCombatant();
            isPlayerTurn = player && activeId === player.id;
        }

        // --- Camera System: Center on player ---
        if (player) {
            const playerPos = player.getComponent('PositionComponent');
            if (playerPos) {
                // Get map dimensions from layout
                const mapHeight = world.game.mapInfo.layout ? world.game.mapInfo.layout.length : height;
                const mapWidth = world.game.mapInfo.layout ? world.game.mapInfo.layout[0].length : width;

                let camX, camY;

                // If map is smaller than viewport, center the map in the viewport
                if (mapWidth < width) {
                    camX = Math.floor((mapWidth - width) / 2);
                } else {
                    // Normal camera centering - follow player
                    camX = Math.floor(playerPos.x - width / 2);
                    camX = Math.max(0, Math.min(camX, mapWidth - width));
                }

                if (mapHeight < height) {
                    camY = Math.floor((mapHeight - height) / 2);
                } else {
                    // Normal camera centering - follow player
                    camY = Math.floor(playerPos.y - height / 2);
                    camY = Math.max(0, Math.min(camY, mapHeight - height));
                }

                world.game.cameraX = camX;
                world.game.cameraY = camY;
            }
        }

        const cameraX = world.game.cameraX;
        const cameraY = world.game.cameraY;

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

        const lightingEnabled = world.mapLighting && world.mapLighting.enabled;

        for (const entity of renderables) {
            const pos = entity.getComponent('PositionComponent');
            const render = entity.getComponent('RenderableComponent');
            const vis = entity.getComponent('VisibilityStateComponent');
            const isSolid = entity.hasComponent('SolidComponent');

            // Calculate screen position relative to camera
            const screenX = pos.x - cameraX;
            const screenY = pos.y - cameraY;

            // Skip if outside viewport
            if (screenX < 0 || screenX >= width || screenY < 0 || screenY >= height) {
                continue;
            }

            if (lightingEnabled && vis) {
                if (vis.state === 'never_seen') {
                    // Never seen - don't render anything
                    continue;
                }

                if (vis.state === 'revealed') {
                    // Revealed state - render tiles (layer 0) and solid objects (doors, etc.) in grey
                    if (render.layer === 0 || isSolid) {
                        grid[screenY][screenX] = {
                            char: render.char,
                            colour: '#333'
                        };
                    }
                    continue;
                }
            }

            // Check if this is the selected enemy during player's turn
            const isSelectedEnemy = isPlayerTurn && entity.id === selectedEnemyId;

            // Skip rendering selected enemy every other blink cycle (makes it blink)
            if (isSelectedEnemy && !this.blinkState) {
                continue; // Don't render = appears to blink off
            }

            grid[screenY][screenX] = {
                char: render.char,
                colour: isSelectedEnemy ? '#ffff00' : render.colour // Yellow when selected
            };
        }

        // Render placement cursor if in placement mode
        const placementEntity = world.query(['PlacementModeComponent'])[0];
        if (placementEntity) {
            const placementMode = placementEntity.getComponent('PlacementModeComponent');

            // Update flash timer
            const deltaTime = world.game.deltaTime || 16; // milliseconds
            placementMode.cursorFlashTimer += deltaTime;

            if (placementMode.cursorFlashTimer >= placementMode.flashInterval) {
                placementMode.cursorVisible = !placementMode.cursorVisible;
                placementMode.cursorFlashTimer = 0;
            }

            // Only render if cursor is in visible phase
            if (placementMode.cursorVisible) {
                const cursorScreenX = placementMode.cursorX - cameraX;
                const cursorScreenY = placementMode.cursorY - cameraY;

                // Check if cursor is on screen
                if (cursorScreenX >= 0 && cursorScreenX < width &&
                    cursorScreenY >= 0 && cursorScreenY < height) {

                    // Get buildable to determine char
                    const buildable = BUILDABLE_INTERACTABLES.find(b => b.id === placementMode.buildableId);

                    // Check if location is valid
                    const isValid = isValidPlacementLocation(world, placementMode.cursorX, placementMode.cursorY);
                    const cursorColor = isValid ? '#00ff00' : '#ff0000'; // Green if valid, red if not

                    grid[cursorScreenY][cursorScreenX] = {
                        char: buildable ? buildable.char : 'X',
                        colour: cursorColor
                    };
                }
            }
        }

        // Preserve the overlay before clearing
        const overlay = this.itemNameOverlay;
        const overlayParent = overlay.parentElement;

        container.innerHTML = '';
        container.style.gridTemplateColumns = `repeat(${width}, 1fr)`;
        container.style.gridTemplateRows = `repeat(${height}, 1fr)`;
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

        // Check for selection menu first (simpler UI)
        const selectionMenuEntity = world.query(['SelectionMenuComponent'])[0];
        if (selectionMenuEntity) {
            this.#renderSelectionMenu(container, selectionMenuEntity.getComponent('SelectionMenuComponent'));
        } else {
            const menuEntity = world.query(['MenuComponent'])[0];
            if (menuEntity) {
                this.#renderMenu(container, menuEntity.getComponent('MenuComponent'));
            } else {
                // Clear menu overlay when no menu is active
                this.menuOverlay.innerHTML = '';
            }
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

    #renderSelectionMenu(container, selectionMenu) {
        // Clear the menu overlay before rendering
        this.menuOverlay.innerHTML = '';

        // Create selection menu container
        const menuContainer = document.createElement('div');
        menuContainer.className = 'selection-menu-container';
        menuContainer.style.cssText = `
            position: absolute;
            left: 50%;
            top: 30%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid #00ff00;
            padding: 15px;
            min-width: 300px;
            font-family: monospace;
            color: #00ff00;
        `;

        // Title
        const titleElement = document.createElement('h3');
        titleElement.textContent = 'Select Interactable:';
        titleElement.style.cssText = `
            margin: 0 0 10px 0;
            color: #00ffff;
            text-align: center;
        `;
        menuContainer.appendChild(titleElement);

        // List of interactables
        const list = document.createElement('ul');
        list.style.cssText = `
            list-style: none;
            padding: 0;
            margin: 0;
        `;

        selectionMenu.interactables.forEach((interactable, index) => {
            const listItem = document.createElement('li');
            const isSelected = index === selectionMenu.selectedIndex;

            listItem.textContent = `${isSelected ? '> ' : '  '}${interactable.name}`;
            listItem.style.cssText = `
                padding: 5px;
                color: ${isSelected ? '#ffff00' : '#00ff00'};
                background: ${isSelected ? 'rgba(255, 255, 0, 0.2)' : 'transparent'};
                font-weight: ${isSelected ? 'bold' : 'normal'};
            `;

            list.appendChild(listItem);
        });

        menuContainer.appendChild(list);

        // Instructions
        const instructions = document.createElement('div');
        instructions.textContent = 'W/S: Navigate | Space: Select | Esc: Cancel';
        instructions.style.cssText = `
            margin-top: 10px;
            font-size: 0.8em;
            color: #888;
            text-align: center;
        `;
        menuContainer.appendChild(instructions);

        this.menuOverlay.appendChild(menuContainer);
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
        // Calculate actual tile size from container dimensions
        const containerRect = container.getBoundingClientRect();
        const tileWidth = containerRect.width / world.game.width;
        const tileHeight = containerRect.height / world.game.height;

        const player = world.getPlayer();
        if (!player) return;

        const equipped = player.getComponent('EquippedItemsComponent');
        if (!equipped || !equipped.hand) return; // No weapon equipped

        const weapon = world.getEntity(equipped.hand);
        if (!weapon || !weapon.hasComponent('GunStatsComponent')) return;

        const gunStats = weapon.getComponent('GunStatsComponent');
        const playerPos = player.getComponent('PositionComponent');
        const weaponRange = gunStats.range;
        const cameraX = world.game.cameraX;
        const cameraY = world.game.cameraY;

        // Clear existing range indicators
        const existingIndicators = container.querySelectorAll('.range-indicator');
        existingIndicators.forEach(el => el.remove());

        // Render range indicators for all tiles within weapon range
        const minX = Math.max(0, playerPos.x - weaponRange);
        const maxX = playerPos.x + weaponRange;
        const minY = Math.max(0, playerPos.y - weaponRange);
        const maxY = playerPos.y + weaponRange;

        for (let worldY = minY; worldY <= maxY; worldY++) {
            for (let worldX = minX; worldX <= maxX; worldX++) {
                const distance = Math.abs(worldX - playerPos.x) + Math.abs(worldY - playerPos.y);

                if (distance <= weaponRange && distance > 0) { // Exclude player's own tile
                    // Calculate screen position
                    const screenX = worldX - cameraX;
                    const screenY = worldY - cameraY;

                    // Only render if visible in viewport
                    if (screenX >= 0 && screenX < world.game.width && screenY >= 0 && screenY < world.game.height) {
                        const rangeElement = document.createElement('div');
                        rangeElement.className = 'range-indicator';
                        rangeElement.style.position = 'absolute';
                        rangeElement.style.left = `${screenX * tileWidth}px`;
                        rangeElement.style.top = `${screenY * tileHeight}px`;
                        rangeElement.style.width = `${tileWidth}px`;
                        rangeElement.style.height = `${tileHeight}px`;
                        rangeElement.style.backgroundColor = 'rgba(255, 255, 0, 0.2)'; // Transparent yellow
                        rangeElement.style.border = '1px solid rgba(255, 255, 0, 0.4)';
                        rangeElement.style.pointerEvents = 'none'; // Don't block clicks
                        rangeElement.style.zIndex = '5';

                        container.appendChild(rangeElement);
                    }
                }
            }
        }
    }

    #renderItemNames(world, overlayContainer) {
        // Calculate actual tile size from container dimensions
        const container = world.game.container;
        const containerRect = container.getBoundingClientRect();
        const tileWidth = containerRect.width / world.game.width;
        const tileHeight = containerRect.height / world.game.height;

        const entities = world.query(['PositionComponent', 'NameComponent']);
        const inputSystem = world.systems.find(s => s instanceof InputSystem);
        const cameraX = world.game.cameraX;
        const cameraY = world.game.cameraY;

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
                const vis = entity.getComponent('VisibilityStateComponent');

                // Show items that are visible or revealed (in fog of war)
                // Skip items that were never seen
                if (vis && vis.state === 'never_seen') {
                    continue;
                }

                // Calculate screen position
                const screenX = pos.x - cameraX;
                const screenY = pos.y - cameraY;

                // Skip if outside viewport
                if (screenX < 0 || screenX >= world.game.width || screenY < 0 || screenY >= world.game.height) {
                    continue;
                }

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

            const screenX = pos.x - cameraX;
            const screenY = pos.y - cameraY;

            const nameElement = document.createElement('div');
            nameElement.className = 'item-name-tag';
            nameElement.textContent = name;

            nameElement.style.left = `${screenX * tileWidth + (tileWidth / 2)}px`;
            nameElement.style.top = `${(screenY * tileHeight) - 16}px`;
            nameElement.style.zIndex = '10';

            overlayContainer.appendChild(nameElement);
        }

        // Render hovered entities last (on top)
        for (const entity of hoveredEntities) {
            const pos = entity.getComponent('PositionComponent');
            const name = entity.getComponent('NameComponent').name;

            const screenX = pos.x - cameraX;
            const screenY = pos.y - cameraY;

            const nameElement = document.createElement('div');
            nameElement.className = 'item-name-tag item-name-tag-hovered';
            nameElement.textContent = name;

            nameElement.style.left = `${screenX * tileWidth + (tileWidth / 2)}px`;
            nameElement.style.top = `${(screenY * tileHeight) - 16}px`;
            nameElement.style.zIndex = '100'; // Higher z-index for hovered items

            overlayContainer.appendChild(nameElement);
        }
    }
}
