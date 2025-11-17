// The main game setup and loop

// --- SCRIPT & ACTION REGISTRIES ---

function closeTopMenu(world) {
    const menuEntity = world.query(['MenuComponent'])[0];
    if (menuEntity) {
        menuEntity.removeComponent('MenuComponent');
    }
}

const MENU_ACTIONS = {
    'close_menu': (game) => {
        closeTopMenu(game.world);
    },
    'open_door': (game, interactable) => {
        const pos = interactable.getComponent('PositionComponent');
        game.world.destroyEntity(interactable.id);

        const doorDef = INTERACTABLE_DATA.find(i => i.id === 'DOOR_OPEN');
        const newDoor = game.world.createEntity();
        game.world.addComponent(newDoor, new PositionComponent(pos.x, pos.y));
        game.world.addComponent(newDoor, new RenderableComponent(doorDef.char, doorDef.colour, 1));
        game.world.addComponent(newDoor, new InteractableComponent(doorDef.script, doorDef.scriptArgs));

        closeTopMenu(game.world);
    },
    'close_door': (game, interactable) => {
        const pos = interactable.getComponent('PositionComponent');
        game.world.destroyEntity(interactable.id);

        const doorDef = INTERACTABLE_DATA.find(i => i.id === 'DOOR_CLOSED');
        const newDoor = game.world.createEntity();
        game.world.addComponent(newDoor, new PositionComponent(pos.x, pos.y));
        game.world.addComponent(newDoor, new RenderableComponent(doorDef.char, doorDef.colour, 1));
        game.world.addComponent(newDoor, new SolidComponent());
        game.world.addComponent(newDoor, new InteractableComponent(doorDef.script, doorDef.scriptArgs));

        closeTopMenu(game.world);
    },
    'use_item': (game, itemEntity) => {
        const player = game.world.query(['PlayerComponent'])[0];
        if (!player) return;

        const consumable = itemEntity.getComponent('ConsumableComponent');
        const stats = player.getComponent('CreatureStatsComponent');
        const itemComponent = itemEntity.getComponent('ItemComponent');
        const itemName = itemComponent.name;

        if (consumable && stats) {
            switch (consumable.effect) {
                case 'RESTORE_HUNGER':
                    stats.hunger = Math.min(100, stats.hunger + consumable.value);
                    game.world.addComponent(player.id, new MessageComponent(`Ate ${itemName}, hunger restored by ${consumable.value}!`, 'green'));
                    break;
                // Add other effects here as needed
            }
            
            const inventory = player.getComponent('InventoryComponent');
            if (inventory) {
                const inventoryItem = inventory.items.get(itemName);
                if (inventoryItem) {
                    inventoryItem.quantity--;
                    if (inventoryItem.quantity <= 0) {
                        inventory.items.delete(itemName);
                        game.world.destroyEntity(itemEntity.id); // Destroy the item entity only if quantity is 0
                    }
                } else {
                    // Fallback for non-stacked items or if somehow not in map (shouldn't happen if selected from menu)
                    game.world.destroyEntity(itemEntity.id);
                }
            }
        }
        closeTopMenu(game.world);
    }
};

