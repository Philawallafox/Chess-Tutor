/**
 * Chess Tutor - Main JavaScript
 * 
 * This file manages the interactive chessboard and user interface elements.
 * It integrates with the database.js module to load opening data.
 */

// Import database functions (if your server supports ES modules)
// If not, these functions will need to be included directly or via a bundler
// import { getOpeningsList, getOpeningDetails, getOpeningMainLine } from './database.js';

// Global variables to maintain state
let board = null;
let game = null;
let currentTheme = 'wikipedia';

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
        playOpeningBtn.addEventListener('click', demonstrateOpening);
    }
}

// Demonstrate a simple opening sequence
function demonstrateOpening() {
    // Reset board to starting position
    game.reset();
    board.start();
    
    // Ruy Lopez opening sequence
    const moves = ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5'];
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
}

// Change the theme of the chessboard
function changeTheme(themeName) {
    // Update the current theme
    currentTheme = themeName;
    
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
    
    // Save preference to localStorage for next visit
    localStorage.setItem('chessTheme', themeName);
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
    
    // Load openings database if we're on a learning or practice page
    // This is commented out until those pages are implemented
    /*
    if (window.location.pathname.includes('learn.html') || window.location.pathname.includes('practice.html')) {
        // Load the openings database
        loadOpeningsDatabase().then(openings => {
            console.log(`Loaded ${openings.length} openings`);
            // Initialize the openings selector or display
            setupOpeningsInterface(openings);
        }).catch(error => {
            console.error('Error loading openings:', error);
        });
    }
    */
});

// This function will be implemented when the learn.html page is created
function setupOpeningsInterface(openings) {
    // TODO: Create UI elements for selecting and displaying openings
}