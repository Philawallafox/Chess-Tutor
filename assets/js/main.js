// Global variables to maintain state
let board = null;
let game = null;
let currentTheme = 'wikipedia';

// Initialize the board with the current theme
function initializeBoard() {
    // Create a new chess game instance
    game = new Chess();
    
    // Create the board with the current theme
    board = Chessboard('demo-board', {
        position: 'start',
        pieceTheme: `https://unpkg.com/@chrisoakman/chessboardjs@1.0.0/img/chesspieces/${currentTheme}/{piece}.png`
    });
    
    // If we're on the homepage with the demo board, animate some moves
    if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
        // Wait a bit then show a simple opening sequence
        setTimeout(demonstrateOpening, 1000);
    }
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
        pieceTheme: `https://unpkg.com/@chrisoakman/chessboardjs@1.0.0/img/chesspieces/${currentTheme}/{piece}.png`
    });
    
    // Save preference to localStorage for next visit
    localStorage.setItem('chessTheme', themeName);
}

// Demonstrate a simple opening sequence
function demonstrateOpening() {
    // King's Pawn Opening sequence
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
            setTimeout(makeNextMove, 1200);
        }
    }
    
    // Start the sequence
    makeNextMove();
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
            themeSelector.value = savedTheme;
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
});

// Load opening database
async function loadOpeningsDatabase() {
    try {
        const response = await fetch('data/openings.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.openings;
    } catch (error) {
        console.error('Error loading openings database:', error);
        return [];
    }
}