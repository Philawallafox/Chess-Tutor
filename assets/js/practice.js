/**
 * Chess Tutor - Practice Module
 * 
 * This file manages the practice interface, allowing users to play against
 * the computer with adjustable strength and opening selection.
 */

// Global variables
let practiceBoard = null;
let practiceGame = null;
let userColor = 'w'; // Default: user plays white
let gameActive = false;
let computerThinking = false;
let userElo = 1500; // Default ELO rating for computer
let selectedOpening = ''; // ID of the selected opening to practice
let moveHistory = [];
let gameAnalyzer = null;

// Initialize the practice module
document.addEventListener('DOMContentLoaded', function() {
  // Initialize the chess game
  practiceGame = new Chess();
  
  // Initialize the board
  practiceBoard = Chessboard('practice-board', {
    position: 'start',
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
    draggable: true,
    onDragStart: onDragStart,
    onDrop: onDrop
  });
  
  // Load the opening database for the opening selector
  loadOpenings();
  
  // Set up event handlers
  document.getElementById('start-game').addEventListener('click', startNewGame);
  document.getElementById('resign-game').addEventListener('click', resignGame);
  document.getElementById('flip-board').addEventListener('click', flipBoard);
  document.getElementById('analyze-game').addEventListener('click', analyzeGame);
  
  // Set up color selection
  document.querySelectorAll('input[name="play-color"]').forEach(radio => {
    radio.addEventListener('change', function() {
      userColor = this.value;
    });
  });
  
  // Set up strength selection
  document.getElementById('opponent-strength').addEventListener('change', function() {
    userElo = parseInt(this.value);
    
    // Update the engine strength if it's already initialized
    if (window.playEngine) {
      window.playEngine.setStrengthByElo(userElo);
    }
  });
  
  // Set up opening selection
  document.getElementById('practice-opening').addEventListener('change', function() {
    selectedOpening = this.value;
  });
  
  // Set up the analysis modal
  const modal = document.getElementById('analysis-modal');
  const closeButton = document.querySelector('.close-button');
  
  if (closeButton) {
    closeButton.addEventListener('click', function() {
      modal.style.display = 'none';
    });
  }
  
  // Close the modal when clicking outside of it
  window.addEventListener('click', function(event) {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
  
  // Initialize the game analyzer
  gameAnalyzer = new GameAnalyzer();
  
  // Initialize the play engine if not already done
  if (!window.playEngine && typeof ChessEngine === 'function') {
    window.playEngine = new ChessEngine('opponent');
    window.playEngine.initialize(() => {
      console.log('Play engine ready');
      document.getElementById('start-game').disabled = false;
      window.playEngine.setStrengthByElo(userElo);
    });
  } else if (window.playEngine) {
    document.getElementById('start-game').disabled = false;
  }
  
  // Set initial status
  updateStatus('Ready to play. Click "Start New Game" to begin.');
});

/**
 * Load openings for the selector
 */
async function loadOpenings() {
  try {
    // Use the database.js functionality to get openings
    const openings = await getOpeningsList();
    
    if (!openings || openings.length === 0) {
      console.error('No openings found in database');
      return;
    }
    
    // Populate the opening selector
    const openingSelect = document.getElementById('practice-opening');
    
    openings.forEach(opening => {
      const option = document.createElement('option');
      option.value = opening.id;
      option.textContent = opening.name;
      openingSelect.appendChild(option);
    });
    
  } catch (error) {
    console.error('Error loading openings:', error);
  }
}

/**
 * Start a new game
 */
function startNewGame() {
  // Reset the game
  practiceGame.reset();
  practiceBoard.start();
  moveHistory = [];
  gameActive = true;
  
  // Update status
  updateStatus('Game started. ' + (userColor === 'w' ? 'You play White.' : 'You play Black.'));
  
  // Clear move history display
  document.getElementById('move-history').innerHTML = '';
  
  // Disable analyze button until game is over
  document.getElementById('analyze-game').disabled = true;
  
  // Make computer move if player is black
  if (userColor === 'b') {
    makeComputerMove();
  } else {
    // Update evaluation if available
    analyzePosition();
  }
}

/**
 * Handle piece drag start
 */
function onDragStart(source, piece, position, orientation) {
  // Don't allow moving if game is not active
  if (!gameActive) return false;
  
  // Don't allow moving if computer is thinking
  if (computerThinking) return false;
  
  // Don't allow moving pieces if the game is over
  if (practiceGame.game_over()) return false;
  
  // Only allow moving pieces of the current turn matching user's color
  if (
    (practiceGame.turn() !== userColor) || // Not user's turn
    (userColor === 'w' && piece.search(/^b/) !== -1) || // White user, black piece
    (userColor === 'b' && piece.search(/^w/) !== -1) // Black user, white piece
  ) {
    return false;
  }
  
  return true;
}

/**
 * Handle piece drop
 */
function onDrop(source, target) {
  // Check if the move is legal
  const move = practiceGame.move({
    from: source,
    to: target,
    promotion: 'q' // Always promote to queen for simplicity
  });
  
  // If illegal move, snap back
  if (move === null) return 'snapback';
  
  // Add the move to history
  moveHistory.push(move);
  
  // Update the board
  practiceBoard.position(practiceGame.fen());
  
  // Update move history display
  updateMoveHistory(move);
  
  // Check if the game is over
  if (checkGameEnd()) {
    return;
  }
  
  // Make the computer's move
  setTimeout(makeComputerMove, 500);
}

/**
 * Make a move for the computer
 */
function makeComputerMove() {
  if (!gameActive || practiceGame.game_over()) {
    return;
  }
  
  // Set the thinking flag
  computerThinking = true;
  
  // Update status
  updateStatus('Computer is thinking...');
  
  // Check if we should use an opening book move
  let useBookMove = false;
  let bookMove = null;
  
  // If specific opening is selected, try to force that line
  if (selectedOpening && typeof getForcedOpeningMove === 'function') {
    bookMove = getForcedOpeningMove(selectedOpening, practiceGame.fen());
    
    if (bookMove) {
      useBookMove = true;
    }
  }
  
  // If no forced opening or not found, try general opening book
  if (!useBookMove && typeof getBookMove === 'function') {
    bookMove = getBookMove(practiceGame.fen());
    
    if (bookMove) {
      useBookMove = true;
    }
  }
  
  // If we have a book move, use it
  if (useBookMove && bookMove) {
    makeMove(bookMove);
    return;
  }
  
  // If no book move, use the engine
  if (!window.playEngine) {
    console.error('Play engine not available');
    computerThinking = false;
    return;
  }
  
  const engine = window.playEngine;
  
  // Set position and ELO strength
  engine.setPosition(practiceGame.fen());
  
  // Set up callback for when the engine finds a move
  engine.onMove = function(moveStr) {
    makeMove(moveStr);
  };
  
  // Start the engine search
  engine.findBestMove(1000);
}

/**
 * Make a move on the board
 */
function makeMove(moveStr) {
  // Convert UCI move format to chess.js format
  const from = moveStr.substring(0, 2);
  const to = moveStr.substring(2, 4);
  const promotion = moveStr.length > 4 ? moveStr[4] : undefined;
  
  // Make the move
  const move = practiceGame.move({
    from: from,
    to: to,
    promotion: promotion || 'q'
  });
  
  if (!move) {
    console.error('Invalid move from engine:', moveStr);
    computerThinking = false;
    return;
  }
  
  // Add the move to history
  moveHistory.push(move);
  
  // Update the board
  practiceBoard.position(practiceGame.fen());
  
  // Update move history display
  updateMoveHistory(move);
  
  // Reset the thinking flag
  computerThinking = false;
  
  // Update status
  updateStatus('Your turn.');
  
  // Check if the game is over
  checkGameEnd();
  
  // Update evaluation if available
  analyzePosition();
}

/**
 * Check if the game has ended
 */
function checkGameEnd() {
  if (practiceGame.game_over()) {
    gameActive = false;
    
    let status = '';
    
    if (practiceGame.in_checkmate()) {
      status = 'Checkmate! ' + (practiceGame.turn() === 'w' ? 'Black' : 'White') + ' wins.';
    } else if (practiceGame.in_draw()) {
      status = 'Game drawn! ';
      
      if (practiceGame.in_stalemate()) {
        status += 'Stalemate.';
      } else if (practiceGame.in_threefold_repetition()) {
        status += 'Threefold repetition.';
      } else if (practiceGame.insufficient_material()) {
        status += 'Insufficient material.';
      } else {
        status += '50-move rule.';
      }
    }
    
    updateStatus(status);
    
    // Enable the analyze button
    document.getElementById('analyze-game').disabled = false;
    
    return true;
  }
  
  return false;
}

/**
 * Update the game status display
 */
function updateStatus(message) {
  document.getElementById('status-text').textContent = message;
}

/**
 * Update the move history display
 */
function updateMoveHistory(move) {
  const historyElement = document.getElementById('move-history');
  
  // Add the move number if this is white's move
  if (move.color === 'w') {
    const moveNumber = Math.floor((practiceGame.history().length + 1) / 2);
    historyElement.innerHTML += `<div>${moveNumber}. ${move.san}</div>`;
  } else {
    // Continue the line for black's move
    const lastDiv = historyElement.lastElementChild;
    if (lastDiv) {
      lastDiv.innerHTML += ` ${move.san}`;
    } else {
      // This shouldn't happen normally, but just in case
      const moveNumber = Math.floor((practiceGame.history().length + 1) / 2);
      historyElement.innerHTML += `<div>${moveNumber}... ${move.san}</div>`;
    }
  }
  
  // Scroll to the bottom
  historyElement.scrollTop = historyElement.scrollHeight;
}

/**
 * Resign the current game
 */
function resignGame() {
  if (!gameActive) return;
  
  gameActive = false;
  updateStatus(`You resigned. ${userColor === 'w' ? 'Black' : 'White'} wins.`);
  
  // Enable the analyze button
  document.getElementById('analyze-game').disabled = false;
}

/**
 * Flip the board orientation
 */
function flipBoard() {
  practiceBoard.flip();
}

/**
 * Analyze the current position
 */
function analyzePosition() {
  if (!window.analyzeEngine) return;
  
  const engine = window.analyzeEngine;
  
  // Set position
  engine.setPosition(practiceGame.fen());
  
  // Set up analysis callback
  engine.onAnalysis = (info) => {
    if (info.depth >= 12) {
      // Update evaluation bar
      updateEvaluationBar(info.score);
      
      // Update best move if available
      if (info.pv && info.pv.length > 0) {
        const bestMove = info.pv[0];
        
        // Convert UCI move to SAN
        const from = bestMove.substring(0, 2);
        const to = bestMove.substring(2, 4);
        const promotion = bestMove.length > 4 ? bestMove[4] : undefined;
        
        const tempGame = new Chess(practiceGame.fen());
        const moveObj = tempGame.move({
          from: from,
          to: to,
          promotion: promotion
        });
        
        if (moveObj) {
          document.getElementById('best-move').textContent = moveObj.san;
          document.getElementById('explain-move').disabled = false;
        }
      }
    }
  };
  
  // Start analysis
  engine.analyzePosition(15, 1);
  
  // Stop after 2 seconds
  setTimeout(() => {
    engine.stopCalculation();
  }, 2000);
}

/**
 * Update the evaluation bar based on engine score
 */
function updateEvaluationBar(evaluation) {
  const evalBar = document.querySelector('.eval-bar-inner');
  const evalScore = document.querySelector('.eval-score');
  
  // Evaluation is in centipawns, where positive is good for white
  // Convert to a percentage for the bar (capped at ±5 pawns)
  const maxEval = 500; // 5 pawns
  const evalPercent = Math.min(Math.abs(evaluation) / maxEval, 1) * 50;
  
  // Update bar height and position
  if (evaluation >= 0) {
    // White is ahead
    evalBar.style.height = evalPercent + '%';
    evalBar.style.bottom = '50%';
    evalBar.style.backgroundColor = '#4a6ea9'; // Blue for white
  } else {
    // Black is ahead
    evalBar.style.height = evalPercent + '%';
    evalBar.style.bottom = (50 - evalPercent) + '%';
    evalBar.style.backgroundColor = '#333'; // Dark for black
  }
  
  // Format the score
  let displayScore;
  if (evaluation > 1000) {
    // It's a mate in X for white
    const mateIn = Math.ceil((20000 - evaluation) / 10);
    displayScore = "M" + mateIn;
  } else if (evaluation < -1000) {
    // It's a mate in X for black
    const mateIn = Math.ceil((20000 + evaluation) / 10);
    displayScore = "-M" + mateIn;
  } else {
    // Normal evaluation in pawns
    displayScore = (evaluation / 100).toFixed(1);
  }
  
  evalScore.textContent = displayScore;
  
  // Update position evaluation text
  const posEval = document.getElementById('position-evaluation');
  if (posEval) {
    if (Math.abs(evaluation) > 1000) {
      const side = evaluation > 0 ? "White" : "Black";
      const mateIn = Math.ceil((20000 - Math.abs(evaluation)) / 10);
      posEval.textContent = `${side} has mate in ${mateIn} moves.`;
    } else if (Math.abs(evaluation) > 300) {
      const side = evaluation > 0 ? "White" : "Black";
      posEval.textContent = `${side} has a decisive advantage.`;
    } else if (Math.abs(evaluation) > 100) {
      const side = evaluation > 0 ? "White" : "Black";
      posEval.textContent = `${side} has a clear advantage.`;
    } else if (Math.abs(evaluation) > 50) {
      const side = evaluation > 0 ? "White" : "Black";
      posEval.textContent = `${side} has a slight advantage.`;
    } else {
      posEval.textContent = "The position is approximately equal.";
    }
  }
}

/**
 * Explain the best move
 */
function explainCurrentMove() {
  if (!window.explainMove || !window.analyzeEngine) return;
  
  const engine = window.analyzeEngine;
  const explanationPanel = document.getElementById('move-explanation');
  
  // Get the best move
  const bestMoveElement = document.getElementById('best-move');
  const bestMoveSan = bestMoveElement.textContent;
  
  if (bestMoveSan === '-') {
    explanationPanel.textContent = 'No best move available to explain.';
    return;
  }
  
  // Display loading message
  explanationPanel.textContent = 'Analyzing position...';
  
  // Set up the position for analysis
  engine.setPosition(practiceGame.fen());
  
  // Set up analysis callback
  engine.onAnalysis = (info) => {
    if (info.depth >= 16) { // Wait for good depth
      if (!info.pv || info.pv.length === 0) {
        explanationPanel.textContent = 'Could not generate explanation.';
        return;
      }
      
      // Convert UCI best move to an object
      const bestMoveUci = info.pv[0];
      const from = bestMoveUci.substring(0, 2);
      const to = bestMoveUci.substring(2, 4);
      const promotion = bestMoveUci.length > 4 ? bestMoveUci[4] : undefined;
      
      const moveObj = {
        from: from,
        to: to,
        promotion: promotion
      };
      
      // Get explanation for the move
      const explanation = window.explainMove(practiceGame, moveObj, info);
      explanationPanel.textContent = explanation;
      
      // Stop the analysis
      engine.stopCalculation();
    }
  };
  
  // Start analysis
  engine.analyzePosition(18, 3); // Analyze with multiple variations
  
  // Stop after a reasonable time if no result
  setTimeout(() => {
    if (explanationPanel.textContent === 'Analyzing position...') {
      const basicExplanation = getBasicExplanation(bestMoveSan);
      explanationPanel.textContent = basicExplanation;
      engine.stopCalculation();
    }
  }, 5000);
}

/**
 * Generate a basic explanation when full analysis fails
 */
function getBasicExplanation(moveSan) {
  if (moveSan.includes('x')) {
    return `Capturing with ${moveSan} gains material and improves your position.`;
  }
  
  if (moveSan.includes('+')) {
    return `${moveSan} checks the opponent's king, forcing them to respond and restricting their options.`;
  }
  
  if (moveSan === 'O-O' || moveSan === 'O-O-O') {
    return `Castling improves king safety and connects your rooks for better coordination.`;
  }
  
  if (moveSan.length === 2) { // Pawn move like e4
    return `The pawn move ${moveSan} helps control the center and opens lines for your pieces.`;
  }
  
  if (moveSan[0] === 'N') {
    return `The knight move ${moveSan} improves piece activity and may create tactical threats.`;
  }
  
  if (moveSan[0] === 'B') {
    return `The bishop move ${moveSan} increases your control of important diagonals.`;
  }
  
  if (moveSan[0] === 'R') {
    return `The rook move ${moveSan} increases control of the file and prepares for future tactics.`;
  }
  
  if (moveSan[0] === 'Q') {
    return `The queen move ${moveSan} maximizes the power of your strongest piece.`;
  }
  
  if (moveSan[0] === 'K') {
    return `The king move ${moveSan} improves your king's position and safety.`;
  }
  
  return `${moveSan} is the best move in this position according to the engine analysis.`;
}

/**
 * Analyze the completed game
 */
function analyzeGame() {
  if (!gameAnalyzer) return;
  
  // Show the modal
  const modal = document.getElementById('analysis-modal');
  modal.style.display = 'block';
  
  // Reset analysis board
  const analysisBoard = Chessboard('analysis-board', {
    position: 'start',
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
    draggable: false
  });
  
  // Create a copy of the current game
  const gameToAnalyze = new Chess();
  
  // Replay all moves to get the history
  practiceGame.history({ verbose: true }).forEach(move => {
    gameToAnalyze.move(move);
  });
  
  // Display loading message
  document.getElementById('analysis-text').textContent = 'Analyzing game...';
  document.getElementById('analysis-summary').textContent = 'Please wait while we analyze your game.';
  
  // Load the game into the analyzer
  gameAnalyzer.loadGame(gameToAnalyze);
  
  // Start analysis with progress updates
  let currentProgress = 0;
  
  gameAnalyzer.analyzeGame(progress => {
    currentProgress = progress.current;
    const total = progress.total;
    
    document.getElementById('analysis-text').textContent = 
      `Analyzing move ${progress.current} of ${total}...`;
  }).then(() => {
    // Analysis complete
    displayAnalysisResults();
  }).catch(error => {
    console.error('Error analyzing game:', error);
    document.getElementById('analysis-text').textContent = 
      'An error occurred during analysis. Please try again.';
  });
  
  // Set up analysis navigation controls
  document.getElementById('analysis-prev').addEventListener('click', () => {
    navigateAnalysis('prev');
  });
  
  document.getElementById('analysis-next').addEventListener('click', () => {
    navigateAnalysis('next');
  });
}

/**
 * Display the analysis results
 */
function displayAnalysisResults() {
  // Get summary text
  const summaryText = gameAnalyzer.getFormattedSummary();
  document.getElementById('analysis-summary').innerHTML = summaryText;
  
  // Display first position
  const firstPosition = gameAnalyzer.getPosition(0);
  
  if (firstPosition) {
    // Update the board
    Chessboard('analysis-board', {
      position: firstPosition.position.fen,
      pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
      draggable: false
    });
    
    // Update the position text
    const explanation = gameAnalyzer.getPositionExplanation(0);
    document.getElementById('analysis-text').textContent = explanation;
  }
}

/**
 * Navigate through the analysis
 */
function navigateAnalysis(direction) {
  let newPosition;
  
  if (direction === 'prev') {
    newPosition = gameAnalyzer.previousPosition();
  } else if (direction === 'next') {
    newPosition = gameAnalyzer.nextPosition();
  } else if (direction === 'key') {
    newPosition = gameAnalyzer.nextKeyMoment();
  }
  
  if (newPosition) {
    // Update the board
    Chessboard('analysis-board', {
      position: newPosition.position.fen,
      pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
      draggable: false
    });
    
    // Update the text
    const index = gameAnalyzer.currentIndex;
    const explanation = gameAnalyzer.getPositionExplanation(index);
    document.getElementById('analysis-text').textContent = explanation;
  }
}