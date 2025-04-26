/**
 * Chess Tutor - Learning Module
 * 
 * This file manages the learning interface, allowing users to study openings
 * with detailed explanations and engine analysis.
 */

// Global variables
let learnBoard = null;
let learnGame = null;
let currentOpening = null;
let currentMoveIndex = 0;
let openingData = null;
let moveHistory = [];

// Initialize the learning module
document.addEventListener('DOMContentLoaded', function() {
  // Initialize the chess game
  learnGame = new Chess();
  
  // Initialize the board
  learnBoard = Chessboard('learn-board', {
    position: 'start',
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
    draggable: false
  });
  
  // Load the opening database
  loadOpenings();
  
  // Set up event handlers
  document.getElementById('opening-select').addEventListener('change', openingSelected);
  document.getElementById('prev-move').addEventListener('click', previousMove);
  document.getElementById('next-move').addEventListener('click', nextMove);
  document.getElementById('explain-move').addEventListener('click', explainCurrentMove);
  
  // Initialize the engine if available
  if (!window.analyzeEngine && typeof ChessEngine === 'function') {
    window.analyzeEngine = new ChessEngine('analyzer');
    window.analyzeEngine.initialize(() => {
      console.log('Analysis engine ready for learning module');
      document.getElementById('explain-move').disabled = false;
    });
  } else if (window.analyzeEngine) {
    document.getElementById('explain-move').disabled = false;
  }
});

/**
 * Load openings from the database
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
    const openingSelect = document.getElementById('opening-select');
    openingSelect.innerHTML = '<option value="">-- Choose an opening --</option>';
    
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
 * Handler for when an opening is selected
 */
async function openingSelected(event) {
  const openingId = event.target.value;
  
  if (!openingId) {
    resetLearningBoard();
    return;
  }
  
  try {
    // Get the opening details
    currentOpening = await getOpeningDetails(openingId);
    
    if (!currentOpening) {
      console.error('Opening not found:', openingId);
      return;
    }
    
    // Update the opening information display
    document.getElementById('opening-name').textContent = currentOpening.name;
    
    let description = '';
    if (currentOpening.aliases && currentOpening.aliases.length > 0) {
      description += `Also known as: ${currentOpening.aliases.join(', ')}<br>`;
    }
    
    description += `<strong>Difficulty:</strong> ${currentOpening.difficulty}<br>`;
    description += `<strong>Popularity:</strong> ${currentOpening.popularity}<br><br>`;
    
    if (currentOpening.historical_context) {
      description += currentOpening.historical_context;
    }
    
    document.getElementById('opening-description').innerHTML = description;
    
    // Reset the board and game
    learnGame.reset();
    moveHistory = [];
    currentMoveIndex = 0;
    
    // Set up the learning sequence
    if (currentOpening.main_line && currentOpening.main_line.length > 0) {
      openingData = currentOpening.main_line;
      updateMoveDisplay();
      updateBoardControls();
    } else {
      console.error('No main line found for this opening');
    }
    
  } catch (error) {
    console.error('Error loading opening details:', error);
  }
}

/**
 * Move to the next move in the sequence
 */
function nextMove() {
  if (!openingData || currentMoveIndex >= openingData.length) {
    return;
  }
  
  // Get the move data
  const moveData = openingData[currentMoveIndex];
  
  // Make the move
  let move;
  if (moveData.move) {
    // UCI format (e.g., "e2e4")
    const from = moveData.move.substring(0, 2);
    const to = moveData.move.substring(2, 4);
    const promotion = moveData.move.length > 4 ? moveData.move[4] : undefined;
    
    move = learnGame.move({
      from: from,
      to: to,
      promotion: promotion
    });
  } else if (moveData.notation) {
    // SAN format (e.g., "e4")
    move = learnGame.move(moveData.notation);
  }
  
  if (!move) {
    console.error('Invalid move:', moveData);
    return;
  }
  
  // Update the board
  learnBoard.position(learnGame.fen());
  
  // Store the move
  moveHistory.push(move);
  
  // Increment move index
  currentMoveIndex++;
  
  // Update the move display
  updateMoveDisplay();
  
  // Update board controls
  updateBoardControls();
  
  // If we have an explanation, display it
  if (moveData.explanation) {
    document.getElementById('move-text').textContent = moveData.explanation;
  } else {
    document.getElementById('move-text').textContent = `${moveData.notation || move.san}: ${moveData.comment || ''}`;
  }
  
  // Analyze the position if engine is available
  analyzeCurrentPosition();
}

/**
 * Move to the previous move in the sequence
 */
