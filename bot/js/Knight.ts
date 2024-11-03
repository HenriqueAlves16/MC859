import { Piece } from './Piece.js';
import { Square } from './Square.js';
import { Board } from './Board.js';

export class Knight extends Piece {
    static MOVE_PATTERNS = [
        { row: 2, column: 1 },   // move 2 squares up and 1 square right
        { row: 2, column: -1 },  // move 2 squares up and 1 square left
        { row: -2, column: 1 },  // move 2 squares down and 1 square right
        { row: -2, column: -1 }, // move 2 squares down and 1 square left
        { row: 1, column: 2 },   // move 1 square up and 2 squares right
        { row: 1, column: -2 },  // move 1 square up and 2 squares left
        { row: -1, column: 2 },  // move 1 square down and 2 squares right
        { row: -1, column: -2 }  // move 1 square down and 2 squares left
    ];

    constructor(color: number, square: Square) {
        if (color === -1) {
            super(color, square, "images\\black_knight.png", -300);
        } else {
            super(color, square, "images\\white_knight.png", 300);
        }
        this.middleGameHeatMap = [
            [-50,-40,-30,-30,-30,-30,-40,-50],
            [-40,-20,  0,  0,  0,  0,-20,-40],
            [-30,  0, 10, 15, 15, 10,  0,-30],
            [-30,  5, 15, 20, 20, 15,  5,-30],
            [-30,  0, 15, 20, 20, 15,  0,-30],
            [-30,  5, 10, 15, 15, 10,  5,-30],
            [-40,-20,  0,  5,  5,  0,-20,-40],
            [-50,-40,-30,-30,-30,-30,-40,-50],
        ]
        if (color === 1) {
            this.middleGameHeatMap = this.middleGameHeatMap.reverse();
        } else {
            this.middleGameHeatMap = this.middleGameHeatMap.map(row => 
                row.map(value => -value)
            );
        }
    }

    updateMoves(board: Board, pinnedPieces: Map<Piece, { row: number, column: number }>) {
        this.unregisterControlSquares(board);
        this.influenceSquares = new Set<Square>();
        let noCaptureMoves: Set<Square> = new Set<Square>();
        let captures: Set<Square> = new Set<Square>();
    
        if (pinnedPieces.has(this)) {
            this.clearMoves();
            return [0, 0];
        }
    
        const isInCheck = board.isKingInCheck(this.color);
        const startTimeMainLoop = Date.now();
    
        if (isInCheck) {
            this.calculateMovesInCheck(board, noCaptureMoves, captures);
        } else {
            this.calculateNormalMoves(board, noCaptureMoves, captures);
        }
    
        const endTimeMainLoop = Date.now();
        const timeMainLoop = endTimeMainLoop - startTimeMainLoop;
    
        this.registerControlSquares(board);
        this.setNoCaptureMoves(noCaptureMoves);
        this.setCaptures(captures);
        this.setAllPossibleMoves(new Set<Square>([...noCaptureMoves, ...captures]));
    
        return [timeMainLoop, 0];
    }
    
    private clearMoves() {
        this.setNoCaptureMoves(new Set<Square>());
        this.setCaptures(new Set<Square>());
        this.setAllPossibleMoves(new Set<Square>());
    }

    private calculateNormalMoves(board: Board, noCaptureMoves: Set<Square>, captures: Set<Square>) {
        for (const move of Knight.MOVE_PATTERNS) {
            const row = this.square.row + move.row;
            const column = this.square.column + move.column;
    
            if (Board.isValidSquare(row, column)) {
                const targetSquare = board.getSquare(row, column);
                this.influenceSquares.add(targetSquare);
    
                if (!targetSquare.occupied_by) {
                    noCaptureMoves.add(targetSquare);
                } else if (targetSquare.occupied_by.getColor() !== this.color) {
                    captures.add(targetSquare);
                }
            }
        }
    }

    private calculateMovesInCheck(board: Board, noCaptureMoves: Set<Square>, captures: Set<Square>) {
        const blockingSquares = board.getBlockingSquaresForCheck(this.color);
    
        for (const move of Knight.MOVE_PATTERNS) {
            const row = this.square.row + move.row;
            const column = this.square.column + move.column;
    
            if (Board.isValidSquare(row, column)) {
                const targetSquare = board.getSquare(row, column);
                this.influenceSquares.add(targetSquare);
    
                if (blockingSquares.has(targetSquare)) {
                    if (!targetSquare.occupied_by) {
                        noCaptureMoves.add(targetSquare);
                    } else if (targetSquare.occupied_by.getColor() !== this.color) {
                        captures.add(targetSquare);
                    }
                }
            }
        }
    }    

    registerControlSquares(board: Board) {
        const mapControlSquares = this.color === 1 ? board.squaresAttackedByWhite : board.squaresAttackedByBlack;

        this.influenceSquares.forEach( square => {
            mapControlSquares.get(square)?.add(this.square);
        });
    }

    unregisterControlSquares(board: Board) {
        const mapControlSquares = this.color === 1 ? board.squaresAttackedByWhite : board.squaresAttackedByBlack;

        this.influenceSquares.forEach( square => {
            (mapControlSquares.get(square) as Set<Square>).delete(this.square);
        });
    }

    isAffectedByMove(piece: Piece, square: Square): boolean {
        const knightRow = this.getSquare().row;
        const knightColumn = this.getSquare().column;

        const dx = Math.abs(square.row - knightRow);
        const dy = Math.abs(square.column - knightColumn);
        return (dx === 2 && dy === 1) || (dx === 1 && dy === 2);
    }
}
