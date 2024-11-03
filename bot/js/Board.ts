import { Rook } from './Rook.js';
import { Knight } from './Knight.js';
import { Queen } from './Queen.js';
import { Bishop } from './Bishop.js';
import { King } from './King.js';
import { Pawn } from './Pawn.js';
import { Square } from './Square.js';
import { Piece } from './Piece.js';
import { Move } from './Move.js';
import { AI } from './AI.js';
import { BoardSnapshot } from './BoardSnapshot.js';

export class Board {
    private squares: Square[][];
    private validMoves: Set<Move>;
    private turn: number;
    public movesMade: Move[];
    public blackKing: King = null as unknown as King;
    public whiteKing: King = null as unknown as King;
    public squaresAttackedByWhite: Map<Square, Set<Square>> = new Map<Square, Set<Square>> ();
    public squaresAttackedByBlack: Map<Square, Set<Square>> = new Map<Square, Set<Square>> ();
    public allPieces: Set<Piece>;
    public evaluation: number;
    public ai: AI;
    private evaluationListeners: ((value: number) => void)[] = [];
    private history: BoardSnapshot[];

    constructor() {
        this.allPieces = new Set<Piece>;
        this.squares = this.createBoard_();
        this.populateBoard_();
        this.initializeControlSquaresMaps_();
        this.validMoves = new Set<Move>();
        this.turn = 1;
        this.movesMade = [];

        this.initializePieces();
        this.ai = new AI(this);
        this.evaluation = this.evaluate();
        this.history = [];
    }

    
    private createBoard_(): Square[][] {
        const board: Square[][] = [];
        
        for (let row = 0; row < 8; row++) {
            const boardRow: Square[] = [];
            for (let column = 0; column < 8; column++) {
                boardRow.push(new Square(row, column));
            }
            board.push(boardRow);
        }
        
        return board;
    }
    
