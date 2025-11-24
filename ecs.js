// A simple, bare-bones ECS implementation

// --- Core Classes ---

/**
 * The World is the main container for the ECS.
 * It manages all entities, components, and systems.
 */
class World {
    constructor() {
        this.entities = new Map();
        this.systems = [];
        this.nextEntityId = 0;
        this.mapLighting = null; // Will be set by the world builder
        this.solidTileCache = new Set(); // Cache for solid tile positions (for LOS)
    }

    /**
     * Create a new entity.
     * @returns {number} The ID of the new entity.
     */
    createEntity() {
        const id = this.nextEntityId++;
        this.entities.set(id, new Entity(id));
        return id;
    }

    /**
     * Get an entity by its ID.
     * @param {number} id 
     * @returns {Entity|undefined}
     */
    getEntity(id) {
        return this.entities.get(id);
    }

    /**
     * Remove an entity from the world.
     * @param {number} id 
     */
    destroyEntity(id) {
        this.entities.delete(id);
    }

    /**
     * Add a component to an entity.
     * @param {number} entityId 
     * @param {object} component 
     */
    addComponent(entityId, component) {
        const entity = this.entities.get(entityId);
        if (entity) {
            entity.addComponent(component);
        }
    }

    /**
     * Remove a component from an entity.
     * @param {number} entityId 
     * @param {string} componentName 
     */
    removeComponent(entityId, componentName) {
        const entity = this.entities.get(entityId);
        if (entity) {
            entity.removeComponent(componentName);
        }
    }

    /**
     * Find all entities that have a given set of components.
     * @param {string[]} componentNames 
     * @returns {Entity[]}
     */
    query(componentNames) {
        const result = [];
        for (const entity of this.entities.values()) {
            if (componentNames.every(name => entity.hasComponent(name))) {
                result.push(entity);
            }
        }
        return result;
    }

    /**
     * Register a system to be run on every update.
     * @param {System} system 
     */
    registerSystem(system) {
        this.systems.push(system);
    }

    /**
     * The main update loop. Runs all registered systems.
     * @param {...any} args - Arguments to pass to each system's update method.
     */
    update(...args) {
        for (const system of this.systems) {
            system.update(this, ...args);
        }
    }

    /**
     * Add a solid tile to the cache (for LOS calculations)
     * @param {number} x
     * @param {number} y
     */
    addSolidTileToCache(x, y) {
        this.solidTileCache.add(`${x},${y}`);
    }

    /**
     * Remove a solid tile from the cache (when door opens)
     * @param {number} x
     * @param {number} y
     */
    removeSolidTileFromCache(x, y) {
        this.solidTileCache.delete(`${x},${y}`);
    }

    /**
     * Check if a tile is solid (for LOS calculations)
     * @param {number} x
     * @param {number} y
     * @returns {boolean}
     */
    isSolidTile(x, y) {
        return this.solidTileCache.has(`${x},${y}`);
    }
}

/**
 * An Entity is a simple container for components.
 * It is identified by a unique ID.
 */
class Entity {
    constructor(id) {
        this.id = id;
        this.components = new Map();
    }

    /**
     * Add a component to the entity.
     * @param {object} component 
     */
    addComponent(component) {
        this.components.set(component.constructor.name, component);
    }

    /**
     * Remove a component from the entity.
     * @param {string} componentName 
     */
    removeComponent(componentName) {
        this.components.delete(componentName);
    }

    /**
     * Get a component from the entity.
     * @param {string} componentName 
     * @returns {object|undefined}
     */
    getComponent(componentName) {
        return this.components.get(componentName);
    }

    /**
     * Check if the entity has a component.
     * @param {string} componentName 
     * @returns {boolean}
     */
    hasComponent(componentName) {
        return this.components.has(componentName);
    }
}

/**
 * The base class for all Systems.
 * A system contains the game logic.
 */
class System {
    /**
     * The main update method for the system.
     * @param {World} world - The world instance.
     * @param {...any} args - Additional arguments.
     */
    update(world, ...args) {
        throw new Error('System.update() must be implemented by subclass');
    }
}
