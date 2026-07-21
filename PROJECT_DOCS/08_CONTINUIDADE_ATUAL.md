# CONTINUIDADE ATUAL DO PROJETO

Este documento registra o estado observado no `HEAD` `9d36c50` da branch `main`, em
21/07/2026. Ele complementa os documentos 01–06 e prevalece quando houver divergência
causada pela evolução posterior do código.

## Estado do repositório analisado

- Repositório: `https://github.com/victorfaim/Mutation_explorer.git`
- Branch: `main`
- Referência analisada: `9d36c50` (`Delete CONTINUAR_EM_OUTRO_CHAT.txt`)
- Situação antes desta documentação: árvore limpa e sincronizada com `origin/main`
- Publicação: site estático compatível com GitHub Pages
- Build: inexistente; os arquivos da raiz são publicados diretamente
- Backend ou API obrigatória: nenhum
- Dependências externas em runtime: nenhuma deve ser necessária

## Linha de evolução confirmada pelo Git

O histórico contém 91 commits alcançáveis nas referências atuais, concentrados em 20 e
21/07/2026, além de um merge ligado ao
antigo `CNAME`. As fases funcionais mais importantes foram:

1. criação do núcleo de auditoria, mutação reversa, bases compactas e páginas iniciais;
2. criação da home multipágina e ajustes para GitHub Pages;
3. caminho de breeding;
4. Palpedia e ficha individual, seguidas pela restauração de trabalho e drops;
5. adoção de assets locais para eliminar hotlinks;
6. enciclopédia e ficha de itens, incluindo correções de fontes e colisões;
7. Tier List e comparador de combate;
8. rankings e ferramentas de trabalho;
9. Partner Skills e Team Builder, evoluído até V2.4 Resultados Expandidos;
10. reorganização de páginas, consolidação de rankings e redirecionamentos legados;
11. internacionalização de interface;
12. integração de tabelas oficiais de drop e regras oficiais de breeding;
13. correções finais das páginas de itens;
14. remoção do antigo `CONTINUAR_EM_OUTRO_CHAT.txt`.

O histórico do `CNAME` mostra criação, alteração e remoção no mesmo dia. No estado atual
não há `CNAME`, `.nojekyll`, workflow de deploy ou `404.html` versionado. Portanto, não
reintroduzir domínio personalizado nem mudar o mecanismo de publicação por suposição.

## Arquitetura vigente

### Bases carregadas no navegador

- `data.js`: base compacta, mutações, vizinhanças e regras básicas de breeding.
- `breeding-official-data.js`: complementa `window.PAL_DATA` com `combiRank`,
  `combiPriority`, `ignoreCombi` e `isBoss`; substitui regras únicas pelas DataTables
  oficiais e adiciona regras dependentes de gênero.
- `pal-tooltip-data.js`: mapa compacto de sufixos, raridades e elementos da Palpedia usado
  nos tooltips das ferramentas leves, sem exigir o carregamento de `palpedia-data.js`.
- `audit-data.js`: `window.PAL_STATUS` e `window.AUDIT_SUMMARY` pré-calculados.
- `palpedia-data.js`: `window.PALPEDIA_DATA`, com ficha detalhada de cada Pal.
- `items-data.js`: `window.ITEMS_DATA`, índice reverso principal dos 116 itens.
- `drop-tables-data.js`: `window.PAL_DROP_TABLES`, com variantes normal/boss e fontes
  condicionais.

Esses arquivos são contratos de dados. Não renomear seus globais nem alterar o formato sem
atualizar todos os consumidores.

### Código compartilhado

- `core.js`: helpers de HTML, seletores, assets, idiomas e regras comuns de breeding.
- `asset-config.js`: configuração dos diretórios e ícones locais.
- `i18n.js`: catálogo e comportamento de tradução.
- `combat-score.js`: normalização e scores de combate.
- `work-score.js`: scores de trabalho, versatilidade e especialização.
- `drop-tables.js`: união e apresentação das tabelas de drop oficiais.
- `skill-recommendations.js`: recomendações relacionadas a Active Skills.
- `style.css`: estilos globais e de todos os módulos.

### Páginas funcionais

- `index.html`: home.
- `reverso.html`: mutação reversa.
- `caminho.html`: menor caminho de breeding por BFS.
- `palpedia.html` e `pal.html`: lista e ficha detalhada de Pals.
- `itens.html` e `item.html`: catálogo e ficha de itens.
- `partner-skills.html`: enciclopédia de Partner Skills.
- `team-builder.html`: composição heurística de times e alternativas.
- `tierlist.html`: rankings consolidados de combate e trabalho.
- `comparador.html`: comparador de combate.
- `comparador-trabalho.html`: comparador de trabalho ainda funcional.

### URLs legadas preservadas

- `auditoria.html` → `palpedia.html`
- `enciclopedia.html` → `palpedia.html`
- `impossiveis.html` → `palpedia.html?mutation=not-obtainable`
- `tiertrabalho.html` → `tierlist.html?tab=work`
- `worker-finder.html` → `tierlist.html?tab=work&multi=1`

Os redirecionamentos usam `meta refresh`, `location.replace` e um link de fallback. Eles
preservam URLs antigas e não devem ser apagados como arquivos “duplicados”.

## Assets e volume atual

Contagem observada na árvore atual:

- `assets/pals/`: 300 PNGs, além de `.gitkeep`;
- `assets/items/`: 116 PNGs, além de `.gitkeep`;
- `assets/elements/`: 9 PNGs, além de `.gitkeep`;
- `assets/icons_other/` e `assets/work/`: apenas `.gitkeep` no momento.

O resolvedor tenta extensões locais e os nomes são sensíveis a maiúsculas/minúsculas no
GitHub Pages. Não trocar a capitalização nem converter referências para hotlinks.

