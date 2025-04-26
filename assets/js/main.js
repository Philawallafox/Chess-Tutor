// Updated board initialization code
// Add this to your main.js or wherever you initialize the board

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize chessboard
    const config = {
      position: 'start',
      draggable: true,
      onDragStart: onDragStart,
      onDrop: onDrop,
      onSnapEnd: onSnapEnd
    };
    
    const board = Chessboard('chessboard', config);
    
    // Initialize chess.js
    const game = new Chess();
    
    // Store board and game in window for access from other scripts
    window.chessBoard = board;
    window.chessGame = game;
    
    // Initialize board features AFTER board is fully rendered
    setTimeout(() => {
      window.boardFeatures = new BoardFeatures(board, {
        arrowColor: 'rgba(255, 0, 0, 0.6)',
        arrowWidth: 8,
        highlightColor: 'rgba(255, 255, 0, 0.5)'
      });
      
      // Set up buttons
      document.getElementById('startBtn').addEventListener('click', () => {
        board.position('start');
        game.reset();
        boardFeatures.clearAll();
      });
      
      document.getElementById('clearArrowsBtn').addEventListener('click', () => {
        boardFeatures.clearArrows();
      });
    }, 500);
    
    // Listen for move input mode changes
    document.querySelectorAll('input[name="moveMethod"]').forEach(input => {
      input.addEventListener('change', (e) => {
        const moveMethod = e.target.value;
        
        if (moveMethod === 'drag') {
          board.draggable = true;
        } else if (moveMethod === 'click') {
          board.draggable = false;
          // Set up click-to-move
          setupClickToMove();
        } else if (moveMethod === 'algebraic') {
          board.draggable = false;
          // Set up algebraic notation input
          setupAlgebraicInput();
        }
      });
    });
    
    // Set up click-to-move handler
    function setupClickToMove() {
      let selectedSquare = null;
      
      document.querySelector('.board-b72b1').addEventListener('click', (e) => {
        const square = getBoardSquareFromEvent(e);
        if (!square) return;
        
        if (!selectedSquare) {
          // First click - select piece
          if (game.get(square)) {
            selectedSquare = square;
            boardFeatures.highlightSquare(square);
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
            boardFeatures.clearHighlights();
          } else {
            // Invalid move, check if clicked on another piece
            if (game.get(square)) {
              boardFeatures.clearHighlights();
              selectedSquare = square;
              boardFeatures.highlightSquare(square);
            }
          }
          
          if (move || !game.get(square)) {
            selectedSquare = null;
          }
        }
      });
    }
    
    // Set up algebraic notation input
    function setupAlgebraicInput() {
      // Create input field if it doesn't exist
      let inputField = document.getElementById('algebraicInput');
      if (!inputField) {
        inputField = document.createElement('input');
        inputField.id = 'algebraicInput';
        inputField.type = 'text';
        inputField.placeholder = 'Enter move (e.g., e4, Nf3)';
        inputField.style.width = '200px';
        inputField.style.marginTop = '10px';
        
        const inputButton = document.createElement('button');
        inputButton.textContent = 'Move';
        inputButton.style.marginLeft = '5px';
        
        const inputContainer = document.createElement('div');
        inputContainer.appendChild(inputField);
        inputContainer.appendChild(inputButton);
        
        document.querySelector('.board-container').appendChild(inputContainer);
        
        // Set up event handler
        inputButton.addEventListener('click', () => {
          const moveText = inputField.value.trim();
          const move = game.move(moveText);
          
          if (move) {
            board.position(game.fen());
            inputField.value = '';
          } else {
            alert('Invalid move! Please try again.');
          }
        });
        
        // Also allow Enter key
        inputField.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            const moveText = inputField.value.trim();
            const move = game.move(moveText);
            
            if (move) {
              board.position(game.fen());
              inputField.value = '';
            } else {
              alert('Invalid move! Please try again.');
            }
          }
        });
      }
    }
    
    // Helper function to get board square from mouse event
    function getBoardSquareFromEvent(event) {
      const boardElement = document.querySelector('.board-b72b1');
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
      
      return files.charAt(file) + ranks.charAt(rank);
    }
    
    // Drag and drop handlers
    function onDragStart(source, piece) {
      // Only allow the player whose turn it is to move pieces
      if (game.game_over() || 
          (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
          (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false;
      }
    }
    
    function onDrop(source, target) {
      // Try to make the move
      const move = game.move({
        from: source,
        to: target,
        promotion: 'q' // Auto-promote to queen for simplicity
      });
      
      // If illegal move, snap piece back to source square
      if (move === null) return 'snapback';
    }
    
    function onSnapEnd() {
      // Update board position after piece snap animation
      board.position(game.fen());
    }
    
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
  });