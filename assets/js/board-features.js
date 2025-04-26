// board-features.js - Handles highlighting and arrow drawing

// Check if BoardFeatures already exists to avoid duplicate declaration
if (typeof BoardFeatures === 'undefined') {

    class BoardFeatures {
      constructor(board, options = {}) {
        this.board = board;
        this.options = Object.assign({
          arrowColor: 'rgba(255, 0, 0, 0.5)',
          arrowWidth: 8,
          highlightColor: 'rgba(255, 255, 0, 0.5)',
          suggestMoveColor: 'rgba(0, 255, 0, 0.4)'
        }, options);
        
        this.highlights = [];
        this.arrows = [];
        this.canvas = this.createCanvas();
        this.isDragging = false;
        this.dragStart = null;
        this.dragEnd = null;
        
        this.initEvents();
        this.render();
      }
      
      createCanvas() {
        // Create canvas element that overlays the board
        if (!this.board || !this.board.container) {
          console.error('Invalid chess board object');
          return null;
        }
        
        const boardElement = this.board.container.querySelector('.board-b72b1');
        if (!boardElement) {
          console.error('Cannot find chess board element');
          return null;
        }
        
        const canvas = document.createElement('canvas');
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.pointerEvents = 'none'; // Don't capture mouse events
        canvas.width = boardElement.offsetWidth;
        canvas.height = boardElement.offsetHeight;
        
        // Insert canvas as the first child of the board container
        // to ensure it's behind pieces but above the board squares
        boardElement.insertBefore(canvas, boardElement.firstChild);
        
        return canvas;
      }
      
      initEvents() {
        // Get the board DOM element
        if (!this.board || !this.board.container) return;
        
        const boardElement = this.board.container.querySelector('.board-b72b1');
        if (!boardElement) return;
        
        // Handle right-click drag for drawing arrows
        boardElement.addEventListener('contextmenu', (e) => {
          e.preventDefault(); // Prevent context menu
        });
        
        boardElement.addEventListener('mousedown', (e) => {
          // Only process right mouse button (button 2)
          if (e.button === 2) {
            e.preventDefault();
            this.isDragging = true;
            this.dragStart = this.getSquareFromEvent(e);
          }
        });
        
        document.addEventListener('mousemove', (e) => {
          if (this.isDragging) {
            this.dragEnd = this.getSquareFromEvent(e);
            this.render();
          }
        });
        
        document.addEventListener('mouseup', (e) => {
          if (this.isDragging && e.button === 2) {
            this.isDragging = false;
            const endSquare = this.getSquareFromEvent(e);
            
            if (this.dragStart && endSquare && this.dragStart !== endSquare) {
              // Add arrow if start and end squares are different
              this.addArrow(this.dragStart, endSquare);
            } else if (this.dragStart && endSquare && this.dragStart === endSquare) {
              // Toggle highlight if clicked on the same square
              this.toggleHighlight(endSquare);
            }
            
            this.dragStart = null;
            this.dragEnd = null;
            this.render();
          }
        });
        
        // Resize canvas when window resizes
        window.addEventListener('resize', () => {
          this.resizeCanvas();
          this.render();
        });
      }
      
      getSquareFromEvent(e) {
        if (!this.board || !this.board.container) return null;
        
        const boardElement = this.board.container.querySelector('.board-b72b1');
        if (!boardElement) return null;
        
        const rect = boardElement.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Calculate square size
        const squareSize = rect.width / 8;
        
        // Convert coordinates to square (0-7 for both file and rank)
        let file = Math.floor(x / squareSize);
        let rank = Math.floor(y / squareSize);
        
        // Adjust for board orientation (if black is on bottom)
        if (!this.board.orientation().startsWith('w')) {
          file = 7 - file;
          rank = 7 - rank;
        }
        
        // Convert to algebraic notation
        const files = 'abcdefgh';
        const ranks = '87654321';
        
        if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;
        
        return files.charAt(file) + ranks.charAt(rank);
      }
      
      resizeCanvas() {
        if (!this.canvas || !this.board || !this.board.container) return;
        
        const boardElement = this.board.container.querySelector('.board-b72b1');
        if (boardElement) {
          this.canvas.width = boardElement.offsetWidth;
          this.canvas.height = boardElement.offsetHeight;
        }
      }
      
      toggleHighlight(square) {
        const index = this.highlights.indexOf(square);
        if (index >= 0) {
          this.highlights.splice(index, 1);
        } else {
          this.highlights.push(square);
        }
      }
      
      addArrow(from, to) {
        // Check if arrow already exists
        const existingIndex = this.arrows.findIndex(arrow => 
          arrow.from === from && arrow.to === to);
        
        if (existingIndex >= 0) {
          // Remove if already exists
          this.arrows.splice(existingIndex, 1);
        } else {
          // Add new arrow
          this.arrows.push({ from, to });
        }
      }
      
      clearHighlights() {
        this.highlights = [];
        this.render();
      }
      
      clearArrows() {
        this.arrows = [];
        this.render();
      }
      
      clearAll() {
        this.highlights = [];
        this.arrows = [];
        this.render();
      }
      
      highlightSquare(square) {
        if (!this.highlights.includes(square)) {
          this.highlights.push(square);
          this.render();
        }
      }
      
      suggestMove(from, to) {
        // Temporary highlight and arrow for suggesting a move
        this.tempHighlights = [from];
        this.tempArrow = { from, to };
        this.render();
        
        // Clear after 2 seconds
        setTimeout(() => {
          this.tempHighlights = [];
          this.tempArrow = null;
          this.render();
        }, 2000);
      }
      
      render() {
        if (!this.canvas) return;
        
        const ctx = this.canvas.getContext('2d');
        const squareSize = this.canvas.width / 8;
        
        // Clear canvas
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw highlights
        this.highlights.forEach(square => {
          this.drawSquareHighlight(ctx, square, this.options.highlightColor, squareSize);
        });
        
        // Draw temporary highlights (for move suggestions)
        if (this.tempHighlights && this.tempHighlights.length) {
          this.tempHighlights.forEach(square => {
            this.drawSquareHighlight(ctx, square, this.options.suggestMoveColor, squareSize);
          });
        }
        
        // Draw arrows
        this.arrows.forEach(arrow => {
          this.drawArrow(ctx, arrow.from, arrow.to, this.options.arrowColor, squareSize);
        });
        
        // Draw temporary arrow (for move suggestions)
        if (this.tempArrow) {
          this.drawArrow(ctx, this.tempArrow.from, this.tempArrow.to, 
                         this.options.suggestMoveColor, squareSize);
        }
        
        // Draw drag arrow
        if (this.isDragging && this.dragStart && this.dragEnd && this.dragStart !== this.dragEnd) {
          this.drawArrow(ctx, this.dragStart, this.dragEnd, this.options.arrowColor, squareSize);
        }
      }
      
      drawSquareHighlight(ctx, square, color, squareSize) {
        const coords = this.getSquareCoordinates(square, squareSize);
        if (!coords) return;
        
        ctx.fillStyle = color;
        ctx.fillRect(coords.x, coords.y, squareSize, squareSize);
      }
      
      drawArrow(ctx, from, to, color, squareSize) {
        const fromCoords = this.getSquareCoordinates(from, squareSize);
        const toCoords = this.getSquareCoordinates(to, squareSize);
        
        if (!fromCoords || !toCoords) return;
        
        // Calculate center points of squares
        const fromX = fromCoords.x + squareSize / 2;
        const fromY = fromCoords.y + squareSize / 2;
        const toX = toCoords.x + squareSize / 2;
        const toY = toCoords.y + squareSize / 2;
        
        // Draw arrow line
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.strokeStyle = color;
        ctx.lineWidth = this.options.arrowWidth;
        ctx.stroke();
        
        // Draw arrow head
        const angle = Math.atan2(toY - fromY, toX - fromX);
        const headLength = squareSize / 3;
        
        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(
          toX - headLength * Math.cos(angle - Math.PI / 6),
          toY - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          toX - headLength * Math.cos(angle + Math.PI / 6),
          toY - headLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.lineTo(toX, toY);
        ctx.fillStyle = color;
        ctx.fill();
      }
      
      getSquareCoordinates(square, squareSize) {
        if (!square || square.length !== 2) return null;
        
        const files = 'abcdefgh';
        const ranks = '87654321';
        
        const file = files.indexOf(square[0]);
        const rank = ranks.indexOf(square[1]);
        
        if (file < 0 || rank < 0) return null;
        
        // Adjust for board orientation
        let adjustedFile = file;
        let adjustedRank = rank;
        
        if (!this.board.orientation().startsWith('w')) {
          adjustedFile = 7 - file;
          adjustedRank = 7 - rank;
        }
        
        return {
          x: adjustedFile * squareSize,
          y: adjustedRank * squareSize
        };
      }
    }
    
    // Make available globally
    if (typeof window !== 'undefined') {
      window.BoardFeatures = BoardFeatures;
    }
    
    // Export for use in modules
    if (typeof module !== 'undefined') {
      module.exports = BoardFeatures;
    }
    
    } // End of 'if typeof BoardFeatures === undefined'