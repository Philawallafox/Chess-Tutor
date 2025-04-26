/**
 * Chess Tutor - Advanced Board Features
 * 
 * This file contains implementations for:
 * 1. Arrow drawing on the board
 * 2. Multiple piece movement methods (drag-drop, click-to-move, notation)
 */

// Store feature instances for global access
let arrowDrawing = null;
let movementModes = null;

/**
 * Initialize all board features
 * @param {Object} chessboardInstance - The initialized chessboard.js instance
 * @param {Object} gameInstance - The initialized chess.js game instance
 */
function initBoardFeatures(chessboardInstance, gameInstance) {
    // Enable arrow drawing
    arrowDrawing = enableArrowDrawing(document.getElementById('demo-board'), chessboardInstance);
    
    // Set up movement mode selection
    movementModes = setupMovementModes(chessboardInstance, gameInstance);
    
    // Add a "Clear Arrows" button to board controls
    const boardControls = document.querySelector('.board-controls');
    if (boardControls) {
        const clearButton = document.createElement('button');
        clearButton.id = 'clear-arrows';
        clearButton.textContent = 'Clear Arrows';
        clearButton.addEventListener('click', function() {
            arrowDrawing.clearArrows();
        });
        boardControls.appendChild(clearButton);
    }
}

/**
 * Enable drawing arrows on the chessboard
 */
function enableArrowDrawing(boardElement, chessboard) {
    // Create SVG overlay
    const overlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    overlay.style.position = 'absolute';
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.pointerEvents = 'none';
    boardElement.appendChild(overlay);
    
    // Add defs for arrow markers
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', 'arrowhead');
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '7');
    marker.setAttribute('refX', '9');
    marker.setAttribute('refY', '3.5');
    marker.setAttribute('orient', 'auto');
    
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
    polygon.setAttribute('fill', 'rgba(255, 0, 0, 0.7)');
    
    marker.appendChild(polygon);
    defs.appendChild(marker);
    overlay.appendChild(defs);
    
    // Store arrows
    const arrows = [];
    
    // Track mouse state
    let isDrawing = false;
    let startSquare = null;
    
    // Prevent context menu on right-click
    boardElement.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    });
    
    // Add event listeners
    boardElement.addEventListener('mousedown', handleMouseDown);
    boardElement.addEventListener('mousemove', handleMouseMove);
    boardElement.addEventListener('mouseup', handleMouseUp);
    
    // Handle mouse events to create arrows
    function handleMouseDown(event) {
        // Right mouse button
        if (event.button === 2) {
            isDrawing = true;
            // Convert mouse position to chess square
            startSquare = getSquareFromPosition(event.clientX, event.clientY, boardElement);
            event.preventDefault();
        }
    }
    
    function handleMouseMove(event) {
        if (isDrawing) {
            // Real-time preview could be added here
        }
    }
    
    function handleMouseUp(event) {
        if (isDrawing) {
            isDrawing = false;
            const endSquare = getSquareFromPosition(event.clientX, event.clientY, boardElement);
            if (startSquare && endSquare && startSquare !== endSquare) {
                drawArrow(startSquare, endSquare);
            }
        }
    }
    
    function drawArrow(from, to) {
        // Calculate start and end coordinates
        const fromCoord = getSquareCoordinates(from, boardElement);
        const toCoord = getSquareCoordinates(to, boardElement);
        
        // Create SVG arrow path
        const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        
        // Create path for arrow
        const path = `M ${fromCoord.x} ${fromCoord.y} L ${toCoord.x} ${toCoord.y}`;
        arrow.setAttribute('d', path);
        arrow.setAttribute('stroke', 'rgba(255, 0, 0, 0.7)');
        arrow.setAttribute('stroke-width', '3');
        arrow.setAttribute('marker-end', 'url(#arrowhead)');
        
        // Add the arrow to the overlay
        overlay.appendChild(arrow);
        
        // Store arrow data
        arrows.push({ from, to, element: arrow });
    }
    
    // Clear all arrows
    function clearArrows() {
        arrows.forEach(arrow => {
            overlay.removeChild(arrow.element);
        });
        arrows.length = 0;
    }
    
    // Helper function to convert screen position to chess square
    function getSquareFromPosition(x, y, boardElement) {
        const rect = boardElement.getBoundingClientRect();
        const boardSize = rect.width; // Assuming square board
        
        // Adjust for board position
        const boardX = x - rect.left;
        const boardY = y - rect.top;
        
        // Get file (a-h) and rank (1-8)
        const squareSize = boardSize / 8;
        const file = Math.floor(boardX / squareSize);
        const rank = 7 - Math.floor(boardY / squareSize); // Invert for chess rank (bottom=1, top=8)
        
        // Convert to algebraic notation
        const fileChar = String.fromCharCode(97 + file); // 97 = 'a'
        const rankChar = rank + 1;
        
        // Return square name (e.g., "e4")
        return fileChar + rankChar;
    }
    
    // Helper function to get the center coordinates of a square
    function getSquareCoordinates(square, boardElement) {
        const rect = boardElement.getBoundingClientRect();
        const boardSize = rect.width;
        const squareSize = boardSize / 8;
        
        // Parse the square
        const file = square.charCodeAt(0) - 97; // 'a' -> 0, 'b' -> 1, etc.
        const rank = 8 - parseInt(square.charAt(1)); // Invert for y-coordinate
        
        // Calculate center of the square
        return {
            x: file * squareSize + squareSize / 2,
            y: rank * squareSize + squareSize / 2
        };
    }
    
    // Add a method to clear arrows when the board position changes
    const originalPosition = chessboard.position;
    chessboard.position = function() {
        const result = originalPosition.apply(this, arguments);
        if (arguments.length > 0) {
            clearArrows();
        }
        return result;
    };
    
    // Return methods for external use
    return {
        clearArrows: clearArrows
    };
}

