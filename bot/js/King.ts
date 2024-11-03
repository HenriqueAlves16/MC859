import { Piece } from './Piece.js';
import { Square } from './Square.js';
import { Board } from './Board.js';
import { Rook } from './Rook.js'
import { Queen } from './Queen.js';

export class King extends Piece {
    constructor(color: number, square: Square) {
        if (color === -1) {
            super(color, square, "images\\black_king.png", -10000);
        } else {
            super(color, square, "images\\white_king.png", 10000);
        }
        this.middleGameHeatMap = [
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-20,-30,-30,-40,-40,-30,-30,-20],
            [-10,-20,-20,-20,-20,-20,-20,-10],
            [20, 20,  0,  0,  0,  0, 20, 20],
            [20, 300, 10,  0,  0, 10, 300, 20],
        ]
        if (color === 1) {
            this.middleGameHeatMap = this.middleGameHeatMap.reverse();
        } else {
            this.middleGameHeatMap = this.middleGameHeatMap.map(row => 
                row.map(value => -value)
            );
        }
    }

    updateMoves(board: Board) {
        this.unregisterControlSquares(board);
        this.influenceSquares = new Set<Square>();
        let noCaptureMoves: Set<Square> = new Set<Square>();
        let captures: Set<Square> = new Set<Square>();
        const enemyControl = board.getControlledSquaresByColor(this.color * -1);
        
        const startTimeMainLoop = Date.now();
        for (const direction of Queen.DIRECTIONS) {
            const row = this.square.row + direction.row;
            const column = this.square.column + direction.column;
            
            if (Board.isValidSquare(row, column)) {
                const targetSquare = board.getSquare(row, column);
                this.influenceSquares.add(targetSquare);
                
                if ((enemyControl.get(targetSquare) as Set<Square>).size === 0) {
                    if (!targetSquare.occupied_by) {
                        noCaptureMoves.add(targetSquare);
                    } else if (targetSquare.occupied_by.getColor() !== this.color){
                        captures.add(targetSquare);
                    }
                }
            }
        }
        const endTimeMainLoop = Date.now();

        this.registerControlSquares(board);
        this.setNoCaptureMoves(noCaptureMoves);
        this.setCaptures(captures);
        this.setAllPossibleMoves(new Set<Square>([...noCaptureMoves, ...captures]));


        const timeMainLoop = endTimeMainLoop - startTimeMainLoop;
        return [timeMainLoop, 0];
    }

    public updateSpecialMoves(board: Board) {
        let specialMoves: Set<Square> = new Set<Square>();

        if (this.canCastle(board, 7)) {
            specialMoves.add(board.getSquare(this.square.row, 6));
        }

        if (this.canCastle(board, 0)) {
            specialMoves.add(board.getSquare(this.square.row, 2));
        }

        this.setSpecialMoves(specialMoves);
        const allPossibleMoves = new Set<Square>([...this.allPossibleMoves, ...specialMoves]);
        this.setAllPossibleMoves(allPossibleMoves);
    }

    private canCastle(board: Board, rookColumn: number): boolean {
        const rookSquare = board.getSquare(this.square.row, rookColumn);
        const rook = rookSquare.occupied_by as Rook;
            
        if (!rook || rook.hasMoved !== 0 || this.hasMoved !== 0) {
            return false;
        }

        if (board.isKingInCheck(this.color)){
            return false;
        }

        const direction = rookColumn === 7 ? 1 : -1;
        const kingColumn = this.square.column;

        for (let column = kingColumn + direction; (column > 0 && column < 7); column += direction) {
            const square = board.getSquare(this.square.row, column);

            if (square.getPiece()){
                return false;
            }
        }

        return true;
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
    
    isAffectedByMove(piece: Piece, square: Square): boolean {
        const dx = Math.abs(this.getSquare().row - square.row);
        const dy = Math.abs(this.getSquare().column - square.column);
        return dx <= 1 && dy <= 1;
    }
}
