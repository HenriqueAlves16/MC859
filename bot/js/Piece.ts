import { Square } from './Square.js';
import { Board } from './Board.js';

export abstract class Piece {
    protected color: number;
    protected square: Square;
    protected value: number;
    protected influenceSquares: Set<Square>;
    protected allPossibleMoves: Set<Square>;
    protected noCaptureMoves: Set<Square>;
    protected specialMoves: Set<Square>;
    protected captures: Set<Square>;
    protected pathToImage_: string;
    public hasMoved: number;
    protected middleGameHeatMap: number[][];
    
    constructor(color: number, square: Square, pathToImage: string, value: number) {
        this.color = color;
        this.square = square;
        this.pathToImage_ = pathToImage;
        this.value = value;
        this.influenceSquares = new Set<Square>();
        this.allPossibleMoves = new Set<Square>();
        this.noCaptureMoves = new Set<Square>();
        this.specialMoves = new Set<Square>();
        this.captures = new Set<Square>();
        this.hasMoved = 0;
        this.middleGameHeatMap = [[]];
    }

    public getPathToImg(): string { return this.pathToImage_; }

    public getSquare(): Square { return this.square; }
    
    public setSquare(square: Square) { this.square = square; }

    public getColor(): number { return this.color; }

    public getValue(): number { return this.value; }

    protected removeMovesThatLeaveKingInCheck(possibleMoves: Set<Square>, board: Board) {
        const possibleMovesArray = Array.from(possibleMoves);
        return new Set(possibleMovesArray.filter(move => {
            const originalSquare = this.square;
            const originalOccupied = move.occupied_by;

            move.setPiece(this);
            originalSquare.setPiece(null);
            this.setSquare(move);

            const inCheck = board.isKingInCheck(this.color);

            move.setPiece(originalOccupied);
            originalSquare.setPiece(this);
            this.setSquare(originalSquare);

            return !inCheck;
        }));
    }    

    getNoCaptureMoves(): Set<Square> {
        return this.noCaptureMoves;
    }
    
    getCaptures(): Set<Square> {
        return this.captures;
    }

    getPositionEvaluation(): number {
        const square = this.getSquare();
        return this.middleGameHeatMap[square.row][square.column];
    }

    public getAllPossibleMoves(): Set<Square> {
        return this.allPossibleMoves;
    }
    
    public getInfluenceSquares(): Set<Square> {
        return this.influenceSquares;
    }

    public setNoCaptureMoves(noCaptureMoves: Set<Square>) {
        this.noCaptureMoves = noCaptureMoves;
    }
    
    public setCaptures(captures: Set<Square>) {
        this.captures = captures;
    }
    
    public setAllPossibleMoves(allPossibleMoves: Set<Square>) {
        this.allPossibleMoves = allPossibleMoves;
    }
    
    public setInfluenceSquares(influenceSquares: Set<Square>) {
        this.influenceSquares = influenceSquares;
    }
    
    public getSpecialMoves(): Set<Square> {
        return new Set<Square>();
    }
    
    public setSpecialMoves(specialMoves: Set<Square>) {
        this.specialMoves = specialMoves;
    }
    
    abstract updateMoves(board: Board, pinnedPieces: Map<Piece, { row: number, column: number }>): any;

    abstract isAffectedByMove(piece: Piece, square: Square): boolean;

    abstract registerControlSquares(board: Board): any;
    
    abstract unregisterControlSquares(board: Board): any;
    
}