/**
 * Set up movement mode selection
 */
function setupMovementModes(chessboard, game) {
    // Create container for movement mode selection
    const modeContainer = document.createElement('div');
    modeContainer.className = 'movement-mode-container';
    modeContainer.innerHTML = `
        <label class="mode-label">Piece Movement Style:</label>
        <div class="mode-options">
            <label>
                <input type="radio" name="moveMode" value="drag" checked>
                Drag and Drop
            </label>
            <label>
                <input type="radio" name="moveMode" value="click">
                Click to Select/Move
            </label>
            <label>
                <input type="radio" name="moveMode" value="notation">
                Algebraic Notation
            </label>
        </div>
    `;
    
    // Add to the page after theme selector
    const themeSelector = document.querySelector('.theme-selector');
    if (themeSelector) {
        themeSelector.after(modeContainer);
    }
    
    // Current mode trackers
    let currentMode = 'drag';
    let clickHandler = null;
    let notationHandler = null;
    
    // Store current position and attributes for rebuilding board
    let currentPosition = chessboard.position();
    const boardElement = document.getElementById('demo-board');
    
    // Handle mode changes
    const radioButtons = modeContainer.querySelectorAll('input[name="moveMode"]');
    radioButtons.forEach(radio => {
        radio.addEventListener('change', function() {
            const newMode = this.value;
            
            // Skip if mode hasn't changed
            if (newMode === currentMode) return;
            
            // Get current board state before disabling
            currentPosition = chessboard.position();
            
            // Disable the current mode
            disableCurrentMode();
            
            // Enable the new mode
            enableMode(newMode);
            
            // Update current mode
            currentMode = newMode;
            
            // Save preference
            localStorage.setItem('moveMode', newMode);
        });
    });
    
    // Check for saved preference
    const savedMode = localStorage.getItem('moveMode');
    if (savedMode && savedMode !== 'drag') {
        // Select the saved mode
        const modeRadio = modeContainer.querySelector(`input[value="${savedMode}"]`);
        if (modeRadio) {
            modeRadio.checked = true;
            
            // Simulate a change event to apply the mode
            const event = new Event('change');
            modeRadio.dispatchEvent(event);
        }
    }
    
    function disableCurrentMode() {
        if (currentMode === 'drag') {
            // Nothing special needed - board will be recreated
        } else if (currentMode === 'click') {
            // Remove click handlers
            if (clickHandler && clickHandler.disable) {
                clickHandler.disable();
            }
        } else if (currentMode === 'notation') {
            // Remove notation input
            const notationContainer = document.querySelector('.notation-input-container');
            if (notationContainer) notationContainer.remove();
        }
    }
    
    function enableMode(mode) {
        // Store the orientation before rebuilding
        const orientation = chessboard.orientation();
        
        // Destroy existing board
        chessboard.destroy();
        
        if (mode === 'drag') {
            // Recreate with drag-drop enabled
            chessboard = Chessboard(boardElement.id, {
                position: currentPosition,
                pieceTheme: 'https://chessboardjs.com/img/chesspieces/' + window.currentTheme + '/{piece}.png',
                draggable: true,
                orientation: orientation,
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
                    chessboard.position(game.fen());
                }
            });
            
            // Re-initialize arrow drawing after board recreation
            if (window.arrowDrawing) {
                window.arrowDrawing = enableArrowDrawing(boardElement, chessboard);
            }
            
            // Update global board reference
            window.board = chessboard;
        } else if (mode === 'click') {
            // Recreate without drag-drop
            chessboard = Chessboard(boardElement.id, {
                position: currentPosition,
                pieceTheme: 'https://chessboardjs.com/img/chesspieces/' + window.currentTheme + '/{piece}.png',
                draggable: false,
                orientation: orientation
            });
            
            // Update global board reference
            window.board = chessboard;
            
            // Enable click to move
            clickHandler = enableClickToMove(chessboard, game);
            
            // Re-initialize arrow drawing after board recreation
            if (window.arrowDrawing) {
                window.arrowDrawing = enableArrowDrawing(boardElement, chessboard);
            }
        } else if (mode === 'notation') {
            // Recreate without drag-drop
            chessboard = Chessboard(boardElement.id, {
                position: currentPosition,
                pieceTheme: 'https://chessboardjs.com/img/chesspieces/' + window.currentTheme + '/{piece}.png',
                draggable: false,
                orientation: orientation
            });
            
            // Update global board reference
            window.board = chessboard;
            
            // Enable notation input
            notationHandler = enableNotationInput(chessboard, game);
            
            // Re-initialize arrow drawing after board recreation
            if (window.arrowDrawing) {
                window.arrowDrawing = enableArrowDrawing(boardElement, chessboard);
            }
        }
    }
    
    return {
        getCurrentMode: function() { return currentMode; },
        setMode: function(mode) {
            const radio = document.querySelector(`input[name="moveMode"][value="${mode}"]`);
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change'));
            }
        }
    };
}

