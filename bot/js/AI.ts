import { Board } from './Board.js';
import { Move } from './Move.js';

export class AI {
    private board: Board;

    constructor(board: Board) {
        this.board = board;
    }

    evaluate(): number {
        if (this.board.isCheckmate()) {
            return -Infinity;
        } else if (this.board.isStalemate()) {
            return 0;
        }

        let evaluation: number = 0;
        this.board.allPieces.forEach(piece => {
            evaluation += piece.getValue();
            evaluation += piece.getPositionEvaluation();
        });
        evaluation += 3 * this.board.pieceMobilityBalance();
        evaluation += 10 * this.board.kingSafetyBalance();

        return evaluation;
    }

    public makeRandomMove() {
        const moves: Move[] = Array.from(this.board.getValidMoves());
        
        if (moves.length === 0) {
            return;
        }
    
        const randomIndex = Math.floor(Math.random() * moves.length);
        const chosenMove = moves[randomIndex];
    
        this.board.makeMove(chosenMove, 1);
    }   

    public makeMinimaxMove() {
        const bestMove = this.mini(2)[1];
        if (bestMove) {
            this.board.makeMove(bestMove, 2);
        }
    }

    public maxi(depth: number): [number, Move | null] {
        if (depth === 0) {
            return [this.evaluate(), null];
        }
    
        const validMoves = Array.from(this.board.getValidMoves());
        let max = -Infinity;
        let bestMove: Move | null = null;
    
        for (const move of validMoves) {
            this.board.makeMove(move, 2);
            const score = this.mini(depth - 1)[0];
            this.board.undoMove();
    
            if (score > max) {
                max = score;
                bestMove = move;
            }
        }
    
        return [max, bestMove];
    }
    
    public mini(depth: number): [number, Move | null] {
        if (depth === 0) {
            return [this.evaluate(), null];
        }
    
        const validMoves = Array.from(this.board.getValidMoves());
        let min = Infinity;
        let bestMove: Move | null = null;
    
        for (const move of validMoves) {
            this.board.makeMove(move, 2);
            const score = this.maxi(depth - 1)[0];
            this.board.undoMove();
    
            if (score < min) {
                min = score;
                bestMove = move;
            }
        }
    
        return [min, bestMove];
    }
    
    public makeAlfabetaMove(maxDepth: number) {
        const alfabeta = this.alfabeta(this.board, maxDepth, -Infinity, Infinity);
        const evalu = alfabeta[0];
        const bestMove = alfabeta[1];
        
        if (bestMove) {
            this.board.makeMove(bestMove, 3);
        }
    }
    
    public alfabeta(board: Board, depth: number, a: number, b: number): [number, Move | null] {
        let bestScore = board.getTurn() === 1 ? -Infinity : Infinity;
        let bestMove: Move | null = null;
        const validMoves = Array.from(this.board.getValidMoves());
        const prioritizedMoves = this.prioritizeMoves(validMoves);

        if (depth === 0) {
            return [board.evaluation, bestMove];            
        }

        if (board.isCheckmate()) {
            return [-board.getTurn() * Infinity, null];
        } else if (board.isStalemate()) {
            return [0, null];
        }

        if (board.getTurn() === 1) {
            for (const move of prioritizedMoves) {
                this.board.makeMove(move, 3);
                const moveEval = this.alfabeta(board, depth - 1, a, b)[0];
                this.board.undoMove();              

                if (moveEval > bestScore) {
                    bestScore = moveEval;
                    bestMove = move;
                }
                
                if (bestScore >= b) {
                    break;
                }
                a = Math.max(a, bestScore);
            }
        } else {
            for (const move of prioritizedMoves) {
                this.board.makeMove(move, 3);

                const moveEval = this.alfabeta(board, depth - 1, a, b)[0];
                this.board.undoMove();

                if (moveEval < bestScore) {
                    bestScore = moveEval;
                    bestMove = move;
                }
                
                if (bestScore <= a) {
                    break;
                }
                b = Math.min(b, bestScore);
            }
        }
        return [bestScore, bestMove];
    }

    private prioritizeMoves(validMoves: Move[]): Move[] {
        const sortedMoves = validMoves.sort((moveA, moveB) => {
            const pieceA = moveA.getFinalSquare().getPiece();
            const pieceB = moveB.getFinalSquare().getPiece();
    
            const valueA = pieceA ? pieceA.getValue() : 0;
            const valueB = pieceB ? pieceB.getValue() : 0;
    
            if (moveA.isCapture() && moveB.isCapture()) {
                return (valueB - moveB.pieceMoved.getValue()) - (valueA - moveA.pieceMoved.getValue());
            }

            return 0;
        });
        return sortedMoves;
    }
}
