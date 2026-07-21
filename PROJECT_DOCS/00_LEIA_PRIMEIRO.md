# LEIA PRIMEIRO

Este diretório existe para permitir que o projeto continue em outro chat sem depender do
histórico completo da conversa anterior.

## Ordem recomendada

1. `../AGENTS.md`
2. `08_CONTINUIDADE_ATUAL.md`
3. `01_VISAO_GERAL.md`
4. `02_ARQUITETURA.md`
5. `03_CALCULOS.md`
6. `04_BUGS_E_CUIDADOS.md`
7. `05_ROADMAP.md`
8. `06_PROMPT_PROXIMO_CHAT.md`

O arquivo `07_INVENTARIO_ARQUIVOS.json` é um snapshot histórico e não representa o `HEAD`
atual. Em caso de divergência causada pela evolução do código, a continuidade atual
prevalece sobre os documentos antigos.

## Versão consolidada atual

Pal Mutation Explorer V2.4 — Resultados Expandidos, com dados oficiais de breeding e
tabelas de drop integrados posteriormente.

## Regra principal

O repositório e o estado atual dos arquivos são a fonte de verdade. Não presuma que um ZIP
ou inventário histórico esteja mais atualizado que o `HEAD` em análise.

Antes de modificar qualquer coisa:

- inspecionar os arquivos atuais;
- preservar as funcionalidades já existentes;
- evitar reconstruções desnecessárias;
- manter o projeto estático e compatível com GitHub Pages;
- não reintroduzir hotlinks;
- não compactar novamente a base detalhada de forma que `work` ou `drops` sejam perdidos.

## Assets

Este pacote pode conter somente a estrutura vazia das pastas de assets, dependendo da
versão usada como base.

Se os PNGs locais não estiverem dentro do ZIP, copie novamente suas pastas:

assets/pals/
assets/items/
assets/elements/
assets/work/
assets/icons_other/

antes de publicar.