const SCRIPT_REGISTRY = {
    'showMessage': (game, self, args) => {
        if (!self.hasComponent('MessageComponent')) {
            game.world.addComponent(self.id, new MessageComponent(args.message, args.colour));
        }
    },
    'openMenu': (game, self, args) => {
        // Find the player and add a menu component to them.
        // In a more complex game, we might have a dedicated UI entity.
        const player = game.world.query(['PlayerComponent'])[0];
        if (player && !player.hasComponent('MenuComponent')) {
            game.world.addComponent(player.id, new MenuComponent(args.title, args.options, self));
        }
    },
    'pickupItem': (game, self, args) => {
        const player = game.world.query(['PlayerComponent'])[0];
        if (!player) return;

        const inventory = player.getComponent('InventoryComponent');
        const itemComponent = self.getComponent('ItemComponent');
        const stackableComponent = self.getComponent('StackableComponent');
        const itemName = itemComponent.name;

        if (!inventory || !itemComponent) {
            return;
        }

        if (stackableComponent) {
            // Check if item already exists in inventory and can be stacked
            if (inventory.items.has(itemName)) {
                const existingStack = inventory.items.get(itemName);
                if (existingStack.quantity < stackableComponent.stackLimit) {
                    existingStack.quantity++;
                    game.world.addComponent(player.id, new MessageComponent(`Picked up another ${itemName} (x${existingStack.quantity})`));
                    game.world.destroyEntity(self.id); // Destroy the picked up item entity
                    return;
                }
            }
        }

        // If not stackable, or stackable but no existing stack or existing stack is full
        if (inventory.items.size < inventory.capacity) {
            // Add to inventory as a new entry (either new stackable or non-stackable)
            inventory.items.set(itemName, { entityId: self.id, quantity: stackableComponent ? 1 : 1 });
            self.removeComponent('PositionComponent');
            self.removeComponent('RenderableComponent');
            game.world.addComponent(player.id, new MessageComponent(`Picked up ${itemName}`));
        } else {
            game.world.addComponent(player.id, new MessageComponent(`Inventory full!`));
        }
    },
    'openInventoryMenu': (game, self, args) => {
        const player = game.world.query(['PlayerComponent'])[0];
        if (!player) return;

        const inventory = player.getComponent('InventoryComponent');
        if (!inventory || inventory.items.size === 0) {
            game.world.addComponent(player.id, new MessageComponent('Inventory is empty.'));
            return;
        }

        const menuOptions = [];
        for (const [itemName, itemData] of inventory.items) {
            const itemEntity = game.world.getEntity(itemData.entityId);
            const itemComponent = itemEntity.getComponent('ItemComponent');
            let label = itemComponent.name;
            if (itemData.quantity > 1) {
                label += ` (x${itemData.quantity})`;
            }
            menuOptions.push({
                label: label,
                action: 'use_item',
                actionArgs: itemEntity // Pass the entire item entity
            });
        }
        menuOptions.push({ label: 'Close', action: 'close_menu' });

        if (player && !player.hasComponent('MenuComponent')) {
            game.world.addComponent(player.id, new MenuComponent('Inventory', menuOptions, player));
        }
    }
};

// --- GAME CLASS (Now an orchestrator for the ECS World) ---
class Game {
    constructor() {
        this.container = document.getElementById('game-container');
        this.width = 40;
        this.height = 15;
        this.world = new World();
        this.world.game = this; // Systems can access game globals via the world

        this.mapInfo = {}; // Will be populated by the world builder
        this.lastFrameTime = 0;
        this.messageSystem = new MessageSystem(); // Instantiate MessageSystem here
        
        this.init();
    }

    init() {
        // Setup the world and systems
        this.world.registerSystem(new InputSystem());
        this.world.registerSystem(new InteractionSystem());
        this.world.registerSystem(new MovementSystem());
        this.world.registerSystem(new HudSystem());
        this.world.registerSystem(new RenderSystem());
        // MessageSystem is updated manually after world.update() to ensure proper message ordering

        // Create the game world using the builder
        buildWorld(this.world, 'CRYOBAY_7');
        
        // Start the game loop
        this.lastFrameTime = performance.now();
        this.gameLoop();
    }

    gameLoop() {
        const now = performance.now();
        const deltaTime = now - this.lastFrameTime;
        this.lastFrameTime = now;

        // The world runs all the systems
        this.world.update(deltaTime);
        
        // Manually update the MessageSystem
        this.messageSystem.update(this.world);

        this.updateAreaHud();

        requestAnimationFrame(() => this.gameLoop());
    }

    updateAreaHud() {
        const info = this.mapInfo;
        document.getElementById('area-name').textContent = info.name || 'Area';
        document.getElementById('area-temp').textContent = `${info.temperature}C`;
        document.getElementById('area-air').textContent = `Air: ${info.air_quality}%`;
    }
}

// Initialise the game
window.addEventListener('load', () => {
    new Game();
});
