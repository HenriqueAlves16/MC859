# Inteligência Artificial de xadrez
Este projeto foi desenvolvido pelo aluno Henrique Alves de Fernando na disciplina MC859 - Projetos em Teoria da Computação, ministrada na Universidade Estadual de Campinas (Unicamp).

# Autor
Henrique Alves de Fernando

RA: 236538

# Instruções para Execução Local

## Executando o Projeto

Para executar este projeto localmente, siga os passos abaixo:

1. Abra o terminal na pasta raiz do projeto.
2. Navegue até a pasta `./bot`:
   cd ./bot
3. Execute o comando para compilar o código TypeScript: `npx tsc`
4. Abra o Visual Studio Code (VSCode) e ative a extensão Live Server. Clique em Go Live no canto inferior direito do VSCode para iniciar um servidor local e visualizar a interface gráfica no navegador.

# Estrutura do projeto
## Análise de dados
Todos os scripts e funções desenvolvidas para a população do banco de dados e posteriores análises estão no diretório data_analysis.

## Interface Gráfica
* **index.html:** Arquivo HTML principal que estrutura a interface do jogo. Ele define o layout básico da página e incorpora os scripts e folhas de estilo.

* **styles.css:** Arquivo de estilos responsável pela aparência do jogo, incluindo o layout do tabuleiro, as peças e outros elementos visuais.

* **UI.ts:** Script TypeScript que controla a interface do usuário. Ele gerencia a atualização visual do tabuleiro, incluindo a movimentação de peças e outros elementos de interação com o usuário.

## Lógica do Jogo
**Board.ts:** Este arquivo contém a lógica central do jogo de xadrez, incluindo as regras do tabuleiro, validação de movimentos e controle de estado do jogo. É o núcleo onde a maioria das operações relacionadas ao tabuleiro e ao fluxo do jogo são executadas.

## Lógica das Peças
Cada peça possui sua lógica de movimentação definida em arquivos individuais, que contêm regras específicas para movimentos válidos de cada tipo de peça.

## Avaliação e Tomada de Decisão
**Ai.ts:** Este arquivo contém a lógica de inteligência artificial para o bot. Ele é responsável por avaliar a posição no tabuleiro e tomar decisões de jogadas, incluindo a análise de movimentos e a escolha de lances estratégicos.

