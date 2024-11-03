import chess
import re

def compute_material_count(board: chess.Board) -> int:
    """Calcula a diferença de valor de material no tabuleiro."""
    material = sum([
        len(board.pieces(chess.PAWN, chess.WHITE)) - len(board.pieces(chess.PAWN, chess.BLACK)),
        3 * (len(board.pieces(chess.KNIGHT, chess.WHITE)) - len(board.pieces(chess.KNIGHT, chess.BLACK))),
        3 * (len(board.pieces(chess.BISHOP, chess.WHITE)) - len(board.pieces(chess.BISHOP, chess.BLACK))),
        5 * (len(board.pieces(chess.ROOK, chess.WHITE)) - len(board.pieces(chess.ROOK, chess.BLACK))),
        9 * (len(board.pieces(chess.QUEEN, chess.WHITE)) - len(board.pieces(chess.QUEEN, chess.BLACK)))
    ])
    return material

def compute_total_material_count(board: chess.Board) -> int:
    """Calcula o valor total de material no tabuleiro."""
    material = sum([
        len(board.pieces(chess.PAWN, chess.WHITE)) + len(board.pieces(chess.PAWN, chess.BLACK)),
        3 * (len(board.pieces(chess.KNIGHT, chess.WHITE)) + len(board.pieces(chess.KNIGHT, chess.BLACK))),
        3 * (len(board.pieces(chess.BISHOP, chess.WHITE)) + len(board.pieces(chess.BISHOP, chess.BLACK))),
        5 * (len(board.pieces(chess.ROOK, chess.WHITE)) + len(board.pieces(chess.ROOK, chess.BLACK))),
        9 * (len(board.pieces(chess.QUEEN, chess.WHITE)) + len(board.pieces(chess.QUEEN, chess.BLACK)))
    ])
    return material

def compute_mobility(board: chess.Board) -> int:
    """Calcula a mobilidade como o número total de movimentos legais disponíveis para cada cor."""
    current_turn = board.turn

    board.turn = chess.WHITE
    white_mobility = len(list(board.legal_moves))

    board.turn = chess.BLACK
    black_mobility = len(list(board.legal_moves))

    board.turn = current_turn

    return white_mobility - black_mobility


def compute_central_control(board: chess.Board) -> int:
    """Calcula o controle central do tabuleiro (e4, d4, e5, d5) somando os ataques das peças brancas e subtraindo os ataques das pretas."""
    central_squares = [chess.E4, chess.D4, chess.E5, chess.D5]
    control = 0
    
    for square in central_squares:
        white_attacks = len(board.attackers(chess.WHITE, square))
        black_attacks = len(board.attackers(chess.BLACK, square))
        control += white_attacks - black_attacks
    
    return control

def compute_king_safety(board: chess.Board) -> int:
    """Avalia a segurança dos reis. Considera se há peças atacando as casas ao redor do rei."""
    safety = 0
    for color in [chess.WHITE, chess.BLACK]:
        king_square = board.king(color)
        adjacent_squares = chess.SquareSet(chess.BB_KING_ATTACKS[king_square])
        for square in adjacent_squares:
            if board.is_attacked_by(not color, square):
                safety -= 1 if color == chess.WHITE else -1
    return safety

def compute_connectivity(board: chess.Board) -> int:
    """Avalia a conectividade das peças, atribuindo diferentes pontos conforme a peça que defende."""
    connectivity = 0
    piece_values = {
        chess.PAWN: 50,
        chess.KNIGHT: 35,
        chess.BISHOP: 30,
        chess.ROOK: 10,
        chess.QUEEN: 4,
    }

    for square in chess.SQUARES:
        piece = board.piece_at(square)
        if piece:
            for defender_square in board.attackers(piece.color, square):
                defender = board.piece_at(defender_square)
                if defender and defender.piece_type in piece_values:
                    value = piece_values[defender.piece_type]
                    if piece.color == chess.WHITE:
                        connectivity += value
                    else:
                        connectivity -= value
    return connectivity

def get_pawns_position(board: chess.Board):
    """Retorna uma lista de posições dos peões brancos e outra dos peões pretos."""
    return list(board.pieces(chess.PAWN, chess.WHITE)), list(board.pieces(chess.PAWN, chess.BLACK))

def get_knights_position(board: chess.Board):
    """Retorna uma lista de posições dos cavalos brancos e outra dos cavalos pretos."""
    return list(board.pieces(chess.KNIGHT, chess.WHITE)), list(board.pieces(chess.KNIGHT, chess.BLACK))

