// Main game orchestrator
// Initializes the ECS world and runs the game loop

// --- GAME CLASS (Orchestrator for the ECS World) ---
class Game {
    constructor() {
        this.container = document.getElementById('game-container');
        this.width = 40;
        this.height = 15;
        this.world = new World();
        this.world.game = this; // Systems can access game globals via the world

        // Make world and game accessible from browser console for debugging
        window.world = this.world;
        window.game = this;

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
        this.world.registerSystem(new ComfortSystem());
        this.world.registerSystem(new ShipSystem());
        this.world.registerSystem(new TimeSystem()); // Time system for game time, hunger, healing
        // Combat systems
        this.world.registerSystem(new CombatSystem());
        this.world.registerSystem(new ActionResolutionSystem());
        this.world.registerSystem(new DamageSystem());
        this.world.registerSystem(new CombatAISystem());
        this.world.registerSystem(new ProjectileSystem());
        // UI systems
        this.world.registerSystem(new HudSystem());
        this.world.registerSystem(new RenderSystem());
        // MessageSystem is updated manually after world.update() to ensure proper message ordering

        // Create the game world using the builder
        buildWorld(this.world, 'SHIP');

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
        const player = this.world.query(['PlayerComponent'])[0];
        const inCombat = player && player.hasComponent('CombatStateComponent');

        if (inCombat) {
            // Show combat status
            const combatSystem = this.world.systems.find(s => s.constructor.name === 'CombatSystem');
            if (combatSystem && combatSystem.activeCombatSession) {
                const activeId = combatSystem.activeCombatSession.getActiveCombatant();
                const isPlayerTurn = activeId === player.id;

                if (isPlayerTurn) {
                    const combatant = player.getComponent('CombatantComponent');
                    const movementSystem = this.world.systems.find(s => s instanceof MovementSystem);
                    let movementMax = 4;
                    if (combatant && movementSystem) {
                        movementMax = movementSystem.calculateMovementMax(this.world, player, combatant);
                    }
                    const movementUsed = combatant ? combatant.movementUsed : 0;

                    document.getElementById('area-name').textContent = `COMBAT - Round ${combatSystem.activeCombatSession.round} (Movement: ${movementUsed}/${movementMax})`;
                    document.getElementById('area-temp').textContent = 'Space: fire | R: target | F: flee | E: end turn';
                } else {
                    const activeEntity = this.world.getEntity(activeId);
                    const name = activeEntity ? activeEntity.getComponent('NameComponent') : null;
                    document.getElementById('area-name').textContent = `COMBAT - Enemy Turn: ${name ? name.name : 'Unknown'}`;
                    document.getElementById('area-temp').textContent = 'Waiting for enemy...';
                }
            }
        } else {
            // Normal area display
            document.getElementById('area-name').textContent = info.name || 'Area';

            // Get player's comfortable temperature range
            let tempRangeText = '';
            if (player) {
                const stats = player.getComponent('CreatureStatsComponent');
                if (stats) {
                    const modifiers = getEquipmentModifiers(this.world, player);
                    const tempRange = stats.getComfortTempRange(modifiers.tempMin || 0, modifiers.tempMax || 0);
                    tempRangeText = ` (${tempRange.min}-${tempRange.max})`;
                }
            }

            document.getElementById('area-temp').textContent = `${info.temperature}C${tempRangeText}`;

            // Check if we're on the SHIP map and update ship resources
            const shipEntity = this.world.query(['ShipComponent'])[0];
            const shipResourcesContainer = document.getElementById('ship-resources-container');

            if (shipEntity) {
                // We're on the ship map, show ship resources
                shipResourcesContainer.style.display = 'block';

                const ship = shipEntity.getComponent('ShipComponent');
                const waterPercent = ship.getWaterPercent();
                const fuelPercent = ship.getFuelPercent();

                // Update water bar
                const waterBar = document.getElementById('bar-water').querySelector('.bar-fill');
                waterBar.style.width = `${waterPercent}%`;
                document.getElementById('water-amount').textContent = Math.floor(ship.water);

                // Update fuel bar
                const fuelBar = document.getElementById('bar-fuel').querySelector('.bar-fill');
                fuelBar.style.width = `${fuelPercent}%`;
                document.getElementById('fuel-amount').textContent = Math.floor(ship.fuel);
            } else {
                // Not on ship map, hide ship resources
                shipResourcesContainer.style.display = 'none';
            }
        }
    }
}

// Initialise the game
window.addEventListener('load', () => {
    new Game();
});
