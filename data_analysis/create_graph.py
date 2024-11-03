import sqlite3
import csv
import chess
from position_analyzer import *

# Criar a tabela no banco de dados
def create_attack_table(conn):
    cursor = conn.cursor()
    columns = ', '.join([f'square_{i} TEXT' for i in range(64)])
    cursor.execute(f'''
        CREATE TABLE IF NOT EXISTS graph_connections (
            fen TEXT PRIMARY KEY,
            {columns}
        )
    ''')
    conn.commit()

# Função para gerar dados de ataques e defesas para cada FEN
def generate_attack_data(board: chess.Board):
    attack_defense_data = []
    for square in chess.SQUARES:
        attacking = attacking_squares(board, square)
        attacked = attacked_squares(board, square)
        attack_defense_data.append(f'([{attacking}], [{attacked}])')
    return attack_defense_data

# Função para inserir dados de ataques e defesas no banco de dados
def insert_attack_data(conn, fen, attack_data):
    cursor = conn.cursor()
    columns = ', '.join([f'square_{i}' for i in range(64)])
    values = ', '.join(['?' for _ in range(64)])
    cursor.execute(f'''
        INSERT INTO graph_connections (fen, {columns})
        VALUES (?, {values})
    ''', [fen] + attack_data)
    conn.commit()

conn = sqlite3.connect('chess_analysis.db')
create_attack_table(conn)

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
    
    # Inserir os dados no banco de dados
    attack_data = generate_attack_data(board)
    insert_attack_data(conn, fen_data[0], attack_data)

conn.close()
