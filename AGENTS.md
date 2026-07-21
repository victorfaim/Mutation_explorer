# AGENTS.md — Pal Mutation Explorer

Este arquivo orienta qualquer agente que trabalhe neste repositório. As regras valem para
todo o projeto, salvo instrução mais específica em um `AGENTS.md` de subdiretório.

## Contexto do projeto

O Pal Mutation Explorer é um portal multipágina, inteiramente estático, para consulta de
breeding, mutações, Pals, itens, Partner Skills, composição de times e rankings do
Palworld. A publicação é feita diretamente pelo GitHub Pages.

Não há etapa de build, framework, backend, banco de dados ou API obrigatória. Os HTMLs da
raiz carregam CSS, lógica e bases JavaScript por caminhos relativos. Por isso, mudanças de
nomes, diretórios, ordem de scripts ou parâmetros de cache podem quebrar a publicação.

Antes de trabalhar, leia `PROJECT_DOCS/00_LEIA_PRIMEIRO.md` e
`PROJECT_DOCS/08_CONTINUIDADE_ATUAL.md`.

## Regras obrigatórias

- Preserve o funcionamento atual e a compatibilidade com hospedagem em subcaminho no
  GitHub Pages. Use caminhos relativos; não introduza URLs absolutas dependentes do domínio.
- Mantenha o projeto estático. Não adicione backend, bundler, dependência de runtime ou
  etapa de build sem solicitação explícita.
- Não introduza hotlinks. Imagens necessárias devem permanecer em `assets/` e respeitar
  exatamente maiúsculas e minúsculas dos nomes.
- Não substitua ou compacte bases de forma que campos existentes sejam perdidos. Em
  especial, preserve `work`, `drops`, `partnerSkill`, `actives`, stats e regras de breeding.
- Não edite manualmente arquivos marcados como gerados. Altere o gerador e regenere a
  saída somente quando as fontes oficiais necessárias estiverem disponíveis.
- Não misture as bases grandes nem passe a carregá-las em todas as páginas. Cada página
  deve carregar apenas os dados de que precisa.
- Preserve a ordem dos scripts nos HTMLs. Bases e utilitários devem ser carregados antes
  dos módulos consumidores.
- Ao alterar CSS ou JavaScript servido pelas páginas, atualize de modo coerente o
  cache-busting `?v=...` em todas as referências afetadas.
- Ao alterar navegação, revise todas as páginas ativas e preserve as páginas legadas de
  redirecionamento. Não remova URLs antigas sem solicitação explícita.
- Não trate nomes em inglês usados nas bases como se fossem apenas texto de interface.
  A internacionalização fica em `i18n.js`; IDs, chaves técnicas e nomes de assets são
  contratos de dados.
- Não faça commit, push, force-push, rebase, reset destrutivo ou publicação sem pedido
  explícito do usuário.

## Mapa técnico resumido

- `data.js`: base compacta de Pals e breeding usada pelas ferramentas leves.
- `breeding-official-data.js`: parâmetros e regras oficiais que complementam `data.js`.
- `palpedia-data.js`: base detalhada de Pals; é grande e deve continuar isolada.
- `audit-data.js`: estados e totais pré-calculados da auditoria de mutações.
- `items-data.js`: índice reverso de itens e suas fontes.
- `drop-tables-data.js`: drops normais, de boss e condicionais provenientes das DataTables.
- `core.js`: utilitários compartilhados, assets, seletores e comportamento comum.
- `asset-config.js`: diretórios e mapeamentos dos assets locais.
- `combat-score.js` e `work-score.js`: motores de pontuação reutilizados por rankings e
  comparadores.
- `i18n.js`: textos e alternância de idioma.
- `style.css`: folha de estilos compartilhada por todas as páginas ativas.
- `tools/`: geradores de dados; suas fontes brutas não estão versionadas no repositório.

Consulte a matriz completa de páginas e dependências em
`PROJECT_DOCS/08_CONTINUIDADE_ATUAL.md`.

## Fluxo recomendado para alterações

1. Confirme `git status --short --branch` e preserve alterações do usuário.
2. Leia os HTMLs, módulos e bases diretamente relacionados à tarefa.
3. Consulte o histórico do arquivo com `git log -- <arquivo>` e, quando útil,
   `git blame` ou `git show`.
4. Faça a menor alteração coerente possível; não reorganize arquivos sem necessidade.
5. Valide referências locais, ordem dos scripts, chaves de query string e assets.
6. Teste as páginas afetadas por servidor HTTP local, não apenas abrindo um HTML isolado.
7. Revise `git diff --check`, `git diff --stat` e o diff completo antes de entregar.
8. Deixe as mudanças sem commit para revisão, salvo instrução contrária.

## Validações mínimas

Para qualquer mudança funcional:

- não pode haver referência local ausente em `src` ou `href`;
- não pode haver erro no console nas páginas alteradas;
- navegação e URLs com query string devem continuar funcionando;
- imagens devem resolver com capitalização correta;
- a página inicial e pelo menos uma página consumidora de cada base alterada devem abrir;
- o site deve continuar utilizável sem serviços externos.

Quando a alteração tocar itens, valide também:

- catálogo com 116 itens na base atual;
- Aquatic Pal Fluids com 37 fontes;
- Decayed Ancient Relic com 106 fontes;
- Dormant Ancient Relic com 106 fontes;
- chave composta de item no formato `icon|name`;
- páginas `itens.html` e `item.html`, incluindo drops normais e de boss.

Quando tocar breeding ou mutação, valide:

- precedência das regras únicas/oficiais;
- restrições de gênero quando existirem;
- `ignoreCombi`, `combiRank` e `combiPriority`;
- mutação reversa, caminho de breeding, Palpedia e comparador;
- participação obrigatória do Pal inicial na primeira etapa do caminho.

Quando tocar rankings, preserve as fórmulas e limitações documentadas em
`PROJECT_DOCS/03_CALCULOS.md`. Não apresente heurísticas como uma tier definitiva do meta.

## Cuidados conhecidos

- `auditoria.html`, `enciclopedia.html`, `impossiveis.html`, `tiertrabalho.html` e
  `worker-finder.html` são URLs legadas que redirecionam para módulos consolidados.
- `comparador-trabalho.html` continua como página funcional, embora não esteja no menu
  simplificado mais recente.
- `palpedia.html` e `tierlist.html` usam uma navegação compacta diferente de algumas
  páginas antigas; não “uniformize” isso sem confirmar o design desejado.
- `testwrite` é um arquivo vazio versionado desde a criação da área de itens. Não o remova
  como limpeza incidental.
- `README.txt` contém informações históricas sobre hotlinks que já foram superadas por
  `README_ASSETS_LOCAIS.txt` e pela continuidade atual.
- `PROJECT_DOCS/07_INVENTARIO_ARQUIVOS.json` é um snapshot histórico, não um manifesto
  vivo; seus hashes e sua lista não representam o `HEAD` atual.

## Documentação

Se uma alteração mudar arquitetura, dados, cálculos, URLs, compatibilidade ou procedimento
de publicação, atualize `PROJECT_DOCS/08_CONTINUIDADE_ATUAL.md` e o documento temático
correspondente. Não reescreva fatos históricos apenas para fazê-los parecer atuais; marque
claramente o que é snapshot, legado ou decisão vigente.
