const CONFIG = {
    TOTAL_ROUNDS: 5,
    MIN_WAIT_TIME: 2000,  // ms
    MAX_WAIT_TIME: 5000,  // ms
    
    MAPS: [
        {
            name: 'Desert Noon',
            background: '#f4a460',
            cue: 'light',
            cueText: 'The sun dims...'
        },
        {
            name: 'Saloon',
            background: '#8b4513',
            cue: 'bird',
            cueText: 'A crow caws!'
        },
        {
            name: 'Ghost Town',
            background: '#d2b48c',
            cue: 'bell',
            cueText: 'The bell tolls!'
        },
        {
            name: 'Canyon',
            background: '#cd853f',
            cue: 'wind',
            cueText: 'The wind howls!'
        },
        {
            name: 'Train Station',
            background: '#a0826d',
            cue: 'whistle',
            cueText: 'Train whistle blows!'
        }
    ],
    
    HATS: [
        { name: 'Cowboy', type: 'cowboy' },
        { name: 'Sheriff', type: 'sheriff' },
        { name: 'Bandana', type: 'bandana' },
        { name: 'Ranger', type: 'ranger' },
        { name: 'Sombrero', type: 'sombrero' },
        { name: 'Top Hat', type: 'tophat' },
        { name: 'None', type: 'none' }
    ],
    
    OUTFITS: [
        { name: 'Poncho', type: 'poncho' },
        { name: 'Vest', type: 'vest' },
        { name: 'Leather', type: 'leather' },
        { name: 'Uniform', type: 'uniform' },
        { name: 'Duster', type: 'duster' },
        { name: 'Plain', type: 'plain' }
    ],
    
    GUNS: [
        { name: 'Revolver', type: 'revolver' },
        { name: 'Pistol', type: 'pistol' },
        { name: 'Rifle', type: 'rifle' }
    ],
    
    ACCESSORIES: [
        { name: 'None', type: 'none' },
        { name: 'Badge', type: 'badge' },
        { name: 'Bandolier', type: 'bandolier' },
        { name: 'Scarf', type: 'scarf' }
    ],
    
    EYES: [
        { name: 'Normal', type: 'normal' },
        { name: 'Squint', type: 'squint' },
        { name: 'Wide', type: 'wide' },
        { name: 'Angry', type: 'angry' },
        { name: 'Dots', type: 'dots' },
        { name: 'Closed', type: 'closed' }
    ],
    
    BODY_SHAPES: [
        { name: 'Normal', type: 'normal' },
        { name: 'Slim', type: 'slim' },
        { name: 'Bulky', type: 'bulky' },
        { name: 'Tall', type: 'tall' },
        { name: 'Short', type: 'short' }
    ],
    
    KEYS: {
        PLAYER1: ' ',      // Space
        PLAYER2: 'Enter'
    }
};
