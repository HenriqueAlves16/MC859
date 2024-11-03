import { Piece } from './Piece.js';
import { Square } from './Square.js';
import { Board } from './Board.js';
import { King } from './King.js';

export class Queen extends Piece {
    static DIRECTIONS = [
        { row: 1, column: 0 },   // up
        { row: -1, column: 0 },  // down
        { row: 0, column: 1 },   // right
        { row: 0, column: -1 },  // left
        { row: 1, column: 1 },   // diagonal up-right
        { row: 1, column: -1 },  // diagonal up-left
        { row: -1, column: 1 },  // diagonal down-right
        { row: -1, column: -1 }  // diagonal down-left
    ];
    public creationMove: number;

    constructor(color: number, square: Square, creationMove: number = 0) {
        if (color === -1) {
            super(color, square, "images\\black_queen.png", -900);
        } else {
            super(color, square, "images\\white_queen.png", 900);
        }
        this.creationMove = creationMove;
        this.middleGameHeatMap = [
            [-20,-10,-10, -5, -5,-10,-10,-20],
            [-10,  0,  0,  0,  0,  0,  0,-10],
            [-10,  0,  5,  5,  5,  5,  0,-10],
            [-5,  0,  5,  5,  5,  5,  0, -5],
            [0,  0,  5,  5,  5,  5,  0, -5],
            [-10,  5,  5,  5,  5,  5,  0,-10],
            [-10,  0,  5,  0,  0,  0,  0,-10],
            [-20,-10,-10, -5, -5,-10,-10,-20]
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
    
        const isInCheck = board.isKingInCheck(this.color);
        const isPinned = pinnedPieces.has(this);
    
        const startTimeMainLoop = Date.now();
    
        if (isPinned) {
            const pinDirection = pinnedPieces.get(this)!;
            this.handlePinnedPieceMovements(board, pinDirection, noCaptureMoves, captures);
        } else if (isInCheck) {
            this.handleKingInCheckMovements(board, noCaptureMoves, captures);
        } else {
            this.handleNormalMovements(board, noCaptureMoves, captures);
        }
    
        const endTimeMainLoop = Date.now();
    
        this.registerControlSquares(board);
        this.setNoCaptureMoves(noCaptureMoves);
        this.setCaptures(captures);
        this.setAllPossibleMoves(new Set<Square>([...noCaptureMoves, ...captures]));
    
        const timeMainLoop = endTimeMainLoop - startTimeMainLoop;
        return [timeMainLoop, 0];
    }

    private handlePinnedPieceMovements(
        board: Board,
        pinDirection: { row: number, column: number },
        noCaptureMoves: Set<Square>,
        captures: Set<Square>
    ) {
        this.scanDirection(board, pinDirection, noCaptureMoves, captures);
        const oppositeDirection = { row: -pinDirection.row, column: -pinDirection.column };
        this.scanDirection(board, oppositeDirection, noCaptureMoves, captures);
    }
    
    private handleKingInCheckMovements(
        board: Board,
        noCaptureMoves: Set<Square>,
        captures: Set<Square>
    ) {
        const blockingSquares = board.getBlockingSquaresForCheck(this.color);
    
        for (const direction of Queen.DIRECTIONS) {
            this.scanDirection(board, direction, noCaptureMoves, captures, blockingSquares);
        }
    }

    private handleNormalMovements(
        board: Board,
        noCaptureMoves: Set<Square>,
        captures: Set<Square>
    ) {
        for (const direction of Queen.DIRECTIONS) {
            this.scanDirection(board, direction, noCaptureMoves, captures);
        }
    }

    private scanDirection(
        board: Board,
        direction: { row: number, column: number },
        noCaptureMoves: Set<Square>,
        captures: Set<Square>,
        blockingSquares: Set<Square> | null = null
    ) {
        let row = this.square.row + direction.row;
        let column = this.square.column + direction.column;
    
        while (Board.isValidSquare(row, column)) {
            const targetSquare = board.getSquare(row, column);
            const enemyPiece = targetSquare.occupied_by;
            this.influenceSquares.add(targetSquare);
    
            if (!enemyPiece) {
                if (!blockingSquares || blockingSquares.has(targetSquare)) {
                    noCaptureMoves.add(targetSquare);
                }
            } else if (enemyPiece.getColor() !== this.color) {
                if (!blockingSquares || blockingSquares.has(targetSquare)) {
                    captures.add(targetSquare);
                }
                if (!(enemyPiece instanceof King)) {
                    break;
                }
            } else {
                break;
            }
    
            row += direction.row;
            column += direction.column;
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
            mapControlSquares.get(square)?.delete(this.square);
        });
    }

    isAffectedByMove(piece: Piece, square: Square): boolean {
        const queenRow = this.getSquare().row;
        const queenColumn = this.getSquare().column;
        
        return (square.row === queenRow || square.column === queenColumn) || (Math.abs(square.row - queenRow) === Math.abs(square.column - queenColumn));
    }
}