import sqlite3
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error

NUM_SQUARES = 64

# Função para atualizar a lista com avaliações e contagem de avaliações
def update_positions(df, piece_type, color, piece_positions, piece_col):
    for index, row in df.iterrows():
        positions = eval(row[piece_col])
        evaluation = row['avaliacao_numerica']
        
        if color == 'white':
            piece_list = positions[0]  # Primeira lista é para peças brancas
        else:
            piece_list = positions[1]  # Segunda lista é para peças pretas
            
        for pos in piece_list:
            piece_positions[color + '_' + piece_type]['sum'][pos] += evaluation
            piece_positions[color + '_' + piece_type]['count'][pos] += 1

# Conectar ao banco de dados
conn = sqlite3.connect('chess_analysis.db')

# Ler os dados da tabela 'positions'
query = "SELECT * FROM positions WHERE material = 0 AND total_material > 40"
df = pd.read_sql_query(query, conn)

# Fechar a conexão
conn.close()

# Verificar os dados
print(df.head())

# Criar uma nova coluna indicando a presença de xeque-mate
df['is_mate'] = df['evaluation'].apply(lambda x: 1 if '#' in str(x) else 0)

# Separar a avaliação numérica das avaliações de xeque-mate
df['avaliacao_numerica'] = df['evaluation'].apply(lambda x: 1000 - int(x[1:]) if '#' in str(x) else float(x))

# Filtrar as linhas sem xeque-mate para regressão
df_no_mate = df[df['is_mate'] == 0]

# Definir as variáveis independentes e dependente
X = df_no_mate[['material', 'mobility', 'central_control', 'king_safety', 'connectivity']]
y = df_no_mate['avaliacao_numerica']

# Filtrar dados onde o material é zero
df_equal_material = df_no_mate[df_no_mate['material'] == 0]

# Inicializar dicionários para armazenar soma e contagem de avaliações para cada peça e posição
piece_positions = {
    'white_pawn': {'sum': np.zeros(NUM_SQUARES), 'count': np.zeros(NUM_SQUARES)},
    'white_knight': {'sum': np.zeros(NUM_SQUARES), 'count': np.zeros(NUM_SQUARES)},
    'white_bishop': {'sum': np.zeros(NUM_SQUARES), 'count': np.zeros(NUM_SQUARES)},
    'white_rook': {'sum': np.zeros(NUM_SQUARES), 'count': np.zeros(NUM_SQUARES)},
    'white_queen': {'sum': np.zeros(NUM_SQUARES), 'count': np.zeros(NUM_SQUARES)},
    'white_king': {'sum': np.zeros(NUM_SQUARES), 'count': np.zeros(NUM_SQUARES)},
    'black_pawn': {'sum': np.zeros(NUM_SQUARES), 'count': np.zeros(NUM_SQUARES)},
    'black_knight': {'sum': np.zeros(NUM_SQUARES), 'count': np.zeros(NUM_SQUARES)},
    'black_bishop': {'sum': np.zeros(NUM_SQUARES), 'count': np.zeros(NUM_SQUARES)},
    'black_rook': {'sum': np.zeros(NUM_SQUARES), 'count': np.zeros(NUM_SQUARES)},
    'black_queen': {'sum': np.zeros(NUM_SQUARES), 'count': np.zeros(NUM_SQUARES)},
    'black_king': {'sum': np.zeros(NUM_SQUARES), 'count': np.zeros(NUM_SQUARES)},
}

# Atualizar posições para cada tipo de peça
piece_cols = {
    'pawn': 'pawns',
    'knight': 'knights',
    'bishop': 'bishops',
    'rook': 'rooks',
    'queen': 'queens',
    'king': 'kings'
}

for piece_type in piece_cols.keys():
    for color in ['white', 'black']:
        update_positions(df_equal_material, piece_type, color, piece_positions, piece_cols[piece_type])

# Calcular a avaliação média para cada peça em cada posição
piece_avg_evaluation = {}
for piece, data in piece_positions.items():
    # Dividir a soma pela contagem para obter a média, evitando divisão por 0
    piece_avg_evaluation[piece] = np.zeros(NUM_SQUARES)
    for i in range(NUM_SQUARES):
        if data['count'][i] > 10:  # Apenas dividir se o contador for maior que zero
            piece_avg_evaluation[piece][i] = round(data['sum'][i] / data['count'][i], 2)
        else:
            piece_avg_evaluation[piece][i] = None  # Evitar divisão por zero

"""
for house in range(NUM_SQUARES):  # Para cada casa no tabuleiro (de 0 a 63)
    print(f"square {house}:")
    for piece in piece_positions.keys():
        avg_eval = piece_avg_evaluation[piece][house]
        print(f"  {piece}: {avg_eval:.2f}")
    print()
"""
# Conectar ao banco de dados
conn = sqlite3.connect('chess_analysis.db')
cursor = conn.cursor()

# Criar a tabela heat_map
cursor.execute('''
    CREATE TABLE IF NOT EXISTS heat_map (
        house INTEGER PRIMARY KEY,
        white_pawn REAL,
        white_knight REAL,
        white_bishop REAL,
        white_rook REAL,
        white_queen REAL,
        white_king REAL,
        black_pawn REAL,
        black_knight REAL,
        black_bishop REAL,
        black_rook REAL,
        black_queen REAL,
        black_king REAL
    )
''')

# Inserir os dados na tabela heat_map
for house in range(64):  # Para cada casa no tabuleiro (de 0 a 63)
    cursor.execute('''
        INSERT OR REPLACE INTO heat_map (
            house, white_pawn, white_knight, white_bishop, white_rook, white_queen, white_king,
            black_pawn, black_knight, black_bishop, black_rook, black_queen, black_king
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        house,
        piece_avg_evaluation['white_pawn'][house],
        piece_avg_evaluation['white_knight'][house],
        piece_avg_evaluation['white_bishop'][house],
        piece_avg_evaluation['white_rook'][house],
        piece_avg_evaluation['white_queen'][house],
        piece_avg_evaluation['white_king'][house],
        piece_avg_evaluation['black_pawn'][house],
        piece_avg_evaluation['black_knight'][house],
        piece_avg_evaluation['black_bishop'][house],
        piece_avg_evaluation['black_rook'][house],
        piece_avg_evaluation['black_queen'][house],
        piece_avg_evaluation['black_king'][house]
    ))

# Fechar a conexão
conn.commit()

# Dividir os dados em treino e teste
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Criar o modelo de regressão linear
model = LinearRegression()

# Treinar o modelo
model.fit(X_train, y_train)

# Fazer previsões
y_pred = model.predict(X_test)

# Avaliar o modelo com erro quadrático médio
mse = mean_squared_error(y_test, y_pred)
print(f'Erro Quadrático Médio: {mse}')

# Exibir os coeficientes da regressão
coefficients = pd.DataFrame(model.coef_, X.columns, columns=['Coefficient'])
print(coefficients)
