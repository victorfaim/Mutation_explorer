# MAPA LAB

`mapa-lab.html` é um laboratório local, deliberadamente ausente da navegação pública. Ele
usa Leaflet 1.9.4 armazenado em `vendor/leaflet/`, `L.CRS.Simple` e uma única imagem local.

## Entradas locais

O botão de carregamento padrão procura:

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

O gerador associa os 152 `FastTravelPointID` aos componentes `Root`, preserva X/Y/Z,
calcula coordenadas exibidas, pixels e posição normalizada e grava `markers.json` e
`calibration.json` em `LOCAL_RESEARCH/raw/mapa-lab/`. Esses dois resultados permanecem
locais junto do dump e da imagem do jogo. A terceira referência apresentou erro de
validação de 4,42 pixels na imagem 8192×8192; o limite local adotado é 5 pixels.

## Validação

```powershell
node tests/map-calibration.test.js
```

O laboratório aceita somente pontos e marcadores estáticos nesta fase. Eventos, spawns
aleatórios e objetos dinâmicos ficam fora do conjunto de dados.
