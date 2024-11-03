import { Board } from './Board.js';
import { Piece } from './Piece.js';
import { King } from './King.js';
import { Move } from './Move.js';
import { Pawn } from './Pawn.js';

var clickedPiece: Piece | null = null;
const DEPTH = 3;

document.addEventListener('DOMContentLoaded', () => {
    const boardElement = document.querySelector('.board') as HTMLElement;
    let board = new Board();

    const evaluationDiv = document.createElement('div');
    evaluationDiv.classList.add('evaluation');
    evaluationDiv.textContent = `Evaluation: ${board.evaluation}`;
    document.body.appendChild(evaluationDiv);

    board.addEvaluationListener((newEvaluation) => {
        evaluationDiv.textContent = `Evaluation: ${newEvaluation}`;
    });

    document.getElementById('undo-button')!.addEventListener('click', () => {
        board.undoMove();
        updateBoard();
    });

    for (let row = 7; row >= 0; row--) {
        for (let column = 0; column < 8; column++) {
            const squareElement = document.createElement('div');
            squareElement.classList.add('square');
            squareElement.classList.add((row + column) % 2 === 0 ? 'black' : 'white');
            squareElement.dataset.row = row.toString();
            squareElement.dataset.column = column.toString();

            const piece = board.getSquare(row, column).occupied_by;
            if (piece) {
                const img = document.createElement('img');
                img.src = piece.getPathToImg();
                squareElement.appendChild(img);
            }
            squareElement.addEventListener('click', () => handleSquareClick(row, column));
            boardElement.appendChild(squareElement);
        }
    }

    function handleSquareClick(row: number, column: number): void {
        const square = board.getSquare(row, column);
        const piece = square.occupied_by;

        if (piece) {
            if (piece === clickedPiece) {
                clearHighlight();
                clickedPiece = null;
            } else if (clickedPiece && clickedPiece.getAllPossibleMoves().has(square)) {
                const move: Move = new Move(clickedPiece.getSquare(), square);
                board.makeMove(move);
                updateBoard();
                board.ai.makeAlfabetaMove(DEPTH);
                updateBoard();
                clearHighlight();
                clickedPiece = null;
            } else if (piece.getColor() === board.getTurn()) {
                highlightMoves(piece, board);
                clickedPiece = piece;
            } else {
                clearHighlight();
                clickedPiece = null;
            }
        } else {
            if (clickedPiece && clickedPiece.getAllPossibleMoves().has(square)) {
                const move: Move = new Move(clickedPiece.getSquare(), square);
                board.makeMove(move);
                updateBoard();
                board.ai.makeAlfabetaMove(DEPTH);
                updateBoard();
            }
            clearHighlight();
            clickedPiece = null;
        }
        board.evaluate();
    }

    function highlightMoves(piece: Piece, board: Board): void {
        if (piece) {
            const possibleNoCaptureMoves = piece.getNoCaptureMoves();
            const captures = piece.getCaptures();
            clearHighlight();
            possibleNoCaptureMoves.forEach(move => {
                const moveElement = document.querySelector(`.square[data-row="${move.row}"][data-column="${move.column}"]`) as HTMLElement;
                if (moveElement) {
                    moveElement.classList.add('highlight-move');
                }
            });

            captures.forEach(capture => {
                const captureElement = document.querySelector(`.square[data-row="${capture.row}"][data-column="${capture.column}"]`) as HTMLElement;
                if (captureElement) {
                    captureElement.classList.add('highlight-capture');
                }
            });

            if (piece instanceof King || piece instanceof Pawn) {
                const specialMoves = piece.getSpecialMoves();
                specialMoves.forEach(move => {
                    const specialMoveElement = document.querySelector(`.square[data-row="${move.row}"][data-column="${move.column}"]`) as HTMLElement;
                    if (specialMoveElement) {
                        specialMoveElement.classList.add('highlight-special-move');
                    }
                });
            }
        } else {
            clearHighlight();
        }
    }

    function clearHighlight(): void {
        const highlightedMoves = document.querySelectorAll('.highlight-move');
        highlightedMoves.forEach(square => square.classList.remove('highlight-move'));

        const highlightedCaptures = document.querySelectorAll('.highlight-capture');
        highlightedCaptures.forEach(square => square.classList.remove('highlight-capture'));

        const highlightedSpecialMoves = document.querySelectorAll('.highlight-special-move');
        highlightedSpecialMoves.forEach(square => square.classList.remove('highlight-special-move'));
    }

    function updateBoard(): void {
        for (let row = 7; row > -1; row--) {
            for (let column = 0; column < 8; column++) {
                const squareElement = document.querySelector(`.square[data-row="${row}"][data-column="${column}"]`) as HTMLElement;
                const piece = board.getSquare(row, column).occupied_by;

                squareElement.innerHTML = '';

                if (piece) {
                    const img = document.createElement('img');
                    img.src = piece.getPathToImg();
                    squareElement.appendChild(img);
                }
            }
        }
    }
});
