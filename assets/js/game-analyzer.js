/**
 * Chess Tutor - Game Analyzer
 * 
 * This file provides functionality to analyze a completed chess game,
 * identifying key moments, mistakes, and learning opportunities.
 */

class GameAnalyzer {
    constructor() {
      this.game = null;
      this.engine = null;
      this.analysisDepth = 18;
      this.positions = [];
      this.annotations = [];
      this.keyMoments = [];
      this.currentIndex = 0;
      
      // Create analysis engine if not already available
      if (!window.analyzeEngine) {
        this.engine = new ChessEngine('analyzer');
        this.engine.initialize();
      } else {
        this.engine = window.analyzeEngine;
      }
    }
    
    /**
     * Load a game for analysis
     * @param {Chess} game - Chess.js game to analyze
     */
    loadGame(game) {
      this.game = new Chess();
      this.positions = [];
      this.annotations = [];
      this.keyMoments = [];
      
      // Store starting position
      this.positions.push({
        fen: this.game.fen(),
        move: null,
        moveNumber: 0,
        algebraic: null
      });
      
      // Replay the game to store each position
      const history = game.history({ verbose: true });
      
      for (let i = 0; i < history.length; i++) {
        const move = history[i];
        this.game.move(move);
        
        this.positions.push({
          fen: this.game.fen(),
          move: move.from + move.to + (move.promotion || ''),
          moveNumber: Math.floor(i / 2) + 1,
          algebraic: move.san
        });
      }
      
      return this.positions.length;
    }
    
    /**
     * Analyze all positions in the game
     * @param {Function} progressCallback - Called with progress updates
     * @returns {Promise} - Resolves when analysis is complete
     */
    async analyzeGame(progressCallback) {
      this.annotations = new Array(this.positions.length).fill(null);
      this.keyMoments = [];
      
      // Analyze each position
      for (let i = 0; i < this.positions.length; i++) {
        const position = this.positions[i];
        
        // Skip starting position
        if (i === 0) {
          this.annotations[i] = {
            fen: position.fen,
            evaluation: 0,
            bestMove: null,
            depth: 0,
            comment: "Starting position"
          };
          continue;
        }
        
        // Analyze this position
        const annotation = await this.analyzePosition(position.fen, position.move);
        
        // Store the annotation
        this.annotations[i] = annotation;
        
        // Check if this is a key moment
        if (this.isKeyMoment(annotation, i)) {
          this.keyMoments.push(i);
        }
        
        // Report progress
        if (progressCallback) {
          progressCallback({
            current: i + 1,
            total: this.positions.length,
            position: position,
            annotation: annotation
          });
        }
      }
      
      return {
        annotations: this.annotations,
        keyMoments: this.keyMoments
      };
    }
    
    /**
     * Analyze a single position
     * @param {string} fen - FEN string of the position
     * @param {string} actualMove - The move that was played (UCI format)
     * @returns {Promise} - Resolves to the annotation object
     */
    analyzePosition(fen, actualMove) {
      return new Promise((resolve) => {
        // Create a new engine instance if needed
        const engine = this.engine;
        
        // Set position and start analysis
        engine.setPosition(fen);
        
        // Store the evaluation
        let evaluation = {
          fen: fen,
          depth: 0,
          evaluation: 0,
          bestMove: null,
          pv: [],
          actualMove: actualMove
        };
        
        // Set up callback for analysis results
        engine.onAnalysis = (info) => {
          if (info.depth >= evaluation.depth) {
            evaluation.depth = info.depth;
            evaluation.evaluation = info.score;
            evaluation.pv = info.pv;
            evaluation.bestMove = info.pv && info.pv.length > 0 ? info.pv[0] : null;
          }
          
          // When we reach target depth, stop and resolve
          if (info.depth >= this.analysisDepth) {
            engine.stopCalculation();
            
            // Create an annotation with the analysis
            const annotation = this.createAnnotation(evaluation, actualMove);
            resolve(annotation);
          }
        };
        
        // Start analysis
        engine.analyzePosition(this.analysisDepth);
        
        // Set a timeout to ensure we don't wait forever
        setTimeout(() => {
          engine.stopCalculation();
          const annotation = this.createAnnotation(evaluation, actualMove);
          resolve(annotation);
        }, 5000);
      });
    }
    
