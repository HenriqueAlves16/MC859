import sqlite3
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from matplotlib.widgets import Button
from matplotlib.colors import LinearSegmentedColormap


# Conectar ao banco de dados
conn = sqlite3.connect('chess_analysis.db')
cursor = conn.cursor()

# Consultar todos os dados da tabela heat_map
cursor.execute("SELECT * FROM heat_map")
data = cursor.fetchall()

# Definir peças e cores
pieces = [
    'square', 'white_pawn', 'white_knight', 'white_bishop', 'white_rook', 'white_queen', 'white_king',
    'black_pawn', 'black_knight', 'black_bishop', 'black_rook', 'black_queen', 'black_king'
]

# Função para garantir que os dados são acessados e organizados corretamente no tabuleiro 8x8
def extract_piece_data(data, col_index):
    # Extrair valores e substituir None por 0 para evitar erros de visualização
    piece_data = np.array([row[col_index] if row[col_index] is not None else 0 for row in data]).reshape(8, 8)
    # Espelhar nos eixos X e Y
    piece_data = np.flip(piece_data, axis=(0, 1))
    return piece_data

# Preparar dados das peças
piece_data_list = [extract_piece_data(data, i) for i in range(len(pieces))]

# Configurações iniciais
current_index = 0

# Função para atualizar o mapa de calor
cmap = LinearSegmentedColormap.from_list("custom_cmap", ["black", "white"])
def update_heatmap(index):
    ax.clear()
    sns.heatmap(
        piece_data_list[index], annot=True, fmt=".0f", cmap=cmap, center=0, cbar=False, square=True,
        linewidths=.5, linecolor='black', annot_kws={"size": 10, "color": "#8c0112"}, ax=ax
    )
    
    ax.set_xticklabels(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], fontsize=10)
    ax.set_yticklabels([8, 7, 6, 5, 4, 3, 2, 1], fontsize=10, rotation=0)
    ax.set_title(pieces[index].replace('_', ' ').capitalize(), fontsize=12)
    fig.canvas.draw()

# Funções de callback para os botões
def next_heatmap(event):
    global current_index
    current_index = (current_index + 1) % len(pieces)
    update_heatmap(current_index)

def previous_heatmap(event):
    global current_index
    current_index = (current_index - 1) % len(pieces)
    update_heatmap(current_index)

# Configuração da figura e do primeiro mapa de calor
fig, ax = plt.subplots(figsize=(6, 6))
plt.subplots_adjust(bottom=0.2)  # Ajuste para dar espaço para os botões

# Botões para navegação
axprev = plt.axes([0.1, 0.05, 0.1, 0.075])
axnext = plt.axes([0.8, 0.05, 0.1, 0.075])
btn_prev = Button(axprev, 'Back')
btn_next = Button(axnext, 'Next')
btn_prev.on_clicked(previous_heatmap)
btn_next.on_clicked(next_heatmap)

# Exibir o primeiro mapa de calor
update_heatmap(current_index)
plt.show()

# Fechar conexão com o banco de dados
conn.close()
