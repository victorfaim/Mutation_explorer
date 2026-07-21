# LEIA PRIMEIRO

Este diretório reúne a documentação técnica vigente e os registros históricos do projeto.

## Ordem recomendada

1. `../AGENTS.md`
2. `08_CONTINUIDADE_ATUAL.md`
3. `01_VISAO_GERAL.md`
4. `02_ARQUITETURA.md`
5. `03_CALCULOS.md`
6. `04_BUGS_E_CUIDADOS.md`
7. `05_ROADMAP.md`
8. `09_FORMULA_MUTACAO_NATIVA.md`

O arquivo `07_INVENTARIO_ARQUIVOS.json` é um snapshot histórico e não representa o `HEAD`
atual. Em caso de divergência causada pela evolução do código, a continuidade atual
prevalece sobre os documentos antigos.

## Versão consolidada atual

Pal Mutation Explorer V2.4 — Resultados Expandidos, com dados oficiais de breeding e
tabelas de drop integrados posteriormente.

## Regra principal

O repositório e o estado atual dos arquivos são a fonte de verdade. Não presuma que um ZIP
ou inventário histórico esteja mais atualizado que o `HEAD` em análise.

Princípios técnicos:

- inspecionar os arquivos atuais;
- preservar as funcionalidades já existentes;
- evitar reconstruções desnecessárias;
- manter o projeto estático e compatível com GitHub Pages;
- não reintroduzir hotlinks;
- não compactar novamente a base detalhada de forma que `work` ou `drops` sejam perdidos.

## Assets

Os assets usados em runtime ficam em `assets/pals/`, `assets/items/`, `assets/elements/`,
`assets/work/` e `assets/icons_other/`. A publicação não depende de hotlinks.
