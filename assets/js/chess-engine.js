// chess-engine.js - Chess Engine Interface with Stockfish and Fallback

class ChessEngine {
    constructor(options = {}) {
      this.options = Object.assign({
        stockfishPath: 'https://cdn.jsdelivr.net/npm/stockfish@11.0.0/stockfish.js',
        useStockfish: true,
        fallbackToSimple: true,
        depth: 15,
        skill: 10  // 0-20 scale
      }, options);
      
      this.engine = null;
      this.isReady = false;
      this.position = 'startpos';
      this.engineType = null;
      this.pendingCallback = null;
      
      // Initialize engine based on availability
      this.initialize();
    }
    
    initialize() {
      // Try Stockfish first if requested
      if (this.options.useStockfish) {
        try {
          const wasmSupport = this.checkWebAssemblySupport();
          
          if (wasmSupport.supported) {
            this.initializeStockfish();
          } else if (this.options.fallbackToSimple) {
            console.warn("WebAssembly not supported. Falling back to simple engine.");
            this.initializeSimpleEngine();
          } else {
            this.displayEngineError("WebAssembly not supported: " + wasmSupport.details);
          }
        } catch (error) {
          console.error("Failed to initialize Stockfish:", error);
          if (this.options.fallbackToSimple) {
            console.warn("Falling back to simple engine after error.");
            this.initializeSimpleEngine();
          } else {
            this.displayEngineError("Chess engine error: " + error.message);
          }
        }
      } else {
        this.initializeSimpleEngine();
      }
    }
    
    checkWebAssemblySupport() {
      try {
        if (typeof WebAssembly === 'object' && 
            typeof WebAssembly.instantiate === 'function') {
          // Test simple module
          const module = new WebAssembly.Module(new Uint8Array([
            0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00
          ]));
          if (module instanceof WebAssembly.Module) {
            return {
              supported: true,
              details: "Full WebAssembly support detected"
            };
          }
          return {
            supported: false, 
            details: "WebAssembly Module instantiation failed"
          };
        }
        return {
          supported: false,
          details: "WebAssembly not available"
        };
      } catch (e) {
        return {
          supported: false,
          details: "Exception when testing WebAssembly: " + e.message
        };
      }
    }
    
    initializeStockfish() {
      try {
        // Check if Stockfish is loaded from CDN as a function
        if (typeof Stockfish === 'function') {
          // Create a worker from the Stockfish object
          this.engine = new Worker(Stockfish());
        } else {
          // Initialize Worker with direct path
          this.engine = new Worker(this.options.stockfishPath);
        }
        
        this.engineType = 'stockfish';
        
        this.engine.onmessage = (event) => this.handleEngineMessage(event.data);
        
        this.engine.onerror = (error) => {
          console.error("Engine worker error:", error);
          if (this.options.fallbackToSimple) {
            console.warn("Worker error. Falling back to simple engine.");
            this.initializeSimpleEngine();
          } else {
            this.displayEngineError("Engine worker error: " + error.message);
          }
        };
        
        // Configure Stockfish
        this.sendCommand("uci");
        this.sendCommand(`setoption name Skill Level value ${this.options.skill}`);
        this.sendCommand("isready");
      } catch (error) {
        if (this.options.fallbackToSimple) {
          console.warn("Error creating Stockfish worker. Falling back to simple engine:", error);
          this.initializeSimpleEngine();
        } else {
          throw error;
        }
      }
    }
    
    initializeSimpleEngine() {
      // Simple minimax-based engine using chess.js
      this.engineType = 'simple';
      this.isReady = true;
      
      // Simulated "ready" event for API consistency
      setTimeout(() => {
        if (typeof this.onReady === 'function') {
          this.onReady();
        }
      }, 0);
    }
    
    sendCommand(command) {
      if (this.engineType === 'stockfish' && this.engine) {
        this.engine.postMessage(command);
      }
    }
    
    handleEngineMessage(message) {
      if (typeof message !== 'string') return;
      
      // Parse Stockfish UCI output
      if (message.includes('readyok')) {
        this.isReady = true;
        if (typeof this.onReady === 'function') {
          this.onReady();
        }
      } else if (message.includes('bestmove')) {
        const match = message.match(/bestmove\s+(\w+)/);
        if (match && this.pendingCallback) {
          this.pendingCallback(match[1]);
          this.pendingCallback = null;
        }
      }
      // More handlers for score, etc. can be added here
    }
    