def get_bishops_position(board: chess.Board):
    """Retorna uma lista de posições dos bispos brancos e outra dos bispos pretos."""
    return list(board.pieces(chess.BISHOP, chess.WHITE)), list(board.pieces(chess.BISHOP, chess.BLACK))

def get_rooks_position(board: chess.Board):
    """Retorna uma lista de posições das torres brancas e outra das torres pretas."""
    return list(board.pieces(chess.ROOK, chess.WHITE)), list(board.pieces(chess.ROOK, chess.BLACK))

def get_queens_position(board: chess.Board):
    """Retorna uma lista de posições das damas brancas e outra das damas pretas."""
    return list(board.pieces(chess.QUEEN, chess.WHITE)), list(board.pieces(chess.QUEEN, chess.BLACK))

def get_kings_position(board: chess.Board):
    """Retorna uma lista de posições dos reis brancos e outra dos reis pretos."""
    return list(board.pieces(chess.KING, chess.WHITE)), list(board.pieces(chess.KING, chess.BLACK))

def get_evaluation(fen_data: str) -> int:
    """Extrai a avaliação numérica de uma string FEN com avaliação no final."""
    try:
        evaluation = re.search(r',([-+]?\d+)', fen_data)
        if evaluation:
            return int(evaluation.group(1))
        else:
            raise ValueError("Avaliação não encontrada na string FEN.")
    except Exception as e:
        print(f"Erro ao processar a linha: {e}")
        return None
    
def attacking_squares(board: chess.Board, square: chess.Square) -> list:
    """
    Retorna uma lista de todas as casas que a peça na casa especificada pode atacar,
    com base nos movimentos válidos, ajustando o turno conforme a cor da peça na casa.
    """
    piece = board.piece_at(square)
    if piece:
        # Se a peça na casa for de cor oposta ao lado a jogar, inverta o turno
        original_turn = board.turn
        if piece.color != board.turn:
            board.turn = piece.color  # Temporariamente ajusta o turno para a cor da peça

        # Gerar todos os movimentos válidos da peça que está na casa especificada
        legal_moves = board.legal_moves
        attacks = [move.to_square for move in legal_moves if move.from_square == square]

        # Restaurar o turno original
        board.turn = original_turn
        return attacks
    return []

def attacked_squares(board: chess.Board, square: chess.Square) -> list:
    """
    Retorna uma lista de todas as casas cujas peças podem se mover para a casa especificada,
    ajustando o turno conforme a cor das peças que atacam a casa.
    """
    attackers = []

    for sq in chess.SQUARES:
        piece = board.piece_at(sq)
        if piece:
            # Se a peça que pode atacar for de cor oposta ao turno, ajustar temporariamente
            original_turn = board.turn
            if piece.color != board.turn:
                board.turn = piece.color  # Temporariamente ajusta o turno para a cor da peça

            # Verificar se a peça pode atacar a casa especificada
            legal_moves = board.legal_moves
            if any(move.to_square == square and move.from_square == sq for move in legal_moves):
                attackers.append(sq)

            # Restaurar o turno original
            board.turn = original_turn
    return attackers

"""
fen_data = "3r1b2/kbr2p2/1q3p2/pp5p/3N1P2/P1Pp2P1/BP1Q3P/K1RR4 b - - 1 32,+11"

board = chess.Board(fen=fen_data.split(",")[0])

material = compute_material_count(board)
mobility = compute_mobility(board)
central_control = compute_central_control(board)
king_safety = compute_king_safety(board)
connectivity = compute_connectivity(board)
evaluation = get_evaluation(fen_data)
pawns = get_pawns_position(board)
knight = get_knights_position(board)
bishops = get_bishops_position(board)
rooks = get_rooks_position(board)
queens = get_queens_position(board)
kings = get_kings_position(board)

print(f"Material: {material}")
print(f"Mobilidade: {mobility}")
print(f"Controle Central: {central_control}")
print(f"Segurança do Rei: {king_safety}")
print(f"Conectividade: {connectivity}")
print(f"Avaliação: {evaluation}")
print(f"pawns: {pawns}")
print(f"knight: {knight}")
print(f"bishop: {bishops}")
print(f"rook: {rooks}")
print(f"queens: {queens}")
print(f"kings: {kings}")
"""