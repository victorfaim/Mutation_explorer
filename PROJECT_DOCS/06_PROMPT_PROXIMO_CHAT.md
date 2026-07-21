# PROMPT PRONTO PARA O PRÓXIMO CHAT

Copie e cole a mensagem abaixo no novo chat e anexe este ZIP:

---

Estamos continuando o projeto **Pal Mutation Explorer**, atualmente na versão
**V2.4 Resultados Expandidos**.

O ZIP anexado contém:

- o código completo e funcional;
- as bases JavaScript;
- os assets locais ou a estrutura esperada para eles;
- a documentação técnica em `PROJECT_DOCS`;
- o histórico de decisões;
- fórmulas dos rankings;
- bugs já corrigidos;
- roadmap.

Leia primeiro estes arquivos:

1. `PROJECT_DOCS/00_LEIA_PRIMEIRO.md`
2. `PROJECT_DOCS/01_VISAO_GERAL.md`
3. `PROJECT_DOCS/02_ARQUITETURA.md`
4. `PROJECT_DOCS/03_CALCULOS.md`
5. `PROJECT_DOCS/04_BUGS_E_CUIDADOS.md`
6. `PROJECT_DOCS/05_ROADMAP.md`

Regras importantes do projeto:

- manter compatibilidade com GitHub Pages;
- não usar backend obrigatório;
- não usar hotlink;
- preservar assets locais;
- manter as bases grandes separadas;
- atualizar o menu em todas as páginas ao adicionar uma página nova;
- aplicar cache-busting nos scripts;
- não alterar funcionalidades existentes sem necessidade;
- validar os casos conhecidos de itens e menus antes de entregar uma nova versão.

A versão atual possui:

- mutação reversa;
- auditoria de mutações;
- Pals não obtíveis;
- caminho de breeding;
- Palpedia;
- enciclopédia de itens;
- Tier List de combate;
- comparador de combate;
- Tier List de trabalho;
- Worker Finder.

Quero continuar exatamente a partir desta versão. Primeiro inspecione a estrutura e
confirme quais arquivos serão alterados antes de implementar a próxima funcionalidade.

---

## Sugestão de primeira tarefa no novo chat

“Vamos implementar o V2.2 começando por mostrar os rankings de combate e trabalho dentro
da ficha individual de cada Pal.”
