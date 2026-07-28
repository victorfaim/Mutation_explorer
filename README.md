# Pal Forge

Ferramentas comunitárias para Palworld, reunindo Palpedia, breeding, mutações, mapa interativo, itens e drops, equipes, Partner Skills e rankings.

Site público: https://palforge.com.br

## Principais ferramentas

- Palpedia com fichas detalhadas dos Pals;
- calculadora, mutação reversa e caminhos de breeding;
- mapa interativo de Palpagos e World Tree;
- catálogo de itens, fontes e drops;
- Team Builder, comparadores e rankings;
- interface em PT-BR e EN-US.

## Executar localmente

O projeto é estático e não possui etapa de build. Sirva a raiz por HTTP e abra `index.html`. Por exemplo:

`python -m http.server 8765`

Depois acesse `http://localhost:8765/`.

## Estrutura geral

Os HTMLs da raiz são as páginas públicas. CSS e módulos JavaScript compartilhados também ficam na raiz; bases grandes são carregadas somente pelas páginas consumidoras. Assets locais ficam em `assets/`; geradores e testes ficam em `tools/` e `tests/`.

## Contribuição

Antes de alterar o projeto, leia `AGENTS.md` e `PROJECT_DOCS/00_LEIA_PRIMEIRO.md`. Preserve URLs públicas, compatibilidade com GitHub Pages, contratos de dados e a ordem dos scripts. Execute as suítes JavaScript e Python antes de enviar mudanças.

## Projeto não oficial e política de assets

Pal Forge é um projeto comunitário não oficial e não possui vínculo ou endosso da Pocketpair. Palworld e suas marcas pertencem à Pocketpair e aos respectivos titulares.

O código e os datasets próprios são tratados separadamente dos assets do jogo. A licença do código não se estende a imagens, texturas, marcas ou outros conteúdos de terceiros. O repositório não distribui arquivos `.pak`, dumps ou assets brutos do jogo. Consulte `README_ASSETS_LOCAIS.txt` e `aviso-legal.html`.

## Licença

Consulte o arquivo de licença do repositório quando disponível. Na ausência de uma licença explícita, não presuma permissão ampla de reutilização. Direitos de terceiros permanecem com seus respectivos titulares.
