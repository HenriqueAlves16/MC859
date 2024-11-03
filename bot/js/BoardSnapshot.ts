import { Square } from './Square.js';
import { Piece } from './Piece.js';
import { Move } from './Move.js';

export class BoardSnapshot {
    public piecesState: Map<Piece, { 
        square: Square, 
        influenceSquares: Set<Square>, 
        allPossibleMoves: Set<Square>, 
        noCaptureMoves: Set<Square>, 
        specialMoves: Set<Square>, 
        captures: Set<Square>, 
        moves: number
    }>;
    public squaresAttackedByWhite: Map<Square, Set<Square>>;
    public squaresAttackedByBlack: Map<Square, Set<Square>>;
    public validMoves: Set<Move>;
    public turn: number;
    public evaluation: number;

    constructor(pieces: Set<Piece>, squaresAttackedByWhite: Map<Square, Set<Square>>, squaresAttackedByBlack: Map<Square, Set<Square>>, validMoves: Set<Move>, turn: number, evaluation: number) {
        this.piecesState = new Map();
        pieces.forEach(piece => {
            this.piecesState.set(piece, {
                square: piece.getSquare(),
                influenceSquares: new Set(piece.getInfluenceSquares()),
                allPossibleMoves: new Set(piece.getAllPossibleMoves()),
                noCaptureMoves: new Set(piece.getNoCaptureMoves()),
                specialMoves: new Set(piece.getSpecialMoves()),
                captures: new Set(piece.getCaptures()),
                moves: piece.hasMoved,
            });
        });
        this.squaresAttackedByWhite = this.cloneAttackedSquaresMap(squaresAttackedByWhite);
        this.squaresAttackedByBlack = this.cloneAttackedSquaresMap(squaresAttackedByBlack);
        this.validMoves = new Set(validMoves);
        this.turn = turn;
        this.evaluation = evaluation;
    }

    private cloneAttackedSquaresMap(original: Map<Square, Set<Square>>): Map<Square, Set<Square>> {
        const clone = new Map<Square, Set<Square>>();
        original.forEach((attackers, square) => {
            clone.set(square, new Set(attackers));
        });
        return clone;
    }
}
