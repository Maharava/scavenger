// InteractionSystem - Handles player interaction with interactable objects
// Prioritizes checking the direction the actor is facing first

class InteractionSystem extends System {
    update(world) {
        const actors = world.query(['ActionComponent', 'PositionComponent']);
        const interactables = world.query(['PositionComponent', 'InteractableComponent']);

        for (const actor of actors) {
            const action = actor.getComponent('ActionComponent');
            if (action.name !== 'activate') continue;

            const actorPos = actor.getComponent('PositionComponent');
            const facing = actor.getComponent('FacingComponent');

            // First, check directly in front of the actor (if they have a facing direction)
            if (facing) {
                const offset = facing.getOffset();
                const facingX = actorPos.x + offset.dx;
                const facingY = actorPos.y + offset.dy;

                // Look for interactable in facing direction
                for (const interactable of interactables) {
                    const interactablePos = interactable.getComponent('PositionComponent');
                    if (interactablePos.x === facingX && interactablePos.y === facingY) {
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

            // If nothing found in facing direction, search all adjacent tiles
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
