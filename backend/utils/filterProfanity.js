const BANNED_WORDS = [
    'damn', 'fuck', 'shit', 'hell', 'crap', 'stupid', 'idiot',
    'putangina', 'gago', 'tangina', 'bobo', 'tarantado', 'ulol',
    'bwisit', 'leche', 'punyeta', 'hayop', 'animal'
];

const filterProfanity = (text) => {
    if (!text) return '';
    let clean = text;
    BANNED_WORDS.forEach((word) => {
        const pattern = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        clean = clean.replace(pattern, (match) => '*'.repeat(match.length));
    });
    return clean;
};

module.exports = { filterProfanity, BANNED_WORDS };
