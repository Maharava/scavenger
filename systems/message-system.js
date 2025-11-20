// MessageSystem - Displays game messages to the player in the message log

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
