ASSETS LOCAIS

Copie as pastas geradas pelo baixador para dentro do projeto:

assets/
├── pals/
├── items/
├── elements/
├── work/
└── icons_other/

Pals:
- Resolvidos automaticamente por data.js -> pal.icon.
- Exemplo: assets/pals/T_Anubis_icon_normal.png

Drops:
- Resolvidos automaticamente por palpedia-data.js -> drops[].icon.
- Exemplo: assets/items/T_itemicon_Material_ElectricOrgan.png

Extensões:
- O site tenta automaticamente .png, .webp, .jpg e .svg.

Elementos e aptidões:
- Edite asset-config.js e informe o nome do arquivo em cada entrada.
- Pode informar com ou sem extensão.
- Se uma associação estiver vazia, o símbolo temporário continua aparecendo.

Publicação:
1. Copie suas pastas assets para esta pasta do projeto.
2. Suba todos os arquivos no GitHub.
3. Confirme que o GitHub preservou maiúsculas/minúsculas dos nomes.
4. Aguarde o deploy e use Ctrl+F5.

O site não depende mais do PalBreed para ícones de Pals ou drops.
