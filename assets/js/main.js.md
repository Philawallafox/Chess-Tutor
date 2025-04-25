// Initialize demo board on homepage
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the homepage with the demo board
    const demoBoard = document.getElementById('demo-board');
    if (demoBoard) {
        // Initialize a chess board with starting position
        const board = Chessboard('demo-board', {
            position: 'start',
            pieceTheme: 'https://cdnjs.cloudflare.com/ajax/libs/chessboard-js/1.0.0/img/chesspieces/wikipedia/{piece}.png'
        });
        
        // Auto-play a few opening moves after a short delay
        setTimeout(function() {
            board.position('rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2', false);
            
            setTimeout(function() {
                board.position('rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2', false);
                
                setTimeout(function() {
                    board.position('r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3', false);
                }, 1000);
            }, 1000);
        }, 1000);
    }
});