// components/producer-component.js
// Generic component for producer-type interactables (hydroponics, smelters, recyclers, etc.)

class ProducerComponent {
    constructor(producerType) {
        this.producerType = producerType; // e.g., 'HYDROPONICS', 'SMELTER', 'RECYCLER'
        this.state = 'empty'; // 'empty', 'processing', 'ready', 'failed'
        this.recipeId = null; // For looking up recipe outputs
        this.inputItemId = null; // For displaying what's being processed

        // Deadline-based production tracking
        this.endTotalMinutes = 0; // Absolute finish time (compared to timeComponent.totalMinutes)
        this.baseProductionTime = 0; // Base recipe time in minutes (for skill reduction calculation)
        this.lastReductionDay = 0; // Last day we applied skill reduction (prevents duplicates)
    }
}
