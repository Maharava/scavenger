// Combat flavor text for varied message display
// Adds variety to combat messages to reduce repetition

const COMBAT_FLAVOR = {
    HIT: [
        "You hit the",
        "Your shot connects with",
        "Direct hit on",
        "You strike"
    ],
    MISS: [
        "You miss!",
        "Your shot goes wide!",
        "You fail to hit the target!",
        "Your aim was off!"
    ],
    DODGE: [
        "They dodge at the last second!",
        "They evade your shot!",
        "They move out of the way!",
        "Your target dodges!"
    ],
    HEAD_50: [
        "They appear dazed.",
        "Their eyes are unfocused.",
        "They're struggling to track you.",
        "Blood streams from their face.",
        "They stagger, disoriented."
    ],
    HEAD_25: [
        "They're struggling to focus.",
        "Their vision is clearly impaired.",
        "They can barely keep their head up.",
        "They're swaying unsteadily.",
        "Severe head trauma is evident."
    ],
    TORSO_50: [
        "They're winded.",
        "They're breathing heavily.",
        "They clutch their chest.",
        "They're favoring their side.",
        "Their movements are labored."
    ],
    TORSO_25: [
        "They're bleeding heavily.",
        "Blood pours from their wounds.",
        "Their chest is a mess of gore.",
        "They're gasping for air.",
        "They won't last much longer."
    ],
    LIMBS_50: [
        "They have a pronounced limp.",
        "They're favoring one arm.",
        "Their movements are unsteady.",
        "They're clearly injured.",
        "One of their limbs isn't working properly."
    ],
    LIMBS_25: [
        "One of their legs isn't working.",
        "One of their arms isn't working.",
        "They drag a useless limb.",
        "They can barely move.",
        "They're crippled, but still fighting."
    ]
};

// Helper function to get random flavor text
function getRandomFlavor(category) {
    const messages = COMBAT_FLAVOR[category];
    if (!messages || messages.length === 0) return "";
    return messages[Math.floor(Math.random() * messages.length)];
}
