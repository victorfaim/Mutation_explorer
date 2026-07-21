# FÓRMULA NATIVA DE MUTAÇÃO

## Origem da evidência

- Binário: `Palworld-Win64-Shipping.exe`
- Steam build: `24181527`
- SHA-256: `2FF94A03BC777661BE100249B4940242F70661D890C6B8F8ACA4D6DCE79EE5A5`
- Rotina nativa: início em VA `0x142E68B20`; núcleo do cálculo em
  `0x142E68BF4–0x142E68CB4`
- Ferramenta de leitura: Rizin/Cutter 2.5.0, análise estática; o jogo não foi executado.

O executável não contém símbolos de função utilizáveis. A string
`GenerateChildSaveParameter` existe no mesmo módulo nativo e a rotina recebe estruturas dos
dois pais e grava os parâmetros do filho, portanto essa associação é provável, mas não está
confirmada por PDB. A classe proprietária também não pôde ser provada. O Blueprint de
incubação delega para `PalMapObjectMultiHatchingEggWithBreedParameterComponent`; isso
confirma o caminho nativo, não a propriedade da função.

## Dados consumidos

A rotina resolve o `CharacterId` dos pais nas tabelas e lê seus `CombiRank`. Os parâmetros
de cálculo são obtidos de `PalGameSetting`. Foram observados os coeficientes efetivos `0.1`,
`0.5` e `0.4` no próprio bloco de cálculo.

Para os pais `A` e `B`:

```text
low  = min(A.combiRank, B.combiRank)
diff = abs(A.combiRank - B.combiRank)

count = max(1, roundPositive(low * 0.1))
start = roundPositive(low * 0.5)
      + roundPositive(diff * 0.4)
      + 1

k = uniforme inteiro em [0, count - 1]
mutationRank = start + k
mutant = FindNearestCombiRank(mutationRank)
```

O site enumera todos os valores de `k` em vez de sortear um. Isso produz a distribuição
exata: se vários ranks apontam para o mesmo Pal, os pesos são somados.

## Ordem, arredondamentos e limites

1. `low` e `diff` são calculados antes dos coeficientes.
2. Cada produto é arredondado separadamente; os produtos não são somados antes do
   arredondamento.
3. Para os valores não negativos usados aqui, `roundPositive(x) = floor(x + 0.5)`.
4. `count` possui limite mínimo 1.
5. O índice aleatório é limitado a `count - 1`.
6. O site protege a consulta ao mapa com rank mínimo 1.

## CombiPriority

`CombiPriority` acompanha os registros oficiais e deve permanecer na base. Entre os Pals
elegíveis atuais, não há dois registros com o mesmo `CombiRank`; assim, ele não altera os
resultados desta auditoria. O desempate observado entre ranks equidistantes favorece o rank
superior: o rank 1020 seleciona Braloha (1030), não Majex (1010). Não foi isolada evidência
nativa suficiente para afirmar como `CombiPriority` agiria se dois Pals elegíveis tivessem
o mesmo rank.

## Comparação com o site

| Etapa | Código nativo | Implementação em `core.js` | Situação |
|---|---|---|---|
| Menor rank | `min(rankA, rankB)` | `Math.min(...)` | equivalente |
| Diferença | valor absoluto | `Math.abs(...)` | equivalente |
| Quantidade | `max(1, round(low*0.1))` | mesma expressão | equivalente |
| Início | `round(low*0.5)+round(diff*0.4)+1` | mesma expressão | equivalente |
| Seleção | inteiro uniforme | enumeração de todos os índices | distribuição exata |
| Rank mais próximo | `FindNearestCombiRank` | `MUTATION_NEAREST` | equivalente nos dados atuais |

A auditoria regenerada mantém 143 mutantes obtíveis, 117 inalcançáveis e 39 bloqueados.
São 44.253 casais, 495.068 relações distintas casal–resultado e 4.969.076 índices
ponderados. Não houve divergência entre a base anterior e a fórmula confirmada.

## Casos reproduzíveis

### Amione + Jetragon

- IDs: `clionetwins` + `jetdragon`
- ranks: 2520 e 70
- resultado normal: Warsect (`herculesbeetle`, rank 1280)
- `low=70`, `diff=2450`, `count=7`, `start=1016`, fim 1022
- Majex: ranks 1016–1019, peso `4/7`
- Braloha: ranks 1020–1022, peso `3/7`

### Lamball + Cattiva

- ranks: 3050 e 2760
- resultado normal: Daedream
- `low=2760`, `diff=290`, `count=276`, `start=1497`, fim 1772

### Jetragon + Lamball

- ranks: 70 e 3050
- resultado normal: Bushi
- `count=7`, `start=1228`, fim 1234
- os sete índices convergem para Nitemary.

Os casos são executados por `tests/mutation-formula.test.js` contra as funções reais de
`core.js`.