## Dados gerados e reprodutibilidade

`tools/generate-drop-tables.py` gera `drop-tables-data.js` a partir de
`DT_PalDropItem_Common.json`. `tools/generate-breeding-official-data.py` gera
`breeding-official-data.js` a partir de `DT_PalMonsterParameter_Common.json` e
`DT_PalCombiUnique.json`.

`tools/generate-mutation-audit.js` regenera `audit-data.js` a partir das bases versionadas.
A evidência, fórmula, limites e casos reproduzíveis estão em
`09_FORMULA_MUTACAO_NATIVA.md`. O campo histórico `pairs` representa índices ponderados;
`routePairs` representa casais distintos.

`tools/generate-mutation-audit.js` gera `audit-data.js` exclusivamente a partir de
`data.js` e `breeding-official-data.js`, sem exigir dumps externos. A fórmula de mutação
foi confirmada no código nativo do build Steam 24181527: quantidade
`max(1, round(lowRank * 0.1))` e início
`round(lowRank * 0.5) + round(rankDiff * 0.4) + 1`. Cada índice do intervalo tem peso
uniforme e é convertido pelo mapa de rank mais próximo. O campo histórico `pairs` guarda
ocorrências ponderadas; `routePairs` guarda a quantidade de casais distintos.

As fontes brutas não estão versionadas. Os scripts atualmente apontam para um caminho
absoluto histórico sob `/workspace/scratch/.../upload`, portanto não são reproduzíveis em
uma máquina nova sem fornecer as DataTables e ajustar o caminho de entrada. Até isso ser
resolvido:

- preserve as saídas geradas existentes;
- não execute os geradores esperando que funcionem sem as fontes;
- não edite as saídas manualmente;
- se houver regeneração autorizada, registre a origem e versão exata das DataTables e
  valide o diff de dados antes de substituir os arquivos.

## Ordem de carregamento e desempenho

As páginas usam scripts clássicos e globais em `window`. A ordem é significativa:

1. bases compactas ou detalhadas necessárias;
2. `asset-config.js` e `core.js`;
3. motores compartilhados;
4. módulo específico da página.

`breeding-official-data.js` deve vir depois de `data.js`, pois complementa
`window.PAL_DATA`. Bases grandes devem continuar restritas às páginas consumidoras:
`palpedia-data.js` tem cerca de 1 MB, `drop-tables-data.js` cerca de 734 KB,
`items-data.js` cerca de 234 KB e `data.js` cerca de 211 KB.

## Contratos funcionais que não podem regredir

### Itens e drops

- A identidade de item é a chave composta `icon|name`.
- `items-data.js` carrega os dados completos de cada fonte e não depende de `data.js` para
  renderizar as linhas.
- Casos de referência: Aquatic Pal Fluids = 37 fontes; Decayed Ancient Relic = 106;
  Dormant Ancient Relic = 106.
- `item.js` deve obter `item-loading` e `item-detail` explicitamente pelo DOM.
- Drops normais, de boss e condicionais devem continuar diferenciados.

### Breeding e mutação

- Regras oficiais únicas têm precedência sobre o cálculo normal.
- Regras com gênero não podem ser reduzidas a pares sem gênero.
- `ignoreCombi`, rank e prioridade oficial influenciam os resultados.
- No caminho BFS, o Pal inicial participa obrigatoriamente da primeira etapa e cada filho
  vira a linhagem da etapa seguinte.
- Estados `obtainable`, `unreachable` e `blocked` permanecem distintos.

### Rankings e recomendações

- Scores são heurísticos por atributos-base, não uma tier definitiva do meta.
- Fórmulas de combate e trabalho estão em `03_CALCULOS.md`.
- Team Builder retorna até cinco Pals e lista candidatos positivos restantes como
  alternativas; a seleção antiga de Pal principal foi removida na V2.4.
- Filtros especializados de drop são estritos; falta de especialista deixa vaga livre em
  vez de inserir sugestão irrelevante.

### GitHub Pages

- Usar caminhos relativos e nomes com capitalização exata.
- Não depender de servidor para roteamento; as URLs são arquivos `.html` e query strings.
- Preservar `index.html` na raiz.
- Atualizar cache-busting quando assets servidos mudarem.
- Publicar o conjunto coerente de HTML, CSS, JS, dados e assets, não apenas uma página.

## Situações conhecidas que exigem decisão, não correção automática

- A navegação compacta de `palpedia.html` e `tierlist.html` difere da navegação extensa de
  outras páginas. Isso reflete a consolidação recente e não deve ser alterado incidentalmente.
- `comparador-trabalho.html` existe e funciona, mas ficou fora do menu compacto.
- `README.txt` ainda descreve ícones remotos; a implementação atual e
  `README_ASSETS_LOCAIS.txt` confirmam que os assets são locais.
- `PROJECT_DOCS/00_LEIA_PRIMEIRO.md` dizia V2.1, embora o código já estivesse em V2.4.
- `PROJECT_DOCS/02_ARQUITETURA.md` ainda menciona Pal principal opcional no Team Builder;
  essa seleção foi removida na V2.4.
- `PROJECT_DOCS/05_ROADMAP.md` contém itens já parcialmente implementados, como
  internacionalização. Trate-o como lista histórica a revisar antes de executar.
- `PROJECT_DOCS/07_INVENTARIO_ARQUIVOS.json` foi gerado antes dos commits mais recentes,
  ainda lista `CONTINUAR_EM_OUTRO_CHAT.txt` e possui hashes antigos. É um snapshot histórico.
- `testwrite` é vazio, mas versionado desde `dbadfdd`; remoção exige decisão explícita.
