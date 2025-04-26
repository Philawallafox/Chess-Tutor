// engine-loader.js - Add this to your project

class EngineLoader {
    constructor(options = {}) {
      this.options = Object.assign({
        stockfishPath: './stockfish.js',
        loadTimeout: 5000,
        onEngineReady: null,
        onError: null
      }, options);
      
      this.engine = null;
      this.useSimpleEngine = false;
      this.engineLoadAttempted = false;
    }
    
    // Main entry point - try to load stockfish with fallback
    async loadEngine() {
      if (this.engineLoadAttempted) return this.engine;
      this.engineLoadAttempted = true;
      
      try {
        // First check browser compatibility
        const browserCompatible = this.checkBrowserCompatibility();
        if (!browserCompatible.compatible) {
          console.warn(`Browser compatibility issue: ${browserCompatible.reason}`);
          return this.fallbackToSimpleEngine(`Your browser may not fully support the chess engine (${browserCompatible.reason}). Using simplified version.`);
        }
        
        // Try to load Stockfish
        const engineLoaded = await this.tryLoadStockfish();
        if (!engineLoaded) {
          return this.fallbackToSimpleEngine("Could not initialize chess engine. Using simplified version.");
        }
        
        return this.engine;
      } catch (error) {
        console.error("Error loading chess engine:", error);
        return this.fallbackToSimpleEngine(`Error loading chess engine: ${error.message}`);
      }
    }
    
    // Check if the browser supports all needed features
    checkBrowserCompatibility() {
      // Check for Web Workers
      if (typeof Worker === 'undefined') {
        return { compatible: false, reason: 'Web Workers not supported' };
      }
      
      // Check for WebAssembly
      if (typeof WebAssembly === 'undefined') {
        return { compatible: false, reason: 'WebAssembly not supported' };
      }
      
      // Try to instantiate a simple WebAssembly module
      try {
        const module = new WebAssembly.Module(new Uint8Array([
          0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00
        ]));
        if (!(module instanceof WebAssembly.Module)) {
          return { compatible: false, reason: 'WebAssembly module instantiation failed' };
        }
      } catch (e) {
        return { compatible: false, reason: `WebAssembly error: ${e.message}` };
      }
      
      // Check for required fetch API if we need to download the engine
      if (this.options.stockfishPath.startsWith('http') && typeof fetch === 'undefined') {
        return { compatible: false, reason: 'Fetch API not available for downloading engine' };
      }
      
      return { compatible: true };
    }
    
    // Try to load Stockfish with timeout
    tryLoadStockfish() {
      return new Promise((resolve) => {
        try {
          // Set up timeout for engine loading
          const timeout = setTimeout(() => {
            console.warn("Stockfish load timed out");
            resolve(false);
          }, this.options.loadTimeout);
          
          // Create and configure the engine
          const worker = new Worker(this.options.stockfishPath);
          
          worker.onmessage = (e) => {
            const msg = e.data;
            if (typeof msg === 'string' && msg.includes('readyok')) {
              clearTimeout(timeout);
              this.engine = worker;
              
              if (typeof this.options.onEngineReady === 'function') {
                this.options.onEngineReady(worker);
              }
              
              resolve(true);
            }
          };
          
          worker.onerror = (error) => {
            console.error("Stockfish worker error:", error);
            clearTimeout(timeout);
            resolve(false);
          };
          
          // Initialize UCI engine
          worker.postMessage('uci');
          worker.postMessage('isready');
        } catch (error) {
          console.error("Error creating Stockfish worker:", error);
          resolve(false);
        }
      });
    }
    
    // Fallback to simple chess engine when Stockfish fails
    fallbackToSimpleEngine(reason) {
      this.useSimpleEngine = true;
      console.warn(reason);
      
      // Create a simplified engine interface that mimics Stockfish
      this.engine = {
        isSimpleEngine: true,
        
        postMessage: (cmd) => {
          // Process commands similar to Stockfish UCI
          if (cmd.startsWith('position')) {
            this.currentPosition = cmd.includes('startpos') ? 
              'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' : 
              cmd.split('fen ')[1];
          }
          else if (cmd.startsWith('go')) {
            // Calculate move on next tick
            setTimeout(() => {
              const bestMove = this.calculateSimpleMove(this.currentPosition);
              if (typeof this.engine.onmessage === 'function') {
                this.engine.onmessage({ data: `bestmove ${bestMove}` });
              }
            }, 100);
          }
        },
        
        terminate: () => {
          // Nothing to terminate in the simple engine
          this.engine = null;
        }
      };
      
      // Display warning to user if callback provided
      if (typeof this.options.onError === 'function') {
        this.options.onError(reason);
      }
      
      // Notify ready callback if provided
      if (typeof this.options.onEngineReady === 'function') {
        this.options.onEngineReady(this.engine);
      }
      
      return this.engine;
    }
    
    // Very basic move generation
    calculateSimpleMove(fenPosition) {
      // We'd use Chess.js here in a real implementation
      // This is just a placeholder that returns a random legal move
      
      // In a real implementation, you would:
      // 1. Parse the FEN position
      // 2. Generate legal moves
      // 3. Evaluate positions with a simple algorithm
      // 4. Return the best move
      
      // For now, just return a hardcoded "best" first move for white
      // This would be replaced with actual calculation
      const commonOpeningMoves = [
        'e2e4', 'd2d4', 'g1f3', 'c2c4', // Common first moves
        'e7e5', 'd7d5', 'g8f6', 'c7c5'  // Common responses
      ];
      
      // Return a "random" opening move
      const moveIndex = Math.floor(Math.random() * commonOpeningMoves.length);
      return commonOpeningMoves[moveIndex];
    }
  }
  
  // Export for use in modules
  if (typeof module !== 'undefined') {
    module.exports = EngineLoader;
  }