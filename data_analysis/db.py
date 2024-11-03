from position_analyzer import *

import sqlite3
import csv


def insert_data(fen, material, total_material, mobility, central_control, king_safety, connectivity, evaluation, pawns, knights, bishops, rooks, queens, kings):
    """Insere uma posição de xadrez e sua avaliação no banco de dados."""
    cursor.execute('''
        INSERT OR REPLACE INTO positions (fen, material, total_material, mobility, central_control, king_safety, connectivity, evaluation, pawns, knights, bishops, rooks, queens, kings)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (fen, material, total_material, mobility, central_control, king_safety, connectivity, evaluation, str(pawns), str(knights), str(bishops), str(rooks), str(queens), str(kings)))
    conn.commit()

conn = sqlite3.connect('chess_analysis.db')
cursor = conn.cursor()

cursor.execute('''
    CREATE TABLE IF NOT EXISTS positions (
        fen TEXT PRIMARY KEY,
        material INTEGER,
        total_material INTEGER,
        mobility INTEGER,
        central_control INTEGER,
        king_safety INTEGER,
        connectivity INTEGER,
        evaluation INTEGER,
        pawns TEXT,
        knights TEXT,
        bishops TEXT,
        rooks TEXT,
        queens TEXT,
        kings TEXT
    )
''')


CSV_FILE_PATH = 'data/chessData.csv'
POSITIONS_ANALYZED = 200000

fen_data_list = []
with open(CSV_FILE_PATH, 'r') as file:
    reader = csv.reader(file)
    next(reader)
    
    for i, row in enumerate(reader):
        if i == POSITIONS_ANALYZED:
            break
        fen_data_list.append(row)
        

for fen_data in fen_data_list:
    board = chess.Board(fen=fen_data[0])
    
    material = compute_material_count(board)
    total_material = compute_total_material_count(board)
    mobility = compute_mobility(board)
    central_control = compute_central_control(board)
    king_safety = compute_king_safety(board)
    connectivity = compute_connectivity(board)
    evaluation = fen_data[1]
    pawns = get_pawns_position(board)
    knight = get_knights_position(board)
    bishops = get_bishops_position(board)
    rooks = get_rooks_position(board)
    queens = get_queens_position(board)
    kings = get_kings_position(board)
    
    insert_data(fen_data[0], material, total_material, mobility, central_control, king_safety, connectivity, evaluation, pawns, knight, bishops, rooks, queens, kings)


conn.commit()
conn.close()