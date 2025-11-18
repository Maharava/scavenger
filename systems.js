// This file contains all System definitions for the ECS.

class RenderSystem extends System {
    constructor() {
        super();
        this.messageOverlay = document.getElementById('message-overlay-container');
        this.itemNameOverlay = document.getElementById('item-name-overlay-container'); // New overlay for item names
        this.menuOverlay = document.getElementById('menu-overlay-container'); // New overlay for menus
    }

    update(world) {
        this.world = world; // Store reference for helper methods
        const container = world.game.container;
        const width = world.game.width;
        const height = world.game.height;

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
            if (pos.x >= 0 && pos.x < width && pos.y >= 0 && pos.y < height) {
                grid[pos.y][pos.x] = { char: render.char, colour: render.colour };
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

        // --- Item Name Overlay Rendering ---
        const inputSystem = world.systems.find(s => s instanceof InputSystem);
        if (inputSystem && inputSystem.qPressed) {
            this.#renderItemNames(world, overlay);
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

            // Position details pane intelligently above main menu
            this.#positionDetailsPane(detailsElement, mainContainer, gap);
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

            let action = null;
            switch (key) {
                case 'w': action = new ActionComponent('move', { dx: 0, dy: -1 }); break;
                case 'a': action = new ActionComponent('move', { dx: -1, dy: 0 }); break;
                case 's': action = new ActionComponent('move', { dx: 0, dy: 1 }); break;
                case 'd': action = new ActionComponent('move', { dx: 1, dy: 0 }); break;
                case ' ': action = new ActionComponent('activate'); break;
                case 'i': SCRIPT_REGISTRY['openInventoryMenu'](world.game, player); break; // Open inventory
                case 'e': MENU_ACTIONS['view_equipment'](world.game); break; // Open equipment menu
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
            }
            
            entity.removeComponent('ActionComponent');
        }
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
