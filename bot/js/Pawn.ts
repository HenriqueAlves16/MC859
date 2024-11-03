import { Piece } from './Piece.js';
import { Square } from './Square.js';
import { Board } from './Board.js';
import { Move } from './Move.js';

export class Pawn extends Piece {
    public direction: number;
    private captureDirections;

    constructor(color: number, square: Square) {
        if (color === -1) {
            super(color, square, "images\\black_pawn.png", -100);
        } else {
            super(color, square, "images\\white_pawn.png", 100);
        }

        this.direction = this.color === 1 ? 1 : -1;
        this.middleGameHeatMap =  [
            [0,  0,  0,  0,  0,  0,  0,  0],
            [50, 50, 50, 50, 50, 50, 50, 50],
            [10, 10, 20, 30, 30, 20, 10, 10],
            [5,  5, 10, 25, 25, 10,  5,  5],
            [0,  0,  0, 20, 20,  0,  0,  0],
            [5, -5,-10,  0,  0,-10, -5,  5],
            [5, 10, 10,-20,-20, 10, 10,  5],
            [0,  0,  0,  0,  0,  0,  0,  0],
        ];

        this.captureDirections = [
            { row: this.direction, column: 1 },  // capture to the right
            { row: this.direction, column: -1 }  // capture to the left
        ];
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
        
        if (pinnedPieces.has(this)) {
            const pinDirection = pinnedPieces.get(this);
            this.clearMoves();
    
            this.calculatePinnedCapture(board, pinDirection!);
            return [0, 0];
        }
    
        const isInCheck = board.isKingInCheck(this.color);
        const startTime = Date.now();
    
        if (isInCheck) {
            this.calculateMovesInCheck(board);
        } else {
            this.calculateNormalMoves(board);
        }
    
        const endTime = Date.now();
        const timeMainLoop = endTime - startTime;
    
        return [timeMainLoop, 0];
    }

    private clearMoves() {
        this.setNoCaptureMoves(new Set<Square>());
        this.setCaptures(new Set<Square>());
        this.setAllPossibleMoves(new Set<Square>());
    }

    public calculateNormalMoves(board: Board) {
        this.influenceSquares = new Set<Square>();
        let noCaptureMoves: Set<Square> = new Set<Square>();
        let captures: Set<Square> = new Set<Square>();
    
        this.calculateForwardMoves(board, noCaptureMoves);
        this.calculateCaptureMoves(board, captures);
    
        this.registerControlSquares(board);
        this.setNoCaptureMoves(noCaptureMoves);
        this.setCaptures(captures);
        this.setAllPossibleMoves(new Set<Square>([...noCaptureMoves, ...captures]));
    }

    private calculateForwardMoves(board: Board, noCaptureMoves: Set<Square>) {
        const oneSquareForwardRow = this.square.row + this.direction;
    
        if (Board.isValidSquare(oneSquareForwardRow, this.square.column)) {
            const oneSquareForward = board.getSquare(oneSquareForwardRow, this.square.column);
            
            if (!oneSquareForward.occupied_by) {
                noCaptureMoves.add(oneSquareForward);
    
                if ((this.color === 1 && this.square.row === 1) || (this.color === -1 && this.square.row === 6)) {
                    const twoSquaresForwardRow = this.square.row + 2 * this.direction;
                    
                    if (Board.isValidSquare(twoSquaresForwardRow, this.square.column)) {
                        const twoSquaresForward = board.getSquare(twoSquaresForwardRow, this.square.column);
                        
                        if (!twoSquaresForward.occupied_by) {
                            noCaptureMoves.add(twoSquaresForward);
                        }
                    }
                }
            }
        }
    }

    private calculateCaptureMoves(board: Board, captures: Set<Square>) {
        const captureDirections = [
            { row: this.direction, column: 1 },  // Diagonal direita
            { row: this.direction, column: -1 }  // Diagonal esquerda
        ];
    
        for (const move of captureDirections) {
            const row = this.square.row + move.row;
            const column = this.square.column + move.column;
    
            if (Board.isValidSquare(row, column)) {
                const targetSquare = board.getSquare(row, column);
                this.influenceSquares.add(targetSquare);
                
                if (targetSquare.occupied_by && targetSquare.occupied_by.getColor() !== this.color) {
                    captures.add(targetSquare); // Pode capturar
                }
            }
        }
    }

