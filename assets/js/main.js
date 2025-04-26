// main.js - Main application initialization

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeChessApp();
  });
  
  function initializeChessApp() {
    // First, check if the chessboard element exists
    const boardElement = document.getElementById('chessboard');
    
    if (!boardElement) {
      console.error('Chessboard element not found! Make sure you have <div id="chessboard"></div> in your HTML.');
      return; // Exit if element doesn't exist
    }
    
    console.log('Initializing Chess Tutor application...');
    
    // Initialize chessboard
    const config = {
      position: 'start',
      draggable: true,
      onDragStart: onDragStart,
      onDrop: onDrop,
      onSnapEnd: onSnapEnd
    };
    
    // Initialize the chessboard
    try {
      const board = Chessboard('chessboard', config);
      
      // Log successful initialization
      console.log('Chessboard initialized successfully');
      
      // Initialize chess.js
      const game = new Chess();
      
      // Store board and game in window for access from other scripts
      window.chessBoard = board;
      window.chessGame = game;
      
      // Initialize the chess engine
      initializeEngine();
      
      // Initialize board features AFTER board is fully rendered
      setTimeout(() => {
        try {
          window.boardFeatures = new BoardFeatures(board, {
            arrowColor: 'rgba(255, 0, 0, 0.6)',
            arrowWidth: 8,
            highlightColor: 'rgba(255, 255, 0, 0.5)'
          });
          console.log('Board features initialized successfully');
        } catch (error) {
          console.error('Error initializing board features:', error);
        }
        
        // Set up buttons
        setupButtonHandlers(board, game);
        
        // Set up move input methods
        setupMoveInputMethods(board, game);
      }, 500);
      
      // Adjust board size on window resize
      window.addEventListener('resize', () => {
        board.resize();
        
        // Need to redraw features after resize
        if (window.boardFeatures) {
          setTimeout(() => {
            window.boardFeatures.resizeCanvas();
            window.boardFeatures.render();
          }, 100);
        }
      });
    } catch (error) {
      console.error('Error initializing chessboard:', error);
    }
  }
  
  function initializeEngine() {
    try {
      // Create chess engine
      window.chessEngine = new ChessEngine({
        // For CDN
        stockfishPath: 'https://cdn.jsdelivr.net/npm/stockfish@11.0.0/stockfish.js',
        // For local stockfish.js (if you have it)
        // stockfishPath: 'js/stockfish.js',
        skill: 10,
        fallbackToSimple: true
      });
      
      // Register ready handler
      window.chessEngine.onReady = function() {
        console.log('Chess engine ready');
        
        // You can test the engine here if you like
        window.chessEngine.setPosition('startpos');
        
        // Example of getting a move recommendation
        // window.chessEngine.getBestMove(move => {
        //   console.log('Recommended move:', move);
        // }, 1000);
      };
    } catch (error) {
      console.error('Failed to initialize chess engine:', error);
    }
  }
  
  function setupButtonHandlers(board, game) {
    // Start position button
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        board.position('start');
        game.reset();
        if (window.boardFeatures) {
          window.boardFeatures.clearAll();
        }
      });
    }
    
    // Flip board button
    const flipBtn = document.getElementById('flipBoard');
    if (flipBtn) {
      flipBtn.addEventListener('click', () => {
        board.flip();
        if (window.boardFeatures) {
          window.boardFeatures.render();
        }
      });
    }
    
    // Clear arrows button
    const clearArrowsBtn = document.getElementById('clearArrowsBtn');
    if (clearArrowsBtn) {
      clearArrowsBtn.addEventListener('click', () => {
        if (window.boardFeatures) {
          window.boardFeatures.clearArrows();
        }
      });
    }
    
    // Play Opening button
    const playOpeningBtn = document.getElementById('playOpening');
    if (playOpeningBtn) {
      playOpeningBtn.addEventListener('click', () => {
        // For now, just play the first few moves of e4 opening
        playOpeningSequence(board, game, ['e2-e4', 'e7-e5', 'g1-f3']);
      });
    }
    
    // Start Learning button
    const startLearningBtn = document.getElementById('startLearning');
    if (startLearningBtn) {
      startLearningBtn.addEventListener('click', () => {
        alert('This feature is coming soon!');
      });
    }
    
    // Piece style selector
    const pieceStyleSelect = document.getElementById('pieceStyle');
    if (pieceStyleSelect) {
      pieceStyleSelect.addEventListener('change', (e) => {
        const style = e.target.value.toLowerCase();
        board.pieceTheme = `img/chesspieces/${style}/{piece}.png`;
        board.position(game.fen()); // Refresh board with new pieces
      });
    }
  }
  
  function setupMoveInputMethods(board, game) {
    const moveMethodRadios = document.querySelectorAll('input[name="moveMethod"]');
    if (moveMethodRadios.length === 0) return;
    
    // Keep track of click handlers to remove them when changing modes
    let clickHandler = null;
    
    moveMethodRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const moveMethod = e.target.value;
        
        // Clear any existing click handlers
        if (clickHandler) {
          const boardEl = document.querySelector('.board-b72b1');
          if (boardEl) {
            boardEl.removeEventListener('click', clickHandler);
          }
          clickHandler = null;
        }
        
        // Remove algebraic input if it exists
        const existingInput = document.getElementById('algebraicInput');
        if (existingInput && existingInput.parentNode) {
          existingInput.parentNode.removeChild(existingInput.parentNode);
        }
        
        // Enable appropriate move method
        if (moveMethod === 'drag') {
          board.draggable = true;
        } else if (moveMethod === 'click') {
          board.draggable = false;
          setupClickToMove(board, game);
        } else if (moveMethod === 'algebraic') {
          board.draggable = false;
          setupAlgebraicInput(board, game);
        }
      });
    });
    
    function setupClickToMove(board, game) {
      let selectedSquare = null;
      
      clickHandler = function(e) {
        const square = getBoardSquareFromEvent(e, board);
        if (!square) return;
        
        if (!selectedSquare) {
          // First click - select piece
          if (game.get(square)) {
            selectedSquare = square;
            if (window.boardFeatures) {
              window.boardFeatures.highlightSquare(square);
            }
          }
        } else {
          // Second click - attempt move
          const move = game.move({
            from: selectedSquare,
            to: square,
            promotion: 'q' // Auto-promote to queen for simplicity
          });
          
          if (move) {
            // Valid move
            board.position(game.fen());
            if (window.boardFeatures) {
              window.boardFeatures.clearHighlights();
            }
          } else {
            // Invalid move, check if clicked on another piece
            if (game.get(square)) {
              if (window.boardFeatures) {
                window.boardFeatures.clearHighlights();
                window.boardFeatures.highlightSquare(square);
              }
              selectedSquare = square;
            }
          }
          
          if (move || !game.get(square)) {
            selectedSquare = null;
          }
        }
      };
      
      const boardEl = document.querySelector('.board-b72b1');
      if (boardEl) {
        boardEl.addEventListener('click', clickHandler);
      }
    }
    
    function setupAlgebraicInput(board, game) {
      // Create input field if it doesn't exist
      let inputField = document.getElementById('algebraicInput');
      if (!inputField) {
        const inputContainer = document.createElement('div');
        inputContainer.className = 'algebraic-input';
        inputContainer.style.marginTop = '15px';
        
        inputField = document.createElement('input');
        inputField.id = 'algebraicInput';
        inputField.type = 'text';
        inputField.placeholder = 'Enter move (e.g., e4, Nf3)';
        inputField.style.width = '70%';
        inputField.style.padding = '5px';
        
        const inputButton = document.createElement('button');
        inputButton.textContent = 'Move';
        inputButton.style.marginLeft = '10px';
        
        inputContainer.appendChild(inputField);
        inputContainer.appendChild(inputButton);
        
        const boardContainer = document.querySelector('.board-container') || document.getElementById('chessboard').parentNode;
        boardContainer.appendChild(inputContainer);
        
        // Set up event handler
        inputButton.addEventListener('click', () => {
          const moveText = inputField.value.trim();
          if (!moveText) return;
          
          try {
            const move = game.move(moveText);
            if (move) {
              board.position(game.fen());
              inputField.value = '';
            } else {
              alert('Invalid move! Please try again.');
            }
          } catch (error) {
            alert('Invalid move format! Please try again.');
          }
        });
        
        // Also allow Enter key
        inputField.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            const moveText = inputField.value.trim();
            if (!moveText) return;
            
            try {
              const move = game.move(moveText);
              if (move) {
                board.position(game.fen());
                inputField.value = '';
              } else {
                alert('Invalid move! Please try again.');
              }
            } catch (error) {
              alert('Invalid move format! Please try again.');
            }
          }
        });
      }
    }
  }
  // main.js - Main application initialization
  
  // Wait for DOM to be fully loaded
  document.addEventListener('DOMContentLoaded', () => {
    initializeChessApp();
  });
  
  function initializeChessApp() {
    // First, check if the chessboard element exists
    const boardElement = document.getElementById('chessboard');
    
    if (!boardElement) {
      console.error('Chessboard element not found! Make sure you have <div id="chessboard"></div> in your HTML.');
      return; // Exit if element doesn't exist
    }
    
    console.log('Initializing Chess Tutor application...');
    
    // Initialize chessboard
    const config = {
      position: 'start',
      draggable: true,
      onDragStart: onDragStart,
      onDrop: onDrop,
      onSnapEnd: onSnapEnd
    };
    
    // Initialize the chessboard
    try {
      const board = Chessboard('chessboard', config);
      
      // Log successful initialization
      console.log('Chessboard initialized successfully');
      
      // Initialize chess.js
      const game = new Chess();
      
      // Store board and game in window for access from other scripts
      window.chessBoard = board;
      window.chessGame = game;
      
      // Initialize the chess engine
      initializeEngine();
      
      // Initialize board features AFTER board is fully rendered
      setTimeout(() => {
        try {
          window.boardFeatures = new BoardFeatures(board, {
            arrowColor: 'rgba(255, 0, 0, 0.6)',
            arrowWidth: 8,
            highlightColor: 'rgba(255, 255, 0, 0.5)'
          });
          console.log('Board features initialized successfully');
        } catch (error) {
          console.error('Error initializing board features:', error);
        }
        
        // Set up buttons
        setupButtonHandlers(board, game);
        
        // Set up move input methods
        setupMoveInputMethods(board, game);
      }, 500);
      
      // Adjust board size on window resize
      window.addEventListener('resize', () => {
        board.resize();
        
        // Need to redraw features after resize
        if (window.boardFeatures) {
          setTimeout(() => {
            window.boardFeatures.resizeCanvas();
            window.boardFeatures.render();
          }, 100);
        }
      });
    } catch (error) {
      console.error('Error initializing chessboard:', error);
    }
  }
  
  function initializeEngine() {
    try {
      // Create chess engine
      window.chessEngine = new ChessEngine({
        // For CDN
        stockfishPath: 'https://cdn.jsdelivr.net/npm/stockfish@11.0.0/stockfish.js',
        // For local stockfish.js (if you have it)
        // stockfishPath: 'js/stockfish.js',
        skill: 10,
        fallbackToSimple: true
      });
      
      // Register ready handler
      window.chessEngine.onReady = function() {
        console.log('Chess engine ready');
        
        // You can test the engine here if you like
        window.chessEngine.setPosition('startpos');
        
        // Example of getting a move recommendation
        // window.chessEngine.getBestMove(move => {
        //   console.log('Recommended move:', move);
        // }, 1000);
      };
    } catch (error) {
      console.error('Failed to initialize chess engine:', error);
    }
  }
  
  function setupButtonHandlers(board, game) {
    // Start position button
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        board.position('start');
        game.reset();
        if (window.boardFeatures) {
          window.boardFeatures.clearAll();
        }
      });
    }
    
    // Flip board button
    const flipBtn = document.getElementById('flipBoard');
    if (flipBtn) {
      flipBtn.addEventListener('click', () => {
        board.flip();
        if (window.boardFeatures) {
          window.boardFeatures.render();
        }
      });
    }
    
    // Clear arrows button
    const clearArrowsBtn = document.getElementById('clearArrowsBtn');
    if (clearArrowsBtn) {
      clearArrowsBtn.addEventListener('click', () => {
        if (window.boardFeatures) {
          window.boardFeatures.clearArrows();
        }
      });
    }
    
    // Play Opening button
    const playOpeningBtn = document.getElementById('playOpening');
    if (playOpeningBtn) {
      playOpeningBtn.addEventListener('click', () => {
        // For now, just play the first few moves of e4 opening
        playOpeningSequence(board, game, ['e2-e4', 'e7-e5', 'g1-f3']);
      });
    }
    
    // Start Learning button
    const startLearningBtn = document.getElementById('startLearning');
    if (startLearningBtn) {
      startLearningBtn.addEventListener('click', () => {
        alert('This feature is coming soon!');
      });
    }
    
    // Piece style selector
    const pieceStyleSelect = document.getElementById('pieceStyle');
    if (pieceStyleSelect) {
      pieceStyleSelect.addEventListener('change', (e) => {
        const style = e.target.value.toLowerCase();
        board.pieceTheme = `img/chesspieces/${style}/{piece}.png`;
        board.position(game.fen()); // Refresh board with new pieces
      });
    }
  }
  
  function setupMoveInputMethods(board, game) {
    const moveMethodRadios = document.querySelectorAll('input[name="moveMethod"]');
    if (moveMethodRadios.length === 0) return;
    
    // Keep track of click handlers to remove them when changing modes
    let clickHandler = null;
    
    moveMethodRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const moveMethod = e.target.value;
        
        // Clear any existing click handlers
        if (clickHandler) {
          const boardEl = document.querySelector('.board-b72b1');
          if (boardEl) {
            boardEl.removeEventListener('click', clickHandler);
          }
          clickHandler = null;
        }
        
        // Remove algebraic input if it exists
        const existingInput = document.getElementById('algebraicInput');
        if (existingInput && existingInput.parentNode) {
          existingInput.parentNode.removeChild(existingInput.parentNode);
        }
        
        // Enable appropriate move method
        if (moveMethod === 'drag') {
          board.draggable = true;
        } else if (moveMethod === 'click') {
          board.draggable = false;
          setupClickToMove(board, game);
        } else if (moveMethod === 'algebraic') {
          board.draggable = false;
          setupAlgebraicInput(board, game);
        }
      });
    });
    
    function setupClickToMove(board, game) {
      let selectedSquare = null;
      
      clickHandler = function(e) {
        const square = getBoardSquareFromEvent(e, board);
        if (!square) return;
        
        if (!selectedSquare) {
          // First click - select piece
          if (game.get(square)) {
            selectedSquare = square;
            if (window.boardFeatures) {
              window.boardFeatures.highlightSquare(square);
            }
          }
        } else {
          // Second click - attempt move
          const move = game.move({
            from: selectedSquare,
            to: square,
            promotion: 'q' // Auto-promote to queen for simplicity
          });
          
          if (move) {
            // Valid move
            board.position(game.fen());
            if (window.boardFeatures) {
              window.boardFeatures.clearHighlights();
            }
          } else {
            // Invalid move, check if clicked on another piece
            if (game.get(square)) {
              if (window.boardFeatures) {
                window.boardFeatures.clearHighlights();
                window.boardFeatures.highlightSquare(square);
              }
              selectedSquare = square;
            }
          }
          
          if (move || !game.get(square)) {
            selectedSquare = null;
          }
        }
      };
      
      const boardEl = document.querySelector('.board-b72b1');
      if (boardEl) {
        boardEl.addEventListener('click', clickHandler);
      }
    }
    
    function setupAlgebraicInput(board, game) {
      // Create input field if it doesn't exist
      let inputField = document.getElementById('algebraicInput');
      if (!inputField) {
        const inputContainer = document.createElement('div');
        inputContainer.className = 'algebraic-input';
        inputContainer.style.marginTop = '15px';
        
        inputField = document.createElement('input');
        inputField.id = 'algebraicInput';
        inputField.type = 'text';
        inputField.placeholder = 'Enter move (e.g., e4, Nf3)';
        inputField.style.width = '70%';
        inputField.style.padding = '5px';
        
        const inputButton = document.createElement('button');
        inputButton.textContent = 'Move';
        inputButton.style.marginLeft = '10px';
        
        inputContainer.appendChild(inputField);
        inputContainer.appendChild(inputButton);
        
        const boardContainer = document.querySelector('.board-container') || document.getElementById('chessboard').parentNode;
        boardContainer.appendChild(inputContainer);
        
        // Set up event handler
        inputButton.addEventListener('click', () => {
          const moveText = inputField.value.trim();
          if (!moveText) return;
          
          try {
            const move = game.move(moveText);
            if (move) {
              board.position(game.fen());
              inputField.value = '';
            } else {
              alert('Invalid move! Please try again.');
            }
          } catch (error) {
            alert('Invalid move format! Please try again.');
          }
        });
        
        // Also allow Enter key
        inputField.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            const moveText = inputField.value.trim();
            if (!moveText) return;
            
            try {
              const move = game.move(moveText);
              if (move) {
                board.position(game.fen());
                inputField.value = '';
              } else {
                alert('Invalid move! Please try again.');
              }
            } catch (error) {
              alert('Invalid move format! Please try again.');
            }
          }
        });
      }
    }
  }
  
  // Helper function to get board square from mouse event
  function getBoardSquareFromEvent(event, board) {
    const boardElement = document.querySelector('.board-b72b1');
    if (!boardElement) return null;
    
    const rect = boardElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Calculate square size
    const squareSize = rect.width / 8;
    
    // Convert coordinates to square (0-7 for both file and rank)
    let file = Math.floor(x / squareSize);
    let rank = Math.floor(y / squareSize);
    
    // Adjust for board orientation (if black is on bottom)
    if (!board.orientation().startsWith('w')) {
      file = 7 - file;
      rank = 7 - rank;
    }
    
    // Convert to algebraic notation
    const files = 'abcdefgh';
    const ranks = '87654321';
    
    if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;
    
    return files.charAt(file) + ranks.charAt(rank);
  }
  
  // Drag and drop handlers
  function onDragStart(source, piece, position, orientation) {
    // Only allow the player whose turn it is to move pieces
    if (window.chessGame.game_over() || 
        (window.chessGame.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (window.chessGame.turn() === 'b' && piece.search(/^w/) !== -1)) {
      return false;
    }
  }
  
  function onDrop(source, target) {
    // Try to make the move
    const move = window.chessGame.move({
      from: source,
      to: target,
      promotion: 'q' // Auto-promote to queen for simplicity
    });
    
    // If illegal move, snap piece back to source square
    if (move === null) return 'snapback';
  }
  
  function onSnapEnd() {
    // Update board position after piece snap animation
    window.chessBoard.position(window.chessGame.fen());
  }
  
  // Function to play a sequence of moves
  function playOpeningSequence(board, game, moves, delay = 1000) {
    // Reset the board first
    game.reset();
    board.position('start');
    
    if (window.boardFeatures) {
      window.boardFeatures.clearAll();
    }
    
    let moveIndex = 0;
    
    function playNextMove() {
      if (moveIndex >= moves.length) return;
      
      const moveStr = moves[moveIndex];
      let move;
      
      // Try different move formats
      if (moveStr.includes('-')) {
        // Format like "e2-e4"
        const [from, to] = moveStr.split('-');
        move = game.move({
          from: from,
          to: to,
          promotion: 'q'
        });
      } else {
        // Standard algebraic like "e4"
        move = game.move(moveStr);
      }
      
      if (move) {
        // Update the board
        board.position(game.fen());
        
        // Highlight the move
        if (window.boardFeatures) {
          window.boardFeatures.suggestMove(move.from, move.to);
        }
        
        // Play the next move after delay
        moveIndex++;
        if (moveIndex < moves.length) {
          setTimeout(playNextMove, delay);
        }
      } else {
        console.error('Invalid move in sequence:', moveStr);
      }
    }
    
    // Start playing the sequence
    setTimeout(playNextMove, delay);
  }