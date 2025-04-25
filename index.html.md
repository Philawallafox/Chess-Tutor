
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chess Opening Trainer</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <!-- Make sure the chessboard CSS is loading correctly -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/chessboard-js/1.0.0/chessboard-1.0.0.min.css">
</head>
<body>
    <header>
        <h1>Chess Opening Trainer</h1>
        <nav>
            <ul>
                <li><a href="index.html">Home</a></li>
                <li><a href="learn.html">Learn</a></li>
                <li><a href="practice.html">Practice</a></li>
                <li><a href="acknowledgments.html">Acknowledgments</a></li>
            </ul>
        </nav>
    </header>

    <main>
        <section class="intro">
            <h2>Learn Chess Openings for Free</h2>
            <p>Master essential chess openings using classical principles from public domain resources.</p>
            
            <!-- Add a clear container for the chessboard with explicit dimensions -->
            <div id="demo-board" style="width: 300px; margin: 0 auto;"></div>
            
            <a href="learn.html" class="btn">Start Learning</a>
        </section>
    </main>

    <footer>
        <p>&copy; 2025 Chess Opening Trainer | <a href="acknowledgments.html">Acknowledgments</a></p>
    </footer>

    <!-- Load libraries in the correct order -->
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/chessboard-js/1.0.0/chessboard-1.0.0.min.js"></script>
    
    <!-- Add an inline script to make sure the board loads -->
    <script>
        // Wait for page to fully load
        window.addEventListener('DOMContentLoaded', function() {
            // Check if board container exists
            const boardContainer = document.getElementById('demo-board');
            if (!boardContainer) {
                console.error('Board container not found!');
                return;
            }
            
            // Initialize the board with explicit settings
            try {
                const board = Chessboard('demo-board', {
                    position: 'start',
                    pieceTheme: 'https://cdnjs.cloudflare.com/ajax/libs/chessboard-js/1.0.0/img/chesspieces/wikipedia/{piece}.png'
                });
                
                console.log('Board initialized successfully');
                
                // Optional: Test by making a move after 2 seconds
                setTimeout(function() {
                    board.position('rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2');
                }, 2000);
            } catch (error) {
                console.error('Error initializing chessboard:', error);
            }
        });
    </script>
    
    <!-- Load your custom JS file after the inline script -->
    <script src="assets/js/main.js"></script>
</body>
</html>