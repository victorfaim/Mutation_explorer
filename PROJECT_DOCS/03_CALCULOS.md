# CÁLCULOS E CRITÉRIOS

## Tier List de Combate

Todos os atributos são normalizados entre 0 e 100 dentro da base atual.

Isso impede que Run Speed domine o cálculo apenas por usar números numericamente maiores
que HP ou Attack.

### Métricas derivadas

- Offense = maior valor entre Melee Attack e Shot Attack
- Survival = média entre HP e Defense
- Mobility = média entre Run Speed e Ride Sprint

### Modos padrão

#### Combate geral

- 40% Ofensiva
- 35% Sobrevivência
- 10% Stamina
- 15% Mobilidade

#### Ranged

- 65% Shot Attack
- 15% Sobrevivência
- 10% Stamina
- 10% Mobilidade

#### Melee

- 55% Melee Attack
- 30% Sobrevivência
- 10% Stamina
- 5% Mobilidade

#### Tank

- 45% HP
- 40% Defense
- 15% Stamina

### Tiers

Definidos por percentis no resultado filtrado:

- S: top 10%
- A: próximos 20%
- B: próximos 30%
- C: próximos 25%
- D: restante

### Limitações do ranking de combate

O ranking não mede perfeitamente o desempenho real porque não considera:

- IA;
- qualidade e duração das animações;
- precisão prática;
- área de efeito;
- multi-hit;
- Partner Skills;
- passivas;
- IVs;
- condensação;
- equipamentos;
- buffs;
- matchup elemental.

Por isso o texto correto é “ranking por atributos-base”, não “tier definitiva do meta”.

## Tier List de Trabalho

O nível da aptidão é sempre o fator dominante.

### Perfis de atividade

Handcraft:
- 85% nível
- 15% Work Speed

Medicine:
- 85% nível
- 15% Work Speed

Kindling:
- 82% nível
- 18% Work Speed

Watering:
- 82% nível
- 18% Work Speed

Planting:
- 82% nível
- 13% Work Speed
- 5% Run Speed

Electricity:
- 85% nível
- 15% Work Speed

Cooling:
- 88% nível
- 12% Work Speed

Farming:
- 90% nível
- 10% Work Speed

Mining:
- 75% nível
- 15% Work Speed
- 10% Run Speed

Lumbering:
- 75% nível
- 15% Work Speed
- 10% Run Speed

Gathering:
- 72% nível
- 13% Work Speed
- 15% Run Speed

Transport:
- 65% nível
- 5% Work Speed
- 30% Run Speed

Oil Extraction:
- 85% nível
- 15% Work Speed

## Trabalho geral

Combina:

- média dos três melhores desempenhos do Pal: 72%
- versatilidade: 28%

## Versatilidade

Combina:

- quantidade de aptidões: 50%
- profundidade relativa dos níveis: 35%
- Work Speed: 15%

## Especialização

Usa o melhor score individual do Pal e aplica uma pequena penalização de 2 pontos por
aptidão adicional.

A intenção é diferenciar um especialista puro de um Pal que executa muitas funções.

## Worker Finder

O usuário seleciona aptidões.

O score combina:

- média de desempenho nas funções cobertas: 72%
- cobertura das funções selecionadas: 20%
- versatilidade: 8%

Pode:

- exigir todas as funções;
- aceitar cobertura parcial;
- elevar ou reduzir a importância da mobilidade.

## Team Builder — filtros de drop

Em modos especializados de drop, a elegibilidade é estrita. O Pal somente entra se a descrição ou tag confirmar o tipo escolhido. Para elemento, são exigidos `drops`, `boost-<elemento>` e texto de aumento de itens. Vagas sem especialista permanecem livres.

### Sinergia de pesca e dois elementos

O modo Pesca reúne todas as Partner Skills com tag `fishing`, diferenciando rendimento, captura/progresso e Pals talentosos. O Farm avançado aceita dois elementos e usa a união estrita dos especialistas dos dois alvos.

## Mutação

A fórmula confirmada, sua origem nativa, arredondamentos, limites, papel de
`CombiPriority` e casos de regressão estão em `09_FORMULA_MUTACAO_NATIVA.md`.

# Mutação

A seleção do resultado mutante usa a fórmula confirmada no código nativo do build Steam
24181527. Para dois pais, considere `lowRank` como o menor `combiRank` e `rankDiff` como a
diferença absoluta entre os ranks:

- `count = max(1, round(lowRank * 0.1))`;
- `start = round(lowRank * 0.5) + round(rankDiff * 0.4) + 1`;
- o jogo sorteia uniformemente um índice inteiro de `0` a `count - 1`;
- o rank consultado é `start + índice`, convertido ao Pal elegível de rank mais próximo.

Quando vários índices convergem para o mesmo Pal, seus pesos são somados. A chance exibida
na Mutação Reversa é condicional à ocorrência da mutação e corresponde a
`índices do Pal / count`. A chance absoluta de o ovo sofrer mutação não faz parte do escopo
atual da ferramenta.

Em `audit-data.js`, `pairs` é mantido como contagem histórica de índices ponderados para
compatibilidade, enquanto `routePairs` representa casais distintos capazes de gerar o Pal.
