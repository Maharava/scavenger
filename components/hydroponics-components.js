// components/hydroponics-components.js

class HydroponicsComponent {
    constructor() {
        this.state = 'empty'; // 'empty', 'growing', 'grown'
        this.seedId = null;
        this.growthTimer = 0; // in minutes
        this.yield = [0,0];
        this.seedChance = 0;
    }
}