    private initializePieces() {
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = this.getSquare(i, j).getPiece();
                if (piece){
                    piece.updateMoves(this, new Map<Piece, { row: number, column: number }>());
                }
            }
        }
        this.updateValidMoves(this.turn);
    }
    
    private populateBoard_() {
        // -1 = black, 1 = white
        this.squares[7][0].setPiece(new Rook(-1, this.squares[7][0]));
        this.squares[7][7].setPiece(new Rook(-1, this.squares[7][7]));
        this.squares[0][0].setPiece(new Rook(1, this.squares[0][0]));
        this.squares[0][7].setPiece(new Rook(1, this.squares[0][7]));
        
        this.squares[7][1].setPiece(new Knight(-1, this.squares[7][1]));
        this.squares[7][6].setPiece(new Knight(-1, this.squares[7][6]));
        this.squares[0][1].setPiece(new Knight(1, this.squares[0][1]));
        this.squares[0][6].setPiece(new Knight(1, this.squares[0][6]));
        
        this.squares[7][2].setPiece(new Bishop(-1, this.squares[7][2]));
        this.squares[7][5].setPiece(new Bishop(-1, this.squares[7][5]));
        this.squares[0][2].setPiece(new Bishop(1, this.squares[0][2]));
        this.squares[0][5].setPiece(new Bishop(1, this.squares[0][5]));
        
        this.squares[7][3].setPiece(new Queen(-1, this.squares[7][3]));
        this.squares[0][3].setPiece(new Queen(1, this.squares[0][3]));
        
        this.squares[7][4].setPiece(new King(-1, this.squares[7][4]));
        this.squares[0][4].setPiece(new King(1, this.squares[0][4]));
        this.blackKing = this.squares[7][4].getPiece() as King;
        this.whiteKing = this.squares[0][4].getPiece() as King;

        for (let i = 0; i < 8; i++) {
            this.squares[6][i].setPiece(new Pawn(-1, this.squares[6][i]));
            this.squares[1][i].setPiece(new Pawn(1, this.squares[1][i]));
        }

        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = this.squares[i][j].getPiece();
                if (piece !== null) {
                    this.allPieces.add(piece);
                }
            }
        }
    }
    
    private initializeControlSquaresMaps_() {
        for (let row = 0; row < 8; row++) {
            for (let column = 0; column < 8; column++) {
                const square = this.getSquare(row, column);
                this.squaresAttackedByBlack.set(square, new Set<Square>());
                this.squaresAttackedByWhite.set(square, new Set<Square>());
            }
        }
    }

    public isKingInCheck(color: number): boolean {
        const enemyControl: Map <Square, Set<Square>> = color === 1 ? this.squaresAttackedByBlack : this.squaresAttackedByWhite;
        const alliedKingSquare = color === 1 ? this.whiteKing.getSquare() : this.blackKing.getSquare();
        const attacksOnKingSquare = enemyControl.get(alliedKingSquare) as Set<Square>;
        return attacksOnKingSquare.size > 0;
    }
    
    public getSquare(row: number, column: number): Square {
        return this.squares[row][column];
    }
    
    public getTurn() {
        return this.turn;
    }

    static isValidSquare(row: number, column: number): boolean {
        return row < 8 && row >= 0 && column < 8 && column >= 0;
    }

    public updateValidMoves(color: number) {
        this.validMoves.clear();
        this.allPieces.forEach(piece => {
            if (piece.getColor() === color) {
                piece.getAllPossibleMoves().forEach(finalSquare => {
                    this.validMoves.add(new Move(piece.getSquare(), finalSquare));
                });
                if (piece instanceof King) {
                    console.log(piece.getAllPossibleMoves())
                }
            }
        });
    }
    

    public getSquaresToBeUpdated(lastMove: Move): Set<Square> {
        const squaresToBeUpdated = new Set<Square>();

        if (!lastMove) {
            this.allPieces.forEach(piece => {
                squaresToBeUpdated.add(piece.getSquare());
            });
            return squaresToBeUpdated;
        }

        const lastMoveFinalSquare: Square = lastMove.getFinalSquare();
        const lastMoveInitialSquare: Square = lastMove.getInitialSquare();
        const pieceMoved: Piece = (lastMove.getFinalSquare().occupied_by) as Piece;

        squaresToBeUpdated.add(lastMoveFinalSquare);

        const addQueenCaptureSquares = (square: Square) => {
            for (const direction of Queen.DIRECTIONS) {
                let row = square.row + direction.row;
                let column = square.column + direction.column;
                
                while (Board.isValidSquare(row, column)) {
                    const targetSquare = this.getSquare(row, column);
                    const piece = targetSquare.getPiece();
                    if (piece) {
                        if (piece.isAffectedByMove(pieceMoved, square)) {
                            squaresToBeUpdated.add(targetSquare);
                        }
                        break;
                    }
                    
                    row += direction.row;
                    column += direction.column;
                }
            }
        };
        
        const addKnigntCaptureSquares = (square: Square) => {
            for (const direction of Knight.MOVE_PATTERNS) {
                let row = square.row + direction.row;
                let column = square.column + direction.column;
                
                if (Board.isValidSquare(row, column)) {
                    const targetSquare = this.getSquare(row, column);
                    const piece = targetSquare.getPiece();
                
                    if (piece && piece instanceof Knight) {
                        squaresToBeUpdated.add(targetSquare);
                    }
                }                
            }
        };
    
        addQueenCaptureSquares(lastMoveInitialSquare);
        addQueenCaptureSquares(lastMoveFinalSquare);
        addKnigntCaptureSquares(lastMoveInitialSquare);
        addKnigntCaptureSquares(lastMoveFinalSquare);
    
        return squaresToBeUpdated;
    }

    public getPinnedPieces(color: number): Map<Piece, { row: number, column: number }> {
        const pinnedPieces = new Map<Piece, { row: number, column: number }>();
        let king: Piece;
        
        if (color === 1) {
            king = this.whiteKing;
        } else {
            king = this.blackKing;
        }
    
        const directions = Queen.DIRECTIONS;
    
        for (const direction of directions) {
            let row = king.getSquare().row + direction.row;
            let column = king.getSquare().column + direction.column;
            let potentialPinnedPiece: Piece | null = null;
    
            while (Board.isValidSquare(row, column)) {
                const square = this.getSquare(row, column);
                const piece = square.getPiece();
    
                if (piece) {
                    if (piece.getColor() === color) {
                        if (potentialPinnedPiece === null) {
                            potentialPinnedPiece = piece;
                        } else {
                            break;
                        }
                    } else {
                        if (this.isPinningPiece(piece, direction)) {
                            if (potentialPinnedPiece !== null) {
                                pinnedPieces.set(potentialPinnedPiece, direction);
                            }
                        }
                        break;
                    }
                }
    
                row += direction.row;
                column += direction.column;
            }
        }
    
        return pinnedPieces;
    }
    
    
    private isPinningPiece(piece: Piece, direction: { row: number, column: number }): boolean {
        if (piece instanceof Queen) {
            return true;
        }
        if (piece instanceof Rook) {
            return direction.row === 0 || direction.column === 0;
        }
        if (piece instanceof Bishop) {
            return direction.row !== 0 && direction.column !== 0;
        }
        return false;
    }

    public getBlockingSquaresForCheck(color: number): Set<Square> {
        const blockingSquares = new Set<Square>();
        const kingSquare = this.turn === 1 ? this.whiteKing.getSquare() : this.blackKing.getSquare();
        const attackers = this.turn === 1 ? this.squaresAttackedByBlack.get(kingSquare) : this.squaresAttackedByWhite.get(kingSquare);
    
        if (!attackers || attackers.size === 0) {
            return blockingSquares;
        }
    
        if (attackers.size > 1) {
            return blockingSquares;
        }
    
        const attackerSquare = Array.from(attackers)[0];
    
        const attacker = attackerSquare.getPiece();
        if (!attacker) {
            return blockingSquares;
        }
    
        if (attacker instanceof Knight || attacker instanceof Pawn) {
            blockingSquares.add(attackerSquare);
            return blockingSquares;
        }
    
        const rowDirection = Math.sign(kingSquare.row - attackerSquare.row);
        const columnDirection = Math.sign(kingSquare.column - attackerSquare.column);
    
        let currentRow = attackerSquare.row + rowDirection;
        let currentColumn = attackerSquare.column + columnDirection;
    
        while (currentRow !== kingSquare.row || currentColumn !== kingSquare.column) {
            const square = this.getSquare(currentRow, currentColumn);
            blockingSquares.add(square);
    
            currentRow += rowDirection;
            currentColumn += columnDirection;
        }
    
        blockingSquares.add(attackerSquare);
    
        return blockingSquares;
    }
    
    public getAllPieces() {
        return this.allPieces;
    }
    
    public makeMove(move: Move, moveSource: number=0) {
        // snapshot antes do move ser feito
        const snapshot = new BoardSnapshot(
            this.getAllPieces(),
            this.squaresAttackedByWhite,
            this.squaresAttackedByBlack,
            this.validMoves,
            this.turn,
            this.evaluation
        );
        this.history.push(snapshot);

        const initialSquare: Square = move.getInitialSquare();
        const finalSquare: Square = move.getFinalSquare();
        move.pieceCaptured = finalSquare.getPiece();

        const movedPiece = initialSquare.getPiece() as Piece;
        const capturedPiece = finalSquare.getPiece();

        // updating evals
        movedPiece.unregisterControlSquares(this);
        this.evaluation -= movedPiece.getPositionEvaluation();
        if (capturedPiece) {
            this.evaluation -= capturedPiece.getPositionEvaluation();
            this.evaluation -= capturedPiece.getValue();
            capturedPiece.unregisterControlSquares(this);
            this.allPieces.delete(capturedPiece);
        }
        
        movedPiece.hasMoved += 1;
        
        this.tryToCastle(movedPiece, move);
        this.tryToEnPassant(movedPiece, move);
        
        if (!this.tryToPromote(movedPiece, move)) {
            finalSquare.setPiece(movedPiece);
            initialSquare.setPiece(null);
            finalSquare.getPiece()?.setSquare(finalSquare);
        }
        this.evaluation += movedPiece.getPositionEvaluation();

        this.turn *= -1;
        this.movesMade.push(move);

        return this.updateBoardStateDebug(move);
    }

    private tryToCastle(piece: Piece, move: Move): boolean {
        const initialSquare: Square = move.getInitialSquare();
        const finalSquare: Square = move.getFinalSquare();

        if (piece instanceof King && piece.getSpecialMoves().has(finalSquare)) {
            const deltaMoveKing = finalSquare.column - initialSquare.column;
            if (Math.abs(deltaMoveKing) === 2) {
                this.castleRook(deltaMoveKing);
            }
            move.isCastle = deltaMoveKing > 0 ? 1 : 2;
            piece.getSpecialMoves().clear();
            return true;
        }
        return false;
    }

    private tryToEnPassant(piece: Piece, move: Move): boolean {
        const initialSquare: Square = move.getInitialSquare();
        const finalSquare: Square = move.getFinalSquare();
        
        if (piece instanceof Pawn && piece.getSpecialMoves().has(finalSquare) && (piece as Pawn).canEnPassant(this)) {
            move.isEnPassant = true;
            this.getSquare(initialSquare.row, finalSquare.column).setPiece(null);
            return true;
        }
        return false;
    }

    private tryToPromote(piece: Piece, move: Move) {
        const initialSquare: Square = move.getInitialSquare();
        const finalSquare: Square = move.getFinalSquare();

        if (piece instanceof Pawn && piece.getSpecialMoves().has(finalSquare)) {
            if (finalSquare.row === 7) {
                const promotedPiece = new Queen(1, finalSquare, this.movesMade.length);
                move.isPromotion = true;
                move.pieceCaptured = finalSquare.getPiece();

                finalSquare.setPiece(promotedPiece);
                initialSquare.setPiece(null);
                return true;
            } else if (finalSquare.row === 0) {
                const promotedPiece = new Queen(-1, finalSquare, this.movesMade.length);
                finalSquare.setPiece(promotedPiece);
                initialSquare.setPiece(null);
                return true;
            }
        }
        return false;
    }

    private castleRook(deltaMoveKing: number) {
        const row = this.turn === 1 ? 0 : 7;
        
        if (deltaMoveKing === 2) {
            const initialRookSquare = this.getSquare(row, 7);
            const finalRookSquare = this.getSquare(row, 5);
            const rook = initialRookSquare.getPiece();

            finalRookSquare.setPiece(rook);
            initialRookSquare.setPiece(null);
            rook?.setSquare(finalRookSquare);                

        } else if (deltaMoveKing === -2) {
            const initialRookSquare = this.getSquare(row, 0);
            const finalRookSquare = this.getSquare(row, 3);
            const rook = initialRookSquare.getPiece();

            finalRookSquare.setPiece(rook);
            initialRookSquare.setPiece(null);
            rook?.setSquare(finalRookSquare);
        }
    }

    undoMove() {
        if (this.movesMade.length === 0 || this.history.length === 0) return;
    
        const snapshot = this.history.pop() as BoardSnapshot;
        const lastMove: Move = this.getLastMove();
    
        lastMove.isCastle !== 0 ? this.undoCastle(lastMove) : this.undoNormalMove(lastMove);
        this.restoreSnapshotState(snapshot);
        this.movesMade.pop();
    }
    
    private undoCastle(move: Move) {
        const initialSquare: Square = move.getInitialSquare();
        move.isCastle === 1 ? this.undoShortCastle(initialSquare) : this.undoLongCastle(initialSquare);
    }
    
    private undoShortCastle(initialSquare: Square) {
        const rookInitialSquare = this.getSquare(initialSquare.row, 7);
        const rookFinalSquare = this.getSquare(initialSquare.row, 5);
        const rook = rookFinalSquare.getPiece();
    
        if (rook) {
            rook.setSquare(rookInitialSquare);
            rookInitialSquare.setPiece(rook);
            rookFinalSquare.setPiece(null);
            rook.hasMoved = 0;
        }

        const king = this.getSquare(initialSquare.row, 6).getPiece();
        if (king) {
            king.setSquare(initialSquare);
            initialSquare.setPiece(king);
            this.getSquare(initialSquare.row, 6).setPiece(null); 
            king.hasMoved = 0;
        }
    }
    
    private undoLongCastle(initialSquare: Square) {
        const rookInitialSquare = this.getSquare(initialSquare.row, 0);
        const rookFinalSquare = this.getSquare(initialSquare.row, 3);
        const rook = rookFinalSquare.getPiece();
    
        if (rook) {
            rook.setSquare(rookInitialSquare);
            rookInitialSquare.setPiece(rook);
            rookFinalSquare.setPiece(null);
            rook.hasMoved = 0;
        }
    
        const king = this.getSquare(initialSquare.row, 2).getPiece();
        if (king) {
            king.setSquare(initialSquare);
            initialSquare.setPiece(king);
            this.getSquare(initialSquare.row, 2).setPiece(null);
            king.hasMoved = 0;
        }
    }
    
    private undoNormalMove(lastMove: Move) {
        const initialSquare: Square = lastMove.getInitialSquare();
        const finalSquare: Square = lastMove.getFinalSquare();
        const pieceMoved: Piece | null = finalSquare.getPiece();
        const pieceCaptured: Piece | null = lastMove.pieceCaptured;
    
        if (pieceMoved) {
            finalSquare.setPiece(pieceCaptured);
            pieceMoved.setSquare(initialSquare);
            initialSquare.setPiece(pieceMoved);
        }
    
        if (pieceCaptured) {
            pieceCaptured.setSquare(finalSquare);
            this.allPieces.add(pieceCaptured);
        }
    }
    
    private restoreSnapshotState(snapshot: BoardSnapshot) {
        snapshot.piecesState.forEach((state, piece) => {
            const pieceSquare = this.getSquare(state.square.row, state.square.column);
            piece.setSquare(this.getSquare(pieceSquare.row, pieceSquare.column));
            pieceSquare.setPiece(piece);
    
            piece.setInfluenceSquares(state.influenceSquares);
            piece.setAllPossibleMoves(state.allPossibleMoves);
            piece.setNoCaptureMoves(state.noCaptureMoves);
            piece.setSpecialMoves(state.specialMoves);
            piece.setCaptures(state.captures);
            piece.hasMoved = state.moves;
        });
    
        this.squaresAttackedByWhite = new Map(snapshot.squaresAttackedByWhite);
        this.squaresAttackedByBlack = new Map(snapshot.squaresAttackedByBlack);
        this.validMoves = new Set(snapshot.validMoves);
        this.turn = snapshot.turn;
        this.evaluation = snapshot.evaluation;
    }    
    
    private updateSpecialMoves() {
        this.whiteKing.updateMoves(this);
        this.blackKing.updateMoves(this);
        this.whiteKing.updateSpecialMoves(this);
        this.blackKing.updateSpecialMoves(this);

        for (let i = 1; i < 7; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = this.getSquare(i, j).getPiece();
                if (piece && piece instanceof Pawn){
                    piece.updateSpecialMoves(this);
                }
            }
        }
    }

    private updatePiecesMoves(lastMove: Move | null) {
        const lastColorPinnedPieces = this.getPinnedPieces(-this.turn);

        for (let piece of this.allPieces) {
            if (piece.getColor() === -this.turn) {
                piece.updateMoves(this, lastColorPinnedPieces);
            }
        }

        const currentColorPinnedPieces = this.getPinnedPieces(this.turn);
        for (let piece of this.allPieces) {
            if (piece.getColor() === this.turn) {
                piece.updateMoves(this, currentColorPinnedPieces);
            }
        }
        return [0, 0];
    }

    public updateBoardStateDebug(lastMove: Move | null) {
        this.updatePiecesMoves(lastMove);
        this.updateSpecialMoves();
        this.updateValidMoves(this.turn);
    }

    public evaluate(updateEvaluation=true): number {
        let evaluation: number = this.ai.evaluate();
        
        if (updateEvaluation) {
            this.setEvaluation(evaluation);
        }

        return evaluation;
    }

    public kingSafetyBalance(): number {
        let safety = 0;
    
        const colors = [1, -1];
    
        for (const color of colors) {
            const king = this.getKing(color);
            const kingSquare = king.getSquare();
    
            const adjacentSquares = this.getKingAdjacentSquares(kingSquare); 
            const squaresControlledByOpponent = this.getControlledSquaresByColor(-1 * color);
    
            for (const square of adjacentSquares) {
                safety += -color * squaresControlledByOpponent.get(square)!.size;
            }
        }
    
        return safety;
    }
    
    private getKingAdjacentSquares(kingSquare: Square): Square[] {
        const adjacents: Square[] = [];
    
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],          [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];
    
        for (const [dx, dy] of directions) {
            if (Board.isValidSquare(kingSquare.row + dx, kingSquare.column + dy)) {
                const adjacentSquare = this.getSquare(kingSquare.row + dx, kingSquare.column + dy);
                if (adjacentSquare) {
                    adjacents.push(adjacentSquare);
                }
            }
        }
    
        return adjacents;
    }   

    public pieceMobilityBalance(): number {
        const whiteControlledSquares = this.getControlledSquaresByColor(1);
        const blackControlledSquares = this.getControlledSquaresByColor(0);
    
        let whiteMobility = 0;
        whiteControlledSquares.forEach(controlledSquaresSet => {
            whiteMobility += controlledSquaresSet.size;
        });
    
        let blackMobility = 0;
        blackControlledSquares.forEach(controlledSquaresSet => {
            blackMobility += controlledSquaresSet.size;
        });
    
        return whiteMobility - blackMobility;
    }
    
    
    public getKing(color: number) {
        return color === 1 ? this.whiteKing : this.blackKing;
    }

    public getControlledSquaresByColor(color: number) {
        return color === 1 ? this.squaresAttackedByWhite : this.squaresAttackedByBlack;
    }

    setEvaluation(newEvaluation: number) {
        this.evaluation = newEvaluation;
        this.notifyEvaluationChange(newEvaluation);
    }
    
    getValidMoves() {
        return this.validMoves;
    }

    getLastMove(): Move {
        return this.movesMade[this.movesMade.length - 1];
    }

    public addEvaluationListener(listener: (value: number) => void): void {
        this.evaluationListeners.push(listener);
    }

    private notifyEvaluationChange(value: number): void {
        for (const listener of this.evaluationListeners) {
            listener(value);
        }
    }

    isCheckmate(): boolean {
        if (!this.isKingInCheck(this.turn)) return false;
        
        const validMoves = Array.from(this.getValidMoves());
        return validMoves.length === 0;
    }

    isStalemate(): boolean {
        if (this.isKingInCheck(this.turn)) return false;
        
        const validMoves = Array.from(this.getValidMoves());
        return validMoves.length === 0;
    }   
}
