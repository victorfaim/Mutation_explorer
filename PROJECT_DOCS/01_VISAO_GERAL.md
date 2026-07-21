# PAL MUTATION EXPLORER — VISÃO GERAL DO PROJETO

## Objetivo

O projeto começou como uma ferramenta offline para consultar mutações de breeding do
Palworld e evoluiu para um portal estático hospedável no GitHub Pages.

O diferencial principal não é apenas exibir dados: o site cruza as informações da base
para responder perguntas práticas, como:

- quais cruzamentos podem resultar em determinado Pal mutado;
- quais Pals são impossíveis de obter por mutação;
- como sair de um Pal inicial e chegar a um alvo por breeding;
- quais Pals dropam determinado item;
- quais Pals possuem melhores atributos-base de combate;
- quais são os melhores trabalhadores para uma atividade;
- quais Pals atendem a um conjunto específico de necessidades da base.

## Estado atual: V2.4 Resultados Expandidos

Funcionalidades presentes:

### Breeding e mutação

- Mutação reversa
- Enciclopédia/auditoria de mutações
- Lista de Pals não obtíveis por mutação
- Caminho de breeding entre Pal inicial e target
- Auditoria da base

### Enciclopédias

- Palpedia com ficha individual
- Enciclopédia de Partner Skills com classificação por função e ativação
- Team Builder por objetivo, com time de cinco Pals, alternativas compatíveis e explicação de sinergia
- Descrição
- Elementos
- Stats
- Aptidões de trabalho
- Partner Skill
- Drops
- Active Skills
- Dados de breeding e mutação
- Pals relacionados
- Enciclopédia de itens
- Lista reversa de Pals que dropam cada item
- Quantidade mínima/máxima e taxa
- Melhor fonte estimada

### Combate

- Tier List por atributos-base
- Modos: Combate geral, Ranged, Melee e Tank
- Pesos personalizáveis
- Comparador de dois Pals
- Comparação dos quatro scores
- Atributos e composição do score

### Base Management V2.1

- Tier List de Trabalho
- Ranking geral
- Ranking por aptidão
- Versatilidade
- Especialização
- Worker Finder

## Hospedagem

O projeto é inteiramente estático e pode ser publicado no GitHub Pages.

Não existe backend, banco SQL ou API obrigatória.

Os dados são carregados por arquivos JavaScript locais.
