/**
 * Chess Tutor - Main JavaScript
 * 
 * This file manages the interactive chessboard and user interface elements.
 * It integrates with the database.js module to load opening data.
 */

// Global variables to maintain state
let board = null;
let game = null;
let currentTheme = 'wikipedia';
let boardInitialized = false;

// Initialize the board with the current theme
function initializeBoard() {
    // Create a new chess game instance
    game = new Chess();
    
    // Check for legal moves (for making the board interactive)
    function onDragStart(source, piece, position, orientation) {
        // Don't allow moving pieces if the game is over
        if (game.game_over()) return false;
        
        // Only allow moving pieces of the current turn
        if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
            (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
            return false;
        }
        
        return true;
    }
    
    // Update the board after a move
    function onDrop(source, target) {
        // Check if the move is legal
        const move = game.move({
            from: source,
            to: target,
            promotion: 'q' // Always promote to queen for simplicity
        });
        
        // If illegal move, snap back
        if (move === null) return 'snapback';
        
        // Update the board with the new position
        board.position(game.fen());
    }
    
    // Create the board with the current theme
    board = Chessboard('demo-board', {
        position: 'start',
        pieceTheme: 'https://chessboardjs.com/img/chesspieces/' + currentTheme + '/{piece}.png',
        draggable: true,
        onDragStart: onDragStart,
        onDrop: onDrop
    });
    
    // Set global flag to indicate board is initialized
    window.board = board;
    window.game = game;
    window.currentTheme = currentTheme;
    window.boardInitialized = true;
    
    // Initialize advanced board features if the function exists
    if (typeof initBoardFeatures === 'function') {
        initBoardFeatures(board, game);
    }
    
    // If we're on the homepage with the demo board, animate some moves
    if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
        // Add event listeners to control buttons if they exist
        setupBoardControls();
    }
}

// Set up the board control buttons
function setupBoardControls() {
    const startPositionBtn = document.getElementById('start-position');
    const flipBoardBtn = document.getElementById('flip-board');
    const playOpeningBtn = document.getElementById('play-opening');
    
    if (startPositionBtn) {
        startPositionBtn.addEventListener('click', function() {
            game.reset();
            board.start();
        });
    }
    
    if (flipBoardBtn) {
        flipBoardBtn.addEventListener('click', function() {
            board.flip();
        });
    }
    
    if (playOpeningBtn) {
        playOpeningBtn.addEventListener('click', function() {
            demonstrateSpecificOpening('ruy_lopez');
        });
    }
}

// Demonstrate a specific opening
function demonstrateSpecificOpening(openingId) {
    // Reset board to starting position
    game.reset();
    board.start();
    
    // Get the opening main line moves
    if (typeof getOpeningMainLine === 'function') {
        getOpeningMainLine(openingId).then(mainLine => {
            if (!mainLine || mainLine.length === 0) {
                console.error('No main line found for opening:', openingId);
                return;
            }
            
            // Extract just the moves
            const moves = mainLine.map(moveInfo => moveInfo.move);
            let moveIndex = 0;
            
            // Function to make the next move in the sequence
            function makeNextMove() {
                if (moveIndex < moves.length) {
                    // Make the move
                    game.move(moves[moveIndex]);
                    
                    // Update the board
                    board.position(game.fen());
                    
                    // Increment move index
                    moveIndex++;
                    
                    // Schedule the next move
                    setTimeout(makeNextMove, 1000);
                }
            }
            
            // Start the sequence after a short delay
            setTimeout(makeNextMove, 500);
        }).catch(error => {
            console.error('Error loading opening main line:', error);
        });
    } else {
        console.error('getOpeningMainLine function not available');
    }
}

// Change the theme of the chessboard
function changeTheme(themeName) {
    // Update the current theme
    currentTheme = themeName;
    window.currentTheme = themeName;
    
    // Store the current position
    const currentPosition = board.position();
    
    // Destroy the old board
    board.destroy();
    
    // Create a new board with the new theme and same position
    board = Chessboard('demo-board', {
        position: currentPosition,
        pieceTheme: 'https://chessboardjs.com/img/chesspieces/' + currentTheme + '/{piece}.png',
        draggable: true,
        onDragStart: function(source, piece) {
            // Don't allow moving pieces if the game is over
            if (game.game_over()) return false;
            
            // Only allow moving pieces of the current turn
            if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
                (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
                return false;
            }
            
            return true;
        },
        onDrop: function(source, target) {
            // Check if the move is legal
            const move = game.move({
                from: source,
                to: target,
                promotion: 'q' // Always promote to queen for simplicity
            });
            
            // If illegal move, snap back
            if (move === null) return 'snapback';
            
            // Update the board with the new position
            board.position(game.fen());
        }
    });
    
    // Update the global board reference
    window.board = board;
    
    // Reinitialize board features if available
    if (typeof initBoardFeatures === 'function') {
        initBoardFeatures(board, game);
    }
    
    // Save preference to localStorage for next visit
    localStorage.setItem('chessTheme', themeName);
}

// Display openings in the UI
function showOpenings(openings) {
    const openingsListElement = document.getElementById('openings-list');
    if (!openingsListElement) return;
    
    if (!openings || openings.length === 0) {
        openingsListElement.innerHTML = '<div class="error">No openings found.</div>';
        return;
    }
    
    // Clear loading message
    openingsListElement.innerHTML = '';
    
    // Create a card for each opening
    openings.forEach(opening => {
        const card = document.createElement('div');
        card.className = 'opening-card';
        card.innerHTML = `
            <h3>${opening.name}</h3>
            <span class="difficulty ${opening.difficulty}">${opening.difficulty}</span>
            <p>Popularity: ${opening.popularity}</p>
            <button class="btn-small" data-opening="${opening.id}">Explore</button>
        `;
        
        // Add to the grid
        openingsListElement.appendChild(card);
        
        // Add click handler to the button
        const exploreButton = card.querySelector(`button[data-opening="${opening.id}"]`);
        exploreButton.addEventListener('click', () => {
            // Demonstrate the opening on the board
            demonstrateSpecificOpening(opening.id);
        });
    });
}

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on a page with a chessboard
    const boardElement = document.getElementById('demo-board');
    if (!boardElement) return;
    
    // Check if user has a saved theme preference
    const savedTheme = localStorage.getItem('chessTheme');
    if (savedTheme) {
        currentTheme = savedTheme;
        
        // Update the theme selector dropdown if it exists
        const themeSelector = document.getElementById('piece-theme');
        if (themeSelector) {
            // Only set the value if this option exists in the dropdown
            if ([...themeSelector.options].some(opt => opt.value === savedTheme)) {
                themeSelector.value = savedTheme;
            }
        }
    }
    
    // Initialize the board with the selected theme
    initializeBoard();
    
    // Add event listener to the theme selector if it exists
    const themeSelector = document.getElementById('piece-theme');
    if (themeSelector) {
        themeSelector.addEventListener('change', function(e) {
            changeTheme(e.target.value);
        });
    }
    
    // Load and display the openings
    const openingsListElement = document.getElementById('openings-list');
    if (openingsListElement) {
        // Load openings database and display them
        loadOpeningsDatabase().then(openings => {
            showOpenings(openings);
        }).catch(error => {
            console.error('Error loading openings:', error);
            openingsListElement.innerHTML = '<div class="error">Could not load openings. Please try again later.</div>';
        });
    }
});