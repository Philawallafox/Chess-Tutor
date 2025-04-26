/**
 * Chess Tutor - Move Explainer
 * 
 * This file provides functionality to explain chess moves in human-readable language.
 * It translates engine evaluations and move sequences into clear explanations.
 */

// Store templates for different types of explanations
const moveTemplates = {
    capture: "{pieceType} captures the {capturedPiece} on {square}, gaining material advantage of {value}.",
    
    develop: "{pieceType} moves to {square}, improving piece development and {additionalBenefit}.",
    
    controlCenter: "{pieceType} to {square} strengthens control over the central squares, particularly {controlledSquares}.",
    
    createThreat: "{pieceType} to {square} creates a threat against {targetPiece}, forcing {likelyResponse}.",
    
    defensive: "{pieceType} to {square} protects {protectedPiece} from the threat of {threatDescription}.",
    
    fork: "{pieceType} to {square} creates a fork, simultaneously attacking {targets}.",
    
    pin: "{pieceType} to {square} pins the {pinnedPiece} against their {valuablePiece}, restricting its movement.",
    
    attack: "{pieceType} to {square} attacks {targets}, creating pressure that's difficult to defend against.",
    
    improvement: "{pieceType} to {square} is a positional improvement, {improvementReason}.",
    
    castling: "Castling {side} places the king in safety and connects the rooks, preparing for {followupAction}.",
    
    check: "{pieceType} to {square} delivers check to the opponent's king, forcing them to respond immediately.",
    
    mate: "{pieceType} to {square} delivers checkmate! The opponent's king is attacked and has no legal moves.",
    
    promotion: "The pawn advances to {square} and promotes to a {promotionPiece}, gaining a significant material advantage."
  };
  
  // Map UCI piece letters to readable names
  const pieceNames = {
    p: "pawn",
    n: "knight",
    b: "bishop",
    r: "rook",
    q: "queen",
    k: "king"
  };
  
  // Map piece values for material calculation
  const pieceValues = {
    p: 1,
    n: 3,
    b: 3,
    r: 5,
    q: 9,
    k: 0
  };
  
  // Central squares for referencing
  const centralSquares = ['d4', 'e4', 'd5', 'e5', 'c3', 'f3', 'c6', 'f6'];
  
  /**
   * Main function to explain a chess move in human language
   */
  function explainMove(game, move, engineEvaluation) {
    // Create a copy of the game to analyze the position before the move
    const gameCopy = new Chess(game.fen());
    
    // Get details about the move and position
    const moveDetails = analyzeMoveDetails(gameCopy, move);
    
    // Choose the most appropriate template based on move characteristics
    let template;
    let templateVars = {};
    
    // First check for special moves and tactical motifs
    if (moveDetails.isCheckmate) {
      template = moveTemplates.mate;
      templateVars = {
        pieceType: capitalizeFirst(moveDetails.movingPiece),
        square: moveDetails.endSquare
      };
    }
    else if (moveDetails.isCheck) {
      template = moveTemplates.check;
      templateVars = {
        pieceType: capitalizeFirst(moveDetails.movingPiece),
        square: moveDetails.endSquare
      };
    }
    else if (moveDetails.isPromotion) {
      template = moveTemplates.promotion;
      templateVars = {
        square: moveDetails.endSquare,
        promotionPiece: pieceNames[moveDetails.promotionPiece]
      };
    }
    else if (moveDetails.isCastling) {
      template = moveTemplates.castling;
      templateVars = {
        side: moveDetails.castlingSide,
        followupAction: moveDetails.castlingSide === "kingside" ? 
          "a kingside attack" : "queenside play"
      };
    }
    else if (moveDetails.isCapture) {
      template = moveTemplates.capture;
      templateVars = {
        pieceType: capitalizeFirst(moveDetails.movingPiece),
        capturedPiece: moveDetails.capturedPiece,
        square: moveDetails.endSquare,
        value: moveDetails.captureValue
      };
    }
    else if (moveDetails.tactics.fork) {
      template = moveTemplates.fork;
      templateVars = {
        pieceType: capitalizeFirst(moveDetails.movingPiece),
        square: moveDetails.endSquare,
        targets: formatPieceList(moveDetails.tactics.fork.targets)
      };
    }
    else if (moveDetails.tactics.pin) {
      template = moveTemplates.pin;
      templateVars = {
        pieceType: capitalizeFirst(moveDetails.movingPiece),
        square: moveDetails.endSquare,
        pinnedPiece: moveDetails.tactics.pin.pinnedPiece,
        valuablePiece: moveDetails.tactics.pin.valuablePiece
      };
    }
    else if (moveDetails.tactics.attack && moveDetails.tactics.attack.targets.length > 0) {
      template = moveTemplates.attack;
      templateVars = {
        pieceType: capitalizeFirst(moveDetails.movingPiece),
        square: moveDetails.endSquare,
        targets: formatPieceList(moveDetails.tactics.attack.targets)
      };
    }
    // Strategic motifs
    else if (moveDetails.strategy.development && !gameCopy.history().length > 10) {
      template = moveTemplates.develop;
      templateVars = {
        pieceType: capitalizeFirst(moveDetails.movingPiece),
        square: moveDetails.endSquare,
        additionalBenefit: moveDetails.strategy.development.benefit
      };
    }
    else if (moveDetails.strategy.centerControl) {
      template = moveTemplates.controlCenter;
      templateVars = {
        pieceType: capitalizeFirst(moveDetails.movingPiece),
        square: moveDetails.endSquare,
        controlledSquares: moveDetails.strategy.centerControl.squares.join(", ")
      };
    }
    else if (moveDetails.tactics.threat) {
      template = moveTemplates.createThreat;
      templateVars = {
        pieceType: capitalizeFirst(moveDetails.movingPiece),
        square: moveDetails.endSquare,
        targetPiece: moveDetails.tactics.threat.targetPiece,
        likelyResponse: moveDetails.tactics.threat.likelyResponse
      };
    }
    else if (moveDetails.strategy.defense) {
      template = moveTemplates.defensive;
      templateVars = {
        pieceType: capitalizeFirst(moveDetails.movingPiece),
        square: moveDetails.endSquare,
        protectedPiece: moveDetails.strategy.defense.protectedPiece,
        threatDescription: moveDetails.strategy.defense.threatDescription
      };
    }
    else {
      // Default to general improvement template
      template = moveTemplates.improvement;
      templateVars = {
        pieceType: capitalizeFirst(moveDetails.movingPiece),
        square: moveDetails.endSquare,
        improvementReason: determineImprovementReason(moveDetails, engineEvaluation)
      };
    }
    
    // Fill in the template with values
    let explanation = fillTemplate(template, templateVars);
    
    // Add follow-up information if available from engine evaluation
    if (engineEvaluation && engineEvaluation.pv && engineEvaluation.pv.length > 1) {
      explanation += addFollowupExplanation(game, engineEvaluation.pv);
    }
    
    // Add evaluation context if available
    if (engineEvaluation && engineEvaluation.score !== undefined) {
      explanation += addEvaluationContext(engineEvaluation.score);
    }
    
    return explanation;
  }
  
  /**
   * Analyze details of a chess move to determine its characteristics
   */
  function analyzeMoveDetails(game, moveToAnalyze) {
    // Extract move information
    let from, to, promotion;
    
    if (typeof moveToAnalyze === 'string') {
      // Handle both UCI format (e2e4) and SAN format (e4)
      if (moveToAnalyze.length >= 4 && /^[a-h][1-8][a-h][1-8]/.test(moveToAnalyze)) {
        // UCI format
        from = moveToAnalyze.substring(0, 2);
        to = moveToAnalyze.substring(2, 4);
        promotion = moveToAnalyze.length > 4 ? moveToAnalyze[4] : undefined;
      } else {
        // Try to interpret as SAN
        const move = game.move(moveToAnalyze, {sloppy: true});
        if (move) {
          from = move.from;
          to = move.to;
          promotion = move.promotion;
          game.undo(); // Undo the move to analyze from original position
        } else {
          return {}; // Invalid move
        }
      }
    } else if (moveToAnalyze.from && moveToAnalyze.to) {
      // Already an object with from/to properties
      from = moveToAnalyze.from;
      to = moveToAnalyze.to;
      promotion = moveToAnalyze.promotion;
    } else {
      return {}; // Invalid move format
    }
    
    // Get the moving piece and its type
    const piece = game.get(from);
    if (!piece) return {}; // No piece at from square
    
    const pieceType = piece.type.toLowerCase();
    const pieceColor = piece.color;
    
    // Get the captured piece if any
    const capturedPiece = game.get(to);
    
    // Make the move to analyze the new position
    const move = game.move({
      from: from,
      to: to,
      promotion: promotion || 'q'
    });
    
    if (!move) return {}; // Invalid move
    
    // Build the result object with move details
    const result = {
      startSquare: from,
      endSquare: to,
      movingPiece: pieceNames[pieceType],
      movingPieceColor: pieceColor,
      
      isCapture: !!capturedPiece,
      capturedPiece: capturedPiece ? pieceNames[capturedPiece.type.toLowerCase()] : null,
      captureValue: capturedPiece ? pieceValues[capturedPiece.type.toLowerCase()] : 0,
      
      isCheck: game.in_check(),
      isCheckmate: game.in_checkmate(),
      isPromotion: !!promotion,
      promotionPiece: promotion,
      
      isCastling: move.san === 'O-O' || move.san === 'O-O-O',
      castlingSide: move.san === 'O-O' ? 'kingside' : (move.san === 'O-O-O' ? 'queenside' : null),
      
      tactics: {
        fork: detectFork(game, to, pieceType, pieceColor),
        pin: detectPin(game, to, pieceType, pieceColor),
        attack: detectAttacks(game, to, pieceType, pieceColor),
        threat: detectThreats(game, to, pieceType, pieceColor)
      },
      
      strategy: {
        development: assessDevelopment(game, from, to, pieceType, pieceColor),
        centerControl: assessCenterControl(game, from, to, pieceType, pieceColor),
        defense: assessDefensiveMove(game, from, to, pieceType, pieceColor)
      }
    };
    
    // Undo the move to restore the original position
    game.undo();
    
    return result;
  }
  
  /**
   * Detect if a move creates a fork
   */
  function detectFork(game, square, pieceType, pieceColor) {
    // Get all pieces attacked by the piece on 'square'
    const targets = [];
    
    // Check each square on the board for opponent pieces
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const targetSquare = String.fromCharCode(97 + col) + (8 - row);
        const targetPiece = game.get(targetSquare);
        
        // If the square has an opponent's piece
        if (targetPiece && targetPiece.color !== pieceColor) {
          // Check if our piece attacks this square
          if (isAttacked(game, targetSquare, pieceColor)) {
            targets.push({
              square: targetSquare, 
              piece: pieceNames[targetPiece.type.toLowerCase()]
            });
          }
        }
      }
    }
    
    // It's a fork if attacking 2+ pieces
    if (targets.length >= 2) {
      return {
        targets: targets
      };
    }
    
    return null;
  }
  
  /**
   * Detect if a move creates a pin
   */
  function detectPin(game, square, pieceType, pieceColor) {
    // Pins are usually created by bishops, rooks, and queens
    if (pieceType !== 'b' && pieceType !== 'r' && pieceType !== 'q') {
      return null;
    }
    
    // Placeholder - a full pin detection is complex
    // In a real implementation, we would check rays from this piece
    // to see if it pins an opponent piece against a more valuable one
    
    return null;
  }
  
  /**
   * Detect pieces attacked by this move
   */
  function detectAttacks(game, square, pieceType, pieceColor) {
    // Similar to fork detection, but we don't require multiple targets
    const targets = [];
    
    // Check each square on the board for opponent pieces
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const targetSquare = String.fromCharCode(97 + col) + (8 - row);
        const targetPiece = game.get(targetSquare);
        
        // If the square has an opponent's piece
        if (targetPiece && targetPiece.color !== pieceColor) {
          // Check if our piece attacks this square
          if (isAttacked(game, targetSquare, pieceColor)) {
            targets.push({
              square: targetSquare, 
              piece: pieceNames[targetPiece.type.toLowerCase()]
            });
          }
        }
      }
    }
    
    if (targets.length > 0) {
      return {
        targets: targets
      };
    }
    
    return null;
  }
  
  /**
   * Detect if a move creates threats (potential captures next move)
   */
  function detectThreats(game, square, pieceType, pieceColor) {
    // This would analyze the position to find threatened pieces
    // that the opponent must respond to
    
    // Simplified implementation - check if we attack a piece
    // that isn't adequately defended
    
    return null;
  }
  
  /**
   * Assess if a move improves piece development
   */
  function assessDevelopment(game, fromSquare, toSquare, pieceType, pieceColor) {
    // Development usually means:
    // 1. Moving pieces from back rank to more active squares
    // 2. Not moving the same piece multiple times in the opening
    // 3. Getting the king to safety (castling)
    
    // Example simple check: is this a minor piece moving from its starting square?
    if ((pieceType === 'n' || pieceType === 'b') && 
        ((pieceColor === 'w' && fromSquare[1] === '1') || 
         (pieceColor === 'b' && fromSquare[1] === '8'))) {
      
      return {
        benefit: pieceType === 'n' ? 
          "improving mobility" : 
          "opening diagonals"
      };
    }
    
    return null;
  }
  
  /**
   * Assess if a move improves control of the center
   */
  function assessCenterControl(game, fromSquare, toSquare, pieceType, pieceColor) {
    // Check if the move targets central squares
    const controlledSquares = [];
    
    // For simplicity, check if the piece moves to or attacks central squares
    if (centralSquares.includes(toSquare)) {
      controlledSquares.push(toSquare);
    }
    
    // Check attacks on other central squares
    centralSquares.forEach(square => {
      if (square !== toSquare && isAttacked(game, square, pieceColor)) {
        controlledSquares.push(square);
      }
    });
    
    if (controlledSquares.length > 0) {
      return {
        squares: controlledSquares
      };
    }
    
    return null;
  }
  
  /**
   * Assess if a move is defensive
   */
  function assessDefensiveMove(game, fromSquare, toSquare, pieceType, pieceColor) {
    // Check if this move defends a piece under attack
    // This is a simplified implementation
    
    return null;
  }
  
  /**
   * Determine reason for general positional improvement
   */
  function determineImprovementReason(moveDetails, engineEvaluation) {
    // Fallback explanations based on piece type
    const fallbackReasons = {
      pawn: "advancing the pawn structure",
      knight: "improving the knight's position",
      bishop: "placing the bishop on a more active diagonal",
      rook: "placing the rook on a more active file",
      queen: "repositioning the queen for greater effect",
      king: "improving king safety"
    };
    
    // Use engine evaluation if available
    if (engineEvaluation && engineEvaluation.score) {
      const scoreDiff = engineEvaluation.scoreDiff || 0;
      
      if (scoreDiff > 100) {
        return "creating a significant advantage";
      } else if (scoreDiff > 50) {
        return "gaining a clear advantage";
      } else if (scoreDiff > 20) {
        return "making a slight improvement";
      }
    }
    
    // Fallback to piece-specific reason
    return fallbackReasons[moveDetails.movingPiece] || "improving the position";
  }
  
  /**
   * Add explanation about the follow-up moves
   */
  function addFollowupExplanation(game, pv) {
    if (!pv || pv.length <= 1) return '';
    
    // Create a copy of the game to play out the variation
    const gameCopy = new Chess(game.fen());
    
    // Format the principal variation
    const formattedMoves = [];
    
    for (let i = 0; i < Math.min(5, pv.length); i++) {
      const uciMove = pv[i];
      
      // Convert UCI to a move object
      const from = uciMove.substring(0, 2);
      const to = uciMove.substring(2, 4);
      const promotion = uciMove.length > 4 ? uciMove[4] : undefined;
      
      const moveObj = {
        from: from,
        to: to,
        promotion: promotion
      };
      
      // Try to make the move
      const move = gameCopy.move(moveObj);
      if (!move) break;
      
      // Add formatted SAN
      formattedMoves.push(move.san);
    }
    
      if (formattedMoves.length === 0) return '';
    
    let followupText = ' The best continuation would be ';
    
    if (formattedMoves.length === 1) {
      followupText += formattedMoves[0] + '.';
    } else {
      for (let i = 0; i < formattedMoves.length; i++) {
        if (i === 0) {
          followupText += formattedMoves[i];
        } else if (i === formattedMoves.length - 1) {
          followupText += ' and then ' + formattedMoves[i];
        } else {
          followupText += ', followed by ' + formattedMoves[i];
        }
      }
      followupText += '.';
    }
    
    return followupText;
  }
  
  /**
   * Add context about the evaluation score
   */
  function addEvaluationContext(score) {
    let evalText = '';
    
    // Score is in centipawns, positive is good for white
    const absScore = Math.abs(score);
    
    if (absScore > 10000) {
      // It's a forced mate
      const mateIn = Math.ceil((20000 - absScore) / 10);
      evalText = ` This leads to mate in ${mateIn} moves.`;
    } else if (absScore > 500) {
      // Decisive advantage
      evalText = score > 0 ?
        ' This gives White a decisive advantage.' :
        ' This gives Black a decisive advantage.';
    } else if (absScore > 200) {
      // Clear advantage
      evalText = score > 0 ?
        ' This gives White a clear advantage.' :
        ' This gives Black a clear advantage.';
    } else if (absScore > 50) {
      // Slight advantage
      evalText = score > 0 ?
        ' This gives White a slight advantage.' :
        ' This gives Black a slight advantage.';
    } else {
      // Roughly equal
      evalText = ' The position remains approximately equal.';
    }
    
    return evalText;
  }
  
  /**
   * Check if a square is attacked by the given color
   * This is a helper function that would use chess.js internals
   * or create a custom implementation
   */
  function isAttacked(game, square, attackerColor) {
    // In a real implementation, we would use chess.js built-in methods
    // or implement our own attack detection
    
    // For now, a simplified check:
    // Make a dummy move to the target square and see if it's legal
    try {
      // Find a piece we can move to that square
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const fromSquare = String.fromCharCode(97 + col) + (8 - row);
          const piece = game.get(fromSquare);
          
          // If the square has a piece of the attacker's color
          if (piece && piece.color === attackerColor) {
            // Try to move it to the target square
            const moveObj = {
              from: fromSquare,
              to: square,
              promotion: 'q'
            };
            
            // If the move is legal, the square is attacked
            if (game.move(moveObj, {sloppy: true})) {
              game.undo();
              return true;
            }
          }
        }
      }
      
      return false;
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Format a list of pieces for text explanation
   */
  function formatPieceList(pieces) {
    if (!pieces || pieces.length === 0) return '';
    
    if (pieces.length === 1) {
      if (typeof pieces[0] === 'string') {
        return pieces[0];
      } else {
        return `the ${pieces[0].piece} on ${pieces[0].square}`;
      }
    }
    
    const formattedPieces = pieces.map(p => {
      if (typeof p === 'string') {
        return p;
      } else {
        return `the ${p.piece} on ${p.square}`;
      }
    });
    
    // Join with commas and 'and' for the last item
    const lastPiece = formattedPieces.pop();
    if (formattedPieces.length === 0) {
      return lastPiece;
    }
    
    return formattedPieces.join(', ') + ' and ' + lastPiece;
  }
  
  /**
   * Fill a template string with values
   */
  function fillTemplate(template, vars) {
    return template.replace(/\{([^}]+)\}/g, (match, key) => {
      return vars[key] !== undefined ? vars[key] : match;
    });
  }
  
  /**
   * Capitalize the first letter of a string
   */
  function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  // Export the explainer function for use in other modules
  window.explainMove = explainMove;