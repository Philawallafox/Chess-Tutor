/**
 * Chess Tutor - Opening Book
 * 
 * This file contains a curated opening book that allows the computer
 * to follow specific opening lines during practice games.
 */

// Opening book entries with simplified FEN as keys (position + active color)
const openingBook = {
    // Starting position
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w": {
      name: "Starting Position",
      moves: ["e2e4", "d2d4", "c2c4", "g1f3"],
      weights: [40, 30, 20, 10]
    },
    
    // After 1.e4
    "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b": {
      name: "King's Pawn Opening",
      moves: ["e7e5", "c7c5", "e7e6", "c7c6"],
      weights: [40, 30, 20, 10] // e5 (Open Game), c5 (Sicilian), e6 (French), c6 (Caro-Kann)
    },
    
    // After 1.d4
    "rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b": {
      name: "Queen's Pawn Opening",
      moves: ["d7d5", "g8f6", "e7e6", "c7c5"],
      weights: [40, 30, 20, 10] // d5 (Queen's Pawn Game), Nf6 (Indian Defenses), e6 (QGD setup), c5 (Benoni)
    },
    
    // Ruy Lopez main line setup
    "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w": {
      name: "Response: 1...e5",
      moves: ["g1f3"],
      weights: [100] // Almost always Nf3
    },
    
    "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b": {
      name: "King's Knight Opening",
      moves: ["b8c6"],
      weights: [100] // Almost always Nc6
    },
    
    "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w": {
      name: "Response: 2...Nc6",
      moves: ["f1b5", "f1c4", "d2d4"],
      weights: [60, 30, 10] // Bb5 (Ruy Lopez), Bc4 (Italian), d4 (Scotch)
    },
    
    // Ruy Lopez
    "r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b": {
      name: "Ruy Lopez",
      moves: ["a7a6", "g8f6", "f8c5"],
      weights: [70, 20, 10] // a6 (Morphy Defense), Nf6 (Berlin Defense), Bc5 (Classical)
    },
    
    // Italian Game
    "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b": {
      name: "Italian Game",
      moves: ["f8c5", "g8f6"],
      weights: [60, 40] // Bc5 (Giuoco Piano), Nf6 (Two Knights)
    },
    
    // Sicilian main lines
    "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w": {
      name: "Sicilian Defense",
      moves: ["g1f3", "b1c3", "c2c3"],
      weights: [60, 30, 10] // Nf3 (Open Sicilian), Nc3 (Closed), c3 (Alapin)
    },
    
    // French main lines
    "rnbqkbnr/ppp2ppp/4p3/3p4/3PP3/8/PPP2PPP/RNBQKBNR w": {
      name: "French Defense",
      moves: ["b1c3", "e4e5", "e4d5"],
      weights: [40, 30, 30] // Nc3 (Classical), e5 (Advance), exd5 (Exchange)
    }
    
    // Additional opening positions would be added here
  };
  
  // Specific opening lines that can be forced during practice
  const forcedOpenings = {
    "ruy_lopez": [
      {fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", move: "e2e4"},
      {fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1", move: "e7e5"},
      {fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2", move: "g1f3"},
      {fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2", move: "b8c6"},
      {fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3", move: "f1b5"}
    ],
    
    "italian_game": [
      {fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", move: "e2e4"},
      {fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1", move: "e7e5"},
      {fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2", move: "g1f3"},
      {fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2", move: "b8c6"},
      {fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3", move: "f1c4"}
    ],
    
    "sicilian_defense": [
      {fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", move: "e2e4"},
      {fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1", move: "c7c5"}
    ],
    
    "french_defense": [
      {fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", move: "e2e4"},
      {fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1", move: "e7e6"}
    ],
    
    "queens_gambit": [
      {fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", move: "d2d4"},
      {fen: "rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 1", move: "d7d5"},
      {fen: "rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR w KQkq d6 0 2", move: "c2c4"}
    ]
    
    // Additional forced opening sequences would be defined here
  };
  
  /**
   * Get a move from the opening book for the current position
   * @param {string} fen - The FEN string of the current position
   * @returns {string|null} - UCI move string or null if not in book
   */
  function getBookMove(fen) {
    // Simplify FEN to match book keys (just position and active color)
    const fenParts = fen.split(' ');
    const simplifiedFen = fenParts[0] + ' ' + fenParts[1];
    
    // Check if position is in book
    const bookEntry = openingBook[fenParts[0] + ' ' + fenParts[1]];
    if (!bookEntry || !bookEntry.moves || bookEntry.moves.length === 0) {
      return null;
    }
    
    // Select a move based on weights
    const moves = bookEntry.moves;
    const weights = bookEntry.weights || moves.map(() => 1);
    
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let randomValue = Math.random() * totalWeight;
    
    for (let i = 0; i < weights.length; i++) {
      randomValue -= weights[i];
      if (randomValue <= 0) {
        return moves[i];
      }
    }
    
    // Fallback to first move
    return moves[0];
  }
  
  /**
   * Get a move from a forced opening sequence
   * @param {string} openingName - Name of the opening to follow
   * @param {string} fen - Current position FEN
   * @returns {string|null} - UCI move or null if not in sequence
   */
  function getForcedOpeningMove(openingName, fen) {
    const sequence = forcedOpenings[openingName];
    if (!sequence) return null;
    
    // Simplify FEN for comparison (keep only position, active color, castling rights, en passant)
    const simplifiedFen = fen.split(' ').slice(0, 4).join(' ');
    
    // Find the matching position in the sequence
    for (const position of sequence) {
      const positionFen = position.fen.split(' ').slice(0, 4).join(' ');
      if (positionFen === simplifiedFen) {
        return position.move;
      }
    }
    
    return null;
  }
  
  // Make functions available globally
  window.getBookMove = getBookMove;
  window.getForcedOpeningMove = getForcedOpeningMove;
  window.openingBook = openingBook;
  window.forcedOpenings = forcedOpenings;