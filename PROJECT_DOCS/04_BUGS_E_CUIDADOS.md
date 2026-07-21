# BUGS CORRIGIDOS E CUIDADOS IMPORTANTES

## Carregamento eterno na página individual de itens

Causa:

O JavaScript dependia de IDs HTML virarem variáveis globais automaticamente:

- itemLoading
- itemDetail

Isso não é confiável.

Correção:

Usar explicitamente:

document.getElementById("item-loading")
document.getElementById("item-detail")

## Itens com ícone, mas sem fontes

Casos reportados:

- Ancient Relics
- Aquatic Pal Fluids

Causa:

A página individual dependia de procurar novamente cada Pal em `data.js`, mas algumas
fontes pertenciam a registros ausentes ou diferentes na base compacta.

Correção:

O `items-data.js` passou a guardar todas as informações da fonte diretamente.

Validações realizadas na versão corrigida:

- Aquatic Pal Fluids: 37 fontes
- Decayed Ancient Relic: 106 fontes
- Dormant Ancient Relic: 106 fontes

## Colisão de itens

A chave inicial era somente o ícone ou nome.

A chave atual combina:

icon + "|" + name

Isso aumentou o catálogo de 115 para 116 itens únicos e evita colisões indevidas.

## Menus inconsistentes

Algumas páginas antigas mantinham o menu da versão anterior.

Correção:

Todos os HTMLs passaram a receber um menu canônico durante a geração.

Sempre que uma página nova for adicionada:

1. atualizar a lista canônica de navegação;
2. substituir o bloco `<header><nav>...</nav></header>` em todos os HTMLs;
3. aplicar cache-busting novo.

## Cache do GitHub Pages

Depois de publicar uma nova versão:

- aguardar o deploy;
- usar Ctrl + F5;
- conferir se os scripts têm um novo parâmetro `?v=...`.

## Maiúsculas e minúsculas

O GitHub Pages diferencia maiúsculas de minúsculas.

Exemplo:

T_itemicon_Material_ElectricOrgan.png

é diferente de:

t_itemicon_material_electricorgan.png

## Performance

Bases grandes devem ser carregadas somente onde forem necessárias.

- `data.js`: ferramentas compactas
- `palpedia-data.js`: páginas detalhadas e rankings
- `items-data.js`: enciclopédia de itens

Evitar colocar toda a lógica e todas as bases em um único HTML.
