/**
 * Chess Tutor - Stockfish Engine Interface
 * 
 * This file provides an interface to interact with the Stockfish chess engine.
 * It supports analyzing positions, making moves, and adjusting engine strength.
 */

class ChessEngine {
    constructor(instanceName = 'default') {
      this.instanceName = instanceName;
      this.engine = null;
      this.isReady = false;
      this.onReady = null;
      this.onAnalysis = null;
      this.onMove = null;
    }
  
    initialize(callback) {
      // Initialize the engine
      try {
        this.engine = typeof Stockfish === 'function' ? Stockfish() : new Worker('assets/js/stockfish.js');
        
        // Set up message handling
        this.engine.onmessage = (event) => {
          const message = event.data;
          
          // Log engine output (for debugging)
          console.log(`${this.instanceName} Engine: ${message}`);
          
          // Handle "bestmove" messages for move generation
          if (message.startsWith('bestmove')) {
            const moveMatch = message.match(/bestmove\s+(\w+)/);
            if (moveMatch && this.onMove) {
              this.onMove(moveMatch[1]);
            }
          }
          
          // Handle analysis info for position evaluation
          else if (message.startsWith('info') && message.includes('score')) {
            const infoData = this.parseInfo(message);
            if (this.onAnalysis && infoData.score !== undefined) {
              this.onAnalysis(infoData);
            }
          }
          
          // Handle readyok message for initialization
          else if (message.includes('readyok')) {
            this.isReady = true;
            if (this.onReady) {
              this.onReady();
            }
            if (callback) {
              callback();
            }
          }
        };
        
        // Initialize the engine with standard settings
        this.sendCommand('uci');
        this.sendCommand('setoption name Hash value 32');
        this.sendCommand('setoption name Threads value 4');
        this.sendCommand('isready');
      } catch (error) {
        console.error(`Error initializing ${this.instanceName} engine:`, error);
        alert('Could not initialize chess engine. Please check your browser compatibility.');
      }
    }
    
    // Send a command to the engine
    sendCommand(command) {
      if (!this.engine) {
        console.error(`${this.instanceName} engine not initialized`);
        return;
      }
      
      console.log(`To ${this.instanceName} Engine: ${command}`);
      this.engine.postMessage(command);
    }
    
    // Set the position for the engine to analyze
    setPosition(fen) {
      this.sendCommand(`position fen ${fen}`);
    }
    
    // Set a position from move history
    setPositionFromMoves(moves = []) {
      if (moves.length === 0) {
        this.sendCommand('position startpos');
      } else {
        this.sendCommand(`position startpos moves ${moves.join(' ')}`);
      }
    }
    
    // Ask the engine to find the best move
    findBestMove(moveTime = 1000) {
      this.sendCommand(`go movetime ${moveTime}`);
    }
    
    // Analyze a position at specified depth
    analyzePosition(depth = 18, multipv = 1) {
      this.sendCommand(`go depth ${depth} multipv ${multipv}`);
    }
    
    // Stop the current calculation
    stopCalculation() {
      this.sendCommand('stop');
    }
    
    // Set engine strength based on ELO rating
    setStrengthByElo(targetElo) {
      // Map ELO ratings to approximate Stockfish skill levels
      let skillLevel;
      
      if (targetElo < 1200) {
        skillLevel = 0;
      } else if (targetElo < 1400) {
        skillLevel = 2;
      } else if (targetElo < 1600) {
        skillLevel = 5;
      } else if (targetElo < 1800) {
        skillLevel = 8;
      } else if (targetElo < 2000) {
        skillLevel = 12;
      } else if (targetElo < 2200) {
        skillLevel = 15;
      } else if (targetElo < 2400) {
        skillLevel = 18;
      } else {
        skillLevel = 20;
      }
      
      // Set the skill level in Stockfish
      this.sendCommand(`setoption name Skill Level value ${skillLevel}`);
      
      // Also limit search depth based on ELO
      const maxDepth = Math.min(5 + Math.floor((targetElo - 1000) / 200), 20);
      this.sendCommand(`setoption name Maximum Thinking Depth value ${maxDepth}`);
      
      return skillLevel;
    }
    
    // Parse the info string from Stockfish for useful data
    parseInfo(infoString) {
      const result = {
        depth: undefined,
        score: undefined,
        scoreType: 'cp',
        pv: []
      };
      
      // Extract depth
      const depthMatch = infoString.match(/depth (\d+)/);
      if (depthMatch) {
        result.depth = parseInt(depthMatch[1]);
      }
      
      // Extract score
      const scoreMatch = infoString.match(/score (cp|mate) (-?\d+)/);
      if (scoreMatch) {
        result.scoreType = scoreMatch[1];
        result.score = parseInt(scoreMatch[2]);
        
        // Convert mate score to centipawns for consistency
        if (result.scoreType === 'mate') {
          // Use a large value to represent mate, with sign indicating which side
          result.score = result.score > 0 ? 
            10000 - result.score * 10 : 
            -10000 - result.score * 10;
        }
      }
      
      // Extract principal variation (PV)
      const pvMatch = infoString.match(/pv (.+?)(?= bmc| $| [a-z][a-z])/);
      if (pvMatch) {
        result.pv = pvMatch[1].trim().split(' ');
      }
      
      return result;
    }
    
    // Convert a UCI move to SAN format
    uciToSan(uciMove, game) {
      const from = uciMove.substring(0, 2);
      const to = uciMove.substring(2, 4);
      const promotion = uciMove.length > 4 ? uciMove[4] : undefined;
      
      const moveObj = {
        from: from,
        to: to,
        promotion: promotion
      };
      
      // Use chess.js to generate SAN
      const move = game.move(moveObj);
      
      // Undo the move to restore the position
      game.undo();
      
      return move ? move.san : uciMove;
    }
    
    // Clean up resources when done
    destroy() {
      if (this.engine && this.engine.terminate) {
        this.engine.terminate();
      }
      this.engine = null;
    }
  }
  
  // Create global instances for different purposes
  let analyzeEngine = null;  // For position analysis
  let playEngine = null;     // For computer opponent
  
  // Initialize engines when page loads
  document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if Stockfish is available
    if (typeof Stockfish === 'function' || typeof Worker !== 'undefined') {
      // Create analysis engine (max strength)
      analyzeEngine = new ChessEngine('analyzer');
      analyzeEngine.initialize(() => {
        console.log('Analysis engine ready');
        
        // Update any UI elements to show engine is ready
        const explainButtons = document.querySelectorAll('#explain-move');
        explainButtons.forEach(button => {
          button.disabled = false;
        });
      });
      
      // Create play engine (adjustable strength) if on practice page
      if (window.location.pathname.includes('practice.html')) {
        playEngine = new ChessEngine('opponent');
        playEngine.initialize(() => {
          console.log('Play engine ready');
          
          // Set default strength
          playEngine.setStrengthByElo(1500);
          
          // Enable start game button
          const startGameButton = document.getElementById('start-game');
          if (startGameButton) {
            startGameButton.disabled = false;
          }
        });
      }
    } else {
      console.warn('Stockfish not available');
      alert('Chess engine not available in your browser. Some features may not work.');
    }
  });
  
  // Clean up engines when page unloads
  window.addEventListener('beforeunload', function() {
    if (analyzeEngine) {
      analyzeEngine.destroy();
    }
    if (playEngine) {
      playEngine.destroy();
    }
  });