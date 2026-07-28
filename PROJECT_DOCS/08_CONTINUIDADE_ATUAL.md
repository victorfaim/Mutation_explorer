# CONTINUIDADE ATUAL DO PROJETO

## Calculadora padrão de breeding

`breeding.html` oferece consultas de pais para filho e de filho para pais para o resultado
padrão. A página reutiliza diretamente `normalChild()` de `core.js`; regras especiais
oficiais mantêm precedência e o índice reverso é derivado em tempo de execução, sem uma
tabela manual nova. Mutações, gênero, passivas e IVs não integram essa calculadora.

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
- `drop-tables.js`: união e apresentação das tabelas de drop oficiais. As páginas de catálogo e ficha carregam a localização antes dos módulos consumidores para manter nomes, métricas e links dinâmicos no idioma selecionado.
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

### Validação de mapa não listada

- `mapa-lab.html`: validação de coordenadas estáticas sobre imagem otimizada com Leaflet e
  `CRS.Simple`;
- não possui link na navegação pública e permanece com `noindex`;
- o dump e a imagem bruta permanecem em `LOCAL_RESEARCH/raw/mapa-lab/`, fora do Git;
- a imagem otimizada e os JSONs derivados de marcadores/calibração são versionados para
  permitir validação por terceiros no GitHub Pages;
- o seletor alterna entre Palpagos, com 152 pontos extraídos, e World Tree, com os 15
  `WorldTree_*` internos; a World Tree usa um WebP derivado do asset oficial
  `Pal/Content/Pal/Texture/UI/Map/T_TreeMap`, exportado em 8192×8192 RGBA;
- o PNG oficial foi confirmado pixel a pixel como idêntico ao mosaico z=5 anterior; o
  pipeline `tools/world_tree_tiles.py` permanece como fallback histórico reproduzível,
  enquanto fontes brutas continuam ignoradas e somente o WebP otimizado é versionado;
- a transformação por similaridade do mosaico da World Tree é independente, usa três pontos
  de ajuste e foi aprovada por um quarto ponto independente com erro de 13,25 pixels em
  8192×8192;
- `alpha-boss-markers.json` adiciona 90 Alpha Bosses fixos derivados da DataTable oficial:
  83 em Palpagos e sete na World Tree, todos associados à Palpedia e a ícones locais;
- filtros independentes controlam viagem rápida e Alpha Bosses, com busca de Alpha por nome,
  ID interno ou elemento; NPCs, dungeons, eventos e spawns aleatórios permanecem excluídos;
- os pontos de viagem rápida usam o ícone alado oficial e um terceiro filtro independente
  apresenta 13 torres de história extraídas de `PL_MainWorld5` (nove em Palpagos e quatro
  na World Tree), usando o símbolo oficial de torre;
- a World Tree possui ainda um filtro próprio para as três fontes fixas de Água Benta,
  confirmadas no jogo; cada marcador preserva X/Y/Z, exibe a recompensa de dez unidades e
  informa a recarga individual de 600 segundos;
- um filtro opcional de relíquias e estátuas reúne 407 coletáveis fixos extraídos do
  `MainGrid`: 360 em Palpagos e 47 na World Tree, sendo 155 efígies de Lifmunk e 252
  estátuas de onze tipos; Mimog e Vitalidade ficam fora por não possuírem ponto fixo;
- um piloto de habitats, desligado por padrão, permite buscar Lamball ou Depresso e
  alternar Dia/Noite; ele deriva 48 spawners `green_A` e 30 `green_D` dos MainGrids
  fornecidos, informa explicitamente que a cobertura é regional e incompleta e não se
  aplica à World Tree;
- o gerador local extrai 152 pontos de viagem rápida de `PL_MainWorld5.json`, preservando
  coordenadas nativas, exibidas, em pixels e normalizadas;
- a calibração vigente usa similaridade com duas referências de ajuste e uma validação
  independente, cujo erro observado é 4,42 pixels em 8192×8192;
- formato e operação estão documentados em `PROJECT_DOCS/10_MAPA_LAB.md`.

### Mapa público

- `mapa.html` é a superfície pública do mapa e o destino do item **Mapa** na navegação;
- `mapa-lab.html` permanece separado, com `noindex`, controles técnicos e URL direta;
- a página pública reutiliza Leaflet local, `mapa-lab-transform.js`, imagens, calibrações e
  datasets derivados existentes, sem alterar coordenadas ou transformações;
- Palpagos e World Tree mantêm configuração, transformação e estado de filtros
  independentes;
- o estado inicial ativa somente torres de história; viagem rápida, Alpha Pals, Água
  Benta e relíquias/estátuas podem ser adicionados pelo usuário;
- busca, filtros, legenda e painel de detalhes são bilíngues, incluindo títulos, recompensas e bônus vindos dos marcadores, e não exibem coordenadas
  nativas, coeficientes ou diagnóstico de calibração;
- selecionar um marcador ou resultado apenas centraliza o ponto, preservando o nível de zoom escolhido pelo usuário;
- habitats continuam exclusivos do Mapa Lab por serem um piloto regional incompleto.

### URLs legadas preservadas

- `auditoria.html` → `palpedia.html`
- `enciclopedia.html` → `palpedia.html`
- `impossiveis.html` → `palpedia.html?mutation=not-obtainable`
- `tiertrabalho.html` → `tierlist.html?tab=work`
- `worker-finder.html` → `tierlist.html?tab=work&multi=1`

Os redirecionamentos usam `meta refresh`, `location.replace` e um link de fallback. Eles
preservam URLs antigas e não devem ser apagados como arquivos “duplicados”.

### Navegação pré-lançamento

