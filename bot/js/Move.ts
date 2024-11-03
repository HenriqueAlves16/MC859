import { Square } from './Square.js'
import { Piece } from './Piece.js'

export class Move {
    private initialSquare_: Square;
    private finalSquare_: Square;
    public pieceCaptured: Piece | null;
    public isCastle: number;
    public isPromotion: boolean;
    public isEnPassant: boolean;
    public pieceMoved: Piece;
    
    constructor(initialSquare: Square, finalSquare: Square, isCastle: number=0, isPromotion: boolean=false, isEnPassant: boolean=false) {
        this.initialSquare_ = initialSquare;
        this.finalSquare_ = finalSquare;
        this.isCastle = isCastle;
        this.isPromotion = isPromotion
        this.pieceCaptured = finalSquare.getPiece();
        this.isEnPassant = isEnPassant;
        this.pieceMoved = this.getInitialSquare().getPiece() as Piece;
    }

    isCapture() {
        return this.pieceCaptured !== null;
    }

    getInitialSquare(): Square {
        return this.initialSquare_;
    }
    
    getFinalSquare(): Square {
        return this.finalSquare_;
    }
}