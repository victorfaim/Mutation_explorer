PAL MUTATION EXPLORER — VERSÃO MULTIPÁGINA

1. Extraia todo o conteúdo do ZIP para uma pasta.
2. Abra index.html.
3. Não mova apenas um HTML isoladamente; os arquivos .js e .css precisam permanecer juntos.

Arquitetura:
- reverso.html: calcula somente o Pal pesquisado.
- enciclopedia.html: usa auditoria pré-calculada.
- impossiveis.html: usa auditoria pré-calculada.
- auditoria.html: exibe números pré-calculados.
- data.js: base compacta.
- audit-data.js: estados e contagens já processados.

Não há auditoria completa no carregamento das páginas.

Ícones:
- São carregados sob demanda do domínio palbreed.com.
- A ferramenta continua funcionando sem internet; nesse caso, apenas os ícones não aparecem.
- loading=lazy evita carregar centenas de imagens de uma vez.

Seletor visual:
- A página reverso.html possui uma lista lateral com pesquisa, ícones e nomes.
- Pals obtíveis executam a consulta automaticamente ao clicar.
- Pals bloqueados, inalcançáveis ou fora da mecânica mostram o motivo sem iniciar cálculo.

Home visual:
- Banner inicial com Pals em destaque.
- Quatro cards ilustrados para os módulos.
- As ilustrações de ovo, livro, cadeado e auditoria são SVGs próprios.
- Os Pals do banner usam os mesmos ícones carregados sob demanda.
