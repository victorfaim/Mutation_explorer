# ARQUITETURA E ARQUIVOS IMPORTANTES

## Bases principais

### data.js

Base compacta usada nas ferramentas de breeding, mutação, seletores e caminhos.

Campos típicos:

- id
- name
- index
- icon
- combiRank
- combiPriority
- ignoreCombi
- combos

### palpedia-data.js

Base detalhada usada na Palpedia e nos rankings.

Campos típicos:

- id
- slug
- key
- name
- prefix
- index
- suffix
- rarity
- elements
- icon
- description
- stats
- work
- partnerSkill
- drops
- actives

O campo `passives` foi deliberadamente removido dessa base para reduzir o tamanho e
porque o foco solicitado era trabalho, drops, skills e atributos.

### audit-data.js

Resultado consolidado da auditoria de mutações.

### partner-skills.js

Enciclopédia e classificação das Partner Skills usando `partnerSkill.tags`, tipo de montaria e condições explícitas da descrição.

### team-builder.js

Motor heurístico de composição de cinco Pals por objetivo, com Pal principal opcional e justificativas baseadas nas Partner Skills.

### items-data.js

Índice reverso gerado a partir de `palpedia-data.js -> drops[]`.

Cada item guarda todas as informações necessárias para renderizar suas fontes sem
depender novamente de `data.js`, incluindo:

- palId
- palSlug
- palName
- palIndex
- palSuffix
- palIcon
- min
- max
- rate

Essa independência corrigiu o erro em que alguns itens, como Ancient Relics e Aquatic
Pal Fluids, ficavam sem mostrar as fontes.

## Motores de cálculo

### core.js

Funções compartilhadas:

- escape de HTML;
- seleção de Pals;
- chips visuais;
- resolução de assets locais;
- fallback entre extensões;
- utilidades comuns.

### combat-score.js

Motor da Tier List e Comparador de Combate.

### work-score.js

Motor da Tier List de Trabalho e Worker Finder.

## Assets locais

Estrutura esperada:

assets/
├── pals/
├── items/
├── elements/
├── work/
└── icons_other/

Os ícones de Pals e itens são resolvidos automaticamente pelos identificadores presentes
na base.

Exemplos:

assets/pals/T_Anubis_icon_normal.png
assets/items/T_itemicon_Material_ElectricOrgan.png

O site tenta as extensões:

- .png
- .webp
- .jpg
- .svg

### asset-config.js

Centraliza diretórios e mapas dos ícones de elementos e aptidões.

Pals e drops não precisam de mapeamento manual porque o nome do arquivo já está na base.

## Regra de independência

O projeto deve continuar sem hotlink.

Não adicionar URLs diretas do PalBreed, Palworld.gg ou de outros sites às páginas.

Todo asset necessário deve ficar no próprio repositório.
