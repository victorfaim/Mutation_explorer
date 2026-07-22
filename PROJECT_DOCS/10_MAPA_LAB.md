# MAPA LAB

`mapa-lab.html` é uma validação experimental não listada: possui `noindex` e continua
ausente da navegação pública. Ela usa Leaflet 1.9.4 armazenado em `vendor/leaflet/`,
`L.CRS.Simple` e uma única imagem versionada e otimizada.

## Entradas locais

O carregamento automático procura primeiro os derivados versionáveis:

```text
assets/map/mainworld5.webp
assets/map/worldtree.webp
mapa-lab-data/mainworld5-markers.json
mapa-lab-data/mainworld5-calibration.json
mapa-lab-data/worldtree-markers.json
mapa-lab-data/worldtree-calibration.json
```

Se eles não existirem, o botão também aceita as entradas locais de pesquisa:

```text
LOCAL_RESEARCH/raw/mapa-lab/map.png
LOCAL_RESEARCH/raw/mapa-lab/markers.json
LOCAL_RESEARCH/raw/mapa-lab/calibration.json
```

Toda a pasta `LOCAL_RESEARCH/raw/` é ignorada pelo Git. Os três arquivos também podem ser
selecionados pelos controles da página. O formato de referência está em
`mapa-lab-data/schema-example.json`.

## Sistemas de coordenadas

- `native`: X/Y/Z preservados como extraídos do jogo;
- `game`: X/Y exibidos pela interface do jogo;
- `image.pixelX/pixelY`: pixels com origem no canto superior esquerdo;
- `image.u/v`: pixels normalizados pela largura e altura;
- Leaflet: `[altura - pixelY, pixelX]`, devido à orientação de Y do `CRS.Simple`.

Z é preservado nos marcadores, mas não participa da projeção 2D. Um clique no mapa mostra
pixel, posição normalizada, Leaflet e a estimativa X/Y nativa pela transformação inversa.

## Calibração

O conjunto real de `PL_MainWorld5` usa uma transformação de similaridade, com escala
uniforme, rotação e deslocamento. Duas referências fazem o ajuste e uma terceira fica
reservada para validação independente. O laboratório também aceita o modelo afim genérico,
que usa ao menos três referências não colineares:

```text
pixelX = aX + bY + c
pixelY = dX + eY + f
```

Referências com `use: "validation"` não entram no ajuste. Elas geram RMSE e erro máximo
independentes. `validation.maxErrorPixels` em `calibration.json` pode definir o limite de
aprovação.

## Geração dos pontos de viagem rápida

Com `PL_MainWorld5.json` no diretório local bruto, execute:

```powershell
python tools/generate-map-lab-markers.py
```

Para atualizar os derivados usados na validação não listada:

```powershell
python tools/generate-map-lab-markers.py --public
```

O gerador associa os 152 `FastTravelPointID` aos componentes `Root`, preserva X/Y/Z,
calcula coordenadas exibidas, pixels e posição normalizada e grava `markers.json` e
`calibration.json` em `LOCAL_RESEARCH/raw/mapa-lab/`. Esses dois resultados permanecem
locais junto do dump e da imagem do jogo. Com `--public`, somente os JSONs derivados são
gravados em `mapa-lab-data/`; o dump bruto permanece ignorado. A terceira referência apresentou erro de
validação de 4,42 pixels na imagem 8192×8192; o limite local adotado é 5 pixels.

## Validação

```powershell
node tests/map-calibration.test.js
```

## Fontes de Água Benta da World Tree

`mapa-lab-data/worldtree-holy-water-markers.json` registra as três instâncias fixas de
`BP_LevelObject_HealSpring` encontradas em `PL_MainWorld5`. Cada fonte concede dez unidades
de `WorldTreeHolyWater`, recupera o grupo e possui recarga individual de 600 segundos.
Os três locais foram conferidos manualmente no jogo.

O filtro **Água Benta** usa o ícone local oficial do item e aparece apenas com pontos na
World Tree. O popup preserva coordenadas nativas, coordenadas exibidas, posição normalizada,
quantidade concedida e tempo de recarga. Pixels continuam sendo calculados em tempo de
execução pela transformação independente da World Tree.

