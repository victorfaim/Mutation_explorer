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

O laboratório aceita somente pontos e marcadores estáticos nesta fase. Eventos, spawns
aleatórios e objetos dinâmicos ficam fora do conjunto de dados.

A captura 1338×783 da World Tree e sua calibração pertencem ao ciclo anterior. Elas não
são reutilizadas na composição por tiles, pois os pixels das duas imagens não são o mesmo
sistema de referência.

## World Tree local por tiles

A configuração reproduzível fica em `mapa-lab-data/worldtree-map-config.json`. Ela define
o mapa `world-tree`, a revisão do asset, da transformação e dos marcadores, além destes
parâmetros fixos:

```text
origem temporária: https://palworld.gg/images/world-tree-tiles/{z}/{x}/{y}.png
zoom: 5
grade: x=0..31, y=0..31
tile: 256x256 PNG
imagem: 8192x8192 RGBA
```

Os tiles e a composição PNG bruta não integram a licença do código, não são publicados e
ficam sob `LOCAL_RESEARCH/raw/mapa-lab/world-tree/`, já protegido pela regra existente do
`.gitignore`. Para validação pela página não listada, somente um WebP otimizado derivado é
versionado em `assets/map/worldtree-z5.webp`. A origem temporária e a separação de licença
continuam registradas na configuração do mapa.

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

### Calibração do mosaico 8192×8192

`mapa-lab-data/worldtree-z5-calibration.json` preserva os quatro pontos medidos
na composição z=5:

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