    public calculateMovesInCheck(board: Board) {
        this.influenceSquares = new Set<Square>();
        let noCaptureMoves: Set<Square> = new Set<Square>();
        let captures: Set<Square> = new Set<Square>();
    
        const blockingSquares = board.getBlockingSquaresForCheck(this.color);
    
        this.calculateForwardMovesInCheck(board, noCaptureMoves, blockingSquares);
        this.calculateCaptureMovesInCheck(board, captures, blockingSquares);
    
        this.registerControlSquares(board);
        this.setNoCaptureMoves(noCaptureMoves);
        this.setCaptures(captures);
        this.setAllPossibleMoves(new Set<Square>([...noCaptureMoves, ...captures]));
    }

    private calculateForwardMovesInCheck(board: Board, noCaptureMoves: Set<Square>, blockingSquares: Set<Square>) {
        const oneSquareForwardRow = this.square.row + this.direction;
    
        if (Board.isValidSquare(oneSquareForwardRow, this.square.column)) {
            const oneSquareForward = board.getSquare(oneSquareForwardRow, this.square.column);
            
            if (!oneSquareForward.occupied_by && blockingSquares.has(oneSquareForward)) {
                noCaptureMoves.add(oneSquareForward);
            }
    
            if ((this.color === 1 && this.square.row === 1) || (this.color === -1 && this.square.row === 6)) {
                const twoSquaresForwardRow = this.square.row + 2 * this.direction;
                
                if (Board.isValidSquare(twoSquaresForwardRow, this.square.column)) {
                    const twoSquaresForward = board.getSquare(twoSquaresForwardRow, this.square.column);
                    
                    if (!twoSquaresForward.occupied_by && blockingSquares.has(twoSquaresForward)) {
                        noCaptureMoves.add(twoSquaresForward);
                    }
                }
            }
        }
    }

    private calculateCaptureMovesInCheck(board: Board, captures: Set<Square>, blockingSquares: Set<Square>) {
        const captureDirections = [
            { row: this.direction, column: 1 },
            { row: this.direction, column: -1 }
        ];
    
        for (const move of captureDirections) {
            const row = this.square.row + move.row;
            const column = this.square.column + move.column;
    
            if (Board.isValidSquare(row, column)) {
                const targetSquare = board.getSquare(row, column);
                this.influenceSquares.add(targetSquare);
                
                if (targetSquare.occupied_by && targetSquare.occupied_by.getColor() !== this.color && blockingSquares.has(targetSquare)) {
                    captures.add(targetSquare);
                }
            }
        }
    }    

    private calculatePinnedCapture(board: Board, pinDirection: { row: number, column: number }) {
        let captures: Set<Square> = new Set<Square>();
    
        const captureDirections = [
            { row: this.direction, column: 1 },
            { row: this.direction, column: -1 }
        ];
    
        for (const move of captureDirections) {
            const row = this.square.row + move.row;
            const column = this.square.column + move.column;
    
            if (move.row === pinDirection.row && move.column === pinDirection.column) {
                if (Board.isValidSquare(row, column)) {
                    const targetSquare = board.getSquare(row, column);
    
                    if (targetSquare.occupied_by && targetSquare.occupied_by.getColor() !== this.color) {
                        captures.add(targetSquare);
                    }
                }
            }
        }
    
        this.setCaptures(captures);
        this.setAllPossibleMoves(captures);
    }

    inStartingSquare() {
        return (this.color === -1 && this.square.row === 6) || (this.color === 1 && this.square.row === 1);
    }

