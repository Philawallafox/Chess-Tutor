if (typeof Chess === 'undefined') {
    throw new Error('Chess.js library is required');
}

if (typeof Chessboard === 'undefined') {
    throw new Error('Chessboard.js library is required');
}

if (typeof ChessEngine === 'undefined') {
    throw new Error('ChessEngine library is required');
}

(function () {
  'use strict';

  /**
 * @type {{
 *   board: any,
 *   game: any,
 *   boardFeatures: any,
 *   engine: any,
 *   config: {
 *     stockfishPath: string,
 *     skillLevel: number,
 *     promotionPiece: string,
 *     openingMoveDelay: number
 *   }
 * }}
 */
const ChessApp = {
    board: null,
    game: null,
    boardFeatures: null,
    engine: null,
    config: {
      stockfishPath: 'assets/js/stockfish.js',
      skillLevel: 10,
      promotionPiece: 'q',
      openingMoveDelay: 500,
    },
  };

  document.addEventListener('DOMContentLoaded', initializeChessApp);

  function initializeChessApp() {
    const boardEl = document.getElementById('chessboard');
    if (!boardEl) {
      console.error('Missing #chessboard element');
      return;
    }

    ChessApp.board = Chessboard(boardEl, {
      position: 'start',
      draggable: true,
      onDragStart: onDragStart,
      onDrop: onDrop,
      onSnapEnd: onSnapEnd,
    });
    ChessApp.game = new Chess();

    initializeEngine();

    ChessApp.boardFeatures = new BoardFeatures(ChessApp.board, {
      arrowColor: 'rgba(255, 0, 0, 0.6)',
      arrowWidth: 8,
      highlightColor: 'rgba(255, 255, 0, 0.5)',
    });

    setupButtonHandlers();
    setupMoveInputMethods();
    window.addEventListener('resize', debounce(onResize, 200));
  }

  function initializeEngine() {
    ChessApp.engine = new ChessEngine({
      stockfishPath: ChessApp.config.stockfishPath,
      skill: ChessApp.config.skillLevel,
      fallbackToSimple: true,
    });
    ChessApp.engine.onReady = () => console.log('Engine ready');
  }

  function setupButtonHandlers() {
    document.getElementById('startBtn').addEventListener('click', resetBoard);
    document.getElementById('flipBoard').addEventListener('click', () => {
      ChessApp.board.flip();
      ChessApp.boardFeatures.render();
    });
    document.getElementById('clearArrowsBtn').addEventListener('click', () => ChessApp.boardFeatures.clearArrows());
    document.getElementById('playOpening').addEventListener('click', () => playOpeningSequence(['e2-e4', 'e7-e5', 'g1-f3']));
    document.getElementById('startLearning').addEventListener('click', () => alert('Feature coming soon!'));
    document.getElementById('pieceStyle').addEventListener('change', e => {
      const style = e.target.value.toLowerCase();
      ChessApp.board.pieceTheme = `assets/images/chesspieces/${style}/{piece}.png`;
      ChessApp.board.position(ChessApp.game.fen());
    });
  }

  function setupMoveInputMethods() {
    let cleanup = null;
    
    document.querySelectorAll('input[name="moveMethod"]').forEach(radio =>
        radio.addEventListener('change', e => {
            // Clean up previous method
            if (cleanup) cleanup();
            
            ChessApp.board.draggable = e.target.value === 'drag';
            
            if (e.target.value === 'click') {
                cleanup = setupClickToMove();
            } else if (e.target.value === 'algebraic') {
                cleanup = setupAlgebraicInput();
            }
        })
    );
  }

  function onDragStart(source) {
    if (ChessApp.game.game_over()) return false;
    const moves = ChessApp.game.moves({ square: source, verbose: true });
    return moves.length > 0;
  }

  /**
 * @param {string} source - Starting square
 * @param {string} target - Target square
 * @returns {string|Promise<void>} - 'snapback' if move is invalid
 */
function onDrop(source, target) {
    try {
        const move = ChessApp.game.move({ 
            from: source, 
            to: target, 
            promotion: ChessApp.config.promotionPiece 
        });
        
        if (!move) return 'snapback';
        
        ChessApp.boardFeatures.clearAll();
        updateEvaluation();
        
        return ChessApp.engine.makeMove(move.san)
            .then(response => {
                if (!response || !response.bestMove) {
                    throw new Error('Invalid engine response');
                }
                ChessApp.game.move(response.bestMove);
                updateBoardPosition();
                updateEvaluation();
            })
            .catch(err => {
                console.error('Engine error:', err);
                updateBoardPosition(); // Ensure board is updated even if engine fails
            });
    } catch (err) {
        console.error('Move error:', err);
        return 'snapback';
    }
  }

  function onSnapEnd() {
    updateBoardPosition();
  }

  function setupClickToMove() {
    let source = null;
    const boardEl = document.getElementById('chessboard');
    
    // Store the handler function for cleanup
    const clickHandler = event => {
        const sq = event.target.getAttribute('data-square');
        if (!source) {
            source = sq;
            ChessApp.boardFeatures.highlightSquare(sq);
        } else {
            onDrop(source, sq);
            source = null;
            ChessApp.boardFeatures.clearHighlights();
        }
    };

    // Clean up existing handlers
    boardEl.removeEventListener('click', clickHandler);
    boardEl.addEventListener('click', clickHandler);
    
    return () => boardEl.removeEventListener('click', clickHandler); // Cleanup function
}

  function setupAlgebraicInput() {
    const controls = document.querySelector('.controls');
    let input = controls.querySelector('.algebraic-input');
    
    if (!input) {
        input = document.createElement('input');
        input.className = 'algebraic-input';
        input.placeholder = 'e.g. Nf3';
        controls.appendChild(input);
    }
    
    input.addEventListener('change', () => {
        const moveText = input.value.trim();
        
        if (!moveText) return;
        
        try {
            const move = ChessApp.game.move(moveText);
            if (move) {
                updateBoardPosition();
                input.value = '';
            } else {
                showInputError(input, 'Invalid move');
            }
        } catch (err) {
            showInputError(input, 'Invalid move format');
        }
    });
}

function showInputError(input, message) {
    input.classList.add('error');
    input.title = message;
    setTimeout(() => {
        input.classList.remove('error');
        input.title = '';
    }, 1000);
}

  function playOpeningSequence(moves) {
    moves.forEach((m, i) => {
      setTimeout(() => {
        const move = ChessApp.game.move(m);
        if (move) updateBoardPosition();
        else console.warn(`Invalid opening move: ${m}`);
      }, i * ChessApp.config.openingMoveDelay);
    });
  }

  function updateEvaluation() {
    const evalEl = document.getElementById('evaluation');
    if (!evalEl) return;
    
    if (!ChessApp.engine?.evaluate) {
        evalEl.textContent = 'Engine not ready';
        return;
    }
    
    const score = ChessApp.engine.evaluate(ChessApp.game.fen());
    evalEl.textContent = score != null ? score : 'n/a';
}

  function updateBoardPosition() {
    if (!ChessApp.board?.position || !ChessApp.game?.fen) return;
    
    requestAnimationFrame(() => {
        ChessApp.board.position(ChessApp.game.fen());
        if (ChessApp.boardFeatures?.render) {
            ChessApp.boardFeatures.render();
        }
    });
}

  function resetBoard() {
    ChessApp.game.reset();
    updateBoardPosition();
    ChessApp.boardFeatures.clearAll();
  }

  function onResize() {
    ChessApp.board.resize();
    ChessApp.boardFeatures.resizeCanvas();
    ChessApp.boardFeatures.render();
  }

  function debounce(fn, delay) {
    let timer = null;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }
})();
