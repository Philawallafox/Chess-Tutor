// Main JS for Chess Tutor with JSDoc annotations for IDE support

/**
 * @typedef {Object} ChessAppConfig
 * @property {string} stockfishPath - Path to the Stockfish engine script
 * @property {number} skillLevel - Engine skill level (0-20)
 * @property {string} promotion - Default promotion piece (e.g., 'q')
 * @property {number} openingDelay - Delay in ms between opening moves
 */

/**
 * @typedef {Object} ChessAppState
 * @property {import('chessboard').Board} board - Chessboard.js instance
 * @property {import('chess.js').Chess} game - chess.js game instance
 * @property {ChessEngine} engine - Chess engine wrapper instance
 * @property {BoardFeatures} features - BoardFeatures instance for arrows/highlights
 * @property {ChessAppConfig} config - Application configuration
 */

(function() {
  'use strict';

  /** @type {ChessAppState} */
  const ChessApp = {
    board: null,
    game: null,
    engine: null,
    features: null,
    config: {
      stockfishPath: 'assets/js/stockfish.js',
      skillLevel: 10,
      promotion: 'q',
      openingDelay: 500
    }
  };

  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', init);
  
  function createBoard(position, themeName) {
    // @type {string} element ID for chessboard container
    ChessApp.board = Chessboard('chessboard', {
      position,
      pieceTheme: themeName == 'custom' ? 'assets/img/custom/{piece}.png' : 'https://chessboardjs.com/img/chesspieces/'+themeName+'/{piece}.png',
      draggable: true,
      onDragStart: handleDragStart,
      onDrop: handleDrop,
      onSnapEnd: handleSnapEnd
    });
    ChessApp.board.container = document.querySelector('#chessboard')

    ChessApp.engine = new ChessEngine({
      stockfishPath: ChessApp.config.stockfishPath,
      skill: ChessApp.config.skillLevel,
      fallbackToSimple: true
    });
    ChessApp.engine.onReady = () => console.log('Engine is ready');

    ChessApp.features = new BoardFeatures(ChessApp.board, {
      arrowColor: 'rgba(255,0,0,0.6)',
      arrowWidth: 5,
      highlightColor: 'rgba(255,255,0,0.4)'
    });
  }

  /**
   * Initialize the Chess Tutor application
   */
  function init() {
    ChessApp.game = new Chess();

    // Check if user has a saved theme preference
    const savedTheme = localStorage.getItem('chessTheme');
    if (savedTheme) {
        // Update the theme selector dropdown
        const themeSelector = document.getElementById('pieceStyle');
        // Only set the value if this option exists in the dropdown
		if ([...themeSelector.options].some(opt => opt.value === savedTheme)) {
			themeSelector.value = savedTheme;
		}
    }
    
    createBoard('start', savedTheme || 'wikipedia');

    bindControls();
  }

  // Change the theme of the chessboard
  function changeTheme(themeName) {
    // Store the current position
    const currentPosition = ChessApp.board.position();
    
    // Destroy the old board
    ChessApp.board.destroy();
    
    createBoard(currentPosition, themeName);
    
    // Save preference to localStorage for next visit
    localStorage.setItem('chessTheme', themeName);
  }

  /**
   * Bind UI control event handlers
   */
  function bindControls() {
    document.getElementById('startBtn').addEventListener('click', resetBoard);
    document.getElementById('flipBoard').addEventListener('click', () => ChessApp.board.flip());
    document.getElementById('clearArrowsBtn').addEventListener('click', () => ChessApp.features.clearArrows());
    document.getElementById('playOpening').addEventListener('click', () => playOpening(['e2-e4','e7-e5','g1-f3']));

    document.querySelectorAll('input[name="moveMethod"]').forEach(r => {
      r.addEventListener('change', e => {
        ChessApp.board.draggable = e.target.value === 'drag';
      });
    });

    document.getElementById('pieceStyle').addEventListener('change', e => {
      changeTheme(e.target.value);
    });
  }

  /**
   * Determine if a piece can be dragged
   * @param {string} source - square identifier (e.g., 'e2')
   * @returns {boolean}
   */
  function handleDragStart(source) {
    if (ChessApp.game.game_over()) return false;
    const moves = ChessApp.game.moves({ square: source, verbose: true });
    return moves.length > 0;
  }

  /**
   * Handle piece drop and engine response
   * @param {string} source - origin square
   * @param {string} target - destination square
   * @returns {string|undefined} 'snapback' if move illegal
   */
  function handleDrop(source, target) {
    const move = ChessApp.game.move({ from: source, to: target, promotion: ChessApp.config.promotion });
    if (!move) return 'snapback';

    ChessApp.board.position(ChessApp.game.fen());
    ChessApp.features.clearAll();

    /*ChessApp.engine.makeMove(move.san)
      .then(resp => {
        ChessApp.game.move(resp.bestMove);
        ChessApp.board.position(ChessApp.game.fen());
      })
      .catch(console.error);*/
  }

  /**
   * Update board after piece snap
   */
  function handleSnapEnd() {
    ChessApp.board.position(ChessApp.game.fen());
  }

  /**
   * Play a predefined opening sequence
   * @param {string[]} moves - array of SAN moves
   */
  function playOpening(moves) {
    moves.forEach((m, i) => {
      setTimeout(() => {
        ChessApp.game.move(m);
        ChessApp.board.position(ChessApp.game.fen());
      }, i * ChessApp.config.openingDelay);
    });
  }

  /**
   * Reset the board to starting position
   */
  function resetBoard() {
    ChessApp.game.reset();
    ChessApp.board.position('start');
    ChessApp.features.clearAll();
  }

})();