// InteractionSystem - Handles player interaction with interactable objects
// Now supports multi-interactable selection when multiple items are adjacent

class InteractionSystem extends System {
    update(world) {
        const actors = world.query(['ActionComponent', 'PositionComponent']);
        const interactables = world.query(['PositionComponent', 'InteractableComponent']);

        for (const actor of actors) {
            const action = actor.getComponent('ActionComponent');
            if (action.name !== 'activate') continue;

            const actorPos = actor.getComponent('PositionComponent');
            const facing = actor.getComponent('FacingComponent');

            // Collect ALL adjacent interactables
            const adjacentInteractables = [];

            // First priority: check facing direction
            if (facing) {
                const offset = facing.getOffset();
                const facingX = actorPos.x + offset.dx;
                const facingY = actorPos.y + offset.dy;

                for (const interactable of interactables) {
                    const interactablePos = interactable.getComponent('PositionComponent');
                    if (interactablePos.x === facingX && interactablePos.y === facingY) {
                        const nameComp = interactable.getComponent('NameComponent');
                        const name = nameComp ? nameComp.name : 'Unknown';
                        adjacentInteractables.push({
                            entity: interactable,
                            name: name,
                            position: { x: interactablePos.x, y: interactablePos.y },
                            isFacing: true
                        });
                    }
                }
            }

            // Then check all other adjacent tiles (not already in facing direction)
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx === 0 && dy === 0) continue;

                    const checkX = actorPos.x + dx;
                    const checkY = actorPos.y + dy;

                    // Skip if this is the facing direction (already checked)
                    if (facing) {
                        const offset = facing.getOffset();
                        if (checkX === actorPos.x + offset.dx && checkY === actorPos.y + offset.dy) {
                            continue;
                        }
                    }

                    for (const interactable of interactables) {
                        const interactablePos = interactable.getComponent('PositionComponent');
                        if (interactablePos.x === checkX && interactablePos.y === checkY) {
                            const nameComp = interactable.getComponent('NameComponent');
                            const name = nameComp ? nameComp.name : 'Unknown';
                            adjacentInteractables.push({
                                entity: interactable,
                                name: name,
                                position: { x: interactablePos.x, y: interactablePos.y },
                                isFacing: false
                            });
                        }
                    }
                }
            }

            // Handle based on number of interactables found
            if (adjacentInteractables.length === 0) {
                // Nothing to interact with
                world.addComponent(actor.id, new MessageComponent('Nothing to interact with here.', 'gray'));
            } else if (adjacentInteractables.length === 1) {
                // Only one interactable - directly activate it
                const target = adjacentInteractables[0].entity;
                const interactableComp = target.getComponent('InteractableComponent');
                const script = SCRIPT_REGISTRY[interactableComp.script];
                if (script) {
                    script(world.game, target, interactableComp.scriptArgs);
                }
            } else {
                // Multiple interactables - show selection menu
                world.addComponent(actor.id, new SelectionMenuComponent(adjacentInteractables));
            }

            actor.removeComponent('ActionComponent');
        }
    }
}
