// This file contains all System definitions for the ECS.

class RenderSystem extends System {
    constructor() {
        super();
        this.messageOverlay = document.getElementById('message-overlay-container');
        this.itemNameOverlay = document.getElementById('item-name-overlay-container'); // New overlay for item names
    }

    update(world) {
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
        const menuContainer = document.createElement('div');
        menuContainer.className = 'menu-container';
        const menuTitle = document.createElement('h3');
        menuTitle.textContent = menu.title;
        menuContainer.appendChild(menuTitle);
        menu.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'menu-option';
            if (index === menu.selectedIndex) {
                optionElement.classList.add('selected');
            }
            optionElement.textContent = option.label;
            menuContainer.appendChild(optionElement);
        });
        container.appendChild(menuContainer);
    }

    #renderItemNames(world, overlayContainer) {
        const TILE_SIZE = 20; // Should match style.css
        const entities = world.query(['PositionComponent', 'NameComponent']);

        for (const entity of entities) {
            // Only show names for items and non-door interactables
            const isItem = entity.hasComponent('ItemComponent');
            const isInteractable = entity.hasComponent('InteractableComponent');
            const isDoor = isInteractable && (entity.getComponent('InteractableComponent').scriptArgs && (entity.getComponent('InteractableComponent').scriptArgs.title === 'Door' || entity.getComponent('InteractableComponent').scriptArgs.title === 'Open Doorway'));

            if (isItem || (isInteractable && !isDoor)) {
                const pos = entity.getComponent('PositionComponent');
                const name = entity.getComponent('NameComponent').name;

                const nameElement = document.createElement('div');
                nameElement.className = 'item-name-tag';
                nameElement.textContent = name;

                nameElement.style.left = `${pos.x * TILE_SIZE + (TILE_SIZE / 2)}px`;
                nameElement.style.top = `${(pos.y * TILE_SIZE) - 16}px`;

                overlayContainer.appendChild(nameElement);
            }
        }
    }
}

class InputSystem extends System {
    constructor() {
        super();
        this.keys = new Set();
        this.qPressed = false; // Track q key state

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
                    menu.selectedIndex = (menu.selectedIndex > 0) ? menu.selectedIndex - 1 : menu.options.length - 1;
                    break;
                case 's':
                    menu.selectedIndex = (menu.selectedIndex < menu.options.length - 1) ? menu.selectedIndex + 1 : 0;
                    break;
                case ' ':
                    const selectedOption = menu.options[menu.selectedIndex];
                    // If actionArgs exist, pass them, otherwise pass menu.interactable
                    const actionTarget = selectedOption.actionArgs || menu.interactable;
                    const action = MENU_ACTIONS[selectedOption.action];
                    if (action) {
                        action(world.game, actionTarget);
                    }
                    break;
                case 'escape':
                    MENU_ACTIONS['close_menu'](world.game);
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

        document.getElementById('hud-title').textContent = name.name;
        document.getElementById('bar-hunger').querySelector('.bar-fill').style.width = `${stats.hunger}%`;
        document.getElementById('bar-rest').style.width = `${stats.rest}%`;
        document.getElementById('bar-stress').style.width = `${stats.stress}%`;
        document.getElementById('hud-head').textContent = `Head: ${stats.head}%`;
        document.getElementById('hud-chest').textContent = `Chest: ${stats.chest}%`;
        document.getElementById('hud-left-arm').textContent = `L-Arm: ${stats.left_arm}%`;
        document.getElementById('hud-right-arm').textContent = `R-Arm: ${stats.right_arm}%`;
        document.getElementById('hud-left-leg').textContent = `L-Leg: ${stats.left_leg}%`;
        document.getElementById('hud-right-leg').textContent = `R-Leg: ${stats.right_leg}%`;
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
