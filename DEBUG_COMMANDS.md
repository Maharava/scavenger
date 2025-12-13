# Debug Commands for Browser Console

## Clear Cache
1. Open `CLEAR_CACHE.html` in your browser
2. Click "CLEAR ALL GAME DATA"
3. Reload `index.html`

## Verify Inventory

Paste this into browser console after game loads:

```javascript
// Check player inventory
const player = world.query(['PlayerComponent'])[0];
const inv = player.getComponent('InventoryComponent');

console.log('\n=== PLAYER INVENTORY ===');
console.log('Total items:', inv.items.size);

for (const [key, data] of inv.items) {
    const entity = world.getEntity(data.entityId);
    const itemComp = entity.getComponent('ItemComponent');
    const partComp = entity.getComponent('PartComponent');

    console.log(`\nItem: ${key}`);
    console.log(`  Quantity: ${data.quantity}`);
    console.log(`  Entity ID: ${data.entityId}`);
    console.log(`  ItemComponent.name: ${itemComp ? itemComp.name : 'MISSING'}`);
    console.log(`  PartComponent: ${partComp ? partComp.part_type : 'MISSING'}`);
}

// Check ship cargo
const shipEntity = world.query(['ShipComponent'])[0];
if (shipEntity) {
    const ship = shipEntity.getComponent('ShipComponent');
    console.log('\n=== SHIP CARGO ===');
    console.log('Total items:', ship.cargo.size);

    for (const [key, data] of ship.cargo) {
        const entity = world.getEntity(data.entityId);
        const itemComp = entity.getComponent('ItemComponent');
        const partComp = entity.getComponent('PartComponent');

        console.log(`\nItem: ${key}`);
        console.log(`  Quantity: ${data.quantity}`);
        console.log(`  Entity ID: ${data.entityId}`);
        console.log(`  ItemComponent.name: ${itemComp ? itemComp.name : 'MISSING'}`);
        console.log(`  PartComponent: ${partComp ? partComp.part_type : 'MISSING'}`);
    }
}
```

## Manually Spawn Test Module

If inventory is empty, spawn a test module:

```javascript
const player = world.query(['PlayerComponent'])[0];
const inv = player.getComponent('InventoryComponent');

// Find the Rubber Grip definition
const def = EQUIPMENT_DATA.find(e => e.id === 'RUBBER_GRIP');
console.log('Module def found:', def);
console.log('part_type:', def.part_type);

// Create entity
const entity = world.createEntity();
world.addComponent(entity, new ItemComponent(def.name, def.description, def.weight, 0.5));
world.addComponent(entity, new NameComponent(def.name));
world.addComponent(entity, new PartComponent(def.part_type));
world.addComponent(entity, new RenderableComponent(def.char, def.colour, 0));

console.log('Created entity:', entity);

// Add to inventory
inv.items.set(def.name, { entityId: entity, quantity: 2 });
console.log('Added to inventory!');

// Verify
const stored = inv.items.get(def.name);
const storedEntity = world.getEntity(stored.entityId);
console.log('Verify - Entity:', storedEntity);
console.log('Verify - PartComponent:', storedEntity.getComponent('PartComponent'));
```

## Test Recycler

After spawning modules, test the recycler:

```javascript
// Find recycler interactable
const recyclers = world.query(['InteractableComponent']);
const recycler = recyclers.find(e => {
    const name = e.getComponent('NameComponent');
    return name && name.name === 'Recycler';
});

if (recycler) {
    console.log('Found recycler at:', recycler.getComponent('PositionComponent'));

    // Manually trigger recycler menu
    const script = SCRIPT_REGISTRY['openRecyclerMenu'];
    script(game, recycler, {});
} else {
    console.log('Recycler not found!');
}
```