O laboratório aceita somente pontos e marcadores estáticos nesta fase. Eventos, spawns
aleatórios e objetos dinâmicos ficam fora do conjunto de dados.

## Relíquias e estátuas de Pal

`mapa-lab-data/relic-markers.json` registra 407 coletáveis fixos extraídos de
`MainGrid_L15_X0_Y0_DL961A8730`: 360 em Palpagos e 47 na World Tree. O conjunto contém
155 efígies de Lifmunk ligadas ao poder de captura e 252 estátuas distribuídas entre onze
tipos de Pal. O gerador `tools/generate-map-relics.js` lê cada `DefaultSceneRoot`, preserva
X/Y/Z e calcula as coordenadas exibidas no jogo; pixels e posição normalizada continuam
derivados em tempo de execução pela transformação independente de cada mapa.

O filtro **Relíquias e estátuas** começa desativado para evitar poluição visual. A seleção
múltipla permite combinar quaisquer tipos disponíveis no mapa atual ou marcar/desmarcar
todos. Os mini-ícones locais foram recortados da própria
interface do jogo; nenhuma imagem do guia de terceiros é usada. Mimog não integra o mapa:
seu símbolo semelhante a um baú representa uma recompensa por progresso de captura, sem
instância fixa no `MainGrid`. A linha de Vitalidade também fica fora porque aparece como
atributo máximo, sem coletável exigido.

Todas as camadas de marcadores começam desativadas. O estado inicial mostra somente a
imagem do mapa, e cada conjunto é adicionado pelo usuário conforme a necessidade.

Para regenerar e validar após disponibilizar o export bruto no inbox local:

```powershell
node tools/generate-map-relics.js
node tests/map-relics.test.js
```

## Alpha Bosses fixos

`mapa-lab-data/alpha-boss-markers.json` contém 90 localizações fixas derivadas de
`DT_BossSpawnerLoactionData`: 83 em Palpagos e sete na World Tree. Registros cujo
`CharacterID` é `None` são NPCs, regiões ou estruturas e ficam fora desse conjunto. Todos
os 90 `CharacterID` de Pals foram associados à Palpedia e aos retratos locais em
`assets/pals/`.

O mapa oferece filtros independentes para viagem rápida e Alpha Bosses, além de busca por
nome, ID interno ou elemento. O popup de Alpha mostra retrato, nível, elementos,
coordenadas preservadas e link para a ficha da Palpedia. Não são incluídos bosses de
dungeon, NPCs, oil rigs, ovos, eventos ou spawns aleatórios.

## Torres de história e ícones oficiais

`mapa-lab-data/story-tower-markers.json` contém 13 torres extraídas das instâncias
`BP_PalBossTower*` de `PL_MainWorld5`: nove em Palpagos e quatro na World Tree. O gerador
`tools/generate-map-story-towers.js` preserva coordenadas nativas e exibidas e deixa a
posição normalizada e em pixels como valores calculados pela calibração de cada mapa.

Os pontos de viagem rápida usam o asset derivado de `T_icon_compass_FTtower`; as torres
usam `T_icon_compass_tower`. Ambos permanecem locais em `assets/map/markers/`, sem
hotlink. Os três conjuntos possuem filtros independentes: viagem rápida, Alpha Bosses e
torres de história.

Para regenerar a base após disponibilizar a DataTable no inbox local:

```powershell
node tools/generate-map-alpha-bosses.js
node tests/map-alpha-bosses.test.js
```

O gerador também calcula as coordenadas exibidas no jogo a partir da relação observada nos
pontos já calibrados. A classificação da World Tree usa os IDs `worldtree_*` e o ponto
`remainsIsland_1_GrassGolem_FBOSS` situado dentro dos limites nativos desse mapa.

A captura 1338×783 da World Tree e sua calibração pertencem ao ciclo anterior. Elas não
são reutilizadas na composição por tiles, pois os pixels das duas imagens não são o mesmo
sistema de referência.

## World Tree oficial e fluxo legado por tiles

