# ROADMAP E IDEIAS FUTURAS

## V2.2 — Refinamento do Base Management

Prioridades sugeridas:

### Ranking na ficha do Pal

Na página individual mostrar:

- posição em combate geral;
- posição em Ranged;
- posição em Tank;
- melhor ranking de trabalho;
- posição em Trabalho Geral;
- posição em Versatilidade.

Exemplo:

Rankings
- #1 Handcraft
- #4 Mining
- #12 Trabalho Geral
- #47 Combate Geral

### Worker Finder aprimorado

Adicionar:

- peso individual por atividade;
- quantidade desejada de trabalhadores;
- excluir determinados Pals;
- marcar Pals favoritos;
- filtro por elemento;
- filtro por raridade;
- filtro por mutável/não mutável.

## V3.0 — Base Planner

O usuário informa objetivos, por exemplo:

- 2 Mining
- 1 Transport
- 1 Handcraft
- 1 Electricity
- 1 Kindling

O algoritmo monta uma equipe recomendada.

Critérios futuros:

- evitar repetir o mesmo Pal;
- cobertura mínima por atividade;
- limite de Pals na base;
- especialização versus versatilidade;
- mobilidade;
- redundância operacional;
- preferência por Pals disponíveis ao usuário.

## Base Optimizer

O usuário marca os Pals que possui.

O sistema calcula a melhor composição possível somente com o inventário informado.

## Team Builder — próxima evolução

A primeira versão por Partner Skills foi implementada. Evoluções futuras:

- combinar atributos-base ao score;
- cobertura elemental contra alvos específicos;
- inventário de Pals possuídos;
- bloqueio e favoritos;
- ajuste manual dos pesos.

## Enciclopédia de Skills

Gerada agregando `pal.actives`.

Mostrar:

- nome;
- elemento;
- power;
- cooldown;
- alcance;
- Pals que aprendem;
- nível de aprendizado.

Filtros:

- elemento;
- maior poder;
- menor cooldown;
- maior power/cooldown;
- distância.

Limitação: não chamar de DPS real sem considerar duração, multi-hit e animações.

## Bosses e variantes

Explorar registros com:

- isBoss;
- bossCaptureRate;
- variantes Alpha;
- diferenças de stats e drops.

Antes de publicar, validar exatamente quais registros técnicos representam bosses reais.

## Trait Breeding Planner

Objetivo futuro de grande valor:

O usuário informa:

- Pal inicial com determinadas passivas;
- Pal target;
- passivas desejadas;
- restrições opcionais.

O sistema encontra a melhor cadeia de breeding para transferir as passivas.

Possíveis restrições:

- não usar lendários;
- usar somente Pals possuídos;
- menor número de cruzamentos;
- menor número de parceiros externos;
- preservar uma linhagem obrigatória.

## Internacionalização

Adicionar:

- português;
- inglês;
- alternância de idioma;
- nomes e descrições localizados.

## PWA

Transformar o site em aplicativo instalável:

- manifest;
- service worker;
- cache offline;
- ícone;
- atualização de versão.

## Organização técnica futura

Quando o projeto crescer mais, reorganizar:

assets/
  pals/
  items/
  elements/
  work/

css/
  base.css
  palpedia.css
  tier.css
  base-management.css

js/
  core/
  breeding/
  encyclopedia/
  combat/
  work/
  planner/

Essa reorganização deve ser feita com cuidado para não quebrar o GitHub Pages.