O menu canônico é montado por `core.js` e reduz as opções simultâneas sem remover páginas.
Início, Palpedia, Mapa e Itens ficam no primeiro nível; Breeding, Equipes, Ferramentas e
Mais organizam as demais ferramentas em dropdowns. A mesma hierarquia é usada no menu
mobile, com suporte a teclado, fechamento por Escape e rótulos PT-BR/EN-US. Em desktop, a área de hover cobre também o pequeno espaço entre o botão e a lista, evitando o fechamento durante a passagem do ponteiro. Os HTMLs
mantêm seus menus estáticos como fallback, e as URLs legadas continuam redirecionando.
`Mutation Explorer` não aparece como opção separada enquanto apontar para a mesma Home.
Auditoria permanece em `Mais`, identificada como ferramenta técnica.

O rodapé compartilhado apresenta versão fixa `v0.9.0` e links para `sobre.html`,
`contato.html`, `aviso-legal.html` e o repositório no GitHub. As três páginas
institucionais são estáticas, bilíngues e não carregam datasets, formulários ou serviços
externos.

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
`DT_PalDropItem_Common.json` quando disponível. A etapa de metadados resolve cada `ItemId`
diretamente em `DT_ItemDataTable.json`, `DT_ItemNameText_Common` EN/PT-BR e
`item-icon-map.js`; sem a tabela bruta de drops, ela preserva as relações existentes e
regenera somente nomes e ícones. `tools/generate-breeding-official-data.py` gera
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
## Consolidação dos ícones oficiais de itens (2026-07-27)

- `item-icon-map.js` é o mapa público derivado `ItemId -> textura`; itens, drops, Palpedia e mapa público o carregam antes dos consumidores.
- `item-texture-manifest.json` registra somente metadados das 896 texturas locais: caminho relativo, basename, extensão, dimensões e SHA-256.
- `item-icon-coverage.json` registra a cobertura por método sem incluir dumps brutos.
- `tools/generate-item-icon-map.py` lê `DT_ItemDataTable.json` e `LOCAL_RESEARCH/raw/fmodel/mutation/inbox/Texture/`, publica apenas texturas vinculadas em `assets/items/`, gera compostos de Blueprint e atualiza os ícones do dataset derivado de drops.
- A prioridade é override confirmado, ItemId exato, `TypeA + IconName`, alias existente, composição confirmada e fallback. Não existe fuzzy matching.
- A ligação das 12 estátuas do mapa às texturas oficiais foi confirmada e registrada em `window.RELIC_ICON_OVERRIDES` e `tools/generate-map-relics.js`: Lifmunk usa `T_itemicon_Relic`, e as demais usam `T_itemicon_Relic_01`–`11`. `T_itemicon_Relic_12` não pertence aos 12 tipos mapeados e permanece fora do filtro.
- Galeria técnica local: `LOCAL_RESEARCH/reviews/item-icon-coverage.html`. Ela não faz parte da navegação pública.

Regeneração local:

```powershell
python tools/generate-item-icon-map.py
```
## Localização oficial consolidada (2026-07-28)

- `tools/generate-game-localization.py` lê 27 DataTables de texto EN e PT-BR, com
  14.725 linhas pareadas e validação de paridade por chave.
- A saída pública é `game-localization-data.js`; a auditoria reproduzível fica em
  `game-localization-coverage.json`.
- IDs, nomes técnicos, fórmulas e datasets de cálculo não são traduzidos nem modificados.
- Pals, descrições, prefixos, Partner Skills e skills homônimas usam contexto técnico para
  evitar que uma tradução global associe o texto ao registro errado.
- Itens e drops usam o vínculo confirmado pelo basename de textura/ItemId quando o texto
  inglês não identifica a linha de forma única.
- Elementos, aptidões e atributos exibidos usam os rótulos oficiais ou, quando a própria
  tabela contém placeholders, o rótulo técnico equivalente sem expor `pt-BR_Text`.
- `core.js` carrega a localização gerada antes de `i18n.js`. `mapa.html`,
  que carrega o idioma explicitamente, também respeita essa ordem.
- As fontes em `LOCAL_RESEARCH/` permanecem ignoradas; para regenerar é necessário
  disponibilizar novamente os dois conjuntos completos no mesmo caminho local.

Regeneração e validação:

```powershell
python tools/generate-game-localization.py
node tests/game-localization.test.js
```

### Detalhes das Tower Bosses no mapa

O mapa público consome a revisão 2 de mapa-lab-data/story-tower-markers.json. As 13 torres incluem unidade oficial combinada, níveis, elementos, tempos, recompensas e parâmetros de HP por dificuldade. tools/generate-map-story-towers.js deriva esses campos dos exports locais do manager, parâmetros de personagem e L10N. A escala de 1–8 jogadores é confirmada; somente a ordem do arredondamento intermediário permanece marcada como parcial.

## Correção da identidade dos itens de drop (2026-07-28)

- Os 150 `ItemId` presentes em `drop-tables-data.js` carregam nomes oficiais independentes
  em `names.en-US` e `names.pt-BR`; 149 identidades são únicas e `Poppy`/`poppy` é o único
  alias confirmado por diferença de capitalização.
- O nome não é mais inferido por ordem, aparência da textura ou tabela manual. A textura
  continua resolvida por `item-icon-map.js` e o link usa sempre o `ItemId` técnico.
- `drop-tables.js`, `item.js`, `itens.js` e `mapa-details.js` escolhem o nome pelo idioma
  atual sem alterar o identificador usado na URL.
- A auditoria corrigiu 32 nomes divergentes e confirmou zero divergências de textura nos
  150 itens usados pelas tabelas de drops.