    /**
     * Create a annotation from engine evaluation
     */
    createAnnotation(evaluation, actualMove) {
      // Convert Chess.js-style move to UCI if needed
      if (actualMove && !actualMove.match(/^[a-h][1-8][a-h][1-8][qrbn]?$/)) {
        // This is not a UCI move, so we need to convert it
        // This would require additional logic in a real implementation
      }
      
      // Get the evaluation in centipawns
      const score = evaluation.evaluation;
      
      // Get the best move
      const bestMove = evaluation.bestMove;
      
      // Create the annotation
      const annotation = {
        fen: evaluation.fen,
        evaluation: score,
        bestMove: bestMove,
        depth: evaluation.depth,
        actualMove: actualMove,
        mistakeLevel: 0,
        comment: ""
      };
      
      // Determine if the actual move was a mistake
      if (actualMove && bestMove && actualMove !== bestMove) {
        // Calculate how much worse the played move is
        // We need to analyze the position after the played move
        // This is simplified - a real implementation would analyze both positions
        
        const errorMargin = Math.abs(score) * 0.1 + 10; // Allow some margin of error
        
        if (Math.abs(score) > 1000) {
          // It's a mate sequence, any deviation is a major mistake
          annotation.mistakeLevel = 3;
          annotation.comment = "Missed checkmate sequence";
        }
        else if (Math.abs(score) > 200 && Math.abs(score) > errorMargin) {
          // Significant advantage missed or blunder
          annotation.mistakeLevel = 3;
          annotation.comment = "Major mistake";
        }
        else if (Math.abs(score) > 80 && Math.abs(score) > errorMargin) {
          // Moderate advantage missed
          annotation.mistakeLevel = 2;
          annotation.comment = "Mistake";
        }
        else if (Math.abs(score) > 40 && Math.abs(score) > errorMargin) {
          // Slight advantage missed
          annotation.mistakeLevel = 1;
          annotation.comment = "Inaccuracy";
        }
        else {
          // Within reasonable margin - not a significant mistake
          annotation.mistakeLevel = 0;
          annotation.comment = "Reasonable move";
        }
      } else if (!actualMove) {
        // Initial position or no move played
        annotation.comment = "Position evaluation";
      } else {
        // Best move was played
        annotation.comment = "Excellent move";
      }
      
      return annotation;
    }
    
    /**
     * Determine if a position is a key moment in the game
     */
    isKeyMoment(annotation, positionIndex) {
      if (!annotation) return false;
      
      // Key moments include:
      // 1. Significant mistakes (mistakeLevel >= 2)
      // 2. Critical positions (e.g., material captures, checks)
      // 3. Major evaluation swings
      
      // Check for mistakes
      if (annotation.mistakeLevel >= 2) {
        return true;
      }
      
      // Check for evaluation swings
      if (positionIndex > 1 && this.annotations[positionIndex - 1]) {
        const prevEval = this.annotations[positionIndex - 1].evaluation;
        const currEval = annotation.evaluation;
        
        // If evaluation changed by more than 100 centipawns
        if (Math.abs(currEval - prevEval) > 100) {
          return true;
        }
      }
      
      // More sophisticated checks could be added here
      
      return false;
    }
    
