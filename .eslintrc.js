module.exports = {
    "env": {
        "browser": true,
        "es2021": true
    },
    "extends": "eslint:recommended",
    "globals": {
        "Chess": "readonly",
        "Chessboard": "readonly",
        "ChessEngine": "readonly",
        "BoardFeatures": "readonly"
    },
    "parserOptions": {
        "ecmaVersion": 12
    },
    "rules": {
        "no-unused-vars": "warn",
        "no-undef": "warn"
    }
};