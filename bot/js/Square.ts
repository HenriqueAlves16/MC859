import { Piece } from './Piece.js';

export class Square {
    public row: number;
    public column: number;
    public occupied_by: Piece | null;

    constructor(row: number, column: number) {
        this.row = row;
        this.column = column;
        this.occupied_by = null;
    }

    public clone(): Square {
        const clonedSquare = new Square(this.row, this.column);
        clonedSquare.setPiece(this.occupied_by);
        return clonedSquare;
    }
    
    getPiece(): Piece | null {
        return this.occupied_by;
    }

    setPiece(piece: Piece | null) {
        this.occupied_by = piece;
    }

    public distanceKingMoves(targetSquare: Square) {
        const rowDistance = Math.abs(this.row - targetSquare.row);
        const colDistance = Math.abs(this.column - targetSquare.column);

        return Math.max(rowDistance, colDistance);
    }
}