    /**
     * Get a summary of the game analysis
     */
    getGameSummary() {
      let summary = {
        totalPositions: this.positions.length - 1, // Exclude starting position
        whiteInaccuracies: 0,
        whiteMistakes: 0,
        whiteMajorMistakes: 0,
        blackInaccuracies: 0,
        blackMistakes: 0,
        blackMajorMistakes: 0,
        averageEvaluation: 0,
        keyMoments: this.keyMoments.length
      };
      
      // Count mistakes by each side
      for (let i = 1; i < this.annotations.length; i++) {
        const annotation = this.annotations[i];
        if (!annotation) continue;
        
        // Determine if white or black moved
        const isWhiteMove = (i % 2 === 1);
        
        if (annotation.mistakeLevel === 1) {
          if (isWhiteMove) {
            summary.whiteInaccuracies++;
          } else {
            summary.blackInaccuracies++;
          }
        } else if (annotation.mistakeLevel === 2) {
          if (isWhiteMove) {
            summary.whiteMistakes++;
          } else {
            summary.blackMistakes++;
          }
        } else if (annotation.mistakeLevel === 3) {
          if (isWhiteMove) {
            summary.whiteMajorMistakes++;
          } else {
            summary.blackMajorMistakes++;
          }
        }
        
        // Accumulate evaluation for average
        summary.averageEvaluation += annotation.evaluation;
      }
      
      // Calculate average evaluation
      summary.averageEvaluation /= (this.annotations.length - 1);
      
      return summary;
    }
    
    /**
     * Get explanation for a specific position
     */
    getPositionExplanation(index) {
      if (index < 0 || index >= this.positions.length) {
        return "Invalid position index";
      }
      
      const position = this.positions[index];
      const annotation = this.annotations[index];
      
      if (!annotation) {
        return "Position not analyzed";
      }
      
      let explanation = "";
      
      // Add move information
      if (index > 0) {
        const moveNum = Math.floor((index + 1) / 2);
        const isWhite = (index % 2 === 1);
        
        explanation += `Move ${moveNum}${isWhite ? '.' : '...'} ${position.algebraic}: `;
      } else {
        explanation += "Starting position: ";
      }
      
      // Add evaluation
      const evalScore = annotation.evaluation;
      
      if (Math.abs(evalScore) > 10000) {
        // It's a forced mate
        const mateIn = Math.ceil((20000 - Math.abs(evalScore)) / 10);
        explanation += evalScore > 0 ?
          `White has mate in ${mateIn}. ` :
          `Black has mate in ${mateIn}. `;
      } else if (Math.abs(evalScore) > 500) {
        // Decisive advantage
        explanation += evalScore > 0 ?
          "White has a decisive advantage. " :
          "Black has a decisive advantage. ";
      } else if (Math.abs(evalScore) > 200) {
        // Clear advantage
        explanation += evalScore > 0 ?
          "White has a clear advantage. " :
          "Black has a clear advantage. ";
      } else if (Math.abs(evalScore) > 50) {
        // Slight advantage
        explanation += evalScore > 0 ?
          "White has a slight advantage. " :
          "Black has a slight advantage. ";
      } else {
        // Roughly equal
        explanation += "The position is approximately equal. ";
      }
      
      // Add specific comments based on move quality
      if (index > 0) {
        if (annotation.mistakeLevel === 3) {
          explanation += "This was a major mistake. ";
          
          if (annotation.bestMove) {
            // Convert best move to SAN format
            const tempGame = new Chess(position.fen);
            const from = annotation.bestMove.substring(0, 2);
            const to = annotation.bestMove.substring(2, 4);
            const promotion = annotation.bestMove.length > 4 ? annotation.bestMove[4] : undefined;
            
            const moveObj = {
              from: from,
              to: to,
              promotion: promotion
            };
            
            const bestMoveSan = tempGame.move(moveObj);
            
            explanation += `The best move was ${bestMoveSan.san}. `;
          }
        } else if (annotation.mistakeLevel === 2) {
          explanation += "This was a mistake. ";
        } else if (annotation.mistakeLevel === 1) {
          explanation += "This was an inaccuracy. ";
        } else {
          explanation += "This was a good move. ";
        }
        
        // Add strategic explanation using the move explainer
        if (window.explainMove) {
          try {
            // Create a game instance with the previous position
            const prevGame = new Chess(this.positions[index - 1].fen);
            const move = { 
              from: position.move.substring(0, 2),
              to: position.move.substring(2, 4),
              promotion: position.move.length > 4 ? position.move[4] : undefined
            };
            
            // Get explanation
            const detailedExplanation = window.explainMove(prevGame, move, {
              score: annotation.evaluation,
              pv: annotation.bestMove ? [annotation.bestMove] : []
            });
            
            explanation += detailedExplanation;
          } catch (e) {
            console.error("Error generating move explanation:", e);
          }
        }
      }
      
      return explanation;
    }
    