/**
 * Enable click-to-select, click-to-move functionality
 */
function enableClickToMove(chessboard, game) {
    let selectedSquare = null;
    let validMoves = [];
    let highlightElements = [];
    
    // Create an overlay to highlight valid moves
    const boardElement = document.getElementById('demo-board');
    const highlightLayer = document.createElement('div');
    highlightLayer.className = 'highlight-layer';
    highlightLayer.style.position = 'absolute';
    highlightLayer.style.top = 0;
    highlightLayer.style.left = 0;
    highlightLayer.style.width = '100%';
    highlightLayer.style.height = '100%';
    highlightLayer.style.pointerEvents = 'none';
    boardElement.appendChild(highlightLayer);
    
    // Click handler function
    function handleBoardClick(event) {
        // Find which square was clicked
        const square = getSquareFromPosition(event.clientX, event.clientY, boardElement);
        if (!square) return;
        
        // If no square is selected yet, try to select a piece
        if (selectedSquare === null) {
            const piece = game.get(square);
            
            // Check if there's a piece and it's the correct color
            if (piece && (
                (game.turn() === 'w' && piece.color === 'w') || 
                (game.turn() === 'b' && piece.color === 'b')
            )) {
                selectedSquare = square;
                highlightSquare(square, 'selected');
                
                // Show valid moves
                validMoves = game.moves({
                    square: square,
                    verbose: true
                });
                
                validMoves.forEach(move => {
                    highlightSquare(move.to, 'valid-move');
                });
            }
        } 
        // If a square is already selected, try to move there
        else {
            // Check if the clicked square has one of our pieces
            const piece = game.get(square);
            if (piece && piece.color === game.turn()) {
                // Reselect a different piece
                clearHighlights();
                selectedSquare = square;
                highlightSquare(square, 'selected');
                
                // Show valid moves for new selection
                validMoves = game.moves({
                    square: square,
                    verbose: true
                });
                
                validMoves.forEach(move => {
                    highlightSquare(move.to, 'valid-move');
                });
                return;
            }
            
            // Check if the move is valid
            const move = validMoves.find(m => m.to === square);
            
            if (move) {
                // Make the move
                game.move({
                    from: selectedSquare,
                    to: square,
                    promotion: 'q' // Always promote to queen for simplicity
                });
                
                // Update the board
                chessboard.position(game.fen());
            }
            
            // Clear selection and highlights
            clearHighlights();
            selectedSquare = null;
        }
    }
    
    // Add the click handler
    boardElement.addEventListener('click', handleBoardClick);
    
    function highlightSquare(square, highlightType) {
        const highlight = document.createElement('div');
        highlight.className = `square-highlight ${highlightType}`;
        
        // Calculate position based on square
        const boardRect = boardElement.getBoundingClientRect();
        const squareSize = boardRect.width / 8;
        
        const file = square.charCodeAt(0) - 97; // 'a' -> 0
        const rank = 8 - parseInt(square.charAt(1)); // Invert for CSS top position
        
        highlight.style.left = (file * squareSize) + 'px';
        highlight.style.top = (rank * squareSize) + 'px';
        highlight.style.width = squareSize + 'px';
        highlight.style.height = squareSize + 'px';
        
        highlightLayer.appendChild(highlight);
        highlightElements.push(highlight);
    }
    
    function clearHighlights() {
        highlightElements.forEach(el => {
            highlightLayer.removeChild(el);
        });
        highlightElements = [];
    }
    
    // Helper function to convert screen position to chess square
    function getSquareFromPosition(x, y, boardElement) {
        const rect = boardElement.getBoundingClientRect();
        const boardSize = rect.width; // Assuming square board
        
        // Adjust for board position
        const boardX = x - rect.left;
        const boardY = y - rect.top;
        
        // Check if click is within board
        if (boardX < 0 || boardX >= boardSize || boardY < 0 || boardY >= boardSize) {
            return null;
        }
        
        // Get file (a-h) and rank (1-8)
        const squareSize = boardSize / 8;
        const file = Math.floor(boardX / squareSize);
        const rank = 7 - Math.floor(boardY / squareSize); // Invert for chess rank (bottom=1, top=8)
        
        // Convert to algebraic notation
        const fileChar = String.fromCharCode(97 + file); // 97 = 'a'
        const rankChar = rank + 1;
        
        // Return square name (e.g., "e4")
        return fileChar + rankChar;
    }
    
    // Clean up function
    function disable() {
        boardElement.removeEventListener('click', handleBoardClick);
        if (highlightLayer.parentNode) {
            highlightLayer.parentNode.removeChild(highlightLayer);
        }
    }
    
    // Return control methods
    return {
        disable: disable,
        clearHighlights: clearHighlights
    };
}