    public updateSpecialMoves(board: Board) {
        let specialMoves: Set<Square> = new Set<Square>();

        // en Passant
        if (board.movesMade.length > 0) {
            const enPassant = board.getLastMove();
            const enPassantRow = enPassant.getFinalSquare().row + this.direction;
            const enPassantColumn = enPassant.getFinalSquare().column;

            if (enPassantColumn >= 0 && enPassantColumn < 8 && enPassantRow >= 0 && enPassantRow < 8) {
                const enPassantFinalSquare = board.getSquare(enPassantRow, enPassantColumn);
                const enPassant: Move = new Move(this.square, enPassantFinalSquare);
        
                if (this.canEnPassant(board) && !this.enPassantLeavesKingInCheck(board, enPassant)) {
                    specialMoves.add(enPassantFinalSquare);
                }
            }
        }
        
        // Promotion
        const promotionRow = this.color === 1 ? 7 : 0;

        for (let move of this.allPossibleMoves) {
            if (move.row === promotionRow) {
                specialMoves.add(move);
            }
        }

        this.setSpecialMoves(specialMoves);
        
        const allPossibleMoves = new Set<Square>([...this.allPossibleMoves, ...specialMoves]);
        this.setAllPossibleMoves(allPossibleMoves);
    }
    
    public canEnPassant(board: Board) {
        const lastMove: Move = board.getLastMove();
        const lastMovePiece = lastMove.getFinalSquare().getPiece();
        const rowToEnPassant = this.color === 1 ? 4 : 3;
        
        // Pawn moved on the last move
        if (!(lastMovePiece instanceof Pawn)) return false;

        // Last move final row not the same as this 
        if (lastMove.getFinalSquare().row !== this.square.row) return false;
        
        // Not on side
        if (Math.abs(lastMove.getFinalSquare().column - this.square.column) !== 1) return false;

        // Not double move
        if (Math.abs(lastMove.getInitialSquare().row - lastMove.getFinalSquare().row) !== 2) return false;

        return true;
    }

    private enPassantLeavesKingInCheck(board: Board, move: Move) {
        const originalSquare = this.square;
        const finalSquare = move.getFinalSquare();
        const originalOccupied = finalSquare.getPiece();

        finalSquare.setPiece(this);
        originalSquare.setPiece(null);
        this.setSquare(finalSquare);
        
        const enemyPawnSquare = board.getSquare(originalSquare.row, finalSquare.column);
        const enemyPawn = enemyPawnSquare.getPiece();
        board.getSquare(originalSquare.row, finalSquare.column).setPiece(null);

        const inCheck = board.isKingInCheck(this.color);

        finalSquare.setPiece(originalOccupied);
        originalSquare.setPiece(this);
        this.setSquare(originalSquare);
        enemyPawnSquare.setPiece(enemyPawn);

        return inCheck;
    }

    public blockDoubleMove(pawn: Pawn): boolean {
        const squareThisPawn = this.square;
        const squareOtherPawn = pawn.square;
        const inSameColumn = squareThisPawn.column === squareOtherPawn.column;
        const leqThanTwoDist = squareThisPawn.distanceKingMoves(squareOtherPawn) <= 2;
        return inSameColumn && leqThanTwoDist;
    }

    public setSpecialMoves(specialMoves: Set<Square>) {
        this.specialMoves = specialMoves;
    }
    
    public getSpecialMoves(): Set<Square> {
        return this.specialMoves;
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
            mapControlSquares.get(square)?.delete(this.square);
        });
    }

    inRowEnPassant() {
        return this.color === 1 ? this.square.row === 4 : this.square.row === 3;
    }

    isAffectedByMove(piece: Piece, square: Square): boolean {
        const pawnRow = this.getSquare().row;
        const pawnColumn = this.getSquare().column;
        const moveRow = square.row;
        const moveColumn = square.column;
        const captureDirections = [
            { row: this.direction, column: 1 },  // capture to the right
            { row: this.direction, column: -1 }  // capture to the left
        ];

        const dx = Math.abs(pawnColumn - moveColumn);
        const dy = Math.abs(pawnRow - moveRow);

        if (dx === 1 && dy === 0 && piece instanceof Pawn && this.inRowEnPassant()) {
            return true;
        } 
        
        if (dx > 1) {
            return false
        }
        
        if (pawnRow === moveRow - this.direction) {
            return true
        }

        if (this.inStartingSquare() && dy === 2) {
            return true;
        }

        for (const move of captureDirections) {
            const row = this.square.row + move.row;
            const column = this.square.column + move.column;

            if (piece.getColor() !== this.color && square.row === row && square.column === column) {
                return true;
            }
        }

        return false;       
    }
}