    /**
     * Get formatted summary for the post-game report
     */
    getFormattedSummary() {
      const summary = this.getGameSummary();
      
      let text = "## Game Analysis Summary\n\n";
      
      // Add overall assessment
      if (Math.abs(summary.averageEvaluation) < 50) {
        text += "This was a closely contested game with both sides playing well.\n\n";
      } else if (summary.averageEvaluation > 0) {
        text += "White had an advantage for most of the game.\n\n";
      } else {
        text += "Black had an advantage for most of the game.\n\n";
      }
      
      // Add mistake counts
      text += "### Mistakes Analysis\n\n";
      text += `White made ${summary.whiteInaccuracies} inaccuracies, ${summary.whiteMistakes} mistakes, and ${summary.whiteMajorMistakes} major mistakes.\n`;
      text += `Black made ${summary.blackInaccuracies} inaccuracies, ${summary.blackMistakes} mistakes, and ${summary.blackMajorMistakes} major mistakes.\n\n`;
      
      // Add key moments
      text += "### Key Moments\n\n";
      if (this.keyMoments.length === 0) {
        text += "No critical turning points were identified.\n\n";
      } else {
        text += `There were ${this.keyMoments.length} key moments that significantly affected the game outcome:\n\n`;
        
        // List the first few key moments
        for (let i = 0; i < Math.min(3, this.keyMoments.length); i++) {
          const momentIndex = this.keyMoments[i];
          const position = this.positions[momentIndex];
          const annotation = this.annotations[momentIndex];
          
          const moveNum = Math.floor((momentIndex + 1) / 2);
          const isWhite = (momentIndex % 2 === 1);
          
          text += `- Move ${moveNum}${isWhite ? '.' : '...'} ${position.algebraic}: `;
          text += annotation.comment + "\n";
        }
        
        if (this.keyMoments.length > 3) {
          text += "\n(Additional key moments are available in the detailed analysis)\n";
        }
      }
      
      // Add improvement suggestions
      text += "\n### Improvement Suggestions\n\n";
      
      if (summary.whiteMajorMistakes + summary.whiteMistakes > summary.blackMajorMistakes + summary.blackMistakes) {
        text += "White should focus on: ";
      } else {
        text += "Black should focus on: ";
      }
      
      // Check which types of mistakes were most common
      // This is a simplification - a real implementation would analyze mistake patterns
      text += "Reviewing opening principles and tactical awareness.\n\n";
      
      // Add encouraging conclusion
      text += "Keep practicing and analyzing your games to improve your chess skills!";
      
      return text;
    }
    
    /**
     * Get a specific position from the analysis
     */
    getPosition(index) {
      if (index < 0 || index >= this.positions.length) {
        return null;
      }
      
      return {
        position: this.positions[index],
        annotation: this.annotations[index]
      };
    }
    
    /**
     * Navigate to a specific position in the analysis
     */
    navigateTo(index) {
      if (index < 0 || index >= this.positions.length) {
        return false;
      }
      
      this.currentIndex = index;
      return this.getPosition(index);
    }
    
    /**
     * Navigate to the next position
     */
    nextPosition() {
      return this.navigateTo(this.currentIndex + 1);
    }
    
    /**
     * Navigate to the previous position
     */
    previousPosition() {
      return this.navigateTo(this.currentIndex - 1);
    }
    
    /**
     * Navigate to the next key moment
     */
    nextKeyMoment() {
      for (const keyIndex of this.keyMoments) {
        if (keyIndex > this.currentIndex) {
          return this.navigateTo(keyIndex);
        }
      }
      
      return false;
    }
  }
  
  // Make class available globally
  window.GameAnalyzer = GameAnalyzer;