/**
 * Enable algebraic notation input
 */
function enableNotationInput(chessboard, game) {
    // Create input container
    const inputContainer = document.createElement('div');
    inputContainer.className = 'notation-input-container';
    
    // Create input field
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Enter move (e.g., e4, Nf3)';
    
    // Create button
    const button = document.createElement('button');
    button.textContent = 'Make Move';
    
    // Add elements to container
    inputContainer.appendChild(input);
    inputContainer.appendChild(button);
    
    // Add to the page
    document.querySelector('.board-controls').after(inputContainer);
    
    // Handle move submission
    function handleMoveSubmission() {
        const notation = input.value.trim();
        if (!notation) return;
        
        try {
            // Try to make the move
            const move = game.move(notation);
            
            if (move) {
                // Update the board
                chessboard.position(game.fen());
                input.value = '';
            } else {
                // Invalid move
                input.classList.add('error');
                setTimeout(() => {
                    input.classList.remove('error');
                }, 1500);
            }
        } catch (error) {
            console.error('Invalid move:', error);
            // Highlight input field in red to indicate error
            input.classList.add('error');
            setTimeout(() => {
                input.classList.remove('error');
            }, 1500);
        }
    }
    
    // Add click handler to button
    button.addEventListener('click', handleMoveSubmission);
    
    // Also allow pressing Enter to submit
    input.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            handleMoveSubmission();
        }
    });
    
    // Auto-focus the input
    setTimeout(() => {
        input.focus();
    }, 100);
    
    // Return control methods
    return {
        disable: function() {
            if (inputContainer.parentNode) {
                inputContainer.parentNode.removeChild(inputContainer);
            }
        }
    };
}

// Make functions available globally
window.initBoardFeatures = initBoardFeatures;
window.enableArrowDrawing = enableArrowDrawing;
window.setupMovementModes = setupMovementModes;
window.enableClickToMove = enableClickToMove;
window.enableNotationInput = enableNotationInput;