A imagem vigente foi exportada do asset oficial
`Pal/Content/Pal/Texture/UI/Map/T_TreeMap`. O PNG possui 8192×8192 pixels, canal alfa e
foi comparado pixel a pixel com a composição z=5 anterior: não existe qualquer diferença
em RGBA. Por isso, a transformação e os pontos de calibração já aprovados permanecem
válidos sem ajuste. O WebP publicado fica em `assets/map/worldtree-official.webp`.

A configuração reproduzível fica em `mapa-lab-data/worldtree-map-config.json` e registra
separadamente o asset oficial vigente e o antigo fluxo de tiles:

```text
asset vigente: Pal/Content/Pal/Texture/UI/Map/T_TreeMap
fallback histórico: https://palworld.gg/images/world-tree-tiles/{z}/{x}/{y}.png
zoom: 5
grade: x=0..31, y=0..31
tile: 256x256 PNG
imagem: 8192x8192 RGBA
```

O PNG oficial bruto, os tiles e a composição anterior não são publicados e permanecem sob
`LOCAL_RESEARCH/raw/`, protegido pelo `.gitignore`. O script de tiles continua disponível
somente como fallback reproduzível e registro da validação que demonstrou equivalência.
O asset derivado não é tratado como coberto pela licença do código.

O utilitário exige Python 3 e Pillow. A dependência é exclusiva das ferramentas locais e
não é carregada pelo site. Instale-a uma vez com:

```powershell
python -m pip install -r tools/requirements-map-lab.txt
```

Se `python` não apontar para a instalação desejada no Windows, use `py -3` nos comandos.
Para baixar e, em seguida, compor:

```powershell
python tools/world_tree_tiles.py download
python tools/world_tree_tiles.py compose
```

O atalho abaixo executa as duas etapas:

```powershell
python tools/world_tree_tiles.py all
```

O download grava `tiles/5/{x}/{y}.png`. Ele limita a concorrência a quatro requisições,
aplica um pequeno intervalo, tenta novamente falhas temporárias, valida HTTP 200,
assinatura/formato PNG e dimensão 256×256. Para retomar uma execução interrompida, execute
o mesmo comando novamente: tiles válidos são reutilizados e apenas ausentes ou inválidos
são baixados. O processo retorna erro enquanto qualquer um dos 1.024 arquivos estiver
ausente ou inválido.

Para validar sem acessar a rede e para remontar a imagem já baixada:

```powershell
python tools/world_tree_tiles.py validate
python tools/world_tree_tiles.py compose
```

A composição abre um tile por vez, preserva alfa e grava temporariamente antes de substituir
`LOCAL_RESEARCH/raw/mapa-lab/world-tree/worldtree-z5.png`. Apenas a tela RGBA final fica em
memória; os 1.024 tiles não são carregados simultaneamente.

No `mapa-lab.html`, selecione **World Tree**. O laboratório carrega o WebP versionado, sem
hotlink ou requisições aos tiles de origem. As coordenadas mantêm
`world.x/y/z`, `game` (incluindo os valores exibidos), `normalized.u/v` entre 0 e 1 e
calculam `pixelX/pixelY` em tempo de execução.

### Calibração da imagem oficial 8192×8192

`mapa-lab-data/worldtree-z5-calibration.json` preserva os quatro pontos medidos
na imagem oficial, com os mesmos pixels da composição z=5:

- `WorldTree_MiddleBoss_3` — jogo `-1995, 1624` — ajuste;
- `WorldTree_MiddleBoss_1` — jogo `-1673, 1638` — ajuste;
- `WorldTree_MiddleBoss_2` — jogo `-1934, 1156` — ajuste;
- `WorldTree_A` — jogo `-1457, 1385` — validação independente.

Os três primeiros pontos ajustam uma transformação de similaridade, coerente com um mosaico
de tiles sem deformação. Seus erros ficam entre 5,03 e 8,62 pixels. O quarto é uma validação
independente e apresentou erro de 13,25 pixels, abaixo do limite de 15 pixels na imagem
8192×8192. O mesmo JSON é carregado tanto localmente quanto na validação web. A posição
normalizada é calculada pela nova transformação, nunca copiada da imagem anterior.

Testes do pipeline e da transformação:

```powershell
python -m unittest tests/test_world_tree_tiles.py
node tests/map-calibration.test.js
```
