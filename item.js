
(() => {
  "use strict";

  const loadingEl = document.getElementById("item-loading");
  const detailEl = document.getElementById("item-detail");

  function showError(message, error) {
    console.error(message, error || "");
    loadingEl.innerHTML = `<b>Não foi possível carregar as fontes deste item.</b><br><span class="muted">${esc(message)}</span>`;
    loadingEl.hidden = false;
    detailEl.hidden = true;
  }

  try {
    const itemDatabase=window.ITEMS_DATA_ACCURATE||window.ITEMS_DATA;
    if (!itemDatabase) {
      throw new Error("O arquivo items-data.js não foi carregado.");
    }

    const query = new URLSearchParams(location.search).get("id") || "";
    const decodedQuery = decodeURIComponent(query);
    const canonicalQuery=window.ITEM_ID_ALIASES?.[decodedQuery]||window.ITEM_ID_ALIASES?.[query]||decodedQuery;
    const item =
      itemDatabase[canonicalQuery] ||
      itemDatabase[decodedQuery] ||
      itemDatabase[query] ||
      Object.values(itemDatabase).find(
        x => x.name.toLowerCase() === decodedQuery.toLowerCase()
      );

    if (!item) {
      loadingEl.innerHTML = "<b>Item não encontrado.</b> Volte à Enciclopédia de Itens.";
      return;
    }

    const sources = Array.isArray(item.droppedBy)
      ? item.droppedBy.filter(row => row && row.palName)
      : [];

    const quantityText = row => {
      const min = row.min ?? "—";
      const max = row.max;
      return max !== undefined && max !== null && max !== min
        ? `x${min}–${max}`
        : `x${min}`;
    };

    const sourceRow = (row, index) => `
      <article class="item-source-row${index === 0 ? " is-best" : ""}">
        <div class="item-source-rank">${index === 0 ? "★" : index + 1}</div>

        <a class="item-source-pal"
           href="pal.html?pal=${encodeURIComponent(row.palSlug || row.palName)}">
          ${row.palIcon
            ? assetImg(
                ASSETS.palsDirectory,
                row.palIcon,
                row.palName,
                "item-source-pal-image"
              )
            : ""}
          <div>
            <strong>${esc(row.palName)}</strong>
            <span>#${row.palIndex ?? "—"}${row.palSuffix || ""}</span>
          </div>
        </a>

        <div class="item-source-value">
          <span>Quantidade</span>
          <b>${quantityText(row)}</b>
        </div>

        <div class="item-source-value">
          <span>Taxa</span>
          <b>${row.rate !== undefined && row.rate !== null ? `${row.rate}%` : "—"}</b>
        </div>
        ${row.variant?`<div class="item-source-condition"><span>${esc(dropConditionLabel(row))}</span></div>`:""}
      </article>`;

    document.title = `${item.name} | Itens`;
    const best = sources[0];

    detailEl.innerHTML = `
      <div class="item-breadcrumb">
        <a href="itens.html">Todos os itens</a>
        <span>/</span>
        <b>${esc(item.name)}</b>
      </div>

      <section class="item-detail-hero panel">
        <div class="item-detail-icon">
          ${item.icon
            ? assetImg(
                ASSETS.itemsDirectory,
                item.icon,
                item.name,
                "item-detail-image",
                "eager"
              )
            : "◆"}
        </div>

        <div>
          <span class="hero-kicker">ITEM DROPÁVEL</span>
          <h1>${esc(item.name)}</h1>
          <p class="muted">
            ${sources.length.toLocaleString("pt-BR")}
            fonte${sources.length === 1 ? " condicional" : "s condicionais"} registrada${sources.length === 1 ? "" : "s"}.
          </p>

          ${best
            ? `<div class="item-best-source">
                Melhor fonte:
                <a href="pal.html?pal=${encodeURIComponent(best.palSlug || best.palName)}">
                  ${esc(best.palName)}
                </a>
                — ${quantityText(best)} ·
                ${best.rate !== undefined && best.rate !== null ? `${best.rate}%` : "—"}
              </div>`
            : ""}
        </div>
      </section>

      <section class="item-detail-section">
        <div class="section-heading">
          <div>
            <span class="hero-kicker">FONTES</span>
            <h2>Pals que dropam este item</h2>
          </div>
          <p>Separado por variante e nível da tabela de drops.</p>
        </div>

        <div class="item-source-list">
          ${sources.length
            ? sources.map(sourceRow).join("")
            : '<div class="panel"><b>Nenhuma fonte válida foi encontrada na base.</b></div>'}
        </div>
      </section>`;

    loadingEl.hidden = true;
    detailEl.hidden = false;
    activateAssetFallbacks(detailEl);
  } catch (error) {
    showError(error?.message || "Erro inesperado ao montar a página.", error);
  }
})();
