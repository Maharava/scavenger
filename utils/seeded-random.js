// Seeded Random Number Generator
// Used for reproducible procedural generation

class SeededRandom {
    constructor(seed) {
        this.seed = seed;
    }

    // Linear Congruential Generator (LCG) for deterministic random numbers
    random() {
        this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
        return this.seed / 4294967296;
    }

    // Random integer between min and max (inclusive)
    randInt(min, max) {
        return Math.floor(this.random() * (max - min + 1)) + min;
    }

    // Pick random element from array
    choice(array) {
        if (array.length === 0) return null;
        return array[this.randInt(0, array.length - 1)];
    }

    // Shuffle array (Fisher-Yates shuffle)
    shuffle(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = this.randInt(0, i);
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}