function previousMove() {
  if (moveHistory.length === 0) {
    return;
  }
  
  // Undo the last move
  learnGame.undo();
  
  // Update the board
  learnBoard.position(learnGame.fen());
  
  // Remove the move from history
  moveHistory.pop();
  
  // Decrement move index
  currentMoveIndex--;
  
  // Update the move display
  updateMoveDisplay();
  
  // Update board controls
  updateBoardControls();
  
  // Update the move text
  if (currentMoveIndex === 0) {
    document.getElementById('move-text').textContent = 'Starting position';
  } else {
    const moveData = openingData[currentMoveIndex - 1];
    if (moveData.explanation) {
      document.getElementById('move-text').textContent = moveData.explanation;
    } else {
      document.getElementById('move-text').textContent = `${moveData.notation}: ${moveData.comment || ''}`;
    }
  }
  
  // Analyze the position if engine is available
  analyzeCurrentPosition();
}

/**
 * Reset the learning board to the starting position
 */
function resetLearningBoard() {
  learnGame.reset();
  learnBoard.start();
  moveHistory = [];
  currentMoveIndex = 0;
  openingData = null;
  currentOpening = null;
  
  // Update the displays
  document.getElementById('opening-name').textContent = 'Opening Information';
  document.getElementById('opening-description').innerHTML = 'Select an opening to begin learning.';
  document.getElementById('move-text').textContent = 'Select an opening to see move explanations.';
  document.getElementById('best-move').textContent = '-';
  document.getElementById('move-explanation').textContent = '';
  
  // Update controls
  updateMoveDisplay();
  updateBoardControls();
}

/**
 * Update the move display counter
 */
function updateMoveDisplay() {
  const totalMoves = openingData ? openingData.length : 0;
  document.getElementById('current-move').textContent = `${currentMoveIndex}/${totalMoves}`;
}

/**
 * Update the board controls (enable/disable buttons)
 */
function updateBoardControls() {
  document.getElementById('prev-move').disabled = (currentMoveIndex === 0);
  document.getElementById('next-move').disabled = !openingData || (currentMoveIndex >= openingData.length);
}

/**
 * Analyze the current position with the chess engine
 */
function analyzeCurrentPosition() {
  if (!window.analyzeEngine) {
    return;
  }
  
  const engine = window.analyzeEngine;
  
  // Set up the position
  engine.setPosition(learnGame.fen());
  
  // Track the best move
  let bestMove = null;
  let evaluation = 0;
  
  // Set up analysis callback
  engine.onAnalysis = (info) => {
    if (info.depth >= 12) { // Wait for reasonable depth
      evaluation = info.score;
      
      if (info.pv && info.pv.length > 0) {
        bestMove = info.pv[0];
        
        // Convert UCI move to SAN
        const from = bestMove.substring(0, 2);
        const to = bestMove.substring(2, 4);
        const promotion = bestMove.length > 4 ? bestMove[4] : undefined;
        
        const tempGame = new Chess(learnGame.fen());
        const moveObj = tempGame.move({
          from: from,
          to: to,
          promotion: promotion
        });
        
        if (moveObj) {
          document.getElementById('best-move').textContent = moveObj.san;
        } else {
          document.getElementById('best-move').textContent = bestMove;
        }
        
        // Update evaluation bar
        updateEvaluationBar(evaluation);
      }
    }
  };
  
  // Start analysis
  engine.analyzePosition(18, 1);
  
  // Stop after a few seconds
  setTimeout(() => {
    engine.stopCalculation();
  }, 3000);
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
}

/**
 * Explain the current move using the engine and move explainer
 */
function explainCurrentMove() {
  if (!window.explainMove || !window.analyzeEngine || moveHistory.length === 0) {
    return;
  }
  
  const engine = window.analyzeEngine;
  const explanationPanel = document.getElementById('move-explanation');
  
  // Get the last move
  const lastMove = moveHistory[moveHistory.length - 1];
  
  // Create a game with the position before the move
  const prevGame = new Chess();
  
  // Replay the game up to the previous position
  for (let i = 0; i < moveHistory.length - 1; i++) {
    prevGame.move(moveHistory[i]);
  }
  
  // Set up the position for analysis
  engine.setPosition(prevGame.fen());
  
  // Display loading message
  explanationPanel.textContent = 'Analyzing move...';
  
  // Set up analysis callback
  engine.onAnalysis = (info) => {
    if (info.depth >= 16) { // Wait for good depth
      // Get explanation for the move
      const moveObj = {
        from: lastMove.from,
        to: lastMove.to,
        promotion: lastMove.promotion
      };
      
      const explanation = window.explainMove(prevGame, moveObj, info);
      explanationPanel.textContent = explanation;
      
      // Stop the analysis
      engine.stopCalculation();
    }
  };
  
  // Start analysis
  engine.analyzePosition(18, 3); // Analyze with multiple variations
  
  // Stop after a reasonable time if no result
  setTimeout(() => {
    if (explanationPanel.textContent === 'Analyzing move...') {
      explanationPanel.textContent = 'This move develops the piece and helps control the center, following classical opening principles.';
      engine.stopCalculation();
    }
  }, 5000);
}