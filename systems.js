// This file contains all System definitions for the ECS.

class RenderSystem extends System {
    constructor() {
        super();
        this.messageOverlay = document.getElementById('message-overlay-container');
        this.itemNameOverlay = document.getElementById('item-name-overlay-container'); // New overlay for item names
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
        }

        // --- Item Name Overlay Rendering ---
        const inputSystem = world.systems.find(s => s instanceof InputSystem);
        if (inputSystem && inputSystem.qPressed) {
            this.#renderItemNames(world, overlay);
        }
    }

    #renderMenu(container, menu) {
        const menuWrapper = document.createElement('div');
        menuWrapper.className = 'menu-wrapper';

        // Determine highlighted module from selected option
        let highlightedModuleEntity = null;
        if (menu.activeMenu === 'main' && menu.options[menu.selectedIndex]) {
            highlightedModuleEntity = menu.options[menu.selectedIndex].moduleEntity;
        } else if (menu.activeMenu === 'submenu' && menu.submenu && menu.submenu.options[menu.submenuSelectedIndex]) {
            highlightedModuleEntity = menu.submenu.options[menu.submenuSelectedIndex].moduleEntity;
        }

        // Override with manually set highlighted module (for inventory parts)
        if (menu.highlightedModule !== null) {
            highlightedModuleEntity = { id: menu.highlightedModule };
        }

        // Render module info box if a module is highlighted
        if (highlightedModuleEntity) {
            const moduleInfoBox = this.#renderModuleInfo(highlightedModuleEntity);
            if (moduleInfoBox) {
                menuWrapper.appendChild(moduleInfoBox);
            }
        }

        // Create wrapper for menu containers
        const containersWrapper = document.createElement('div');
        containersWrapper.className = 'menu-containers-wrapper';

        // Render main menu
        const menuContainer = document.createElement('div');
        menuContainer.className = 'menu-container';
        const menuTitle = document.createElement('h3');
        menuTitle.textContent = menu.title;
        menuContainer.appendChild(menuTitle);
        menu.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'menu-option';
            if (index === menu.selectedIndex && menu.activeMenu === 'main') {
                optionElement.classList.add('selected');
            }
            optionElement.textContent = option.label;
            menuContainer.appendChild(optionElement);
        });
        containersWrapper.appendChild(menuContainer);

        // Render submenu if it exists
        if (menu.submenu) {
            const submenuContainer = document.createElement('div');
            submenuContainer.className = 'menu-container menu-submenu';
            const submenuTitle = document.createElement('h3');
            submenuTitle.textContent = menu.submenu.title;
            submenuContainer.appendChild(submenuTitle);
            menu.submenu.options.forEach((option, index) => {
                const optionElement = document.createElement('div');
                optionElement.className = 'menu-option';
                if (index === menu.submenuSelectedIndex && menu.activeMenu === 'submenu') {
                    optionElement.classList.add('selected');
                }
                optionElement.textContent = option.label;
                submenuContainer.appendChild(optionElement);
            });
            containersWrapper.appendChild(submenuContainer);
        }

        menuWrapper.appendChild(containersWrapper);
        container.appendChild(menuWrapper);
    }

    #renderModuleInfo(moduleEntity) {
        if (!moduleEntity || !moduleEntity.id) return null;

        const world = this.world || (typeof game !== 'undefined' ? game.world : null);
        if (!world) return null;

        const entity = world.getEntity(moduleEntity.id);
        if (!entity) return null;

        const itemComponent = entity.getComponent('ItemComponent');
        const statModifier = entity.getComponent('StatModifierComponent');

        if (!itemComponent) return null;

        const infoBox = document.createElement('div');
        infoBox.className = 'module-info-box';

        // Module name
        const title = document.createElement('h4');
        title.textContent = itemComponent.name;
        infoBox.appendChild(title);

        // Description
        if (itemComponent.description) {
            const desc = document.createElement('div');
            desc.className = 'module-info-description';
            desc.textContent = itemComponent.description;
            infoBox.appendChild(desc);
        }

        // Stats
        if (statModifier && Object.keys(statModifier.modifiers).length > 0) {
            const statsContainer = document.createElement('div');
            statsContainer.className = 'module-info-stats';

            for (const [stat, value] of Object.entries(statModifier.modifiers)) {
                const statElement = document.createElement('div');
                statElement.className = 'module-info-stat';
                const sign = value >= 0 ? '+' : '';
                statElement.textContent = `${stat}: ${sign}${value}`;
                statsContainer.appendChild(statElement);
            }

            infoBox.appendChild(statsContainer);
        }

        return infoBox;
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
                    if (menu.activeMenu === 'main') {
                        menu.selectedIndex = (menu.selectedIndex > 0) ? menu.selectedIndex - 1 : menu.options.length - 1;
                    } else if (menu.submenu) {
                        menu.submenuSelectedIndex = (menu.submenuSelectedIndex > 0) ? menu.submenuSelectedIndex - 1 : menu.submenu.options.length - 1;
                    }
                    break;
                case 's':
                    if (menu.activeMenu === 'main') {
                        menu.selectedIndex = (menu.selectedIndex < menu.options.length - 1) ? menu.selectedIndex + 1 : 0;
                    } else if (menu.submenu) {
                        menu.submenuSelectedIndex = (menu.submenuSelectedIndex < menu.submenu.options.length - 1) ? menu.submenuSelectedIndex + 1 : 0;
                    }
                    break;
                case 'a':
                    if (menu.submenu) {
                        menu.activeMenu = 'main';
                    }
                    break;
                case 'd':
                    if (menu.submenu) {
                        menu.activeMenu = 'submenu';
                    }
                    break;
                case ' ':
                    let selectedOption;
                    if (menu.activeMenu === 'main') {
                        selectedOption = menu.options[menu.selectedIndex];
                    } else if (menu.submenu) {
                        selectedOption = menu.submenu.options[menu.submenuSelectedIndex];
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
                    if (menu.submenu && menu.activeMenu === 'submenu') {
                        // Close submenu, go back to main
                        menu.submenu = null;
                        menu.activeMenu = 'main';
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
        const name = player.getComponent('NameComponent');
        const inventory = player.getComponent('InventoryComponent');

        // Get equipment modifiers
        const modifiers = getEquipmentModifiers(world, player);

        // Apply modifiers to displayed stats
        const displayHunger = Math.min(100, stats.hunger + (modifiers.hunger || 0));
        const displayHead = Math.min(100, stats.head + (modifiers.head || 0));
        const displayChest = Math.min(100, stats.chest + (modifiers.chest || 0));
        const displayLeftArm = Math.min(100, stats.left_arm + (modifiers.left_arm || 0));
        const displayRightArm = Math.min(100, stats.right_arm + (modifiers.right_arm || 0));
        const displayLeftLeg = Math.min(100, stats.left_leg + (modifiers.left_leg || 0));
        const displayRightLeg = Math.min(100, stats.right_leg + (modifiers.right_leg || 0));

        document.getElementById('hud-title').textContent = name.name;
        document.getElementById('bar-hunger').querySelector('.bar-fill').style.width = `${displayHunger}%`;
        document.getElementById('bar-rest').style.width = `${stats.rest}%`;
        document.getElementById('bar-stress').style.width = `${stats.stress}%`;

        // Display stats with modifiers (show modifier if non-zero)
        document.getElementById('hud-head').textContent = `Head: ${displayHead}%${modifiers.head ? ` (+${modifiers.head})` : ''}`;
        document.getElementById('hud-chest').textContent = `Chest: ${displayChest}%${modifiers.chest ? ` (+${modifiers.chest})` : ''}`;
        document.getElementById('hud-left-arm').textContent = `L-Arm: ${displayLeftArm}%${modifiers.left_arm ? ` (+${modifiers.left_arm})` : ''}`;
        document.getElementById('hud-right-arm').textContent = `R-Arm: ${displayRightArm}%${modifiers.right_arm ? ` (+${modifiers.right_arm})` : ''}`;
        document.getElementById('hud-left-leg').textContent = `L-Leg: ${displayLeftLeg}%${modifiers.left_leg ? ` (+${modifiers.left_leg})` : ''}`;
        document.getElementById('hud-right-leg').textContent = `R-Leg: ${displayRightLeg}%${modifiers.right_leg ? ` (+${modifiers.right_leg})` : ''}`;

        // Display inventory weight and slots
        if (inventory) {
            const currentWeight = inventory.getTotalWeight(world);
            const maxWeight = inventory.maxWeight;
            const usedSlots = inventory.items.size;
            const maxSlots = inventory.capacity;

            document.getElementById('hud-weight').textContent = `Weight: ${currentWeight}g/${maxWeight}g`;
            document.getElementById('hud-inventory').textContent = `Slots: ${usedSlots}/${maxSlots}`;
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