    setPosition(fen) {
      this.position = fen || 'startpos';
      
      if (this.engineType === 'stockfish') {
        const positionCommand = fen ? 
          `position fen ${fen}` : 
          'position startpos';
        this.sendCommand(positionCommand);
      }
    }
    
    getBestMove(callback, moveTime = 1000) {
      if (!this.isReady) {
        console.warn("Engine not ready yet");
        setTimeout(() => this.getBestMove(callback, moveTime), 500);
        return;
      }
      
      if (this.engineType === 'stockfish') {
        this.pendingCallback = callback;
        this.sendCommand(`go movetime ${moveTime}`);
      } else {
        // Simple engine implementation
        this.evaluatePositionWithMinimax(this.position, 2, (result) => {
          callback(result.bestmove);
        });
      }
    }
    
    evaluatePositionWithMinimax(fen, depth = 2, callback) {
      // Simple evaluation using chess.js and minimax
      const chess = new Chess(fen === 'startpos' ? undefined : fen);
      const moves = chess.moves({ verbose: true });
      
      if (moves.length === 0) {
        callback({ bestmove: null, score: 0 });
        return;
      }
      
      // Simple minimax implementation
      const minimax = (depth, alpha, beta, maximizing) => {
        if (depth === 0) {
          // Material-based evaluation
          let value = 0;
          const pieces = chess.board().flat().filter(Boolean);
          pieces.forEach(piece => {
            const values = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
            const sign = piece.color === 'w' ? 1 : -1;
            value += sign * values[piece.type];
          });
          return value;
        }
        
        const moves = chess.moves({ verbose: true });
        
        if (moves.length === 0) {
          return chess.in_checkmate() ? (maximizing ? -10000 : 10000) : 0;
        }
        
        if (maximizing) {
          let bestVal = -Infinity;
          for (const move of moves) {
            chess.move(move);
            const val = minimax(depth - 1, alpha, beta, false);
            chess.undo();
            bestVal = Math.max(bestVal, val);
            alpha = Math.max(alpha, bestVal);
            if (beta <= alpha) break;
          }
          return bestVal;
        } else {
          let bestVal = Infinity;
          for (const move of moves) {
            chess.move(move);
            const val = minimax(depth - 1, alpha, beta, true);
            chess.undo();
            bestVal = Math.min(bestVal, val);
            beta = Math.min(beta, bestVal);
            if (beta <= alpha) break;
          }
          return bestVal;
        }
      };
      
      // Find best move
      setTimeout(() => {
        let bestScore = -Infinity;
        let bestMove = moves[0];
        
        for (const move of moves) {
          chess.move(move);
          const score = minimax(depth - 1, -Infinity, Infinity, false);
          chess.undo();
          
          if (score > bestScore) {
            bestScore = score;
            bestMove = move;
          }
        }
        
        callback({ 
          bestmove: bestMove.from + bestMove.to + (bestMove.promotion || ''),
          score: bestScore
        });
      }, 0);
    }
    
    displayEngineError(message) {
      // Create or update an error message element
      console.error(message);
      
      // Only try to add to DOM if document exists (we might be in a Worker)
      if (typeof document !== 'undefined') {
        let errorElement = document.getElementById('engine-error');
        if (!errorElement) {
          errorElement = document.createElement('div');
          errorElement.id = 'engine-error';
          errorElement.style.color = 'red';
          errorElement.style.padding = '10px';
          errorElement.style.border = '1px solid red';
          errorElement.style.margin = '10px 0';
          const container = document.querySelector('.board-container') || document.body;
          container.appendChild(errorElement);
        }
        errorElement.textContent = message;
        
        // Provide fallback options
        const fallbackMessage = document.createElement('p');
        fallbackMessage.innerHTML = "Try using Chrome or Firefox instead, or disable extensions that might be blocking scripts.";
        errorElement.appendChild(fallbackMessage);
      }
    }
    
    // Clean up when done
    destroy() {
      if (this.engineType === 'stockfish' && this.engine) {
        this.engine.terminate();
      }
      this.engine = null;
      this.isReady = false;
    }
  }
  
  // Make available globally
  if (typeof window !== 'undefined') {
    window.ChessEngine = ChessEngine;
  }
  
  // Export for use in modules
  if (typeof module !== 'undefined') {
    module.exports = ChessEngine;
  }